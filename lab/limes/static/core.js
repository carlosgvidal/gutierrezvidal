'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.LIMES_CORE=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const VERSION='0.2.0';
  const CLOSED=new Set(['a','al','ante','bajo','con','contra','de','del','desde','durante','en','entre','hacia','hasta','mediante','para','por','según','sin','sobre','tras','el','la','los','las','un','una','unos','unas','lo','que','se','su','sus','y','e','o','u','pero','como','más','menos','muy','ya','también','este','esta','estos','estas','ese','esa','esos','esas','aquel','aquella','aquellos','aquellas','mi','mis','tu','tus','otro','otra','otros','otras']);
  const DETERMINERS=new Set(['el','la','los','las','un','una','unos','unas','este','esta','estos','estas','ese','esa','esos','esas','aquel','aquella','aquellos','aquellas','mi','mis','tu','tus','su','sus','nuestro','nuestra','nuestros','nuestras']);
  const PRONOUNS=new Set(['yo','tú','tu','él','ella','ello','nosotros','nosotras','ustedes','ellos','ellas','me','te','nos','le','les','lo','la','los','las','se']);
  const SUBORDINATORS=new Set(['que','si','aunque','porque','cuando','mientras','donde','como','quien','quienes','cuyo','cuya','cuyos','cuyas']);
  const PREPOSITIONS=new Set(['a','ante','bajo','con','contra','de','desde','durante','en','entre','hacia','hasta','mediante','para','por','según','sin','sobre','tras']);
  const COORDINATORS=new Set(['y','e','o','u','pero','sino','aunque']);
  const NEGATORS=new Set(['no','nunca','jamás','tampoco','nadie','ningún','ninguna','ninguno','sin']);
  const AUXILIARIES=new Set(['ser','estar','haber','tener','poder','deber','querer','ir','venir','seguir']);
  const IDENTITY_COPULAR=new Set(['ser','parecer','resultar']);
  const SITUATIVE=new Set(['estar','permanecer','quedar']);
  const RELATIONAL=new Set(['depender','pertenecer','ubicarse','encontrarse','situarse','hallarse','residir','ocupar','mantenerse']);
  const SPEECH=new Set(['decir','afirmar','declarar','informar','señalar','sostener','expresar','manifestar','comunicar','anunciar','preguntar','responder','explicar','argumentar','denunciar','acusar','proponer','solicitar','exigir','reconocer','advertir','indicar']);
  const PERFORMATIVE=new Set(['ordenar','prohibir','permitir','autorizar','sancionar','aprobar','rechazar','designar','nombrar','convocar','prometer','regular','imponer','decretar','resolver']);
  const TRANSFORMATIVE=new Set(['hacer','actuar','cambiar','modificar','transformar','reformar','eliminar','retirar','reducir','aumentar','ampliar','restringir','limitar','bloquear','facilitar','proteger','controlar','incorporar','excluir','incluir','entregar','transferir','otorgar','conceder','pagar','asignar','implementar','ejecutar','afectar','impedir']);
  const GOAL_MAP=new Map([
    ['mantener','PRESERVE'],['conservar','PRESERVE'],['proteger','PRESERVE'],['preservar','PRESERVE'],
    ['aumentar','INCREASE'],['incrementar','INCREASE'],['ampliar','INCREASE'],['fortalecer','INCREASE'],['expandir','INCREASE'],
    ['reducir','REDUCE'],['disminuir','REDUCE'],['recortar','REDUCE'],['eliminar','REDUCE'],['retirar','REDUCE'],['quitar','REDUCE'],
    ['limitar','RESTRICT'],['restringir','RESTRICT'],['prohibir','RESTRICT'],['bloquear','RESTRICT'],['impedir','RESTRICT'],['excluir','RESTRICT'],
    ['permitir','ENABLE_ACCESS'],['autorizar','ENABLE_ACCESS'],['habilitar','ENABLE_ACCESS'],['incluir','ENABLE_ACCESS'],['admitir','ENABLE_ACCESS'],
    ['transferir','TRANSFER'],['entregar','TRANSFER'],['otorgar','TRANSFER'],['conceder','TRANSFER'],['asignar','TRANSFER'],
    ['cambiar','TRANSFORM'],['modificar','TRANSFORM'],['transformar','TRANSFORM'],['reformar','TRANSFORM'],['sustituir','TRANSFORM']
  ]);
  const BOUNDARY_MAP=new Map([
    ['prohibir','RESISTANCE'],['restringir','RESISTANCE'],['limitar','RESISTANCE'],['bloquear','RESISTANCE'],['impedir','RESISTANCE'],['excluir','RESISTANCE'],['sancionar','RESISTANCE'],
    ['permitir','PERMEABILITY'],['autorizar','PERMEABILITY'],['habilitar','PERMEABILITY'],['incluir','PERMEABILITY'],['admitir','PERMEABILITY'],['transferir','PERMEABILITY'],['entregar','PERMEABILITY'],
    ['reconocer','LEGITIMACY_SUPPORT'],['aprobar','LEGITIMACY_SUPPORT'],['validar','LEGITIMACY_SUPPORT'],['legitimar','LEGITIMACY_SUPPORT'],
    ['rechazar','LEGITIMACY_CHALLENGE'],['impugnar','LEGITIMACY_CHALLENGE'],['cuestionar','LEGITIMACY_CHALLENGE'],['invalidar','LEGITIMACY_CHALLENGE']
  ]);
  const COST_NOUNS=new Set(['costo','coste','pérdida','sacrificio','riesgo','daño','afectación','penalización','multa']);
  const IRREGULAR_FORMS=new Map([
    ['es','ser'],['son','ser'],['era','ser'],['eran','ser'],['fue','ser'],['fueron','ser'],['será','ser'],['serán','ser'],
    ['está','estar'],['están','estar'],['estaba','estar'],['estaban','estar'],['estuvo','estar'],['estuvieron','estar'],
    ['ha','haber'],['han','haber'],['había','haber'],['habían','haber'],['hubo','haber'],['hay','haber'],
    ['tiene','tener'],['tienen','tener'],['tenía','tener'],['tenían','tener'],['tuvo','tener'],['tuvieron','tener'],
    ['puede','poder'],['pueden','poder'],['podía','poder'],['podían','poder'],['podrá','poder'],['podrán','poder'],
    ['debe','deber'],['deben','deber'],['debía','deber'],['debían','deber'],['deberá','deber'],['deberán','deber'],
    ['dijo','decir'],['dijeron','decir'],['dice','decir'],['dicen','decir'],
    ['hizo','hacer'],['hicieron','hacer'],['hace','hacer'],['hacen','hacer'],
    ['puso','poner'],['pusieron','poner'],['pone','poner'],['ponen','poner'],
    ['dio','dar'],['dieron','dar'],['da','dar'],['dan','dar'],
    ['vio','ver'],['vieron','ver'],['ve','ver'],['ven','ver']
  ]);
  const LEMMA_STEMS=[...new Set([...IDENTITY_COPULAR,...SITUATIVE,...RELATIONAL,...SPEECH,...PERFORMATIVE,...TRANSFORMATIVE,...GOAL_MAP.keys(),...BOUNDARY_MAP.keys(),...AUXILIARIES])];
  function norm(s){return String(s??'').normalize('NFKC').toLowerCase().trim();}
  function stripAccents(s){return norm(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').normalize('NFC');}
  function sentenceSegments(text){
    const src=String(text??'').replace(/\r\n?/g,'\n'),out=[];let start=0;
    const re=/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÜÑ¿¡0-9])|\n+/g;let m;
    while((m=re.exec(src))){const raw=src.slice(start,m.index).trim();if(raw){const off=src.indexOf(raw,start);out.push({text:raw,start:off,end:off+raw.length});}start=re.lastIndex;}
    const raw=src.slice(start).trim();if(raw){const off=src.indexOf(raw,start);out.push({text:raw,start:off,end:off+raw.length});}return out;
  }
  function tokenize(text,offset=0){
    const src=String(text??''),re=/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:['’-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)?|\d+(?:[.,]\d+)?|[.,;:!?¿¡()“”"'—–-]/gu,out=[];let m;
    while((m=re.exec(src))){const raw=m[0],n=norm(raw);out.push({raw,norm:n,start:offset+m.index,end:offset+m.index+raw.length,capitalized:/^[A-ZÁÉÍÓÚÜÑ]/u.test(raw),punct:/^[.,;:!?¿¡()“”"'—–-]$/u.test(raw)});}return out;
  }
  function lemmaOf(token){
    const n=norm(token);if(IRREGULAR_FORMS.has(n))return IRREGULAR_FORMS.get(n);
    const a=stripAccents(n);
    for(const lemma of LEMMA_STEMS){const l=stripAccents(lemma);if(a===l)return lemma;if(a.startsWith(l.slice(0,Math.max(3,l.length-2)))&&/(o|as|a|amos|an|es|e|emos|en|é|aste|ó|aron|í|iste|ió|ieron|aba|abas|aban|ía|ías|ían|ará|arán|erá|erán|irá|irán|ando|iendo|ado|ido)$/u.test(a))return lemma;}
    if(/(ar|er|ir)$/u.test(a))return n;
    return null;
  }
  function predicateClass(lemma){if(!lemma)return 'UNRESOLVED';if(IDENTITY_COPULAR.has(lemma))return 'IDENTITY_COPULAR';if(SITUATIVE.has(lemma))return 'SITUATIVE';if(RELATIONAL.has(lemma))return 'RELATIONAL';if(SPEECH.has(lemma))return 'ENUNCIATIVE';if(PERFORMATIVE.has(lemma))return 'PERFORMATIVE';if(TRANSFORMATIVE.has(lemma)||GOAL_MAP.has(lemma)||BOUNDARY_MAP.has(lemma))return 'AGENTIVE';return 'UNRESOLVED';}
  function modality(tokens){const ns=tokens.map(t=>t.norm),neg=ns.some(x=>NEGATORS.has(x));let status='ASSERTED';const lemmas=tokens.map(t=>lemmaOf(t.norm)).filter(Boolean);if(lemmas.includes('poder'))status='POSSIBLE';if(lemmas.includes('deber'))status='REQUIRED';if(ns.includes('si'))status='CONDITIONAL';if(ns.some(x=>['pretende','pretenden','intenta','intentan'].includes(x)))status='INTENDED';if(ns.some(x=>['planea','planean','prevé','prevén'].includes(x)))status='PLANNED';return {negated:neg,status};}
  function splitClauses(sentence){
    const toks=tokenize(sentence.text,sentence.start),out=[];let current=[],depth=0;
    const flush=()=>{if(current.length){out.push(current);current=[];}};
    toks.forEach((t,i)=>{if(t.raw==='(')depth++;if(t.raw===')')depth=Math.max(0,depth-1);const boundary=depth===0&&(t.raw===';'||t.raw===':'||t.raw==='—'||(COORDINATORS.has(t.norm)&&i>0));if(boundary){flush();return;}current.push(t);});flush();return out;
  }
  function isClauseWord(t){return !t.punct&&!COORDINATORS.has(t.norm)&&!SUBORDINATORS.has(t.norm);}
  function phrase(tokens){const xs=tokens.filter(isClauseWord);if(!xs.length)return null;return {text:xs.map(x=>x.raw).join(' ').replace(/\s+([,.;:!?])/g,'$1').trim(),start:xs[0].start,end:xs[xs.length-1].end,tokens:xs};}
  function trimNP(tokens){let xs=tokens.filter(t=>!t.punct);while(xs.length&&(COORDINATORS.has(xs[0].norm)||SUBORDINATORS.has(xs[0].norm)))xs.shift();while(xs.length&&(COORDINATORS.has(xs[xs.length-1].norm)||SUBORDINATORS.has(xs[xs.length-1].norm)))xs.pop();return xs;}
  function nounPhraseLeft(tokens,pidx){
    let xs=tokens.slice(0,pidx);let cut=-1;for(let i=xs.length-1;i>=0;i--){if(xs[i].punct||COORDINATORS.has(xs[i].norm)||SUBORDINATORS.has(xs[i].norm)){cut=i;break;}}xs=trimNP(xs.slice(cut+1));if(!xs.length)return null;if(PREPOSITIONS.has(xs[0].norm))return null;const p=phrase(xs);if(!p)return null;return {...p,kind:PRONOUNS.has(xs[0].norm)?'PRONOMINAL':'NOMINAL'};
  }
  function nounPhraseRight(tokens,pidx){
    let xs=tokens.slice(pidx+1);if(!xs.length)return {direct:null,target:null,content:null,complements:[]};
    const out={direct:null,target:null,content:null,complements:[]};
    if(xs[0]&&SUBORDINATORS.has(xs[0].norm)){const p=phrase(xs.slice(1));if(p)out.content=p;return out;}
    let segment=[],prep=null;
    const flush=()=>{const p=phrase(trimNP(segment));if(p){const item={preposition:prep,phrase:p};out.complements.push(item);if(prep==='a'&&!out.target)out.target=p;else if(!prep&&!out.direct)out.direct=p;}segment=[];prep=null;};
    for(let i=0;i<xs.length;i++){const t=xs[i];if(t.punct||COORDINATORS.has(t.norm)){flush();break;}if(SUBORDINATORS.has(t.norm)){flush();const p=phrase(xs.slice(i+1));if(p)out.content=p;break;}if(PREPOSITIONS.has(t.norm)){flush();prep=t.norm;continue;}const l=lemmaOf(t.norm);if(l&&predicateClass(l)!=='UNRESOLVED'){flush();break;}segment.push(t);}flush();return out;
  }
  function morphologicalVerbCandidate(t){if(!t||t.punct||t.capitalized||CLOSED.has(t.norm))return false;const a=stripAccents(t.norm);return /(ar|er|ir|ando|iendo|ado|ido|aste|iste|aron|ieron|aba|abas|aban|iamos|ia|ias|ian|are|aras|aran|ere|eras|eran|ire|iras|iran|aria|arias|arian|eria|erias|erian|iria|irias|irian)$/u.test(a)||/[óí]$/u.test(t.norm);}
  function findPredicate(tokens){for(let i=0;i<tokens.length;i++){const lemma=lemmaOf(tokens[i].norm);if(lemma&&predicateClass(lemma)!=='UNRESOLVED')return {index:i,token:tokens[i],lemma,class:predicateClass(lemma)};}for(let i=0;i<tokens.length;i++){if(morphologicalVerbCandidate(tokens[i]))return {index:i,token:tokens[i],lemma:lemmaOf(tokens[i].norm)||tokens[i].norm,class:'UNRESOLVED'};}return null;}
  function canonicalPhrase(p){if(!p)return null;let xs=p.tokens.map(t=>t.norm);while(xs.length&&DETERMINERS.has(xs[0]))xs.shift();return xs.join(' ').replace(/\s+/g,' ').trim()||null;}
  function analyzeDocument(doc){
    const sentences=sentenceSegments(doc.text),claims=[],actants=new Map();let seq=0;
    for(const s of sentences){for(const clauseTokens of splitClauses(s)){const pred=findPredicate(clauseTokens);if(!pred)continue;const source=nounPhraseLeft(clauseTokens,pred.index),right=nounPhraseRight(clauseTokens,pred.index),mod=modality(clauseTokens),claimId=`${doc.document_id}:cl:${++seq}`;
      const register=(p,role)=>{if(!p)return null;const key=canonicalPhrase(p);if(!key||CLOSED.has(key)||SUBORDINATORS.has(key))return null;const id=`act:${key}`;if(!actants.has(id))actants.set(id,{actant_id:id,label:p.text,canonical:key,mentions:0,roles:{SOURCE:0,TARGET:0,COMPLEMENT:0},evidence_ids:new Set(),agency_status:'UNRESOLVED'});const a=actants.get(id);a.mentions++;a.roles[role]++;a.evidence_ids.add(claimId);return id;};
      const sourceId=register(source,'SOURCE'),targetId=register(right.target,'TARGET'),complementActantId=register(right.direct,'COMPLEMENT');
      claims.push({claim_id:claimId,document_id:doc.document_id,text:clauseTokens.map(t=>t.raw).join(' '),predicate:{surface:pred.token.raw,lemma:pred.lemma,class:pred.class},source:{actant_id:sourceId,phrase:source},target:{actant_id:targetId,phrase:right.target},direct_object:{actant_id:complementActantId,phrase:right.direct},propositional_content:right.content,complements:right.complements,modality:mod.status,negated:mod.negated,evidence_span:{start:clauseTokens[0].start,end:clauseTokens[clauseTokens.length-1].end},status:'PARSED'});
    }}
    const arr=[...actants.values()].map(a=>({...a,evidence_ids:[...a.evidence_ids],agency_status:a.roles.SOURCE>0?'EVIDENCED':'UNRESOLVED',reference_status:PRONOUNS.has(a.canonical)?'DEICTIC_UNRESOLVED':'LEXICALIZED'}));
    return {document_id:doc.document_id,claims,actants:arr};
  }
  function analyzeDocuments(documents){const parsed=documents.map(analyzeDocument);const claims=parsed.flatMap(x=>x.claims);const map=new Map();for(const p of parsed)for(const a of p.actants){if(!map.has(a.actant_id))map.set(a.actant_id,{...a,evidence_ids:new Set(a.evidence_ids)});else{const x=map.get(a.actant_id);x.mentions+=a.mentions;for(const r of Object.keys(x.roles))x.roles[r]+=a.roles[r];a.evidence_ids.forEach(e=>x.evidence_ids.add(e));if(a.agency_status==='EVIDENCED')x.agency_status='EVIDENCED';}}const actants=[...map.values()].map(a=>({...a,evidence_ids:[...a.evidence_ids]}));return {version:VERSION,documents,claims,actants,metrics:{documents:documents.length,claims:claims.length,actants:actants.length},warnings:[]};}
  function rowsToDocuments(rows,prefix='doc'){if(!Array.isArray(rows)||!rows.length)return[];const keys=Object.keys(rows[0]||{});const normalized=keys.map(k=>[k,norm(k).replace(/\s+/g,'_')]);const textKeys=new Set(['text','texto','body','contenido','content','nota','documento','document']);let textKey=normalized.find(([,n])=>textKeys.has(n))?.[0]||null;if(!textKey){let best=null;for(const k of keys){const avg=rows.reduce((s,r)=>s+String(r[k]??'').length,0)/rows.length;if(!best||avg>best[0])best=[avg,k];}textKey=best?.[1]||null;}return rows.map((r,i)=>({document_id:`${prefix}-${i+1}`,text:String(r[textKey]??'').trim(),metadata:Object.fromEntries(Object.entries(r).filter(([k])=>k!==textKey))})).filter(d=>d.text);}
  function parseDelimited(text){const src=String(text??''),first=src.split(/\r?\n/,1)[0]||'',ds=[',',';','\t','|'],delimiter=ds.map(d=>[d,(first.split(d).length-1)]).sort((a,b)=>b[1]-a[1])[0][0];const rows=[];let row=[],field='',q=false;for(let i=0;i<src.length;i++){const c=src[i];if(c==='"'){if(q&&src[i+1]==='"'){field+='"';i++;}else q=!q;}else if(c===delimiter&&!q){row.push(field);field='';}else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&src[i+1]==='\n')i++;row.push(field);rows.push(row);row=[];field='';}else field+=c;}if(field||row.length){row.push(field);rows.push(row);}if(rows.length<2)return[];const h=rows[0];return rows.slice(1).filter(r=>r.some(x=>String(x).trim())).map(r=>Object.fromEntries(h.map((x,i)=>[x,r[i]??''])));}
  async function ingestFile(file){const ext=(String(file.name||'').match(/\.[^.]+$/)||[''])[0].toLowerCase();if(ext==='.txt'||ext==='.md')return[{document_id:'doc-1',text:await file.text(),metadata:{}}];if(ext==='.csv')return rowsToDocuments(parseDelimited(await file.text()));if(ext==='.json'){const o=JSON.parse(await file.text());if(Array.isArray(o))return rowsToDocuments(o);if(o&&Array.isArray(o.documents))return o.documents.map((d,i)=>({document_id:d.document_id||`doc-${i+1}`,text:String(d.text||d.body||'').trim(),metadata:d.metadata||{}})).filter(d=>d.text);throw new Error('El JSON no contiene una colección documental reconocible.');}if(ext==='.xlsx'||ext==='.xlsm'){if(typeof XLSX==='undefined')throw new Error('El lector XLSX no está disponible.');const wb=XLSX.read(await file.arrayBuffer(),{type:'array'}),docs=[];wb.SheetNames.forEach((name,i)=>{const rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{defval:null,raw:true});rowsToDocuments(rows,`sheet-${i+1}`).forEach(d=>{d.metadata.worksheet=name;docs.push(d);});});return docs;}throw new Error('Formato no admitido.');}
  return {VERSION,norm,tokenize,lemmaOf,predicateClass,GOAL_MAP,BOUNDARY_MAP,COST_NOUNS,IDENTITY_COPULAR,SITUATIVE,RELATIONAL,SPEECH,PERFORMATIVE,TRANSFORMATIVE,analyzeDocuments,ingestFile,rowsToDocuments};
});
