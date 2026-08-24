const NP_DEPS=new Set(['det','amod','nmod','flat','compound','appos','nummod','case','fixed']);
function subtreeTokens(head,tokens){
  const chosen=new Set([head.index]);let changed=true;
  while(changed){changed=false;for(const t of tokens){if(chosen.has(t.head_index)&&NP_DEPS.has(t.deprel)&&!chosen.has(t.index)){chosen.add(t.index);changed=true;}}}
  return [...chosen].sort((a,b)=>a-b).map(i=>tokens[i]);
}
function namedEntityForToken(token,sentence,entities){
  const localStart=token.start-sentence.start, localEnd=token.end-sentence.start;
  return entities.find(e=>e.start!==null&&e.end!==null&&localStart<e.end&&localEnd>e.start)||null;
}
export function resolveReferents(sentence,tokens,entities){
  const refs=new Map();
  for(const t of tokens){if(!['NOUN','PROPN','PRON'].includes(t.upos))continue;
    const ne=namedEntityForToken(t,sentence,entities);
    if(ne){refs.set(t.index,{referent_id:`${sentence.document_id}:${sentence.sentence_index}:ref:${t.index}`,kind:'NAMED_ENTITY',entity_type:ne.type,label:ne.text,head_index:t.index,span:[sentence.start+(ne.start??0),sentence.start+(ne.end??0)],status:'RESOLVED',source:'NER'});continue;}
    if(t.upos==='PRON'){refs.set(t.index,{referent_id:`${sentence.document_id}:${sentence.sentence_index}:ref:${t.index}`,kind:'PRONOMINAL_REFERENCE',entity_type:null,label:t.form,head_index:t.index,span:[t.start,t.end],status:'UNRESOLVED',source:'MORPHOSYNTAX'});continue;}
    const parts=subtreeTokens(t,tokens);const label=parts.map(x=>x.form).join(' ');
    refs.set(t.index,{referent_id:`${sentence.document_id}:${sentence.sentence_index}:ref:${t.index}`,kind:'NOMINAL_REFERENT',entity_type:null,label,head_index:t.index,span:[parts[0].start,parts[parts.length-1].end],status:t.syntax_status==='RESOLVED'?'STRUCTURALLY_RESOLVED':'CANDIDATE',source:'DEPENDENCY_STRUCTURE'});
  }
  return refs;
}
