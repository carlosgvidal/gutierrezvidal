"use strict";
(function(global){
const ns=global.Limes52=global.Limes52||{};
const ACC=/[\u0300-\u036f]/g;
const strip=s=>String(s||"").normalize("NFD").replace(ACC,"").toLowerCase();
const STOP=new Set(`a al algo algun alguna algunas alguno algunos ante antes aqui asi aun aunque bajo bien cada como con contra cual cuando de del desde donde dos e el ella ellas ellos en entre era eran es esa ese eso esta estaba estaban este esto fue ha han hasta hay la las le les lo los mas me mi mientras muy ni no nos o otra otro para pero por porque que quien quienes se ser si sin sobre su sus tambien te tenia tiene tienen todo tras tu un una uno unos ya y entonces luego habia habian habría habrian`.split(/\s+/));
const ATTRIBUTION=new Set(`decir dijo dijeron señalar señalo señalaron indicar indico indicaron asegurar aseguro aseguraron afirmar afirmo afirmaron agregar agrego agregaron explicar explico explicaron informar informo informaron recordar recordo recordó insistir insistio insistió subrayar subrayo calificó calificar responder respondio pedir pidió`.split(/\s+/).map(strip));
const IRREGULAR={
 "fue":"ser","eran":"ser","era":"ser","es":"ser","son":"ser","estuvo":"estar","estaba":"estar","estan":"estar","están":"estar",
 "dijo":"decir","dijeron":"decir","señalo":"señalar","señaló":"señalar","indicaron":"indicar","aseguraron":"asegurar","afirmo":"afirmar","afirmó":"afirmar",
 "pidio":"pedir","pidió":"pedir","pide":"pedir","detuvo":"detener","detencion":"detener","detención":"detener","aprehension":"detener","aprehensión":"detener",
 "impuso":"imponer","impuesto":"imponer","establecio":"establecer","estableció":"establecer","rechazo":"rechazar","rechazó":"rechazar",
 "volvio":"volver","volvió":"volver","regreso":"regresar","regresó":"regresar","encontro":"encontrar","encontró":"encontrar",
 "abandono":"abandonar","abandonó":"abandonar","dejo":"dejar","dejó":"dejar","encerró":"encerrar","encerro":"encerrar",
 "atribuyo":"atribuir","atribuye":"atribuir","omitio":"omitir","omitió":"omitir","obstaculizo":"obstaculizar","obstaculizó":"obstaculizar",
 "permitira":"permitir","permitirá":"permitir","podria":"poder","podría":"poder","habria":"haber","habría":"haber"
};
const BASE_VERBS=[
 "ser","estar","haber","existir","permanecer","tener","poseer","carecer","vivir","morir","nacer",
 "decir","señalar","indicar","asegurar","afirmar","informar","explicar","recordar","insistir","subrayar","calificar","responder","preguntar","declarar","negar","admitir","denunciar","argumentar","exhortar","pedir","solicitar","exigir","prometer","anunciar","advertir",
 "hacer","realizar","ejecutar","detener","capturar","aprehender","arrestar","liberar","trasladar","secuestrar","matar","asesinar","encubrir","omitir","falsificar","contradecir","obstaculizar","investigar","esclarecer","reconstruir","atribuir","acusar","imputar","ordenar","autorizar","coordinar","cumplir",
 "imponer","regular","restringir","limitar","prohibir","establecer","reformar","aprobar","eliminar","retirar","modificar","negociar","impugnar","litigar","amparar","rechazar","presionar",
 "abandonar","dejar","llevar","volver","regresar","retornar","orientar","guiar","encontrar","buscar","desmigar","comer","devorar","encerrar","engordar","amenazar","empujar","escapar","huir","salvar","abrir","cerrar","quemar","adquirir","tomar","recuperar",
 "comprar","vender","persuadir","atraer","adoptar","participar","votar","cooperar","coordinar","competir","señalizar","observar","inspeccionar","monitorear","entrar","salir","invertir","ofrecer","aceptar","revelar","ocultar"
];
const LOGIC=[
 {op:"NOT",rx:/\b(no|nunca|jamas|jamás|sin)\b/},
 {op:"AND",rx:/\b(y|e|ademas|además|tambien|también)\b/},
 {op:"OR",rx:/\b(o|u|ya sea)\b/},
 {op:"IF",rx:/\b(si|en caso de que|siempre que)\b/},
 {op:"CAUSE",rx:/\b(porque|debido a|a causa de|puesto que|ya que)\b/},
 {op:"PURPOSE",rx:/\b(para|a fin de|con el objeto de|con la intención de|con la intencion de)\b/},
 {op:"CONTRAST",rx:/\b(pero|sin embargo|aunque|no obstante)\b/},
 {op:"BEFORE",rx:/\b(antes de|previamente)\b/},
 {op:"AFTER",rx:/\b(despues de|después de|posteriormente|luego)\b/},
 {op:"POSSIBLE",rx:/\b(podria|podría|puede que|posible|probable|habria|habría)\b/},
 {op:"NECESSARY",rx:/\b(debe|deben|tiene que|tienen que|obligad\w*)\b/}
];
const SENSE_RULES=[
 {lemma:"volver",sense:"ORIENTATION_BACKWARD",type:"HACER",rx:/\bvolv\w*\s+a\s+mirar|volverse\s+a\s+mirar|mirar\s+atras|mirar\s+atrás/},
 {lemma:"volver",sense:"MOTION_RETURN",type:"HACER",rx:/\b(volv\w*|regres\w*|retorn\w*)\b.*\b(casa|hogar|lugar|origen|padre)\b/},
 {lemma:"volver",sense:"ASPECTUAL_REPETITION",type:"HACER",rx:/\bvolv\w*\s+a\s+\w+/},
 {lemma:"encontrar",sense:"MEANS_IDENTIFICATION",type:"ESTAR",rx:/\bencontr\w*\s+(en\s+.+\s+)?una\s+manera|encontr\w*\s+la\s+forma/},
 {lemma:"encontrar",sense:"DISCOVERY",type:"HACER",rx:/\bencontr\w*\b/},
 {lemma:"imponer",sense:"TAX_NOUN",type:"ESTAR",rx:/\bimpuesto\s+(sobre|al|de)\b/},
 {lemma:"imponer",sense:"INSTITUTIONAL_IMPOSITION",type:"HACER",rx:/\b(impus\w*|impuesto por|se impuso|imponer)\b/},
 {lemma:"camino",sense:"IDIOMATIC_EXCLUSION",type:"HACER",rx:/\b(quitar\w*|sacar\w*)\s+(?:nos|los|las|me|te)?\s*(?:del|de el)\s+camino\b/},
 {lemma:"detener",sense:"LEGAL_DETENTION",type:"HACER",rx:/\b(detenci[oó]n|aprehensi[oó]n|captura|detuv\w*|aprehend\w*)\b/},
 {lemma:"atribuir",sense:"ATTRIBUTED_ALLEGATION",type:"DECIR",rx:/\b(atribu\w*|señala\w* como probable|imputa\w*)\b/},
 {lemma:"investigar",sense:"INVESTIGATION_STATE",type:"ESTAR",rx:/\b(investigaciones?|indagatorias?)\b.*\b(abiert\w*|no han concluido|no se ha cerrado|contin[uú]a\w*)\b/},
 {lemma:"esclarecer",sense:"KNOWLEDGE_GOAL",type:"HACER",rx:/\b(esclarec\w*|reconstruir lo ocurrido|conocer qu[eé] ocurrio|conocer qu[eé] ocurrió)\b/}
];
function tokenize(text){return (String(text||"").match(/[\p{L}\d%]+(?:['’-][\p{L}\d]+)*/gu)||[]).map((surface,index)=>({surface,index,norm:strip(surface),lemma:lemma(surface)}));}
function lemma(surface){const n=strip(surface).replace(/^[^\p{L}\d]+|[^\p{L}\d]+$/gu,"");if(!n)return "";if(IRREGULAR[n])return IRREGULAR[n];if(BASE_VERBS.includes(n))return n;
 for(const b of BASE_VERBS){const root=b.replace(/(ar|er|ir)$/,'');if(root.length>=4&&n.startsWith(root)&&n.length-root.length<=8)return b;}
 if(n.length>5&&n.endsWith("es"))return n.slice(0,-2);if(n.length>4&&n.endsWith("s"))return n.slice(0,-1);return n;}
function splitSentences(text){return String(text||"").replace(/\r/g,"").split(/(?:\n+|(?<=[.!?;])\s+(?=[A-ZÁÉÍÓÚÑ¿¡“"']))/u).map(s=>s.trim()).filter(Boolean);}
function splitClauses(sentence){return String(sentence||"").split(/(?:\s+[—–-]\s+|;\s*|,\s+(?=(?:pero|aunque|porque|mientras|cuando|si|y|e|por lo que|además|ademas)\b))/i).map(s=>s.trim()).filter(Boolean);}
function logic(clause){const n=strip(clause);return LOGIC.filter(x=>x.rx.test(n)).map(x=>x.op);}
function modality(clause){const n=strip(clause),out=[];if(/\b(quier\w*|dese\w*|pretend\w*|busca\w*|esper\w*)\b/.test(n))out.push("querer");if(/\b(pued\w*|podr\w*|capaz|permite\w*|impide\w*)\b/.test(n))out.push("poder");if(/\b(sab\w*|conoc\w*|inform\w*|diagnost\w*|reconstru\w*|esclarec\w*)\b/.test(n))out.push("saber");if(/\b(debe\w*|deber\w*|obliga\w*|tiene que|tienen que)\b/.test(n))out.push("deber");return [...new Set(out)];}
function temporality(clause){const n=strip(clause);if(/\b(manana|mañana|futuro|sera|será|permitira|permitirá|volveran|volverán)\b/.test(n))return "futuro";if(/\b(en 20\d\d|ayer|previamente|habia|había|habian|habían|fue|fueron|realizo|realizó|ocurrio|ocurrió)\b/.test(n))return "pasado";if(/\b(si|podria|podría|seria|sería|habria|habría)\b/.test(n))return "condicional";return "presente/no marcado";}
function epistemicStatus(clause){const n=strip(clause);if(/\b(probable|presunt\w*|habria|habría|señalad\w*|segun|según los señalamientos|hipotesis|hipótesis)\b/.test(n))return "attributed/alleged";if(/\b(podria|podría|puede que|posible|espera que|espero que)\b/.test(n))return "expectation/hypothesis";if(/\b(segun|según|de acuerdo con|la fiscalia atribuye|la fiscalía atribuye|la autoridad considera)\b/.test(n))return "attributed";return "textual-assertion";}
function realization(clause){const n=strip(clause),t=temporality(clause),e=epistemicStatus(clause);if(/\b(remord\w*|record\w*|haberlos|haberla|haberl\w*|le dolia|le dolía|dolor de haber|se arrepent)\b/.test(n))return "remembered/retrospective";if(/\b(intencion|intención|plane\w*|pretend\w*|vamos a|iremos|llevaremos|dejaremos|anuncio|anunció)\b/.test(n)||t==="futuro")return "announced/proposed";if(e==="expectation/hypothesis"||t==="condicional")return "hypothetical/projected";if(/\b(intent\w*|trato de|trató de|busco|buscó)\b/.test(n)&&/\b(no|sin|fracaso|fracasó)\b/.test(n))return "attempted/failed";if(/\b(no encontr\w*|fracaso|fracasó|fallo|falló)\b/.test(n))return "failed";return "realized/asserted";}
function ontologicalType(clause,lemmaGuess=""){const n=strip(clause);if(/\b(es|era|son|fue|se trata de|consiste en|representa)\b/.test(n))return "SER";if(/\b(esta|está|estaba|permanece|existe|hay|carece|tiene|posee|se encuentra)\b/.test(n))return "ESTAR";if(/\b(dijo|dijeron|señal\w*|indic\w*|asegur\w*|afirm\w*|inform\w*|explic\w*|record\w*|insist\w*|subray\w*|calific\w*|respond\w*|pregunt\w*|declar\w*|atribuy\w*|atribu\w*|pid\w*|exhort\w*)\b/.test(n))return "DECIR";if(lemmaGuess&&["ser","estar","haber","existir","permanecer"].includes(lemmaGuess))return lemmaGuess==="ser"?"SER":"ESTAR";return "HACER";}
function detectPredicate(clause){const n=strip(clause);for(const r of SENSE_RULES){if(r.rx.test(n))return {lemma:r.lemma,sense:r.sense,type:r.type};}const toks=tokenize(clause);for(const t of toks){if(BASE_VERBS.includes(t.lemma))return {lemma:t.lemma,sense:t.lemma.toUpperCase(),type:ontologicalType(clause,t.lemma)};}return {lemma:"",sense:"",type:ontologicalType(clause,"")};}
function relationToEvent(clause,predicate){const n=strip(clause),r=realization(clause);if(r==="hypothetical/projected")return "projection";if(r==="announced/proposed")return "plan";if(/\b(relevante|importante|grave|positivo|negativo|calific\w*)\b/.test(n))return "evaluation";if(predicate.type==="DECIR"&&/\b(rechaz\w*|impugn\w*|exhort\w*|pid\w*|denunc\w*)\b/.test(n))return "response";if(predicate.type==="DECIR"&&/\b(argument\w*|justific\w*|sustent\w*|diagnost\w*)\b/.test(n))return "argument";if(/\b(debido a|por lo que|contribu\w*|provoc\w*|caus\w*|afect\w*)\b/.test(n))return "consequence";if(predicate.type==="ESTAR"||predicate.type==="SER")return "attribute/state";return "constitutive";}
let dictionary=null,dictionaryInfo={status:"not-loaded",size:0};
async function loadDictionary(base="data/lexicon/"){
 if(dictionary)return dictionaryInfo;
 try{const [d,a]=await Promise.all([fetch(base+"es_MX.dic"),fetch(base+"es_MX.aff")]);if(!d.ok)throw new Error(`dic ${d.status}`);const text=await d.text();const lines=text.split(/\r?\n/).slice(1);dictionary=new Set(lines.map(x=>strip(x.split('/')[0])).filter(Boolean));dictionaryInfo={status:"loaded",size:dictionary.size,affixRules:a.ok?(await a.text()).split(/\r?\n/).filter(x=>/^(PFX|SFX|REP) /.test(x)).length:0};return dictionaryInfo;}catch(e){dictionaryInfo={status:"unavailable",size:0,error:e.message};return dictionaryInfo;}
}
function inDictionary(word){return dictionary?dictionary.has(strip(word)):null;}
ns.Spanish={strip,STOP,ATTRIBUTION,BASE_VERBS,tokenize,lemma,splitSentences,splitClauses,logic,modality,temporality,epistemicStatus,realization,ontologicalType,detectPredicate,relationToEvent,loadDictionary,inDictionary,get dictionaryInfo(){return dictionaryInfo;}};
})(window);
