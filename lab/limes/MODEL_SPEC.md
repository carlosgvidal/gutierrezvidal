# Especificación operacional v0.40

## Variable dependiente

`deltaH`: cambio esperado del Hacer del receptor en una operación comunicativa.

## Entradas mínimas por actor

- `S` ∈ [0,1]: estado de Ser relevante para la cuestión.
- `E` ∈ [0,1]: estado de Estar relevante para la cuestión.
- `H` ∈ [0,1]: comportamiento/posición observable actual respecto de la cuestión.

## Entradas mínimas por operación

- `source`: actor emisor.
- `target`: actor receptor.
- `D` ∈ [0,1]: fracción de recursos movilizada comunicativamente.
- `phi` ∈ [0,1]: porosidad efectiva de la frontera source→target.
- `G` ∈ [0,1]: Hacer buscado por el emisor en el receptor.

## Variables derivadas

- `R = S × E`
- `X = R × D × phi`
- `gap = G - H_target`
- `deltaH = gap × X`
- `H_after = H_target + deltaH`

## Reglas de seguridad epistemológica

1. Ninguna entrada desconocida se sustituye por 0.5.
2. Si falta S, E, H, D, phi o G, la operación no se simula.
3. Los valores inferidos de texto deberán conservar evidencia y confianza.
4. Robustez numérica y validez semántica son propiedades distintas.
5. La ausencia de movimiento no equivale a ausencia de información: puede resultar de redundancia, impermeabilidad, falta de recursos o ausencia de brecha conductual.
6. Una predicción siempre está condicionada a una `issue` explícita.

## No incluidos en v0.40

- utilidad esperada;
- amenaza;
- negociación bilateral;
- coalición;
- probabilidad de victoria;
- saliencia;
- rigidez;
- aversión al riesgo;
- normalización Ser+Estar+Decir+Hacer=1;
- inferencia automática profunda desde texto.

Estas piezas sólo podrán reincorporarse si se justifican desde el modelo de fronteras dinámicas.
