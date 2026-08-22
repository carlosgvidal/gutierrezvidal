from __future__ import annotations
from typing import Any, Literal
from pydantic import BaseModel, Field

EpistemicStatus = Literal['OBSERVED','INFERRED','ASSUMED','CONTESTED','UNRESOLVED']
Factuality = Literal['REALIZED','REPORTED','ATTRIBUTED','DENIED','PLANNED','INTENDED','REQUIRED','POSSIBLE','CONDITIONAL','COUNTERFACTUAL','UNRESOLVED']

class Evidence(BaseModel):
    evidence_id: str
    document_id: str
    text: str
    start: int | None = None
    end: int | None = None
    sentence_index: int | None = None

class Document(BaseModel):
    document_id: str
    text: str
    title: str | None = None
    source: str | None = None
    date: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)

class EntityCandidate(BaseModel):
    entity_id: str
    label: str
    mentions: int
    evidence_ids: list[str] = Field(default_factory=list)
    status: EpistemicStatus = 'INFERRED'

class Claim(BaseModel):
    claim_id: str
    document_id: str
    evidence_id: str
    text: str
    factuality: Factuality
    modality_markers: list[str] = Field(default_factory=list)
    negated: bool = False
    status: EpistemicStatus = 'OBSERVED'

class LexicalEvidence(BaseModel):
    dimension: Literal['SER','ESTAR','DECIR','HACER']
    count: int
    density: float
    terms: dict[str,int] = Field(default_factory=dict)
    method: Literal['THEORY_DERIVED_LEXICAL_EVIDENCE'] = 'THEORY_DERIVED_LEXICAL_EVIDENCE'
    status: EpistemicStatus = 'INFERRED'

class CorpusMetrics(BaseModel):
    documents: int
    sentences: int
    tokens: int
    unique_tokens: int
    lexical_diversity: float
    entity_candidates: int
    claims: int

class CooccurrenceEdge(BaseModel):
    source_entity_id: str
    target_entity_id: str
    shared_claims: int
    shared_documents: int

class BoundaryObservables(BaseModel):
    from_actor: str
    to_actor: str
    object_id: str | None = None
    reciprocity: float | None = None
    asymmetry: float | None = None
    persistence: float | None = None
    evidence_count: int = 0
    interpretation_status: EpistemicStatus = 'UNRESOLVED'

class AnalyzeResult(BaseModel):
    documents: list[Document]
    evidence: list[Evidence]
    claims: list[Claim]
    entities: list[EntityCandidate]
    semantic_evidence: list[LexicalEvidence]
    cooccurrence: list[CooccurrenceEdge]
    metrics: CorpusMetrics
    warnings: list[str] = Field(default_factory=list)

class StrategicActor(BaseModel):
    actor_id: str
    position: float = Field(ge=0, le=100)
    capacity: float = Field(gt=0)
    salience: float = Field(gt=0, le=1)
    rigidity: float | None = Field(default=None, ge=0, le=1)
    alpha: float | None = Field(default=None, gt=0)
    uncertainty: float | None = Field(default=None, ge=0)

class StrategicModelInput(BaseModel):
    axis_label: str
    actors: list[StrategicActor]

class StrategicActorResult(BaseModel):
    actor_id: str
    normalized_capacity: float
    mobilized_capacity: float

class PairResult(BaseModel):
    actor_i: str
    actor_j: str
    distance: float
    dominance_index_i_over_j: float | None
    strategic_center: float | None

class StrategicModelResult(BaseModel):
    axis_label: str
    actors: list[StrategicActorResult]
    system_center: float | None
    concentration: float | None
    pairs: list[PairResult]
    warnings: list[str] = Field(default_factory=list)

class GameInput(BaseModel):
    players: list[str]
    actions: dict[str,list[str]]
    payoffs: dict[str,dict[str,float]]

class NashProfile(BaseModel):
    profile: dict[str,str]
    payoffs: dict[str,float]

class GameResult(BaseModel):
    equilibria: list[NashProfile]
    valid: bool
    warnings: list[str] = Field(default_factory=list)
