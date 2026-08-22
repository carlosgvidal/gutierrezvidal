# Auditoría de aislamiento de casos — Limes v0.54

## Objetivo

Verificar que los textos usados como ejemplos/regresiones no hayan vuelto a introducir datos nominales o atajos específicos dentro del código de producción.

## Superficie auditada

- `js/*.js`
- `index.html`
- `assets/*`

Los fixtures y textos de regresión se permiten exclusivamente en `tests/`.

## Gate estático

Se buscaron, entre otros, los siguientes anclajes de los casos usados durante el desarrollo:

- nombres propios de los casos judicial, regulatorio, migratorio y narrativo;
- nombres de organizaciones, programas e instrumentos específicos de esos casos;
- siglas/organismos concretos del caso migratorio;
- identificadores históricos de episodios específicos (`...|corrales`, `witch-episode`, `gretel-episode`, `breadcrumbs`);
- atajos léxicos estrechos que habían aparecido para objetos particulares de fixtures (por ejemplo guijarros/migas, hospedaje, tercer país, anfitriones como shortcut de caso).

**Resultado: 0 coincidencias en producción.**

## Qué sí permanece

Permanecen vocabularios y reglas generales de lengua o dominio cuando no identifican un caso: verbos españoles, tipos de rol, vocabulario jurídico/regulatorio, términos generales de movilidad, relaciones de discurso, etc. Estos recursos no contienen nombres de los fixtures ni reglas que dependan de una entidad concreta.

## Prueba automática

`tests/test-generalization.js` ejecuta dos tipos de gate:

1. escaneo estático que falla si reaparecen anclajes específicos en producción;
2. casos nuevos no usados como fixtures originales para regulación, narrativa, movilidad e investigación judicial.

Resultado ejecutado: **5/5 PASS**.

## Conclusión

Los casos de ejemplo quedan aislados en `tests/`. La lógica de producción v0.54 utiliza reglas estructurales y vocabulario general, no nombres propios ni fallbacks de los casos de regresión.
