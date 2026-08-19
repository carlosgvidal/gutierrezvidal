# Limes v0.34-refactor

Refactor arquitectónico de Limes v0.33. Esta versión separa la aplicación monolítica en archivos por responsabilidad sin introducir frameworks ni dependencias externas y procura conservar el comportamiento de v0.33.

## Estructura

- `index.html`: interfaz y carga ordenada de componentes.
- `css/limes.css`: presentación visual.
- `js/config/lexicons.js`: léxicos, diccionarios y estado compartido.
- `js/text/normalize.js`: normalización, tokenización y utilidades textuales.
- `js/text/relations.js`: extracción y perfilado de relaciones.
- `js/text/actors.js`: detección de actores e inferencia inicial de variables.
- `js/model/dynamics.js`: normalización de actores, utilidad, interacciones y dinámica.
- `js/model/montecarlo.js`: generador reproducible y Monte Carlo.
- `js/model/engine.js`: ensamblaje de resultados de simulación.
- `js/interpretation/recommendations.js`: resumen ejecutivo y recomendaciones causales.
- `js/ui/analysis-view.js`: análisis textual y transferencia a simulación.
- `js/ui/simulation-view.js`: renderizado de simulación y gráfico.
- `js/ui/report.js`: generación del informe.
- `js/tests/self-tests.js`: validaciones automáticas heredadas.
- `js/app.js`: eventos e inicialización.
- `archive/Limes_v0_33.html`: fuente monolítica original, preservada como referencia.

## Uso

Abra `index.html` en un navegador moderno. No requiere instalación ni servidor.

## Criterio de esta versión

La v0.34-refactor es deliberadamente conservadora: reorganiza el código antes de modificar las hipótesis del modelo. Las revisiones conceptuales de `x`, Ser/Estar/Decir/Hacer, incertidumbre y trazabilidad de inferencias quedan preparadas para una siguiente iteración.
