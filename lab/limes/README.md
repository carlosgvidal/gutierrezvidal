# Limes v0.52.1 · Integrity Recovery

Rama de saneamiento construida después de la auditoría integral de v0.52 y cotejada contra el núcleo teórico v0.40.

## Objetivo

Restaurar primero las condiciones de validez del modelo antes de añadir más capacidad semántica.

## Principios restaurados

- `R = S × E`
- `X = R × D × φ`
- `ΔH = (G_e − H) × X`
- Ninguna entrada desconocida se sustituye por `0.5`.
- Si falta `S`, `E`, `H`, `D`, `φ` o `G_e`, no se calcula.
- `source` y `target` deben coincidir con los actores suministrados al núcleo.
- Un frame no resuelto queda `UNRESOLVED`, no `HACER`.
- Una acción material/institucional no se convierte automáticamente en `D` comunicativa.
- `Gτ` no se asigna automáticamente ni entra en la ecuación del evento.

## Correcciones de integridad

1. Eliminados del código de producción los nombres y fallbacks específicos de los fixtures de prueba.
2. Añadido gate de procedencia: actores de frames/operaciones se toman de entidades detectadas en el texto o de actores analíticos genéricos explícitos.
3. Desambiguación conservadora de `detener`:
   - `se detuvieron a/para + infinitivo` → pausa/movimiento;
   - detención jurídica requiere estructura transitiva/contexto institucional.
4. NER filtra verbos finitos y conectores al inicio de candidatos PERSON.
5. Añadidos frames anidados para construcciones como `rechazó el límite impuesto por ...`.
6. Memoria discursiva conservadora para verbos de atribución con sujeto elíptico.
7. Dominio inferido por acumulación comparativa de evidencia; un solo trigger no decide automáticamente.
8. Coreferencia acotada por firma semántica y proximidad; se retiraron claves específicas de casos.
9. Juegos: todos los `requires` son requisitos duros. El dominio ya no inyecta features estratégicas.
10. S/E/H/D/φ/G_e automáticos eliminados. El escenario se carga con campos numéricos vacíos.
11. `Gτ` vacío permanece `null`; se eliminó la conversión `"" → 0`.
12. El diccionario es_MX participa al menos en el filtro morfológico/NER; la aplicación integral de afijos queda como trabajo posterior.

## Límite teórico deliberado

v0.40 define `D` como movilización comunicativa. Por eso v0.52.1 conserva acciones materiales e institucionales como observaciones, pero no las introduce automáticamente en el núcleo. La generalización `Decir → Operación` queda pendiente de decisión teórica explícita.

## Estructura

```text
index.html
assets/app.css
js/
  limes-core.js
  spanish-semantics.js
  entity-engine.js
  semantic-engine.js
  event-engine.js
  game-ontology.js
  game-engine.js
  analysis-engine.js
  app.js
data/lexicon/
tests/
```

## Estado

Esta rama prioriza integridad sobre automatización. Un análisis puede quedar preliminar o sin operaciones calculables; eso es un resultado válido cuando la evidencia no permite parametrizar el modelo.
