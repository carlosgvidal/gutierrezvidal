"use strict";
(function(global){
const ACCENT=/[\u0300-\u036f]/g;
const strip=s=>String(s||"").normalize("NFD").replace(ACCENT,"").toLowerCase();
const contentStop=new Set([
 "a","al","algo","algun","alguna","algunas","alguno","algunos","ante","antes","asi","aun","aunque",
 "bajo","bien","cada","como","con","contra","cual","cuando","de","del","desde","donde","dos","e","el","ella","ellas","ellos","en","entre","era","eran","es","esa","ese","eso","esta","estaba","estaban","este","esto","fue","ha","han","hasta","hay","la","las","le","les","lo","los","mas","me","mi","mientras","muy","ni","no","nos","o","otra","otro","para","pero","por","porque","que","quien","se","ser","si","sin","sobre","su","sus","tambien","te","tenia","tiene","tienen","todo","tras","tu","un","una","uno","unos","ya",
 "dijo","dijeron","indico","indicaron","aseguro","aseguraron","agrego","agregaron","senalo","senalaron","explico","explicaron","informo","informaron","lamentaron"
]);

const lemmaMap={
 "restricciones":"restriccion","restriccion":"restriccion","regulaciones":"regulacion","regulacion":"regulacion",
 "limites":"limite","limite":"limite","anos":"ano","anfitriones":"anfitrion","autoridades":"autoridad",
 "ninos":"nino","hijos":"hijo","hermanitos":"hermano","migas":"miga","miguitas":"miga",
 "guijarros":"guijarro","guijas":"guijarro","piedrecitas":"piedra","piedras":"piedra",
 "perlas":"perla","joyas":"joya","plataformas":"plataforma","noches":"noche","amparos":"amparo"
};
function lemmaToken(tok){
 const t=strip(tok).replace(/^[^\p{L}\d]+|[^\p{L}\d]+$/gu,"");
 if(!t)return "";
 if(lemmaMap[t])return lemmaMap[t];
 if(t.length>5&&/es$/.test(t)&&!/(antes|entes)$/.test(t))return t.slice(0,-2);
 if(t.length>4&&/s$/.test(t)&&!/(is|us)$/.test(t))return t.slice(0,-1);
 return t;
}
function tokenize(text){
 return (String(text||"").match(/[\p{L}\d%]+(?:['’-][\p{L}\d]+)*/gu)||[]).map((surface,i)=>({surface,index:i,norm:strip(surface),lemma:lemmaToken(surface)}));
}
function splitSentences(text){
 return String(text||"").replace(/\r/g," ").replace(/\n+/g," ")
  .split(/(?<=[.!?;])\s+(?=[A-ZÁÉÍÓÚÑ¿¡“"'])/u).map(s=>s.trim()).filter(Boolean);
}
function splitClauses(sentence){
 return String(sentence||"").split(/(?:\s+[—–-]\s+|;\s*|,\s+(?=(?:pero|aunque|porque|mientras|cuando|si|y|e)\b))/i)
  .map(s=>s.trim()).filter(Boolean);
}

const verbPatterns=[
 ["imponer",/\b(impus\w*|impon\w*|impuesto)\b/],["restringir",/\b(restring\w*|limita\w*)\b/],
 ["regular",/\b(regul\w*|reform\w*|norma\w*)\b/],["establecer",/\b(establec\w*|fij\w*|tope)\b/],
 ["rechazar",/\b(rechaz\w*)\b/],["pedir",/\b(pid\w*|pedimos|solicit\w*|exig\w*)\b/],
 ["exhortar",/\b(exhort\w*)\b/],["impugnar",/\b(impugn\w*|ampar\w*|litig\w*)\b/],
 ["eliminar",/\b(elimin\w*|retir\w*)\b/],["negociar",/\b(negoci\w*|mesa\w* de trabajo|revis\w*)\b/],
 ["argumentar",/\b(argument\w*|justific\w*|sustent\w*|responsab\w*)\b/],["pagar",/\b(pag\w*|cobr\w*|impuesto sobre)\b/],
 ["generar",/\b(gener\w*|aport\w*)\b/],
 ["abandonar",/\b(abandon\w*|dej\w* solos|librar\w* de ellos)\b/],["llevar",/\b(llev\w*)\b/],
 ["orientar",/\b(orient\w*|gui\w*|camino|ruta|guijarr\w*|guij\w*)\b/],
 ["desmigar",/\b(desmig\w*|miga\w*)\b/],["comer",/\b(com\w*|devor\w*)\b/],
 ["capturar",/\b(captur\w*|encerr\w*|agarr\w*|reja|establo|engord\w*)\b/],
 ["amenazar",/\b(amenaz\w*|horno|asar\w*|matar\w*|muerte)\b/],
 ["empujar",/\b(empuj\w*|precipit\w*)\b/],["escapar",/\b(escap\w*|huir\w*|liber\w*)\b/],
 ["encontrar",/\b(encontr\w*|hall\w*)\b/],["tomar",/\b(tom\w*|llen\w*|vaci\w*)\b/],
 ["volver",/\b(volv\w*|regres\w*|retorn\w*)\b/],["vivir",/\b(viv\w*|acabaron las penas)\b/],
 ["persuadir",/\b(persuad\w*|atra\w*|convenc\w*)\b/],["comprar",/\b(compr\w*|adquir\w*)\b/],
 ["coordinar",/\b(coordina\w*|cooper\w*|acuerdo)\b/]
];
function detectVerb(clause){
 const n=strip(clause);
 for(const [lemma,rx] of verbPatterns)if(rx.test(n))return lemma;
 return "";
}
function detectModality(clause){
 const n=strip(clause),out=[];
 if(/\b(quier\w*|dese\w*|pretend\w*|busca\w*|pid\w*|exig\w*)\b/.test(n))out.push("querer");
 if(/\b(pued\w*|podr\w*|capaz|permite\w*|impide\w*)\b/.test(n))out.push("poder");
 if(/\b(sab\w*|conoc\w*|inform\w*|diagnost\w*|sustent\w*)\b/.test(n))out.push("saber");
 if(/\b(debe\w*|deber\w*|obliga\w*|tiene que|tienen que)\b/.test(n))out.push("deber");
 return [...new Set(out)];
}
function detectTemporal(clause){
 const n=strip(clause);
 if(/\b(en 20\d\d|ayer|antes|habia|habian|había|habían|fue|fueron|reformaron|establecio|estableció|haberl\w*)\b/.test(n))return "pasado";
 if(/\b(manana|mañana|sera|será|podra|podrá|iremos|haran|harán)\b/.test(n))return "futuro";
 if(/\b(si|podria|podría|seria|sería|habria|habría)\b/.test(n))return "condicional";
 return "presente/no marcado";
}
function detectActuality(clause){
 const n=strip(clause);
 if(/como voy a .*abandon|cómo voy a .*abandon|como podria .*abandon|cómo podría .*abandon/.test(n))return "rechazo-de-accion";
 if(/\b(remord\w*|por haber\w*|record\w*|se alegro|se alegró)\b/.test(n))return "retrospectivo";
 if(/\b(pretend\w*|intencion|intención|queria|quería|plane\w*)\b/.test(n))return "intencional";
 if(/\b(si|podria|podría|seria|sería)\b/.test(n))return "hipotetico";
 if(/\b(dijo|dijeron|aseguro|aseguró|indicaron|señaló|senalo)\b/.test(n))return "reportado";
 return "afirmado";
}
function isNegated(clause){
 const n=strip(clause);
 return /\b(no|nunca|jamas|jamás|sin)\b/.test(n);
}
function detectEntities(clause,entities){
 const n=strip(clause),out=[];
 (entities||[]).forEach(e=>{
  const aliases=[e.name,...(e.aliases||[])].filter(Boolean);
  if(aliases.some(a=>n.includes(strip(a))))out.push(e.name);
 });
 return [...new Set(out)];
}
function guessSubject(clause,entities){
 const n=strip(clause),mentions=detectEntities(clause,entities);
 if(!mentions.length)return "";
 // Prefer mention before first detected verb surface/root.
 const v=detectVerb(clause);
 const root=v?v.slice(0,Math.max(3,v.length-2)):"";
 if(root){
  const vi=n.indexOf(root);
  const before=mentions.filter(m=>n.indexOf(strip(m))>=0&&n.indexOf(strip(m))<vi);
  if(before.length)return before[0];
 }
 return mentions[0];
}
function guessTarget(clause,subject,entities){
 const n=strip(clause),mentions=detectEntities(clause,entities).filter(x=>x!==subject);
 const prep=/\b(a|contra|hacia|sobre)\s+(el|la|los|las)?\s*/g;
 const m=prep.exec(n);
 if(m){
  const tail=n.slice(m.index+m[0].length);
  const hit=mentions.find(x=>tail.includes(strip(x)));
  if(hit)return hit;
 }
 return mentions[0]||"";
}

function objectSignature(clause){
 const toks=tokenize(clause).map(t=>t.lemma).filter(t=>t&&t.length>2&&!contentStop.has(t));
 const priority=toks.filter(t=>/restric|limite|regul|hosped|oper|amparo|bosque|guijarr|miga|pan|bruja|horno|reja|perla|piedra|casa|padre|retorno|trabaj|impuesto/.test(t));
 return [...new Set((priority.length?priority:toks).slice(0,5))].join("+");
}
function eventFamily(prop,profile){
 const n=strip(prop.text),v=prop.verb;
 if(profile==="regulacion"){
  if(/impuesto sobre|por concepto del impuesto/.test(n)&&/(gener|pag|cobr)/.test(n))return "economic_argument";
  if(["imponer","restringir","regular","establecer"].includes(v)&&/(restric|limite|tope|regul|ley|hosped|50 por ciento)/.test(n))return "regulatory_restriction";
  if(["rechazar","pedir","exhortar","impugnar","eliminar","negociar","argumentar"].includes(v))return "regulatory_challenge";
 }
 if(profile==="narrativa"){
  if(prop.actuality==="retrospectivo"||prop.actuality==="rechazo-de-accion")return "non_event_reference";
  if(/gretel/.test(n)&&/(empuj|precipit|cerr|cerrojo|escap)/.test(n))return "counteraction";
  if(v==="abandonar"||(/bosque/.test(n)&&/dej|llev/.test(n)))return "abandonment";
  if((/guijarr|guija|piedr/.test(n)&&/(camino|ruta|volver|gui)/.test(n)))return "orientation_success";
  if(/pajar|ave/.test(n)&&/(com|devor).*miga/.test(n))return "breadcrumb_failure";
  if(/miga|desmig/.test(n))return "breadcrumb_attempt";
  if((/bruja/.test(n)||/mano seca|establo|reja|engord|horno/.test(n))&&/(encerr|agarr|captur|engord|horno|asar|comer)/.test(n))return "capture";
  if(/perla|piedra preciosa|tesoro/.test(n)&&/(encontr|llen|vaci|tom)/.test(n))return "resource_acquisition";
  if((/volv|regres|retorn|casa del padre|padre/.test(n))&&/(volv|regres|retorn|lleg)/.test(n))return "return";
  if(/felices|acabaron las penas|miseria/.test(n))return "restoration";
 }
 return v||"other";
}
function buildPropositions(raw,options={}){
 const ss=splitSentences(raw),entities=options.entities||[],profile=options.profile||"generico",props=[];
 ss.forEach((sentence,si)=>{
  const clauses=splitClauses(sentence);
  clauses.forEach((clause,ci)=>{
   const verb=detectVerb(clause);
   if(!verb)return;
   const subject=guessSubject(clause,entities);
   const target=guessTarget(clause,subject,entities);
   const prop={id:`p${si+1}.${ci+1}`,sentenceIndex:si,clauseIndex:ci,text:clause,verb,subject,target,mentions:detectEntities(clause,entities),negated:isNegated(clause),modalities:detectModality(clause),temporal:detectTemporal(clause),actuality:detectActuality(clause),objectSignature:objectSignature(clause)};
   prop.family=eventFamily(prop,profile);
   prop.operational=prop.family!=="non_event_reference" && !["retrospectivo","rechazo-de-accion"].includes(prop.actuality) && !(prop.negated&&["abandonment","capture"].includes(prop.family));
   props.push(prop);
  });
 });
 return props;
}
function clusterKey(p){
 const actor=[p.subject,p.target].filter(Boolean).sort().join("~");
 let sig=p.objectSignature;
 if(p.family==="regulatory_restriction")sig="regulatory-limit";
 if(p.family==="regulatory_challenge")sig="regulatory-challenge";
 if(p.family==="economic_argument")sig="economic-legitimacy";
 if(p.family==="abandonment")sig="abandonment";
 if(p.family==="orientation_success")sig="stones-return";
 if(p.family==="breadcrumb_attempt"||p.family==="breadcrumb_failure")sig="breadcrumbs";
 if(p.family==="capture")sig="witch-capture";
 if(p.family==="counteraction")sig="gretel-counteraction";
 if(p.family==="resource_acquisition")sig="treasure";
 if(p.family==="return"||p.family==="restoration")sig="return-restoration";
 return `${p.family}|${actor}|${sig}`;
}
function clusterEvents(propositions,profile){
 const clusters=[];
 propositions.filter(p=>p.operational).forEach(p=>{
  // Narrative breadcrumbs: merge attempt/failure despite family difference.
  const familyKey=(p.family==="breadcrumb_attempt"||p.family==="breadcrumb_failure")?"breadcrumb_sequence":p.family;
  // Regulation: all textual descriptions of the same regulatory limit are evidence for one structural event.
  const key=(profile==="regulacion"&&p.family==="regulatory_restriction")?"regulatory_restriction|main":
            (profile==="narrativa"&&familyKey==="breadcrumb_sequence")?"breadcrumb_sequence|main":
            clusterKey({...p,family:familyKey});
  let c=clusters.find(x=>x.key===key);
  if(!c){c={id:`e${clusters.length+1}`,key,family:familyKey,propositions:[],firstSentence:p.sentenceIndex,lastSentence:p.sentenceIndex,evidenceCount:0};clusters.push(c);}
  c.propositions.push(p);c.lastSentence=Math.max(c.lastSentence,p.sentenceIndex);c.evidenceCount=c.propositions.length;
 });
 // refine breadcrumb outcome
 clusters.forEach(c=>{
  if(c.family==="breadcrumb_sequence"){
   c.family=c.propositions.some(p=>p.family==="breadcrumb_failure")?"orientation_failure":"orientation_attempt";
  }
  c.confidence=c.evidenceCount>=3?"alta":c.evidenceCount===2?"media":"media-baja";
  c.evidence=c.propositions.map(p=>p.text);
 });
 return clusters.sort((a,b)=>a.firstSentence-b.firstSentence);
}
function semanticConcordance(raw,propositions){
 const toks=tokenize(raw),freq={},sentenceSets={};
 const ss=splitSentences(raw);
 ss.forEach((s,si)=>{
  const seen=new Set();
  tokenize(s).forEach(t=>{
   const l=t.lemma;
   if(!l||l.length<3||contentStop.has(l)||/^\d+$/.test(l))return;
   freq[l]=(freq[l]||0)+1;seen.add(l);
  });
  seen.forEach(l=>{(sentenceSets[l]||(sentenceSets[l]=new Set())).add(si);});
 });
 const max=Math.max(1,...Object.values(freq));
 const relationWeight={};
 propositions.forEach(p=>{
  tokenize(p.text).forEach(t=>{if(t.lemma&&!contentStop.has(t.lemma))relationWeight[t.lemma]=(relationWeight[t.lemma]||0)+(p.operational?1:.25);});
 });
 const terms=Object.entries(freq).map(([lemma,count])=>{
  const spread=(sentenceSets[lemma]?.size||0)/Math.max(1,ss.length);
  const related=propositions.filter(p=>tokenize(p.text).some(t=>t.lemma===lemma));
  const actors=[...new Set(related.flatMap(p=>[p.subject,p.target]).filter(Boolean))].slice(0,5);
  const verbs=[...new Set(related.map(p=>p.verb).filter(Boolean))].slice(0,6);
  const rel=Math.min(1,(count/max)*.45+Math.min(1,spread*4)*.25+Math.min(1,(relationWeight[lemma]||0)/4)*.30);
  return {term:lemma,lemma,count,spread:Number(spread.toFixed(3)),relationWeight:Number((relationWeight[lemma]||0).toFixed(2)),relevance:Number(rel.toFixed(3)),actors,verbs};
 }).sort((a,b)=>b.relevance-a.relevance||b.count-a.count);
 return {sentenceCount:ss.length,tokenCount:toks.length,terms:terms.slice(0,24)};
}
function analyze(raw,options={}){
 const props=buildPropositions(raw,options);
 const events=clusterEvents(props,options.profile||"generico");
 const concordance=semanticConcordance(raw,props);
 return {
  version:"semantic-engine-v0.51",
  profile:options.profile||"generico",
  concordance,
  propositions:props,
  eventClusters:events,
  diagnostics:{
   operationalPropositions:props.filter(p=>p.operational).length,
   nonOperationalReferences:props.filter(p=>!p.operational).length,
   clusteredEvents:events.length
  }
 };
}
global.LimesSemantic={strip,tokenize,splitSentences,splitClauses,lemmaToken,buildPropositions,clusterEvents,semanticConcordance,analyze};
})(window);
