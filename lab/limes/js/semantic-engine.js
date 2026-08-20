"use strict";
(function(global){
const ns=global.Limes52=global.Limes52||{};
function detectQuotedContent(clause){const m=String(clause).match(/[“\"]([^”\"]+)[”\"]/);return m?m[1]:"";}
function selectActor(clause,entities,predicate,lastActor){const E=ns.Entities,S=ns.Spanish,n=S.strip(clause),mentions=E.mentionsIn(clause,entities);
  // Institutional actors by explicit semantic constructions.
  if(/\b(fiscalia especial de investigacion|fiscalía especial de investigación)\b/.test(n)){const x=entities.find(e=>/Fiscalía Especial de Investigación/.test(e.name));if(x)return x.name;}
  if(/\b(fgr|fiscalia general|fiscalía general|la fiscalia|la fiscalía)\b/.test(n)){const x=entities.find(e=>/Fiscalía General de la República/.test(e.name));if(x)return x.name;}
  if(/\b(juez de control federal|juez federal)\b/.test(n)){const x=entities.find(e=>e.type==="COURT_ROLE");if(x)return x.name;}
  if(/\b(sheinbaum|presidenta|mandataria)\b/.test(n)){const x=entities.find(e=>/Sheinbaum/.test(e.name));if(x)return x.name;}
  if(/\b(comunidad|anfitrion|anfitrión)\b/.test(n)&&/rechaz|pid|exhort|argument|ampar|denunc|indic|asegur/.test(n)){const x=entities.find(e=>e.name==="Comunidad de Pequeños Anfitriones");if(x)return x.name;}
  if(/\b(autoridades|gobierno|congreso)\b/.test(n)&&/impus|establec|reform|regul|limit|tope/.test(n)){const x=entities.find(e=>e.name==="gobierno / autoridades");if(x)return x.name;}
  if(/\b(madrastra|mujer)\b/.test(n)){const x=entities.find(e=>e.name==="madrastra");if(x)return x.name;}
  if(/\bbruja\b|\bvieja\b/.test(n)){const x=entities.find(e=>e.name==="bruja");if(x)return x.name;}
  if(/\bgretel\b/.test(n)){const x=entities.find(e=>e.name==="Gretel");if(x)return x.name;}
  if(/\bhansel\b|\bhänsel\b/.test(n)){const x=entities.find(e=>e.name==="Hänsel");if(x)return x.name;}
  if(mentions.length){
    const predToken=predicate?.lemma||"";const pi=predToken?n.indexOf(S.strip(predToken).slice(0,4)):-1;
    if(pi>0){const before=mentions.filter(m=>{const j=n.indexOf(S.strip(m));return j>=0&&j<pi;});if(before.length)return before[before.length-1];}
    return mentions[0];
  }
  return lastActor||"";
}
function inferPatient(clause,entities,actor,predicate){const S=ns.Spanish,E=ns.Entities,n=S.strip(clause),mentions=E.mentionsIn(clause,entities).filter(x=>x!==actor);
 if(predicate.sense==="LEGAL_DETENTION"||predicate.lemma==="detener"){const corr=entities.find(e=>/Corrales/.test(e.name));if(corr&&/corrales|hombre|captura|detencion|detención|aprehension|aprehensión/.test(n))return corr.name;}
 if(/cu[eé]n/.test(n)){const x=entities.find(e=>/Cu[eé]n/.test(e.name));if(x)return x.name;}
 if(/zambada/.test(n)){const x=entities.find(e=>/Zambada/.test(e.name));if(x)return x.name;}
 if(/hansel|hänsel|gretel|ninos|niños|hijos|hermanitos/.test(n)){const x=entities.find(e=>e.name==="Hänsel y Gretel");if(x)return x.name;}
 return mentions[0]||"";
}
function inferRecipient(clause,entities,actor){const S=ns.Spanish,E=ns.Entities,n=S.strip(clause),mentions=E.mentionsIn(clause,entities).filter(x=>x!==actor);
 const p=n.match(/\b(?:a|al|ante|contra|hacia)\s+(.+)/);if(p){const tail=p[1];const hit=mentions.find(m=>tail.includes(S.strip(m)));if(hit)return hit;}
 return "";
}
function inferObject(clause,predicate){const S=ns.Spanish,n=S.strip(clause);
 const patterns=[
  ["detención de Fausto Corrales",/detenci[oó]n|aprehensi[oó]n|captura/],
  ["esclarecimiento / reconstrucción de los hechos",/esclarec|reconstruir lo ocurrido|conocer que ocurrio|conocer qué ocurrió/],
  ["información relevante",/informaci[oó]n.*relevante|aportar informaci[oó]n|omitido informaci[oó]n/],
  ["declaraciones",/declaraci[oó]n|declaraciones|contradicciones/],
  ["investigación abierta",/investigaciones?|indagatorias?|caso.*abiert|no se ha cerrado/],
  ["restricción regulatoria",/restric|l[ií]mite|tope|maximo|maximo del 50|regulaci[oó]n/],
  ["capacidad operativa",/trabajar|hospedaje|operar|actividad|mercado/],
  ["retorno / orientación",/camino|ruta|guijarr|miga|volver|regresar/],
  ["supervivencia / libertad",/salvad|escap|liber|captur|encerr|horno|abandon/]
 ];for(const [label,rx] of patterns)if(rx.test(n))return label;
 return predicate.sense?predicate.sense.toLowerCase().replaceAll('_',' '):predicate.lemma||"";
}
function confidence(frame){let x=0;if(frame.actor)x++;if(frame.predicate)x++;if(frame.object)x++;if(frame.realization)x++;if(frame.relation_to_event)x++;if(frame.epistemic_status==="textual-assertion")x++;return x>=6?"alta":x>=4?"media":"baja";}
function frameForClause(clause,sentenceIndex,clauseIndex,entities,lastActor){const S=ns.Spanish,pred=S.detectPredicate(clause),actor=selectActor(clause,entities,pred,lastActor),patient=inferPatient(clause,entities,actor,pred),recipient=inferRecipient(clause,entities,actor),real=S.realization(clause),epi=S.epistemicStatus(clause),frame={id:`f${sentenceIndex+1}.${clauseIndex+1}`,sentenceIndex,clauseIndex,evidence:clause,actor,predicate:pred.lemma,sense:pred.sense,patient,recipient,object:inferObject(clause,pred),type:pred.type||S.ontologicalType(clause,pred.lemma),temporality:S.temporality(clause),modalities:S.modality(clause),logic:S.logic(clause),negated:S.logic(clause).includes("NOT"),realization:real,epistemic_status:epi,relation_to_event:S.relationToEvent(clause,pred),quotedContent:detectQuotedContent(clause)};
 // More exact realization/epistemic overrides.
 const n=S.strip(clause);
 if(/\b(habria presentado|habría presentado|habria omitido|habría omitido|probable participacion|probable participación)\b/.test(n)){frame.realization="alleged/not-established";frame.epistemic_status="attributed/alleged";}
 if(/\b(podria aportar|podría aportar|permitira conocer|permitirá conocer|espero que si|espero que sí)\b/.test(n)){frame.realization="hypothetical/projected";frame.epistemic_status="expectation/hypothesis";frame.relation_to_event="projection";}
 if(/\b(que informe|pidio esperar la informacion|pidió esperar la información|esperar la informacion oficial|esperar la información oficial)\b/.test(n)){const fgr=entities.find(e=>/Fiscalía General de la República/.test(e.name));frame.type="DECIR";frame.predicate="pedir";frame.sense="INFORMATION_REQUEST";frame.relation_to_event="response";frame.object="información oficial / esclarecimiento";if(lastActor&&lastActor!==fgr?.name)frame.actor=lastActor;if(fgr)frame.recipient=fgr.name;}
 if(/\b(califico|calificó).*relevante|\bes relevante\b/.test(n)){frame.type="DECIR";frame.sense="EVALUATION";frame.relation_to_event="evaluation";frame.object="detención de Fausto Corrales";}
 if(/\b(orden emitida|orden emitio|orden emitió)\b/.test(n)){frame.type="HACER";frame.predicate="autorizar";frame.sense="LEGAL_AUTHORIZATION";frame.relation_to_event="constitutive";}
 if(/\b(realizo la detencion|realizó la detención|realizo la aprehension|realizó la aprehensión)\b/.test(n)){frame.type="HACER";frame.predicate="detener";frame.sense="LEGAL_DETENTION";frame.realization="realized/asserted";frame.relation_to_event="constitutive";}
 if(/\b(atribuy\w*|señala\w*).*\b(probable|encubrimiento|falsedad)\b/.test(n)){frame.type="DECIR";frame.sense="ATTRIBUTED_ALLEGATION";frame.relation_to_event="allegation";frame.epistemic_status="attributed/alleged";const corr=entities.find(e=>/Corrales/.test(e.name));if(corr)frame.patient=corr.name;}
 if(/\b(no se ha cerrado|permanecen abiertas|no han concluido)\b/.test(n)){frame.type="ESTAR";frame.predicate="permanecer";frame.sense="INVESTIGATION_OPEN";frame.object="investigación abierta";frame.relation_to_event="state";}
 if(/\b(no hay un estudio|no hay un diagnostico|no hay un diagnóstico)\b/.test(n)){frame.type="ESTAR";frame.predicate="haber";frame.sense="ABSENCE_OF_EVIDENCE";frame.object="sustento/diagnóstico";frame.relation_to_event="argument";}
 if(/\b(quitar\w*.*del camino)\b/.test(n)){frame.type="HACER";frame.predicate="excluir";frame.sense="IDIOMATIC_EXCLUSION";frame.object="salida/exclusión de la actividad";frame.relation_to_event="projection";}
 if(/\b(encontr\w*.*una manera de vivir)\b/.test(n)){frame.type="ESTAR";frame.predicate="encontrar";frame.sense="MEANS_IDENTIFICATION";frame.object="medio de subsistencia";frame.relation_to_event="attribute/state";}
 if(/\b(volv\w* a entregar)\b/.test(n)){frame.type="HACER";frame.predicate="entregar";frame.sense="ASPECTUAL_REPETITION";frame.object="propuesta";frame.realization="announced/proposed";frame.relation_to_event="plan";}
 frame.confidence=confidence(frame);return frame;}
function analyze(raw,entities){const S=ns.Spanish,frames=[],sentences=S.splitSentences(raw);let lastActor="";sentences.forEach((sent,si)=>{const clauses=S.splitClauses(sent);clauses.forEach((cl,ci)=>{const f=frameForClause(cl,si,ci,entities,lastActor);if(f.predicate||f.actor||f.object){frames.push(f);if(f.actor)lastActor=f.actor;}});});return {version:"frames-v0.52",sentences,frames,stats:{sentences:sentences.length,frames:frames.length,ser:frames.filter(f=>f.type==="SER").length,estar:frames.filter(f=>f.type==="ESTAR").length,decir:frames.filter(f=>f.type==="DECIR").length,hacer:frames.filter(f=>f.type==="HACER").length,nonRealized:frames.filter(f=>!/realized\/asserted/.test(f.realization)).length}};}
ns.Semantic={analyze,frameForClause};
})(window);
