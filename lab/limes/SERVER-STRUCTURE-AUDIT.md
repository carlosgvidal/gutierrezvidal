# Auditoría de estructura previa al cambio

## Lo que pudo verificarse

El punto público histórico usado para Limes es `/lab/limes/index.html`. No hay un listado público de directorio disponible para inventariar de forma fiable todos los ficheros del servidor.

La distribución v0.51 utilizada como base contiene en su raíz:

```text
index.html
semantic-engine.js
README.md
test-v051.js
```

Aunque v0.51 ya separaba `semantic-engine.js`, la mayor parte de la lógica restante seguía incrustada dentro de `index.html`. Por eso la v0.52 no conserva esa distribución plana como arquitectura de trabajo.

## Estructura elegida para v0.52

Se conserva `index.html` en la raíz para no cambiar el punto de entrada del servidor, pero todo el código, estilos y datos pasan a subdirectorios con rutas relativas.

No se requiere reescritura de URL ni backend nuevo.

## Observación sobre verificación pública

El punto de entrada público puede estar sujeto a caché/indexación externa. Por eso la auditoría no presupone que el contenido recuperado por un crawler represente exactamente la versión que muestra el navegador. La estructura de v0.52 se diseña para desplegarse completa y evitar dependencias implícitas en un HTML monolítico.
