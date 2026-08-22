from __future__ import annotations
from collections import defaultdict
from .models import Document,Evidence,Claim,AnalyzeResult,CorpusMetrics,CooccurrenceEdge
from .linguistics import split_sentences,tokens,classify_factuality,extract_entities,lexical_semantic_evidence


def analyze_documents(documents:list[Document])->AnalyzeResult:
    evidence=[]; claims=[]; all_tokens=[]
    for doc in documents:
        for i,(sent,start,end) in enumerate(split_sentences(doc.text)):
            eid=f'{doc.document_id}:e:{i}'
            evidence.append(Evidence(evidence_id=eid,document_id=doc.document_id,text=sent,start=start,end=end,sentence_index=i))
            factuality,markers,neg=classify_factuality(sent)
            claims.append(Claim(claim_id=f'{doc.document_id}:c:{i}',document_id=doc.document_id,evidence_id=eid,text=sent,factuality=factuality,modality_markers=markers,negated=neg))
            all_tokens.extend(tokens(sent))
    entities=extract_entities(evidence)
    label_map={e.entity_id:e for e in entities}
    evidence_to_entities=defaultdict(set)
    for e in entities:
        for eid in e.evidence_ids: evidence_to_entities[eid].add(e.entity_id)
    pair_claims=defaultdict(set); pair_docs=defaultdict(set)
    evidence_doc={e.evidence_id:e.document_id for e in evidence}
    for eid,ids in evidence_to_entities.items():
        ids=sorted(ids)
        for a in range(len(ids)):
            for b in range(a+1,len(ids)):
                p=(ids[a],ids[b]); pair_claims[p].add(eid); pair_docs[p].add(evidence_doc[eid])
    co=[CooccurrenceEdge(source_entity_id=a,target_entity_id=b,shared_claims=len(pair_claims[(a,b)]),shared_documents=len(pair_docs[(a,b)])) for a,b in sorted(pair_claims)]
    unique=len(set(all_tokens)); n=len(all_tokens)
    metrics=CorpusMetrics(documents=len(documents),sentences=len(evidence),tokens=n,unique_tokens=unique,lexical_diversity=(unique/n if n else 0.0),entity_candidates=len(entities),claims=len(claims))
    warnings=[]
    if not documents: warnings.append('No hay documentos disponibles para análisis.')
    if documents and n==0: warnings.append('No se detectaron unidades léxicas analizables.')
    return AnalyzeResult(documents=documents,evidence=evidence,claims=claims,entities=entities,semantic_evidence=lexical_semantic_evidence(all_tokens),cooccurrence=co,metrics=metrics,warnings=warnings)
