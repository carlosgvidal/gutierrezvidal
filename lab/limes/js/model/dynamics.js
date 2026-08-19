function readActors(){
 const rows=[...document.querySelectorAll("#actors tbody tr")];
 return rows.map((r,index)=>{
  const i=r.querySelectorAll("input");
  const rawStates={
   ser:+i[8].value,
   estar:+i[9].value,
   decir:+i[10].value,
   hacer:+i[11].value
  };
  const states=normalizeStates({
   ser:Number.isFinite(rawStates.ser)?Math.max(0,rawStates.ser):.25,
   estar:Number.isFinite(rawStates.estar)?Math.max(0,rawStates.estar):.25,
   decir:Number.isFinite(rawStates.decir)?Math.max(0,rawStates.decir):.25,
   hacer:Number.isFinite(rawStates.hacer)?Math.max(0,rawStates.hacer):.25
  });
  return {
   id:index,
   n:i[0].value.trim(),
   x:i[1].value.trim()===""?null:+i[1].value,
   xConfidence:Number(r.dataset.xConfidence||0),
   xMethod:r.dataset.xMethod||"manual",
   xSource:r.dataset.inferred==="true"?"inferido":"manual",
   v:+i[2].value,
   c:+i[3].value,
   s:+i[4].value,
   r:+i[5].value,
   rho:+i[6].value,
   uncertainty:+i[7].value,
   states
  };
 }).filter(a=>a.n&&Number.isFinite(a.x)&&Number.isFinite(a.v)&&Number.isFinite(a.c)&&Number.isFinite(a.s)&&Number.isFinite(a.r)&&Number.isFinite(a.rho)&&Number.isFinite(a.uncertainty)&&a.c>0);
}
function normalizeActors(actors){
 const total=actors.reduce((sum,a)=>sum+a.c,0);
 return actors.map((a,index)=>({
  ...a,
  id:Number.isInteger(a.id)?a.id:index,
  x:clamp(a.x/100)*100,
  v:clamp(Number.isFinite(a.v)?a.v:0,-1,1),
  c:Math.max(1,a.c),
  cn:a.c/Math.max(1,total),
  s:clamp(a.s,.2,1),
  r:clamp(a.r,.6,2),
  rho:clamp(a.rho,.5,2),
  uncertainty:clamp(a.uncertainty,0,3),
  states:normalizeStates({
   ser:Math.max(0,a.states?.ser??.25),
   estar:Math.max(0,a.states?.estar??.25),
   decir:Math.max(0,a.states?.decir??.25),
   hacer:Math.max(0,a.states?.hacer??.25)
  })
 }));
}
function normalizeStates(states){
 const total=Math.max(.000001,states.ser+states.estar+states.decir+states.hacer);
 return {ser:states.ser/total,estar:states.estar/total,decir:states.decir/total,hacer:states.hacer/total};
}
function utility(a,outcome){
 const d=Math.abs(a.x-outcome)/100;
 return 1-2*Math.pow(d,a.rho);
}
function interactionWeight(a,b){
 const distance=Math.abs(a.x-b.x)/100;
 const affinity=1-distance;
 return clamp((b.cn*b.s)*(.35+.65*affinity));
}
function pijCoalition(actors,i,j){
 const actorI=actors[i],actorJ=actors[j];
 let numerator=0,denominator=0;
 actors.forEach(k=>{
  const uKI=utility(k,actorI.x);
  const uKJ=utility(k,actorJ.x);
  const deltaU=uKI-uKJ;
  const weight=k.cn*k.s;
  if(deltaU>0)numerator+=weight*deltaU;
  denominator+=weight*Math.abs(deltaU);
 });
 return denominator===0?.5:numerator/denominator;
}
function evaluateStrategicField(actors){
 const pairs=[];
 const strategicWeight=actors.reduce((sum,a)=>sum+a.cn*a.s,0);
 const statusQuoPoint=strategicWeight?actors.reduce((sum,a)=>sum+a.x*a.cn*a.s,0)/strategicWeight:50;
 for(let i=0;i<actors.length;i++){
  for(let j=i+1;j<actors.length;j++){
   const a=actors[i],b=actors[j];
   const distance=Math.abs(a.x-b.x);
   const powerA=a.cn*a.s;
   const powerB=b.cn*b.s;
   const combinedPower=Math.max(.000001,powerA+powerB);
   const probabilityA=pijCoalition(actors,i,j);
   const probabilityB=pijCoalition(actors,j,i);
   const bargainingPoint=(a.x*powerA+b.x*powerB)/combinedPower;
   const compatibility=clamp(1-distance/40);

   const conflictCostA=.04+.06*(distance/100)*a.s;
   const conflictCostB=.04+.06*(distance/100)*b.s;
   const conflictUtilityA=probabilityA*utility(a,a.x)+probabilityB*utility(a,b.x)-conflictCostA;
   const conflictUtilityB=probabilityB*utility(b,b.x)+probabilityA*utility(b,a.x)-conflictCostB;
   const agreementUtilityA=utility(a,bargainingPoint);
   const agreementUtilityB=utility(b,bargainingPoint);
   const gainA=agreementUtilityA-conflictUtilityA;
   const gainB=agreementUtilityB-conflictUtilityB;
   const individualRationality=gainA>0&&gainB>0;
   const nashGain=individualRationality?Math.sqrt(gainA*gainB):0;
   const negotiation=clamp(
    compatibility*.30+
    clamp(nashGain/2)*.55+
    (individualRationality?.15:0)
   );

   const coalitionStrength=distance<=22?clamp(compatibility*.55+combinedPower*.45):0;

   const statusQuoA=utility(a,statusQuoPoint);
   const statusQuoB=utility(b,statusQuoPoint);
   const challengeCostA=.03+.07*(distance/100)*a.s+.04*(1-a.states.hacer);
   const challengeCostB=.03+.07*(distance/100)*b.s+.04*(1-b.states.hacer);
   const successUtilityA=utility(a,a.x);
   const failureUtilityA=utility(a,b.x);
   const successUtilityB=utility(b,b.x);
   const failureUtilityB=utility(b,a.x);
   const pTotal=Math.max(.000001,probabilityA+probabilityB);
   const contestProbabilityA=probabilityA/pTotal;
   const contestProbabilityB=probabilityB/pTotal;
   const expectedChallengeA=contestProbabilityA*successUtilityA+contestProbabilityB*failureUtilityA-challengeCostA;
   const expectedChallengeB=contestProbabilityB*successUtilityB+contestProbabilityA*failureUtilityB-challengeCostB;
   const threatEUA=expectedChallengeA-statusQuoA;
   const threatEUB=expectedChallengeB-statusQuoB;
   const threatAB=Math.max(0,threatEUA)*a.s*a.states.hacer*(1-negotiation);
   const threatBA=Math.max(0,threatEUB)*b.s*b.states.hacer*(1-negotiation);

   pairs.push({
    i,j,a:a.n,b:b.n,distance,bargainingPoint,
    probabilityA,probabilityB,contestProbabilityA,contestProbabilityB,statusQuoPoint,
    conflictUtilityA,conflictUtilityB,
    agreementUtilityA,agreementUtilityB,
    gainA,gainB,nashGain,individualRationality,
    statusQuoA,statusQuoB,
    challengeCostA,challengeCostB,
    successUtilityA,failureUtilityA,
    successUtilityB,failureUtilityB,
    expectedChallengeA,expectedChallengeB,
    threatEUA,threatEUB,
    negotiation,coalitionStrength,threatAB,threatBA,combinedPower
   });
  }
 }
 return pairs;
}
function aggregateStrategicEffects(actors,pairs){
 const effects=actors.map(()=>({negotiationPull:0,coalitionPull:0,threatPressure:0,threatProjection:0,weight:0,coalitionWeight:0}));
 pairs.forEach(p=>{
  const a=actors[p.i],b=actors[p.j];
  const pairWeight=Math.max(.000001,p.combinedPower);
  effects[p.i].negotiationPull+=(p.bargainingPoint-a.x)*p.negotiation*pairWeight;
  effects[p.j].negotiationPull+=(p.bargainingPoint-b.x)*p.negotiation*pairWeight;
  effects[p.i].weight+=p.negotiation*pairWeight;
  effects[p.j].weight+=p.negotiation*pairWeight;
  effects[p.i].coalitionPull+=(b.x-a.x)*p.coalitionStrength*b.cn;
  effects[p.j].coalitionPull+=(a.x-b.x)*p.coalitionStrength*a.cn;
  effects[p.i].coalitionWeight+=p.coalitionStrength*b.cn;
  effects[p.j].coalitionWeight+=p.coalitionStrength*a.cn;
  effects[p.i].threatProjection+=p.threatAB;
  effects[p.j].threatPressure+=p.threatAB;
  effects[p.j].threatProjection+=p.threatBA;
  effects[p.i].threatPressure+=p.threatBA;
 });
 return effects.map(e=>({
  negotiationPull:e.weight?e.negotiationPull/e.weight:0,
  coalitionPull:e.coalitionWeight?e.coalitionPull/e.coalitionWeight:0,
  threatPressure:clamp(e.threatPressure),
  threatProjection:clamp(e.threatProjection)
 }));
}
function transitionDynamic(actors,pairs){
 const effects=aggregateStrategicEffects(actors,pairs);
 const center=actors.reduce((sum,a)=>sum+a.x*a.cn,0);
 return actors.map((a,i)=>{
  let social={ser:0,estar:0,decir:0,hacer:0},wSum=0;
  actors.forEach((b,j)=>{if(i===j)return;const w=interactionWeight(a,b);wSum+=w;for(const k of ["ser","estar","decir","hacer"])social[k]+=b.states[k]*w;});
  if(wSum)for(const k of ["ser","estar","decir","hacer"])social[k]/=wSum;else social={...a.states};
  const pressure=clamp(Math.abs(a.x-center)/100);
  const rigidity=clamp((a.r-.6)/1.4);
  const agency=clamp(a.cn*a.s*actors.length);
  const strategic=effects[i];
  const S=a.states.ser,E=a.states.estar,D=a.states.decir,H=a.states.hacer;
  const states=normalizeStates({
   ser:clamp(.66*S+.10*E+.07*D+.04*social.ser+.05*pressure*rigidity+.08*strategic.threatPressure),
   estar:clamp(.58*E+.12*D+.09*H+.06*social.estar+.06*agency+.09*Math.abs(strategic.coalitionPull)/100),
   decir:clamp(.55*D+.12*S+.09*E+.07*social.decir+.06*pressure+.11*Math.abs(strategic.negotiationPull)/100),
   hacer:clamp(.52*H+.14*D+.10*E+.07*social.hacer+.07*agency*(1-rigidity*.5)+.10*strategic.threatProjection)
  });
  const endogenous=(states.hacer-states.ser)*10+(states.decir-states.estar)*6;
  const negotiationVector=strategic.negotiationPull*(.12+.18*states.decir);
  const coalitionVector=strategic.coalitionPull*(.08+.16*states.estar);
  const threatVector=(strategic.threatProjection-strategic.threatPressure)*18*(.4+.6*states.hacer);
  const delta=(endogenous+negotiationVector+coalitionVector+threatVector)*(1-rigidity*.55);
  return {...a,states,x:clamp((a.x+delta)/100)*100};
 });
}
function evaluateEquilibrium(previous,current,pairs,iteration){
 const movement=current.reduce((sum,a,i)=>sum+Math.abs(a.x-previous[i].x)*a.cn,0);
 const stateChange=current.reduce((sum,a,i)=>sum+["ser","estar","decir","hacer"].reduce((s,k)=>s+Math.abs(a.states[k]-previous[i].states[k]),0)*a.cn,0);
 const activeThreat=pairs.reduce((sum,p)=>sum+p.threatAB+p.threatBA,0)/Math.max(1,pairs.length*2);
 const coalitionDensity=pairs.reduce((sum,p)=>sum+(p.coalitionStrength>0?1:0),0)/Math.max(1,pairs.length);
 return {iteration,movement,stateChange,activeThreat,coalitionDensity,stable:movement<.08&&stateChange<.0025&&activeThreat<.08};
}
function runSimulationCycle(inputActors,iterations=12){
 let current=normalizeActors(structuredClone(inputActors));
 const history=[structuredClone(current)],strategicHistory=[],equilibriumHistory=[];
 for(let iteration=1;iteration<=iterations;iteration++){
  const previous=structuredClone(current);
  const pairs=evaluateStrategicField(current);
  current=transitionDynamic(current,pairs);
  const equilibrium=evaluateEquilibrium(previous,current,pairs,iteration);
  strategicHistory.push(pairs);
  equilibriumHistory.push(equilibrium);
  history.push(structuredClone(current));
  if(equilibrium.stable)break;
 }
 const finalPairs=evaluateStrategicField(current);
 const finalEquilibrium=equilibriumHistory[equilibriumHistory.length-1]||{iteration:0,movement:0,stateChange:0,activeThreat:0,coalitionDensity:0,stable:true};
 return {actors:current,history,strategicHistory,equilibriumHistory,finalPairs,finalEquilibrium};
}
function convergence(actors){
 return actors.reduce((sum,a)=>sum+a.x*a.cn*a.s,0)/Math.max(.0001,actors.reduce((sum,a)=>sum+a.cn*a.s,0));
}
function concentrationScore(actors,conv){
 const spread=Math.sqrt(actors.reduce((sum,a)=>sum+Math.pow(a.x-conv,2)*a.cn,0));
 return clamp(1-spread/50)*100;
}
function systemState(actors){
 const out={ser:0,estar:0,decir:0,hacer:0};
 actors.forEach(a=>{for(const k of Object.keys(out))out[k]+=a.states[k]*a.cn;});
 return out;
}
function summarizeStrategy(pairs){
 const coalitions=pairs.filter(p=>p.coalitionStrength>0).sort((a,b)=>b.coalitionStrength-a.coalitionStrength).map(p=>({a:p.a,b:p.b,p:p.coalitionStrength.toFixed(2)}));
 const threats=[];
 pairs.forEach(p=>{
  if(p.threatEUA>0)threats.push({
   from:p.a,to:p.b,
   eu:p.threatEUA,
   intensity:p.threatAB,
   probability:p.contestProbabilityA,
   success:p.successUtilityA,
   failure:p.failureUtilityA,
   cost:p.challengeCostA,
   statusQuo:p.statusQuoA
  });
  if(p.threatEUB>0)threats.push({
   from:p.b,to:p.a,
   eu:p.threatEUB,
   intensity:p.threatBA,
   probability:p.contestProbabilityB,
   success:p.successUtilityB,
   failure:p.failureUtilityB,
   cost:p.challengeCostB,
   statusQuo:p.statusQuoB
  });
 });
 threats.sort((a,b)=>b.intensity-a.intensity||b.eu-a.eu);
 return {coalitions,threats:threats.slice(0,10)};
}
