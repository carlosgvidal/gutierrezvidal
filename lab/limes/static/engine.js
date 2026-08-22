'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.LIMES_ENGINE=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const VERSION='0.1.3';

  const THEORY_TERMS={
    SER:new Set(['autoconciencia','autopoiesis','identidad','valores','valor','memoria','imaginación','imaginario','reflexividad','interiorización','autorregulación','cognición','emociones','conciencia','biológico','biológica','cognitivo','cognitiva','mundos','vida']),
    ESTAR:new Set(['contexto','posición','institucional','espacialidad','temporalidad','objetividad','subjetividad','relación','relaciones','otredad','ambiente','contingencia','percepción','social','cultural','territorio','territorial','estructura','estructuras']),
    DECIR:new Set(['lenguaje','lenguajes','semántica','pragmática','narratividad','narrativa','significación','signo','signos','discurso','discursivo','discursiva','representación','representaciones','comunicación','comunicativo','comunicativa','autoridad','retórica','memoria','normativo','normativa']),
    HACER:new Set(['acción','acciones','actuar','agencia','intervención','transformación','transformar','cambio','cambios','inclusión','exclusión','influencia','competencia','integración','producción','práctica','prácticas','operación','operaciones','decisión','elección'])
  };

  const NEGATION=new Set(['no','nunca','jamás','tampoco','nadie','ningún','ninguna','ninguno','sin']);
  const MODAL=new Map([
    ['podría','POSSIBLE'],['puede','POSSIBLE'],['pueden','POSSIBLE'],['posible','POSSIBLE'],
    ['debe','REQUIRED'],['deben','REQUIRED'],['deberá','REQUIRED'],['deberán','REQUIRED'],
    ['pretende','INTENDED'],['pretenden','INTENDED'],['intenta','INTENDED'],['intentan','INTENDED'],
    ['planea','PLANNED'],['planean','PLANNED'],['prevé','PLANNED'],['prevén','PLANNED'],
    ['si','CONDITIONAL']
  ]);
  const ATTRIBUTION=new Set(['según','afirma','afirman','sostiene','sostienen','señala','señalan','reporta','reportan']);
  const DENIAL=new Set(['niega','niegan','negó','negaron','rechaza','rechazan','desmiente','desmienten']);

  function normalizeToken(token){return String(token??'').normalize('NFKC').toLowerCase().replace(/^[\'’\-_]+|[\'’\-_]+$/g,'')}
  function tokenList(text){
    const re=/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:['’-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)?|\d+(?:[.,]\d+)?/gu;
    return [...String(text??'').matchAll(re)].map(m=>normalizeToken(m[0]));
  }
  function splitSentences(text){
    const src=String(text??'').replace(/\r\n?/g,'\n');
    const spans=[];
    let start=0;
    const boundary=/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÜÑ0-9¿¡])|\n+/gu;
    let m;
    while((m=boundary.exec(src))!==null){
      const raw=src.slice(start,m.index); const seg=raw.trim();
      if(seg){const off=raw.indexOf(seg); const s=start+off; spans.push([seg,s,s+seg.length])}
      start=m.index+m[0].length;
    }
    const raw=src.slice(start); const seg=raw.trim();
    if(seg){const off=raw.indexOf(seg); const s=start+off; spans.push([seg,s,s+seg.length])}
    return spans;
  }
  function classifyFactuality(sentence){
    const toks=tokenList(sentence); const st=new Set(toks); const markers=[];
    const neg=toks.some(t=>NEGATION.has(t));
    const denial=toks.filter(t=>DENIAL.has(t));
    if(denial.length){markers.push(...[...new Set(denial)].sort());return {factuality:'DENIED',markers,negated:true}}
    const attr=toks.filter(t=>ATTRIBUTION.has(t));
    let base='REALIZED';
    if(attr.length){markers.push(...[...new Set(attr)].sort());base='ATTRIBUTED'}
    const modalHits=toks.filter(t=>MODAL.has(t));
    if(modalHits.length){
      markers.push(...modalHits);
      const labels=new Set(modalHits.map(t=>MODAL.get(t)));
      for(const label of ['CONDITIONAL','REQUIRED','PLANNED','INTENDED','POSSIBLE']) if(labels.has(label)) return {factuality:label,markers,negated:neg};
    }
    return {factuality:base,markers,negated:neg};
  }
  function extractEntities(evidence){
    const occ=new Map();
    const re=/(^|[^\p{L}\p{N}_])((?:[A-ZÁÉÍÓÚÜÑ][\p{L}\p{N}_ÁÉÍÓÚÜÑáéíóúüñ-]*(?:\s+|$)){1,5})/gu;
    for(const ev of evidence){
      let m;
      while((m=re.exec(ev.text))!==null){
        const raw=m[2].trim().replace(/\s+/g,' ');
        if(!raw||raw.length<2) continue;
        const localStart=m.index+m[1].length;
        if(localStart===0&&raw.split(/\s+/).length===1) continue;
        const key=raw.normalize('NFKC').toLowerCase();
        if(!occ.has(key)) occ.set(key,{label:raw,evidence:[]});
        occ.get(key).evidence.push(ev.evidence_id);
      }
    }
    return [...occ.entries()]
      .sort((a,b)=>b[1].evidence.length-a[1].evidence.length||a[0].localeCompare(b[0],'es'))
      .map(([,d],i)=>({entity_id:`ent-${i+1}`,label:d.label,mentions:d.evidence.length,evidence_ids:d.evidence,status:'INFERRED'}));
  }
  function lexicalSemanticEvidence(allTokens){
    const counts=new Map(); for(const t of allTokens) counts.set(t,(counts.get(t)||0)+1);
    const total=Math.max(1,allTokens.length);
    return Object.entries(THEORY_TERMS).map(([dimension,terms])=>{
      const hits={}; let count=0;
      [...terms].sort((a,b)=>a.localeCompare(b,'es')).forEach(t=>{const n=counts.get(t)||0;if(n){hits[t]=n;count+=n}});
      return {dimension,count,density:count/total,terms:hits,method:'THEORY_DERIVED_LEXICAL_EVIDENCE',status:'INFERRED'};
    });
  }
  function analyzeDocuments(documents){
    const evidence=[]; const claims=[]; const allTokens=[];
    documents.forEach(doc=>{
      splitSentences(doc.text).forEach(([sent,start,end],i)=>{
        const eid=`${doc.document_id}:e:${i}`;
        evidence.push({evidence_id:eid,document_id:doc.document_id,text:sent,start,end,sentence_index:i});
        const f=classifyFactuality(sent);
        claims.push({claim_id:`${doc.document_id}:c:${i}`,document_id:doc.document_id,evidence_id:eid,text:sent,factuality:f.factuality,modality_markers:f.markers,negated:f.negated,status:'OBSERVED'});
        allTokens.push(...tokenList(sent));
      });
    });
    const entities=extractEntities(evidence);
    const evidenceToEntities=new Map();
    entities.forEach(ent=>ent.evidence_ids.forEach(eid=>{if(!evidenceToEntities.has(eid))evidenceToEntities.set(eid,new Set());evidenceToEntities.get(eid).add(ent.entity_id)}));
    const evidenceDoc=new Map(evidence.map(e=>[e.evidence_id,e.document_id]));
    const pairClaims=new Map(),pairDocs=new Map();
    for(const [eid,set] of evidenceToEntities){
      const ids=[...set].sort();
      for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++){
        const key=`${ids[a]}\u0000${ids[b]}`;
        if(!pairClaims.has(key))pairClaims.set(key,new Set()); if(!pairDocs.has(key))pairDocs.set(key,new Set());
        pairClaims.get(key).add(eid); pairDocs.get(key).add(evidenceDoc.get(eid));
      }
    }
    const cooccurrence=[...pairClaims.keys()].sort().map(key=>{const [source_entity_id,target_entity_id]=key.split('\u0000');return {source_entity_id,target_entity_id,shared_claims:pairClaims.get(key).size,shared_documents:pairDocs.get(key).size}});
    const unique=new Set(allTokens).size,n=allTokens.length;
    const metrics={documents:documents.length,sentences:evidence.length,tokens:n,unique_tokens:unique,lexical_diversity:n?unique/n:0,entity_candidates:entities.length,claims:claims.length};
    const warnings=[]; if(!documents.length)warnings.push('No hay documentos disponibles para análisis.'); if(documents.length&&!n)warnings.push('No se detectaron unidades léxicas analizables.');
    return {documents,evidence,claims,entities,semantic_evidence:lexicalSemanticEvidence(allTokens),cooccurrence,metrics,warnings};
  }

  function normHeader(x){return String(x??'').trim().toLowerCase().replace(/\s+/g,'_')}
  const TEXT_KEYS=new Set(['text','texto','body','contenido','content','nota','documento','document']);
  const DATE_KEYS=new Set(['date','fecha','published_at','publication_date']);
  const TITLE_KEYS=new Set(['title','titulo','titular','encabezado']);
  const SOURCE_KEYS=new Set(['source','fuente','medio','outlet']);
  function pick(headers,keys){for(const k of keys)if(headers.has(k))return k;return null}
  function rowsToDocuments(rows,prefix='doc'){
    if(!rows.length)return [];
    const normalized=rows.map(row=>Object.fromEntries(Object.entries(row||{}).map(([k,v])=>[normHeader(k),v])));
    const headers=new Set(normalized.flatMap(r=>Object.keys(r)));
    let textKey=pick(headers,TEXT_KEYS);
    if(textKey===null){
      let best=null;
      for(const h of headers){const score=normalized.reduce((s,r)=>s+String(r[h]??'').length,0)/Math.max(1,normalized.length);if(best===null||score>best[0])best=[score,h]}
      textKey=best?best[1]:null;
    }
    const dateKey=pick(headers,DATE_KEYS),titleKey=pick(headers,TITLE_KEYS),sourceKey=pick(headers,SOURCE_KEYS);
    const docs=[];
    normalized.forEach((row,i)=>{
      const txt=textKey?String(row[textKey]??'').trim():''; if(!txt)return;
      const metadata={};Object.entries(row).forEach(([k,v])=>{if(![textKey,dateKey,titleKey,sourceKey].includes(k))metadata[k]=v});
      docs.push({document_id:`${prefix}-${i+1}`,text:txt,title:titleKey&&row[titleKey]!=null?String(row[titleKey]):null,source:sourceKey&&row[sourceKey]!=null?String(row[sourceKey]):null,date:dateKey&&row[dateKey]!=null?String(row[dateKey]):null,metadata});
    });
    return docs;
  }
  function parseDelimited(text){
    const src=String(text??'');
    const first=src.split(/\r?\n/,1)[0]||'';
    const delimiters=[',',';','\t','|'];
    const delimiter=delimiters.map(d=>[d,(first.match(new RegExp(d==='|'?'\\|':d,'g'))||[]).length]).sort((a,b)=>b[1]-a[1])[0][0];
    const rows=[];let row=[],field='',quoted=false;
    for(let i=0;i<src.length;i++){
      const c=src[i];
      if(c==='"'){
        if(quoted&&src[i+1]==='"'){field+='"';i++;}else quoted=!quoted;
      }else if(c===delimiter&&!quoted){row.push(field);field='';}
      else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&src[i+1]==='\n')i++;row.push(field);rows.push(row);row=[];field='';}
      else field+=c;
    }
    if(field.length||row.length){row.push(field);rows.push(row)}
    if(!rows.length)return [];
    const headers=rows[0].map(String);
    return rows.slice(1).filter(r=>r.some(v=>String(v).trim())).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??''])));
  }
  async function ingestFile(file){
    const name=String(file.name||''); const ext=(name.match(/\.[^.]+$/)||[''])[0].toLowerCase();
    if(ext==='.txt'||ext==='.md') return [{document_id:'doc-1',text:await file.text(),title:null,source:null,date:null,metadata:{}}];
    if(ext==='.csv') return rowsToDocuments(parseDelimited(await file.text()));
    if(ext==='.json'){
      const obj=JSON.parse(await file.text());
      if(Array.isArray(obj)&&obj.every(x=>x&&typeof x==='object'&&!Array.isArray(x)))return rowsToDocuments(obj);
      if(obj&&typeof obj==='object'&&!Array.isArray(obj)){
        for(const key of ['documents','records','rows','data']) if(Array.isArray(obj[key])&&obj[key].every(x=>x&&typeof x==='object'&&!Array.isArray(x))) return rowsToDocuments(obj[key]);
        for(const [k,v] of Object.entries(obj)) if(TEXT_KEYS.has(normHeader(k))&&typeof v==='string') return [{document_id:'doc-1',text:v,title:null,source:null,date:null,metadata:{}}];
      }
      throw new Error('El JSON no contiene una estructura documental reconocible.');
    }
    if(ext==='.xlsx'||ext==='.xlsm'){
      if(typeof XLSX==='undefined')throw new Error('El lector XLSX no está disponible.');
      const ab=await file.arrayBuffer(); const wb=XLSX.read(ab,{type:'array'}); const docs=[];let seq=1;
      wb.SheetNames.forEach(name=>{
        const rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{defval:null,raw:true});
        const part=rowsToDocuments(rows,`doc-${seq}`); part.forEach(d=>{d.metadata.worksheet=name}); docs.push(...part);seq++;
      });
      return docs;
    }
    throw new Error('Formato de archivo no admitido.');
  }

  function spatialUtility(position,outcome,alpha){const d=Math.abs(position-outcome)/100;return 1-2*(d**alpha)}
  function coalitionDominanceIndex(i,j,actors){let num=0,den=0;for(const k of actors){const alpha=k.alpha==null?1:Number(k.alpha);const du=spatialUtility(k.position,i.position,alpha)-spatialUtility(k.position,j.position,alpha);const weight=k.capacity*k.salience;if(du>0)num+=weight*du;den+=weight*Math.abs(du)}return den===0?null:num/den}
  function strategicCenter(actors){const den=actors.reduce((s,a)=>s+a.capacity*a.salience,0);return den===0?null:actors.reduce((s,a)=>s+a.position*a.capacity*a.salience,0)/den}
  function concentrationScore(actors,center){if(center==null||!actors.length)return null;const total=actors.reduce((s,a)=>s+a.capacity,0);if(total<=0)return null;const variance=actors.reduce((s,a)=>s+((a.position-center)**2)*(a.capacity/total),0);return Math.max(0,Math.min(100,(1-Math.sqrt(variance)/50)*100))}
  function validateStrategicActor(a){if(!(a.position>=0&&a.position<=100))throw new Error('La posición debe estar entre 0 y 100.');if(!(a.capacity>0))throw new Error('La capacidad debe ser positiva.');if(!(a.salience>0&&a.salience<=1))throw new Error('La saliencia debe estar entre 0 (exclusivo) y 1.');if(a.rigidity!=null&&!(a.rigidity>=0&&a.rigidity<=1))throw new Error('La rigidez debe estar entre 0 y 1.');if(a.alpha!=null&&!(a.alpha>0))throw new Error('La curvatura debe ser positiva.')}
  function runStrategy(inp){
    if(!inp||!String(inp.axis_label||'').trim())throw new Error('El eje estratégico es obligatorio.');
    if(!Array.isArray(inp.actors)||inp.actors.length<2)throw new Error('El modelo estratégico requiere al menos dos actores.');
    inp.actors.forEach(validateStrategicActor);const total=inp.actors.reduce((s,a)=>s+a.capacity,0);if(total<=0)return {axis_label:inp.axis_label,actors:[],system_center:null,concentration:null,pairs:[],warnings:['La capacidad total debe ser positiva.']};
    const actorResults=inp.actors.map(a=>({actor_id:a.actor_id,normalized_capacity:a.capacity/total,mobilized_capacity:a.capacity*a.salience}));const center=strategicCenter(inp.actors),concentration=concentrationScore(inp.actors,center),pairs=[];
    for(let x=0;x<inp.actors.length;x++)for(let y=x+1;y<inp.actors.length;y++){const i=inp.actors[x],j=inp.actors[y],wi=i.capacity*i.salience,wj=j.capacity*j.salience;const pc=wi+wj===0?null:(i.position*wi+j.position*wj)/(wi+wj);pairs.push({actor_i:i.actor_id,actor_j:j.actor_id,distance:Math.abs(i.position-j.position)/100,dominance_index_i_over_j:coalitionDominanceIndex(i,j,inp.actors),strategic_center:pc})}
    const warnings=[];if(inp.actors.some(a=>a.alpha==null))warnings.push('La curvatura de preferencia no fue especificada para todos los actores; el índice de dominancia utiliza curvatura lineal como supuesto computacional explícito.');
    return {axis_label:inp.axis_label,actors:actorResults,system_center:center,concentration,pairs,warnings};
  }

  return {VERSION,analyzeDocuments,ingestFile,rowsToDocuments,runStrategy,spatialUtility};
});
