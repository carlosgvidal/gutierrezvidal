# LIMES · Canonical 0.1.4

Runtime estático para despliegue directo desde `lab/limes/`.

## Arquitectura

El análisis se ejecuta íntegramente en el navegador. `static/engine.js` conserva la capa factual, documental, léxica y estratégica. `static/interpretation.js` añade una capa separada de interpretación estructural que consume claims, entidades, factualidad y evidencia del motor base.

La secuencia interpretativa implementada es:

`claim → roles funcionales → operación → objeto de valor → programa/contraprograma → perfil S/E/D/H → relación dirigida → frontera → transformación → reporte`.

Cada objeto interpretativo conserva `status`, `method` y referencias a evidencia. La ausencia de evidencia no se transforma en valor cero.

## Entrada

Texto directo, TXT, MD, CSV, JSON, XLSX y XLSM.

## Salida

La interfaz incorpora reporte interpretativo, objetos de valor, programas, fronteras, relaciones dirigidas, perfiles S/E/D/H, modelado estratégico y auditoría. El análisis completo puede exportarse como JSON y el reporte interpretativo como HTML.

## Integridad

El paquete no contiene corpus, actores, escenarios, datos, fixtures ni material textual de referencia incorporado para dirigir los resultados. Las reglas interpretativas son generales y declaradas por método.
