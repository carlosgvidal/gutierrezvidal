# gutierrezvidal v3.0 — editor local para iPad

## Funcionamiento

1. Publica esta versión del sitio.
2. Abre `/editor/` en Safari desde el iPad.
3. Selecciona el ZIP completo de la versión actual.
4. Elige:
   - Página principal
   - Subpágina
   - Entrada de blog
5. Captura título, slug, descripción SEO y contenido.
6. Decide si debe añadirse al menú y al índice de su sección.
7. Pulsa **Generar ZIP actualizado**.

El editor procesa el ZIP dentro del navegador. No utiliza GitHub, tokens, contraseñas ni base de datos.

## Actualizaciones automáticas

- Crea la página HTML.
- Añade metadatos SEO, Open Graph y JSON-LD.
- Actualiza `src/data/navigation.json` si se solicita.
- Añade una tarjeta al índice de la sección si se solicita.
- Actualiza `sitemap.xml`.
- Descarga un ZIP completo actualizado.

## Dependencia

La compresión usa JSZip desde jsDelivr. El editor necesita conexión al abrirse, pero el ZIP y el contenido no se envían a un servidor.
