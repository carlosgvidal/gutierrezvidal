let classifierPromise=null;
export async function loadNER(progressCallback=null){
  if(classifierPromise)return classifierPromise;
  classifierPromise=(async()=>{
    const {pipeline,env}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.0.1');
    env.allowLocalModels=false;
    return pipeline('token-classification','Xenova/distilbert-base-multilingual-cased-ner-hrl',{dtype:'q8',progress_callback:progressCallback||undefined});
  })();
  return classifierPromise;
}
function normalizeLabel(x){const s=String(x||'').replace(/^[BI]-/,'');return s==='PER'?'PERSON':s==='ORG'?'ORGANIZATION':s==='LOC'?'LOCATION':s==='DATE'?'DATE':s;}
function fillOffsets(item,text,from=0){if(item.start!==null&&item.end!==null)return from;const needle=item.text.replace(/\s+/g,' ').trim();if(!needle)return from;const idx=String(text).toLocaleLowerCase('es').indexOf(needle.toLocaleLowerCase('es'),from);if(idx>=0){item.start=idx;item.end=idx+needle.length;return item.end;}return from;}
function mergeOutput(output,prefix='ner',text=''){
  const items=[];
  for(const x of output||[]){const label=normalizeLabel(x.entity??x.entity_group??x.label);if(!['PERSON','ORGANIZATION','LOCATION','DATE'].includes(label))continue;
    const raw=String(x.word??''),word=raw.replace(/^##/,'');const start=Number.isFinite(x.start)?x.start:null,end=Number.isFinite(x.end)?x.end:null;const prev=items[items.length-1];
    if(prev&&prev.type===label&&start!==null&&prev.end!==null&&start<=prev.end+1){prev.text+=(raw.startsWith('##')?'':' ')+word;prev.end=end;prev.scores.push(Number(x.score)||0);}else if(prev&&prev.type===label&&start===null&&raw.startsWith('##')){prev.text+=word;prev.scores.push(Number(x.score)||0);}else items.push({type:label,text:word,start,end,scores:[Number(x.score)||0]});
  }
  let cursor=0;for(const item of items)cursor=fillOffsets(item,text,cursor);
  return items.map((x,i)=>({...x,entity_id:`${prefix}-${i+1}`,score:x.scores.reduce((a,b)=>a+b,0)/x.scores.length,method:'TRANSFORMERS_JS_NER'}));
}
export async function recognizeEntityBatch(texts,{progressCallback=null}={}){
  const input=Array.isArray(texts)?texts:[texts];
  try{const classifier=await loadNER(progressCallback);const output=await classifier(input,{ignore_labels:['O']});const batches=(Array.isArray(texts)?output:[output]);return {status:'AVAILABLE',batches:batches.map((x,i)=>mergeOutput(x,`ner-${i+1}`,input[i]||'')),error:null};}
  catch(e){return {status:'UNAVAILABLE',batches:input.map(()=>[]),error:e?.message||String(e)};}
}
