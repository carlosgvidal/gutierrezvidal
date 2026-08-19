# Registro de cambios

## v0.35-refinement-1

Primera etapa de refinamiento conceptual sobre v0.34-refactor.

### Posición estratégica y valencia

- `x` deja de ser una transformación de positividad/negatividad léxica.
- `x` se estima inicialmente mediante geometría relacional: cooperación aproxima; conflicto y control separan; comunicación y transformación producen distancias intermedias.
- Se incorpora `v`, valencia discursiva en escala -1 a +1.
- `v` se mantiene descriptiva en esta etapa y no interviene directamente en la dinámica de `x`.
- La interfaz muestra la confianza de la inferencia de `x` y la evidencia léxica de `v` en el análisis textual.
- El eje gráfico deja de etiquetarse como tradición/innovación y adopta polos relacionales A/B sin semántica ideológica fija.

### Amenazas

- El statu quo deja de ser el punto ideal propio del actor, que otorgaba utilidad 1 por definición y hacía degenerar la utilidad esperada del desafío.
- El statu quo se evalúa ahora en el centro estratégico agregado vigente del sistema.
- Las probabilidades de prevalecer del par se normalizan antes de calcular la utilidad esperada del desafío.
- La amenaza sólo se activa cuando la utilidad esperada neta del desafío supera la utilidad del statu quo sistémico.

### Validación

Se añadieron pruebas para:

- independencia conceptual entre `x` y `v`;
- separación espacial ante conflicto;
- activación no degenerada de amenaza;
- conservación de reproducibilidad Monte Carlo.

### Fuera de alcance de esta etapa

Se conservan sin redefinir la normalización de Ser/Estar/Decir/Hacer y las heurísticas de `c`, `s`, `r`, `ρ` y `σ`.


## v0.36-semantic-integrity
- `issue` explícito antes de simulación estratégica.
- `x = null` cuando no existe evidencia suficiente; 50 deja de representar desconocimiento.
- Detección de actores endurecida: mayúsculas iniciales aisladas no bastan, se separan coordinaciones y se filtran conectores/exclamaciones frecuentes.
- Simulación exige al menos dos actores con `x` conocido.
- Informe distingue robustez numérica de confianza epistemológica y evita recomendar coaliciones frente a amenazas inexistentes.
- Nuevas pruebas de integridad semántica.
