function shape(w){
  if(/^\d+(?:[.,]\d+)*$/u.test(w))return 'NUM';
  if(/^[^\p{L}\p{N}\s]+$/u.test(w))return 'PUNCT';
  if(w===w.toUpperCase() && /\p{L}/u.test(w))return 'UPPER';
  if(/^\p{Lu}/u.test(w))return 'TITLE';
  return 'LOWER';
}
function chooseExact(form,sh,res){return res.word[`${form.toLowerCase()}\t${sh}`]||null;}
function chooseSuffix(form,sh,res){
  const k=form.toLowerCase();
  for(let n=5;n>=1;n--){if(k.length<n)continue;const q=res.suffix[String(n)]?.[`${k.slice(-n)}\t${sh}`];if(q){const share=q[1]/q[2];if(share>0.5)return {q,n,share};}}
  return null;
}
function parseFeatures(s){const out={};if(!s)return out;for(const p of s.split('|')){const [k,v]=p.split('=');if(k&&v)out[k]=v;}return out;}
export function analyzeMorphology(tokens,resources){
  const M=resources.morphology,F=resources.morphFeatures;
  return tokens.map((t)=>{
    const sh=shape(t.form); const exact=chooseExact(t.form,sh,M); let upos,source,support;
    if(exact){upos=exact[0];source='ANCORA_FORM_POS';support={selected:exact[1],total:exact[2],share:exact[1]/exact[2]};}
    else{const sx=chooseSuffix(t.form,sh,M);if(sx){upos=sx.q[0];source='ANCORA_SUFFIX_POS';support={selected:sx.q[1],total:sx.q[2],share:sx.share,suffix_length:sx.n};}
      else if(sh==='PUNCT'){upos='PUNCT';source='ORTHOGRAPHIC_CLASS';support={};}
      else if(sh==='NUM'){upos='NUM';source='ORTHOGRAPHIC_CLASS';support={};}
      else{upos='X';source='UNRESOLVED';support={};}}
    const lk=M.lemma[`${t.form.toLowerCase()}\t${upos}`]; const lemma=lk?lk[0]:t.form.toLowerCase();
    const fk=F[`${t.form.toLowerCase()}\t${upos}`]; const features=fk?parseFeatures(fk[0]):{};
    return {...t,shape:sh,upos,lemma,features,morphology_source:source,morphology_support:support};
  });
}
