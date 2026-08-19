"use strict";
const assert=require("assert"),fs=require("fs"),path=require("path"),vm=require("vm");
const html=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.strictEqual(scripts.length,1);
function fakeEl(){
 return {value:"",innerHTML:"",className:"",dataset:{},addEventListener(){},querySelector(){return fakeEl();},querySelectorAll(){return []},insertAdjacentHTML(){},closest(){return fakeEl();}};
}
const sandbox={window:{},console,Number,Math,String,JSON,Map,Set,RegExp,Error,
 document:{querySelector(){return fakeEl();},querySelectorAll(){return []},createElement(){return {click(){}}}},
 Blob:function(){},URL:{createObjectURL(){return ""},revokeObjectURL(){}},alert(){}};
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
  const evidence={S:sents.filter(s=>score(lex.ser,s)).slice(0,4),E:sents.filter(s=>score(lex.estar,s)||score(lex.barrier,s)).slice(0,4),D:sents.filter(s=>score(lex.decir,s)||score(lex.operation,s)).slice(0,4),H:sents.filter(s=>score(lex.hacer,s)).slice(0,4),phi:sents.filter(s=>score(lex.barrier,s)||/duda|precio|acceso|barrera|resistencia/i.test(s)).slice(0,4),G:sents.filter(s=>/busca|intenta|pretende|transformar|llevar|convertir/i.test(s)).slice(0,4)};
  const a={actors,concepts,evidence,scores:{S:score(lex.ser,raw),E:score(lex.estar,raw),D:score(lex.decir,raw)+score(lex.operation,raw),H:score(lex.hacer,raw),barrier:score(lex.barrier,raw),positive:score(lex.positive,raw)},raw};
  const sc=inferScenario(a);
  return {profile:a.profile,profileScore:a.profileScore,actors:a.actors,events:a.events,scenario:sc};
 })()`;
 return vm.runInContext(code,sandbox);
}

const tests=[];
function test(n,fn){tests.push({n,fn});}

test("núcleo conserva ecuación",()=>{
 const A={id:"A",S:.8,E:.7,H:.25},B={id:"B",S:.55,E:.6,H:.2};
 const r=core.predictInteraction(A,B,{source:"A",target:"B",D:.7,phi:.5,G:.8});
 assert(Math.abs(r.X-.196)<1e-12);
 assert(Math.abs(r.deltaH-.1176)<1e-12);
});
test("detecta perfil regulatorio y no electoral",()=>{
 const raw="Las autoridades capitalinas impusieron un límite del 50 por ciento para ofrecer hospedaje eventual durante el año. La Comunidad de Pequeños Anfitriones rechazó la restricción y pidió que se elimine la medida.";
 const out=analysisFor(raw);
 assert.strictEqual(out.profile.id,"regulacion");
 assert(!out.scenario.hLabel.toLowerCase().includes("votar"));
 assert(out.scenario.hLabel.toLowerCase().includes("actor regulado"));
});
test("eventos regulatorios son bidireccionales",()=>{
 const raw="Las autoridades capitalinas impusieron un límite del 50 por ciento para ofrecer hospedaje eventual durante el año. La Comunidad de Pequeños Anfitriones rechazó la restricción y pidió que se elimine la medida.";
 const out=analysisFor(raw);
 assert(out.events.some(e=>e.type==="regulación coercitiva"&&e.polarity==="negativa"&&e.source==="gobierno / autoridades"&&e.target==="Comunidad de Pequeños Anfitriones"&&e.G<=.2));
 assert(out.events.some(e=>e.type==="impugnación / demanda"&&e.polarity==="positiva"&&e.source==="Comunidad de Pequeños Anfitriones"&&e.target==="Comunidad de Pequeños Anfitriones"&&e.G>=.75));
});
test("H inicial regulatorio parte de capacidad operativa alta",()=>{
 const raw="Las autoridades capitalinas impusieron una restricción al hospedaje eventual. La Comunidad de Pequeños Anfitriones rechazó la medida.";
 const out=analysisFor(raw);
 assert(out.scenario.H>=.65);
});
test("falsos actores periodísticos se eliminan",()=>{
 const actors=vm.runInContext(`detectActors("Indicaron que el gobierno respondió. Aseguraron que la comunidad resistirá. Lamentaron la medida. Dinero publicó la nota. Blanca Lolbé habló.")`,sandbox).map(a=>a.name.toLowerCase());
 for(const bad of ["indicaron","aseguraron","lamentaron","dinero"]) assert(!actors.includes(bad));
 assert(actors.some(a=>a.includes("blanca")));
});
test("perfil narrativo sigue disponible",()=>{
 const out=analysisFor("Hänsel y Gretel fueron abandonados en el bosque por la madrastra. Hänsel juntó guijarros para volver.");
 assert.strictEqual(out.profile.id,"narrativa");
 assert(out.events.some(e=>e.polarity==="negativa"));
 assert(out.events.some(e=>e.polarity==="positiva"));
});
test("incluye perfil regulación",()=>assert(html.includes("regulación / conflicto institucional")&&html.includes("politica_electoral")&&html.includes("movilizacion")));
test("sin utilidad esperada",()=>{const lower=html.toLowerCase();assert(!lower.includes("expectedutility")&&!lower.includes("utility("));});

let passed=0;
for(const t of tests){
 try{t.fn();console.log("PASS",t.n);passed++;}
 catch(e){console.error("FAIL",t.n,"\n ",e.message);}
}
console.log(`\n${passed}/${tests.length} PASS`);
if(passed!==tests.length)process.exit(1);
