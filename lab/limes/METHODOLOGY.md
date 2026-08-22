# Metodología canónica

## 1. Capas

La arquitectura separa:

1. Fuente.
2. Evidencia.
3. Claim.
4. Entidad candidata.
5. Evidencia semiótica.
6. Observable relacional.
7. Parámetro estratégico explícito.
8. Resultado matemático.

Ninguna capa superior modifica la evidencia de origen.

## 2. Ser / Estar / Decir / Hacer

Las cuatro dimensiones se conservan como estructura epistemológica. El motor textual sólo calcula evidencia léxica asociada con categorías explícitas de las fuentes teóricas. El resultado se identifica como proxy léxico y no como medición cardinal de Ser, Estar, Decir o Hacer.

No se impone la condición de suma unitaria a las cuatro dimensiones en esta base canónica.

## 3. Factualidad

La factualidad se representa mediante estados nominales. La negación, la atribución, la posibilidad, la intención, la planificación, la obligación, la condición y el contrafactual se preservan como propiedades del claim. La herramienta no promociona contenido no realizado a acción factual.

## 4. Entidades

La detección automática produce candidatos ortográficos. Una entidad candidata no equivale automáticamente a actor. Esta base no asigna agencia mediante dominios o escenarios precargados.

## 5. Relaciones y fronteras

La coocurrencia es un observable estructural y no una relación semántica. La base no convierte coocurrencia en apoyo, conflicto, causalidad o frontera.

Las funciones matemáticas disponibles para frontera calculan únicamente observables cuando existen datos direccionales explícitos:

\[
Rec_{ij}=\frac{2\min(F_{ij},F_{ji})}{F_{ij}+F_{ji}}
\]

\[
Asym_{ij}=\frac{F_{ij}-F_{ji}}{F_{ij}+F_{ji}}
\]

\[
Persistence=\frac{W_{active}}{W_{total}}
\]

La interpretación de permeabilidad, resistencia, legitimidad y costo permanece sin resolver hasta disponer de reglas y evidencia suficientes.

## 6. Espacio estratégico

La posición estratégica pertenece a un eje declarado:

\[
x_i\in[0,100]
\]

La capacidad se normaliza dentro del conjunto de actores del modelo:

\[
c_{n,i}=\frac{c_i}{\sum_j c_j}
\]

La capacidad movilizada se calcula cuando capacidad y saliencia son cardinales:

\[
m_i=c_i s_i
\]

La distancia entre posiciones es:

\[
d_{ij}=\frac{|x_i-x_j|}{100}
\]

## 7. Utilidad espacial

La función implementada utiliza la forma dimensionalmente consistente:

\[
U_i(y)=1-2\left|\frac{x_i-y}{100}\right|^{\alpha_i}
\]

El parámetro \(\alpha\) se denomina curvatura de preferencia espacial. No se interpreta automáticamente como aversión o propensión al riesgo.

Cuando \(\alpha\) no se proporciona, el índice coalicional puede ejecutarse bajo curvatura lineal; el sistema declara este supuesto en la salida.

## 8. Índice de dominancia coalicional

\[
D_{ij}=\frac{\sum_{k:\Delta u_k>0}c_ks_k\Delta u_k}{\sum_kc_ks_k|\Delta u_k|}
\]

con:

\[
\Delta u_k=U_k(x_i)-U_k(x_j)
\]

La salida se denomina índice de dominancia y no probabilidad.

## 9. Centro estratégico

\[
x^*=\frac{\sum_i x_i c_i s_i}{\sum_i c_i s_i}
\]

La salida se denomina centro estratégico ponderado. No se presenta automáticamente como equilibrio, acuerdo o pronóstico.

## 10. Concentración

\[
C=\max\left(0,\min\left(100,\left(1-\frac{\sqrt{\sum_i(x_i-x^*)^2c_{n,i}}}{50}\right)100\right)\right)
\]

La salida describe agrupamiento espacial respecto del centro del modelo.

## 11. Juegos

El solucionador de Nash exige una especificación formal de jugadores, acciones y pagos. No existe catálogo de juegos seleccionado por vocabulario. El motor calcula exclusivamente equilibrios puros sobre la estructura que recibe.

## 12. Abstención

La ausencia de datos no se sustituye por cero. Las capas que requieren interpretación no sustentada permanecen `UNRESOLVED` o no se generan.
