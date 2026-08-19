"use strict";
const assert=require("assert");
const fs=require("fs");
const path=require("path");
const core=require("./js/core.js");

const tests=[];
function test(name,fn){tests.push({name,fn});}

const A={id:"A",S:.8,E:.5,H:.2};
const B={id:"B",S:.6,E:.7,H:.2};

test("R = S×E",()=>assert(Math.abs(core.symbolicResources(A)-.4)<1e-12));
test("phi=0 bloquea movimiento",()=>{
 const r=core.predictInteraction(A,B,{source:"A",target:"B",D:1,phi:0,G:1});
 assert.strictEqual(r.deltaH,0);
});
test("D=0 bloquea movimiento",()=>{
 const r=core.predictInteraction(A,B,{source:"A",target:"B",D:0,phi:1,G:1});
 assert.strictEqual(r.deltaH,0);
});
test("H=G produce deltaH=0",()=>{
 const T={...B,H:.8};
 const r=core.predictInteraction(A,T,{source:"A",target:"B",D:1,phi:1,G:.8});
 assert.strictEqual(r.deltaH,0);
});
test("movimiento positivo se acerca sin sobrepasar G",()=>{
 const r=core.predictInteraction(A,B,{source:"A",target:"B",D:1,phi:1,G:1});
 assert(r.deltaH>0 && r.Hafter>B.H && r.Hafter<=1);
});
test("movimiento negativo se acerca sin sobrepasar G",()=>{
 const T={...B,H:.9};
 const r=core.predictInteraction(A,T,{source:"A",target:"B",D:1,phi:1,G:.1});
 assert(r.deltaH<0 && r.Hafter<T.H && r.Hafter>=.1);
});
test("secuencia usa H actualizado",()=>{
 const out=core.runSequence([A,B],[
  {source:"A",target:"B",D:1,phi:1,G:1},
  {source:"A",target:"B",D:1,phi:1,G:1}
 ]);
 assert(out.history[1].Hbefore===out.history[0].Hafter);
 assert(out.history[1].Hafter>out.history[0].Hafter);
});
test("entrada incompleta se rechaza",()=>{
 assert.throws(()=>core.predictInteraction(A,B,{source:"A",target:"B",D:1,phi:1}),/falta G/);
});
test("S,E,H no se normalizan entre sí",()=>{
 const C={id:"C",S:.9,E:.9,H:.9};
 core.validateActor(C);
 assert.strictEqual(C.S+C.E+C.H,2.7);
});
test("núcleo no contiene utilidad esperada",()=>{
 const src=fs.readFileSync(path.join(__dirname,"js/core.js"),"utf8").toLowerCase();
 assert(!src.includes("expectedutility")&&!src.includes("utility(")&&!src.includes("threat"));
});

let passed=0;
for(const t of tests){
 try{t.fn();console.log("PASS",t.name);passed++;}
 catch(e){console.error("FAIL",t.name,"\n ",e.message);}
}
console.log(`\n${passed}/${tests.length} PASS`);
if(passed!==tests.length) process.exit(1);
