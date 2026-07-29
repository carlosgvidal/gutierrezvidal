# gutierrezvidal v1.4

## Corrección de publicación

Esta versión funciona con cualquiera de estas configuraciones de GitHub Pages:

1. **GitHub Actions**: publica `dist/`.
2. **Deploy from a branch / main / root**: la raíz contiene la misma versión generada.

El comando:

```bash
node tools/build.mjs
```

genera `dist/` y sincroniza el resultado público con la raíz del repositorio.

## CMS

Dirección publicada:

```text
https://carlosgvidal.github.io/gutierrezvidal/admin.html
```

Valores predeterminados:

```text
Usuario: carlosgvidal
Repositorio: gutierrezvidal
Rama: main
```

## Archivos corregidos

- `tools/build.mjs`
- `.github/workflows/deploy.yml`
- `admin/index.html`
- `content/site.json`
- `.nojekyll`
