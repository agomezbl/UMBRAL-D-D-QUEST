# UMBRAL · Crónicas de la Última Llama

**▶ Jugar ahora:** https://agomezbl.github.io/UMBRAL-D-D-QUEST/

Mazmorra táctica por turnos en 3D, con dados de calavera y escudo, al estilo de HeroQuest. De uno a cinco héroes descienden a la Hondura para reavivar la Llama Perenne de Aldmere, guiados por la voz de Madre Isolde a través de un farol. Nada es lo que parece.

Funciona en ordenador (ratón y teclado) y en móvil (pantalla táctil). No necesita conexión: el motor 3D y las letras van dentro del archivo. En el móvil, desde el navegador, «Añadir a la pantalla de inicio» lo instala como una app.

## Lo que incluye

- **Cinco héroes clásicos, y tú eliges cuántos bajan (de 1 a 5):**
  - **Korvak, el Bárbaro:** el que más aguanta y más pega. No conoce el miedo.
  - **Borin, el Enano:** el más duro; rompe escudos, abre cerraduras y desarma trampas sin tirar.
  - **Lyriel, la Elfa arquera:** la más rápida; dispara a 6 casillas y ve las trampas antes de pisarlas.
  - **Aldebrán, el Hechicero:** bola de fuego y luz que cura; abre los sellos rúnicos. Muy frágil.
  - **Thalia, la Amazona:** ataca a 2 casillas con su lanza, carga y empuja al grupo con su grito.
- **Cada aventura recomienda un grupo** (por ejemplo, el Hechicero contra los no muertos), pero puedes bajar con quien quieras. Con menos héroes salen menos enemigos; con más, la Hondura manda más criaturas. En solitario el héroe tiene más vida, un dado más y se levanta una vez por capítulo.
- **Reglas sencillas:** vida, dados de ataque, dados de defensa y movimiento. En cada turno, mover y una acción: **Atacar**, una de tus **dos habilidades** (se recargan unas rondas), **Buscar** u **Objetos**.
- **Buscar** como en los juegos de mesa: una vez por sala, revela las trampas y saca algo de una tabla al azar (oro, pociones, bombas… o un dardo, o un ruido que despierta algo).
- **Tutorial guiado** en una sala de prácticas (unos 10 minutos): enseña a moverse, mirar alrededor, abrir puertas, atacar, usar habilidades, abrir cerraduras, abrir cofres y buscar. No toca la partida guardada.
- Campaña de tres capítulos: **Las Criptas de Malakor**, **La Forja de Karak-Azkul** y **El Ojo de Cristal**, con campamentos entre capítulos: talentos, cambio de grupo, una velada y la tienda.
- **Modo Descenso**: mazmorras que se generan solas, cada partida distinta, con 1 a 5 héroes. Guardián cada cuatro niveles, campamento después, velas para repetir un nivel y récord de profundidad.
- Diálogos con retratos (dice cada frase quien está en el grupo), diarios, fantasmas, sustos, un giro final, una elección y dos finales. Algunas opciones solo aparecen si llevas al héroe adecuado.
- Combate con dados, probabilidades visibles antes de atacar, flanqueo, zona de amenaza de cada enemigo, estados (aterrado, envenenado, ardiendo, aturdido, inspirado), trampas, cofres y objetos.
- **Armería**: armas, armaduras y objetos para cada tipo de héroe; las reliquias cambian el aspecto de las miniaturas.
- Cuatro jefes con mecánicas propias; criaturas que piensan según su tipo y huyen cuando cae su líder.
- Gráficos generados por código: piedra con relieve, antorchas con luz dinámica, lava, miasma, vacío, partículas y efecto miniatura. Música y efectos generados en tiempo real y narración por voz opcional.
- La partida se guarda al empezar cada ronda: si se cierra el navegador, «Continuar» vuelve a esa misma ronda.
- Tres dificultades (Relato, Héroe y Pesadilla) que cambian cómo se juega, no solo los números. Ajustes de lectura y calidad gráfica automática.

El estudio de diseño completo (estrategias comparadas, solución elegida y resultados de las simulaciones) está en [`DISENO.md`](DISENO.md).

## Controles

| Acción | Ordenador | Móvil |
| --- | --- | --- |
| Mover, atacar, abrir | Clic en la casilla | Toca para ver qué pasará y toca otra vez para confirmar |
| Mover la cámara | Arrastrar o `WASD` | Arrastrar con un dedo |
| Girar | Clic derecho y arrastrar, o `Q` / `E` | Girar con dos dedos |
| Zoom | Rueda del ratón | Pellizcar |
| Atacar y habilidades | Teclas `1` a `3` | Barra inferior |
| Buscar | Tecla `4` | Botón de la lupa |
| Objetos | Tecla `5` | Botón «Objetos» |
| Ficha del grupo | Tecla `G` | Botón de la corona |
| Deshacer el último movimiento | Tecla `Z` | Botón «Deshacer» |
| Fin de turno | `Espacio` | Botón de reloj de arena |
| Siguiente héroe | `Tab` | Tocar su retrato |

## Cómo está organizado

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | El juego completo en un solo archivo. Es lo que publica GitHub Pages. |
| `manifest.webmanifest`, `sw.js`, iconos | Permiten instalar el juego en el móvil y abrirlo sin conexión. `build.py` los genera. |
| `src/vendor/` | Motor 3D y tipografías que van dentro del juego, con sus licencias. |
| `src/` | El código fuente, dividido por partes (historia, mapas, gráficos, audio, interfaz…). |
| `src/js/10_rules.js` | Reglas: estados, dificultades, cuántos enemigos según el tamaño del grupo, talentos, equipo y veladas. Aquí se ajusta el equilibrio. |
| `src/js/10_story.js` | Diálogos, mapas de los capítulos, héroes, enemigos y tienda. Aquí se cambia la historia. |
| `src/js/10_descent.js` | Generador de mazmorras del modo Descenso: tamaños, criaturas, nombres y frases. |
| `src/js/11_game_descent.js` | Reglas del Descenso: escaleras, campamentos, velas y récord. |
| `DISENO.md` | Estudio de diseño y resultados de las pruebas automáticas. |
| `build.py` | Une todo `src/` en un nuevo `index.html`. |

## Cómo actualizar el juego

**Si solo tienes un `index.html` nuevo:**

1. Entra en este repositorio en GitHub.
2. Pulsa **Add file** y luego **Upload files**.
3. Arrastra el nuevo `index.html` y pulsa **Commit changes**.
4. En uno o dos minutos la página de juego se actualiza sola.

**Si has cambiado algo dentro de `src/`:** ejecuta `python build.py` en esta carpeta: genera el nuevo `index.html` y `sw.js`. Sube los dos como en el caso anterior.
