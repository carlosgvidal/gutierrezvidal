# LIMES 0.1.2 — montaje bajo subruta

Esta revisión elimina dependencias de rutas absolutas en el frontend.

- Los activos estáticos se resuelven de forma relativa al directorio que contiene `index.html`.
- Las llamadas de API se resuelven un nivel por encima del directorio `static`, bajo `api/`.
- La interfaz ejecuta una comprobación de `api/health` al cargar y muestra el estado del motor.
- El endpoint raíz de FastAPI redirige al documento estático para conservar la misma resolución relativa de activos.

La disponibilidad efectiva de la API depende de que el servidor publique el proceso ASGI bajo el mismo prefijo que contiene `static` o de que exista una regla de proxy equivalente.
