# Protocolo de integridad

## Restricción de ejemplares

El artefacto de producción no contiene ni debe contener:

- casos reales;
- casos ficticios;
- casos sintéticos;
- fixtures;
- muestras de entrada;
- muestras de salida;
- escenarios narrativos precargados;
- actores o instituciones precargados;
- reglas dedicadas a resolver una frase o corpus determinado;
- corpus de desarrollo o validación;
- prompts few-shot;
- valores de parámetros introducidos como demostración;
- resultados esperados vinculados a contenido semántico concreto.

## Procedencia algorítmica

Todo comportamiento de producción debe pertenecer a una de estas clases:

- regla lingüística general;
- categoría derivada de fuente teórica declarada;
- transformación matemática explícita;
- operación estructural sobre datos ingresados;
- decisión explícita del usuario.

## Separación de evaluación

Los corpus externos utilizados en evaluación no se incorporan al artefacto. Los resultados de una evaluación no autorizan excepciones dedicadas a ese corpus.

## Abstención

Cuando una inferencia no puede sostenerse mediante una regla general trazable, la salida correspondiente permanece sin resolver.

## Herencia

Esta reconstrucción no reutiliza código de versiones anteriores. La continuidad del proyecto se conserva en el nivel teórico y documental, no mediante copia de implementación.
