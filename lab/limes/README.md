# Limes v0.46 · Event Phases

Capa textual con fases de evento.

## Cambios principales

- Elimina eventos basados sólo en verbos de habla como “dijo” cuando no hay operación transformadora.
- Genera eventos con fase, tipo y polaridad.
- Calcula el H inicial sugerido desde el primer evento/fase, no desde el desenlace completo.
- Mantiene operaciones coercitivas con G bajo y operaciones de resistencia con G alto.
- Refuerza filtros de falsos actores residuales como Ahora, Algún, Acercóse, Ahí.
- Reporte y resultados muestran fase por operación.
- La evidencia se conserva por evento/oración.

## Núcleo matemático intacto

R = S × E  
X = R × D × φ  
ΔH = (G − H) × X  
H' = H + ΔH
