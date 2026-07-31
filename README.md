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


## Editor v3.5

- Explorador jerárquico del sitio, con la portada como primer nodo.
- Editor específico de `index.html` que conserva el panorama, hotspots y scripts.
- Editor enriquecido para negritas, cursivas, versalitas, enlaces, encabezados, citas y listas.
- Inserción de imágenes con texto alternativo y pie opcional.
- Todas las imágenes nuevas se guardan por defecto en `public/images/`.
- El ZIP de actualización incluye únicamente HTML, JSON, XML e imágenes modificados.
