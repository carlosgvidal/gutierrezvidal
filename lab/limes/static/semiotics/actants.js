const AGENT_ROLES=new Set(['arg0:agt','arg0:cau']);
const EXPERIENCER_ROLES=new Set(['arg0:exp','arg1:exp']);
const AFFECTED_ROLES=new Set(['arg1:pat','arg1:tem','arg2:tem']);
const GOAL_ROLES=new Set(['arg4:des','arg3:des','arg2:des']);
function generalizedRole(arg){
  const r=arg.semantic_role?.status==='LEXICALLY_DOMINANT'&&arg.syntax_status==='RESOLVED'?arg.semantic_role.role:null;
  if(r&&AGENT_ROLES.has(r))return 'AGENT';
  if(r&&EXPERIENCER_ROLES.has(r))return 'EXPERIENCER';
  if(r&&AFFECTED_ROLES.has(r))return 'AFFECTED_OR_THEME';
  if(r&&GOAL_ROLES.has(r))return 'GOAL';
  if(arg.deprel==='nsubj')return 'SYNTACTIC_SUBJECT';
  if(arg.deprel==='obj')return 'DIRECT_OBJECT';
  if(arg.deprel==='iobj')return 'INDIRECT_OBJECT';
  if(arg.deprel==='ccomp'||arg.deprel==='xcomp')return 'PROPOSITIONAL_CONTENT';
  return 'ARGUMENT';
}
export function buildActants(sentence){
  const out=[];
  for(const pred of sentence.predicates){
    for(const arg of pred.arguments){
      const ref=sentence.referents.get(arg.token_index)||null;
      out.push({actant_id:`${sentence.document_id}:${sentence.sentence_index}:act:${pred.token_index}:${arg.token_index}`,predicate_index:pred.token_index,argument_index:arg.token_index,syntactic_relation:arg.deprel,semantic_role:arg.semantic_role,generalized_role:generalizedRole(arg),referent:ref,status:ref?(arg.syntax_status==='RESOLVED'?'STRUCTURALLY_SUPPORTED':'CANDIDATE'):'UNRESOLVED'});
    }
  }
  return out;
}
