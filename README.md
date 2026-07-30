# gutierrezvidal v1.5 — sitio estático

## Cambios

- Se eliminó el CMS y toda conexión de escritura con GitHub.
- Header compacto con logo, nombre y menú de hamburguesa.
- Menú jerárquico y expansible desde `src/data/navigation.json`.
- Navegación con páginas individuales para libros y proyectos sonoros.
- Corrección del visor panorámico:
  - FOV reducido;
  - zoom desactivado;
  - dimensiones tomadas del contenedor;
  - `ResizeObserver`;
  - hotspots posicionados dentro del visor.
- Eliminado el nombre y el lema sobre la fotografía.
- Sección de fragmentos críticos después del panorama.
- Footer compacto con copyright.
- Logo nuevo en variantes negra y blanca.
- Sitio completamente estático.

## Actualizar el menú

Editar:

```text
src/data/navigation.json
```

## Añadir una obra

1. Crear la página dentro de:
   - `obra/escritura/`
   - `obra/sonido/`
2. Añadir el enlace en `src/data/navigation.json`.
3. Añadir la tarjeta correspondiente en `escritura.html` o `sonido.html`.
