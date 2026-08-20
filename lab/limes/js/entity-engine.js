"use strict";
(function(global){
const ns=global.Limes52=global.Limes52||{},ES=()=>ns.Spanish;
const ORG_PATTERNS=[
 {canonical:"Fiscalía General de la República",aliases:["FGR","Fiscalía","Fiscalia","la Fiscalía","la Fiscalia"],type:"INSTITUTION",role:"autoridad investigadora / fuente epistémica",rx:/\bFiscal[ií]a General de la Rep[uú]blica\b|\bFGR\b/gi},
 {canonical:"Fiscalía Especial de Investigación y Litigación de Casos Complejos",aliases:["Fiscalía Especial de Investigación y Litigación de Casos Complejos"],type:"INSTITUTION",role:"unidad investigadora",rx:/Fiscal[ií]a Especial de Investigaci[oó]n y Litigaci[oó]n de Casos Complejos/gi},
 {canonical:"Fiscalía Especializada de Control Regional",aliases:["FECOR"],type:"INSTITUTION",role:"unidad investigadora",rx:/Fiscal[ií]a Especializada de Control Regional|\bFECOR\b/gi},
 {canonical:"Policía Federal Ministerial",aliases:["PFM"],type:"INSTITUTION",role:"ejecutor operativo",rx:/Polic[ií]a Federal Ministerial|\bPFM\b/gi},
 {canonical:"Agencia de Investigación Criminal",aliases:["AIC"],type:"INSTITUTION",role:"agencia investigadora",rx:/Agencia de Investigaci[oó]n Criminal|\bAIC\b/gi},
 {canonical:"Interpol",aliases:["INTERPOL"],type:"INSTITUTION",role:"cooperación policial",rx:/\bInterpol\b|\bINTERPOL\b/g},
 {canonical:"Universidad Autónoma de Sinaloa",aliases:["UAS"],type:"INSTITUTION",role:"institución contextual",rx:/Universidad Aut[oó]noma de Sinaloa|\bUAS\b/gi},
 {canonical:"Cártel de Sinaloa",aliases:["Cartel de Sinaloa"],type:"ORGANIZATION",role:"organización contextual",rx:/C[aá]rtel de Sinaloa/gi},
 {canonical:"gobierno / autoridades",aliases:["gobierno federal","Gobierno de la Ciudad de México","Gobierno capitalino","autoridades","autoridades capitalinas","gobierno"],type:"GOVERNMENT",role:"autoridad pública",rx:/\b(?:gobierno federal|Gobierno de la Ciudad de M[eé]xico|Gobierno capitalino|autoridades capitalinas|autoridades|gobierno)\b/gi},
 {canonical:"Comunidad de Pequeños Anfitriones",aliases:["La Comunidad de Pequeños Anfitriones","comunidad","anfitriones","pequeños anfitriones"],type:"COLLECTIVE",role:"actor regulado / colectivo organizado",rx:/Comunidad de Pequeños Anfitriones|\bpequeños anfitriones\b|\banfitriones\b/gi}
];
const PLACE_WORDS=new Set(["México","Sinaloa","Culiacán","Culiacan","Estados Unidos"]);
const FALSE_CAP=new Set("La El Los Las En Durante Según De Y Sí No Quién FGR Fiscalía Gobierno Presidenta Mandataria Ese Ese Ese Sin Al Acá Aquí Como Cuando Entonces Después Luego".split(/\s+/));
function pushEntity(reg,e,mention,index){
 let x=reg.get(e.canonical);if(!x){x={id:"ent"+(reg.size+1),name:e.canonical,type:e.type||"UNKNOWN",subtype:e.subtype||"",role:e.role||"",aliases:[...(e.aliases||[])],mentions:[],confidence:e.confidence||"media",operationalCandidate:e.operationalCandidate!==false};reg.set(e.canonical,x);}if(mention&&!x.mentions.some(m=>m.text===mention&&m.index===index))x.mentions.push({text:mention,index});return x;
}
function detectOrganizations(raw,reg){for(const p of ORG_PATTERNS){p.rx.lastIndex=0;let m;while((m=p.rx.exec(raw)))pushEntity(reg,p,m[0],m.index);}}
function detectRoleEntities(raw,reg){
 const patterns=[
  {canonical:"juez de Control federal",type:"COURT_ROLE",role:"autorizador jurídico",rx:/\b(?:un |el )?juez de Control federal\b/gi},
  {canonical:"Presidencia de la República",type:"GOVERNMENT",role:"arena político-discursiva",rx:/\bPresidencia de la Rep[uú]blica\b/gi}
 ];for(const p of patterns){let m;while((m=p.rx.exec(raw)))pushEntity(reg,p,m[0],m.index);}
}
function personCandidates(raw){
 const out=[];
 const titleRx=/\b(?:presidenta|presidente|mandataria|mandatario|fiscal|rector|exrector|juez|gobernadora|gobernador|senadora|senador|diputada|diputado)\s+([A-ZÁÉÍÓÚÑ][\p{L}'’-]+(?:\s+[A-ZÁÉÍÓÚÑ][\p{L}'’-]+){1,4})/gu;let m;
 while((m=titleRx.exec(raw)))out.push({name:m[1],index:m.index,confidence:"alta"});
 const cap=/\b([A-ZÁÉÍÓÚÑ][\p{L}'’-]+(?:\s+(?:de|del|la|las|los|y)?\s*[A-ZÁÉÍÓÚÑ][\p{L}'’-]+){1,4})\b/gu;
 while((m=cap.exec(raw))){let name=m[1].replace(/\s+/g," ").trim();const first=name.split(/\s+/)[0];if(FALSE_CAP.has(first))continue;if(/Fiscal|República|Investigación|Policía|Agencia|Universidad|Gobierno|Ciudad de México|Estados Unidos|Huertos del Pedregal|Santa Julia/i.test(name))continue;out.push({name,index:m.index,confidence:"media"});}
 return out;
}
function normalizePersonName(name){return name.replace(/^(?:La|El)\s+/,"").trim();}
function detectPersons(raw,reg){
 const special=[{canonical:"Ismael Zambada",aliases:["Ismael “El Mayo” Zambada","Ismael \"El Mayo\" Zambada","El Mayo Zambada","Zambada"],type:"PERSON",role:"referente de acontecimiento relacionado",rx:/Ismael\s+[“\"]El Mayo[”\"]\s+Zambada|Ismael\s+Zambada/gi}];for(const sp of special){let m;while((m=sp.rx.exec(raw)))pushEntity(reg,sp,m[0],m.index);}
 const seen=[];for(const c of personCandidates(raw)){const name=normalizePersonName(c.name);if(name.split(/\s+/).length<2)continue;if(seen.some(x=>x.includes(name)||name.includes(x)))continue;seen.push(name);pushEntity(reg,{canonical:name,type:"PERSON",role:"persona",confidence:c.confidence},name,c.index);}
 // Canonical aliases for titles after full person has appeared.
 const persons=[...reg.values()].filter(e=>e.type==="PERSON");
 for(const e of persons){const parts=e.name.split(/\s+/);if(parts.length>=2){const surname=parts[parts.length-1];if(surname.length>3&&!e.aliases.includes(surname))e.aliases.push(surname);}}
 const shein=persons.find(e=>/Sheinbaum/i.test(e.name));if(shein){for(const a of ["Presidenta","presidenta","mandataria","la Presidenta","La mandataria"]){if(new RegExp(`\\b${a.replace(/ /g,"\\s+")}\\b`,"i").test(raw)&&!shein.aliases.includes(a))shein.aliases.push(a);}}
}
function detectPlaces(raw,reg){for(const p of PLACE_WORDS){const rx=new RegExp(`\\b${p}\\b`,"g");let m;while((m=rx.exec(raw)))pushEntity(reg,{canonical:p,type:"PLACE",role:"lugar / contexto",operationalCandidate:false},m[0],m.index);}}
function detectNarrativeRoles(raw,reg){const roles=[
 ["Hänsel",/[Hh][äa]nsel/g,"PERSON","actor de orientación"],["Gretel",/Gretel/g,"PERSON","actor de contraacción"],["madrastra",/madrastra/gi,"PERSON_ROLE","amenaza familiar"],["padre",/\bpadre\b|\bleñador\b/gi,"PERSON_ROLE","mediador ambivalente"],["bruja",/\bbruja\b|\bvieja\b/gi,"PERSON_ROLE","amenaza de captura"]];
 for(const [name,rx,type,role] of roles){let m;while((m=rx.exec(raw)))pushEntity(reg,{canonical:name,type,role},m[0],m.index);}if(reg.has("Hänsel")&&reg.has("Gretel"))pushEntity(reg,{canonical:"Hänsel y Gretel",aliases:["niños","hijos","hermanitos"],type:"COLLECTIVE",role:"actor vulnerable / resistencia"},"Hänsel y Gretel",0);
}
function assignFunctionalRoles(raw,entities){const n=ES().strip(raw);for(const e of entities){const name=ES().strip(e.name),contexts=e.mentions.map(m=>raw.slice(Math.max(0,m.index-120),Math.min(raw.length,m.index+220))).join(" ").toLowerCase();if(e.type==="PERSON"&&/sheinbaum/.test(name))e.role="autoridad política / fuente discursiva";if(e.type==="PERSON"&&/corrales/.test(name))e.role=/detenci|falsedad|encubrimiento|declaracion/.test(contexts)?"investigado / fuente potencial de información":"persona referida";if(e.type==="PERSON"&&/cu[eé]n/.test(name))e.role="víctima / referente del acontecimiento";if(e.type==="PERSON"&&/zambada/.test(name))e.role="referente de acontecimiento relacionado";if(e.type==="INSTITUTION"&&/fiscal[ií]a general/.test(name))e.role="autoridad investigadora / fuente epistémica";}}
function detect(raw){const reg=new Map();detectOrganizations(raw,reg);detectRoleEntities(raw,reg);detectNarrativeRoles(raw,reg);detectPersons(raw,reg);detectPlaces(raw,reg);const entities=[...reg.values()];assignFunctionalRoles(raw,entities);
 // Deduplicate person fragments contained in longer names.
 const persons=entities.filter(e=>e.type==="PERSON");for(const e of persons){const longer=entities.find(x=>x!==e&&x.name.includes(e.name)&&x.name.length>e.name.length);if(longer)e.suppressed=true;}
 return entities.filter(e=>!e.suppressed).sort((a,b)=>b.mentions.length-a.mentions.length||a.name.localeCompare(b.name));}
function aliasesFor(e){return [e.name,...(e.aliases||[])];}
function mentionsIn(text,entities){const n=ES().strip(text),out=[];for(const e of entities){if(aliasesFor(e).some(a=>a&&n.includes(ES().strip(a))))out.push(e.name);}return [...new Set(out)];}
function resolveActor(text,entities,{preferBefore=""}={}){const n=ES().strip(text),mentions=mentionsIn(text,entities);if(!mentions.length)return "";if(preferBefore){const i=n.indexOf(ES().strip(preferBefore));if(i>=0){const before=mentions.filter(x=>{const p=n.indexOf(ES().strip(x));return p>=0&&p<i;});if(before.length)return before[before.length-1];}}return mentions[0];}
ns.Entities={detect,mentionsIn,resolveActor,ORG_PATTERNS};
})(window);
