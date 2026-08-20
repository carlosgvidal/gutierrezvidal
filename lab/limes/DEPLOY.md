# Despliegue de Limes v0.52

La carpeta debe desplegarse completa. No copie sólo `index.html`.

Si el punto de montaje se mantiene en `/lab/limes/`, la estructura esperada es:

```text
/lab/limes/
  index.html
  assets/
    app.css
  js/
    limes-core.js
    spanish-semantics.js
    entity-engine.js
    semantic-engine.js
    event-engine.js
    game-ontology.js
    game-engine.js
    analysis-engine.js
    app.js
  data/
    lexicon/
      es_MX.dic
      es_MX.aff
      LICENSE.md
  tests/        # puede mantenerse en servidor o excluirse en producción
  README.md     # opcional en producción
```

## Requisitos del servidor

Debe servir correctamente:

- `.js` como JavaScript;
- `.css` como CSS;
- `.dic`, `.aff` y `.md` como texto o `application/octet-stream` accesible mediante `fetch` de mismo origen.

`spanish-semantics.js` carga el diccionario desde rutas relativas `data/lexicon/es_MX.dic` y `data/lexicon/es_MX.aff`. Si esas rutas no existen, el analizador sigue cargando pero reporta que el recurso léxico no está disponible.

## Caché

Al sustituir una versión previa, conviene invalidar caché del directorio o cambiar los encabezados de caché para `index.html` y `js/*.js`. La versión ya no depende de un solo HTML, por lo que una mezcla de `index.html` nuevo con módulos JS antiguos puede producir resultados incoherentes.
