function signature(r){return r.kind==='NAMED_ENTITY'?`${r.entity_type}|${r.label.toLocaleLowerCase('es')}`:null;}
export function resolveCoreference(sentences){
  const canonical=new Map();
  for(const s of sentences){for(const r of s.referents.values()){
    const sig=signature(r);if(sig){if(!canonical.has(sig))canonical.set(sig,`entity-${canonical.size+1}`);r.canonical_entity_id=canonical.get(sig);}
  }}
  return canonical;
}
