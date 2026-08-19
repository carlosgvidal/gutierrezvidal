function analyze(){
 const raw=document.getElementById("txt").value.trim();if(!raw){document.getElementById("out").innerHTML='<div class="card">Ingrese un texto para analizar.</div>';return;}
 const t=stripAccents(raw.toLowerCase()),res={};["ser","estar","decir","hacer"].forEach(k=>res[k]=count(lex[k],t));
 const rawTotal=res.ser.c+res.estar.c+res.decir.c+res.hacer.c;const total=Math.max(1,rawTotal),tokens=tokenize(raw);detectedActors=extractActors(raw);const concepts=topConcepts(tokens),opp=detectOppositions(tokens);const plainFull=stripAccents(raw.toLowerCase());const pos=posWords.reduce((n,w)=>n+stemMatches(w,plainFull),0),neg=negWords.reduce((n,w)=>n+stemMatches(w,plainFull),0),pol=pos-neg,polLabel=pol>1?"Positiva":pol<-1?"Negativa":"Neutra";
 document.getElementById("transferBtn").disabled=detectedActors.length===0;
 const globalStates={ser:res.ser.c/total,estar:res.estar.c/total,decir:res.decir.c/total,hacer:res.hacer.c/total};
 const lowEvidence=rawTotal<6;
 document.getElementById("out").innerHTML=`
 <div class="card"><b>Estados del sistema</b><span class="concept-note">Distribución relativa del texto entre identidad, contexto, discurso y acción, calculada a partir de un diccionario léxico fijo de ${rawTotal} coincidencia${rawTotal===1?"":"s"} en total. Es una lectura orientativa, no una medición calibrada del contenido del texto.${lowEvidence?" Con tan pocas coincidencias el reparto porcentual no es representativo del texto; tratar como no concluyente.":""}</span><div class="state-grid">${stateCards(globalStates)}</div></div>
 <div class="card"><b>Indicadores</b><span class="concept-note">Lecturas sintéticas derivadas de los estados del sistema.</span>
  <div class="metric-line"><span class="metric-label">DA · Densidad axiológica</span><span class="metric-value">${Math.round(globalStates.ser*100)}</span><span class="metric-help">Peso de identidad, valores y principios en el texto.</span></div>
  <div class="metric-line"><span class="metric-label">RC · Régimen comunicativo</span><span class="metric-value">${Math.round(globalStates.decir*100)}</span><span class="metric-help">Peso del discurso, la narrativa y la representación.</span></div>
  <div class="metric-line"><span class="metric-label">ITP · Intensidad transformadora potencial</span><span class="metric-value">${Math.round(globalStates.hacer*100)}</span><span class="metric-help">Presencia relativa de acción, decisión e intervención.</span></div>
  <div class="metric-line"><span class="metric-label">TRS · Tensión de reproducción sistémica</span><span class="metric-value">${Math.round((globalStates.ser+globalStates.hacer)*100)}</span><span class="metric-help">Relación acumulada entre identidad y capacidad de acción.</span></div>
 </div>
 <div class="card"><b>Actores detectados</b><span class="concept-note">Entidades reconocidas en el texto y convertidas en unidades estratégicas. La estimación incorpora acciones emitidas, acciones recibidas y tipo de relación.</span>${detectedActors.length?detectedActors.map(a=>`<div class="actor-row"><span><b>${escapeHtml(a.name)}</b><br><span class="muted">${escapeHtml(a.contexts[0]||"")}</span><small>Relaciones: ${a.relations.outgoing.length} emitidas · ${a.relations.incoming.length} recibidas · conflicto ${a.relations.conflict} · cooperación ${a.relations.cooperation}</small><div class="state-grid">${stateCards(a.states,true)}</div></span><span class="badge">${a.type}</span><span class="badge">${a.count} mención${a.count===1?"":"es"}</span></div>`).join(""):"—"}</div>
 <div class="card"><b>Relaciones detectadas</b><span class="concept-note">Vínculos direccionales reconstruidos mediante sujeto, verbo, objeto, negación y tipo de acción. El sistema no realiza análisis sintáctico completo: en oraciones largas o con cláusulas subordinadas puede vincular incorrectamente sujeto y objeto. Se muestran primero las relaciones de mayor confianza.</span>${(()=>{const highConf=detectedRelations.filter(r=>r.confidence>=0.7);const lowConf=detectedRelations.filter(r=>r.confidence<0.7);let html="";html+=highConf.length?highConf.map(r=>`<div class="list-item"><b>${escapeHtml(r.source)}</b> → <b>${escapeHtml(r.target)}</b> <span class="badge">${escapeHtml(r.type)}</span><small>${r.negated?"negación · ":""}${escapeHtml(r.verb)} · confianza ${r.confidence.toFixed(2)}<br>${escapeHtml(r.sentence)}</small></div>`).join(""):"No se detectaron relaciones de alta confianza entre actores.";if(lowConf.length){html+=`<div class="list-item"><small><b>${lowConf.length} relación${lowConf.length===1?"":"es"} de menor confianza (&lt;0.70) omitida${lowConf.length===1?"":"s"} por defecto — revisar manualmente antes de usar en un informe:</b></small></div>`;html+=lowConf.map(r=>`<div class="list-item" style="opacity:.6"><b>${escapeHtml(r.source)}</b> → <b>${escapeHtml(r.target)}</b> <span class="badge">${escapeHtml(r.type)}</span><small>${r.negated?"negación · ":""}${escapeHtml(r.verb)} · confianza ${r.confidence.toFixed(2)}<br>${escapeHtml(r.sentence)}</small></div>`).join("");}return html;})()}</div>
 <div class="card"><b>Conceptos dominantes</b><span class="concept-note">Términos con mayor frecuencia significativa después de normalizar el texto y excluir palabras funcionales.</span>${concepts.map(c=>`<div class="list-item"><b>${escapeHtml(c[0])}</b> <span class="badge">${c[1]} apariciones</span></div>`).join("")}</div>
 <div class="card"><b>Oposiciones</b><span class="concept-note">Ejes semánticos que organizan el conflicto del texto mediante pares conceptuales contrapuestos.</span>${opp.length?opp.map(o=>`<div class="list-item">${escapeHtml(o)}</div>`).join(""):"No detectadas"}</div>
 <div class="card"><b>Balance léxico</b><span class="concept-note">Conteo neto de términos positivos y negativos del diccionario; no constituye análisis de sentimiento calibrado.</span><div class="metric-line"><span class="metric-label">${polLabel}</span><span class="metric-value">+${pos} / -${neg}</span></div></div>`;
}
const stateDescriptions={
 ser:"Identidad, valores y umbrales no negociables.",
 estar:"Condiciones, posición y contexto de inserción.",
 decir:"Capacidad discursiva, narrativa y de representación.",
 hacer:"Agencia, intervención y disposición a actuar."
};
function stateCards(states,compact=false){return ["ser","estar","decir","hacer"].map(k=>`<div class="state"><b>${k.toUpperCase()}</b><strong>${Math.round(states[k]*100)}</strong><div class="bar"><i style="width:${Math.round(states[k]*100)}%"></i></div>${compact?"":`<span class="state-help">${stateDescriptions[k]}</span>`}</div>`).join("");}
function transferActors(){if(!detectedActors.length)return;const tbody=document.querySelector("#actors tbody");tbody.innerHTML=detectedActors.map(a=>`<tr><td><input value="${escapeHtml(a.name)}"></td><td><input type="number" value="${a.x}"></td><td><input type="number" value="${a.c}"></td><td><input type="number" step="0.1" value="${a.s}"></td><td><input type="number" step="0.1" value="${a.r}"></td><td><input type="number" step="0.1" value="${a.rho}"></td><td><input type="number" step="0.1" min="0" value="${a.uncertainty}"></td><td><input type="number" step="0.01" value="${a.states.ser.toFixed(3)}"></td><td><input type="number" step="0.01" value="${a.states.estar.toFixed(3)}"></td><td><input type="number" step="0.01" value="${a.states.decir.toFixed(3)}"></td><td><input type="number" step="0.01" value="${a.states.hacer.toFixed(3)}"></td></tr>`).join("");focalActorId=0;refreshFocalSelector();simulate();}


function refreshFocalSelector(){
 const select=document.getElementById("focalActor");
 const rows=[...document.querySelectorAll("#actors tbody tr")];
 const previous=Number.isInteger(focalActorId)?focalActorId:0;
 select.innerHTML=rows.map((row,index)=>{
  const name=row.querySelector("input")?.value.trim()||`Actor ${index+1}`;
  return `<option value="${index}">${escapeHtml(name)}</option>`;
 }).join("");
 focalActorId=Math.min(previous,Math.max(0,rows.length-1));
 select.value=String(focalActorId);
}
function getFocalActorId(){
 const select=document.getElementById("focalActor");
 const value=Number(select.value);
 return Number.isInteger(value)?value:0;
}
function getSimulationSeed(){
 const value=document.getElementById("simulationSeed").value.trim();
 return value||"FD-2026";
}
