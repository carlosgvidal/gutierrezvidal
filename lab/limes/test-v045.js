"use strict";
const assert=require("assert"),fs=require("fs"),path=require("path"),vm=require("vm");
const html=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.strictEqual(scripts.length,1);
function fakeEl(){
 return {value:"",innerHTML:"",className:"",addEventListener(){},querySelector(){return fakeEl();},querySelectorAll(){return []},insertAdjacentHTML(){},closest(){return fakeEl();}};
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
test("perfiles detectan consumo",()=>{
 const p=vm.runInContext(`selectProfile("La marca presenta una campaña para compradores de joyería de autor y consumo de lujo").profile.id`,sandbox);
 assert.strictEqual(p,"consumo");
});
test("perfiles detectan narrativa",()=>{
 const p=vm.runInContext(`selectProfile("Hänsel y Gretel fueron abandonados en el bosque por la madrastra y luego apareció la bruja").profile.id`,sandbox);
 assert.strictEqual(p,"narrativa");
});
test("perfiles tienen fallback genérico",()=>{
 const p=vm.runInContext(`selectProfile("Texto abstracto sin dominio claro sobre una relación cualquiera").profile.id`,sandbox);
 assert.strictEqual(p,"generico");
});
test("detector elimina falsos actores",()=>{
 const actors=vm.runInContext(`detectActors("Pero Hänsel la consoló. Dijo el padre. Anduvieron toda la noche. - ¡Vamos! - Espera. Acercóse al fuego. Ahí estaba Gretel.")`,sandbox).map(a=>a.name.toLowerCase());
 assert(actors.some(a=>a.includes("hänsel")));
 assert(actors.some(a=>a.includes("gretel")));
 for(const bad of ["pero","dijo","anduvieron","vamos","espera","acercóse","ahí"]) assert(!actors.includes(bad));
});
test("coerción narrativa genera G bajo",()=>{
 const code=`(function(){
  const raw="La madrastra dijo que llevarían a los niños a lo más espeso del bosque para abandonarlos.";
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
 assert(out.events.length>=1);
 assert(out.events.some(e=>e.type==="coerción"&&e.G<=.15&&e.polarity==="negativa"));
});
test("incluye diccionario y perfiles de corpus",()=>assert(html.includes("DICTIONARY")&&html.includes("CORPUS_PROFILES")));
test("sin utilidad esperada",()=>{const lower=html.toLowerCase();assert(!lower.includes("expectedutility")&&!lower.includes("utility("));});
let p=0;for(const t of tests){try{t.fn();console.log("PASS",t.n);p++;}catch(e){console.error("FAIL",t.n,"\n ",e.message);}}console.log(`\n${p}/${tests.length} PASS`);if(p!==tests.length)process.exit(1);
