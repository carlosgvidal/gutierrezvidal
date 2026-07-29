# gutierrezvidal v1.2

## Header y footer compartidos

Todas las páginas interiores cargan el mismo header y footer desde:

```text
src/js/shared-shell.js
```

El logo se carga desde:

```text
public/assets/logo-mark.png
```

El estilo común se encuentra en:

```text
src/css/editorial.css
```

## Plantillas nuevas

```text
plantilla-entrada-blog.html
plantilla-subpagina.html
templates/entrada-blog.html
templates/subpagina.html
```

Para crear una página nueva:

1. Duplica la plantilla.
2. Renombra el archivo.
3. Cambia título, metadatos y contenido.
4. Ajusta `data-page` en el `<body>` para marcar la sección activa.

## Navegación

La navegación compartida se edita una sola vez en:

```text
src/js/shared-shell.js
```
