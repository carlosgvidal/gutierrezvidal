# Limes v0.48 · Actor Roles & Event Modes

Capa textual con roles funcionales, modos de issue y eventos compactos.

## Cambios principales

- Añade selector de modo de issue: impacto regulatorio, impugnación, mixto, supervivencia/agencia, adopción y movilización.
- Añade selector de agrupación de eventos: compacto/detallado.
- Unifica actores duplicados en la carga desde texto.
- Asigna roles funcionales por dominio: autoridad reguladora, actor regulado, vocería, territorio, norma, amenaza, receptor vulnerable, actor de orientación, actor de contraacción.
- Separa actor mencionado de actor operativo en textos regulatorios.
- Reconoce eventos regulatorios bidireccionales:
  - gobierno / autoridades → actor regulado: regulación coercitiva;
  - actor regulado → actor regulado: impugnación/demanda como aumento de capacidad de respuesta.
- Mejora narrativa:
  - mujer/madrastra y mujer/bruja se resuelven por contexto;
  - distingue orientación exitosa y orientación fallida;
  - detecta negación semántica como “no nos abandonará”;
  - incluye contraacción, escape, retorno y agencia restaurada.
- Evidencia S/E se marca como contextual o inferida por rol cuando no es individual.

## Núcleo matemático intacto

R = S × E  
X = R × D × φ  
ΔH = (G − H) × X  
H' = H + ΔH

## Validación incluida

Ejecute:

```bash
node test-v048.js
```
