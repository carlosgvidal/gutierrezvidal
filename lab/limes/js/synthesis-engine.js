"use strict";
(function(global){
const ns=global.Limes52=global.Limes52||{};
const uniq=a=>[...new Set((a||[]).filter(Boolean))];
const strip=s=>ns.Spanish.strip(String(s||""));
const clip=(s,n=210)=>{s=String(s||"").replace(/\s+/g," ").trim();return s.length>n?s.slice(0,n-1)+"…":s;};
const meaningfulObject=o=>o&&!/^(ser|estar|decir|indicar|asegurar|afirmar|agregar|responder|informar|señalar|calificar)$/i.test(o);
function entityMap(analysis){return new Map((analysis.entities||[]).map(e=>[e.name,e]));}
function frameActors(frames){return uniq(frames.flatMap(f=>[f.actor,f.patient,f.recipient]));}
function actorProfiles(analysis){
 const frames=analysis.semantic.frames||[],emap=entityMap(analysis),ids=uniq([...(analysis.entities||[]).filter(e=>e.operationalCandidate!==false).map(e=>e.name),...frameActors(frames)]);
 return ids.map(id=>{
  const own=frames.filter(f=>f.actor===id),received=frames.filter(f=>f.patient===id||f.recipient===id),e=emap.get(id);
  const by=t=>own.filter(f=>f.type===t).slice(0,4).map(f=>clip(f.evidence));
  return {id,type:e?.type||"ACTOR",role:e?.role||"actor textual",mentions:e?.mentions?.length||0,
   ser:by("SER"),estar:by("ESTAR"),decir:by("DECIR"),hacer:by("HACER"),
   outgoing:own.filter(f=>["DECIR","HACER"].includes(f.type)).length,incoming:received.length,
   unresolved:own.filter(f=>f.type==="UNRESOLVED").length};
 }).sort((a,b)=>(b.outgoing+b.incoming+b.mentions)-(a.outgoing+a.incoming+a.mentions));
}
function valueObjects(analysis){
 const counts=new Map();for(const f of analysis.semantic.frames||[]){const o=f.object;if(!meaningfulObject(o)||strip(o)===strip(f.predicate))continue;const k=strip(o);if(!k)continue;let x=counts.get(k);if(!x){x={object:o,count:0,actors:new Set(),evidence:[],status:"textual/inferido desde frame"};counts.set(k,x);}x.count++;if(f.actor)x.actors.add(f.actor);if(x.evidence.length<3)x.evidence.push(clip(f.evidence));}
 return [...counts.values()].sort((a,b)=>b.count-a.count).slice(0,8).map(x=>({...x,actors:[...x.actors]}));
}
function familyOrientation(f){
 if(/restriction|capture|abandonment|obstruction/.test(f))return "constraint";
 if(/challenge|counteraction|return|orientation_success|information_request/.test(f))return "counter";
 if(/argument/.test(f))return "argument";
 if(/projection|plan/.test(f))return "projection";
 if(/attribute|state|investigation_state/.test(f))return "state";
 return "operation";
}
function episodeRepresentative(ep){return ep.frames?.find(f=>f.actor)||ep.frames?.[0]||null;}
function programs(analysis){
 const groups=new Map();for(const ep of analysis.events.episodes||[]){const f=episodeRepresentative(ep);if(!f||!f.actor||["attribute_state","retrospective","unresolved"].includes(ep.family))continue;const obj=meaningfulObject(f.object)&&strip(f.object)!==strip(f.predicate)?f.object:(f.patient?ep.family:(f.predicate||ep.family));const orientation=familyOrientation(ep.family);if(orientation==="operation"&&!f.patient&&!f.recipient&&strip(obj)===strip(f.predicate))continue;const key=[f.actor,strip(obj),orientation].join("|");let p=groups.get(key);if(!p){p={id:"",actor:f.actor,target:f.patient||f.recipient||"",object:obj,orientation,families:[],actions:[],episodes:[],evidence:[],realization:new Set()};groups.set(key,p);}p.families.push(ep.family);p.actions.push(f.predicate||ep.family);p.episodes.push(ep.id);for(const r of (ep.realizationStatus||[]))p.realization.add(r);if(p.evidence.length<4)p.evidence.push(...(ep.evidence||[]).slice(0,2).map(clip));}
 return [...groups.values()].map((p,i)=>({...p,id:`P${i+1}`,families:uniq(p.families),actions:uniq(p.actions),realization:[...p.realization],evidence:uniq(p.evidence).slice(0,4)}));
}
function counterPrograms(ps){
 const out=[];for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){const a=ps[i],b=ps[j];if(a.actor===b.actor)continue;const same=strip(a.object)===strip(b.object)||a.families.some(x=>/regulatory_restriction/.test(x))&&b.families.some(x=>/regulatory_challenge/.test(x))||b.families.some(x=>/regulatory_restriction/.test(x))&&a.families.some(x=>/regulatory_challenge/.test(x))||a.families.some(x=>/capture|abandonment/.test(x))&&b.families.some(x=>/counteraction|return|orientation/.test(x))||b.families.some(x=>/capture|abandonment/.test(x))&&a.families.some(x=>/counteraction|return|orientation/.test(x));const opposed=(a.orientation==="constraint"&&["counter","argument"].includes(b.orientation))||(b.orientation==="constraint"&&["counter","argument"].includes(a.orientation));if(same&&opposed)out.push({a:a.id,b:b.id,actors:[a.actor,b.actor],object:a.object||b.object,relation:"programa ↔ contra-programa"});}
 return out;
}
const OPP_PAIRS=[
 ["restricción","apertura",/restric|limite|límite|tope|prohib/,/elimin|retir|modific|abrir|revis/],
 ["captura/pérdida de agencia","libertad/recuperación",/captur|encerr|abandon/,/escap|liber|salvad|retorn|regres/],
 ["ocultamiento/obstrucción","esclarecimiento",/ocult|omit|obstacul|encubri/,/esclarec|reconstru|informacion|información|aclar/],
 ["aceptación","rechazo",/acept|aproba/,/rechaz|impugn|opon/],
 ["cooperación","confrontación",/cooper|acuerdo|coordina/,/conflict|confront|amenaz/],
 ["entrada","salida",/entrar|ingres/,/salir|exclu|retir/],
 ["continuidad","cambio",/mantener|continu|vigencia/,/cambio|modific|reform|transform/]
];
function oppositions(analysis,ps,cps){
 const raw=strip(analysis.raw),out=[];for(const [a,b,ra,rb] of OPP_PAIRS){if(ra.test(raw)&&rb.test(raw))out.push({left:a,right:b,status:"observada en el texto"});}
 for(const c of cps){if(c.object&&/restric|regul/.test(strip(c.object)))out.push({left:"mantenimiento/restricción",right:"modificación/impugnación",status:"estructural desde programas contrapuestos"});else if(c.object&&/libertad|agencia|retorno|orient/.test(strip(c.object)))out.push({left:"pérdida de agencia",right:"recuperación de agencia",status:"estructural desde programas contrapuestos"});}
 const seen=new Set();return out.filter(o=>{const k=o.left+"|"+o.right;if(seen.has(k))return false;seen.add(k);return true;}).slice(0,6);
}
function frontierKind(a,b,frame,emap){const A=emap.get(a),B=emap.get(b);if(frame?.type==="DECIR")return "discursiva/comunicativa";if([A?.type,B?.type].some(t=>["GOVERNMENT","INSTITUTION","COURT_ROLE","LAW"].includes(t)))return "institucional";if([A?.type,B?.type].some(t=>t==="PERSON_ROLE"))return "interpersonal";return "relacional";}
function frontiers(analysis){
 const emap=entityMap(analysis),map=new Map();for(const f of analysis.semantic.frames||[]){if(!f.actor||!(f.patient||f.recipient)||f.actor===(f.patient||f.recipient))continue;const b=f.patient||f.recipient,k=f.actor+"→"+b;let x=map.get(k);if(!x){x={source:f.actor,target:b,kind:frontierKind(f.actor,b,f,emap),frames:[],evidence:[],signals:[]};map.set(k,x);}x.frames.push(f);if(x.evidence.length<3)x.evidence.push(clip(f.evidence));if(f.realization==="failed"||/no (han )?obtenido respuesta|sin respuesta|no pudo|no pudieron/.test(strip(f.evidence)))x.signals.push("resistencia/baja porosidad observada");if(f.type==="DECIR")x.signals.push("canal comunicativo observado");}
 const all=[...map.values()];for(const x of all){const reverse=map.get(x.target+"→"+x.source);if(reverse)x.signals.push("intercambio bidireccional observado");x.condition=uniq(x.signals).join("; ")||"relación observada; porosidad numérica no identificada";delete x.frames;delete x.signals;}return all.slice(0,12);
}
function transformations(analysis){return (analysis.semantic.frames||[]).filter(f=>["HACER","DECIR"].includes(f.type)&&f.realization==="realized/asserted"&&f.relation_to_event!=="retrospective").slice(0,14).map(f=>({actor:f.actor||"actor no resuelto",type:f.type,action:f.predicate||f.sense||"operación",target:f.patient||f.recipient||"",object:f.object||"",evidence:clip(f.evidence)}));}
function semiotic(analysis){
 const aps=actorProfiles(analysis),vos=valueObjects(analysis),ps=programs(analysis),cps=counterPrograms(ps),ops=oppositions(analysis,ps,cps),fr=frontiers(analysis),tr=transformations(analysis);
 const active=aps.filter(a=>a.outgoing+a.incoming>0).slice(0,6);const mainPrograms=ps.filter(p=>p.orientation!=="state").slice(0,6);
 const summary=[];if(active.length)summary.push(`Intervienen ${active.map(a=>a.id).join(", ")}.`);if(mainPrograms.length)summary.push(`Se observan ${mainPrograms.length} programa${mainPrograms.length===1?"":"s"} de acción o comunicación con evidencia textual.`);if(cps.length)summary.push(`Hay ${cps.length} relación${cps.length===1?"":"es"} de programa/contra-programa.`);if(fr.length)summary.push(`Las operaciones atraviesan ${fr.length} frontera${fr.length===1?"":"s"} relacional${fr.length===1?"":"es"} identificable${fr.length===1?"":"s"}, sin asignar φ numérica.`);
 return {version:"semiotic-synthesis-v0.53",summary:summary.join(" "),actors:aps,valueObjects:vos,oppositions:ops,programs:ps,counterPrograms:cps,frontiers:fr,transformations:tr};
}
function familyLabel(game,features){if(game?.determined)return game.determined.label;if(features.includes("bargaining"))return "negociación / conflicto distributivo";if(features.includes("threat")&&features.includes("response"))return "amenaza–respuesta secuencial";if(features.includes("information_asymmetry")||features.includes("screening")||features.includes("signaling"))return "interacción estratégica de información";if(features.includes("coordination"))return "coordinación";if(features.includes("voting"))return "interacción institucional de decisión colectiva";return "estructura estratégica no determinada";}
function strategicScenarios(analysis){
 const f=analysis.game.features||[],s=analysis.semiotic,sc=[];const add=(label,basis,projection,limit)=>sc.push({label,basis,projection,limit});
 if(f.includes("bargaining")){
  add("Persistencia del desacuerdo","programas contrapuestos observados","Si ninguna parte modifica su programa, el conflicto/disputa puede continuar sin resolución observable.","No implica probabilidad ni duración.");
  add("Apertura de negociación","resultado negociable o demanda de revisión observada","Una respuesta compatible de la contraparte abriría una rama de modificación o acuerdo.","La respuesta no se supone si no está en el texto.");
  if(f.includes("outside_option"))add("Uso de alternativa externa","se observa una vía alternativa al acuerdo","El actor puede continuar por litigio, salida u otra alternativa explícita en el texto.","Sólo se extrapola la disponibilidad de la vía, no su éxito.");
 }else if(f.includes("threat")&&f.includes("response")){
  add("Continuidad de la amenaza","amenaza ya observada","Sin una transformación adicional, la presión sobre el actor afectado puede persistir.","No se extrapola desenlace.");
  add("Respuesta/adaptación","contra-programa observado","Las acciones de respuesta ya presentes permiten extrapolar continuidad de resistencia/adaptación si las condiciones permanecen.","No se presume eficacia futura.");
  add("Resolución","existe una secuencia de transformación","Una operación que elimine la amenaza o restablezca el objeto de valor cerraría el episodio estratégico.","Es una rama estructural, no un resultado pronosticado.");
 }else if(f.includes("information_asymmetry")||f.includes("screening")||f.includes("signaling")){
  add("Persistencia de la brecha informativa","la estructura contiene información desigual o búsqueda de información","Sin nueva evidencia, permanece la incertidumbre estratégica relevante.","No se atribuye ocultamiento sin evidencia.");
  add("Reducción de la brecha","hay mecanismos de consulta, señal o contraste","Nueva información verificable podría modificar las opciones estratégicas disponibles.","No se asume que la información futura será suficiente.");
 }else if(s.counterPrograms.length){
  add("Continuidad de programas contrapuestos","se observaron programa y contra-programa","Si no aparece una operación nueva, ambos cursos pueden persistir o alternarse.","No se identifica un juego canónico suficiente.");
  add("Transformación de la relación","existe un objeto de disputa compartido","Una modificación de alguno de los programas podría alterar la frontera y abrir otra secuencia.","La dirección concreta requiere evidencia adicional.");
 }
 return sc.slice(0,4);
}
function strategic(analysis){
 const g=analysis.game,s=analysis.semiotic,features=g.features||[],label=familyLabel(g,features),basis=[];if(s.counterPrograms.length)basis.push(`${s.counterPrograms.length} programa/contra-programa observado`);if(features.includes("sequential"))basis.push("movimientos ordenados");if(features.includes("bargaining"))basis.push("resultado/objeto potencialmente negociable");if(features.includes("communication"))basis.push("operaciones comunicativas observadas");if(features.includes("outside_option"))basis.push("alternativa externa observada");
 const limits=[];if(!g.determined)limits.push("No se cumplen condiciones suficientes para determinar de forma única un juego canónico.");const top=g.candidates?.[0];if(top?.missing?.length)limits.push(`Para el candidato más próximo faltan: ${top.missing.join(", ")}.`);if(!s.counterPrograms.length)limits.push("No se reconstruyó un programa/contra-programa suficientemente claro.");
 return {label,status:g.determined?"juego canónico determinado":"mediación estratégica cualitativa",basis,limits:uniq(limits),scenarios:strategicScenarios(analysis)};
}
function variableAssessment(analysis){const s=analysis.semiotic,frames=analysis.semantic.frames||[],tracks=analysis.tracks||[];const has=t=>frames.some(f=>f.type===t),goal=frames.some(f=>f.type==="DECIR"&&(f.content_realization==="proposed"||f.modalities?.includes("querer")||/pedir|exhortar|solicitar|exigir|proponer/.test(f.predicate)));return [
 {id:"S",label:"Ser",qualitative:has("SER")||s.actors.some(a=>a.role),numeric:false,note:has("SER")?"Hay evidencia cualitativa de identidad/configuración persistente; no escala numérica calibrada.":"Puede describirse por rol/identidad cuando el texto lo sustenta; no hay valor numérico."},
 {id:"E",label:"Estar",qualitative:has("ESTAR")||s.frontiers.length>0,numeric:false,note:has("ESTAR")?"Hay estados/condiciones situadas observables; no valor [0,1] sustentado.":"La situación relacional puede describirse parcialmente; no es cuantificable con esta fuente."},
 {id:"H",label:"Hacer actual",qualitative:tracks.some(t=>t.evaluatedActor)||frames.some(f=>f.type==="HACER"),numeric:false,note:"La conducta/estado puede identificarse cualitativamente si el issue está resuelto; H0 numérico requiere una escala con evidencia."},
 {id:"D",label:"Decir / movilización",qualitative:(analysis.events.communicativeCandidates||[]).length>0,numeric:false,note:"Se identifican operaciones comunicativas; su magnitud D no se infiere de frecuencia ni del tipo de acto."},
 {id:"φ",label:"Frontera",qualitative:s.frontiers.length>0,numeric:false,note:"La frontera source→target puede caracterizarse cualitativamente; φ numérica requiere evidencia relacional adicional."},
 {id:"G_e",label:"Objetivo local",qualitative:goal,numeric:false,note:goal?"Existe un objetivo/propuesta interpretable en el contenido comunicativo; no se asigna automáticamente a [0,1].":"No hay objetivo conductual suficientemente explícito para cuantificar."}
 ];}
function qualitative(analysis){const qa=variableAssessment(analysis),interpretable=qa.filter(x=>x.qualitative).map(x=>x.id),notNumeric=qa.filter(x=>!x.numeric).map(x=>x.id);return {version:"qualitative-result-v0.53",analysisSummary:analysis.semiotic.summary,strategic:strategic(analysis),quantification:{level:"cualitativo",interpretable,pointEstimable:[],notNumericallyIdentified:notNumeric,variables:qa,note:"La cuantificación no condiciona la validez del análisis cualitativo. El núcleo numérico se ejecuta sólo con parámetros sustentados."}};}
ns.Synthesis={semiotic,qualitative,actorProfiles,valueObjects,programs,counterPrograms,oppositions,frontiers,transformations,variableAssessment};
})(window);
