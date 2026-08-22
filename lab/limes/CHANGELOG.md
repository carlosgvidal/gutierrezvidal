# Changelog v0.54

## Jerarquía semántica

- gate de agencia antes de síntesis estratégica;
- separación de sujeto, hablante, destinatario, paciente y agente pasivo;
- continuidad discursiva para atribuciones elípticas;
- contenido propuesto de actos de habla separado de acciones realizadas;
- programas jerárquicos en vez de un programa por acto;
- subgames múltiples en textos con fases estratégicas distintas;
- fronteras limitadas a actores operativos y relaciones pertinentes;
- objetos de valor diferenciados de obstáculos e instrumentos.

## Generalización

- eliminados atajos de producción ligados a nombres, organizaciones, episodios y vocabulario estrecho de los fixtures;
- detección de siglas institucionales basada en contexto sintáctico/institucional, no en siglas concretas;
- detección narrativa basada en estructura temporal, personajes y secuencias de acción, no en objetos particulares de un cuento;
- familias de orientación, captura, retorno y adquisición derivadas de predicados/objetos semánticos generales;
- movilidad institucional derivada de léxico y operaciones generales, no de organismos o destinos concretos;
- síntesis regulatoria sin reglas para una comunidad específica;
- nuevo gate estático `tests/test-generalization.js`.

## Integridad preservada

- núcleo v0.40 sin expected utility;
- 76 juegos declarativos;
- requisitos duros para elegibilidad canónica;
- ninguna asignación automática de `S/E/H/D/φ/G_e`;
- `Gτ` ausente permanece `null`;
- formularios sin presets;
- JavaScript modular, sin bloque monolítico inline.
