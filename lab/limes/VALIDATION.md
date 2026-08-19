# Validación v0.40

Esta versión valida únicamente el núcleo matemático nuevo.

Pruebas requeridas:

1. R = S×E.
2. Una frontera impermeable (phi=0) produce deltaH=0.
3. Una operación sin movilización (D=0) produce deltaH=0.
4. Si H ya coincide con G, deltaH=0.
5. Una operación positiva mueve H hacia G sin sobrepasarlo.
6. Una operación negativa mueve H hacia G sin sobrepasarlo.
7. Operaciones sucesivas usan el H actualizado.
8. Entradas incompletas son rechazadas.
9. Ser, Estar y Hacer no se normalizan entre sí.
10. No existe ninguna función de utilidad esperada en el núcleo.

El archivo `test-core.js` ejecuta estas pruebas con Node.
