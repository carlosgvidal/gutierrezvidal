function validateActors(actors){
 const errors=[];
 actors.forEach((a,i)=>{
  if(!a.n)errors.push(`Actor ${i+1}: nombre vacío`);
  ['x','v','c','s','r','rho','uncertainty'].forEach(k=>{if(!Number.isFinite(a[k]))errors.push(`Actor ${a.n}: ${k} inválido`);});
  const st=a.states; const sum=st.ser+st.estar+st.decir+st.hacer;
  if(Math.abs(sum-1)>1e-6)errors.push(`Actor ${a.n}: estados no normalizados`);
 });
 return errors;
}
function runSelfTests(){
 const tests=[];
 function t(name,fn){try{tests.push({name,ok:!!fn()});}catch(e){tests.push({name,ok:false,msg:e.message});}}
 t('Estados normalizados',()=>{const s=normalizeStates({ser:2,estar:2,decir:2,hacer:2}); return Math.abs(s.ser+s.estar+s.decir+s.hacer-1)<1e-9;});
 t('Utilidad acotada',()=>utility({x:50,rho:1},50)===1&&utility({x:50,rho:1},0)<=1);
 t('Monte Carlo reproducible',()=>{const a=readActors();const m1=monteCarlo(a,50,'X');const m2=monteCarlo(a,50,'X');return Math.abs(m1.mean-m2.mean)<1e-9;});
 t('Ciclo conserva actores',()=>{const a=readActors();return runSimulationCycle(a,3).actors.length===a.length;});
 const val=validateActors(normalizeActors(readActors()));
 t('Validación de entrada',()=>val.length===0);
 t('Regex de dimensiones detecta palabras',()=>{
  const dim=dimensionDensity("el gobierno y la institución","estar" in lex ? lex.estar : []);
  return dim>=1;
 });
 t('Léxico posWords/negWords detecta coincidencias',()=>{
  const plain="el acuerdo genera cooperacion pero tambien una crisis";
  const pos=posWords.reduce((n,w)=>n+stemMatches(w,plain),0);
  const neg=negWords.reduce((n,w)=>n+stemMatches(w,plain),0);
  return pos>=1&&neg>=1;
 });
 t('inferActorVariables no colapsa positive/negative/actions/power a cero con evidencia léxica presente',()=>{
  const probe={
   name:"Actor de prueba",count:2,score:4,type:"institución",
   contexts:["El gobierno anuncia una reforma y rechaza el acuerdo, generando una crisis y una amenaza."],
   relationProfile:{cooperation:0,conflict:0,control:0,communication:0,transformation:0,net:0,outgoing:[],incoming:[]}
  };
  const out=inferActorVariables(probe,0);
  return out.v<0||out.s>.35;
 });
 t('Estados del sistema no colapsan a 100/0/0/0 en texto político típico',()=>{
  const t="El gobierno federal anunció una reforma. El Congreso exigió un informe. El gobierno defendió la propuesta.";
  const lower=t.toLowerCase();
  const r={};["ser","estar","decir","hacer"].forEach(k=>r[k]=count(lex[k],lower));
  const tot=Math.max(1,r.ser.c+r.estar.c+r.decir.c+r.hacer.c);
  const shares=["ser","estar","decir","hacer"].map(k=>r[k].c/tot);
  return Math.max(...shares)<1;
 });
 t('Verbos conjugados en pretérito se detectan por raíz (acusó, rechazaron, amenazó)',()=>{
  const plain=stripAccents("las empresas rechazaron la medida y amenazaron con acudir a tribunales; el gobierno acuso a la oposicion".toLowerCase());
  const conflictHits=relationVerbs.conflicto.reduce((n,w)=>n+stemMatches(w,plain),0);
  return conflictHits>=3;
 });

 t('Valencia discursiva separada de posición',()=>{
  const a=inferActorVariables({name:"A",count:2,score:4,type:"actor",contexts:["A rechaza una crisis y denuncia una amenaza."],relationProfile:{cooperation:0,conflict:0,control:0,communication:0,transformation:0,net:0,outgoing:[],incoming:[]}},0);
  return a.x===null&&a.v<0;
 });
 t('Geometría relacional separa actores en conflicto',()=>{
  const actors=[{name:"A",x:50},{name:"B",x:50}];
  const rel=[{sourceIndex:0,targetIndex:1,type:"conflicto",confidence:.9}];
  const out=inferStrategicPositions(actors,rel);
  return Math.abs(out[0].x-out[1].x)>30;
 });
 t('Amenaza puede activarse frente a statu quo sistémico',()=>{
  const raw=[
   {id:0,n:"A",x:20,v:0,c:80,s:1,r:1,rho:1,uncertainty:0,states:{ser:.15,estar:.15,decir:.2,hacer:.5}},
   {id:1,n:"B",x:80,v:0,c:20,s:.8,r:1,rho:1,uncertainty:0,states:{ser:.25,estar:.25,decir:.25,hacer:.25}},
   {id:2,n:"C",x:25,v:0,c:50,s:.9,r:1,rho:1,uncertainty:0,states:{ser:.25,estar:.25,decir:.25,hacer:.25}}
  ];
  const pairs=evaluateStrategicField(normalizeActors(raw));
  return pairs.some(p=>p.threatEUA>0||p.threatEUB>0);
 });
 t('Mayúscula inicial aislada no crea actor',()=>{
  const names=extractActors("Pero me dan mucha lástima. Dijo el padre que debían partir. Hänsel miró a Gretel. Hänsel volvió a mirar a Gretel.").map(a=>actorKey(a.name));
  return !names.includes("pero")&&!names.includes("dijo")&&names.includes("hansel")&&names.includes("gretel");
 });
 t('Coordinación no crea actor compuesto',()=>{
  const names=extractActors("Hänsel y Gretel caminaron. Hänsel habló con Gretel. Gretel respondió a Hänsel.").map(a=>actorKey(a.name));
  return !names.includes("hansel y gretel");
 });
 t('Sin relaciones, x permanece desconocida',()=>{
  const actors=[{name:"A",x:null},{name:"B",x:null}];
  const out=inferStrategicPositions(actors,[]);
  return out.every(a=>a.x===null&&a.xKnown===false);
 });
 const ok=tests.every(x=>x.ok);
 document.getElementById('testResults').innerHTML='<div class="card"><b>Validación automática</b>'+tests.map(x=>`<div class="list-item">${x.ok?'✔':'✖'} ${x.name}${x.msg?': '+x.msg:''}</div>`).join('')+`<div class="list-item"><b>Resultado:</b> ${ok?'APROBADO':'FALLÓ'}</div></div>`;
 return ok;
}
