# Despliegue v0.52.1

Reemplace la carpeta completa de Limes, preservando la estructura relativa:

- `index.html`
- `assets/`
- `js/`
- `data/`

No copie únicamente `index.html`.

La rama no requiere un backend: los módulos y el diccionario se cargan mediante rutas relativas.

Después del despliegue, comprobar en la consola/red del navegador que cargan con HTTP 200:

- `assets/app.css`
- `js/app.js`
- `js/limes-core.js`
- `data/lexicon/es_MX.dic`
- `data/lexicon/es_MX.aff`

La validación incluida en el paquete cubre sintaxis, regresiones y rutas locales; no sustituye una prueba del servidor real/Safari.
