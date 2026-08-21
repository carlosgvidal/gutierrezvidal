# Despliegue v0.53

Sustituya la carpeta completa de Limes preservando la estructura relativa. No copie únicamente `index.html`.

```text
index.html
assets/
js/
data/
```

La versión no requiere backend. `index.html` carga módulos JS y recursos lingüísticos mediante rutas relativas.

Comprobar tras el despliegue:

- `assets/app.css`
- `js/app.js`
- `js/synthesis-engine.js`
- `js/limes-core.js`
- `data/lexicon/es_MX.dic`
- `data/lexicon/es_MX.aff`

La validación incluida comprueba sintaxis, regresiones, arquitectura y rutas HTTP locales. No sustituye una prueba del despliegue real en Safari/gutierrezvidal.com.
