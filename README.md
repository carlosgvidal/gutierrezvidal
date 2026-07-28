# gutierrezvidal v0.5

## Cambios

- Hotspots posicionados mediante coordenadas directas sobre la imagen.
- La vista inicial apunta al centro exacto del panorama.
- Se mantiene intacto el renderizado sin aclarado de la fotografía.
- Se conserva la estructura del proyecto.

## Coordenadas

Las posiciones se editan en:

`src/data/hotspots.json`

Cada enlace usa:

- `imageX`: coordenada horizontal sobre la imagen de 1774 px.
- `imageY`: coordenada vertical sobre la imagen de 887 px.

## Pruebas

```bash
npm test
```
