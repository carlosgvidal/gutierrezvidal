# Validación — Limes v0.54 · Semantic Hierarchy & Agency Resolution

## Alcance

Validación local de sintaxis, regresiones, aislamiento de fixtures, generalización fuera de los ejemplos, integridad teórica, jerarquía semiótica, mediación estratégica, cuantificación selectiva y estructura de despliegue.

## Resultados ejecutados

- JavaScript `node --check`: **PASS** para todos los módulos y suites.
- Suite heredada `tests/test-v053.js`: **41/41 PASS**.
- Suite v0.54 `tests/test-v054.js`: **46/46 PASS**.
- Suite de generalización `tests/test-generalization.js`: **5/5 PASS**.
- Anclajes nominales/específicos de fixtures en producción: **0**.
- `expected utility`, `function utility` y `normalizeStates` en producción: **0**.
- Catálogo de juegos: **76 plantillas**.
- JavaScript inline monolítico: **0 bloques**.
- Formulario fuente sin presets analíticos: **PASS**.

## Rutas HTTP locales

Servidor estático local verificado:

- `/` → 200
- `/index.html` → 200
- `/assets/app.css` → 200
- `/js/app.js` → 200
- `/js/synthesis-engine.js` → 200
- `/js/limes-core.js` → 200
- `/data/lexicon/es_MX.dic` → 200
- `/data/lexicon/es_MX.aff` → 200

## Gates semánticos comprobados

1. Falsos nombres derivados de formas verbales o marcadores discursivos no entran como actores.
2. Objetos no agentes no entran como colectivos estratégicos.
3. Hablante, sujeto, destinatario y paciente se distinguen en atribuciones probadas.
4. Contenido de solicitudes/propuestas queda como contenido propuesto, no como `HACER` realizado.
5. Regulación se sintetiza en programas jerárquicos, no un programa por acto.
6. Narrativa separa abandono, captura, orientación, liberación, adquisición de recursos y retorno sin depender de objetos específicos del fixture.
7. Múltiples subgames bloquean una determinación canónica global.
8. Fronteras sólo conectan actores operativos.
9. La mediación estratégica no asigna `S/E/H/D/φ/G_e`.
10. La cuantificación permanece selectiva y no enumera parámetros vacíos cuando no hay cálculo.

## Gate de generalización

La suite adicional usa actores y textos nuevos no utilizados como fixtures originales:

- regulación municipal con actores nuevos;
- narrativa con personajes nuevos;
- movilidad institucional con organización y sigla nuevas;
- investigación judicial con nombres nuevos.

Todos pasan sin recurrir a nombres o shortcuts de los ejemplos originales.

## Limitación

Estas pruebas verifican comportamiento del código, no validación empírica del modelo. Se ejecutaron con Node, análisis estático y servidor HTTP local; no constituyen una prueba del despliegue real en Safari ni en el servidor público.
