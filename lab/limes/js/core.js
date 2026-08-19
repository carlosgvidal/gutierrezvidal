"use strict";

(function(global){
  function clamp01(v){
    if(!Number.isFinite(v)) throw new Error("Valor no numérico");
    return Math.max(0,Math.min(1,v));
  }

  function validateActor(actor){
    if(!actor || !actor.id) throw new Error("Actor sin id");
    for(const k of ["S","E","H"]){
      if(!Number.isFinite(actor[k])) throw new Error(`Actor ${actor.id}: falta ${k}`);
      if(actor[k] < 0 || actor[k] > 1) throw new Error(`Actor ${actor.id}: ${k} fuera de [0,1]`);
    }
    return true;
  }

  function validateInteraction(op){
    if(!op || !op.source || !op.target) throw new Error("Operación sin source/target");
    for(const k of ["D","phi","G"]){
      if(!Number.isFinite(op[k])) throw new Error(`Operación ${op.source}→${op.target}: falta ${k}`);
      if(op[k] < 0 || op[k] > 1) throw new Error(`Operación ${op.source}→${op.target}: ${k} fuera de [0,1]`);
    }
    return true;
  }

  function symbolicResources(actor){
    validateActor(actor);
    return actor.S * actor.E;
  }

  function effectiveExchange(source,op){
    validateActor(source);
    validateInteraction(op);
    return symbolicResources(source) * op.D * op.phi;
  }

  function predictInteraction(source,target,op){
    validateActor(source);
    validateActor(target);
    validateInteraction(op);
    if(source.id !== op.source || target.id !== op.target){
      throw new Error("Source/target no coincide con la operación");
    }
    const R=symbolicResources(source);
    const X=R * op.D * op.phi;
    const gap=op.G-target.H;
    const deltaH=gap*X;
    const Hafter=target.H+deltaH;
    return {
      issue:op.issue||"",
      source:source.id,
      target:target.id,
      S:source.S,
      E:source.E,
      R,
      D:op.D,
      phi:op.phi,
      X,
      G:op.G,
      Hbefore:target.H,
      gap,
      deltaH,
      Hafter:clamp01(Hafter)
    };
  }

  function runSequence(actors,operations){
    const state=new Map();
    actors.forEach(a=>{
      validateActor(a);
      state.set(a.id,{...a});
    });
    const history=[];
    operations.forEach((op,index)=>{
      validateInteraction(op);
      const source=state.get(op.source),target=state.get(op.target);
      if(!source||!target) throw new Error(`Operación ${index+1}: actor inexistente`);
      const result=predictInteraction(source,target,op);
      state.set(target.id,{...target,H:result.Hafter});
      history.push({...result,index});
    });
    return {
      actors:[...state.values()],
      history
    };
  }

  const api={clamp01,validateActor,validateInteraction,symbolicResources,effectiveExchange,predictInteraction,runSequence};
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
  global.LimesCore=api;
})(typeof window!=="undefined"?window:globalThis);
