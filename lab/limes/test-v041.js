"use strict";
const assert=require("assert");
const fs=require("fs");
const path=require("path");

const html=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert(scripts.length===1,"Debe existir un solo script inline para evitar dependencias externas.");

const vm=require("vm");
const sandbox={window:{},document:{querySelector(){return null;},querySelectorAll(){return [];}},console,Blob:function(){},URL:{createObjectURL(){},revokeObjectURL(){}},alert(){},Number,Math,String,JSON,Map,Error,RegExp};
sandbox.window=sandbox;
vm.createContext(sandbox);

// Ejecuta sólo la parte del core antes de const $ para evitar DOM real.
const corePart=scripts[0].split("const $=s=>document.querySelector(s);")[0];
vm.runInContext(corePart,sandbox);
const core=sandbox.LimesCore;

const tests=[];
function test(name,fn){tests.push({name,fn});}
const A={id:"A",S:.8,E:.7,H:.25};
const B={id:"B",S:.55,E:.6,H:.2};

test("R = S×E",()=>assert(Math.abs(core.symbolicResources(A)-.56)<1e-12));
test("escenario base produce ΔH esperado",()=>{
 const r=core.predictInteraction(A,B,{source:"A",target:"B",D:.7,phi:.5,G:.8});
 assert(Math.abs(r.X-.196)<1e-12);
 assert(Math.abs(r.deltaH-.1176)<1e-12);
 assert(Math.abs(r.Hafter-.3176)<1e-12);
});
test("phi=0 bloquea movimiento",()=>{
 const r=core.predictInteraction(A,B,{source:"A",target:"B",D:1,phi:0,G:1});
 assert.strictEqual(r.deltaH,0);
});
test("D=0 bloquea movimiento",()=>{
 const r=core.predictInteraction(A,B,{source:"A",target:"B",D:0,phi:1,G:1});
 assert.strictEqual(r.deltaH,0);
});
test("secuencia actualiza H del receptor",()=>{
 const out=core.runSequence([A,B],[{source:"A",target:"B",D:.7,phi:.5,G:.8},{source:"A",target:"B",D:.7,phi:.5,G:.8}]);
 assert(out.history[1].Hbefore===out.history[0].Hafter);
 assert(out.actors.find(a=>a.id==="B").H>out.history[0].Hafter);
});
test("valores incompletos se rechazan",()=>{
 assert.throws(()=>core.predictInteraction(A,B,{source:"A",target:"B",D:.7,phi:.5}),/falta G/);
});
test("no contiene utilidad esperada ni amenazas",()=>{
 const lower=html.toLowerCase();
 assert(!lower.includes("expectedutility")&&!lower.includes("utility(")&&!lower.includes("amenaza")&&!lower.includes("threat"));
});
test("usa versión v0.41",()=>assert(html.includes("v0.41")));
test("incluye exportación de reporte",()=>assert(html.includes("Exportar reporte TXT")&&html.includes("Exportar JSON")));

let passed=0;
for(const t of tests){
 try{t.fn();console.log("PASS",t.name);passed++;}
 catch(e){console.error("FAIL",t.name,"\n ",e.message);}
}
console.log(`\n${passed}/${tests.length} PASS`);
if(passed!==tests.length)process.exit(1);
