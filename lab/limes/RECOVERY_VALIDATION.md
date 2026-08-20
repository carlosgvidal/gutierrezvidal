# Validación — Limes v0.52.1 · Integrity Recovery

## Resultado

- Sintaxis JavaScript: PASS
- Gate adversarial de recuperación: 28/28 PASS
- Nombres de fixtures detectados en producción: 0
- JavaScript inline en index.html: 0 bloques
- Catálogo de juegos preservado: 76 plantillas
- Rutas HTTP locales: PASS para index.html, CSS, app.js, limes-core.js, es_MX.dic y es_MX.aff

## Correcciones verificadas

1. Núcleo v0.40 conserva ecuaciones y restaura validación source/target.
2. Se eliminaron fallbacks nominales de fixtures del código de producción.
3. `detenerse a escuchar` no se interpreta como detención jurídica.
4. NER no crea `Corrió Gretel`, `Dijo Hänsel`, `Pero Gretel` o `Volcó Gretel`.
5. Frames anidados separan respuesta e imposición en `rechazó el límite impuesto por...`.
6. El fallback ontológico es `UNRESOLVED`, no `HACER`.
7. Una regulación con actores nuevos puede reconocerse sin presets nominales.
8. Se preserva continuidad del hablante en atribuciones elípticas simples.
9. Acciones materiales/institucionales quedan fuera del core comunicativo v0.40 por defecto.
10. Ninguna operación automática recibe D, φ o G_e numéricos.
11. Ningún actor automático recibe S, E o H numéricos.
12. Los requisitos de juegos son duros para elegibilidad.
13. Una mera detención no determina automáticamente Screening.
14. No se generan Gτ numéricos automáticos.
15. El diccionario participa en filtrado NER/morfológico.
16. Gτ vacío permanece null.
17. Se retiró numericFor y los presets numéricos de actor/track.
18. Operaciones sólo usan entidades detectadas o actores analíticos explícitos.
19. Un trigger temático aislado no fuerza dominio judicial.
20. Coreferencia queda acotada por firma y proximidad.
21. El motor de juegos no recibe domainBoost ni inyección de features por dominio.
22. Todos los tracks automáticos quedan preliminares hasta parametrización.
23. Filas manuales parten sin valores numéricos.
24. Formularios fuente/escenario siguen sin presets.
25. Se conservan 76 plantillas de juego.

## Alcance

Esta validación prueba integridad, regresiones y comportamiento conservador. No afirma comprensión general del español ni calibración empírica de S/E/D/φ/G_e. Tampoco sustituye una prueba del despliegue real en Safari/servidor.
