# UMBRAL · Crónicas de la Última Llama

**▶ Jugar ahora:** https://agomezbl.github.io/UMBRAL-D-D-QUEST/

Mazmorra táctica por turnos en 3D, con dados de calavera y escudo. Tres héroes descienden a la Hondura para reavivar la Llama Perenne de Aldmere, guiados por la voz de Madre Isolde a través de un farol. Nada es lo que parece.

Funciona en ordenador (ratón y teclado) y en móvil (pantalla táctil). Necesita conexión a internet para cargar el motor 3D y las fuentes.

## Lo que incluye

- Campaña de tres capítulos: **Las Criptas de Malakor**, **La Forja de Karak-Azkul** y **El Ojo de Cristal**, con campamentos entre capítulos.
- Diálogos con retratos, diarios que se encuentran por el camino, fantasmas, sustos, un giro final, una elección y dos finales.
- Tres héroes con personalidad propia, definidos por **cinco virtudes**: Fuerza, Agilidad, Ingenio, Voluntad y Presencia. Aldric (paladín) es fuerte y carismático, Sera (exploradora) la más ágil y Elian (Tejedor del Éter) el más listo y voluntarioso.
- Las virtudes lo deciden todo: vida, movimiento, dados de ataque y defensa, quién abre una cerradura o descifra un sello, quién convence a un fantasma, quién resiste el miedo y quién regatea en la tienda. Antes de cada prueba se ve la probabilidad de éxito de cada héroe.
- **Determinación** para repetir tiradas, **Éter** para la magia de Elian, flanqueo, ataques de oportunidad y estados (aterrado, envenenado, ardiendo, aturdido, inspirado…).
- Progresión: reparto inicial de virtudes, un talento por héroe en cada campamento y una velada con prueba antes de cada capítulo.
- Criaturas con virtudes, rol y rasgos: las más listas eligen mejor a quién atacar, las de poca voluntad huyen cuando cae su líder, los no muertos temen la luz y los espectros resisten el acero.
- Combate con dados, probabilidades visibles antes de atacar, zona de amenaza de cada enemigo, trampas, cofres, objetos y reliquias que cambian el aspecto de las miniaturas.
- Cuatro jefes con mecánicas propias y conversaciones con PNJ que se resuelven según quién hable.
- Gráficos generados por código: piedra con relieve, antorchas con luz dinámica, lava, miasma, vacío, partículas, brillo y efecto miniatura.
- Música y efectos generados en tiempo real, ambiente propio en cada capítulo y narración por voz opcional.
- Tres dificultades que cambian cómo se juega, no solo los números: lo listas que son las criaturas, qué pasa cuando un héroe cae y cada cuánto sube un monstruo errante (el **Presagio**). Guardado automático y calidad gráfica ajustable.

El estudio de diseño completo (estrategias comparadas, solución elegida y resultados de las simulaciones) está en [`DISENO.md`](DISENO.md).

## Controles

| Acción | Ordenador | Móvil |
| --- | --- | --- |
| Mover, atacar, abrir | Clic en la casilla | Toca para ver qué pasará y toca otra vez para confirmar |
| Mover la cámara | Arrastrar o `WASD` | Arrastrar con un dedo |
| Girar | Clic derecho y arrastrar, o `Q` / `E` | Girar con dos dedos |
| Zoom | Rueda del ratón | Pellizcar |
| Atacar y habilidades | Teclas `1` a `3` | Barra inferior |
| Acciones (arengar, registrar, guardia, correr) | Tecla `4` | Botón «Acciones» |
| Objetos | Tecla `5` | Botón «Objetos» |
| Ficha del grupo | Tecla `G` | Botón de la corona |
| Deshacer el último movimiento | Tecla `Z` | Botón «Deshacer» |
| Fin de turno | `Espacio` | Botón de reloj de arena |
| Siguiente héroe | `Tab` | Tocar su retrato |

## Cómo está organizado

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | El juego completo en un solo archivo. Es lo que publica GitHub Pages. |
| `src/` | El código fuente, dividido por partes (historia, mapas, gráficos, audio, interfaz…). |
| `src/js/10_rules.js` | Reglas de rol: virtudes, estados, dificultades, talentos y veladas. Aquí se ajusta el equilibrio. |
| `src/js/10_story.js` | Diálogos, mapas de los capítulos, héroes, enemigos y tienda. Aquí se cambia la historia. |
| `DISENO.md` | Estudio de diseño y resultados de las pruebas automáticas. |
| `build.py` | Une todo `src/` en un nuevo `index.html`. |

## Cómo actualizar el juego

**Si solo tienes un `index.html` nuevo:**

1. Entra en este repositorio en GitHub.
2. Pulsa **Add file** y luego **Upload files**.
3. Arrastra el nuevo `index.html` y pulsa **Commit changes**.
4. En uno o dos minutos la página de juego se actualiza sola.

**Si has cambiado algo dentro de `src/`:** ejecuta `python build.py` en esta carpeta para generar el nuevo `index.html` y súbelo como en el caso anterior.
