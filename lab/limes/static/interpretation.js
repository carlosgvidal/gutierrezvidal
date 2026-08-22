'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.LIMES_INTERPRETATION=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const VERSION='0.1.4';

  const STOP=new Set(['a','al','ante','bajo','cabe','con','contra','de','del','desde','durante','en','entre','hacia','hasta','mediante','para','por','según','sin','sobre','tras','el','la','los','las','un','una','unos','unas','lo','que','se','su','sus','y','e','o','u','pero','como','más','menos','muy','ya','también','no','sí','si','este','esta','estos','estas','ese','esa','esos','esas','aquel','aquella','aquellos','aquellas','mi','mis','tu','tus','nuestro','nuestra','nuestros','nuestras','otro','otra','otros','otras']);

  const VERB_CLASSES={
    SPEECH:['afirm','anunci','argument','asegur','comunic','declar','denunci','describ','explic','inform','manifest','mencion','narr','opin','pregunt','propon','reconoc','respond','señal','sost','expres','indic','agreg','advert','acus'],
    PERFORMATIVE:['autor','orden','prohib','permit','promet','convoc','design','nombr','sancion','regul','exig','solicit'],
    ACTION:['actu','aplic','cambi','cumpl','ejecut','elimin','establec','implement','interven','modific','produc','realiz','reduc','aument','ampli','restring','retir','incorpor','afect','imped','facilit','bloque','proteg','control','transform','contrat','registr','pagar','salir','entrar'],
    STATE:['es','son','era','eran','será','serán','está','están','estaba','estaban','permane','mantien','tiene','tienen','pose','pertenec','depende','dependen','ocupa','ocupan','representa','representan'],
    SUPPORT:['apoy','respald','favorec','defend','cooper','acuerd','acept','aval'],
    OPPOSITION:['rechaz','opon','critic','cuestion','impugn','combat','resist','denunci','acus','bloque','imped'],
    RESTRICTION:['prohib','restring','limit','imped','bloque','sancion','exclu','control'],
    ACCESS:['permit','autor','habilit','inclu','incorpor','admit','acced','entrar','recib'],
    TRANSFER:['dar','entreg','transfer','otorg','conced','pagar','asign','envi','recib'],
    PRESERVE:['mant','conserv','proteg','defend','preserv'],
    INCREASE:['aument','increment','ampli','fortalec','expand','mejor'],
    REDUCE:['reduc','disminu','limit','restring','recort','elimin','retir','quitar'],
    TRANSFORM:['cambi','modific','reform','transform','sustitu','restructur'],
    COMPLIANCE:['cumpl','acat','obedec','respet'],
    LEGITIMIZE:['reconoc','valid','legitim','autor','aprobad','acept'],
    DELEGITIMIZE:['deslegitim','invalid','impugn','cuestion','rechaz']
  };

  const IDENTITY_MARKERS=new Set(['identidad','somos','soy','es','son','representa','representan','define','definen','pertenece','pertenecen']);
  const VALUE_MARKERS=new Set(['valor','valores','principio','principios','misión','memoria','tradición','identidad','derecho','derechos','autonomía','legitimidad']);
  const LOCATIVE_RELATIONAL=new Set(['está','están','permanece','permanecen','depende','dependen','ocupa','ocupan','pertenece','pertenecen','dentro','fuera','entre','ante','bajo']);
  const COST_MARKERS=new Set(['costo','coste','pérdida','sacrificio','riesgo','daño','afectación','afecta','afectada','afectado']);

  function norm(s){return String(s??'').normalize('NFKC').toLowerCase();}
  function toks(s){return (norm(s).match(/[a-záéíóúüñ]+(?:['’-][a-záéíóúüñ]+)?|\d+(?:[.,]\d+)?/gu)||[]);}
  function hasStem(token,stem){return token===stem||token.startsWith(stem);}
  function hitsClass(tokens,cls){const stems=VERB_CLASSES[cls]||[];const out=[];for(const t of tokens){if(stems.some(s=>hasStem(t,s)))out.push(t);}return [...new Set(out)];}
  function predicateClass(token){
    for(const cls of ['PERFORMATIVE','SPEECH','ACTION','STATE']) if((VERB_CLASSES[cls]||[]).some(s=>hasStem(token,s))) return cls;
    for(const cls of ['SUPPORT','OPPOSITION','RESTRICTION','ACCESS','TRANSFER','PRESERVE','INCREASE','REDUCE','TRANSFORM','COMPLIANCE','LEGITIMIZE','DELEGITIMIZE']) if((VERB_CLASSES[cls]||[]).some(s=>hasStem(token,s))) return 'ACTION';
    return null;
  }
  function firstPredicate(tokens){
    for(let i=0;i<tokens.length;i++){const cls=predicateClass(tokens[i]);if(cls)return {index:i,token:tokens[i],class:cls};}
    return null;
  }
  function entityMentionsInClaim(claim,entities){
    const text=norm(claim.text),out=[];
    for(const e of entities){const label=norm(e.label);let idx=text.indexOf(label);if(idx>=0)out.push({entity_id:e.entity_id,label:e.label,index:idx,end:idx+label.length});}
    return out.sort((a,b)=>a.index-b.index);
  }
  function predicateCharIndex(text,predToken){return norm(text).indexOf(predToken);}
  function actorRoles(claim,entities,predicate){
    const ms=entityMentionsInClaim(claim,entities); if(!ms.length)return {source:null,target:null,mentions:ms};
    const pidx=predicate?predicateCharIndex(claim.text,predicate.token):-1;
    let source=null,target=null;
    if(pidx>=0){
      const before=ms.filter(m=>m.index<pidx); const after=ms.filter(m=>m.index>pidx);
      if(before.length)source=before[before.length-1].entity_id;
      if(after.length)target=after[0].entity_id;
    }
    if(!source&&ms.length===1&&pidx>=0&&ms[0].index<pidx)source=ms[0].entity_id;
    if(!source&&pidx>=0&&predicate&&['SPEECH','PERFORMATIVE'].includes(predicate.class)){
      const after=ms.filter(m=>m.index>pidx);
      if(after.length){const between=norm(claim.text.slice(pidx+predicate.token.length,after[0].index));if(!/^\s*a\b/u.test(between.trim())){source=after[0].entity_id;if(target===source)target=null;}}
    }
    return {source,target,mentions:ms};
  }
  function relationFamily(tokens,predClass){
    if(hitsClass(tokens,'OPPOSITION').length)return 'OPPOSITION';
    if(hitsClass(tokens,'SUPPORT').length)return 'SUPPORT';
    if(hitsClass(tokens,'RESTRICTION').length)return 'RESTRICTION';
    if(hitsClass(tokens,'ACCESS').length)return 'ACCESS';
    if(hitsClass(tokens,'TRANSFER').length)return 'TRANSFER';
    if(hitsClass(tokens,'COMPLIANCE').length)return 'COMPLIANCE';
    if(predClass==='SPEECH'||predClass==='PERFORMATIVE')return 'ENUNCIATION';
    if(predClass==='ACTION')return 'ACTION';
    if(predClass==='STATE')return 'STATE';
    return 'UNRESOLVED';
  }
  function goalDirection(tokens){
    for(const [cls,label] of [['PRESERVE','PRESERVE'],['INCREASE','INCREASE'],['REDUCE','REDUCE'],['TRANSFORM','TRANSFORM'],['ACCESS','ENABLE_ACCESS'],['RESTRICTION','RESTRICT'],['TRANSFER','TRANSFER'],['COMPLIANCE','COMPLY']]) if(hitsClass(tokens,cls).length)return label;
    return 'UNRESOLVED';
  }
  function semioticDimension(tokens,predClass){
    if(predClass==='PERFORMATIVE')return ['DECIR','HACER'];
    if(predClass==='SPEECH')return ['DECIR'];
    if(predClass==='ACTION')return ['HACER'];
    if(predClass==='STATE'){
      if(tokens.some(t=>IDENTITY_MARKERS.has(t)||VALUE_MARKERS.has(t)))return ['SER'];
      if(tokens.some(t=>LOCATIVE_RELATIONAL.has(t)))return ['ESTAR'];
      return ['ESTAR'];
    }
    if(tokens.some(t=>VALUE_MARKERS.has(t)))return ['SER'];
    return [];
  }
  function contentTail(claim,predicate,roleInfo){
    if(!predicate)return null;
    const lower=norm(claim.text); const pi=lower.indexOf(predicate.token); if(pi<0)return null;
    let tail=claim.text.slice(pi+predicate.token.length).trim();
    for(const m of (roleInfo.mentions||[]).slice().sort((a,b)=>b.label.length-a.label.length)) tail=tail.replace(new RegExp(m.label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'giu'),' ');
    tail=tail.replace(/[“”"'‘’]/g,' ').replace(/\s+/g,' ').trim();
    if(!tail)return null;
    const raw=toks(tail).filter(t=>!STOP.has(t));
    if(!raw.length)return null;
    const selected=raw.slice(0,8);
    if(selected.every(x=>/^\d/.test(x)))return null;
    return selected.join(' ');
  }
  function buildOperations(base){
    const out=[];
    for(const claim of base.claims){
      const ts=toks(claim.text),pred=firstPredicate(ts); if(!pred)continue;
      const roles=actorRoles(claim,base.entities,pred); const dims=semioticDimension(ts,pred.class); const family=relationFamily(ts,pred.class); const goal=goalDirection(ts); const objectPhrase=contentTail(claim,pred,roles);
      out.push({
        operation_id:`op:${claim.claim_id}`,
        claim_id:claim.claim_id,evidence_id:claim.evidence_id,document_id:claim.document_id,
        predicate:pred.token,predicate_class:pred.class,source_actor_candidate:roles.source,target_actor_candidate:roles.target,
        semiotic_dimensions:dims,relation_family:family,goal_direction:goal,object_phrase:objectPhrase,
        factuality:claim.factuality,negated:claim.negated,status:'INFERRED',method:'COMPOSITIONAL_CLAUSE_RULES'
      });
    }
    return out;
  }
  function buildActors(base,operations){
    const roleMap=new Map();
    for(const op of operations){for(const [role,id] of [['source',op.source_actor_candidate],['target',op.target_actor_candidate]]) if(id){if(!roleMap.has(id))roleMap.set(id,{source:0,target:0,evidence:new Set()});roleMap.get(id)[role]++;roleMap.get(id).evidence.add(op.evidence_id);}}
    return base.entities.filter(e=>roleMap.has(e.entity_id)).map(e=>{const r=roleMap.get(e.entity_id);return {actor_id:e.entity_id,label:e.label,source_operations:r.source,target_operations:r.target,evidence_ids:[...r.evidence],status:'INFERRED',method:'FUNCTIONAL_ROLE_PROMOTION'};});
  }
  function canonicalObjectKey(phrase){return norm(phrase).replace(/\b(los?|las?|un(?:a|os|as)?|de|del|al|para|por|con|en)\b/gu,' ').replace(/\s+/g,' ').trim();}
  function buildObjects(operations){
    const map=new Map();
    for(const op of operations){if(!op.object_phrase||op.goal_direction==='UNRESOLVED')continue;const key=canonicalObjectKey(op.object_phrase);if(!key||key.length<3)continue;if(!map.has(key))map.set(key,{label:op.object_phrase,operations:[],actors:new Set(),evidence:new Set(),goals:new Map()});const o=map.get(key);o.operations.push(op.operation_id);if(op.source_actor_candidate)o.actors.add(op.source_actor_candidate);o.evidence.add(op.evidence_id);if(op.source_actor_candidate){const gk=`${op.source_actor_candidate}\u0000${op.goal_direction}`;o.goals.set(gk,(o.goals.get(gk)||0)+1);}}
    return [...map.entries()].sort((a,b)=>b[1].operations.length-a[1].operations.length||a[0].localeCompare(b[0],'es')).map(([key,o],i)=>({object_id:`obj-${i+1}`,key,label:o.label,operation_ids:o.operations,actor_ids:[...o.actors],evidence_ids:[...o.evidence],goals:[...o.goals.entries()].map(([k,count])=>{const [actor_id,direction]=k.split('\u0000');return {actor_id,direction,count}}),status:'INFERRED',method:'GOAL_DIRECTED_COMPLEMENT_EXTRACTION'}));
  }
  function linkObjects(operations,objects){
    const byKey=new Map(objects.map(o=>[o.key,o.object_id]));
    return operations.map(op=>{const key=op.object_phrase?canonicalObjectKey(op.object_phrase):null;return {...op,object_id:key&&byKey.has(key)?byKey.get(key):null};});
  }
  function buildPrograms(operations,objects){
    const map=new Map();
    for(const op of operations){if(!op.source_actor_candidate||!op.object_id||op.goal_direction==='UNRESOLVED')continue;const key=[op.source_actor_candidate,op.object_id,op.goal_direction].join('\u0000');if(!map.has(key))map.set(key,{actor_id:op.source_actor_candidate,object_id:op.object_id,direction:op.goal_direction,operations:[],evidence:new Set()});const p=map.get(key);p.operations.push(op.operation_id);p.evidence.add(op.evidence_id);}
    const programs=[...map.values()].map((p,i)=>({...p,program_id:`prog-${i+1}`,evidence_ids:[...p.evidence],status:'INFERRED',method:'ACTOR_OBJECT_GOAL_AGGREGATION'}));
    const opposite=new Map([['PRESERVE',new Set(['REDUCE','RESTRICT','TRANSFORM'])],['INCREASE',new Set(['REDUCE','RESTRICT'])],['REDUCE',new Set(['INCREASE','PRESERVE','ENABLE_ACCESS'])],['RESTRICT',new Set(['ENABLE_ACCESS','INCREASE'])],['ENABLE_ACCESS',new Set(['RESTRICT','REDUCE'])]]);
    const counter=[];
    for(let i=0;i<programs.length;i++)for(let j=i+1;j<programs.length;j++){const a=programs[i],b=programs[j];if(a.object_id!==b.object_id||a.actor_id===b.actor_id)continue;if((opposite.get(a.direction)||new Set()).has(b.direction)||(opposite.get(b.direction)||new Set()).has(a.direction))counter.push({counterprogram_id:`cp-${counter.length+1}`,program_a:a.program_id,program_b:b.program_id,object_id:a.object_id,status:'INFERRED',method:'GOAL_INCOMPATIBILITY'});}
    return {programs,counterprograms:counter};
  }
  function supportLevel(n){return n<=0?'E0':n===1?'E1':n===2?'E2':n===3?'E3':'E4';}
  function buildProfiles(actors,operations){
    return actors.map(a=>{
      const prof={SER:[],ESTAR:[],DECIR:[],HACER:[]};
      for(const op of operations){if(op.source_actor_candidate!==a.actor_id)continue;for(const d of op.semiotic_dimensions||[]) if(prof[d])prof[d].push(op.evidence_id);}
      const dimensions={};for(const d of ['SER','ESTAR','DECIR','HACER']){const ev=[...new Set(prof[d])];dimensions[d]={support:supportLevel(ev.length),evidence_count:ev.length,evidence_ids:ev,status:ev.length?'INFERRED':'UNRESOLVED'};}
      return {actor_id:a.actor_id,dimensions,status:'INFERRED',method:'STRUCTURAL_SEMIOTIC_ROLE_AGGREGATION'};
    });
  }
  function buildRelations(operations){
    const map=new Map();
    for(const op of operations){if(!op.source_actor_candidate||!op.target_actor_candidate||op.source_actor_candidate===op.target_actor_candidate)continue;const key=[op.source_actor_candidate,op.target_actor_candidate,op.object_id||'',op.relation_family].join('\u0000');if(!map.has(key))map.set(key,{source_actor_id:op.source_actor_candidate,target_actor_id:op.target_actor_candidate,object_id:op.object_id||null,type:op.relation_family,operations:[],evidence:new Set(),realized:0,nonrealized:0});const r=map.get(key);r.operations.push(op.operation_id);r.evidence.add(op.evidence_id);if(op.factuality==='REALIZED'||op.factuality==='ATTRIBUTED')r.realized++;else r.nonrealized++;}
    return [...map.values()].map((r,i)=>({...r,relation_id:`rel-${i+1}`,evidence_ids:[...r.evidence],status:'INFERRED',method:'DIRECTED_OPERATION_AGGREGATION'}));
  }
  function buildBoundaries(relations,operations){
    const pairMap=new Map();
    for(const r of relations){const pair=[r.source_actor_id,r.target_actor_id].sort();const key=[pair[0],pair[1],r.object_id||''].join('\u0000');if(!pairMap.has(key))pairMap.set(key,{a:pair[0],b:pair[1],object_id:r.object_id||null,relations:[],evidence:new Set()});const x=pairMap.get(key);x.relations.push(r);r.evidence_ids.forEach(e=>x.evidence.add(e));}
    const out=[];
    for(const p of pairMap.values()){
      const rels=p.relations;const ab=rels.filter(r=>r.source_actor_id===p.a).reduce((s,r)=>s+r.operations.length,0),ba=rels.filter(r=>r.source_actor_id===p.b).reduce((s,r)=>s+r.operations.length,0),total=ab+ba;if(total<2)continue;
      const opposition=rels.filter(r=>['OPPOSITION','RESTRICTION'].includes(r.type)).reduce((s,r)=>s+r.operations.length,0);
      const access=rels.filter(r=>['ACCESS','TRANSFER','SUPPORT','COMPLIANCE','ENUNCIATION'].includes(r.type)).reduce((s,r)=>s+r.operations.length,0);
      const asym=total?(ab-ba)/total:null;
      const resistanceRatio=total?opposition/total:0,permeabilityRatio=total?access/total:0;
      const ord=x=>x===0?'0':x<.25?'1':x<.5?'2':x<.75?'3':'4';
      const opIds=new Set(rels.flatMap(r=>r.operations));const pairOps=operations.filter(o=>opIds.has(o.operation_id));
      const legit=pairOps.some(o=>hitsClass(toks(o.predicate+' '+(o.object_phrase||'')),'LEGITIMIZE').length);
      const delegit=pairOps.some(o=>hitsClass(toks(o.predicate+' '+(o.object_phrase||'')),'DELEGITIMIZE').length);
      const cost=pairOps.some(o=>toks((o.object_phrase||'')).some(t=>COST_MARKERS.has(t)));
      out.push({boundary_id:`b-${out.length+1}`,actor_a:p.a,actor_b:p.b,object_id:p.object_id,observables:{operations_total:total,direction_a_to_b:ab,direction_b_to_a:ba,relational_asymmetry:asym,opposition_ratio:resistanceRatio,exchange_ratio:permeabilityRatio},interpretation:{resistance:`R${ord(resistanceRatio)}`,permeability:`P${ord(permeabilityRatio)}`,asymmetry:asym==null?'UNRESOLVED':Math.abs(asym)<.2?'LOW':Math.abs(asym)<.5?'MEDIUM':'HIGH',legitimacy:legit&&delegit?'CONTESTED':legit?'SUPPORTED':delegit?'CHALLENGED':'UNRESOLVED',cost:cost?'EVIDENCED':'UNRESOLVED'},evidence_ids:[...p.evidence],status:'INFERRED',method:'RELATIONAL_BOUNDARY_RULES'});
    }
    return out;
  }
  function buildTransformations(operations){
    return operations.filter(o=>o.source_actor_candidate&&o.goal_direction!=='UNRESOLVED'&&o.object_id).map((o,i)=>({transformation_id:`tr-${i+1}`,source_actor_id:o.source_actor_candidate,target_actor_id:o.target_actor_candidate||null,object_id:o.object_id,direction:o.goal_direction,semiotic_dimensions:o.semiotic_dimensions,factuality:o.factuality,evidence_id:o.evidence_id,status:o.factuality==='REALIZED'?'OBSERVED_OPERATION':'INFERRED_OR_NONREALIZED',method:'GOAL_DIRECTED_OPERATION'}));
  }
  function label(id,actors,objects){const a=actors.find(x=>x.actor_id===id);if(a)return a.label;const o=objects.find(x=>x.object_id===id);return o?o.label:id||'sin resolver';}
  function report(base,actors,objects,profiles,relations,programs,counterprograms,boundaries,transformations){
    const lines=[];
    lines.push(`El corpus contiene ${base.documents.length} documento(s), ${base.claims.length} unidad(es) proposicional(es) y ${actors.length} actor(es) funcional(es) inferido(s).`);
    if(objects.length)lines.push(`Se identificaron ${objects.length} objeto(s) de valor candidato(s) a partir de complementos vinculados con operaciones orientadas a objetivo.`);else lines.push('No se resolvieron objetos de valor con las reglas estructurales disponibles.');
    if(relations.length)lines.push(`La estructura relacional contiene ${relations.length} relación(es) dirigida(s) sustentada(s) por operaciones con fuente y destino identificables.`);else lines.push('No se resolvieron relaciones dirigidas con fuente y destino suficientemente identificables.');
    const actorParagraphs=profiles.map(p=>{const a=label(p.actor_id,actors,objects);const ds=['SER','ESTAR','DECIR','HACER'].filter(d=>p.dimensions[d].evidence_count>0).map(d=>`${d}: ${p.dimensions[d].support}`);return ds.length?`${a} presenta evidencia estructural en ${ds.join(', ')}.`:`${a} no presenta evidencia estructural suficiente para un perfil S/E/D/H resuelto.`;});
    lines.push(...actorParagraphs);
    if(programs.length)lines.push(`Se reconstruyeron ${programs.length} programa(s) actor–objeto–objetivo.`);
    if(counterprograms.length)lines.push(`Se detectaron ${counterprograms.length} incompatibilidad(es) entre programas sobre un mismo objeto.`);
    if(boundaries.length)lines.push(`Se infirieron ${boundaries.length} frontera(s) relacional(es) porque existe interacción repetida entre actores alrededor de un objeto o relación compartida.`);else lines.push('No se infirieron fronteras: las condiciones relacionales mínimas no se cumplieron.');
    const realized=transformations.filter(t=>t.status==='OBSERVED_OPERATION').length;
    if(transformations.length)lines.push(`Se registraron ${transformations.length} operación(es) orientada(s) a transformación; ${realized} aparecen como realizadas según la factualidad disponible.`);
    lines.push('El reporte distingue operaciones observadas de interpretaciones inferidas y no convierte ausencia de evidencia en valor cero.');
    return {summary:lines[0],paragraphs:lines,method:'STRUCTURAL_INTERPRETIVE_REPORT',status:'INFERRED'};
  }
  function interpret(base){
    if(!base||!Array.isArray(base.claims)||!Array.isArray(base.entities))throw new Error('El análisis base no contiene claims y entidades requeridos por el intérprete.');
    const rawOps=buildOperations(base);const actors=buildActors(base,rawOps);const objects=buildObjects(rawOps);const operations=linkObjects(rawOps,objects);const pp=buildPrograms(operations,objects);const profiles=buildProfiles(actors,operations);const relations=buildRelations(operations);const boundaries=buildBoundaries(relations,operations);const transformations=buildTransformations(operations);const rep=report(base,actors,objects,profiles,relations,pp.programs,pp.counterprograms,boundaries,transformations);
    return {version:VERSION,actors,operations,objects_of_value:objects,programs:pp.programs,counterprograms:pp.counterprograms,semantic_profiles:profiles,relations,boundaries,transformations,report:rep,audit:{methods:['COMPOSITIONAL_CLAUSE_RULES','FUNCTIONAL_ROLE_PROMOTION','GOAL_DIRECTED_COMPLEMENT_EXTRACTION','ACTOR_OBJECT_GOAL_AGGREGATION','STRUCTURAL_SEMIOTIC_ROLE_AGGREGATION','DIRECTED_OPERATION_AGGREGATION','RELATIONAL_BOUNDARY_RULES','GOAL_DIRECTED_OPERATION','STRUCTURAL_INTERPRETIVE_REPORT'],automatic_examples:0,fixtures:0,preloaded_cases:0}};
  }
  return {VERSION,interpret};
});
