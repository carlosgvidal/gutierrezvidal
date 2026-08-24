function counts(xs,key){const m=new Map();for(const x of xs){const k=x[key];m.set(k,(m.get(k)||0)+1);}return [...m.entries()].sort((a,b)=>b[1]-a[1]);}
export function buildInterpretiveReport(analysis){
  const s=analysis.sentences,ops=s.flatMap(x=>x.operations),acts=s.flatMap(x=>x.actants),objs=s.flatMap(x=>x.value_objects),sedh=s.flatMap(x=>x.sedh_evidence),progs=s.flatMap(x=>x.programs),bounds=s.flatMap(x=>x.boundaries);
  const resolvedActs=acts.filter(x=>x.status==='STRUCTURALLY_SUPPORTED'),resolvedObjs=objs.filter(x=>x.status==='STRUCTURALLY_SUPPORTED');
  const lines=[];
  lines.push(`El corpus contiene ${analysis.documents.length} documento(s), ${s.length} oración(es) y ${analysis.metrics.words} palabra(s).`);
  lines.push(`La capa morfosintáctica produjo ${s.reduce((n,x)=>n+x.predicates.length,0)} predicado(s); ${resolvedActs.length} actante(s) cuentan con soporte estructural suficiente y ${acts.length-resolvedActs.length} permanecen como candidatos o no resueltos.`);
  lines.push(`Se identificaron ${analysis.entities.length} entidad(es) nombrada(s) mediante el modelo NER cuando estuvo disponible.`);
  lines.push(`La capa semiótica conserva ${resolvedObjs.length} objeto(s) de valor con soporte estructural y ${objs.length-resolvedObjs.length} candidato(s).`);
  for(const [d,n] of counts(sedh,'dimension'))lines.push(`${d}: ${n} evidencia(s) estructural(es), conservando el estatuto individual de cada inferencia.`);
  lines.push(`Se reconstruyeron ${progs.length} programa(s) actor–operación–objeto y ${bounds.length} frontera(s) relacional(es). Una frontera se registra cuando dos referentes ocupan posiciones diferenciadas dentro de una misma estructura predicativa; no depende de palabras que nombren restricción, acceso o conflicto.`);
  lines.push(`Las operaciones, roles y objetos mantienen referencia a la oración, el predicado, la relación sintáctica y la distribución de rol semántico que los sustenta.`);
  return lines;
}
