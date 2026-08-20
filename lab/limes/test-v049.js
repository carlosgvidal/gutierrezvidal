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
const sandbox={
 window:{},console,Number,Math,String,JSON,Map,Set,RegExp,Error,Date,
 document:{querySelector(){return fakeEl();},querySelectorAll(){return []},createElement(){return fakeEl();}},
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
  a.scenario=inferScenario(a);
  if(!a.events)a.events=[];
  a.observation=buildObservationModel(a);
  return a;
 })()`;
 return vm.runInContext(code,sandbox);
}

const tests=[];function test(n,fn){tests.push({n,fn});}

test("núcleo conserva ecuación",()=>{
 const A={id:"A",S:.8,E:.7,H:.25},B={id:"B",S:.55,E:.6,H:.2};
 const r=core.predictInteraction(A,B,{source:"A",target:"B",D:.7,phi:.5,G:.8});
 assert(Math.abs(r.X-.196)<1e-12);
 assert(Math.abs(r.deltaH-.1176)<1e-12);
});

test("modelo de observación separa tracks regulatorios",()=>{
 const raw="Las autoridades capitalinas impusieron un límite del 50 por ciento para ofrecer hospedaje eventual durante el año. La Comunidad de Pequeños Anfitriones rechazó la restricción y pidió que se elimine la medida.";
 const a=analysisFor(raw);
 assert.strictEqual(a.profile.id,"regulacion");
 assert(a.observation.tracks.some(t=>t.id==="impacto_regulatorio"));
 assert(a.observation.tracks.some(t=>t.id==="impugnacion"));
 assert(a.observation.warnings.some(w=>w.includes("múltiples pistas")));
 const op=a.observation.tracks.find(t=>t.id==="impacto_regulatorio");
 assert(op.hVariable.includes("capacidad operativa"));
 assert(op.events.every(e=>e.type==="regulación coercitiva"));
});

test("noticia regulatoria no usa H mixta para track operativo",()=>{
 const raw="Las autoridades reformaron la Ley de Turismo y establecieron un tope máximo. Los anfitriones rechazaron la medida y exigieron eliminarla.";
 const a=analysisFor(raw);
 const active=a.observation.tracks.find(t=>t.id==="impacto_regulatorio")||a.observation.tracks[0];
 assert.strictEqual(active.id,"impacto_regulatorio");
 assert(!active.hVariable.includes("impugnar"));
 assert(active.H0>=.65);
});

test("pan contextual no genera orientación fallida",()=>{
 const op=vm.runInContext(`operationFromSentence("Apenas tenían qué comer y sólo había un pedacito de pan.", CORPUS_PROFILES.find(p=>p.id==="narrativa"))`,sandbox);
 assert.strictEqual(op,null);
});

test("negación y retrospectiva de abandono no generan coerción",()=>{
 const p='CORPUS_PROFILES.find(p=>p.id==="narrativa")';
 assert.strictEqual(vm.runInContext(`operationFromSentence("Dios no nos abandonará y se acostó de nuevo.", ${p})`,sandbox),null);
 assert.strictEqual(vm.runInContext(`operationFromSentence("El padre se alegró de que hubieran vuelto, pues le remordía haberlos abandonado.", ${p})`,sandbox),null);
});

test("cuento genera track narrativo con arco y retorno",()=>{
 const raw="La madrastra llevó a los niños al bosque para abandonarlos. Hänsel juntó guijarros y volvió por el camino. Luego desmigajó pan, pero los pájaros comieron las migas. La bruja encerró a Hänsel en una reja y preparó el horno. Gretel empujó a la bruja al horno y escaparon. Volvieron con perlas y piedras preciosas y vivieron felices.";
 const a=analysisFor(raw);
 assert.strictEqual(a.profile.id,"narrativa");
 const t=a.observation.tracks[0];
 const types=t.events.map(e=>e.type);
 for(const required of ["abandono / coerción","orientación / resistencia","orientación fallida","captura / amenaza","contraacción / escape","retorno / agencia restaurada"]) assert(types.includes(required), required);
 assert(t.status.calculable);
});

test("alias narrativos y falsos actores se limpian",()=>{
 const actors=vm.runInContext(`detectActors("Bobo dijo algo. Corrió Gretel hacia Hänsel. Los hermanitos volvieron.")`,sandbox).map(a=>a.name.toLowerCase());
 assert(!actors.includes("bobo"));
 assert(!actors.some(a=>a.includes("corrió")));
 assert(actors.some(a=>a.includes("gretel"))||actors.some(a=>a.includes("hänsel")));
});

test("reporte incluye objeto de observación",()=>assert(html.includes("0B. OBJETO DE OBSERVACIÓN")&&html.includes("buildObservationModel")&&html.includes("Tracks calculables")));

test("sin utilidad esperada",()=>{const lower=html.toLowerCase();assert(!lower.includes("expectedutility")&&!lower.includes("utility("));});

let passed=0;
for(const t of tests){
 try{t.fn();console.log("PASS",t.n);passed++;}
 catch(e){console.error("FAIL",t.n,"\n ",e.message);}
}
console.log(`\n${passed}/${tests.length} PASS`);
if(passed!==tests.length)process.exit(1);
