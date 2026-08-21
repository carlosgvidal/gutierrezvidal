# Validación — Limes v0.53

## Alcance

Validación local de sintaxis, regresiones, integridad teórica, síntesis cualitativa, mediación estratégica, cuantificación parcial y estructura de despliegue.

## Resultados

- JavaScript `node --check`: **PASS** para todos los módulos y la suite.
- Suite `tests/test-v053.js`: **41/41 PASS**.
- Nombres específicos de fixtures en `js/`: **0**.
- Mecánicas descartadas de la monolítica (`expected utility`, `normalizeStates`, probabilidad de victoria, etc.) en producción: **0**.
- Catálogo de juegos: **76 plantillas**.
- Formulario fuente sin presets: **PASS**.
- JavaScript inline monolítico: **0 bloques**.
- Rutas HTTP locales:
  - `index.html`: 200
  - `assets/app.css`: 200
  - `js/app.js`: 200
  - `js/synthesis-engine.js`: 200
  - `data/lexicon/es_MX.dic`: 200

## Gates específicos añadidos

1. El análisis cualitativo existe aun cuando no existe ningún valor numérico.
2. Semiótica se construye antes de la mediación estratégica.
3. Teoría de juegos no asigna `S/E/H/D/φ/G_e`.
4. Extrapolación cualitativa sólo aparece cuando existe estructura interpretable suficiente.
5. `partialInteraction()` calcula sólo componentes disponibles y devuelve faltantes sin sustituirlos.
6. `de acuerdo con` no se interpreta como acuerdo estratégico.
7. Una nota judicial completa se reconoce como interacción de información, sin declarar automáticamente `Screening Game`.
8. Una narrativa breve atribuye una contraacción a su actor real y distingue captura, respuesta y retorno.
9. `Alternating-Offers Bargaining` no es elegible sin evidencia explícita de alternancia.
10. La interfaz principal presenta análisis cualitativo; frames/episodios/juegos candidatos quedan en trazabilidad colapsada.

## Limitación de esta validación

Estas pruebas se ejecutaron con Node, análisis estático y servidor HTTP local. No constituyen una prueba del despliegue real en Safari ni en `gutierrezvidal.com`.
