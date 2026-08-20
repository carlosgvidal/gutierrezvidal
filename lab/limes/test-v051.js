"use strict";
const assert=require("assert"),fs=require("fs"),path=require("path"),vm=require("vm");
const html=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const sem=fs.readFileSync(path.join(__dirname,"semantic-engine.js"),"utf8");
const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.strictEqual(inline.length,1);

function fakeEl(){
 return {value:"",innerHTML:"",textContent:"",className:"",dataset:{},style:{},
  addEventListener(){},querySelector(){return fakeEl();},querySelectorAll(){return []},
  insertAdjacentHTML(){},closest(){return fakeEl();},remove(){},click(){}};
}
const els={};
function el(s){if(!els[s])els[s]=fakeEl();return els[s];}
const sandbox={
 window:{},console,Number,Math,String,JSON,Map,Set,RegExp,Error,Date,
 document:{querySelector(s){return el(s)},querySelectorAll(){return []},createElement(){return fakeEl()}},
 Blob:function(){},URL:{createObjectURL(){return ""},revokeObjectURL(){}},alert(){},addEventListener(){}
};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(sem,sandbox);
vm.runInContext(inline[0],sandbox);
const core=sandbox.LimesCore;

function analysisFor(raw){
 const code=`(function(){
  const raw=${JSON.stringify(raw)};
  const sents=splitSentences(raw),tok=tokens(raw),freq={};tok.forEach(w=>freq[w]=(freq[w]||0)+1);
  const concepts=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const actors=detectActors(raw);
  const evidence={
   S:sents.filter(s=>score(lex.ser,s)).slice(0,4),
   E:sents.filter(s=>score(lex.estar,s)||score(lex.barrier,s)).slice(0,4),
   D:sents.filter(s=>score(lex.decir,s)||score(lex.operation,s)).slice(0,4),
   H:sents.filter(s=>score(lex.hacer,s)).slice(0,4),
   phi:sents.filter(s=>score(lex.barrier,s)||/duda|precio|acceso|barrera|resistencia/i.test(s)).slice(0,4),
   G:sents.filter(s=>/busca|intenta|pretende|transformar|llevar|convertir/i.test(s)).slice(0,4)
  };
  const a={actors,concepts,evidence,scores:{S:score(lex.ser,raw),E:score(lex.estar,raw),D:score(lex.decir,raw)+score(lex.operation,raw),H:score(lex.hacer,raw),barrier:score(lex.barrier,raw),positive:score(lex.positive,raw)},raw};
  a.scenario=inferScenario(a); if(!a.events)a.events=[];
  a.observation=buildObservationModel(a);
  a.analysis=buildSemioticStrategicAnalysis(a);
  return a;
 })()`;
 return vm.runInContext(code,sandbox);
}

const tests=[];function test(n,fn){tests.push({n,fn});}

test("núcleo matemático intacto",()=>{
 const A={id:"A",S:.8,E:.7,H:.25},B={id:"B",S:.55,E:.6,H:.2};
 const r=core.predictInteraction(A,B,{source:"A",target:"B",D:.7,phi:.5,G:.8});
 assert(Math.abs(r.R-.56)<1e-12);
 assert(Math.abs(r.X-.196)<1e-12);
 assert(Math.abs(r.deltaH-.1176)<1e-12);
});

test("motor semántico externo cargado",()=>{
 assert(sandbox.LimesSemantic);
 assert.strictEqual(sandbox.LimesSemantic.analyze("Texto.",{}).version,"semantic-engine-v0.51");
 assert(html.includes('src="semantic-engine.js"'));
});

test("concordancia semántica filtra palabras funcionales",()=>{
 const raw="Pero Hänsel dijo que el bosque era grande. Hänsel volvió por el bosque. Gretel volvió por el bosque.";
 const result=sandbox.LimesSemantic.analyze(raw,{profile:"narrativa",entities:[{name:"Hänsel",aliases:["hansel"]},{name:"Gretel",aliases:["gretel"]}]});
 const terms=result.concordance.terms.map(t=>t.term);
 assert(!terms.includes("pero"));
 assert(!terms.includes("dijo"));
 assert(!terms.includes("era"));
 assert(terms.includes("bosque"));
});

test("coreferencia regulatoria une menciones del mismo límite",()=>{
 const raw="La Comunidad de Pequeños Anfitriones rechazó el límite impuesto por las autoridades capitalinas del 50 por ciento. En 2024 las autoridades reformaron la Ley de Turismo y establecieron un tope máximo del 50 por ciento.";
 const a=analysisFor(raw);
 assert.strictEqual(a.profile.id,"regulacion");
 const reg=a.semantic.eventClusters.filter(e=>e.family==="regulatory_restriction");
 assert.strictEqual(reg.length,1);
 assert(reg[0].evidenceCount>=1);
 const track=a.observation.tracks.find(t=>t.id==="impacto_regulatorio");
 assert(track);
 assert.strictEqual(track.events.length,1);
});

test("desafío regulatorio separa actionTarget de stateTarget",()=>{
 const raw="Las autoridades establecieron un límite al hospedaje. La Comunidad de Pequeños Anfitriones exhortó al Gobierno de la Ciudad de México a eliminar la restricción.";
 const a=analysisFor(raw);
 const e=a.events.find(e=>e.mode==="impugnacion");
 assert(e);
 assert.strictEqual(e.source,"Comunidad de Pequeños Anfitriones");
 assert.strictEqual(e.actionTarget,"gobierno / autoridades");
 assert.strictEqual(e.stateTarget,"Comunidad de Pequeños Anfitriones");
});

test("impuesto sobre hospedaje es argumento y no restricción causal",()=>{
 const raw="Las autoridades establecieron un límite al hospedaje eventual. Los anfitriones han generado recursos para las arcas del Gobierno por concepto del impuesto sobre hospedaje que pagan desde 2017.";
 const a=analysisFor(raw);
 const arg=a.events.find(e=>e.type==="argumentación económica / legitimación");
 assert(arg);
 const operational=a.observation.tracks.find(t=>t.id==="impacto_regulatorio");
 assert(!operational.events.some(e=>e.type==="argumentación económica / legitimación"));
});

test("rechazo retórico del padre no es abandono operativo",()=>{
 const raw="¡Cómo voy a cargar sobre mí el abandonar a mis hijos en el bosque! dijo el padre. La madrastra llevó después a los niños al bosque y los dejó solos.";
 const a=analysisFor(raw);
 const aband=a.events.filter(e=>e.type==="abandono / coerción");
 assert.strictEqual(aband.length,1);
 assert(!/Cómo voy a cargar/.test(aband[0].sentence));
});

test("migas fallidas se agrupan como un evento",()=>{
 const raw="Hänsel fue dejando migas de pan por el camino. Más tarde los pájaros se comieron las migas y los niños no encontraron la ruta de regreso.";
 const a=analysisFor("La madrastra abandonó a Hänsel y Gretel en el bosque. "+raw+" La bruja los encerró.");
 const fail=a.events.find(e=>e.type==="orientación fallida");
 assert(fail);
 assert(fail.evidenceCount>=1);
 assert.strictEqual(fail.G,.35);
});

test("adquisición de recursos no equivale a retorno",()=>{
 const raw="La bruja encerró a Hänsel. Gretel empujó a la bruja y escaparon. Encontraron cajas llenas de perlas y piedras preciosas. Después regresaron a casa de su padre y terminaron sus penas.";
 const a=analysisFor(raw);
 assert(a.events.some(e=>e.type==="adquisición de recursos"));
 assert(a.events.some(e=>e.type==="retorno / agencia restaurada"));
 const acquisition=a.events.find(e=>e.type==="adquisición de recursos");
 const ret=a.events.find(e=>e.type==="retorno / agencia restaurada");
 assert(acquisition.semanticEventId!==ret.semanticEventId);
});

test("G terminal no sobrescribe G local",()=>{
 const raw="La madrastra abandonó a Hänsel y Gretel. La bruja encerró a Hänsel. Gretel empujó a la bruja y escaparon. Regresaron a casa de su padre y vivieron felices.";
 const a=analysisFor(raw);
 const track=a.observation.tracks[0],sc=a.analysis.scenarios[0];
 const events=vm.runInContext(`applyStrategicScenarioToEvents(${JSON.stringify(track.events)},${JSON.stringify(track)},${JSON.stringify(sc)})`,sandbox);
 const abandon=events.find(e=>e.type==="abandono / coerción");
 const capture=events.find(e=>e.type==="captura / amenaza");
 assert(abandon && capture);
 assert.strictEqual(abandon.G,.05);
 assert.strictEqual(capture.G,.05);
 assert.strictEqual(abandon.terminalG,1);
});

test("narrativa construye subjuegos separados",()=>{
 const raw="La madrastra abandonó a Hänsel y Gretel en el bosque. Hänsel dejó guijarros y volvió. La bruja encerró a Hänsel. Gretel empujó a la bruja y escaparon. Regresaron a casa.";
 const a=analysisFor(raw);
 assert.strictEqual(a.analysis.strategic.game.family,"threat_response");
 assert(a.analysis.strategic.subgames.length>=2);
 assert(a.analysis.strategic.subgames.some(s=>/abandono/.test(s.label)));
 assert(a.analysis.strategic.subgames.some(s=>/captura/.test(s.label)));
});

test("informe declara jerarquía G_e/Gτ y motor semántico",()=>{
 assert(html.includes("G_e"));
 assert(html.includes("Gτ"));
 assert(html.includes("MOTOR DE INTERPRETACIÓN SEMÁNTICA"));
 assert(html.includes("coreferencia"));
});

test("sin utilidad esperada",()=>{
 const lower=(html+sem).toLowerCase();
 assert(!lower.includes("expectedutility"));
 assert(!lower.includes("utility("));
});

let passed=0;
for(const t of tests){
 try{t.fn();console.log("PASS",t.n);passed++;}
 catch(e){console.error("FAIL",t.n,"\n ",e.message);}
}
console.log(`\n${passed}/${tests.length} PASS`);
if(passed!==tests.length)process.exit(1);
