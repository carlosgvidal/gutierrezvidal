from __future__ import annotations
import re, unicodedata
from collections import Counter
from .models import Claim, Evidence, EntityCandidate, LexicalEvidence
from .theory_terms import THEORY_TERMS

NEGATION = {'no','nunca','jamás','tampoco','nadie','ningún','ninguna','ninguno','sin'}
MODAL = {
    'podría':'POSSIBLE','puede':'POSSIBLE','pueden':'POSSIBLE','posible':'POSSIBLE',
    'debe':'REQUIRED','deben':'REQUIRED','deberá':'REQUIRED','deberán':'REQUIRED',
    'pretende':'INTENDED','pretenden':'INTENDED','intenta':'INTENDED','intentan':'INTENDED',
    'planea':'PLANNED','planean':'PLANNED','prevé':'PLANNED','prevén':'PLANNED',
    'si':'CONDITIONAL'
}
ATTRIBUTION = {'según','afirma','afirman','sostiene','sostienen','señala','señalan','reporta','reportan'}
DENIAL = {'niega','niegan','negó','negaron','rechaza','rechazan','desmiente','desmienten'}

STOPWORDS = {
    'a','al','algo','ante','bajo','con','contra','cual','cuando','de','del','desde','donde','durante',
    'e','el','ella','ellas','ellos','en','entre','era','es','esa','ese','eso','esta','este','esto','fue',
    'ha','han','hasta','hay','la','las','le','les','lo','los','más','muy','o','para','pero','por','que',
    'se','ser','si','sin','sobre','su','sus','también','un','una','uno','unos','unas','y','ya'
}

SENTENCE_RE = re.compile(r'(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÜÑ0-9¿¡])|\n+')
TOKEN_RE = re.compile(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:['’-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)?|\d+(?:[.,]\d+)?", re.UNICODE)
ENTITY_RE = re.compile(r'\b(?:[A-ZÁÉÍÓÚÜÑ][\wÁÉÍÓÚÜÑáéíóúüñ-]+(?:\s+|$)){1,5}', re.UNICODE)


def normalize_token(token:str)->str:
    return unicodedata.normalize('NFKC', token).lower().strip("'’-_")

def split_sentences(text:str)->list[tuple[str,int,int]]:
    text = text.replace('\r\n','\n').replace('\r','\n')
    parts=[]; last=0
    for m in SENTENCE_RE.finditer(text):
        seg=text[last:m.start()].strip()
        if seg:
            start=text.find(seg,last,m.start()+1); parts.append((seg,start,start+len(seg)))
        last=m.end()
    seg=text[last:].strip()
    if seg:
        start=text.find(seg,last); parts.append((seg,start,start+len(seg)))
    return parts

def tokens(text:str)->list[str]:
    return [normalize_token(x) for x in TOKEN_RE.findall(text)]

def classify_factuality(sentence:str)->tuple[str,list[str],bool]:
    toks=tokens(sentence); st=set(toks)
    markers=[]
    neg=any(t in NEGATION for t in toks)
    if any(t in DENIAL for t in toks):
        markers.extend(sorted(st & DENIAL)); return 'DENIED',markers,True
    if any(t in ATTRIBUTION for t in toks):
        markers.extend(sorted(st & ATTRIBUTION)); base='ATTRIBUTED'
    else:
        base='REALIZED'
    modal_hits=[]
    for t in toks:
        if t in MODAL:
            modal_hits.append(t)
    if modal_hits:
        markers.extend(modal_hits)
        order=['CONDITIONAL','REQUIRED','PLANNED','INTENDED','POSSIBLE']
        labels={MODAL[t] for t in modal_hits}
        for label in order:
            if label in labels: return label,markers,neg
    return base,markers,neg

def extract_entities(evidence:list[Evidence])->list[EntityCandidate]:
    occurrences={}
    for ev in evidence:
        for m in ENTITY_RE.finditer(ev.text):
            raw=' '.join(m.group(0).split()).strip()
            if not raw or len(raw)<2: continue
            first=raw.split()[0]
            # La mayúscula por inicio de oración, por sí sola, no basta.
            if m.start()==0 and len(raw.split())==1: continue
            key=unicodedata.normalize('NFKC',raw).casefold()
            d=occurrences.setdefault(key,{'label':raw,'evidence':[]})
            d['evidence'].append(ev.evidence_id)
    out=[]
    for idx,(key,d) in enumerate(sorted(occurrences.items(), key=lambda kv:(-len(kv[1]['evidence']),kv[0])),1):
        out.append(EntityCandidate(entity_id=f'ent-{idx}',label=d['label'],mentions=len(d['evidence']),evidence_ids=d['evidence']))
    return out

def lexical_semantic_evidence(all_tokens:list[str])->list[LexicalEvidence]:
    total=max(1,len(all_tokens)); counts=Counter(all_tokens); out=[]
    for dim,terms in THEORY_TERMS.items():
        hits={t:counts[t] for t in sorted(terms) if counts[t]}
        count=sum(hits.values())
        out.append(LexicalEvidence(dimension=dim,count=count,density=count/total,terms=hits))
    return out

def candidate_terms(all_tokens:list[str], limit:int=30)->list[tuple[str,int]]:
    c=Counter(t for t in all_tokens if len(t)>2 and t not in STOPWORDS and not t.isdigit())
    return c.most_common(limit)
