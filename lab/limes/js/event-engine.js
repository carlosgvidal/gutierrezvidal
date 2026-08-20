"use strict";
(function(global){
const ns=global.Limes52=global.Limes52||{};
function domainFrom(frames,entities,raw){const n=ns.Spanish.strip(raw),has=e=>frames.some(f=>f.sense===e||f.predicate===e);
 if(/\b(fgr|fiscalia|fiscalía|juez|detencion|detención|aprehension|aprehensión|homicidio|encubrimiento|falsedad de declaraciones|investigacion|investigación)\b/.test(n)||has("LEGAL_DETENTION")||has("ATTRIBUTED_ALLEGATION"))return {id:"investigacion",label:"investigación / esclarecimiento judicial",score:0.92};
 if(/\b(restriccion|restricción|regulacion|regulación|ley de turismo|tope|anfitrion|anfitrión|hospedaje)\b/.test(n))return {id:"regulacion",label:"regulación / conflicto institucional",score:0.90};
 if(/\b(hansel|hänsel|gretel|bruja|madrastra|bosque|guijarro|miga|horno)\b/.test(n))return {id:"narrativa",label:"narrativa / supervivencia",score:0.90};
 if(/\b(compra|comprar|campaña|marca|consumidor|cliente|producto)\b/.test(n))return {id:"consumo",label:"persuasión / consumo",score:0.70};
 return {id:"generico",label:"genérico",score:0.35};}
function eventFamily(frame,domain){const s=frame.sense,p=frame.predicate,n=ns.Spanish.strip(frame.evidence);
 if(domain.id==="investigacion"){
  if(frame.relation_to_event==="projection")return "projection";
  if(s==="EVALUATION"||frame.relation_to_event==="evaluation")return "evaluation";
  if(s==="ATTRIBUTED_ALLEGATION"||frame.relation_to_event==="allegation")return "allegation";
  if(s==="INVESTIGATION_OPEN")return "investigation_state";
  if(s==="LEGAL_AUTHORIZATION")return "judicial_authorization";
  if((s==="LEGAL_DETENTION"||p==="detener")&&frame.relation_to_event==="constitutive"&&frame.realization==="realized/asserted")return "judicial_detention";
  if(/contradic|omitid|obstaculiz/.test(n))return "information_obstruction_claim";
  if(s==="INFORMATION_REQUEST"||/informacion oficial|información oficial|que informe|esclarec|reconstruir/.test(n))return "information_request";
 }
 if(domain.id==="regulacion"){
  if(/impuesto sobre|por concepto del impuesto/.test(n)&&/gener|pag|cobr/.test(n))return "economic_argument";
  if(/restric|limite|límite|tope|reform|regul/.test(n)&&/impus|establec|reform|obliga|prohib|limita/.test(n))return "regulatory_restriction";
  if(/rechaz|exhort|pid|impugn|ampar|elimin|denunc|negoci/.test(n))return "regulatory_challenge";
  if(/diagnost|sustento|justifica|gentrific|crisis de vivienda/.test(n))return "legitimacy_argument";
 }
 if(domain.id==="narrativa"){
  if(/abandon|dejaron solos|llev.*bosque/.test(n))return "abandonment";
  if(/guijarr|guija|piedrecit/.test(n)&&/camino|ruta|gui|volver/.test(n))return "orientation_success";
  if(/miga|desmig/.test(n))return /no encontr|pajar.*com|com.*miga/.test(n)?"orientation_failure":"orientation_attempt";
  if(/bruja|reja|establo|engord|horno/.test(n)&&/encerr|agarr|captur|engord|asar|comer/.test(n))return "capture";
  if(/gretel/.test(n)&&/empuj|precipit|cerrojo|abrio la puerta|abrió la puerta|salvad/.test(n))return "counteraction";
  if(/perla|piedra preciosa|tesoro/.test(n)&&/encontr|llen|tom|vaci/.test(n))return "resource_acquisition";
  if(/regres|retorn|volv.*casa|lleg.*casa|acabaron las penas|vivieron.*felices/.test(n))return "return_restoration";
 }
 return frame.relation_to_event||s||p||"other";}
function coreferenceKey(frame,family,domain){if(domain.id==="regulacion"&&family==="regulatory_restriction")return "regulatory_restriction|main";if(domain.id==="investigacion"&&family==="judicial_detention")return "judicial_detention|corrales";if(domain.id==="investigacion"&&family==="investigation_state")return "investigation_state|case";if(domain.id==="narrativa"&&family==="capture")return "capture|witch-episode";if(domain.id==="narrativa"&&family==="counteraction")return "counteraction|gretel-episode";if(domain.id==="narrativa"&&["orientation_attempt","orientation_failure"].includes(family))return "breadcrumbs|episode";return `${family}|${frame.actor||"?"}|${frame.object||"?"}`;}
function groupEpisodes(frames,domain){const map=new Map();for(const f of frames){const fam=eventFamily(f,domain);if(!fam||["attribute/state"].includes(fam)&&domain.id!=="investigacion")continue;const k=coreferenceKey(f,fam,domain);let e=map.get(k);if(!e){e={id:`ep${map.size+1}`,key:k,family:fam,frames:[],first:f.sentenceIndex,last:f.sentenceIndex};map.set(k,e);}e.frames.push(f);e.first=Math.min(e.first,f.sentenceIndex);e.last=Math.max(e.last,f.sentenceIndex);}
 const arr=[...map.values()].sort((a,b)=>a.first-b.first);for(const e of arr){if(e.key==="breadcrumbs|episode"){e.family=e.frames.some(f=>/no encontr|pajar.*com|com.*miga/.test(ns.Spanish.strip(f.evidence)))?"orientation_failure":"orientation_attempt";}e.evidence=e.frames.map(f=>f.evidence);e.evidenceCount=e.frames.length;e.confidence=e.frames.some(f=>f.confidence==="alta")||e.frames.length>=3?"alta":e.frames.length>=2?"media":"media-baja";e.realizationStatus=[...new Set(e.frames.map(f=>f.realization))];e.epistemicStatus=[...new Set(e.frames.map(f=>f.epistemic_status))];}return arr;}
function numericFor(family,domain,evidenceCount){let D=Math.min(.85,.30+.08*Math.min(4,evidenceCount)),phi=.60,G=.50,type=family,polarity="neutra";
 if(domain.id==="regulacion"){
  if(family==="regulatory_restriction"){type="regulación coercitiva";polarity="negativa";G=.15;phi=.48;D=Math.max(D,.55);}
  if(family==="regulatory_challenge"){type="impugnación / demanda";polarity="positiva";G=.80;phi=.58;}
  if(family==="economic_argument"||family==="legitimacy_argument"){type="argumentación / legitimación";polarity="positiva";G=.70;phi=.55;}
 }
 if(domain.id==="investigacion"){
  if(family==="judicial_detention"){type="aprehensión / acceso institucional";polarity="positiva";G=.58;phi=.62;D=Math.max(D,.55);}
  if(family==="information_obstruction_claim"){type="obstrucción informativa atribuida";polarity="negativa";G=.15;phi=.30;}
  if(family==="information_request"){type="demanda de información";polarity="positiva";G=.68;phi=.60;}
 }
 if(domain.id==="narrativa"){
  if(family==="abandonment"){type="abandono / pérdida de agencia";polarity="negativa";G=.05;phi=.50;}
  if(family==="orientation_success"){type="orientación / resistencia";polarity="positiva";G=.90;phi=.65;}
  if(family==="orientation_attempt"){type="orientación / intento";polarity="positiva";G=.62;phi=.30;}
  if(family==="orientation_failure"){type="orientación fallida";polarity="negativa";G=.30;phi=.12;}
  if(family==="capture"){type="captura / amenaza";polarity="negativa";G=.05;phi=.42;D=Math.max(D,.60);}
  if(family==="counteraction"){type="contraacción / escape";polarity="positiva";G=.95;phi=.78;D=Math.max(D,.78);}
  if(family==="resource_acquisition"){type="adquisición de recursos";polarity="positiva";G=.82;phi=.75;}
  if(family==="return_restoration"){type="retorno / agencia restaurada";polarity="positiva";G=1;phi=.90;D=Math.max(D,.85);}
 }
 return {D,phi,G,type,polarity};}
function episodeToOperation(ep,domain,entities){const f=(domain.id==="investigacion"&&ep.family==="judicial_detention"?(ep.frames.find(x=>/realiz[oó].*(detenci[oó]n|aprehensi[oó]n)|(?:detenci[oó]n|aprehensi[oó]n).*se realiz[oó]/i.test(x.evidence))||ep.frames[0]):ep.frames[0]),nums=numericFor(ep.family,domain,ep.evidenceCount),actual=ep.frames.some(x=>x.realization==="realized/asserted"),asserted=ep.frames.some(x=>x.epistemic_status==="textual-assertion");let source=f.actor||"",actionTarget=f.patient||f.recipient||"",stateTarget=actionTarget;
 if(domain.id==="regulacion"){
  const community=entities.find(e=>e.name==="Comunidad de Pequeños Anfitriones")?.name||"Comunidad de Pequeños Anfitriones",gov=entities.find(e=>e.name==="gobierno / autoridades")?.name||"gobierno / autoridades";
  if(ep.family==="regulatory_restriction"){source=gov;actionTarget=community;stateTarget=community;}
  else {source=community;actionTarget=gov;stateTarget=community;}
 }
 if(domain.id==="investigacion"){
  const fgr=entities.find(e=>/Fiscalía General de la República/.test(e.name))?.name||"Fiscalía General de la República";const corr=entities.find(e=>/Corrales/.test(e.name))?.name||"Fausto Corrales Rodríguez";
  if(ep.family==="judicial_detention"){source=f.actor||entities.find(e=>/Fiscalía Especial|Policía Federal|Agencia de Investigación|Interpol/.test(e.name))?.name||fgr;actionTarget=corr;stateTarget=fgr;}
  if(ep.family==="information_obstruction_claim"){source=corr;actionTarget=fgr;stateTarget=fgr;}
  if(ep.family==="information_request"){source=f.actor||fgr;actionTarget=fgr;stateTarget=fgr;}
 }
 if(domain.id==="narrativa"){
  const hg=entities.find(e=>e.name==="Hänsel y Gretel")?.name||"Hänsel y Gretel";stateTarget=hg;
  if(ep.family==="capture"){source="bruja";actionTarget=hg;}
  if(ep.family==="counteraction"){source="Gretel";actionTarget="bruja";}
  if(ep.family.startsWith("orientation")){source="Hänsel";actionTarget=hg;}
  if(ep.family==="return_restoration"||ep.family==="resource_acquisition"){source=hg;actionTarget=ep.family==="resource_acquisition"?"recursos / entorno":"hogar / estado restaurado";}
 }
 const nonCausal=new Set(["evaluation","projection","allegation","investigation_state","judicial_authorization"]);let calculable=!nonCausal.has(ep.family)&&actual;
 // Alleged/hypothetical claims never calculate automatically.
 if(ep.frames.every(x=>x.epistemic_status!=="textual-assertion")||ep.frames.every(x=>/hypothetical|alleged|announced|remembered/.test(x.realization)))calculable=false;
 if(domain.id==="investigacion"&&ep.family!=="judicial_detention")calculable=false;
 return {episodeId:ep.id,family:ep.family,source,actionTarget,target:stateTarget,stateTarget,type:nums.type,polarity:nums.polarity,D:nums.D,phi:nums.phi,G:nums.G,Ge:nums.G,calculable,confidence:ep.confidence,evidenceCount:ep.evidenceCount,evidence:{D:ep.evidence.slice(0,3).join(" / "),phi:ep.evidence.slice(0,3).join(" / "),G:`G_e=${nums.G.toFixed(2)} sugerido por familia ${ep.family}; requiere confirmación analítica.`},epistemicStatus:ep.epistemicStatus,realizationStatus:ep.realizationStatus};}
function build(raw,frames,entities){const domain=domainFrom(frames,entities,raw),episodes=groupEpisodes(frames,domain),operations=episodes.map(e=>episodeToOperation(e,domain,entities));return {domain,episodes,operations,calculableOperations:operations.filter(o=>o.calculable)};}
ns.Events={domainFrom,eventFamily,groupEpisodes,episodeToOperation,build};
})(window);
