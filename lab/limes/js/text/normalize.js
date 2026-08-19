function stripAccents(s){return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
function escapeHtml(s){return String(s).replace(/[&<>\"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[ch]));}
function clamp(v,min=0,max=1){return Math.max(min,Math.min(max,v));}
function count(words,t){let c=0,h=[];words.forEach(w=>{const n=stemMatches(w,t);if(n){c+=n;h.push(w)}});return{c,h};}
function stemMatches(word,t){
 const forms=lexicalForms(word);
 let total=0;
 forms.forEach(f=>{
  const plainForm=stripAccents(f);
  const re=new RegExp("\\b"+plainForm.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\b","gi");
  const m=t.match(re);
  if(m)total+=m.length;
 });
 return total;
}
function stemCount(words,t){let c=0,h=[];words.forEach(w=>{const n=stemMatches(w,t);if(n){c+=n;h.push(w+':'+n)}});return{c,h};}
function tokenize(t){return stripAccents(t.toLowerCase()).replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).filter(x=>x&&!stop.has(x)&&x.length>2);}
function splitSentences(t){return t.replace(/\s+/g," ").split(/(?<=[.!?;:])\s+|\n+/).map(s=>s.trim()).filter(Boolean);}
function canonicalActor(name){return name.replace(/^["'“”‘’\s]+|["'“”‘’.,;:!?\s]+$/g,"").replace(/\s+/g," ").trim();}
function actorKey(name){return stripAccents(canonicalActor(name).toLowerCase()).replace(/^(el|la|los|las|un|una)\s+/,"");}
const knownCountries=["Estados Unidos","México","Mexico","Canadá","Canada","China","Rusia","Francia","Alemania","Reino Unido","España","Brasil","Argentina","Colombia","Chile","Perú","Peru","Japón","Japon","India","Italia","Corea del Sur","Corea del Norte","Cuba","Venezuela","Guatemala","Honduras","El Salvador","Nicaragua","Costa Rica","Panamá","Panama","Ecuador","Bolivia","Paraguay","Uruguay"];
function actorType(name){const plain=stripAccents(name.toLowerCase());if(knownCountries.some(c=>stripAccents(c.toLowerCase())===plain))return "país";if(orgMarkers.some(m=>plain.includes(stripAccents(m.toLowerCase())))||powerWords.some(w=>plain.includes(stripAccents(w))))return "institución";if(collectiveActors.some(a=>plain===stripAccents(a)||plain.includes(stripAccents(a))))return "colectivo";if(/^[A-ZÁÉÍÓÚÑ][\p{L}'’-]+(?:\s+[A-ZÁÉÍÓÚÑ][\p{L}'’-]+){1,3}$/u.test(name))return "persona";return "actor";}
function sentenceContextScore(sentence,name){const plain=stripAccents(sentence.toLowerCase());let score=1;actionWords.forEach(w=>{if(stemMatches(w,plain))score+=2;});if(/\b(segun|para|contra|frente a|junto a|por parte de|encabezad[oa] por)\b/.test(plain))score+=1;if(new RegExp("\\b"+actorKey(name).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\b").test(plain))score+=1;return score;}
function topConcepts(tokens){const f={};tokens.forEach(w=>f[w]=(f[w]||0)+1);return Object.entries(f).sort((a,b)=>b[1]-a[1]).slice(0,10);}
function detectOppositions(tokens){const pairs=[["innovacion","tradicion"],["cambio","continuidad"],["publico","privado"],["centro","periferia"],["orden","caos"],["libertad","control"]];return pairs.filter(p=>tokens.includes(p[0])||tokens.includes(p[1])).map(p=>p.join(" ↔ "));}
