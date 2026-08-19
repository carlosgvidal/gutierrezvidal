# Limes v0.41 · Scenario Builder

Rama experimental independiente basada en el núcleo v0.40.

## Propósito

Construir escenarios declarados por el analista antes de desarrollar lectura automática de corpus.

La herramienta permite:

- declarar issue y contexto;
- definir actores con Ser, Estar y Hacer independientes;
- declarar operaciones comunicativas entre actores;
- especificar D, φ y G;
- calcular trazabilidad de R, X, brecha, ΔH y H final;
- exportar reporte TXT y JSON.

## Núcleo matemático

R = S × E  
X = R × D × φ  
ΔH = (G − H) × X  
H' = H + ΔH

## Límites

No hay parser textual. No se calcula utilidad esperada. No se modelan todavía ΔEstar ni ΔSer.
