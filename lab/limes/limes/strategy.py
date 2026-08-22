from __future__ import annotations
from itertools import combinations, product
from math import sqrt
from .models import StrategicModelInput,StrategicModelResult,StrategicActorResult,PairResult,GameInput,GameResult,NashProfile


def spatial_utility(position:float,outcome:float,alpha:float)->float:
    d=abs(position-outcome)/100.0
    return 1.0-2.0*(d**alpha)

def coalition_dominance_index(i,j,actors)->float|None:
    pos_i=i.position; pos_j=j.position
    num=0.0; den=0.0
    for k in actors:
        alpha=k.alpha if k.alpha is not None else 1.0
        du=spatial_utility(k.position,pos_i,alpha)-spatial_utility(k.position,pos_j,alpha)
        weight=k.capacity*k.salience
        if du>0: num+=weight*du
        den+=weight*abs(du)
    return None if den==0 else num/den

def strategic_center(actors)->float|None:
    den=sum(a.capacity*a.salience for a in actors)
    return None if den==0 else sum(a.position*a.capacity*a.salience for a in actors)/den

def concentration_score(actors,center)->float|None:
    if center is None or not actors: return None
    total=sum(a.capacity for a in actors)
    if total<=0: return None
    var=sum(((a.position-center)**2)*(a.capacity/total) for a in actors)
    return max(0.0,min(100.0,(1.0-sqrt(var)/50.0)*100.0))

def run_strategy(inp:StrategicModelInput)->StrategicModelResult:
    total=sum(a.capacity for a in inp.actors)
    warnings=[]
    if total<=0: return StrategicModelResult(axis_label=inp.axis_label,actors=[],system_center=None,concentration=None,pairs=[],warnings=['La capacidad total debe ser positiva.'])
    actor_results=[StrategicActorResult(actor_id=a.actor_id,normalized_capacity=a.capacity/total,mobilized_capacity=a.capacity*a.salience) for a in inp.actors]
    center=strategic_center(inp.actors); concentration=concentration_score(inp.actors,center)
    pairs=[]
    for i,j in combinations(inp.actors,2):
        wi=i.capacity*i.salience; wj=j.capacity*j.salience
        pc=None if wi+wj==0 else (i.position*wi+j.position*wj)/(wi+wj)
        pairs.append(PairResult(actor_i=i.actor_id,actor_j=j.actor_id,distance=abs(i.position-j.position)/100.0,dominance_index_i_over_j=coalition_dominance_index(i,j,inp.actors),strategic_center=pc))
    if any(a.alpha is None for a in inp.actors): warnings.append('La curvatura de preferencia no fue especificada para todos los actores; el índice de dominancia utiliza curvatura lineal como supuesto computacional explícito.')
    return StrategicModelResult(axis_label=inp.axis_label,actors=actor_results,system_center=center,concentration=concentration,pairs=pairs,warnings=warnings)

def pure_nash(game:GameInput)->GameResult:
    players=game.players
    if set(players)!=set(game.actions): return GameResult(equilibria=[],valid=False,warnings=['La estructura de acciones no coincide con el conjunto de jugadores.'])
    action_lists=[game.actions[p] for p in players]
    if any(not x for x in action_lists): return GameResult(equilibria=[],valid=False,warnings=['Cada jugador debe tener al menos una acción.'])
    equilibria=[]; warnings=[]
    def key(profile): return '|'.join(profile[p] for p in players)
    for combo in product(*action_lists):
        prof=dict(zip(players,combo)); k=key(prof)
        if k not in game.payoffs: continue
        pay=game.payoffs[k]
        if any(p not in pay for p in players): continue
        stable=True
        for p in players:
            current=pay[p]
            for alt in game.actions[p]:
                if alt==prof[p]: continue
                q=dict(prof); q[p]=alt; qk=key(q)
                if qk not in game.payoffs or p not in game.payoffs[qk]:
                    stable=False; warnings.append('La matriz de pagos está incompleta.'); break
                if game.payoffs[qk][p]>current: stable=False; break
            if not stable: break
        if stable: equilibria.append(NashProfile(profile=prof,payoffs={p:float(pay[p]) for p in players}))
    return GameResult(equilibria=equilibria,valid=True,warnings=sorted(set(warnings)))
