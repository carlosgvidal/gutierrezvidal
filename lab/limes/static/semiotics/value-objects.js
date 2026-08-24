function actantMap(sentence){return new Map(sentence.actants.map(a=>[a.actant_id,a]));}
export function buildValueObjects(sentence){
  const amap=actantMap(sentence),out=[];
  for(const op of sentence.operations){
    const ids=[...op.goal_actants,...op.affected_actants];
    for(const id of ids){const a=amap.get(id);if(!a?.referent)continue;
      const role=a.generalized_role;const status=role==='GOAL'?'STRUCTURALLY_SUPPORTED':'CANDIDATE';
      out.push({object_id:`${op.operation_id}:value:${a.argument_index}`,operation_id:op.operation_id,referent:a.referent,role,status,reason:role==='GOAL'?'GOAL_ARGUMENT':'AFFECTED_ARGUMENT'});
    }
  }
  return out;
}
