"use strict";
const assert=require("assert"),fs=require("fs"),path=require("path"),vm=require("vm");
const html=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.strictEqual(scripts.length,1);
const corePart=scripts[0].split("const $=s=>document.querySelector")[0];
const sandbox={window:{},console,Number,Math,String,JSON,Map,Error,Set,RegExp};sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(corePart,sandbox);
const core=sandbox.LimesCore,A={id:"A",S:.8,E:.7,H:.25},B={id:"B",S:.55,E:.6,H:.2};
const tests=[];function test(n,fn){tests.push({n,fn});}
test("R = S×E",()=>assert(Math.abs(core.symbolicResources(A)-.56)<1e-12));
test("ecuación base",()=>{const r=core.predictInteraction(A,B,{source:"A",target:"B",D:.7,phi:.5,G:.8});assert(Math.abs(r.X-.196)<1e-12);assert(Math.abs(r.deltaH-.1176)<1e-12);});
test("secuencia actualiza H",()=>{const out=core.runSequence([A,B],[{source:"A",target:"B",D:.7,phi:.5,G:.8},{source:"A",target:"B",D:.5,phi:.5,G:.5}]);assert(out.history[1].Hbefore===out.history[0].Hafter);});
test("incluye corpus",()=>assert(html.includes('id="corpus"')&&html.includes("Analizar texto")));
test("incluye carga de evidencia textual",()=>assert(html.includes("loadTextEvidence")&&html.includes("textAnalysis")));
test("incluye modo H evaluable",()=>assert(html.includes("hmode")&&html.includes("H no evaluado")));
test("sin utilidad ni amenaza",()=>{const lower=html.toLowerCase();assert(!lower.includes("expectedutility")&&!lower.includes("utility(")&&!lower.includes("amenaza")&&!lower.includes("threat"));});
let p=0;for(const t of tests){try{t.fn();console.log("PASS",t.n);p++;}catch(e){console.error("FAIL",t.n,"\n ",e.message);}}console.log(`\n${p}/${tests.length} PASS`);if(p!==tests.length)process.exit(1);
