# Limes v0.49 · Observational Model

Versión centrada en hacer matemáticamente factible el paso de texto a núcleo.

## Cambio arquitectónico

Se separa la lectura textual del cálculo:

texto → observaciones → actores normalizados → roles funcionales → tracks → H única por track → eventos válidos → evidencia/confianza → suficiencia → cálculo.

## Cambios principales

- Objeto de observación validable (`observational-model-v0.49`).
- Tracks analíticos separados cuando un texto contiene más de una H.
- En regulación:
  - separa `impacto_regulatorio` de `impugnacion`;
  - carga por defecto el track operativo, no una H mixta;
  - conserva el track de impugnación como pista disponible.
- En narrativa:
  - selección por cobertura de arco;
  - evita pan contextual como orientación fallida;
  - evita remordimiento/retrospectiva como coerción actual;
  - mejora alias niños/hijos/hermanitos → Hänsel y Gretel.
- Cada track incluye estado de suficiencia, faltantes, advertencias y confianza.
- El reporte incluye una sección `0B. OBJETO DE OBSERVACIÓN`.

## Núcleo matemático intacto

R = S × E  
X = R × D × φ  
ΔH = (G − H) × X  
H' = H + ΔH

## Nota

Esta versión no incorpora todavía una capa de concordancia lingüística. La deja como intervención posterior sobre el objeto de observación.
