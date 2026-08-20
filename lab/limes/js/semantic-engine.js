"use strict";
(function(global){
const ns=global.Limes52=global.Limes52||{};
function entityPositions(clause,entities){const low=ns.Spanish.strip(clause),out=[];for(const e of entities){for(const form of [e.name,...(e.aliases||[])]){const k=ns.Spanish.strip(form);if(!k)continue;let p=low.indexOf(k);if(p>=0){out.push({name:e.name,pos:p,type:e.type,form});break;}}}return out.sort((a,b)=>a.pos-b.pos);}
function predicatePosition(clause,predicate){const n=ns.Spanish.strip(clause);for(const t of ns.Spanish.tokenize(clause)){if(t.lemma===predicate.lemma){const p=n.indexOf(ns.Spanish.strip(t.surface));if(p>=0)return p;}}const root=(predicate.lemma||"").replace(/(ar|er|ir)$/,'');return root?n.indexOf(root):-1;}
function explicitActor(clause,entities,predicate){const pos=entityPositions(clause,entities),vp=predicatePosition(clause,predicate);if(!pos.length)return "";const before=pos.filter(x=>vp<0||x.pos<vp);
 if(predicate.type==="DECIR"){
  const n=ns.Spanish.strip(clause);
  if(before.length)return before[0].name;
  // If the clause begins with an elided attribution verb, preserve discourse speaker.
  if(/^(indic|asegur|afirm|agreg|señal|dij|respond|declar|calific|pid|exhort|anunc|lament)\w*/.test(n))return "";
  // Postposed journalistic attribution: dijo Nombre. Avoid prepositional objects.
  const after=pos.find(x=>vp>=0&&x.pos>vp&&x.pos-vp<35);if(after){const between=n.slice(vp,after.pos);if(!/\b(a|al|contra|hacia|sobre|para)\s*$/.test(between))return after.name;}
 }
 if(before.length)return before[0].name;return pos[0].name;}
function resolveActor(clause,entities,predicate,context){const n=ns.Spanish.strip(clause);if(predicate.sense==="LEGAL_DETENTION"&&/^(la|el)?\s*(detencion|detención|aprehension|aprehensión|arresto)\b.*\bse realiz/.test(n))return "";const explicit=explicitActor(clause,entities,predicate);if(explicit)return explicit;if(predicate.type==="DECIR"&&context.lastSpeaker)return context.lastSpeaker;if(context.lastSubject&&!/^\s*[A-ZÁÉÍÓÚÑ][\p{L}]+\s+/u.test(clause))return context.lastSubject;return "";}
function resolvePatient(clause,entities,actor,predicate){const pos=entityPositions(clause,entities).filter(x=>x.name!==actor),n=ns.Spanish.strip(clause);if(!pos.length)return "";for(const p of pos){const k=ns.Spanish.strip(p.form),idx=n.indexOf(k),pre=n.slice(Math.max(0,idx-22),idx);if(predicate.sense==="LEGAL_DETENTION"){if(/\b(a|al)\s*$/.test(pre))return p.name;continue;}if(/\b(a|al|contra|hacia|sobre)\s*$/.test(pre))return p.name;}if(predicate.sense==="LEGAL_DETENTION")return "";return pos[0].name;}
function inferObject(clause,predicate){const n=ns.Spanish.strip(clause);const rules=[
 ["restricción regulatoria",/\b(restriccion|restricción|limite|límite|tope|medida|regulacion|regulación)\b/],
 ["información / evidencia",/\b(informacion|información|evidencia|declaraciones?|datos?|diagnostico|diagnóstico|sustento)\b/],
 ["investigación / esclarecimiento",/\b(investigacion|investigación|indagatoria|esclarec|reconstruir|caso)\b/],
 ["libertad / agencia",/\b(abandon|captur|encerr|escap|salvad|libertad)\b/],
 ["retorno / orientación",/\b(camino|ruta|guijarr|miga|regres|retorn|volver|casa)\b/],
 ["recursos",/\b(perla|piedra preciosa|tesoro|recursos?)\b/],
 ["actividad / trabajo",/\b(trabaj|actividad|mercado|hospedaje|operar)\b/]
 ];for(const [label,rx] of rules)if(rx.test(n))return label;return predicate.lemma||"";}
function nestedFrames(clause,baseId,entities){const out=[],n=ns.Spanish.strip(clause);
 // Passive institutional imposition embedded in a response: “rechazó el límite impuesto por el Ayuntamiento”.
 if(/\b(limite|límite|restriccion|restricción|medida|tope)\b[^.]{0,90}\bimpuest\w*\s+por\b/.test(n)){
  const ps=entityPositions(clause,entities);const por=n.lastIndexOf(" por ");const actor=ps.find(x=>x.pos>por)?.name||"";if(actor)out.push({id:`${baseId}.n1`,type:"HACER",predicate:"imponer",sense:"INSTITUTIONAL_IMPOSITION",actor,patient:"",recipient:"",object:"restricción regulatoria",temporality:ns.Spanish.temporality(clause),modalities:[],logic:ns.Spanish.logic(clause),realization:"realized/asserted",epistemic_status:"textual-assertion",relation_to_event:"constitutive",evidence:clause,confidence:"alta",nested:true});
 }
 // Legal action embedded in passive voice.
 if(/\b(deteni[dt]\w*|aprehendid\w*|arrestad\w*)\s+por\b/.test(n)){
  const ps=entityPositions(clause,entities),por=n.lastIndexOf(" por "),actor=ps.find(x=>x.pos>por)?.name||"",patient=ps.find(x=>x.pos<por)?.name||"";if(actor||patient)out.push({id:`${baseId}.n2`,type:"HACER",predicate:"detener",sense:"LEGAL_DETENTION",actor,patient,recipient:"",object:"detención institucional",temporality:ns.Spanish.temporality(clause),modalities:[],logic:ns.Spanish.logic(clause),realization:"realized/asserted",epistemic_status:"textual-assertion",relation_to_event:"constitutive",evidence:clause,confidence:"alta",nested:true});
 }
 return out;}
function frameForClause(clause,si,ci,entities,context){const S=ns.Spanish,p=S.detectPredicate(clause),actor=resolveActor(clause,entities,p,context),patient=resolvePatient(clause,entities,actor,p),type=p.type||"UNRESOLVED";const frame={id:`f${si+1}.${ci+1}`,type,predicate:p.lemma||"",sense:p.sense||"",actor,patient,recipient:"",object:inferObject(clause,p),temporality:S.temporality(clause),modalities:S.modality(clause),logic:S.logic(clause),realization:S.realization(clause),epistemic_status:S.epistemicStatus(clause),relation_to_event:S.relationToEvent(clause,p),evidence:clause,confidence:type==="UNRESOLVED"?"baja":actor?"media":"media-baja",nested:false};
 // Speech acts have a realized communicative act while their propositional content may be projected/requested.
 if(type==="DECIR"&&/\b(pedir|exhortar|solicitar|exigir|anunciar|prometer)\b/.test(p.lemma)){frame.content_realization=/\b(elimin|retir|modific|establec|hacer|entregar|salir)\w*/.test(S.strip(clause))?"proposed":"unspecified";}
 return frame;}
function analyze(raw,entities){const S=ns.Spanish,frames=[],sentences=S.splitSentences(raw),context={lastActor:"",lastSpeaker:"",lastSubject:""};sentences.forEach((sent,si)=>{const clauses=S.splitClauses(sent);clauses.forEach((cl,ci)=>{const base=frameForClause(cl,si,ci,entities,context);const nested=nestedFrames(cl,`f${si+1}.${ci+1}`,entities);for(const f of nested)frames.push(f);if(base.type!=="UNRESOLVED"||base.actor||base.object)frames.push(base);if(base.actor){context.lastActor=base.actor;context.lastSubject=base.actor;if(base.type==="DECIR")context.lastSpeaker=base.actor;}if(base.type==="DECIR"&&base.actor)context.lastSpeaker=base.actor;});});return {version:"frames-v0.52.1-integrity",sentences,frames,stats:{sentences:sentences.length,frames:frames.length,ser:frames.filter(f=>f.type==="SER").length,estar:frames.filter(f=>f.type==="ESTAR").length,decir:frames.filter(f=>f.type==="DECIR").length,hacer:frames.filter(f=>f.type==="HACER").length,unresolved:frames.filter(f=>f.type==="UNRESOLVED").length,nonRealized:frames.filter(f=>f.realization!=="realized/asserted").length}};}
ns.Semantic={analyze,frameForClause,nestedFrames};
})(window);
