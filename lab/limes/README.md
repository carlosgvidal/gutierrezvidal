# Limes v0.53 · Qualitative Synthesis & Strategic Mediation

Esta versión integra los elementos recuperables de la versión monolítica v0.33 sin reincorporar su matemática de expected utility, posición estratégica, saliencia, rigidez, riesgo, coaliciones automáticas o normalización Ser/Estar/Decir/Hacer.

## Arquitectura conceptual

```text
Texto
→ interpretación semiótica
→ mediación estratégica por teoría de juegos
→ extrapolación cualitativa
→ cuantificación selectiva
→ Limes Core cuando procede
```

La semiótica es el análisis primario. La teoría de juegos funciona como lente analítica sobre estructuras ya interpretadas y no como herramienta de medición. La cuantificación no condiciona la existencia ni la validez del análisis cualitativo.

## Recuperado de v0.33

Se recuperaron, reescritos sobre la arquitectura actual:

- síntesis cualitativa antes del cálculo;
- lectura de actores y relaciones;
- oposiciones como componente semiótico;
- dimensión estratégica legible para el usuario;
- separación entre resultado principal y anexo técnico;
- expresión explícita de límites/incertidumbre.

No se recuperaron:

- `x`, `c`, `s`, `r`, `ρ`, `σ`;
- expected utility;
- probabilidad de victoria;
- amenazas/coaliciones automáticas;
- Monte Carlo como validación empírica;
- normalización Ser+Estar+Decir+Hacer=1;
- transiciones heurísticas de Ser/Estar/Decir/Hacer.

## Conservado de v0.52.1 / v0.40

- `R = S × E`;
- `X = R × D × φ`;
- `ΔH = (G_e − H) × X`;
- `UNRESOLVED` como salida válida;
- no sustitución de datos desconocidos;
- separación `source / actionTarget / stateTarget`;
- acciones materiales/institucionales fuera de `D` automática;
- modularidad;
- diccionario es_MX;
- catálogo declarativo de 76 juegos;
- requisitos duros para identificación canónica;
- fixtures únicamente en `tests/`.

## Nuevo módulo: `synthesis-engine.js`

Produce internamente:

- perfiles funcionales Ser/Estar/Decir/Hacer por actor;
- objetos de valor / objetos en disputa;
- oposiciones contextuales;
- programas y contra-programas;
- fronteras cualitativas source→target;
- transformaciones observadas;
- mediación estratégica;
- escenarios cualitativos extrapolables y sus límites;
- evaluación de qué variables Limes son interpretables y cuáles no tienen valor numérico identificable.

## Cuantificación selectiva

El núcleo incorpora `partialInteraction()` para calcular únicamente componentes efectivamente disponibles:

- `R` si existen `S` y `E`;
- `X` si además existen `D` y `φ`;
- `gap` si existen `G_e` y `H`;
- `ΔH` sólo cuando existen ambos bloques.

Una trayectoria secuencial completa sólo se construye si todas las operaciones necesarias están completas. No se fabrican parámetros para completar una ecuación.

## Interfaz

La vista principal muestra:

1. análisis cualitativo;
2. mediación estratégica y extrapolación;
3. estado de cuantificación.

Frames, episodios, candidatos de juegos y concordancia quedan en **Trazabilidad técnica**, colapsada por defecto. La parametrización numérica también queda en una sección opcional.

## Mejoras lingüísticas adicionales

- aliases institucionales y siglas entre paréntesis;
- fusión de denominaciones institucionales cortas/largas;
- índices temporales de frames para coreferencia;
- stems narrativos corregidos para abandono, captura, contraacción, orientación y retorno;
- nombres propios simples cuando funcionan sintácticamente como sujeto;
- atribuciones de alegación (`atribuir`, `señalar como probable`) diferenciadas;
- `de acuerdo con` ya no cuenta como acuerdo estratégico;
- identificación canónica de juegos más estricta.

## Límite teórico preservado

v0.40 define `D` como movilización comunicativa. Las acciones materiales e institucionales se analizan cualitativamente, pero no entran automáticamente a `X` hasta que exista una decisión teórica explícita sobre una posible generalización de `Decir` a una categoría más amplia de operación/intercambio.
