# LIMES · Canonical 0.1.3

Ejecución estática para despliegue directo en GitHub Pages.

## Runtime

El análisis se ejecuta dentro del navegador. No requiere Python, FastAPI, Uvicorn, proxy ni API de servidor.

`static/engine.js` implementa la misma capa funcional que en 0.1.2 estaba distribuida entre `analyze.py`, `linguistics.py`, `ingest.py` y `strategy.py`. El cambio 0.1.3 es de runtime y despliegue; no modifica la ontología ni añade reglas de análisis.

## Entrada

Texto directo, TXT, MD, CSV, JSON, XLSX y XLSM. Los libros XLSX/XLSM se procesan en el navegador mediante SheetJS CE 0.20.3 cargado desde su CDN oficial.

## Despliegue

El contenido del directorio puede colocarse directamente en `lab/limes/`. La interfaz queda disponible tanto en `lab/limes/` como en `lab/limes/static/index.html`.
