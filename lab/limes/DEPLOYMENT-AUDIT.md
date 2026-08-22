# Auditoría de despliegue

El repositorio publica el dominio mediante GitHub Pages. GitHub Pages sirve archivos estáticos y no ejecuta Python del lado servidor. La arquitectura 0.1.2 exigía un proceso FastAPI/Uvicorn y por ello no podía operar mediante carga directa del paquete al repositorio.

0.1.3 elimina esa incompatibilidad: HTML, CSS y JavaScript contienen el runtime necesario para análisis local en navegador.
