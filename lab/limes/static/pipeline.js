import {loadLinguisticResources} from './linguistics/resources.js';
import {tokenizeDocument} from './linguistics/tokenizer.js';
import {analyzeMorphology} from './linguistics/morphology.js';
import {parseDependencies} from './linguistics/syntax.js';
import {extractPredicates} from './linguistics/predicates.js';
import {recognizeEntityBatch} from './linguistics/ner.js';
import {resolveReferents} from './linguistics/referents.js';
import {resolveCoreference} from './linguistics/coreference.js';
import {analyzeSemiotics} from './semiotics/index.js';
import {computeTextMetrics} from './metrics/textmetrics.js';
import {buildInterpretiveReport} from './report/report.js';

export const VERSION='0.3.1';
function coverage(sentences){
  const toks=sentences.flatMap(s=>s.tokens);const content=toks.filter(t=>!['PUNCT','SYM'].includes(t.upos));const exact=content.filter(t=>t.morphology_source==='ANCORA_FORM_POS').length;
  const preds=sentences.flatMap(s=>s.predicates);const val=preds.filter(p=>p.valency_available).length;const synt=toks.filter(t=>t.syntax_status==='RESOLVED').length;
  return {morphology_exact_rate:content.length?exact/content.length:null,predicate_valency_coverage:preds.length?val/preds.length:null,resolved_dependency_rate:toks.length?synt/toks.length:null};
}
function flattenEntities(sentences){
  const map=new Map();
  for(const s of sentences)for(const e of s.entities){const key=`${e.type}|${e.text.toLocaleLowerCase('es')}`;if(!map.has(key))map.set(key,{entity_id:`entity-${map.size+1}`,label:e.text,type:e.type,mentions:0,scores:[],sentence_ids:[]});const x=map.get(key);x.mentions++;x.scores.push(e.score);x.sentence_ids.push(s.sentence_id);}
  return [...map.values()].map(x=>({...x,mean_score:x.scores.reduce((a,b)=>a+b,0)/x.scores.length,scores:undefined}));
}
export async function analyzeDocuments(documents,{useNER=true,onProgress=null}={}){
  const resources=await loadLinguisticResources();const sentences=[];
  for(const doc of documents){for(const base of tokenizeDocument(doc.text)){const morph=analyzeMorphology(base.tokens,resources);const parsed=parseDependencies(morph,resources);const sentence={...base,document_id:doc.document_id,sentence_index:base.index,sentence_id:`${doc.document_id}:s:${base.index}`,tokens:parsed,entities:[]};sentence.predicates=extractPredicates(parsed,resources);sentences.push(sentence);}}
  let ner={status:'DISABLED',batches:sentences.map(()=>[]),error:null};
  if(useNER&&sentences.length){
    onProgress?.({stage:'NER_LOAD',message:'Cargando/reutilizando el modelo de entidades nombradas…'});const batches=[];let nerStatus='AVAILABLE',nerError=null;const size=32;
    for(let i=0;i<sentences.length;i+=size){onProgress?.({stage:'NER_BATCH',message:`Entidades nombradas: ${Math.min(i+size,sentences.length)}/${sentences.length} oraciones`});const r=await recognizeEntityBatch(sentences.slice(i,i+size).map(s=>s.text),{progressCallback:p=>onProgress?.({stage:'NER_MODEL',detail:p})});batches.push(...r.batches);if(r.status!=='AVAILABLE'){nerStatus=r.status;nerError=r.error;break;}}
    while(batches.length<sentences.length)batches.push([]);ner={status:nerStatus,batches,error:nerError};
  }
  sentences.forEach((s,i)=>{s.entities=ner.batches[i]||[];s.referents=resolveReferents(s,s.tokens,s.entities);});
  resolveCoreference(sentences);
  sentences.forEach(analyzeSemiotics);
  sentences.forEach(s=>{s.referents=[...s.referents.values()];});
  const metrics=computeTextMetrics(documents,sentences);const analysis={version:VERSION,documents:documents.map(d=>({...d})),sentences,entities:flattenEntities(sentences),metrics,coverage:coverage(sentences),ner:{status:ner.status,error:ner.error},resource_provenance:{morphosyntax:'UD Spanish-AnCora derived aggregate resources',valency:'UD Spanish-AnCora ArgTem derived aggregate resource',named_entities:'Davlan/Xenova multilingual NER via Transformers.js when available'},warnings:[]};
  if(ner.status==='UNAVAILABLE')analysis.warnings.push('El modelo NER no estuvo disponible. Las entidades nombradas permanecen sin resolver; el análisis morfosintáctico continúa.');
  analysis.report=buildInterpretiveReport(analysis);return analysis;
}

function normHeader(x){return String(x??'').trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu,'').replace(/\s+/g,'_');}
const TEXT_KEYS=new Set(['text','texto','body','contenido','content','nota','documento','document']);
const DATE_KEYS=new Set(['date','fecha','published_at','publication_date']);
const TITLE_KEYS=new Set(['title','titulo','titular','encabezado']);
const SOURCE_KEYS=new Set(['source','fuente','medio','outlet']);
function pick(headers,keys){for(const k of keys)if(headers.has(k))return k;return null;}
export function rowsToDocuments(rows,prefix='doc'){
  if(!rows.length)return [];const normalized=rows.map(row=>Object.fromEntries(Object.entries(row||{}).map(([k,v])=>[normHeader(k),v])));const headers=new Set(normalized.flatMap(r=>Object.keys(r)));let textKey=pick(headers,TEXT_KEYS);
  if(textKey===null){let best=null;for(const h of headers){const score=normalized.reduce((s,r)=>s+String(r[h]??'').length,0)/Math.max(1,normalized.length);if(best===null||score>best[0])best=[score,h];}textKey=best?best[1]:null;}
  const dateKey=pick(headers,DATE_KEYS),titleKey=pick(headers,TITLE_KEYS),sourceKey=pick(headers,SOURCE_KEYS),docs=[];
  normalized.forEach((row,i)=>{const text=textKey?String(row[textKey]??'').trim():'';if(!text)return;const metadata={};for(const [k,v] of Object.entries(row))if(![textKey,dateKey,titleKey,sourceKey].includes(k))metadata[k]=v;docs.push({document_id:`${prefix}-${i+1}`,text,title:titleKey&&row[titleKey]!=null?String(row[titleKey]):null,source:sourceKey&&row[sourceKey]!=null?String(row[sourceKey]):null,date:dateKey&&row[dateKey]!=null?String(row[dateKey]):null,metadata});});return docs;
}
function parseDelimited(src){const text=String(src??''),first=text.split(/\r?\n/,1)[0]||'',ds=[',',';','\t','|'],delimiter=ds.map(d=>[d,(first.match(new RegExp(d==='|'?'\\|':d,'g'))||[]).length]).sort((a,b)=>b[1]-a[1])[0][0];const rows=[];let row=[],field='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(c===delimiter&&!quoted){row.push(field);field='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);rows.push(row);row=[];field='';}else field+=c;}if(field.length||row.length){row.push(field);rows.push(row);}if(!rows.length)return [];const headers=rows[0].map(String);return rows.slice(1).filter(r=>r.some(v=>String(v).trim())).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??''])));}
export async function ingestFile(file){const name=String(file.name||''),ext=(name.match(/\.[^.]+$/)||[''])[0].toLowerCase();if(ext==='.txt'||ext==='.md')return [{document_id:'doc-1',text:await file.text(),title:null,source:null,date:null,metadata:{}}];if(ext==='.csv')return rowsToDocuments(parseDelimited(await file.text()));if(ext==='.json'){const obj=JSON.parse(await file.text());if(Array.isArray(obj))return rowsToDocuments(obj);for(const key of ['documents','records','rows','data'])if(Array.isArray(obj?.[key]))return rowsToDocuments(obj[key]);throw new Error('El JSON no contiene una estructura tabular/documental reconocible.');}if(ext==='.xlsx'||ext==='.xlsm'){if(typeof XLSX==='undefined')throw new Error('El lector XLSX no está disponible.');const wb=XLSX.read(await file.arrayBuffer(),{type:'array'}),docs=[];let seq=1;for(const name of wb.SheetNames){const rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{defval:null,raw:true});const part=rowsToDocuments(rows,`doc-${seq++}`);part.forEach(d=>d.metadata.worksheet=name);docs.push(...part);}return docs;}throw new Error('Formato de archivo no admitido.');}
