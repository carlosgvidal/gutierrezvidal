function sentenceSegments(text){
  const src=String(text??'');
  if(typeof Intl!=='undefined' && Intl.Segmenter){
    const seg=new Intl.Segmenter('es',{granularity:'sentence'});
    return [...seg.segment(src)].map((x,i)=>{const raw=x.segment,trim=raw.trim();const lead=trim?raw.indexOf(trim):0;return {text:trim,start:x.index+lead,end:x.index+lead+trim.length,index:i};}).filter(x=>x.text);
  }
  const out=[]; const rx=/[^.!?\n]+(?:[.!?]+|$)/gu; let m,i=0;
  while((m=rx.exec(src))){const raw=m[0],trim=raw.trim();if(trim){const lead=raw.indexOf(trim);out.push({text:trim,start:m.index+lead,end:m.index+lead+trim.length,index:i++});}}
  return out;
}
function rawWordSegments(text,baseOffset=0){
  const src=String(text??'');
  if(typeof Intl!=='undefined' && Intl.Segmenter){
    const seg=new Intl.Segmenter('es',{granularity:'word'}); const out=[];
    for(const x of seg.segment(src)){
      const s=x.segment;if(/^\s+$/u.test(s))continue;
      if(x.isWordLike || /^[^\p{L}\p{N}\s]+$/u.test(s))out.push({form:s,start:baseOffset+x.index,end:baseOffset+x.index+s.length});
    }
    return out;
  }
  const out=[];const rx=/[\p{L}\p{M}]+(?:['’\-][\p{L}\p{M}]+)*|\d+(?:[.,]\d+)*|[^\s]/gu;let m;
  while((m=rx.exec(src)))out.push({form:m[0],start:baseOffset+m.index,end:baseOffset+m.index+m[0].length});
  return out;
}
export function tokenizeDocument(text){
  return sentenceSegments(text).map(s=>({...s,tokens:rawWordSegments(s.text,s.start).map((t,i)=>({...t,index:i}))}));
}
