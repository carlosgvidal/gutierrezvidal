export function buildPrograms(sentence){
  const actants=new Map(sentence.actants.map(a=>[a.actant_id,a])),byOp=new Map();for(const o of sentence.value_objects){if(!byOp.has(o.operation_id))byOp.set(o.operation_id,[]);byOp.get(o.operation_id).push(o);}const out=[];
  for(const op of sentence.operations){const src=op.source_actants.map(id=>actants.get(id)).find(a=>a?.referent);if(!src)continue;for(const obj of byOp.get(op.operation_id)||[]){out.push({program_id:`${op.operation_id}:program:${obj.object_id}`,source:src.referent,object:obj.referent,predicate:op.predicate.lemma,factuality:op.factuality,status:(src.status==='STRUCTURALLY_SUPPORTED'&&obj.status==='STRUCTURALLY_SUPPORTED')?'STRUCTURALLY_SUPPORTED':'CANDIDATE'});}}
  return out;
}
