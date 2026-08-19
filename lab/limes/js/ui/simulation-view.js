function renderSimulation(result){
 const {input,engine,conv,concentration,state,strategy,negotiations,mc,focalInput,focalFinal,focalThreatsReceived,focalThreatsIssued,focalNegotiations}=result;
 const finalA=engine.actors;
 const eq=engine.finalEquilibrium;
 document.getElementById("sim").innerHTML=`<div class="card"><b>Convención metodológica</b><span class="concept-note">Las métricas compuestas de esta versión se presentan como puntajes o medidas heurísticas. Sólo las utilidades esperadas conservan interpretación formal dentro del modelo; ninguna cifra se presenta como probabilidad empíricamente calibrada salvo que se indique expresamente.</span></div><div class="card"><b>Motor dinámico</b><span class="concept-note">Síntesis del ciclo causal completo. Los estados estratégicos influyen en negociación, coaliciones y amenazas; la negociación compara acuerdo y conflicto, mientras la amenaza surge sólo cuando desafiar mejora la utilidad frente al statu quo.</span>
 <div class="metric-line"><span class="metric-label">Punto de convergencia</span><span class="metric-value">${conv.toFixed(2)}</span><span class="metric-help">Posición agregada hacia la que gravita el sistema, ponderada por capacidad y saliencia.</span></div>
 <div class="metric-line"><span class="metric-label">Puntaje de concentración</span><span class="metric-value">${concentration.toFixed(1)}</span><span class="metric-help">Medida heurística de dispersión espacial alrededor del punto de convergencia; no representa una probabilidad.</span></div>
 <div class="metric-line"><span class="metric-label">Estado estacionario</span><span class="metric-value">${eq.stable?"alcanzado":"no alcanzado"} · ${eq.iteration} iteración${eq.iteration===1?"":"es"}</span><span class="metric-help">Condición operacional alcanzada cuando movimiento, cambio de estados y amenaza activa caen bajo umbrales internos; no implica equilibrio de Nash.</span></div>
 <span class="flow">Entrada → normalización → estados → estrategia → acuerdos → afinidades → amenazas → transición → posiciones → estado estacionario</span><div class="state-grid">${stateCards(state)}</div></div>
 <div class="card focal-card"><b>Actor focal</b><span class="concept-note">Lectura estratégica específica del actor seleccionado.</span>
 <div class="metric-line"><span class="metric-label">Actor</span><span class="metric-value">${escapeHtml(focalFinal.n)}</span></div>
 <div class="metric-line"><span class="metric-label">Posición</span><span class="metric-value">${focalInput.x.toFixed(2)} → ${focalFinal.x.toFixed(2)}</span><span class="metric-help">Desplazamiento neto: ${(focalFinal.x-focalInput.x).toFixed(2)}</span></div>
 <div class="metric-line"><span class="metric-label">Distancia a convergencia</span><span class="metric-value">${Math.abs(focalFinal.x-conv).toFixed(2)}</span></div>
 <div class="metric-line"><span class="metric-label">Amenazas recibidas</span><span class="metric-value">${focalThreatsReceived.length}</span></div>
 <div class="metric-line"><span class="metric-label">Amenazas emitidas</span><span class="metric-value">${focalThreatsIssued.length}</span></div>
 <div class="metric-line"><span class="metric-label">Negociaciones vinculadas</span><span class="metric-value">${focalNegotiations.length}</span></div>
 <div class="metric-line"><span class="metric-label">Incertidumbre individual</span><span class="metric-value">${focalInput.uncertainty.toFixed(2)}</span></div>
 </div>
 <div class="card"><b>Desplazamientos</b><span class="concept-note">Cambio de posición de cada actor entre la entrada normalizada y el cierre del ciclo.</span>${finalA.map((a,i)=>`<div class="list-item">${escapeHtml(a.n)}: ${input[i].x.toFixed(1)} → <b>${a.x.toFixed(1)}</b>${i===result.focalId?' <span class="badge focal-badge">focal</span>':''}</div>`).join("")}</div>
 <div class="card"><b>Acuerdos bilateralmente racionales</b><span class="concept-note">Acuerdos que mejoran la utilidad de ambos actores frente al conflicto esperado. El puntaje de viabilidad combina compatibilidad espacial, ganancia conjunta y racionalidad individual.</span>${negotiations.filter(p=>p.individualRationality).length?negotiations.filter(p=>p.individualRationality).map(p=>`<div class="list-item">${escapeHtml(p.a)} ↔ ${escapeHtml(p.b)} <span class="badge">viabilidad ${p.negotiation.toFixed(3)}</span><small>Ganancia: ${p.gainA.toFixed(3)} / ${p.gainB.toFixed(3)} · punto ${p.bargainingPoint.toFixed(2)}</small></div>`).join(""):"Ninguna negociación mejora simultáneamente la utilidad de ambos actores."}</div>
 <div class="card"><b>Afinidades coalicionales</b><span class="concept-note">Proximidades estratégicas bilaterales estimadas por distancia y poder conjunto; no equivalen por sí mismas a coaliciones constituidas.</span>${strategy.coalitions.length?strategy.coalitions.map(c=>`<div class="list-item">${escapeHtml(c.a)} + ${escapeHtml(c.b)} <span class="badge">${c.p}</span></div>`).join(""):"Ninguna"}</div>
 <div class="card"><b>Matriz de amenazas causal</b><span class="concept-note">Desafíos direccionales con utilidad esperada positiva. Cada amenaza compara éxito, fracaso, costo y statu quo, ponderados por probabilidad de prevalecer.</span>${strategy.threats.length?strategy.threats.map(t=>`<div class="list-item">${escapeHtml(t.from)} → ${escapeHtml(t.to)} <span class="badge">EU ${t.eu.toFixed(3)}</span><small>Intensidad ${t.intensity.toFixed(3)} · P(éxito) ${t.probability.toFixed(3)} · éxito ${t.success.toFixed(3)} · fracaso ${t.failure.toFixed(3)} · costo ${t.cost.toFixed(3)} · statu quo ${t.statusQuo.toFixed(3)}</small></div>`).join(""):"Sin amenazas con utilidad esperada positiva."}</div>
 <div class="card focal-card"><b>Recomendaciones causales</b><span class="concept-note">Acciones derivadas de relaciones específicas entre actor focal, amenazas, negociación, coaliciones, convergencia, equilibrio e incertidumbre.</span>${renderRecommendations(result.recommendations)}</div>
 <div class="card"><b>Monte Carlo (500 simulaciones)</b><span class="concept-note">Prueba reproducible con incertidumbre individual por actor. La misma semilla y los mismos datos producen exactamente el mismo resultado.</span>
 <div class="metric-line"><span class="metric-label">Semilla</span><span class="metric-value">${escapeHtml(mc.seed)}</span><span class="metric-help">Identificador del generador pseudoaleatorio reproducible.</span></div>
 <div class="metric-line"><span class="metric-label">Convergencia media</span><span class="metric-value">${mc.mean.toFixed(2)}</span><span class="metric-help">Promedio de los puntos de convergencia obtenidos.</span></div>
 <div class="metric-line"><span class="metric-label">Intervalo 90%</span><span class="metric-value">${mc.p05.toFixed(2)} – ${mc.p95.toFixed(2)}</span><span class="metric-help">Rango central que contiene el 90% de los resultados simulados.</span></div>
 <div class="metric-line"><span class="metric-label">Desviación estándar</span><span class="metric-value">${mc.sd.toFixed(2)}</span><span class="metric-help">Dispersión de los resultados alrededor de la convergencia media.</span></div>
 <div class="metric-line"><span class="metric-label">Puntaje de robustez Monte Carlo</span><span class="metric-value">${mc.robustness.toFixed(1)}</span><span class="metric-help">Transformación heurística de la dispersión Monte Carlo; no representa una probabilidad calibrada.</span></div>
 </div>`;
 drawEngine(finalA,conv,engine.history);
}
function simulate(){
 const actors=readActors();
 if(!actors.length){
  lastEngine=null;
  document.getElementById("sim").innerHTML='<div class="card">No hay actores válidos para simular.</div>';
  document.getElementById("g").innerHTML="";
  return;
 }
 focalActorId=getFocalActorId();
 const seed=getSimulationSeed();
 lastEngine=buildSimulationResult(actors,500,focalActorId,seed);
 renderSimulation(lastEngine);
}
function assignLabelSides(items,minGap){
 const sorted=[...items].sort((a,b)=>a.x-b.x);
 const topLane=[],bottomLane=[];
 const sides=new Map(),lanes=new Map();
 sorted.forEach((item,idx)=>{
  const side=idx%2===0?"top":"bottom";
  const laneArr=side==="top"?topLane:bottomLane;
  let lane=0,placed=false;
  for(let l=0;l<laneArr.length;l++){
   if(item.x-laneArr[l]>=minGap){laneArr[l]=item.x;lane=l;placed=true;break;}
  }
  if(!placed){laneArr.push(item.x);lane=laneArr.length-1;}
  sides.set(item.i,side);
  lanes.set(item.i,lane);
 });
 return {sides,lanes,topLaneCount:Math.max(1,topLane.length),bottomLaneCount:Math.max(1,bottomLane.length)};
}
const actorTypeColor={
 "país":{fill:"#E4D9C4",stroke:"#8A6D3B"},
 "institución":{fill:"#DCE3D8",stroke:"#4B6455"},
 "persona":{fill:"#EAD9D4",stroke:"#A3402A"},
 "colectivo":{fill:"#DDE1E8",stroke:"#3D5170"},
 "actor":{fill:"#EDE9DC",stroke:"#1F2A24"}
};
function drawEngine(A,conv,history){
 const svg=document.getElementById("g");
 const laneItems=A.map((a,i)=>({i,x:a.x*5}));
 const estimatedWidth=A.reduce((max,a)=>Math.max(max,a.n.length*5.3+14),40);
 const {sides,lanes,topLaneCount,bottomLaneCount}=assignLabelSides(laneItems,estimatedWidth);
 const laneStep=16;
 const topSpace=topLaneCount*laneStep+22;
 const bottomSpace=bottomLaneCount*laneStep+30;
 const axisY=topSpace;
 const svgHeight=topSpace+bottomSpace;
 svg.setAttribute("viewBox",`0 0 500 ${svgHeight}`);
 svg.innerHTML="";
 let gridLines="";
 for(let gx=50;gx<500;gx+=50){gridLines+=`<line x1="${gx}" y1="${axisY-topSpace+14}" x2="${gx}" y2="${axisY+bottomSpace-14}" stroke="#D6CFB9" stroke-width="1"/>`;}
 svg.innerHTML+=gridLines;
 svg.innerHTML+=`<line x1="0" y1="${axisY}" x2="500" y2="${axisY}" stroke="#1F2A24" stroke-width="1.5"/>`;
 svg.innerHTML+=`<text x="4" y="${svgHeight-8}" fill="#6B7568" font-family="ui-monospace, SF Mono, Consolas, monospace" font-size="9" font-weight="600">0 · tradición / conservador</text>`;
 svg.innerHTML+=`<text x="496" y="${svgHeight-8}" fill="#6B7568" font-family="ui-monospace, SF Mono, Consolas, monospace" font-size="9" font-weight="600" text-anchor="end">innovación / disruptivo · 100</text>`;
 A.forEach((a,i)=>{
  const pts=history.map((h,t)=>{const px=h[i].x*5;const py=axisY-(t/(history.length-1||1))*(topSpace-16)-8;return `${px},${py}`;});
  svg.innerHTML+=`<polyline points="${pts.join(" ")}" fill="none" stroke="#4B6455" stroke-width="1.3" opacity=".38" stroke-dasharray="2,3"/>`;
 });
 A.forEach((a,i)=>{
  const side=sides.get(i);
  const lane=lanes.get(i)||0;
  const labelY=side==="top"?axisY-14-lane*laneStep:axisY+22+lane*laneStep;
  const lineY2=side==="top"?labelY+6:labelY-9;
  const colors=actorTypeColor[a.type]||actorTypeColor.actor;
  svg.innerHTML+=`<line x1="${a.x*5}" y1="${axisY}" x2="${a.x*5}" y2="${lineY2}" stroke="#AFA68D" stroke-width="1"/>`;
  svg.innerHTML+=`<circle cx="${a.x*5}" cy="${axisY}" r="${6+a.cn*22}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="1.6"/>`;
  svg.innerHTML+=`<text x="${a.x*5}" y="${labelY}" fill="#1F2A24" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="650" text-anchor="middle">${escapeHtml(a.n)}</text>`;
 });
 svg.innerHTML+=`<line x1="${conv*5}" y1="${axisY-topSpace+10}" x2="${conv*5}" y2="${axisY+bottomSpace-18}" stroke="#A3402A" stroke-width="2"/>`;
 svg.innerHTML+=`<rect x="${conv*5-20}" y="${axisY-topSpace+2}" width="40" height="13" fill="#A3402A" rx="2"/>`;
 svg.innerHTML+=`<text x="${conv*5}" y="${axisY-topSpace+11}" fill="#F2EFE6" font-family="ui-monospace, SF Mono, Consolas, monospace" font-size="9" font-weight="700" text-anchor="middle">${conv.toFixed(1)}</text>`;
}
