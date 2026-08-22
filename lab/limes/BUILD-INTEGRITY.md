# Integridad de construcción

Esta reconstrucción se creó en un directorio vacío y no incorpora archivos de código, documentación, pruebas, fixtures, léxicos de dominio, escenarios ni recursos de implementaciones anteriores.

La verificación de construcción realizada fuera del artefacto comprobó:

- compilación sintáctica de los módulos Python;
- validación sintáctica del JavaScript de interfaz;
- propiedades algebraicas de utilidad, asimetría, reciprocidad, normalización, concentración y dominio de resultados mediante datos numéricos generados durante la verificación y no almacenados en el paquete;
- ausencia de directorios o archivos de ejemplos, muestras, fixtures, demos o tests dentro del artefacto;
- ausencia de coincidencias binarias entre los archivos de esta reconstrucción y los archivos de implementaciones previas disponibles durante la auditoría;
- ausencia de marcadores textuales asociados con casos previamente utilizados durante el desarrollo;
- arranque correcto del servidor y respuesta del endpoint de salud.

Las verificaciones externas de construcción no constituyen validación empírica de la teoría ni del análisis semántico. Esa validación deberá realizarse con datos externos mantenidos fuera del artefacto.
