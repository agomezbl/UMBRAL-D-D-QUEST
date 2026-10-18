# UMBRAL · Crónicas de la Última Llama

**▶ Jugar ahora:** https://agomezbl.github.io/UMBRAL-D-D-QUEST/

Mazmorra táctica por turnos en 3D, con dados de calavera y escudo. Tres héroes descienden a la Hondura para reavivar la Llama Perenne de Aldmere, guiados por la voz de Madre Isolde a través de un farol. Nada es lo que parece.

Funciona en ordenador (ratón y teclado) y en móvil (pantalla táctil). Necesita conexión a internet para cargar el motor 3D y las fuentes.

## Lo que incluye

- Campaña de tres capítulos: **Las Criptas de Malakor**, **La Forja de Karak-Azkul** y **El Ojo de Cristal**, con campamentos entre capítulos.
- Diálogos con retratos, diarios que se encuentran por el camino, fantasmas, sustos, un giro final, una elección y dos finales.
- Tres héroes con dos habilidades cada uno: Aldric (paladín), Sera (exploradora) y Elian (Tejedor del Éter).
- Combate con dados, probabilidades visibles antes de atacar, zona de amenaza de cada enemigo, trampas, cofres, objetos y reliquias que cambian el aspecto de las miniaturas.
- Cuatro jefes con mecánicas propias y enemigos con inteligencia artificial.
- Gráficos generados por código: piedra con relieve, antorchas con luz dinámica, lava, miasma, vacío, partículas, brillo y efecto miniatura.
- Música y efectos generados en tiempo real, ambiente propio en cada capítulo y narración por voz opcional.
- Tres dificultades (Relato, Héroe y Pesadilla), guardado automático y calidad gráfica ajustable.

## Controles

| Acción | Ordenador | Móvil |
| --- | --- | --- |
| Mover, atacar, abrir | Clic en la casilla | Toca para ver qué pasará y toca otra vez para confirmar |
| Mover la cámara | Arrastrar o `WASD` | Arrastrar con un dedo |
| Girar | Clic derecho y arrastrar, o `Q` / `E` | Girar con dos dedos |
| Zoom | Rueda del ratón | Pellizcar |
| Acciones | Teclas `1` a `5` | Barra inferior |
| Fin de turno | `Espacio` | Botón de reloj de arena |
| Siguiente héroe | `Tab` | Tocar su retrato |

## Cómo está organizado

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | El juego completo en un solo archivo. Es lo que publica GitHub Pages. |
| `src/` | El código fuente, dividido por partes (historia, mapas, gráficos, audio, interfaz…). |
| `src/js/10_story.js` | Diálogos, mapas de los capítulos, enemigos y tienda. Aquí se cambia la historia. |
| `build.py` | Une todo `src/` en un nuevo `index.html`. |

## Cómo actualizar el juego

**Si solo tienes un `index.html` nuevo:**

1. Entra en este repositorio en GitHub.
2. Pulsa **Add file** y luego **Upload files**.
3. Arrastra el nuevo `index.html` y pulsa **Commit changes**.
4. En uno o dos minutos la página de juego se actualiza sola.

**Si has cambiado algo dentro de `src/`:** ejecuta `python build.py` en esta carpeta para generar el nuevo `index.html` y súbelo como en el caso anterior.
