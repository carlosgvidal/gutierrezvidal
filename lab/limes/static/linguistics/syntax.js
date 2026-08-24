function bucket(d){d=Math.abs(d);return d<=1?'1':d<=2?'2':d<=4?'4':d<=7?'7':d<=12?'12':'13+';}
function logp(n,total,k=80){return Math.log((n+0.15)/(total+0.15*k));}
function arcScore(dep,head,resources){
  const arr=resources.dependencies.head[dep.upos]||[];const total=arr.reduce((s,x)=>s+x[1],0);if(!total)return -30;
  const di=head.index<dep.index?'L':'R';const key=`${head.upos}|${di}|${bucket(head.index-dep.index)}`;const map=new Map(arr);return logp(map.get(key)||0,total)-0.018*Math.abs(head.index-dep.index);
}
function rootScore(dep,resources){const r=resources.dependencies.root;const total=Object.values(r).reduce((a,b)=>a+b,0);return Math.log(((r[dep.upos]||0)+0.1)/(total+2))-2.2;}
function relationFor(dep,head,resources){
  if(head===null)return {relation:'root',distribution:[['root',1]],dominant:true};
  const di=head.index<dep.index?'L':'R';const arr=resources.dependencies.relations[`${dep.upos}|${head.upos}|${di}`]||[];if(!arr.length)return {relation:'dep',distribution:[],dominant:false};
  const total=arr.reduce((s,x)=>s+x[1],0), top=arr[0];
  return {relation:top[0],distribution:arr.slice(0,5).map(([r,n])=>[r,n/total,n]),dominant:top[1]>(total-top[1])};
}
function findCycle(heads){
  const n=heads.length;for(let i=0;i<n;i++){let cur=i;const seen=new Map();while(cur!==-1&&cur!==null){if(seen.has(cur)){const cycle=[];let x=cur;do{cycle.push(x);x=heads[x];}while(x!==cur&&x!==-1&&x!==null);return cycle;}seen.set(cur,true);cur=heads[cur];}}
  return null;
}
export function parseDependencies(tokens,resources){
  const candidates=tokens.map((dep)=>{
    const c=[{head:-1,score:rootScore(dep,resources)}];
    for(const head of tokens){if(head.index===dep.index)continue;c.push({head:head.index,score:arcScore(dep,head,resources)});}
    c.sort((a,b)=>b.score-a.score);return c.slice(0,5);
  });
  const heads=candidates.map(c=>c[0]?.head??-1);
  let guard=0,cycle;
  while((cycle=findCycle(heads))&&guard++<tokens.length){
    let best=null;
    for(const depIndex of cycle){const alt=candidates[depIndex].find(x=>x.head===-1||!cycle.includes(x.head));if(!alt)continue;const loss=(candidates[depIndex][0]?.score??-99)-alt.score;if(!best||loss<best.loss)best={depIndex,alt,loss};}
    if(!best)break;heads[best.depIndex]=best.alt.head;
  }
  const roots=heads.map((h,i)=>h===-1?i:-1).filter(i=>i>=0);
  if(roots.length!==1){
    let root=tokens.map((t,i)=>[rootScore(t,resources),i]).sort((a,b)=>b[0]-a[0])[0]?.[1]??0;heads[root]=-1;
    for(const r of roots)if(r!==root){const alt=candidates[r].find(x=>x.head!==-1&&x.head!==r);if(alt)heads[r]=alt.head;}
  }
  return tokens.map((dep,i)=>{
    const headIndex=heads[i];const head=headIndex<0?null:tokens[headIndex];const rel=relationFor(dep,head,resources);
    const chosen=candidates[i].find(x=>x.head===headIndex)||candidates[i][0];const alt=candidates[i].find(x=>x.head!==headIndex);
    const likelihoodRatio=alt?Math.exp(Math.min(20,chosen.score-alt.score)):Infinity;
    const relationShare=rel.distribution?.[0]?.[1]??(rel.relation==='root'?1:0);
    return {...dep,head_index:headIndex,deprel:rel.relation,deprel_distribution:rel.distribution,relation_dominant:rel.dominant,relation_share:relationShare,head_likelihood_ratio:likelihoodRatio,syntax_status:(likelihoodRatio>=8&&relationShare>=0.8)?'RESOLVED':'CANDIDATE'};
  });
}
