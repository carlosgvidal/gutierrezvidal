function generateReport(){
 const out=document.getElementById("out").innerText.trim();
 const actors=readActors(),issue=getStrategicIssue();
 if(!issue||actors.length<2){
  document.getElementById("reportView").innerHTML=`<div class="card epistemic-warning"><b>Informe no generado</b><span class="concept-note">${!issue?"Falta declarar la cuestión estratégica. ":""}${actors.length<2?"Se requieren al menos dos actores con x conocido.":""} Limes no sustituye información desconocida por neutralidad.</span></div>`;
  return;
 }
 focalActorId=getFocalActorId();
 const seed=getSimulationSeed();
 const signature=actorSignature(actors)+"|issue:"+issue;
 const result=lastEngine&&lastEngine.signature===signature&&lastEngine.focalId===focalActorId&&lastEngine.seed===seed?lastEngine:buildSimulationResult(actors,500,focalActorId,seed);
 lastEngine=result;
 const finalA=result.engine.actors;
 const eq=result.engine.finalEquilibrium;
 const executiveSummary=buildExecutiveSummary(result);
 const report=`INFORME DE CONSULTORÍA — LIMES
================================

1. RESUMEN EJECUTIVO\n\nCuestión estratégica: ${issue}\n\n${executiveSummary}

2. RECOMENDACIONES PARA LA TOMA DE DECISIONES

Las siguientes recomendaciones se derivan de las condiciones específicas observadas en esta simulación y están ordenadas de mayor a menor prioridad. No constituyen una plantilla fija: cambian si cambian los datos de entrada.

${reportRecommendations(result.recommendations)}

3. LECTURA DEL ESCENARIO

El punto de convergencia (${result.conv.toFixed(2)} en la escala de 0 a 100) se refiere exclusivamente a «${issue}» y es la posición hacia la que gravita el conjunto del sistema una vez que todos los actores negocian, forman coaliciones y evalúan amenazas entre sí. El puntaje de concentración (${result.concentration.toFixed(1)}%) indica qué tan agrupados terminan los actores alrededor de ese punto: valores altos sugieren consenso, valores bajos sugieren polarización persistente.

El sistema ${eq.stable?`alcanzó un estado estacionario tras ${eq.iteration} iteración${eq.iteration===1?"":"es"}`:`no alcanzó un estado estacionario tras las ${eq.iteration} iteraciones ejecutadas`}, lo que ${eq.stable?"da mayor certeza al escenario descrito":"significa que el escenario sigue en movimiento y conviene reevaluarlo con información nueva antes de tomar decisiones irreversibles"}.

Desplazamientos de cada actor entre su posición inicial y el cierre de la simulación:
${finalA.map((a,i)=>"- "+a.n+": "+result.input[i].x.toFixed(1)+" → "+a.x.toFixed(1)+(i===result.focalId?" (actor focal)":"")).join("\n")}

4. ANEXO TÉCNICO

Este anexo contiene los datos crudos que sustentan las secciones anteriores, para quien desee auditar el cálculo. No es necesario leerlo para actuar sobre las recomendaciones.

4.1 Diagnóstico semiótico del texto de origen

${out}

4.2 Relaciones extraídas del texto

El sistema no realiza análisis sintáctico completo: en oraciones largas o con cláusulas subordinadas puede vincular incorrectamente sujeto y objeto. Se listan primero las relaciones de confianza igual o mayor a 0.70.

${(()=>{const highConf=detectedRelations.filter(r=>r.confidence>=0.7);const lowConf=detectedRelations.filter(r=>r.confidence<0.7);let text=highConf.length?highConf.map(r=>"- "+r.source+" → "+r.target+" | tipo="+r.type+" | verbo="+r.verb+" | negación="+(r.negated?"sí":"no")+" | confianza="+r.confidence.toFixed(2)).join("\n"):"No se detectaron relaciones de alta confianza entre actores.";if(lowConf.length){text+="\n\nRelaciones de menor confianza (<0.70), requieren revisión manual:\n";text+=lowConf.map(r=>"- "+r.source+" → "+r.target+" | tipo="+r.type+" | verbo="+r.verb+" | negación="+(r.negated?"sí":"no")+" | confianza="+r.confidence.toFixed(2)).join("\n");}return text;})()}

4.3 Configuración del escenario

issue = ${issue} · x = posición estratégica respecto de issue (0–100; desconocido no equivale a 50) · v = valencia discursiva (−1 a +1) · c = capacidad relativa · s = saliencia (0–1) · r = rigidez (0.6–2) · ρ = perfil de riesgo (0.5–2) · σ = incertidumbre individual (0–3) · Ser/Estar/Decir/Hacer = composición semiótica normalizada a 1.

${result.input.map(a=>"- "+a.n+" | x="+a.x.toFixed(2)+" v="+a.v.toFixed(2)+" c="+a.c+" s="+a.s+" r="+a.r+" ρ="+a.rho+" σ="+a.uncertainty+" | Ser="+a.states.ser.toFixed(3)+" Estar="+a.states.estar.toFixed(3)+" Decir="+a.states.decir.toFixed(3)+" Hacer="+a.states.hacer.toFixed(3)).join("\n")}

4.4 Actor focal — datos crudos

Actor: ${result.focalFinal.n}
Posición inicial → final: ${result.focalInput.x.toFixed(2)} → ${result.focalFinal.x.toFixed(2)}
Distancia a convergencia: ${Math.abs(result.focalFinal.x-result.conv).toFixed(2)}
Amenazas recibidas: ${result.focalThreatsReceived.length} · Amenazas emitidas: ${result.focalThreatsIssued.length} · Negociaciones vinculadas: ${result.focalNegotiations.length}

4.5 Incertidumbre (Monte Carlo)

Semilla: ${result.mc.seed} · Simulaciones: ${result.mc.runs}
Convergencia media: ${result.mc.mean.toFixed(2)} · Intervalo 90%: ${result.mc.p05.toFixed(2)} – ${result.mc.p95.toFixed(2)} · Desviación estándar: ${result.mc.sd.toFixed(2)} · Robustez numérica: ${result.mc.robustness.toFixed(1)}%\nNota: robustez numérica no equivale a confianza epistemológica en la extracción de actores, relaciones o posiciones.

4.6 Acuerdos bilateralmente racionales

${result.negotiations.filter(p=>p.individualRationality).length?result.negotiations.filter(p=>p.individualRationality).map(p=>"- "+p.a+" ↔ "+p.b+" | viabilidad="+p.negotiation.toFixed(3)+" | ganancias="+p.gainA.toFixed(3)+"/"+p.gainB.toFixed(3)+" | punto="+p.bargainingPoint.toFixed(2)).join("\n"):"No se detectaron negociaciones bilateralmente racionales."}

4.7 Afinidades coalicionales

${result.strategy.coalitions.length?result.strategy.coalitions.map(c=>"- "+c.a+" + "+c.b+" ("+c.p+")").join("\n"):"No detectadas"}

4.8 Matriz de amenazas

${result.strategy.threats.length?result.strategy.threats.map(t=>"- "+t.from+" → "+t.to+" | EU="+t.eu.toFixed(3)+" | intensidad="+t.intensity.toFixed(3)+" | P(éxito)="+t.probability.toFixed(3)).join("\n"):"Sin amenazas con utilidad esperada positiva."}
`;
 document.getElementById("reportView").innerHTML=`<div class="card"><b>Informe de consultoría</b><pre style="white-space:pre-wrap;margin:10px 0 0;color:var(--ink-2);font:13px/1.6 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace">${escapeHtml(report)}</pre></div>`;
 const blob=new Blob([report],{type:"text/plain;charset=utf-8"});
 const a=document.createElement("a");
 a.href=URL.createObjectURL(blob);
 a.download="Informe_Fronteras_Dinamicas.txt";
 a.click();
 URL.revokeObjectURL(a.href);
}
