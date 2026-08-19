"use strict";

const lex={
 ser:["soy","somos","identidad","cuerpo","vida","valor","valores","creencia","miedo","dignidad","principio","principios","esencia","memoria","origen","pertenencia","legitimidad","autonomía","autonomia","derechos","cultura","patrimonio","tradición","tradicion"],
 estar:["territorio","sociedad","institución","institucion","instituciones","frontera","contexto","espacio","comunidad","comunidades","mercado","entorno","estructura","ubicación","ubicacion","sector","región","region","municipio","estatal","federal","local"],
 decir:["decir","lenguaje","discurso","texto","palabra","narrativa","mensaje","significado","comunicación","comunicacion","relato","declarar","nombrar","representar","informe","comunicado","declaración","declaracion","anuncio","señalar","senalar"],
 hacer:["hacer","acción","accion","cambiar","transformar","intervenir","crear","movilizar","decidir","implementar","ejecutar","actuar","presionar","negociar","reforma","programa","financiamiento","proyecto","mecanismo","esquema","gasto"]
};
const posWords=["innovar","innovacion","abrir","apertura","cooperar","cooperacion","libertad","desarrollar","desarrollo","mejorar","crear","creacion","oportunidad","acordar","acuerdo","avanzar","avance","incluir","inclusion","dialogar","dialogo","respaldar","respaldo","apoyar","apoyo","celebrar","consenso","alianza","colaborar","colaboracion","beneficio","fortalecer","impulsar","impulso"];
const negWords=["crisis","riesgo","amenazar","amenaza","conflicto","prohibir","rechazar","rechazo","violencia","perdida","pérdida","fracasar","fracaso","corrupcion","exclusion","ruptura","tension","opacidad","denunciar","denuncia","bloquear","irregularidad","escandalo","desconfianza","confrontacion","hostilidad","provocacion"];
const actionWords=["anunciar","proponer","exigir","rechazar","defender","impulsar","apoyar","criticar","advertir","solicitar","ordenar","promover","acusar","negociar","decidir","implementar","presentar","declarar","afirmar","sostener","movilizar","intervenir"];
const irregularVerbForms={
 exigir:["exige","exigen","exigió","exigieron","exigiendo","exigirá","exigirán"],
 advertir:["advierte","advierten","advirtió","advirtieron","advirtiendo","advertirá","advertirán"],
 defender:["defiende","defienden","defendió","defendieron","defendiendo","defenderá","defenderán"],
 sostener:["sostiene","sostienen","sostuvo","sostuvieron","sosteniendo","sostendrá","sostendrán"],
 acordar:["acuerda","acuerdan","acordó","acordaron","acordando","acordará","acordarán"],
 promover:["promueve","promueven","promovió","promovieron","promoviendo","promoverá","promoverán"],
 desconocer:["desconoce","desconocen","desconoció","desconocieron","desconociendo"],
 construir:["construye","construyen","construyó","construyeron","construyendo"],
 desafiar:["desafía","desafían","desafió","desafiaron","desafiando"],
 poder:["puede","pueden","pudo","pudieron","pudiendo","podrá","podrán"],
 convocar:["convoca","convocan","convocó","convocaron","convocando"],
 proponer:["propone","proponen","propuso","propusieron","proponiendo","propondrá","propondrán"],
 intervenir:["interviene","intervienen","intervino","intervinieron","interviniendo","intervendrá","intervendrán"],
 incluir:["incluye","incluyen","incluyó","incluyeron","incluyendo"]
};
function conjugatedForms(infinitive){
 const irregular=irregularVerbForms[infinitive];
 if(irregular)return irregular;
 if(!/(ar|er|ir)$/.test(infinitive))return [infinitive];
 const stem=infinitive.slice(0,-2),ending=infinitive.slice(-2);
 if(ending==="ar")return [stem+"a",stem+"an",stem+"ó",stem+"aron",stem+"ando",stem+"ará",stem+"arán",stem+"aba",stem+"aban"];
 if(ending==="er")return [stem+"e",stem+"en",stem+"ió",stem+"ieron",stem+"iendo",stem+"erá",stem+"erán",stem+"ía",stem+"ían"];
 return [stem+"e",stem+"en",stem+"ió",stem+"ieron",stem+"iendo",stem+"irá",stem+"irán",stem+"ía",stem+"ían"];
}
function isLikelyVerb(word){
 return /(ar|er|ir)$/.test(word);
}
function lexicalForms(word){
 if(isLikelyVerb(word))return [word,...conjugatedForms(word)];
 const plural=/[aeiou]$/.test(word)?word+"s":/[^aeiou]$/.test(word)?word+"es":word;
 return plural!==word?[word,plural]:[word];
}
const relationVerbs={
 cooperacion:["apoyar","respaldar","cooperar","acordar","negociar","dialogar","coordinar","acompañar","impulsar","promover","defender","asistir","colaborar"],
 conflicto:["rechazar","criticar","acusar","amenazar","confrontar","impugnar","denunciar","bloquear","prohibir","exigir","presionar","advertir","cuestionar","desafiar","desconocer"],
 control:["ordenar","regular","autorizar","sancionar","limitar","supervisar","administrar","dirigir","fiscalizar","intervenir"],
 comunicacion:["declarar","afirmar","sostener","anunciar","presentar","informar","comunicar","señalar","expresar","manifestar","reiterar","aclarar","calificar"],
 transformacion:["cambiar","reformar","implementar","intervenir","movilizar","crear","modificar","eliminar","transformar","construir","desmantelar"]
};
const negationWords=["no","nunca","jamás","jamas","sin","niega","negó","nego"];
const relationConnectors=["a","al","contra","frente a","con","junto a","sobre","ante","hacia","para","por"];

const powerWords=["gobierno","presidencia","secretaria","ministerio","congreso","senado","tribunal","empresa","corporacion","partido","sindicato","organizacion","universidad","banco","ejercito","policia","camara","confederacion","federacion","consejo","comision","fiscalia","procuraduria","ayuntamiento","alcaldia","oposicion"];
const collectiveActors=["gobierno","oposicion","empresarios","sindicatos","ciudadania","sociedad civil","opinion publica","mercado","consumidores","trabajadores","estudiantes","academia","medios","prensa","comunidad","sector privado","sector publico","autoridades"];
const orgMarkers=["Gobierno","Secretaría","Secretaria","Ministerio","Instituto","Universidad","Congreso","Senado","Cámara","Camara","Partido","Sindicato","Asociación","Asociacion","Consejo","Comisión","Comision","Fundación","Fundacion","Banco","Empresa","Corporación","Corporacion","Colectivo","Frente","Movimiento","Organización","Organizacion","Agencia","Tribunal","Suprema Corte","Ayuntamiento","Municipio"];
const roleNouns=["candidato","candidata","partido","empresa","marca","competidor","competidora","competencia","cliente","clientes","analista","equipo","organizacion","institucion","industria","seguidor","seguidora","votante","elector","electora","aliado","aliada","rival","proveedor","proveedora","inversionista","accionista","regulador","reguladora","rector","rectora","docente","estudiante","egresado","egresada","prospecto","influencer","padre","madre","universidad","ministerio","acreditadora"];
const roleNounsNoPlural=new Set(["empresa"]);
const roleAdjectives=["presidencial","opositora","opositor","oficialista","independiente","lider","líder","principal","rival","saliente","entrante","gobernante","electo","electa","favorito","favorita","internacional","nacional","local","extranjera","extranjero","estatal","federal"];
const roleDeterminers=["el","la","los","las","su","sus","ambos","ambas","este","esta","estos","estas","dicho","dicha"];
const stop=new Set(["el","la","los","las","de","del","y","en","un","una","por","para","con","que","se","es","al","como","su","sus","lo","le","les","o","a","e","ya","más","mas","menos","muy","este","esta","estos","estas","ese","esa","esos","esas"]);
const actorFalsePositives=new Set(["Hoy","Ayer","Mañana","Parte","Capítulo","Capitulo","Sección","Seccion","Esto","Esta","Este","Estos","Estas","El","La","Los","Las","Un","Una","Sin","Con","Por","Para","Desde","Hasta","Cuando","Como","Aunque","Además","Ademas","Finalmente","Primero","Segundo","Tercero","México","Mexico"]);
let detectedActors=[];
let lastEngine=null;
let focalActorId=0;
let detectedRelations=[];
