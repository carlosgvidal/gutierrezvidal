# gutierrezvidal v3.4 — creación y edición de páginas publicadas

## Crear una página nueva

El editor comprueba primero si la ruta ya existe. Si existe, bloquea la creación y pide usar el modo de edición.

## Editar una página publicada

1. Abre `/editor/content.html`.
2. Selecciona **Editar página publicada**.
3. Elige una página de la navegación.
4. Pulsa **Cargar página**.
5. Modifica título, descripción, fecha o cuerpo.
6. Guarda los cambios.

La ruta del archivo permanece bloqueada para evitar mover o duplicar páginas por accidente.

Si cambia el título, también se actualiza la etiqueta correspondiente en `src/data/navigation.json`.

## Limitación estructural

Sólo se cargan automáticamente páginas que conserven esta estructura:

- `.page-title`
- `.page-deck`
- `article.prose`

Las páginas que no tengan esa estructura no se sobrescriben y muestran un error.

## Corrección v3.6

Esta versión fue reconstruida sobre v3.4 después de auditar v3.5. Conserva intacto el sitio público y añade el CMS corregido: explorador, portada, texto enriquecido e imágenes en `public/images/`. La edición de páginas publicadas modifica el documento existente en lugar de reemplazarlo por una plantilla.

Consulta `AUDITORIA-v3.4-v3.5-v3.6.txt` para el detalle técnico.
