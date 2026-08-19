"use strict";
const assert=require("assert"),fs=require("fs"),path=require("path"),vm=require("vm");
const html=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.strictEqual(scripts.length,1);
const sandbox={
 window:{},console,Number,Math,String,JSON,Map,Set,RegExp,Error,
 document:{
  querySelector(){return {value:"",innerHTML:"",className:"",addEventListener(){},querySelector(){return null},querySelectorAll(){return []}};},
  querySelectorAll(){return []},
  createElement(){return {click(){}}}
 },
 Blob:function(){},URL:{createObjectURL(){return ""},revokeObjectURL(){}},alert(){}
};
sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext(scripts[0],sandbox);
const core=sandbox.LimesCore;
const tests=[];
function test(n,fn){tests.push({n,fn});}
test("núcleo conserva ecuación",()=>{
 const A={id:"A",S:.8,E:.7,H:.25},B={id:"B",S:.55,E:.6,H:.2};
 const r=core.predictInteraction(A,B,{source:"A",target:"B",D:.7,phi:.5,G:.8});
 assert(Math.abs(r.X-.196)<1e-12);
 assert(Math.abs(r.deltaH-.1176)<1e-12);
});
test("detector elimina falsos actores narrativos",()=>{
 const actors=vm.runInContext(`detectActors("Pero Hänsel la consoló. Dijo el padre. Anduvieron toda la noche. - ¡Vamos! - Espera. Hänsel miró a Gretel.")`,sandbox).map(a=>a.name.toLowerCase());
 assert(actors.some(a=>a.includes("hänsel"))||actors.some(a=>a.includes("hansel")));
 assert(actors.some(a=>a.includes("gretel")));
 assert(!actors.includes("pero"));
 assert(!actors.includes("dijo"));
 assert(!actors.includes("anduvieron"));
 assert(!actors.includes("vamos"));
 assert(!actors.includes("espera"));
});
test("Hansel y Gretel genera escenario narrativo, no joyería",()=>{
 const code=`(function(){
  const raw="entraron como una tromba y se colgaron del cuello de su padre. Volcó Gretel su delantal, y todas las perlas y piedras preciosas saltaron por el suelo, mientras Hänsel vaciaba también sus bolsillos. Se acabaron las penas, y vivieron los tres felices.";
  const sents=splitSentences(raw),tok=tokens(raw),freq={};tok.forEach(w=>freq[w]=(freq[w]||0)+1);
  const concepts=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const actors=detectActors(raw);
  const evidence={S:sents.filter(s=>score(lex.ser,s)).slice(0,4),E:sents.filter(s=>score(lex.estar,s)||score(lex.barrier,s)).slice(0,4),D:sents.filter(s=>score(lex.decir,s)||score(lex.operation,s)).slice(0,4),H:sents.filter(s=>score(lex.hacer,s)).slice(0,4),phi:sents.filter(s=>score(lex.barrier,s)||/duda|precio|acceso|barrera|resistencia/i.test(s)).slice(0,4),G:sents.filter(s=>/busca|intenta|pretende|transformar|llevar|convertir/i.test(s)).slice(0,4)};
  const a={actors,concepts,evidence,scores:{S:score(lex.ser,raw),E:score(lex.estar,raw),D:score(lex.decir,raw)+score(lex.operation,raw),H:score(lex.hacer,raw),barrier:score(lex.barrier,raw),positive:score(lex.positive,raw)},raw};
  return inferScenario(a);
 })()`;
 const sc=vm.runInContext(code,sandbox);
 assert(sc.issue.toLowerCase().includes("hänsel")||sc.issue.toLowerCase().includes("hansel"));
 assert(sc.issue.toLowerCase().includes("supervivencia")||sc.hLabel.toLowerCase().includes("sobrevivir"));
 assert(!sc.issue.toLowerCase().includes("joyería"));
 assert(!sc.hLabel.toLowerCase().includes("joyería"));
});
test("incluye generación de escenario desde texto",()=>assert(html.includes("Generar escenario desde texto")&&html.includes("function inferScenario")&&html.includes("applyScenarioFields")));
test("reporte ya no contiene escapes literales de newline",()=>assert(!html.includes('join("\\\\\\\\n")')));
test("sin utilidad ni amenaza",()=>{const lower=html.toLowerCase();assert(!lower.includes("expectedutility")&&!lower.includes("utility(")&&!lower.includes("matriz de amenazas")&&!lower.includes("threat"));});
let p=0;for(const t of tests){try{t.fn();console.log("PASS",t.n);p++;}catch(e){console.error("FAIL",t.n,"\n ",e.message);}}console.log(`\n${p}/${tests.length} PASS`);if(p!==tests.length)process.exit(1);
