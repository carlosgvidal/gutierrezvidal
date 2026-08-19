function extractActors(raw){
 const registry=new Map(),sentences=splitSentences(raw);
 function add(name,sentence,source){name=canonicalActor(name);if(!name||name.length<3||actorFalsePositives.has(name)||/^\d/.test(name))return;const key=actorKey(name);if(!key||stop.has(key)||key.split(" ").length>6)return;const current=registry.get(key)||{name,count:0,score:0,type:actorType(name),contexts:[],sources:new Set()};if(name.length>current.name.length)current.name=name;current.count++;current.score+=sentenceContextScore(sentence,name);if(current.contexts.length<4)current.contexts.push(sentence);current.sources.add(source);registry.set(key,current);}
 sentences.forEach(sentence=>{const capitals=/\b(?:[A-ZÁÉÍÓÚÑ][\p{L}'’-]+|[A-ZÁÉÍÓÚÑ]{2,})(?:\s+(?:de|del|la|las|los|y|e|para|por|en)?\s*(?:[A-ZÁÉÍÓÚÑ][\p{L}'’-]+|[A-ZÁÉÍÓÚÑ]{2,})){0,5}/gu;let m;while((m=capitals.exec(sentence)))add(m[0],sentence,"mayúsculas");orgMarkers.forEach(marker=>{const re=new RegExp("\\b("+marker+"(?:\\s+(?:de|del|la|las|los|y|e|para|por|en)?\\s*[A-ZÁÉÍÓÚÑ][\\p{L}'’-]+){0,5})","gu");let om;while((om=re.exec(sentence)))add(om[1],sentence,"institución");});const lower=stripAccents(sentence.toLowerCase());collectiveActors.forEach(actor=>{const a=stripAccents(actor);if(new RegExp("\\b"+a.replace(/\s+/g,"\\s+")+"\\b").test(lower)){const original=sentence.match(new RegExp("\\b"+actor.replace(/\s+/g,"\\s+")+"\\b","i"));add(original?original[0]:actor,sentence,"colectivo");}});
  const sortedAdjectives=[...roleAdjectives].sort((x,y)=>y.length-x.length).map(stripAccents);
  const nounAlternation=roleNouns.map(n=>{
   const plainN=stripAccents(n);
   return roleNounsNoPlural.has(n)?plainN+"\\b(?!\\w)":plainN+"(?:s|as|es)?";
  }).join("|");
  const roleRe=new RegExp("\\b("+roleDeterminers.join("|")+")\\s+("+nounAlternation+")(?:\\s+de\\s+[a-záéíóúñ]{3,20})?(?:\\s+("+sortedAdjectives.join("|")+")(?:s|as|es)?)?","gi");
  let rm;
  while((rm=roleRe.exec(lower))){
   const detWord=rm[1],nounWord=rm[2],adjWord=rm[3];
   const original=sentence.slice(rm.index,rm.index+rm[0].length);
   const label=adjWord?(nounWord+" "+adjWord):nounWord;
   add(label,sentence,"rol");
  }
 });
 const roleBareKeys=new Set(roleNouns.map(n=>stripAccents(n.toLowerCase())));
 registry.forEach((entry,key)=>{
  if(!roleBareKeys.has(key))return;
  const variants=[...registry.entries()].filter(([k,v])=>k!==key&&k.startsWith(key+" ")&&v.sources.has("rol"));
  if(variants.length===1){
   const [vKey,vEntry]=variants[0];
   vEntry.count+=entry.count;
   vEntry.score+=entry.score;
   entry.contexts.forEach(c=>{if(vEntry.contexts.length<4&&!vEntry.contexts.includes(c))vEntry.contexts.push(c);});
   entry.sources.forEach(s=>vEntry.sources.add(s));
   registry.delete(key);
  }
 });
 registry.forEach((entry,key)=>{
  if(entry.sources.has("rol")||roleBareKeys.has(key))return;
  if(key.includes(" "))return;
  if(key.split(" ").length>1)return;
  const fullNameVariants=[...registry.entries()].filter(([k,v])=>k!==key&&k.split(" ").length>1&&k.endsWith(" "+key)&&!v.sources.has("rol"));
  if(fullNameVariants.length===1){
   const [vKey,vEntry]=fullNameVariants[0];
   vEntry.count+=entry.count;
   vEntry.score+=entry.score;
   entry.contexts.forEach(c=>{if(vEntry.contexts.length<4&&!vEntry.contexts.includes(c))vEntry.contexts.push(c);});
   entry.sources.forEach(s=>vEntry.sources.add(s));
   registry.delete(key);
  }
 });
 const base=[...registry.values()]
  .filter(a=>a.score>=3||a.count>=2||a.sources.has("institución")||a.sources.has("colectivo")||a.sources.has("rol"))
  .sort((a,b)=>b.score-a.score||b.count-a.count||a.name.localeCompare(b.name,"es"))
  .slice(0,12);
 const provisional=base.map((a,index)=>({...a,index}));
 detectedRelations=extractRelations(raw,provisional);
 return provisional.map((a,index)=>inferActorVariables({...a,relationProfile:actorRelationProfile(a.name,detectedRelations)},index));
}

function dimensionDensity(text,words){const plain=stripAccents(text.toLowerCase());let c=0;words.forEach(w=>c+=stemMatches(stripAccents(w),plain));return c;}
function inferActorVariables(actor,index){
 const text=actor.contexts.join(" "),plain=stripAccents(text.toLowerCase());
 const positive=posWords.reduce((n,w)=>n+stemMatches(w,plain),0);
 const negative=negWords.reduce((n,w)=>n+stemMatches(w,plain),0);
 const actions=actionWords.reduce((n,w)=>n+stemMatches(w,plain),0);
 const power=powerWords.reduce((n,w)=>n+stemMatches(w,plain),0);
 const rel=actor.relationProfile||{cooperation:0,conflict:0,control:0,communication:0,transformation:0,net:0,outgoing:[],incoming:[]};
 const dims={ser:dimensionDensity(text,lex.ser),estar:dimensionDensity(text,lex.estar),decir:dimensionDensity(text,lex.decir),hacer:dimensionDensity(text,lex.hacer)};
 const dsum=Math.max(1,dims.ser+dims.estar+dims.decir+dims.hacer);
 const polarity=positive-negative+rel.net;
 const x=clamp((50+polarity*7)/100)*100;
 const c=clamp((20+actor.count*12+power*10+rel.control*6+rel.outgoing.length*2)/100,.1,1)*100;
 const s=clamp(.35+actor.score*.05+actions*.05+rel.conflict*.04+rel.transformation*.04,.2,1);
 const r=clamp(1+(dims.ser/dsum)*.45+(actor.type==="institución"?.12:0)+rel.conflict*.025-rel.cooperation*.02-actions*.02,.6,2);
 const rho=clamp(1+(negative-positive)*.07+(dims.ser-dims.hacer)/dsum*.25+rel.conflict*.025-rel.cooperation*.02,.5,2);
 const states={
  ser:clamp((dims.ser/dsum)*.7+Math.max(0,negative)*.08+r*.12+rel.conflict*.025),
  estar:clamp((dims.estar/dsum)*.75+power*.06+c/500+rel.control*.03),
  decir:clamp((dims.decir/dsum)*.75+actor.score*.025+Math.abs(polarity)*.04+rel.communication*.04),
  hacer:clamp((dims.hacer/dsum)*.7+actions*.08+s*.18+rel.transformation*.05+rel.outgoing.length*.015)
 };
 const evidence=actor.score+actor.count+rel.outgoing.length+rel.incoming.length;
 const uncertainty=clamp(1-(evidence/(evidence+10)),.2,1.5);
 return {...actor,x:Math.round(x),c:Math.round(c),s:+s.toFixed(2),r:+r.toFixed(2),rho:+rho.toFixed(2),uncertainty:+uncertainty.toFixed(2),states,relations:rel};
}
