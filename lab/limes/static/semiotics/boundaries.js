function distinctReferentKey(ref){
  if(!ref)return null;
  return ref.entity_id || ref.coreference_id || ref.referent_id || `${ref.kind||'REF'}:${String(ref.label||'').toLocaleLowerCase('es')}`;
}
function participantPosition(actant){
  return {
    actant_id:actant.actant_id,
    referent:actant.referent,
    generalized_role:actant.generalized_role,
    syntactic_relation:actant.syntactic_relation,
    semantic_role:actant.semantic_role,
    support_status:actant.status
  };
}
export function buildBoundaries(sentence){
  const actants=new Map(sentence.actants.map(a=>[a.actant_id,a]));
  const out=[];
  for(const op of sentence.operations){
    const ids=[...new Set([
      ...op.source_actants,
      ...op.affected_actants,
      ...op.content_actants,
      ...op.goal_actants
    ])];
    const participants=ids.map(id=>actants.get(id)).filter(a=>a?.referent);
    for(let i=0;i<participants.length;i++){
      for(let j=i+1;j<participants.length;j++){
        const a=participants[i],b=participants[j];
        const ka=distinctReferentKey(a.referent),kb=distinctReferentKey(b.referent);
        if(!ka||!kb||ka===kb)continue;
        const supported=a.status==='STRUCTURALLY_SUPPORTED'&&b.status==='STRUCTURALLY_SUPPORTED';
        out.push({
          boundary_id:`${op.operation_id}:boundary:${a.argument_index}:${b.argument_index}`,
          operation_id:op.operation_id,
          predicate:{token_index:op.predicate.token_index,form:op.predicate.form,lemma:op.predicate.lemma},
          position_a:participantPosition(a),
          position_b:participantPosition(b),
          relation:{
            kind:'DISCURSIVE_RELATION',
            basis:'CO_PARTICIPATION_IN_SAME_PREDICATIVE_STRUCTURE',
            directed:true,
            factuality:op.factuality
          },
          differentiation:{
            kind:'RELATIONAL_POSITION',
            basis:'DISTINCT_ARGUMENT_POSITIONS',
            lexical_trigger:null
          },
          status:supported?'STRUCTURALLY_SUPPORTED':'CANDIDATE'
        });
      }
    }
  }
  return out;
}
