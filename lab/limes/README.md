# Limes v0.51 · Semantic Interpretation Engine

Esta versión separa por primera vez el análisis profundo del texto en un módulo JavaScript independiente:

- `semantic-engine.js`: interpretación semántica local y trazable.
- `index.html`: interfaz, capa semiótico-estratégica y Limes Core.
- `test-v051.js`: regresiones ejecutables en Node.

## Arquitectura

texto
→ motor semántico
→ concordancia semántica
→ proposiciones
→ coreferencia / agrupación de eventos
→ estructura semiótica
→ juegos y subjuegos
→ escenarios estratégicos
→ tracks
→ Limes Core

## Motor semántico

`semantic-engine.js` incorpora, sin dependencias externas:

- normalización y lematización ligera en español;
- stopwords funcionales y verbos de atribución;
- segmentación en oraciones y cláusulas;
- detección de verbos/operaciones;
- negación;
- modalidades querer / poder / saber / deber;
- temporalidad y estatus de la proposición:
  - afirmada;
  - reportada;
  - hipotética;
  - intencional;
  - retrospectiva;
  - rechazo de acción;
- entidades y participantes;
- firma semántica del objeto;
- familias de proposiciones;
- coreferencia de menciones en eventos;
- concordancia basada en lemas, dispersión y participación en relaciones.

No se presenta como comprensión lingüística general: es un motor algorítmico explícito, auditable y ampliable.

## Correcciones estructurales

### Repetición
Varias menciones de una misma regulación o acontecimiento acumulan evidencia/confianza; no se calculan automáticamente como varios impactos.

### Targets
Los eventos pueden distinguir:

- `source`: actor que opera;
- `actionTarget`: destinatario/objeto de la operación;
- `stateTarget`: actor cuyo H se evalúa.

### Jerarquía de G
Se separan:

- `G_e`: objetivo/estado local inducido por cada evento;
- `Gτ`: estado terminal del escenario.

`Gτ` no sustituye `G_e` en cada operación.

### Narrativa
Se distinguen, entre otros:

- abandono;
- orientación exitosa;
- secuencia de migas / orientación fallida;
- captura;
- contraacción;
- adquisición de recursos;
- retorno/restauración.

La adquisición de recursos no equivale automáticamente al retorno.

### Estrategia
La estructura estratégica incorpora subjuegos/unidades estratégicas cuando el texto lo permite.

## Núcleo matemático

Sin cambios:

R = S × E  
X = R × D × φ  
ΔH = (G_e − H) × X  
H' = H + ΔH

## Despliegue

`index.html` y `semantic-engine.js` deben conservarse en el mismo directorio. El HTML carga el módulo mediante una ruta relativa.

## Validación

La versión incluye pruebas de regresión para noticia regulatoria y narrativa. Las pruebas automatizadas no sustituyen la validación con textos completos en el navegador y en el despliegue real.
