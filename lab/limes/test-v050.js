"use strict";
const assert=require("assert"),fs=require("fs"),path=require("path"),vm=require("vm");
const html=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.strictEqual(scripts.length,1);

function fakeEl(){
 return {value:"",innerHTML:"",textContent:"",className:"",dataset:{},style:{},
  addEventListener(){},querySelector(){return fakeEl();},querySelectorAll(){return []},
  insertAdjacentHTML(){},closest(){return fakeEl();},remove(){},click(){}};
}
const elements={};
function getEl(sel){if(!elements[sel])elements[sel]=fakeEl();return elements[sel];}
const sandbox={
 window:{},console,Number,Math,String,JSON,Map,Set,RegExp,Error,Date,
 document:{querySelector(sel){return getEl(sel);},querySelectorAll(){return []},createElement(){return fakeEl();}},
 Blob:function(){},URL:{createObjectURL(){return ""},revokeObjectURL(){}},alert(){},addEventListener(){}
};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(scripts[0],sandbox);
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

test("concordancia contextual produce relevancia y asociaciones",()=>{
 const raw="La Comunidad rechazó la restricción. La restricción limita a los anfitriones. Los anfitriones pidieron eliminar la restricción.";
 const a=analysisFor(raw);
 assert(a.analysis.concordance.terms.length>0);
 const t=a.analysis.concordance.terms.find(x=>x.term==="restriccion");
 assert(t && t.count>=3);
 assert(Number.isFinite(t.relevance));
});

test("noticia regulatoria identifica bargaining y dos tracks",()=>{
 const raw="Las autoridades capitalinas impusieron un límite del 50 por ciento al hospedaje eventual. La Comunidad de Pequeños Anfitriones rechazó la medida y exhortó al Gobierno a eliminarla. Indicaron que han promovido amparos y pidieron mesas de trabajo.";
 const a=analysisFor(raw);
 assert.strictEqual(a.profile.id,"regulacion");
 assert.strictEqual(a.analysis.strategic.game.family,"bargaining");
 assert(["alta","media"].includes(a.analysis.strategic.game.confidence));
 assert(a.observation.tracks.some(t=>t.id==="impacto_regulatorio"));
 assert(a.observation.tracks.some(t=>t.id==="impugnacion"));
 assert(a.analysis.scenarios.length>=3);
});

test("relación lingüística distingue actor operativo de mencionado",()=>{
 const raw="Los anfitriones exhortaron al Gobierno de la Ciudad de México a eliminar la restricción.";
 const a=analysisFor(raw);
 const rel=a.analysis.relations.find(r=>r.verb==="exhortar"||r.verb==="eliminar");
 assert(rel);
 assert.strictEqual(rel.source,"Comunidad de Pequeños Anfitriones");
 assert.strictEqual(rel.target,"gobierno / autoridades");
});

test("impuesto sobre hospedaje es argumento económico, no coerción",()=>{
 const raw="Los anfitriones han generado para las arcas del Gobierno 22 mil millones de pesos por concepto del impuesto sobre hospedaje que pagan desde 2017.";
 const a=analysisFor("Las autoridades establecieron un límite al hospedaje. "+raw);
 const tax=a.events.find(e=>/impuesto sobre hospedaje/.test(e.sentence));
 assert(tax);
 assert.strictEqual(tax.mode,"impugnacion");
 assert.strictEqual(tax.type,"argumentación económica / legitimación");
 assert(!a.observation.tracks.find(t=>t.id==="impacto_regulatorio").events.some(e=>/impuesto sobre hospedaje/.test(e.sentence)));
});

test("estructura semiótica contiene objetos de valor y programas",()=>{
 const raw="Las autoridades impusieron una restricción. La Comunidad de Pequeños Anfitriones rechazó el límite y pidió eliminarlo.";
 const a=analysisFor(raw);
 assert(a.analysis.semiotic.valueObjects.some(o=>/capacidad/.test(o.object)));
 assert(a.analysis.semiotic.programs.length>=2);
 assert(a.analysis.semiotic.oppositions.some(o=>o.join(" ").includes("restricción")));
});

test("preferencias ordinales no inventan preferencia de autoridad",()=>{
 const raw="Las autoridades establecieron un límite. Los anfitriones rechazaron la medida y pidieron eliminarla.";
 const a=analysisFor(raw);
 const gov=a.analysis.strategic.players.find(p=>p.id==="gobierno / autoridades");
 const community=a.analysis.strategic.players.find(p=>p.id==="Comunidad de Pequeños Anfitriones");
 assert(gov);
 assert.strictEqual(gov.preferenceStatus,"indeterminada");
 assert(community.preferences.length>=1);
});

test("escenario estratégico deriva G sin utilidad esperada",()=>{
 const raw="Las autoridades establecieron una restricción. Los anfitriones rechazaron la medida y pidieron eliminarla.";
 const a=analysisFor(raw);
 const maintain=a.analysis.scenarios.find(s=>s.id==="REG-MANTENER");
 const negotiate=a.analysis.scenarios.find(s=>s.id==="REG-NEGOCIAR");
 assert.strictEqual(maintain.derived.impacto_regulatorio.G,.20);
 assert.strictEqual(negotiate.derived.impacto_regulatorio.G,.58);
 const track=a.observation.tracks.find(t=>t.id==="impacto_regulatorio");
 const applied=vm.runInContext(`applyStrategicScenarioToEvents(${JSON.stringify(track.events)},${JSON.stringify(track)},${JSON.stringify(negotiate)})`,sandbox);
 assert(applied.every(e=>Math.abs(e.G-.58)<1e-12));
});

test("cuento identifica amenaza-respuesta secuencial y estructura semiótica",()=>{
 const raw="La madrastra abandonó a Hänsel y Gretel en el bosque. Hänsel dejó guijarros y volvió. Después las migas fueron comidas por pájaros. La bruja encerró a Hänsel junto al horno. Gretel empujó a la bruja y escaparon. Volvieron con perlas y vivieron felices.";
 const a=analysisFor(raw);
 assert.strictEqual(a.profile.id,"narrativa");
 assert.strictEqual(a.analysis.strategic.game.family,"threat_response");
 assert(a.analysis.semiotic.oppositions.some(o=>o.join(" ").includes("abandono")));
 assert(a.events.some(e=>e.type==="retorno / agencia restaurada"));
 assert(a.analysis.scenarios.some(s=>s.id==="NAR-OBS"));
});

test("modalidades querer/poder/saber/deber se registran",()=>{
 const raw="La comunidad quiere eliminar la norma, puede litigar, sabe que existen amparos y debe cumplir la restricción mientras siga vigente.";
 const a=analysisFor("Las autoridades regulan a los anfitriones. "+raw);
 const modes=[...new Set(a.analysis.relations.flatMap(r=>r.modalities))];
 assert(modes.includes("querer"));
 assert(modes.includes("poder"));
 assert(modes.includes("saber"));
 assert(modes.includes("deber"));
});

test("reporte contiene las cinco capas de análisis",()=>{
 for(const s of ["0A. CONCORDANCIA CONTEXTUAL","0B. ESTRUCTURA SEMIÓTICA","0C. ESTRUCTURA ESTRATÉGICA","0D. ESCENARIOS ESTRATÉGICOS","0E. OBJETO DE OBSERVACIÓN / TRACKS"])assert(html.includes(s),s);
});

test("sin utilidad esperada ni probabilidades estratégicas",()=>{
 const lower=html.toLowerCase();
 assert(!lower.includes("expectedutility"));
 assert(!lower.includes("utility("));
 assert(html.includes("sin asignar probabilidades ni utilidad esperada"));
});

let passed=0;
for(const t of tests){
 try{t.fn();console.log("PASS",t.n);passed++;}
 catch(e){console.error("FAIL",t.n,"\n ",e.message);}
}
console.log(`\n${passed}/${tests.length} PASS`);
if(passed!==tests.length)process.exit(1);
