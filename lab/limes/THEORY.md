# Limes v0.40 · Núcleo teórico

## 1. Tesis central

Limes modela la comunicación como intercambio transformador. Un actor **es** y **está**; desde esa configuración dispone de recursos materiales y simbólicos. Mediante una decisión comunicativa **dice**: moviliza una parte de esos recursos a través de una frontera relacional. Si el intercambio logra atravesar esa frontera, puede modificar el **hacer** de otro actor. El nuevo hacer modifica su **estar** y, por acumulación histórica, puede modificar su **ser**.

La predicción primaria de esta versión no es utilidad esperada. Es:

\[
Y = \Delta H_j
\]

el **cambio esperado de comportamiento del actor receptor**.

## 2. Tétrada funcional

### Ser · S
Configuración relativamente persistente desde la que el actor produce y reconoce significación: identidad, valores, pertenencias, disposiciones y límites.

### Estar · E
Configuración contingente del actor: condiciones materiales, sociales, culturales, institucionales, tecnológicas y espaciales que delimitan lo que puede hacer ahora.

### Decir · D
Operación comunicativa situada. No equivale a volumen de información. Es la proporción de recursos disponibles que el actor moviliza para intentar producir una transformación determinada.

### Hacer · H
Conducta o posición observable respecto de una cuestión concreta. Es el nivel sobre el que se formula la predicción primaria.

Los cuatro estados no son porcentajes que deban sumar 1. Son magnitudes o estados funcionales independientes.

## 3. Frontera

La frontera entre dos actores no es una línea ideológica. Es una condición relacional que regula qué parte de una operación comunicativa puede convertirse en intercambio efectivo.

En v0.40 se representa por:

\[
\phi_{ij} \in [0,1]
\]

donde 0 indica impermeabilidad operativa y 1 máxima porosidad bajo las condiciones declaradas.

## 4. Recursos simbólicos disponibles

Primera hipótesis operacional mínima:

\[
R_i = S_i E_i
\]

La forma multiplicativa expresa una condición de cuello de botella: disponer de una configuración simbólica fuerte sin condiciones de actuación, o de condiciones favorables sin recursos simbólicos movilizables, limita el intercambio efectivo.

Esta ecuación es una **hipótesis explícita de v0.40**, no una ley empíricamente calibrada.

## 5. Intercambio efectivo

Para una operación de i sobre j:

\[
X_{ij} = R_i D_{ij} \phi_{ij}
\]

`D` representa movilización comunicativa efectiva, no cantidad bruta de mensajes.

## 6. Objetivo de la operación

Cada operación comunicativa presupone un hacer esperado del receptor:

\[
G_{ij} \in [0,1]
\]

`G` no es utilidad. Es el comportamiento/posición que el emisor intenta producir en el receptor respecto de una cuestión específica.

## 7. Cambio esperado de comportamiento

\[
\Delta H_j = (G_{ij}-H_j)X_{ij}
\]

y:

\[
H_j' = H_j + \Delta H_j
\]

La ecuación significa: el intercambio efectivo cierra una fracción del espacio existente entre el comportamiento actual del receptor y el comportamiento buscado por el emisor.

No hay probabilidad de victoria, amenaza, utilidad esperada, saliencia, rigidez ni aversión al riesgo en este núcleo.

## 8. Dinámica temporal

La versión 0.40 implementa cambios sucesivos de `H`. Cada operación posterior recibe el estado actualizado del actor.

El circuito teórico completo previsto es:

\[
(S,E)_t \rightarrow R_t \rightarrow D_t \rightarrow X_t
\rightarrow \Delta H_{t+1} \rightarrow \Delta E_{t+1}
\rightarrow \Delta S_{t+n}
\]

pero **v0.40 no inventa todavía ecuaciones para ΔE y ΔS**. Esas transiciones quedan formalmente declaradas y pendientes de corpus longitudinal y calibración.

## 9. Comunicación e información

Limes no identifica información con comunicación. Una gran cantidad de información redundante puede corresponder a `D` bajo si no constituye una intervención capaz de producir desplazamiento. La clasificación de `D` debe provenir de evidencia contextual, no de conteo de palabras.

## 10. Principio de lectura

El sistema lingüístico futuro no deberá producir números directamente desde tokens. La ruta requerida es:

Texto → evidencia → entidades → eventos → función teórica → variables → predicción.

Una expresión sólo puede alimentar `S`, `E`, `D`, `H`, `φ` o `G` después de ser interpretada dentro de un evento y atribuida a un actor.
