# Limes v0.35-refinement-1

Primera etapa de refinamiento conceptual construida sobre v0.34-refactor. Mantiene la arquitectura modular y modifica de forma controlada dos fundamentos: la definición de posición estratégica `x` y el cálculo de amenaza.

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

## Cambios de v0.35

- `x` ya no se deriva de positividad/negatividad léxica. Se estima inicialmente como geometría relacional entre actores: cooperación aproxima; conflicto y control separan; otras relaciones generan distancias intermedias.
- Se incorpora `v` (valencia discursiva), en escala `-1..+1`, para conservar la información léxica sin confundirla con posición estratégica. En esta etapa `v` es descriptiva y no empuja directamente la dinámica de `x`.
- El eje 0–100 deja de etiquetarse como tradición–innovación y pasa a ser un eje relacional sin semántica ideológica fija.
- La amenaza compara el desafío contra un statu quo sistémico estimado en el centro estratégico vigente, en lugar de comparar contra el punto ideal propio (que hacía imposible una utilidad esperada positiva de desafío).
- Se normalizan explícitamente las probabilidades de prevalecer del par antes de calcular utilidad esperada de desafío.
- Se añadieron pruebas automáticas para separación `x/v`, geometría relacional y activación no degenerada de amenazas.

## Límites deliberados

Esta versión todavía conserva la normalización composicional de Ser/Estar/Decir/Hacer y las heurísticas vigentes para `c`, `s`, `r`, `ρ` y `σ`. Esos componentes quedan fuera de esta primera etapa para poder atribuir los cambios observados a `x`, `v` y amenazas.
