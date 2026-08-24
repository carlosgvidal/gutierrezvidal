'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.LIMES_GAMES=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const VERSION='0.2.0';
  function profiles(players,actions){let out=[{}];for(const p of players){const next=[];for(const base of out)for(const a of actions[p]||[])next.push({...base,[p]:a});out=next;}return out;}
  function key(profile,players){return players.map(p=>`${p}=${profile[p]}`).join('|');}
  function solve(input){const players=input?.players,actions=input?.actions,payoffs=input?.payoffs;if(!Array.isArray(players)||players.length<2)throw new Error('Se requieren al menos dos jugadores.');for(const p of players)if(!Array.isArray(actions?.[p])||!actions[p].length)throw new Error('Cada jugador requiere un conjunto de acciones.');const ps=profiles(players,actions),eq=[];for(const prof of ps){const k=key(prof,players),u=payoffs?.[k];if(!u)continue;let stable=true;for(const p of players){const current=Number(u[p]);if(!Number.isFinite(current)){stable=false;break;}for(const alt of actions[p]){if(alt===prof[p])continue;const q={...prof,[p]:alt},v=payoffs?.[key(q,players)];if(v&&Number(v[p])>current){stable=false;break;}}if(!stable)break;}if(stable)eq.push({profile:prof,payoffs:u});}return {version:VERSION,valid:true,equilibria:eq,solution_concept:'PURE_NASH',forecast:false};}
  return {VERSION,solve};
});
