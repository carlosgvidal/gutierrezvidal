const CORE_RELS=new Set(['nsubj','csubj','obj','iobj','obl:arg','ccomp','xcomp','nsubj:pass','csubj:pass']);
function roleInfo(lemma,rel,valency){
  const slot=valency[lemma]?.[rel];if(!slot)return {status:'UNRESOLVED',candidates:[]};
  const total=slot.roles.reduce((s,x)=>s+x[1],0);const candidates=slot.roles.map(([role,n])=>({role,count:n,share:n/total}));const top=candidates[0];
  return {status:top&&top.count>(total-top.count)?'LEXICALLY_DOMINANT':'AMBIGUOUS',role:top?.role??null,candidates:candidates.slice(0,5),support_n:slot.n};
}
function factuality(predicate,tokens){
  const dependents=tokens.filter(t=>t.head_index===predicate.index);const neg=dependents.some(t=>t.features.Polarity==='Neg'||t.lemma==='no');const mood=predicate.features.Mood||null,tense=predicate.features.Tense||null,verbForm=predicate.features.VerbForm||null;let status='ASSERTED';if(neg)status='NEGATED';else if(mood==='Cnd')status='CONDITIONAL';else if(mood==='Sub')status='NON_ASSERTED';return {status,negated:neg,mood,tense,verb_form:verbForm};
}
function ordinaryArguments(p,tokens,resources){
  const args=[];for(const t of tokens){if(t.head_index!==p.index||!CORE_RELS.has(t.deprel))continue;args.push({token_index:t.index,deprel:t.deprel,syntax_status:t.syntax_status,head_likelihood_ratio:t.head_likelihood_ratio,semantic_role:roleInfo(p.lemma,t.deprel,resources.valency)});}return args;
}
function copularArguments(p,tokens,resources){
  const head=tokens[p.head_index];if(!head)return ordinaryArguments(p,tokens,resources);const args=[];
  for(const t of tokens){if(t.head_index!==head.index||!['nsubj','csubj'].includes(t.deprel))continue;args.push({token_index:t.index,deprel:t.deprel,syntax_status:t.syntax_status,head_likelihood_ratio:t.head_likelihood_ratio,semantic_role:roleInfo(p.lemma,t.deprel,resources.valency)});}
  return args;
}
export function extractPredicates(tokens,resources){
  const predicates=[];for(const p of tokens){if(!['VERB','AUX'].includes(p.upos))continue;const copular=p.deprel==='cop'&&p.head_index>=0;const args=copular?copularArguments(p,tokens,resources):ordinaryArguments(p,tokens,resources);predicates.push({token_index:p.index,form:p.form,lemma:p.lemma,upos:p.upos,features:p.features,factuality:factuality(p,tokens),arguments:args,valency_available:!!resources.valency[p.lemma],copular,predicative_head_index:copular?p.head_index:null,copula_syntax_status:copular?p.syntax_status:null,predicative_head_syntax_status:copular?(tokens[p.head_index]?.syntax_status||null):null});}return predicates;
}
