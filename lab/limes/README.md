# Limes v0.54 · Semantic Hierarchy & Agency Resolution

Limes v0.54 conserva el núcleo formal v0.40 y la arquitectura cualitativa de v0.53, pero corrige el cuello de botella semántico: la teoría de juegos sólo recibe estructuras después de pasar por gates de agencia, atribución y composición jerárquica.

## Arquitectura conceptual

```text
Texto
→ lenguaje / entidades
→ frames y roles semánticos
→ actos / episodios
→ programas y contra-programas
→ subgames sustentados
→ mediación estratégica
→ extrapolación cualitativa
→ cuantificación selectiva
→ Limes Core cuando procede
```

## Gates antes de teoría de juegos

1. **Agencia válida.** Un lugar, ley, objeto, marcador discursivo o sintagma no agente no puede entrar automáticamente como actor estratégico.
2. **Atribución.** Se distinguen entidad mencionada, sujeto, hablante, destinatario, paciente y agente de una pasiva.
3. **Composición jerárquica.** Los actos se agrupan en programas y contra-programas; no se equipara cada frame a un programa.
4. **Frontera pertinente.** Sólo relaciones entre actores operativos y vinculadas a una transformación pueden presentarse como fronteras Limes.
5. **Gate estratégico.** Un juego canónico global no se determina si la integridad semántica es insuficiente o si el texto contiene varios subgames.

## Integridad teórica

Se preservan:

- `R = S × E`;
- `X = R × D × φ`;
- `ΔH = (G_e − H) × X`;
- `UNRESOLVED` como salida válida;
- ausencia de sustitución numérica de variables desconocidas;
- separación `source / actionTarget / stateTarget`;
- acciones materiales/institucionales fuera de `D` automática;
- teoría de juegos como mediación analítica, no como herramienta de medición;
- cuantificación sólo de componentes sustentados.

## Generalización y fixtures

Los casos usados para regresión permanecen en `tests/`. El código de producción no contiene nombres propios, identificadores de episodios ni atajos léxicos exclusivos de esos casos. Además existe `tests/test-generalization.js`, que falla si esos anclajes reaparecen en `js/` o `index.html` y prueba textos nuevos no usados como fixtures originales.

Los vocabularios lingüísticos generales —verbos, roles, términos regulatorios, jurídicos, narrativos o de movilidad— sí permanecen cuando son categorías de lengua/dominio y no datos nominales de un caso.

## Interfaz

La salida principal mantiene:

1. análisis cualitativo;
2. mediación estratégica y extrapolación;
3. cuantificación selectiva cuando procede.

Frames, episodios y candidatos de juegos quedan en trazabilidad técnica. Si no existen magnitudes numéricas sustentadas, la interfaz no enumera filas vacías ni traslada al usuario la obligación de inventar parámetros.

## Límite

Las pruebas incluidas verifican código, regresiones, generalización, integridad y rutas HTTP locales. No equivalen a una validación empírica del modelo ni a una prueba del despliegue real en Safari o en el servidor público.
