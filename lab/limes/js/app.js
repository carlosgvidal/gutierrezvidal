"use strict";
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
function num(v){const n=Number(v);return Number.isFinite(n)?n:NaN;}
function actors(){
 return $$("#actors tbody tr").map(r=>{
  const i=r.querySelectorAll("input");
  return {id:i[0].value.trim(),S:num(i[1].value),E:num(i[2].value),H:num(i[3].value)};
 });
}
function operations(){
 const issue=$("#issue").value.trim();
 return $$("#ops tbody tr").map(r=>{
  const i=r.querySelectorAll("input");
  return {issue,source:i[0].value.trim(),target:i[1].value.trim(),D:num(i[2].value),phi:num(i[3].value),G:num(i[4].value)};
 });
}
function refreshDerived(){
 const A=actors();
 $$("#actors tbody tr").forEach((r,k)=>{
  try{r.querySelector(".derived").textContent=LimesCore.symbolicResources(A[k]).toFixed(3);}
  catch(e){r.querySelector(".derived").textContent="?";}
 });
}
$("#actors").addEventListener("input",refreshDerived);
$("#addActor").onclick=()=>{
 $("#actors tbody").insertAdjacentHTML("beforeend",'<tr><td><input value="C"></td><td><input type="number" step=".01" min="0" max="1" value=".50"></td><td><input type="number" step=".01" min="0" max="1" value=".50"></td><td><input type="number" step=".01" min="0" max="1" value=".50"></td><td class="derived">—</td></tr>');
 refreshDerived();
};
$("#addOp").onclick=()=>{
 $("#ops tbody").insertAdjacentHTML("beforeend",'<tr><td><input value="A"></td><td><input value="B"></td><td><input type="number" step=".01" min="0" max="1" value=".50"></td><td><input type="number" step=".01" min="0" max="1" value=".50"></td><td><input type="number" step=".01" min="0" max="1" value=".50"></td></tr>');
};
$("#run").onclick=()=>{
 try{
  const issue=$("#issue").value.trim();
  if(!issue) throw new Error("Debe declararse una cuestión específica.");
  const result=LimesCore.runSequence(actors(),operations());
  $("#status").className="card";
  $("#status").innerHTML=`<b>Issue</b><p>${issue}</p>`;
  $("#results").innerHTML=result.history.map((r,i)=>`<div class="card">
    <b>Operación ${i+1}: ${r.source} → ${r.target}</b>
    <div class="metric"><span>Recursos R</span><b>${r.R.toFixed(3)}</b></div>
    <div class="metric"><span>Intercambio X</span><b>${r.X.toFixed(3)}</b></div>
    <div class="metric"><span>H antes</span><b>${r.Hbefore.toFixed(3)}</b></div>
    <div class="metric"><span>Objetivo G</span><b>${r.G.toFixed(3)}</b></div>
    <div class="metric"><span>Δ H esperado</span><b>${r.deltaH>=0?"+":""}${r.deltaH.toFixed(3)}</b></div>
    <div class="metric"><span>H después</span><b>${r.Hafter.toFixed(3)}</b></div>
  </div>`).join("")+
  `<div class="card"><b>Estado final</b>${result.actors.map(a=>`<div class="metric"><span>${a.id}</span><b>H=${a.H.toFixed(3)}</b></div>`).join("")}</div>`;
 }catch(e){
  $("#status").className="card error";
  $("#status").innerHTML=`<b>No ejecutado</b><p>${e.message}</p>`;
  $("#results").innerHTML="";
 }
};
refreshDerived();
