function actorSignature(actors){return JSON.stringify(actors.map(a=>({n:a.n,x:a.x,c:a.c,s:a.s,r:a.r,rho:a.rho,uncertainty:a.uncertainty,states:a.states})));}

function describeDominantState(state){
 const labels={ser:"identidad y valores",estar:"su posición institucional",decir:"su narrativa pública",hacer:"su capacidad de acción"};
 return labels[state]||state;
}
function buildExecutiveSummary(result){
 const focal=result.focalFinal;
 const initial=result.focalInput;
 const eq=result.engine.finalEquilibrium;
 const distance=Math.abs(focal.x-result.conv);
 const displacement=focal.x-initial.x;
 const dominantState=Object.entries(focal.states).sort((a,b)=>b[1]-a[1])[0][0];
 const strongestThreat=result.focalThreatsReceived[0]||null;
 const strongestIssued=result.focalThreatsIssued[0]||null;
 const bestNegotiation=result.focalNegotiations
  .filter(p=>p.individualRationality)
  .sort((a,b)=>b.negotiation-a.negotiation)[0]||null;
 const focalCoalitions=result.strategy.coalitions.filter(c=>c.a===focal.n||c.b===focal.n);
 const strongestCoalition=focalCoalitions.sort((a,b)=>Number(b.p)-Number(a.p))[0]||null;

 const sentences=[];

 sentences.push(`Este informe analiza la posición de ${focal.n} frente a ${result.input.length-1} actor${result.input.length-1===1?"":"es"} adicional${result.input.length-1===1?"":"es"} identificado${result.input.length-1===1?"":"s"} en el texto, con foco en ${describeDominantState(dominantState)} como rasgo dominante de su perfil actual.`);

 if(distance<5){
  sentences.push(`La posición de ${focal.n} ya coincide, dentro de un margen estrecho, con el punto hacia el que gravita el conjunto del sistema (${result.conv.toFixed(1)} en la escala de 0 a 100). No hay presión estructural para que se desplace.`);
 }else if(distance<15){
  sentences.push(`${focal.n} se ubica a una distancia moderada (${distance.toFixed(1)} puntos) del punto de convergencia del sistema (${result.conv.toFixed(1)}), lo que sugiere ajustes menores más que un cambio de postura.`);
 }else{
  const direction=focal.x<result.conv?"hacia una posición más próxima al consenso emergente":"hacia una posición más moderada frente al resto de los actores";
  sentences.push(`${focal.n} se encuentra a ${distance.toFixed(1)} puntos del punto hacia el que converge el sistema (${result.conv.toFixed(1)}), una distancia considerable que implica presión creciente para moverse ${direction} si no cuenta con capacidad suficiente para sostener su posición actual.`);
 }

 if(strongestThreat){
  const attacker=strongestThreat.from;
  if(bestNegotiation&&(bestNegotiation.a===attacker||bestNegotiation.b===attacker)){
   sentences.push(`${attacker} tiene incentivos calculados para desafiar esta posición, pero existe una vía de negociación bilateralmente favorable entre ambos alrededor de ${bestNegotiation.bargainingPoint.toFixed(1)}, lo que abre una salida negociada antes de que el conflicto se materialice.`);
  }else{
   sentences.push(`${attacker} concentra la mayor presión de desafío contra ${focal.n} y no se detectó, por ahora, una negociación que beneficie a ambas partes simultáneamente. Este es el foco de riesgo más urgente del análisis.`);
  }
 }else{
  sentences.push(`No se detectaron actores con incentivos calculados para desafiar directamente la posición de ${focal.n} en este momento.`);
 }

 if(strongestCoalition){
  const partner=strongestCoalition.a===focal.n?strongestCoalition.b:strongestCoalition.a;
  sentences.push(`Su afinidad estratégica más fuerte es con ${partner}, un vínculo que puede consolidarse para ganar capacidad conjunta frente a terceros.`);
 }

 if(!eq.stable){
  sentences.push(`El sistema aún no alcanzó un estado estacionario tras ${eq.iteration} iteraciones de cálculo, por lo que el escenario descrito debe leerse como una tendencia en curso, no como un desenlace cerrado.`);
 }

 if(result.mc.robustness<70){
  sentences.push(`La prueba de robustez (Monte Carlo, ${result.mc.runs} simulaciones) muestra dispersión considerable en los resultados posibles —intervalo de ${result.mc.p05.toFixed(1)} a ${result.mc.p95.toFixed(1)}—, por lo que cualquier decisión debería contemplar más de un escenario y no fijarse rígidamente al punto medio.`);
 }else{
  sentences.push(`La prueba de robustez (Monte Carlo, ${result.mc.runs} simulaciones) confirma que este resultado es estable frente a variaciones razonables en los datos de entrada (${result.mc.robustness.toFixed(0)}% de robustez), lo que da mayor confianza para actuar sobre esta lectura.`);
 }

 const topRecommendation=result.recommendations&&result.recommendations[0];
 if(topRecommendation){
  sentences.push(`Recomendación principal: ${topRecommendation.action}`);
 }

 return sentences.join(" ");
}
function buildCausalRecommendations(result){
 const recs=[];
 const focal=result.focalFinal;
 const initial=result.focalInput;
 const eq=result.engine.finalEquilibrium;
 const distance=Math.abs(focal.x-result.conv);
 const displacement=focal.x-initial.x;
 const dominantState=Object.entries(focal.states).sort((a,b)=>b[1]-a[1])[0][0];
 const focalCoalitions=result.strategy.coalitions.filter(c=>c.a===focal.n||c.b===focal.n);
 const strongestThreat=result.focalThreatsReceived[0]||null;
 const strongestIssued=result.focalThreatsIssued[0]||null;
 const bestNegotiation=result.focalNegotiations
  .filter(p=>p.individualRationality)
  .sort((a,b)=>b.negotiation-a.negotiation)[0]||null;

 if(strongestThreat){
  const attacker=strongestThreat.from;
  if(bestNegotiation&&(bestNegotiation.a===attacker||bestNegotiation.b===attacker)){
   recs.push({
    cause:`${attacker} presenta una utilidad esperada de desafío de ${strongestThreat.eu.toFixed(3)}, pero existe una negociación bilateralmente racional con intensidad ${bestNegotiation.negotiation.toFixed(3)}.`,
    action:`Abrir negociación prioritaria con ${attacker} alrededor del punto ${bestNegotiation.bargainingPoint.toFixed(2)} para reducir la ventaja esperada del conflicto.`,
    priority:"alta"
   });
  }else{
   recs.push({
    cause:`${attacker} concentra la amenaza recibida más intensa: EU ${strongestThreat.eu.toFixed(3)}, probabilidad de éxito ${strongestThreat.probability.toFixed(3)} e intensidad ${strongestThreat.intensity.toFixed(3)}.`,
    action:`Elevar el costo del desafío para ${attacker}, reducir su probabilidad de prevalecer o construir apoyo con actores próximos antes de modificar la posición del actor focal.`,
    priority:"crítica"
   });
  }
 }

 if(distance>15){
  const direction=focal.x<result.conv?"aumentar":"reducir";
  recs.push({
   cause:`El actor focal termina a ${distance.toFixed(2)} puntos del centro de convergencia ${result.conv.toFixed(2)}.`,
   action:`Evaluar ${direction} gradualmente su posición hacia el intervalo ${Math.max(0,result.conv-5).toFixed(1)}–${Math.min(100,result.conv+5).toFixed(1)}, salvo que esa concesión incremente una amenaza recibida.`,
   priority:"alta"
  });
 }else if(distance>7){
  recs.push({
   cause:`La distancia del actor focal al punto de convergencia es moderada (${distance.toFixed(2)}).`,
   action:`Mantener la posición central y realizar ajustes menores, condicionados a la evolución de amenazas y negociaciones.`,
   priority:"media"
  });
 }else{
  recs.push({
   cause:`El actor focal se encuentra próximo al punto de convergencia: distancia ${distance.toFixed(2)}.`,
   action:`Evitar desplazamientos amplios; preservar la posición y utilizarla como ventaja de mediación.`,
   priority:"media"
  });
 }

 if(bestNegotiation){
  const counterpart=bestNegotiation.a===focal.n?bestNegotiation.b:bestNegotiation.a;
  const focalGain=bestNegotiation.a===focal.n?bestNegotiation.gainA:bestNegotiation.gainB;
  recs.push({
   cause:`La negociación más favorable vincula al actor focal con ${counterpart}; ganancia propia ${focalGain.toFixed(3)} y punto de acuerdo ${bestNegotiation.bargainingPoint.toFixed(2)}.`,
   action:`Priorizar una oferta escalonada hacia ${bestNegotiation.bargainingPoint.toFixed(2)}, preservando como límite la utilidad esperada del conflicto.`,
   priority:"alta"
  });
 }

 if(focalCoalitions.length){
  const strongest=focalCoalitions.sort((a,b)=>Number(b.p)-Number(a.p))[0];
  const partner=strongest.a===focal.n?strongest.b:strongest.a;
  recs.push({
   cause:`La afinidad coalicional bilateral más alta del actor focal es con ${partner}, con fuerza ${strongest.p}.`,
   action:`Consolidar coordinación con ${partner} para aumentar capacidad conjunta y modificar la probabilidad relativa de éxito frente a amenazas externas.`,
   priority:"media"
  });
 }else{
  recs.push({
   cause:"El actor focal no presenta afinidades coalicionales bilaterales por encima del umbral.",
   action:"Explorar alianzas con el actor más próximo en posición y con suficiente capacidad para alterar el balance estratégico.",
   priority:"media"
  });
 }

 if(!eq.stable){
  recs.push({
   cause:`El sistema no alcanzó un estado estacionario después de ${eq.iteration} iteraciones; movimiento residual ${eq.movement.toFixed(4)} y cambio de estados ${eq.stateChange.toFixed(4)}.`,
   action:"No fijar una posición definitiva. Mantener revisión iterativa y condicionar decisiones irreversibles a una caída sostenida del movimiento residual y del cambio de estados.",
   priority:"alta"
  });
 }

 if(result.mc.robustness<70){
  recs.push({
   cause:`El puntaje de robustez frente a incertidumbre es bajo (${result.mc.robustness.toFixed(1)}%) y el intervalo 90% abarca ${result.mc.p05.toFixed(2)}–${result.mc.p95.toFixed(2)}.`,
   action:"Trabajar con escenarios múltiples, ampliar márgenes de seguridad y evitar decisiones dependientes de un único punto de convergencia.",
   priority:"alta"
  });
 }else if(result.mc.robustness>88){
  recs.push({
   cause:`El puntaje de robustez frente a perturbaciones es alto (${result.mc.robustness.toFixed(1)}%).`,
   action:"Usar la convergencia media como referencia operativa, manteniendo vigilancia sobre cambios de capacidad y saliencia.",
   priority:"media"
  });
 }

 if(dominantState==="ser"&&focal.r>1.2){
  recs.push({
   cause:`El actor focal está dominado por Ser (${(focal.states.ser*100).toFixed(1)}%) y presenta rigidez ${focal.r.toFixed(2)}.`,
   action:"Evitar concesiones que se perciban como renuncia identitaria; desplazar la negociación hacia Decir o Hacer, donde el costo ontológico sea menor.",
   priority:"alta"
  });
 }else if(dominantState==="hacer"){
  recs.push({
   cause:`Hacer es el estado dominante del actor focal (${(focal.states.hacer*100).toFixed(1)}%).`,
   action:"Convertir capacidad de acción en compromisos verificables y secuenciados, evitando que la agencia eleve innecesariamente la intensidad de amenazas emitidas.",
   priority:"media"
  });
 }else if(dominantState==="decir"){
  recs.push({
   cause:`Decir es el estado dominante del actor focal (${(focal.states.decir*100).toFixed(1)}%).`,
   action:"Intervenir mediante narrativa, señalización y encuadre antes de modificar recursos o posición material.",
   priority:"media"
  });
 }else if(dominantState==="estar"){
  recs.push({
   cause:`Estar es el estado dominante del actor focal (${(focal.states.estar*100).toFixed(1)}%).`,
   action:"Modificar condiciones de contexto, acceso o inserción institucional antes de intentar un desplazamiento discursivo.",
   priority:"media"
  });
 }

 if(strongestIssued&&strongestIssued.eu>0){
  recs.push({
   cause:`El actor focal también proyecta una amenaza contra ${strongestIssued.to}, con EU ${strongestIssued.eu.toFixed(3)}.`,
   action:`Revisar si ese desafío mejora realmente la posición final; si no reduce distancia a convergencia ni fortalece afinidades coalicionales, contenerlo.`,
   priority:"media"
  });
 }

 return recs.slice(0,8);
}
function renderRecommendations(recommendations){
 return recommendations.map((r,index)=>`<div class="list-item"><b>${index+1}. ${escapeHtml(r.action)}</b> <span class="badge">${escapeHtml(r.priority)}</span><small>Causa: ${escapeHtml(r.cause)}</small></div>`).join("");
}
function reportRecommendations(recommendations){
 const properNouns=new Set(["Ser","Estar","Decir","Hacer"]);
 return recommendations.map((r,index)=>{
  const firstWord=r.cause.split(" ")[0].replace(/[.,;:]$/,"");
  const causeLower=properNouns.has(firstWord)?r.cause:r.cause.charAt(0).toLowerCase()+r.cause.slice(1);
  return `${index+1}. [Prioridad ${r.priority}] ${r.action} Esto se debe a que ${causeLower}`;
 }).join("\n\n");
}
