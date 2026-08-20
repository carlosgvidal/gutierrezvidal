"use strict";
(function(global){
  const ns=global.Limes52=global.Limes52||{};
  const clamp01=v=>Math.max(0,Math.min(1,v));
  function validateActor(a){
    if(!a||!a.id)throw new Error("Actor sin id");
    for(const k of ["S","E","H"]){if(!Number.isFinite(a[k])||a[k]<0||a[k]>1)throw new Error(`Actor ${a.id}: ${k} inválido o no declarado`);}
  }
  function validateOperation(o){
    if(!o||!o.source||!o.target)throw new Error("Operación sin source/target");
    for(const k of ["D","phi","G"]){if(!Number.isFinite(o[k])||o[k]<0||o[k]>1)throw new Error(`Operación ${o.source}→${o.target}: ${k} inválido o no declarado`);}
  }
  function symbolicResources(a){validateActor(a);return a.S*a.E;}
  function predictInteraction(source,target,op){
    validateActor(source);validateActor(target);validateOperation(op);
    if(source.id!==op.source||target.id!==op.target)throw new Error("Source/target no coincide con la operación");
    const R=symbolicResources(source),X=R*op.D*op.phi,gap=op.G-target.H,deltaH=gap*X,Hafter=clamp01(target.H+deltaH);
    return {source:source.id,target:target.id,actionTarget:op.actionTarget||op.target,stateTarget:op.stateTarget||op.target,type:op.type||"operación",frameId:op.frameId||"",episodeId:op.episodeId||"",R,D:op.D,phi:op.phi,X,G:op.G,Ge:op.G,terminalG:Number.isFinite(op.terminalG)?op.terminalG:null,Hbefore:target.H,gap,deltaH,Hafter,evidence:op.evidence||{}};
  }
  function runSequence(actors,ops){
    const state=new Map();actors.forEach(a=>{validateActor(a);if(state.has(a.id))throw new Error(`Actor duplicado: ${a.id}`);state.set(a.id,{...a});});
    const history=[];
    ops.forEach((op,index)=>{validateOperation(op);const s=state.get(op.source),t=state.get(op.target);if(!s||!t)throw new Error(`Operación ${index+1}: actor inexistente`);const r=predictInteraction(s,t,op);state.set(t.id,{...t,H:r.Hafter});history.push({...r,index});});
    return {actors:[...state.values()],history};
  }
  ns.Core={clamp01,validateActor,validateOperation,symbolicResources,predictInteraction,runSequence};
})(window);
