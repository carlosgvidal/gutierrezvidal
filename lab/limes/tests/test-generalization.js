"use strict";
const assert=require("assert"),fs=require("fs"),path=require("path"),vm=require("vm");
const ROOT=path.resolve(__dirname,"..");
const modules=["limes-core.js","spanish-semantics.js","entity-engine.js","semantic-engine.js","event-engine.js","game-ontology.js","synthesis-engine.js","game-engine.js","analysis-engine.js"];
const production=modules.concat(["app.js"]).map(f=>fs.readFileSync(path.join(ROOT,"js",f),"utf8")).join("\n")+"\n"+fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
const forbidden=[
  /Fausto\s+Corrales/i,/Claudia\s+Sheinbaum/i,/Ismael\s+.*Zambada/i,/Cu[eé]n\s+Ojeda/i,
  /Comunidad\s+de\s+Pequeños\s+Anfitriones/i,/Blanca\s+Lolb/i,/Clara\s+Brugada/i,/Martes\s+Ciudadano/i,
  /Rosa\s+Icela\s+Rodr[ií]guez/i,/Ronald\s+Johnson/i,/Instituto\s+Nacional\s+de\s+Migraci[oó]n/i,
  /Border\s+Protection/i,/\bCBP\b/,/H[aä]nsel/i,/Gretel/i,
  /judicial_detention\|corrales/i,/witch-episode/i,/gretel-episode/i,/breadcrumbs/i,/third_country_transfer/i,
  /guijarr/i,/\bmigas?\b/i,/hospedaje/i,/tercer\s+pa[ií]s/i,/anfitrion/i,/integrante\s+de\s+la\s+comunidad/i
];
for(const rx of forbidden)assert(!rx.test(production),`fixture/case leakage in production: ${rx}`);

const sandbox={window:{},console,Number,Math,String,JSON,Map,Set,RegExp,Error,Date,Intl,fetch:async()=>{throw new Error("offline")}};sandbox.window=sandbox;vm.createContext(sandbox);for(const f of modules)vm.runInContext(fs.readFileSync(path.join(ROOT,"js",f),"utf8"),sandbox,{filename:f});
const ns=sandbox.Limes52;ns.Spanish.loadDictionary=async()=>({status:"test-stub",size:0,affixRules:0});
const analyze=raw=>ns.Analysis.analyze(raw);
(async()=>{
  const reg=await analyze("El Ayuntamiento de Mérida estableció una restricción para comercios ambulantes. La Asociación de Vendedores rechazó la medida y solicitó al Ayuntamiento revisarla.");
  assert.strictEqual(reg.events.domain.id,"regulacion");
  assert(reg.semiotic.programs.length>=2);
  assert(reg.semiotic.counterPrograms.length>=1);

  const narr=await analyze("Elena Torres decidió encerrar a Mario Rivas. Mario Rivas intentó marcar una ruta, escapó del recinto y regresó con su familia. Elena Torres volvió a perseguirlo, pero Mario Rivas logró huir.");
  assert(!narr.semiotic.actors.some(a=>/ruta|recinto|familia/i.test(a.id)));
  assert(narr.events.episodes.some(e=>e.family==="capture"));
  assert(narr.events.episodes.some(e=>e.family==="counteraction"||e.family==="return_restoration"));

  const mov=await analyze("La Agencia Nacional de Movilidad informó que repatriará a un grupo de personas. ANM coordina el procedimiento fronterizo con otra autoridad y cuestionó una modalidad de traslado.");
  assert.strictEqual(mov.events.domain.id,"migracion");
  assert(mov.entities.some(e=>e.name==="Agencia Nacional de Movilidad"));
  assert(mov.entities.some(e=>e.name==="ANM"||e.aliases?.includes("ANM")));

  const legal=await analyze("La Fiscalía Regional investiga un homicidio. El juez autorizó detener a Pedro Salas y la fiscalía informó que la investigación continúa abierta.");
  assert.strictEqual(legal.events.domain.id,"investigacion");
  assert(!legal.game.determined||legal.game.determined.gameId!=="screening");

  console.log("PASS no fixture/case data in production");
  console.log("PASS unseen regulation generalizes");
  console.log("PASS unseen narrative uses generic hierarchy");
  console.log("PASS unseen mobility case uses generic rules");
  console.log("PASS unseen judicial case does not force screening");
  console.log("5/5 PASS");
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
