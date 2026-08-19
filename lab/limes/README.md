# Limes v0.42 · Semantic Scales

Etapa previa a la capa textual.

## Cambios principales

- Definición explícita de qué mide `H`.
- Anclajes interpretativos para H = 0, .25, .50, .75, 1.
- Evidencia declarada para `S`, `E`, `H` por actor.
- Evidencia declarada para `D`, `φ`, `G` por operación.
- Reporte enriquecido con escala, anclajes, evidencia y lectura de desplazamiento.
- Exportación TXT y JSON.

## Núcleo matemático intacto

R = S × E  
X = R × D × φ  
ΔH = (G − H) × X  
H' = H + ΔH

## Límites

No hay parser textual. No hay utilidad esperada. No se modelan todavía ΔEstar ni ΔSer.
