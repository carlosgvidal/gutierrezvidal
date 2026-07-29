# gutierrezvidal v0.7

## Editor visual de hotspots

1. Abre una terminal en la carpeta del proyecto.
2. Ejecuta:

```bash
npm run editor
```

3. Abre:

```text
http://127.0.0.1:4321/editor/
```

4. Arrastra las etiquetas sobre la fotografía.
5. Pulsa **Guardar**.

El editor actualizará directamente:

```text
src/data/hotspots.json
```

La portada puede revisarse en:

```text
http://127.0.0.1:4321/index.html
```

## Alternativa sin servidor de escritura

El botón **Descargar JSON** genera un archivo `hotspots.json`. Puede copiarse manualmente a:

```text
src/data/hotspots.json
```

## Pruebas

```bash
npm test
```


## v0.8

- Campo de visión inicial ampliado para evitar el close-up.
- Zoom desactivado para impedir acercamientos accidentales.
- Editor simple sin terminal: abrir `editor-simple.html`, arrastrar y descargar `hotspots.json`.
