# gutierrezvidal v3.3 — actualizaciones parciales

## No requiere importar el sitio

El editor lee directamente del sitio publicado:

- `src/data/navigation.json`
- `src/data/hotspots.json`
- `sitemap.xml`
- el índice de la sección que corresponda

Al crear una página o editar hotspots, conserva localmente sólo los archivos nuevos o modificados.

## Exportación

Desde `/editor/`, el botón **Descargar actualización ZIP** genera un ZIP pequeño para copiar sobre la raíz del sitio existente.

El ZIP no contiene el sitio completo y no reemplaza archivos que no hayan cambiado.

## Archivos posibles

- Página HTML nueva
- `src/data/navigation.json`
- Índice de la sección correspondiente
- `src/data/hotspots.json`
- `sitemap.xml`
