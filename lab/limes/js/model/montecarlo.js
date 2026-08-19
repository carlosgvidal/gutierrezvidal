function hashSeed(value){
 let h=2166136261>>>0;
 const text=String(value);
 for(let i=0;i<text.length;i++){
  h^=text.charCodeAt(i);
  h=Math.imul(h,16777619);
 }
 return h>>>0;
}
function seededRandom(seed){
 let state=seed>>>0;
 return function(){
  state=(state+0x6D2B79F5)>>>0;
  let t=state;
  t=Math.imul(t^(t>>>15),t|1);
  t^=t+Math.imul(t^(t>>>7),t|61);
  return ((t^(t>>>14))>>>0)/4294967296;
 };
}
function randn(random){
 let u=0,v=0;
 while(!u)u=random();
 while(!v)v=random();
 return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
}
function monteCarlo(baseActors,runs=500,seed="FD-2026"){
 const results=[];
 const random=seededRandom(hashSeed(seed));
 for(let n=0;n<runs;n++){
  const actors=baseActors.map(a=>{
   const sigma=clamp(a.uncertainty,0,3);
   return {
    ...a,
    x:clamp((a.x+randn(random)*4*sigma)/100)*100,
    s:clamp(a.s+randn(random)*.05*sigma,.2,1),
    c:Math.max(1,a.c*(1+randn(random)*.08*sigma)),
    r:clamp(a.r+randn(random)*.04*sigma,.6,2),
    rho:clamp(a.rho+randn(random)*.05*sigma,.5,2),
    states:{...a.states}
   };
  });
  const result=runSimulationCycle(actors,12);
  results.push(convergence(result.actors));
 }
 results.sort((a,b)=>a-b);
 const mean=results.reduce((s,v)=>s+v,0)/results.length;
 const p05=results[Math.floor(results.length*.05)];
 const p95=results[Math.floor(results.length*.95)];
 const sd=Math.sqrt(results.reduce((s,v)=>s+(v-mean)**2,0)/results.length);
 return {mean,p05,p95,sd,robustness:Math.max(0,100-sd*4),seed:String(seed),runs};
}
