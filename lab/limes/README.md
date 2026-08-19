# Limes v0.47 · Domain Profiles

Capa textual con perfiles de dominio más finos.

## Cambios principales

- Añade perfil `regulación / conflicto institucional`.
- Separa política electoral, movilización social y regulación institucional.
- Detecta eventos autoridad → actor regulado como regulación coercitiva.
- Detecta eventos actor regulado → actor regulado como impugnación/demanda o resistencia pública.
- Genera escala H regulatoria: capacidad del actor regulado para sostener actividad e impugnar restricción.
- Limpia falsos actores periodísticos frecuentes: Indicaron, Aseguraron, Lamentaron, Dijeron, Agregó, Señaló, Explicó, Dinero, etc.
- Normaliza actores regulatorios: `gobierno / autoridades` y `Comunidad de Pequeños Anfitriones`.
- Mantiene las fases de v0.46 para narrativa y añade fases regulatorias.

## Núcleo matemático intacto

R = S × E  
X = R × D × φ  
ΔH = (G − H) × X  
H' = H + ΔH
