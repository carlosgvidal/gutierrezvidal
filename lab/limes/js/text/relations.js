function escapeRegExp(s){return s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}
function relationVerbType(verb){
 const plain=stripAccents(verb.toLowerCase());
 for(const [type,verbs] of Object.entries(relationVerbs)){
  if(verbs.some(v=>plain===stripAccents(v)))return type;
 }
 return "acción";
}
function relationPolarity(type,negated){
 let value=type==="cooperacion"?1:type==="conflicto"?-1:type==="control"?-.35:type==="transformacion"?.2:0;
 return negated?-value:value;
}
function sentenceActorMentions(sentence,actors){
 const mentions=[];
 const plainSentence=stripAccents(sentence.toLowerCase());
 const roleBareKeys=roleNouns.map(n=>stripAccents(n.toLowerCase()));
 actors.forEach((actor,index)=>{
  const key=actorKey(actor.name);
  if(!key)return;
  const re=new RegExp("\\b"+escapeRegExp(key).replace(/\s+/g,"\\s+")+"\\b","i");
  let match=re.exec(plainSentence);
  if(!match){
   const bareRole=roleBareKeys.find(r=>key.startsWith(r+" "));
   if(bareRole){
    const siblingCount=actors.filter(other=>actorKey(other.name).startsWith(bareRole+" ")).length;
    if(siblingCount===1){
     const bareRe=new RegExp("\\b"+escapeRegExp(bareRole)+"\\b","i");
     match=bareRe.exec(plainSentence);
    }
   }
  }
  if(match)mentions.push({index,name:actor.name,start:match.index,end:match.index+match[0].length});
 });
 return mentions.sort((a,b)=>a.start-b.start);
}
function extractRelations(raw,actors){
 const relations=[];
 const sentences=splitSentences(raw);
 const infinitives=[...new Set(Object.values(relationVerbs).flat())];
 const formToInfinitive=new Map();
 infinitives.forEach(inf=>{
  lexicalForms(inf).forEach(form=>{
   const plainForm=stripAccents(form.toLowerCase());
   if(!formToInfinitive.has(plainForm)||formToInfinitive.get(plainForm).length<inf.length)formToInfinitive.set(plainForm,inf);
  });
 });
 const allForms=[...formToInfinitive.keys()].sort((a,b)=>b.length-a.length);
 sentences.forEach((sentence,sentenceIndex)=>{
  const plain=stripAccents(sentence.toLowerCase());
  const mentions=sentenceActorMentions(sentence,actors);
  if(mentions.length<2)return;
  allForms.forEach(form=>{
   const vre=new RegExp("\\b"+escapeRegExp(form)+"\\b","g");
   let vm;
   while((vm=vre.exec(plain))){
    const before=mentions.filter(m=>m.end<=vm.index).sort((a,b)=>b.end-a.end)[0];
    const after=mentions.filter(m=>m.start>=vm.index+vm[0].length).sort((a,b)=>a.start-b.start)[0];
    if(!before||!after||before.index===after.index)continue;
    const negWindow=plain.slice(Math.max(0,vm.index-18),vm.index);
    const negated=negationWords.some(w=>new RegExp("\\b"+escapeRegExp(stripAccents(w))+"\\b").test(negWindow));
    const infinitive=formToInfinitive.get(form)||form;
    const type=relationVerbType(infinitive);
    const polarity=relationPolarity(type,negated);
    const confidence=clamp(.55+
      (after.start-(vm.index+vm[0].length)<35?.15:0)+
      (vm.index-before.end<35?.15:0)+
      (mentions.length===2?.1:0),.35,1);
    relations.push({
     source:before.name,
     target:after.name,
     sourceIndex:before.index,
     targetIndex:after.index,
     verb:vm[0],
     type,
     negated,
     polarity,
     confidence,
     sentence,
     sentenceIndex
    });
   }
  });
 });
 const dedup=new Map();
 relations.forEach(r=>{
  const key=[r.source,r.target,r.verb,r.sentenceIndex].join("|");
  if(!dedup.has(key)||dedup.get(key).confidence<r.confidence)dedup.set(key,r);
 });
 return [...dedup.values()].sort((a,b)=>b.confidence-a.confidence||a.sentenceIndex-b.sentenceIndex).slice(0,40);
}
function actorRelationProfile(actorName,relations){
 const outgoing=relations.filter(r=>r.source===actorName);
 const incoming=relations.filter(r=>r.target===actorName);
 const cooperation=outgoing.filter(r=>r.type==="cooperacion").length+incoming.filter(r=>r.type==="cooperacion").length;
 const conflict=outgoing.filter(r=>r.type==="conflicto").length+incoming.filter(r=>r.type==="conflicto").length;
 const control=outgoing.filter(r=>r.type==="control").length;
 const communication=outgoing.filter(r=>r.type==="comunicacion").length;
 const transformation=outgoing.filter(r=>r.type==="transformacion").length;
 const net=outgoing.reduce((s,r)=>s+r.polarity*r.confidence,0)-incoming.reduce((s,r)=>s+r.polarity*r.confidence*.35,0);
 return {outgoing,incoming,cooperation,conflict,control,communication,transformation,net};
}
