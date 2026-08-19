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

const tests=[];function test(n,fn){tests.push({n,fn});}
test("núcleo conserva ecuación",()=>{
 const A={id:"A",S:.8,E:.7,H:.25},B={id:"B",S:.55,E:.6,H:.2};
 const r=core.predictInteraction(A,B,{source:"A",target:"B",D:.7,phi:.5,G:.8});
 assert(Math.abs(r.X-.196)<1e-12);
 assert(Math.abs(r.deltaH-.1176)<1e-12);
});
test("verbo de habla aislado no genera operación",()=>{
 const op=vm.runInContext(`operationFromSentence("finalmente, dijo, suspirando, a su mujer:")`,sandbox);
 assert.strictEqual(op,null);
});
test("coerción narrativa genera G bajo y fase",()=>{
 const code=`(function(){
  const raw="La madrastra dijo que llevarían a los niños a lo más espeso del bosque para abandonarlos. Hänsel juntó guijarros para encontrar el camino de vuelta.";
  const sents=splitSentences(raw),tok=tokens(raw),freq={};tok.forEach(w=>freq[w]=(freq[w]||0)+1);
  const concepts=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const actors=detectActors(raw);
  const evidence={S:sents.filter(s=>score(lex.ser,s)).slice(0,4),E:sents.filter(s=>score(lex.estar,s)||score(lex.barrier,s)).slice(0,4),D:sents.filter(s=>score(lex.decir,s)||score(lex.operation,s)).slice(0,4),H:sents.filter(s=>score(lex.hacer,s)).slice(0,4),phi:sents.filter(s=>score(lex.barrier,s)||/duda|precio|acceso|barrera|resistencia/i.test(s)).slice(0,4),G:sents.filter(s=>/busca|intenta|pretende|transformar|llevar|convertir/i.test(s)).slice(0,4)};
  const a={actors,concepts,evidence,scores:{S:score(lex.ser,raw),E:score(lex.estar,raw),D:score(lex.decir,raw)+score(lex.operation,raw),H:score(lex.hacer,raw),barrier:score(lex.barrier,raw),positive:score(lex.positive,raw)},raw};
  const sc=inferScenario(a);
  return {profile:a.profile.id,events:a.events,scenario:sc};
 })()`;
 const out=vm.runInContext(code,sandbox);
 assert.strictEqual(out.profile,"narrativa");
 assert(out.events.some(e=>e.type==="coerción"&&e.G<=.15&&e.polarity==="negativa"&&e.phase.includes("Fase")));
 assert(out.events.some(e=>e.type==="resistencia"&&e.G>=.75&&e.polarity==="positiva"&&e.phase.includes("Fase")));
});
test("H inicial narrativo sale de fase inicial negativa, no del final feliz",()=>{
 const code=`(function(){
  const raw="La madrastra llevó a los niños al bosque para abandonarlos. Más tarde encontraron perlas y piedras preciosas y vivieron felices.";
  const sents=splitSentences(raw),tok=tokens(raw),freq={};tok.forEach(w=>freq[w]=(freq[w]||0)+1);
  const concepts=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const actors=detectActors(raw);
  const evidence={S:sents.filter(s=>score(lex.ser,s)).slice(0,4),E:sents.filter(s=>score(lex.estar,s)||score(lex.barrier,s)).slice(0,4),D:sents.filter(s=>score(lex.decir,s)||score(lex.operation,s)).slice(0,4),H:sents.filter(s=>score(lex.hacer,s)).slice(0,4),phi:sents.filter(s=>score(lex.barrier,s)||/duda|precio|acceso|barrera|resistencia/i.test(s)).slice(0,4),G:sents.filter(s=>/busca|intenta|pretende|transformar|llevar|convertir/i.test(s)).slice(0,4)};
  const a={actors,concepts,evidence,scores:{S:score(lex.ser,raw),E:score(lex.estar,raw),D:score(lex.decir,raw)+score(lex.operation,raw),H:score(lex.hacer,raw),barrier:score(lex.barrier,raw),positive:score(lex.positive,raw)},raw};
  const sc=inferScenario(a);
  return sc.H;
 })()`;
 const H=vm.runInContext(code,sandbox);
 assert(H<=.35);
});
test("falsos actores residuales se eliminan",()=>{
 const actors=vm.runInContext(`detectActors("Ahora Hänsel habló. Algún ruido apareció. Acercóse al fuego. Ahí estaba Gretel.")`,sandbox).map(a=>a.name.toLowerCase());
 assert(!actors.includes("ahora"));
 assert(!actors.includes("algún"));
 assert(!actors.includes("acercóse"));
 assert(!actors.includes("ahí"));
 assert(actors.some(a=>a.includes("hänsel"))||actors.some(a=>a.includes("gretel")));
});
test("reporte incluye fase",()=>assert(html.includes("data-phase")&&html.includes("r.evidence?.phase")));
test("sin utilidad esperada",()=>{const lower=html.toLowerCase();assert(!lower.includes("expectedutility")&&!lower.includes("utility("));});

let p=0;
for(const t of tests){
 try{t.fn();console.log("PASS",t.n);p++;}
 catch(e){console.error("FAIL",t.n,"\n ",e.message);}
}
console.log(`\n${p}/${tests.length} PASS`);
if(p!==tests.length)process.exit(1);
