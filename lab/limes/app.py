from __future__ import annotations
import io, json, zipfile
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from limes.models import Document, StrategicModelInput, GameInput
from limes.ingest import ingest_bytes
from limes.analyze import analyze_documents
from limes.strategy import run_strategy, pure_nash

ROOT=Path(__file__).resolve().parent
STATIC=ROOT/'static'
app=FastAPI(title='LIMES',version='0.1.0')
app.mount('/static',StaticFiles(directory=STATIC),name='static')

class TextRequest(BaseModel):
    text:str
    title:str|None=None

@app.get('/')
def root():
    return FileResponse(STATIC/'index.html')

@app.get('/api/health')
def health():
    return {'status':'ok','version':'0.1.0'}

@app.post('/api/analyze/text')
def analyze_text(req:TextRequest):
    if not req.text.strip(): raise HTTPException(400,'El texto está vacío.')
    doc=Document(document_id='doc-1',text=req.text,title=req.title)
    return analyze_documents([doc]).model_dump()

@app.post('/api/analyze/file')
async def analyze_file(file:UploadFile=File(...)):
    data=await file.read()
    try:
        docs=ingest_bytes(file.filename or '',data)
    except Exception as e:
        raise HTTPException(400,str(e))
    if not docs: raise HTTPException(400,'No se obtuvieron documentos analizables del archivo.')
    return analyze_documents(docs).model_dump()

@app.post('/api/strategy')
def strategy(inp:StrategicModelInput):
    if len(inp.actors)<2: raise HTTPException(400,'El modelo estratégico requiere al menos dos actores.')
    return run_strategy(inp).model_dump()

@app.post('/api/game/nash')
def nash(inp:GameInput):
    return pure_nash(inp).model_dump()
