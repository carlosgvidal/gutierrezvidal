function extractActors(raw){
 const registry=new Map(),sentences=splitSentences(raw);
 const sentenceInitialNoise=new Set(["pero","por","dijo","anduvieron","espera","vamos","abriose","entonces","luego","despues","finalmente","cuando","como","aunque","ademas","ahora","aqui","alli","asi"]);
 const conjunctions=new Set(["y","e","o","u"]);

 function cleanCandidate(name){
  name=canonicalActor(name);
  name=name.replace(/^(Pero|Y|E|O|U|Entonces|Luego|Después|Despues|Finalmente|Cuando|Aunque|Además|Ademas)\s+/u,"");
  return canonicalActor(name);
 }
 function isBadCandidate(name,source){
  const plain=stripAccents(name.toLowerCase());
  if(!name||name.length<3||actorFalsePositives.has(name)||/^\d/.test(name))return true;
  if(stop.has(plain)||sentenceInitialNoise.has(plain))return true;
  if(/^(por dios|dios)$/i.test(plain))return true;
  if(source==="mayúsculas"&&name.split(/\s+/).length===1){
   // A capitalized sentence-initial token is not actor evidence by itself.
   return true;
  }
  return false;
 }
 function add(name,sentence,source){
  name=cleanCandidate(name);
  if(isBadCandidate(name,source))return;
  const key=actorKey(name);
  if(!key||key.split(" ").length>6)return;
  const current=registry.get(key)||{name,count:0,score:0,type:actorType(name),contexts:[],sources:new Set()};
  if(name.length>current.name.length)current.name=name;
  current.count++;
  current.score+=sentenceContextScore(sentence,name);
  if(current.contexts.length<4&&!current.contexts.includes(sentence))current.contexts.push(sentence);
  current.sources.add(source);
  registry.set(key,current);
 }

 sentences.forEach(sentence=>{
  // Proper-name sequences. Connectors such as "y" are not absorbed into one actor;
  // each capitalized component is evaluated independently.
  const proper=/\b[A-ZÁÉÍÓÚÑ][\p{L}'’-]+(?:\s+(?:de|del|la|las|los)\s+[A-ZÁÉÍÓÚÑ][\p{L}'’-]+){0,3}/gu;
  let m;
  while((m=proper.exec(sentence))){
   const candidate=m[0];
   const before=sentence.slice(Math.max(0,m.index-3),m.index).toLowerCase();
   add(candidate,sentence,"mayúsculas");
  }

  orgMarkers.forEach(marker=>{
   const re=new RegExp("\\b("+marker+"(?:\\s+(?:de|del|la|las|los|y|e|para|por|en)?\\s*[A-ZÁÉÍÓÚÑ][\\p{L}'’-]+){0,5})","gu");
   let om;while((om=re.exec(sentence)))add(om[1],sentence,"institución");
  });

  const lower=stripAccents(sentence.toLowerCase());
  collectiveActors.forEach(actor=>{
   const a=stripAccents(actor);
   if(new RegExp("\\b"+a.replace(/\s+/g,"\\s+")+"\\b").test(lower)){
    const original=sentence.match(new RegExp("\\b"+actor.replace(/\s+/g,"\\s+")+"\\b","i"));
    add(original?original[0]:actor,sentence,"colectivo");
   }
  });

  const sortedAdjectives=[...roleAdjectives].sort((x,y)=>y.length-x.length).map(stripAccents);
  const nounAlternation=roleNouns.map(n=>{
   const plainN=stripAccents(n);
   return roleNounsNoPlural.has(n)?plainN+"\\b(?!\\w)":plainN+"(?:s|as|es)?";
  }).join("|");
  const roleRe=new RegExp("\\b("+roleDeterminers.join("|")+")\\s+("+nounAlternation+")(?:\\s+de\\s+[a-záéíóúñ]{3,20})?(?:\\s+("+sortedAdjectives.join("|")+")(?:s|as|es)?)?","gi");
  let rm;
  while((rm=roleRe.exec(lower))){
   const nounWord=rm[2],adjWord=rm[3];
   const label=adjWord?(nounWord+" "+adjWord):nounWord;
   add(label,sentence,"rol");
  }
 });

 const roleBareKeys=new Set(roleNouns.map(n=>stripAccents(n.toLowerCase())));
 registry.forEach((entry,key)=>{
  if(!roleBareKeys.has(key))return;
  const variants=[...registry.entries()].filter(([k,v])=>k!==key&&k.startsWith(key+" ")&&v.sources.has("rol"));
  if(variants.length===1){
   const [,vEntry]=variants[0];
   vEntry.count+=entry.count;vEntry.score+=entry.score;
   entry.contexts.forEach(c=>{if(vEntry.contexts.length<4&&!vEntry.contexts.includes(c))vEntry.contexts.push(c);});
   entry.sources.forEach(s=>vEntry.sources.add(s));
   registry.delete(key);
  }
 });

 // Merge a surname/bare-name mention only when there is one unambiguous fuller entity.
 registry.forEach((entry,key)=>{
  if(entry.sources.has("rol")||roleBareKeys.has(key)||key.includes(" "))return;
  const variants=[...registry.entries()].filter(([k,v])=>k!==key&&k.split(" ").length>1&&k.endsWith(" "+key)&&!v.sources.has("rol"));
  if(variants.length===1){
   const [,vEntry]=variants[0];
   vEntry.count+=entry.count;vEntry.score+=entry.score;
   entry.contexts.forEach(c=>{if(vEntry.contexts.length<4&&!vEntry.contexts.includes(c))vEntry.contexts.push(c);});
   entry.sources.forEach(s=>vEntry.sources.add(s));
   registry.delete(key);
  }
 });

 const base=[...registry.values()]
  .filter(a=>a.score>=3||a.count>=2||a.sources.has("institución")||a.sources.has("colectivo")||a.sources.has("rol"))
  .sort((a,b)=>b.score-a.score||b.count-a.count||a.name.localeCompare(b.name,"es"))
  .slice(0,16);
 const provisional=base.map((a,index)=>({...a,index}));
 detectedRelations=extractRelations(raw,provisional);
 const inferred=provisional.map((a,index)=>inferActorVariables({...a,relationProfile:actorRelationProfile(a.name,detectedRelations)},index));
 return inferStrategicPositions(inferred,detectedRelations);
}

function dimensionDensity(text,words){const plain=stripAccents(text.toLowerCase());let c=0;words.forEach(w=>c+=stemMatches(stripAccents(w),plain));return c;}
function inferDiscursiveValence(positive,negative){
 const evidence=positive+negative;
 return evidence?clamp((positive-negative)/evidence,-1,1):0;
}
function inferActorVariables(actor,index){
 const text=actor.contexts.join(" "),plain=stripAccents(text.toLowerCase());
 const positive=posWords.reduce((n,w)=>n+stemMatches(w,plain),0);
 const negative=negWords.reduce((n,w)=>n+stemMatches(w,plain),0);
 const actions=actionWords.reduce((n,w)=>n+stemMatches(w,plain),0);
 const power=powerWords.reduce((n,w)=>n+stemMatches(w,plain),0);
 const rel=actor.relationProfile||{cooperation:0,conflict:0,control:0,communication:0,transformation:0,net:0,outgoing:[],incoming:[]};
 const dims={ser:dimensionDensity(text,lex.ser),estar:dimensionDensity(text,lex.estar),decir:dimensionDensity(text,lex.decir),hacer:dimensionDensity(text,lex.hacer)};
 const dsum=Math.max(1,dims.ser+dims.estar+dims.decir+dims.hacer);
 const v=inferDiscursiveValence(positive,negative);
 const c=clamp((20+actor.count*12+power*10+rel.control*6+rel.outgoing.length*2)/100,.1,1)*100;
 const s=clamp(.35+actor.score*.05+actions*.05+rel.conflict*.04+rel.transformation*.04,.2,1);
 const r=clamp(1+(dims.ser/dsum)*.45+(actor.type==="institución"?.12:0)+rel.conflict*.025-rel.cooperation*.02-actions*.02,.6,2);
 const rho=clamp(1+(negative-positive)*.07+(dims.ser-dims.hacer)/dsum*.25+rel.conflict*.025-rel.cooperation*.02,.5,2);
 const states={
  ser:clamp((dims.ser/dsum)*.7+Math.max(0,negative)*.08+r*.12+rel.conflict*.025),
  estar:clamp((dims.estar/dsum)*.75+power*.06+c/500+rel.control*.03),
  decir:clamp((dims.decir/dsum)*.75+actor.score*.025+Math.abs(v)*.12+rel.communication*.04),
  hacer:clamp((dims.hacer/dsum)*.7+actions*.08+s*.18+rel.transformation*.05+rel.outgoing.length*.015)
 };
 const evidence=actor.score+actor.count+rel.outgoing.length+rel.incoming.length;
 const uncertainty=clamp(1-(evidence/(evidence+10)),.2,1.5);
 return {...actor,x:null,xKnown:false,v:+v.toFixed(2),valenceEvidence:positive+negative,c:Math.round(c),s:+s.toFixed(2),r:+r.toFixed(2),rho:+rho.toFixed(2),uncertainty:+uncertainty.toFixed(2),states,relations:rel};
}

function inferStrategicPositions(actors,relations){
 if(!actors.length)return actors;
 const usable=relations.filter(r=>r.confidence>=.55&&r.sourceIndex!==r.targetIndex);
 const relationWeight=actors.map(()=>0);
 usable.forEach(r=>{relationWeight[r.sourceIndex]+=r.confidence;relationWeight[r.targetIndex]+=r.confidence;});
 if(!usable.length)return actors.map(a=>({...a,x:null,xKnown:false,xConfidence:0,xMethod:"sin evidencia relacional suficiente"}));

 const desiredDistance={cooperacion:8,conflicto:58,control:38,comunicacion:16,transformacion:26,"acción":24};
 const activeIndexes=new Set();
 usable.forEach(r=>{activeIndexes.add(r.sourceIndex);activeIndexes.add(r.targetIndex);});
 const positions=actors.map(()=>50);
 const strongestSeparation=[...usable].filter(r=>r.type==="conflicto"||r.type==="control").sort((a,b)=>b.confidence-a.confidence)[0];
 if(strongestSeparation){
  positions[strongestSeparation.sourceIndex]=24;positions[strongestSeparation.targetIndex]=76;
 }else{
  const strongest=[...usable].sort((a,b)=>b.confidence-a.confidence)[0];
  positions[strongest.sourceIndex]=44;positions[strongest.targetIndex]=56;
 }
 for(let step=0;step<180;step++){
  const grad=actors.map(()=>0),weights=actors.map(()=>0);
  usable.forEach(r=>{
   const i=r.sourceIndex,j=r.targetIndex,w=.4+.6*r.confidence,target=desiredDistance[r.type]??24;
   const diff=positions[j]-positions[i],sign=diff===0?(i<j?1:-1):Math.sign(diff);
   const err=Math.abs(diff)-target,force=err*.018*w;
   grad[i]+=force*sign;grad[j]-=force*sign;weights[i]+=w;weights[j]+=w;
  });
  const active=[...activeIndexes],mean=active.reduce((s,i)=>s+positions[i],0)/Math.max(1,active.length);
  active.forEach(i=>{positions[i]=clamp((positions[i]+grad[i]/Math.max(1,weights[i])-(mean-50)*.015)/100)*100;});
 }
 const active=[...activeIndexes],centeredMean=active.reduce((s,i)=>s+positions[i],0)/Math.max(1,active.length);
 return actors.map((a,i)=>{
  if(!activeIndexes.has(i))return {...a,x:null,xKnown:false,xConfidence:0,xMethod:"actor sin relaciones utilizables"};
  const x=clamp((positions[i]+(50-centeredMean))/100)*100;
  return {...a,x:+x.toFixed(1),xKnown:true,xConfidence:+clamp(relationWeight[i]/3,0,1).toFixed(2),xMethod:"geometría relacional"};
 });
}
