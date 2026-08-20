# Limes v0.52 · Language, Frames & Game Ontology

v0.52 deja atrás la arquitectura de HTML con lógica principal incrustada. `index.html` contiene sólo interfaz y carga módulos externos por rutas relativas.

## Arquitectura

```text
index.html
assets/
  app.css
js/
  limes-core.js
  spanish-semantics.js
  entity-engine.js
  semantic-engine.js
  event-engine.js
  game-ontology.js
  game-engine.js
  analysis-engine.js
  app.js
data/
  lexicon/
    es_MX.dic
    es_MX.aff
    LICENSE.md
    LICENSE-LIBREOFFICE-ES.md
tests/
  test-v052.js
  fixtures/
    judicial-news.txt
README.md
DEPLOY.md
SERVER-STRUCTURE-AUDIT.md
```

## Cambios centrales

### 1. Formulario sin presets

El corpus, issue, descripción, escala H, actores y operaciones comienzan vacíos. Sólo permanecen las opciones estructurales de los selectores.

### 2. Recurso léxico robusto

Se incluye el diccionario `es_MX` de LibreOffice/Hunspell:

- más de 59 mil entradas base;
- archivo de afijos y reglas morfológicas;
- carga asíncrona desde `data/lexicon/`;
- licencia incluida en la distribución.

El diccionario aporta cobertura léxica y morfológica. El significado no se deriva sólo del diccionario: `spanish-semantics.js` y `semantic-engine.js` aplican reglas de sentido, marcos y estatus proposicional.

### 3. Entidades

`entity-engine.js` distingue personas, instituciones, gobiernos, roles judiciales, organizaciones, colectivos y lugares. Mantiene alias/acrónimos y separa entidad textual de actor operativo.

La regresión judicial exige detectar, entre otros:

- Claudia Sheinbaum;
- Fiscalía General de la República / FGR;
- Fausto Corrales Rodríguez;
- FECOR;
- Policía Federal Ministerial / PFM;
- Interpol;
- Agencia de Investigación Criminal / AIC;
- juez de Control federal.

### 4. Frames semánticos

Cada proposición intenta producir:

```text
actor
predicate/sense
patient
recipient
object
SER | ESTAR | DECIR | HACER
temporality
modalities
logic
realization
epistemic_status
relation_to_event
confidence
```

Se distinguen realización, plan, retrospección, hipótesis/proyección, alegación atribuida, evaluación y hecho textual.

### 5. Eventos y coreferencia

La repetición acumula evidencia sobre el mismo episodio. No crea automáticamente impactos causales adicionales.

Los episodios conservan separado:

- evento constitutivo;
- atributo/estado;
- respuesta;
- argumento;
- evaluación;
- proyección;
- alegación.

Sólo frames con estatus compatible pueden convertirse automáticamente en operaciones Limes.

### 6. Ontología de juegos

`game-ontology.js` contiene 76 plantillas canónicas y familias: coordinación, dilemas, bargaining, subastas, competencia industrial, información incompleta, principal-agente, señalización, screening, inspección, acción colectiva, repetición, coaliciones, votación, redes, juegos evolutivos y secuenciales, entre otras.

El motor no fuerza una clasificación. Devuelve candidatos, evidencia coincidente, requisitos faltantes y sólo declara un juego cuando el umbral estructural se cumple.

### 7. G_e y Gτ

Se mantiene la distinción:

- `G_e`: objetivo/estado local del evento;
- `Gτ`: estado terminal del escenario.

`Gτ` no sustituye `G_e`.

## Núcleo matemático

Sin cambios:

```text
R = S × E
X = R × D × φ
ΔH = (G_e − H) × X
H' = H + ΔH
```

## Alcance

El motor sigue siendo determinista y auditable. Un diccionario grande no equivale por sí solo a comprensión lingüística general. La v0.52 introduce una separación explícita entre cobertura léxica, frames de significado, estatus epistémico, episodios y juegos para poder ampliar cada capa sin contaminar el núcleo matemático.
