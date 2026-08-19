# Limes v0.45 · Lexicon Corpus

Versión previa a corpus entrenado. Introduce un diccionario teórico y perfiles de corpus para que el análisis textual funcione más allá de casos específicos.

## Cambios principales

- Diccionario centralizado de señales para Ser, Estar, Decir, Hacer, barrera, coerción, resistencia y coordinación.
- Perfiles de corpus: consumo, política, narrativa, salud, educación, organización y genérico.
- Selección automática de perfil según el texto.
- Generación de issue, contexto y escala H desde el perfil detectado.
- Extracción de eventos candidatos source → target con tipo y polaridad.
- Generación de secuencias de operaciones, no sólo una operación única.
- Para operaciones coercitivas/negativas, G se orienta hacia disminución de H del receptor.
- Fallback genérico editable para textos fuera de perfiles conocidos.

## Núcleo matemático intacto

R = S × E  
X = R × D × φ  
ΔH = (G − H) × X  
H' = H + ΔH

## Nota

Esto no reemplaza un corpus anotado. Es una capa intermedia: diccionario + perfiles + eventos heurísticos, con confirmación del analista.
