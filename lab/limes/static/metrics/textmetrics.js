function words(text){return (String(text??'').match(/[\p{L}\p{M}]+(?:['’\-][\p{L}\p{M}]+)*/gu)||[]);}
function syllablesWord(w){
  const s=w.toLocaleLowerCase('es').normalize('NFD').replace(/\p{M}/gu,'').replace(/[^a-zñü]/g,'');if(!s)return 0;
  const groups=s.match(/[aeiouü]+/g);return Math.max(1,groups?groups.length:1);
}
export function computeTextMetrics(documents,sentences){
  const all=documents.map(d=>d.text).join('\n');const ws=words(all);const n=ws.length,types=new Set(ws.map(w=>w.toLocaleLowerCase('es'))).size;const syll=ws.reduce((s,w)=>s+syllablesWord(w),0);const ns=Math.max(1,sentences.length);
  const lexicalTokens=sentences.flatMap(s=>s.tokens).filter(t=>['NOUN','PROPN','VERB','ADJ','ADV'].includes(t.upos));
  const lexicalDensity=n?lexicalTokens.length/n:null;
  const fernandezHuerta=n?206.84-(0.60*(syll*100/n))-(1.02*(ns*100/n)):null;
  return {documents:documents.length,sentences:sentences.length,words:n,types,type_token_ratio:n?types/n:null,mean_sentence_words:n/ns,estimated_syllables:syll,lexical_density:lexicalDensity,fernandez_huerta:fernandezHuerta,readability_note:'La estimación silábica es algorítmica y la métrica Fernández-Huerta se presenta como estadística descriptiva, no como inferencia semiótica.'};
}
