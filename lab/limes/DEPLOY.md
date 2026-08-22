# Despliegue v0.54

Sustituir la carpeta completa de Limes preservando la estructura relativa. No copiar únicamente `index.html`.

```text
index.html
assets/
js/
data/
tests/
```

La versión no requiere backend. `index.html` carga módulos JS y recursos lingüísticos mediante rutas relativas.

Comprobar tras el despliegue:

- `assets/app.css`
- `js/app.js`
- `js/synthesis-engine.js`
- `js/limes-core.js`
- `data/lexicon/es_MX.dic`
- `data/lexicon/es_MX.aff`

Las pruebas locales incluidas no sustituyen una comprobación del despliegue real en Safari/servidor.
