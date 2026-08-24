function byPredicate(actants,index){return actants.filter(a=>a.predicate_index===index);}
export function buildOperations(sentence){
  return sentence.predicates.map((p)=>{
    const actants=byPredicate(sentence.actants,p.token_index);
    const sources=actants.filter(a=>['AGENT','EXPERIENCER','SYNTACTIC_SUBJECT'].includes(a.generalized_role));
    const affected=actants.filter(a=>['AFFECTED_OR_THEME','DIRECT_OBJECT'].includes(a.generalized_role));
    const content=actants.filter(a=>a.generalized_role==='PROPOSITIONAL_CONTENT');
    const goals=actants.filter(a=>a.generalized_role==='GOAL');
    return {operation_id:`${sentence.document_id}:${sentence.sentence_index}:op:${p.token_index}`,predicate:p,source_actants:sources.map(a=>a.actant_id),affected_actants:affected.map(a=>a.actant_id),content_actants:content.map(a=>a.actant_id),goal_actants:goals.map(a=>a.actant_id),factuality:p.factuality,status:(sources.length||affected.length||content.length||goals.length)?'STRUCTURED':'UNRESOLVED'};
  });
}
