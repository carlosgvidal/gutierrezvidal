function buildSimulationResult(inputActors,runs=500,focalId=0,seed="FD-2026"){
 const engine=runSimulationCycle(inputActors,12);
 const conv=convergence(engine.actors);
 const concentration=concentrationScore(engine.actors,conv);
 const state=systemState(engine.actors);
 const strategy=summarizeStrategy(engine.finalPairs);
 const negotiations=engine.finalPairs
  .filter(p=>p.negotiation>0)
  .sort((a,b)=>b.negotiation-a.negotiation)
  .slice(0,10);
 const mc=monteCarlo(inputActors,runs,seed);
 const normalizedInput=normalizeActors(inputActors);
 const safeFocalId=Math.min(Math.max(0,focalId),Math.max(0,normalizedInput.length-1));
 const focalInput=normalizedInput[safeFocalId];
 const focalFinal=engine.actors[safeFocalId];
 const focalThreatsReceived=strategy.threats.filter(t=>t.to===focalFinal?.n);
 const focalThreatsIssued=strategy.threats.filter(t=>t.from===focalFinal?.n);
 const focalNegotiations=negotiations.filter(p=>p.a===focalFinal?.n||p.b===focalFinal?.n);
 const result={
  signature:actorSignature(inputActors),
  input:normalizedInput,
  engine,conv,concentration,state,strategy,negotiations,mc,seed:String(seed),
  focalId:safeFocalId,
  focalInput,focalFinal,
  focalThreatsReceived,focalThreatsIssued,focalNegotiations
 };
 result.recommendations=buildCausalRecommendations(result);
 return result;
}
