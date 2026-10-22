# UMBRAL · Estudio de diseño: personajes, dificultad y mecánica

Este documento recoge el análisis de la versión anterior, las estrategias que se compararon para darle profundidad de juego de rol (al estilo de HeroQuest y Baldur's Gate) y la solución que se implantó.

> **Nota (rediseño de la sección 11):** las virtudes, la Determinación, el Éter, los ataques de oportunidad, las pruebas de virtud y el cooperativo en el mismo aparato que se describen en las secciones 3 a 10 se retiraron. Se conservan como registro de cómo se llegó hasta aquí. Las reglas vigentes están en la sección 11.

## 1. Diagnóstico de la versión anterior

Se jugaron campañas completas con un jugador automático en las tres dificultades y se midió lo que hacía cada héroe.

| Problema | Dato medido | Por qué importa |
| --- | --- | --- |
| Los héroes solo se distinguían por números de combate | Explorar, hablar o registrar daba igual quién lo hiciera (salvo las trampas de Sera) | No había personajes «listos», «carismáticos» ni «voluntariosos» |
| El paladín no protegía a nadie | Aldric recibió 69 de daño frente a 296 de Sera en la misma partida | Sin zona de control, los enemigos rodeaban al tanque y mordían al débil |
| Caer no costaba nada | Hasta 142 levantamientos en una sola partida | No había tensión: un aliado te levantaba gratis una y otra vez |
| Sobraba oro | 480–690 monedas tras el capítulo I | Se compraba casi toda la tienda de golpe; la tienda dejaba de ser una decisión |
| Malakor convocaba esqueletos sin fin | Partidas de más de 160 rondas y 105 muertes en un capítulo | El jefe se convertía en una picadora sin final |
| Dificultad = multiplicadores | Pesadilla: 0 capítulos superados. Relato: 0 caídas | Una era imposible y la otra no tenía riesgo; ninguna cambiaba cómo se jugaba |
| La IA era igual para todos | Un esqueleto y un sectario elegían objetivo con la misma fórmula | Las criaturas no tenían personalidad táctica |
| Los diálogos eran fijos | Solo una elección en toda la campaña | Los PNJ no reaccionaban a quién eras |
| Sin presión de tiempo | Se podía registrar todo sin consecuencias | No había tensión exploratoria |
| Un toque en falso en el móvil no se podía deshacer | — | Frustración en pantalla táctil |

## 2. Estudio de estrategias

Cada alternativa se puntuó de 1 a 5 en seis criterios con estos pesos: diferenciación de personajes (25 %), profundidad táctica (20 %), claridad en móvil y curva de aprendizaje (20 %), alcance a criaturas, PNJ y dificultad (15 %), coherencia con HeroQuest y Baldur's Gate (10 %) y coste y riesgo de implantación (10 %; 5 = barato).

### 2.1 Sistema de personajes

| Estrategia | Difer. | Prof. | Claridad | Alcance | Coher. | Coste | Nota /100 |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| A. HeroQuest puro (Cuerpo, Mente y armas) | 2 | 2 | 5 | 2 | 4 | 5 | 62 |
| B. Seis atributos de D&D con dado de 20 encima de los dados de combate | 5 | 4 | 2 | 4 | 3 | 2 | 71 |
| C. Cinco virtudes resueltas con los mismos dados de calavera | 5 | 4 | 4 | 5 | 5 | 3 | 88 |
| D. Mazos de cartas por clase (estilo Gloomhaven) | 5 | 5 | 2 | 2 | 2 | 1 | 65 |
| E. Sin atributos, solo talentos | 3 | 3 | 4 | 2 | 3 | 4 | 63 |
| **F. C + talentos al acampar + reparto inicial** | **5** | **5** | **4** | **5** | **5** | **2** | **90** |

**Elegida: F.** La clave de C es usar un único lenguaje de dados para todo: el combate ya usa dados de calavera, así que una prueba de virtud es «tira tantos dados como tu virtud y necesitas tantas calaveras como la dificultad». No hay que aprender un segundo sistema (la gran pega de B) y la misma regla sirve para héroes, criaturas y PNJ. F añade la progresión de Baldur's Gate (talentos y reparto de puntos) sin cambiar ese lenguaje.

### 2.2 Dificultad

| Estrategia | Cambia cómo se juega | Transparente | Rejugable | Coste | Decisión |
| --- | :-: | :-: | :-: | :-: | --- |
| D1. Multiplicadores de vida y ataque (la anterior) | 1 | 5 | 1 | 5 | Se conserva, pero suave |
| D2. IA graduada: la Sombra piensa mejor | 5 | 4 | 4 | 3 | **Adoptada** |
| D3. Presagio: reloj de amenaza con monstruos errantes | 4 | 5 | 4 | 4 | **Adoptada** |
| D4. Reglas de caída (levantarse, heridas, desangrado) | 5 | 5 | 4 | 4 | **Adoptada** |
| D5. Dificultad dinámica oculta | 3 | 1 | 2 | 3 | Descartada: el jugador siente que el juego le hace trampas |

### 2.3 Inteligencia de las criaturas

| Estrategia | Personalidad | Rendimiento en móvil | Coste | Decisión |
| --- | :-: | :-: | :-: | --- |
| I1. Una fórmula para todos (la anterior) | 1 | 5 | 5 | Base |
| **I2. Utilidad modulada por Ingenio y rol, moral por Voluntad, liderazgo por Presencia** | **5** | **5** | **4** | **Adoptada** |
| I3. Guiones por criatura | 4 | 5 | 2 | Solo para jefes |
| I4. Búsqueda en árbol (minimax) | 3 | 1 | 1 | Descartada: lenta y opaca |

### 2.4 Orden de turno

Se comparó mantener las fases de HeroQuest (todos los héroes y luego la Sombra) con la iniciativa intercalada de Baldur's Gate. Se mantienen las fases porque permiten combinar a los tres héroes, son más claras en móvil y conservan el ritmo. La Agilidad recibe su peso por otro lado: movimiento, defensa y desenganche.

## 3. Solución adoptada

### 3.1 Las cinco virtudes (escala 1–6)

| Virtud | Qué gobierna | Don con 4 o más |
| --- | --- | --- |
| **Fuerza** | Vida, armas pesadas, romper cerraduras, resistir veneno y aturdimiento | *Brazo firme*: inmune a Aturdido; rompe cerraduras sin tirada (con ruido) |
| **Agilidad** | Movimiento, defensa, armas sutiles, ganzúas, desarmar trampas | *Desenganche*: no provoca ataques de oportunidad |
| **Ingenio** | Magia y Éter, registrar, descifrar sellos | *Saber arcano*: descifra sellos sin tirada; al registrar siempre encuentra algo |
| **Voluntad** | Determinación, resistir el miedo | *Temple*: inmune a Aterrado |
| **Presencia** | Arengar, convencer, intimidar, regatear, moral | *Aura de mando*: él y los aliados adyacentes son inmunes a Aterrado; arenga con un dado más |

| Héroe | FUE | AGI | ING | VOL | PRE | Carácter |
| --- | :-: | :-: | :-: | :-: | :-: | --- |
| Aldric, paladín | 4 | 2 | 2 | 3 | 4 | Fuerte y carismático. Sujeta la línea y sostiene la moral |
| Sera, exploradora | 2 | 5 | 3 | 3 | 2 | La más ágil. Se escurre, flanquea, abre cerraduras |
| Elian, tejedor del éter | 1 | 2 | 5 | 4 | 3 | El más listo y voluntarioso. Magia, curación, sellos |

### 3.2 Todo sale de las virtudes

| Estadística | Fórmula |
| --- | --- |
| Vida | 3 + Fuerza + vigor de clase (Aldric 3, Sera 2, Elian 2) |
| Movimiento | 3 + Agilidad |
| Dados de ataque | Arma + bonificación de su virtud (3–4: +1; 5: +2; 6: +3). Espada usa Fuerza; dagas, Agilidad; Saeta Arcana, Ingenio |
| Dados de defensa | Armadura + bonificación de Agilidad |
| Determinación | Voluntad |
| Éter (Elian) | Ingenio, +1 por ronda |

### 3.3 Pruebas

Se tiran tantos dados como la virtud; hay éxito si salen al menos tantas calaveras como la dificultad. La probabilidad se enseña siempre antes de elegir.

| Dados | Fácil (1) | Media (2) | Difícil (3) |
| :-: | :-: | :-: | :-: |
| 1 | 50 % | — | — |
| 2 | 75 % | 25 % | — |
| 3 | 88 % | 50 % | 13 % |
| 4 | 94 % | 69 % | 31 % |
| 5 | 97 % | 81 % | 50 % |
| 6 | 98 % | 89 % | 66 % |

### 3.4 Recursos

- **Determinación** (tanta como la Voluntad): tras una tirada propia se puede gastar un punto para repetir los dados fallados. Si un golpe va a derribar a un héroe, se gasta sola para repetir sus dados de defensa («Último aliento»). Se recupera al empezar cada capítulo.
- **Éter** (Elian): sus hechizos cuestan Éter en lugar de esperar turnos. Fuego Astral cuesta 3 y Luz de la Aurora 2; recupera 1 por ronda. Con el *Escudo de éter*, si le atacan gasta 1 de Éter para tirar un dado de defensa más: estar en primera línea le cuesta magia.

### 3.5 Posición

- **Flanqueo**: +1 dado si otro aliado está junto al objetivo (Sera, +2). Vale también para los enemigos.
- **Ataques de oportunidad**: alejarse de un enemigo cuerpo a cuerpo le da un golpe gratis con un dado menos (Aldric, con todos). Los ágiles (Agilidad 4+) se escurren. La ruta que propone el juego evita provocar si puede, y lo avisa si no.

### 3.6 Estados

Aterrado (−2 movimiento, −1 dado), Envenenado y Ardiendo (−1 PV por turno), Aturdido (pierde la acción), Inspirado (+1 dado), En guardia, Muro de escudos, Huyendo y Desangrándose.

### 3.7 Criaturas

Cada criatura tiene sus cinco virtudes, un rol (bruto, tirador, hostigador, lanzador, espectro, coloso…) y rasgos (no muerto, incorpóreo, cristal, veneno, aterrador, furia, líder…).

- **Ingenio → cómo piensa.** 1–2 *bestial*: va a por el más cercano y no le importa provocar. 3 *táctico*: elige al herido o al mal protegido, busca flanquear y evita provocar. 4–5 *astuto*: remata a quien ya está tocado, prefiere al mago, los tiradores se apartan del cuerpo a cuerpo y los sanadores curan.
- **Voluntad → moral.** Si cae un líder o la mitad de un grupo, cada superviviente hace una prueba de Voluntad de dificultad media (un dado más si tiene un líder cerca); si falla, huye dos turnos. Los no muertos y los gólems no huyen nunca; los trasgos, casi siempre.
- **Presencia → liderazgo.** Los líderes dan un dado de moral a sus aliados cercanos y su muerte siembra el pánico.
- **Debilidades.** Los no muertos temen la luz radiante (Juicio de Aldric); los espectros resisten las armas no mágicas; los gólems resisten dagas y magia arcana; Ignis resiste el fuego.

### 3.8 PNJ y conversaciones

Las escenas clave ofrecen opciones resueltas con una virtud y un héroe concreto, con su probabilidad a la vista:

- **Tomás (cap. I)**: Elian sostiene el eco con Ingenio o Aldric le ordena hablar con Presencia. Si sale bien, Sera resistirá a Isolde y el enemigo final llega más débil.
- **Thráin (cap. II)**: jurar con Presencia, leer las runas con Ingenio (Ignis pierde un dado de defensa) o registrar la tumba con Agilidad (oro, pero sin bendición).
- **Aethelgard (cap. III)**: convencerle con Presencia (difícil) o con el aviso de Osric si se leyó; si funciona, empieza debilitado y pierde su primer turno.
- **Isolde (final)**: prueba de Voluntad de todo el grupo; quien falla empieza el combate aterrado.

### 3.9 Progresión

- **Forja del grupo**: al empezar, cada héroe puede mover hasta 2 puntos entre sus virtudes.
- **Talentos**: en cada campamento, cada héroe elige uno de dos (12 en total). Algunos suben una virtud y otros cambian cómo lucha.
- **Velada**: cada noche en el campamento se elige una actividad resuelta con una prueba (rezar, explorar o estudiar el farol), con premio o coste para el capítulo siguiente.
- **Regateo**: la mejor Presencia del grupo abarata la tienda un 5 % por cada punto por encima de 2.

### 3.10 Dificultad

| | Relato | Héroe | Pesadilla |
| --- | --- | --- | --- |
| Cómo piensa la Sombra | Ingenio −1 | Según cada criatura | Ingenio +1 y campeones |
| Al caer | Te levantas solo al final de la ronda | Te levanta un aliado; quedas herido (−1 PV máx.) | Te desangras: 3 rondas para levantarte o se pierde el capítulo |
| Presagio | Cada 9 rondas | Cada 6 | Cada 5 |
| Héroes | +2 PV, +1 Determinación; pruebas más fáciles | Normal | Normal |
| Criaturas | Atacan con un dado menos | Normal | +1 PV; jefes +3 PV |
| Pociones al empezar | 3 | 2 | 2 |
| Campeones | — | — | 1 de cada 5 criaturas (+1 PV, +1 dado de ataque, más astuta) |

### 3.11 Presagio

Un contador (el ojo de la barra superior) crece cada ronda, al registrar, al lanzar bombas y al echar puertas abajo. Al llenarse, una criatura errante sube de la Hondura en una zona ya explorada, lejos del grupo. Se detiene durante los combates contra jefes.

### 3.12 Cerraduras y sellos

Siete puertas de la campaña están cerradas. Las cerraduras se abren con Agilidad (en silencio) o con Fuerza (con estruendo, +2 Presagio). Los sellos rúnicos, con Ingenio o con Voluntad (si falla, el sello muerde). El juego muestra la probabilidad de los tres héroes para que elijas quién lo intenta.

## 4. Mejoras de mecánica

| Problema | Solución |
| --- | --- |
| El tanque no protegía | Ataques de oportunidad + Baluarte de Aldric + Muro de escudos con provocación |
| Caer era gratis | Herida (−1 PV máx.) en Héroe y desangrado en Pesadilla |
| Oro excesivo | Botín reducido a la mitad, registro según Ingenio, regateo según Presencia |
| Malakor sin fin | Invocaciones limitadas por dificultad (4/6/8) y esqueletos alzados de 1 PV |
| Registrar era azar puro | Prueba de Ingenio: más calaveras, mejor botín |
| Desarmar era azar puro | Prueba de Agilidad; con 1 calavera no se dispara |
| Toques en falso en el móvil | Deshacer movimiento (si no se ha revelado nada) |
| Información escondida | Vista previa con todos los modificadores, virtudes y rasgos del enemigo, zona de amenaza y aviso de ataques de oportunidad |
| Pociones solo curaban | Ahora también curan el veneno; el elixir da Éter a Elian |

## 5. Resultados de las simulaciones

Mismo jugador automático que en el diagnóstico, con la versión nueva: cuatro campañas completas en Héroe, cuatro en Pesadilla (con los ajustes finales) y una en Relato. El jugador automático no es un humano: juega con criterio, pero provoca muchos más ataques de oportunidad de los que provocaría alguien que lea los avisos (Aldric, entre 12 y 81 por campaña), así que una persona encontrará Héroe algo más fácil y Pesadilla algo más alcanzable.

### 5.1 Antes y después

| Medida | Antes | Ahora |
| --- | --- | --- |
| Pesadilla | 0 capítulos superados | 3 de 4 campañas terminadas, perdiendo 1 o 2 capítulos por el camino; la cuarta cayó ante Isolde después de entregarle el farol, que la hace más fuerte |
| Héroe | Se ganaba sin tensión | 4 de 4 campañas terminadas sin perder ningún capítulo, pero con entre 0 y 13 caídas por campaña |
| Relato | 0 caídas | 5 caídas, todas con levantamiento automático; ninguna derrota |
| Oro tras el capítulo I | 480–690 | 184–206: da para una o dos compras, no para toda la tienda |
| Daño recibido en Héroe (3 campañas) | Aldric 69 frente a Sera 296 en una sola partida | Aldric 58 · Sera 55 · Elian 94 |
| Duración del capítulo I (Malakor) | Más de 160 rondas | 12–29 rondas |
| Pruebas de virtud por campaña | No existían | Unas 30 en Héroe; más en Pesadilla, donde se repiten capítulos |
| Pruebas de moral de las criaturas | No existían | Entre 4 y 11 por campaña; huyen en algo más de la mitad |

### 5.2 Cada héroe se nota

| | Aldric | Sera | Elian |
| --- | --- | --- | --- |
| Daño hecho (Héroe, 3 campañas) | 175 | 273 | 113 |
| Enemigos abatidos | 37 | 54 | 32 |
| Habilidad más usada | Muro de escudos (31) | Daga Sombría (35) | Fuego Astral (15) |
| Pruebas que más resuelve | Presencia: arengas y conversaciones | Agilidad: cerraduras y trampas | Ingenio: sellos, registros y conversaciones |

Las cinco virtudes se usan en las pruebas: en las tres campañas de Héroe hubo 25 de Presencia, 24 de Ingenio, 19 de Voluntad, 9 de Agilidad y 8 de Fuerza. La Determinación se ofreció 115 veces y se gastó 83.

### 5.3 Ajustes hechos a raíz de las simulaciones

| Lo que se vio | Ajuste |
| --- | --- |
| Elian caía demasiado (19 veces en una campaña de Héroe) | *Escudo de éter*: gasta Éter para defenderse. Después, entre 0 y 6 caídas por campaña |
| Pesadilla se atascaba en el capítulo II (4 derrotas seguidas) | 2 pociones en lugar de 1 y un campeón de cada 5 criaturas en lugar de 1 de cada 4 |
| La moral casi nunca entraba en juego (0 o 1 prueba por campaña) | La prueba pasa a dificultad media y cuenta desde grupos de dos |
| En Pesadilla el combate final se perdía casi siempre (3 victorias en 17 intentos) | Los jefes de Pesadilla conservan +3 PV pero ya no tiran un dado más. Después, Isolde cae en 3 de 4 campañas |
| Se ofrecía Determinación aunque el golpe ya matara | Solo se ofrece si el golpe no basta |
| En aparatos lentos la bandeja de dados se cerraba antes de ofrecer la repetición | La bandeja se vuelve a abrir para la oferta |
| En el móvil la barra superior se salía de la pantalla y tapaba el menú | Se quitan los botones redundantes (girar y centrar, que ya se hacen con gestos) y la Determinación y el Éter pasan a ser insignias sobre el retrato |

### 5.4 Límites de la verificación

Las partidas automáticas y las capturas se hicieron con un navegador sin tarjeta gráfica y sin sonido. Falta probar con calma en un móvil real: el rendimiento con gráficos altos, el audio y la sensación de juego de una persona.

## 6. Tutorial guiado

Con las cinco virtudes, la Determinación, el Éter y los ataques de oportunidad, el juego tiene ahora muchas más reglas. Para alguien que nunca ha jugado a rol, un texto de ayuda no basta.

### 6.1 Opciones valoradas

| Opción | Ventaja | Pega | Decisión |
| --- | --- | --- | --- |
| Manual de reglas («Cómo se juega») | Ya existía | Nadie lee antes de jugar | Se conserva como consulta |
| Consejos sueltos la primera vez que pasa algo | Ya existían | Llegan tarde y sin orden | Se conservan para la campaña |
| Primer capítulo «con ruedines» | No hay que salir de la historia | Mezcla aprender y jugar en serio | Descartada |
| **Sala de prácticas con pasos que esperan a que los hagas** | Se aprende haciendo, a tu ritmo y sin riesgo | Más trabajo de construcción | **Adoptada** |

### 6.2 Cómo funciona

- Se ofrece desde el título («Tutorial guiado · Recomendado») y desde la elección de dificultad hasta que se completa una vez.
- Es una sala propia, «La Sala de Armas», bajo la catedral: dos esqueletos y un arquero de prácticas, una puerta con cerradura, un cofre y un atril. Se juega con las reglas de Relato y no toca la partida guardada.
- Un panel enseña 21 pasos: el grupo, moverse, deshacer, mover la cámara, cambiar de héroe, abrir puertas, conocer al enemigo, atacar, los dados, habilidades y Éter, fin del turno y turno de la Sombra, Determinación, flanqueo y huida, limpiar la sala, la ficha de virtudes, cerraduras y pruebas, botín, acciones y objetos, y el Presagio.
- Cada paso espera a que lo hagas, con una flecha sobre el tablero o un anillo sobre el botón. Los pasos que son solo explicación tienen «Entendido» (o Intro en el ordenador).
- Las reglas que aparecen por sorpresa (un ataque de oportunidad, una oferta de Determinación, un héroe que cae, una cerradura que se resiste) se explican en el momento con una nota en el panel.
- Si un paso necesita una acción y ya no le queda a nadie, el panel lo dice y señala «Fin de turno». Siempre se puede «Saltar paso» o «Salir del tutorial», y desde la pausa, empezarlo de nuevo.
- En el móvil el panel va encima de la barra de acciones y se encoge cuando se abre la ficha de un enemigo.

### 6.3 Fallos corregidos de paso

| Fallo | Arreglo |
| --- | --- |
| En el móvil, la ficha del objetivo y la ruta marcada desaparecían nada más tocar: el navegador avisa de que el dedo «sale» del tablero tras cada toque | Ese aviso solo cuenta ya para el ratón. La ficha y la ruta se quedan hasta el siguiente toque |
| La ficha del grupo no cuadraba las cuentas: por ejemplo, «Vida 12» con un desglose que sumaba 10 | El desglose incluye la dificultad, las reliquias, los talentos y las veladas |
| La defensa de Elian se llamaba «Égida», igual que la Égida de plata de Aldric | Pasa a llamarse «Escudo de éter» |
| Al salir al inicio en mitad de un diálogo podía quedarse el modo cine, el latido de poca vida o el juego ocupado | El título lo limpia todo |
| El rótulo del lugar se transparentaba detrás de la pantalla de talentos al acampar | Los rótulos se ocultan al abrir cualquier pantalla |
| Los escritos solo se cerraban con el ratón o el dedo | También con Intro, Espacio o Esc |

### 6.4 Verificación

El tutorial se recorrió entero de forma automática con toques y clics reales, en ordenador (1280×720) y en móvil (390×844), sin errores. También se probaron salir a mitad, reiniciarlo desde la pausa, y comprobar que la partida guardada sigue intacta y que en la campaña vuelven los consejos normales. Después se repitieron cuatro campañas completas automáticas (Relato, Héroe ×2 y Pesadilla), todas terminadas sin errores, y pruebas de toques al azar en ordenador y móvil.

## 7. Bloque necesario (hoja de ruta, tareas 1–5)

| Tarea | Qué se hizo | Cómo se comprobó |
| --- | --- | --- |
| Guardado en cada ronda | Al empezar cada turno de los héroes se guarda todo el tablero: posición, vida, estados y recargas de cada héroe; criaturas vivas (también las convocadas y las errantes); puertas, cerraduras, salas, cofres, trampas, escritos; Presagio, jefe y luces. «Continuar» muestra el capítulo y la ronda y vuelve exactamente a ese punto | Partidas automáticas cortadas en cuatro momentos (capítulos I, II y III, una de ellas con Malakor en pie): al recargar, el tablero coincide campo a campo con lo guardado |
| Velocidad real | Las animaciones van por reloj aunque el aparato dé pocas imágenes por segundo (antes, por debajo de 20 iban a cámara lenta). Nuevo nivel de calidad «Mínima» y la calidad automática baja hasta él | Medición con la CPU frenada a la cuarta parte |
| Sin conexión e instalable | El motor 3D y las cuatro tipografías van dentro de `index.html`. En GitHub Pages hay manifiesto, iconos y un trabajador sin conexión que guarda el juego al abrirlo | Carga con la red cortada; registro del trabajador, caché y recarga sin conexión en un servidor local |
| Equilibrio | Ignis da 50 de oro en lugar de 80 y el botín de la tumba de Thráin 40 en lugar de 60. En Pesadilla, entregar el farol refuerza a Isolde con +2 PV en lugar de +4 | Oro ganado en el capítulo II: 248–274 (antes 278–466). Pesadilla con el farol entregado: dos campañas ganadas, tras 3 y 4 derrotas (antes, perdida tras 7) |
| Lectura | Ajustes «Tamaño de letra» (normal, grande, muy grande) y «Alto contraste» | Capturas en ordenador y móvil |

El juego pesa ahora unos 1,5 MB porque lleva dentro el motor 3D y las letras; a cambio no depende de nada externo.


## 8. Salto de calidad (hoja de ruta, tareas 6–8)

### 8.1 Equipo que exige virtudes

La tienda deja de vender «mejoras» y pasa a ser una **armería**: cada pieza ocupa un hueco (mano, cuerpo o extra), pide una virtud mínima y se elige quién la lleva. Así, el reparto de virtudes de la forja y los talentos deciden también qué equipo puede usar cada héroe.

| Pieza | Hueco | Requisito | Efecto |
| --- | --- | --- | --- |
| Reliquias de cada héroe (Hoja de Vaelmont, Colmillos gemelos, Báculo del Alba, Martillo de la Forja Madre, Salterio de plata…) | Según la pieza | La virtud principal del héroe a 4 o 5 | Como antes: +1 dado, arma mágica, más alcance o más curación |
| Coraza de placas | Cuerpo | Fuerza 5 | +2 defensa, −1 movimiento |
| Brigantina remachada | Cuerpo | Fuerza 3 | +1 defensa |
| Guanteletes de hierro | Extra | Fuerza 4 | +1 dado cuerpo a cuerpo |
| Botas de zancada | Extra | Agilidad 4 | +1 movimiento |
| Ganzúas enanas | Extra | Agilidad 3 | +2 dados para cerraduras y trampas (antes eran de todo el grupo; ahora, de quien las lleve) |
| Amuleto de la Llama | Extra | Voluntad 4 | +1 Determinación |
| Grimorio de cenizas | Extra | Ingenio 5 | +1 dado en Ingenio, +1 Éter |
| Sello de la Orden | Extra | Presencia 4 | +1 dado al arengar y 5 % más de rebaja |

Lo que se cambia de hueco vuelve al **arcón** y se puede dar a otro. Si un héroe deja de cumplir un requisito, la pieza vuelve sola al arcón. La ficha del grupo muestra el equipo y de dónde sale cada número. Las provisiones tienen tope por mochila (6 pociones, 3 elixires, 4 bombas). Las partidas guardadas antiguas se convierten: las reliquias pasan a su héroe y las ganzúas a Sera.

### 8.2 Dos héroes nuevos (solo en el modo Descenso)

La campaña conserva el trío porque la historia gira en torno a ellos. En el Descenso se eligen 3 de 5:

- **Brunna Martillo-de-Ceniza**, guardiana de la forja (Fuerza 5, Agilidad 1). Sus golpes cuerpo a cuerpo ignoran un escudo. *Golpe sísmico*: martillazo que además puede aturdir a los enemigos cercanos. *Piel de yunque*: absorbe el siguiente golpe y atrae a los enemigos.
- **Nyra del Valle**, cantora de la Orden (Presencia 5). Ataca con honda a 4 casillas, arenga con un dado más y los enemigos cercanos aguantan peor la moral. *Himno de batalla*: inspira, quita el miedo y cura 1 PV al grupo cercano. *¡Atrás!*: una prueba de Voluntad que hace huir a una criatura.

Cada una tiene miniatura, retrato, frases propias y dos rangos de talentos.

### 8.3 Modo Descenso

Mazmorras que se generan solas, nivel a nivel, sin final. Se elige dificultad y grupo, se reparten virtudes y se baja.

- **Generador.** Cada nivel es una cuadrícula de 6 a 12 salas con tamaños al azar; algunas se unen en salas grandes. Un árbol une todas las salas y se añaden una o dos puertas de más para dar rodeos. La entrada está en una esquina y la escalera de salida en la sala más alejada. Columnas, bloques y fosas solo se colocan si no cortan el paso (se comprueba casilla a casilla), y delante de cada puerta nunca hay nada. Cofres en esquinas de salas sin salida, trampas, escritos, cerraduras en la puerta de la salida y criaturas según la profundidad.
- **Semilla.** Cada partida tiene una semilla. El mismo nivel sale siempre igual, así que «repetir el nivel» y «continuar» encuentran exactamente la misma mazmorra.
- **Tramos de cuatro niveles.** Cripta, forja y vacío, por turnos. El cuarto nivel de cada tramo tiene guardián (Malakor, Ignis o Aethelgard) y, tras él, **campamento**: descanso completo, talentos (dos rangos) o, más adelante, +1 a una virtud, y la armería.
- **Entre niveles** se conservan la vida y las heridas, con 2 PV de respiro; los caídos bajan con el grupo.
- **Escalera.** Brilla y tiene luz propia. Se baja tocándola, sin enemigos a la vista; así se puede elegir entre explorar por botín o bajar ya.
- **Velas.** Relato 5, Héroe 3, Pesadilla 1. Al caer se apaga una y se repite el nivel desde su comienzo; sin velas, termina el descenso. Salir al inicio no la devuelve.
- **Dificultad creciente.** Más criaturas cada nivel, campeones cada vez más frecuentes (hasta el 30 %), +1 PV a partir del nivel 7 y del 13, +1 de ataque a partir del 11, guardianes más duros en cada vuelta. El oro rinde menos que en la campaña porque solo se gasta al acampar.
- **Récord** de profundidad en la pantalla de inicio y en la pantalla final. Guardado propio, también en cada ronda, independiente de la campaña.

### 8.4 Verificación

| Prueba | Resultado |
| --- | --- |
| Partidas automáticas del Descenso, tras el ajuste final | Relato: llega al nivel 12 sin perder ninguna vela. Héroe: dos partidas, ambas hasta el nivel 11 (primera vela perdida en el guardián del nivel 8). Pesadilla: nivel 8 |
| Antes del ajuste (sin subida de dificultad) | Héroe llegaba al nivel 15 sin una sola derrota y con 2.700 de oro sin gastar: demasiado fácil |
| Guardado en cada ronda en el Descenso | Cortes en los niveles 1, 2 y 4 (con el guardián en pie): al recargar, mismo mapa y tablero idéntico campo a campo |
| Generador | 960 niveles (60 semillas × 16 niveles) comprobados uno a uno: todos conectados, con salida, inicio y guardián donde toca, puertas bien orientadas y libres, cofres y escritos alcanzables. Media de 11 criaturas por nivel (máximo 16); mapas de 21×15 casillas de media |
| Armería | Compra, requisitos («Sera necesita Fuerza 3»), cambio de hueco y arcón comprobados en ordenador y móvil |
| Campaña y tutorial | Una campaña completa automática y el tutorial guiado, sin errores |

## 9. Salto visual (tarea 9)

Las miniaturas ya tenían modelado propio, animaciones de golpe y caída, luz dinámica, bruma y partículas. El salto se centró en lo que más se nota a la distancia de juego y casi no cuesta en el móvil:

- **Miniaturas pintadas.** Un sombreado propio para todas las figuras: los huecos se oscurecen, lo alto recibe un toque de «pincel seco» y un contraluz recorta la silueta contra el suelo. El héroe en turno tiene un contraluz más intenso que late. Al recibir un golpe la figura destella; al curarse, destello verde. Respiran levemente.
- **Golpes con tajo.** Cada ataque cuerpo a cuerpo dibuja un arco de luz del color del atacante delante de él.
- **Ondas en el suelo** para golpes de área, explosiones, escudos, invocaciones, curaciones y el Himno de Nyra.
- **Paredes con vida.** Cada sala recibe uno a tres adornos según el lugar: estandartes raídos, estantes con calaveras y cadenas en la cripta; panoplias con hachas, tuberías y estandartes en la forja; racimos de cristal y círculos de runas que giran en el vacío. Nunca junto a las antorchas ni al lado de una puerta.
- **Rayos de luz** que caen de grietas del techo sobre algunas salas grandes, con su charco de luz (solo en calidad media y alta).
- **La escalera se ve:** el suelo tiene ahora un hueco con pozo y peldaños; la de salida del Descenso brilla y tiene luz propia.

Rendimiento: los adornos se unen en una sola malla por material. Con un capítulo entero a la vista, las llamadas de dibujo pasan de 584 a 603 en calidad baja (+3 %) y de 746 a 800 en media (+7 %, con los rayos de luz).

## 10. Cooperativo en el mismo aparato (tarea 10)

- Al empezar (campaña o Descenso) se elige cuántos juegan en este aparato: 1, 2 o 3. Con más de uno, cada jugador escribe su nombre y elige qué héroes lleva; nadie puede quedarse sin héroe.
- Cuando le toca a un héroe de otro jugador, una pantalla tapa el tablero: «Turno de Ana. Pásale el aparato a Ana». Se sigue con un botón, Intro o Espacio. Mientras está abierta no se puede tocar nada del tablero.
- Cada jugador mueve todos sus héroes antes de pasar el aparato, y cada ronda empieza un jugador distinto para que nadie abra siempre.
- El retrato de cada héroe lleva el nombre de su jugador (en el móvil, su inicial en un círculo de color). Los talentos y dones del campamento también lo indican.
- Desde la pausa, «Jugadores en este aparato» permite cambiar nombres, reparto o número de jugadores a mitad de partida (por ejemplo, si alguien se va).
- El reparto se guarda con la partida: al continuar, lo primero es la pantalla de paso para quien tenga el turno.

## 11. Rediseño: cinco héroes clásicos y un juego más directo

### 11.1 Lo que se pidió

- En el móvil, la acción de buscar tesoro abría un menú de cuatro opciones y había ataques que parecían repetidos. Demasiado complicado.
- Elegir con cuántos héroes se juega en el mapa (de 1 a 5) y cuáles, con cinco héroes bien diferenciados al estilo clásico; que cada aventura recomiende un grupo.
- Más sencillo pero adictivo y fluido, y comprobar que el juego sigue compensado.

### 11.2 Decisiones

| Pregunta | Opción elegida |
| --- | --- |
| Héroes | Clásicos: Bárbaro, Enano, Elfa arquera, Hechicero y Amazona |
| Controles | Intermedio: Atacar + 2 habilidades distintas, con Buscar y Objetos a la vista |
| Virtudes | Quitarlas del todo: vida, ataque, defensa y movimiento, como en HeroQuest |
| Varios jugadores en el mismo aparato | Quitarlo del todo |

### 11.3 Reglas vigentes

- **Cuatro números por héroe:** vida, dados de ataque, dados de defensa y movimiento (más el alcance de los que disparan). El equipo y los talentos los suben.
- **Barra de acciones:** Atacar · Habilidad 1 · Habilidad 2 · Buscar · Objetos · Fin de turno. Cada habilidad tiene una recarga en rondas; la del Salto élfico no gasta la acción.
- **Los cinco héroes:**

| Héroe | Vida · Ataque · Defensa · Mov. | Rasgo | Habilidades |
| --- | --- | --- | --- |
| Korvak, Bárbaro | 11 · 3 · 2 · 6 | Sin miedo; +1 dado con media vida o menos | Torbellino (todos los de al lado) · Grito de guerra (aterra y cura 2) |
| Borin, Enano | 10 · 2 · 3 · 5 | Ignora 1 escudo; abre cerraduras y desarma trampas sin tirar | Martillo sísmico (golpe y aturde alrededor) · Muralla (+2 defensa y atrae enemigos) |
| Lyriel, Elfa arquera | 7 · 2 · 2 · 7, alcance 6 | Ve las trampas a 2 casillas | Lluvia de flechas (zona 3×3) · Salto élfico (5 casillas, sin gastar acción) |
| Aldebrán, Hechicero | 6 · 2 · 2 · 5, alcance 5 | Ataques mágicos; abre los sellos sin tirar | Bola de fuego (objetivo y los de al lado) · Luz sanadora (cura o levanta) |
| Thalia, Amazona | 9 · 3 · 2 · 6, alcance 2 | Lanza: golpea a 2 casillas | Carga (corre 5 casillas y golpea +1) · Grito de la tribu (+1 dado y +2 mov. al grupo) |

- **Cerraduras y sellos:** una sola acción, sin menú. Se tiran 3 dados y las calaveras se van sumando entre intentos hasta llegar a 2 (cerradura) o 3 (sello). La cerradura hace ruido (+1 Presagio); el sello muerde si no sale ninguna calavera (−1 PV).
- **Trampas:** 2 dados, basta una calavera para desarmarla; sin ninguna, salta.
- **Buscar:** una acción, una vez por sala y sin enemigos dentro. Revela las trampas y tira el Dado del Tesoro (ver 12.3). Hace ruido (+1 Presagio).
- **Sin ataques de oportunidad:** moverse es libre. Se mantiene el flanqueo (+1 dado).
- **Moral:** cuando cae un líder enemigo (o la mitad de su grupo), cada criatura cercana huye con un 50 %; los cobardes siempre.
- **Historia:** cada frase la dice el primer héroe del grupo que tenga una propia; si no, quien lleva el farol (el primero que eliges). Algunas opciones necesitan a un héroe concreto (Thráin habla con el Enano; descifrar el cuaderno de Osric pide al Hechicero). El final aterra a todos menos al Bárbaro, salvo que hayáis escuchado a Tomás.

### 11.4 Grupo de 1 a 5

- Se elige al empezar la campaña o el Descenso, y en cada campamento se puede cambiar quién baja. Quien entra nuevo elige sus talentos en ese momento.
- Cada capítulo recomienda un grupo con su motivo (por ejemplo, criptas de no muertos: Hechicero, Amazona y Bárbaro), con un botón para usarlo.
- Los mapas están pensados para 3. El número de criaturas de cada sala se multiplica por 0,45 · 0,6 · 1 · 1,2 · 1,4 según bajen 1 a 5 héroes (y la vida de los jefes por 0,55 · 0,8 · 1 · 1,2 · 1,4). Las criaturas extra aparecen junto a las del mapa, en su misma sala.
- **En solitario:** +4 de vida, +1 dado de ataque y otro de defensa, una poción más, el Presagio tarda 3 rondas más y, una vez por capítulo, el héroe se levanta con media vida en vez de caer («Último en pie»). Con dos héroes, el Presagio tarda 1 ronda más.
- La dificultad Héroe multiplica además las criaturas por 1,2 y Pesadilla por 1,05 (que ya suma un punto de vida a cada criatura y los campeones).

### 11.5 Simulaciones y ajustes

Se jugó la campaña completa con el jugador automático (elige objetivos por probabilidad, usa habilidades con criterio sencillo, levanta a los caídos y compra en la tienda) en distintas combinaciones de grupo y dificultad. «Derrotas» son las veces que hubo que repetir un capítulo; «caídas», las veces que un héroe llegó a 0 PV.

Primera tanda, con las reglas nuevas tal cual: en Héroe, con 3 héroes, los capítulos I y II pasaban sin una sola caída, y en solitario era imposible pasar del capítulo I (7 derrotas seguidas). Ajustes que salieron de ahí:

- Héroe ×1,2 criaturas y Pesadilla ×1,05 (que ya suma +1 de vida a cada criatura, campeones y criaturas más listas). Con ×1,35 un grupo frágil en Pesadilla se atascaba en el capítulo I.
- Ayudas en solitario (vida, ataque, defensa, poción, Presagio más lento, «Último en pie»).
- Dúo ×0,6 y grupos de 4 y 5 en ×1,2 y ×1,4: con ×1,5, cinco héroes en Pesadilla se atascaban en el capítulo II, porque con cinco hay más héroes que se pueden desangrar.
- Una derrota solo puede contarse una vez por intento (dos avisos a la vez podían provocar una segunda derrota justo al reintentar).

Resultados con los valores finales:

| Grupo | Dificultad | Derrotas | Caídas | Resultado |
| --- | --- | --- | --- | --- |
| Bárbaro solo | Pesadilla | 0 | 0 | Campaña completa |
| Elfa sola | Héroe | 3 | 0 | Campaña completa |
| Amazona y Hechicero | Héroe | 1 | 3 | Campaña completa |
| Enano, Elfa y Amazona | Héroe | 2 | 21 | Campaña completa |
| Hechicero, Amazona y Bárbaro (recomendado) | Pesadilla | 0 | 22 | Campaña completa |
| Amazona, Elfa y Hechicero (todos frágiles) | Pesadilla | 6 | 14 | Campaña completa |
| Cuatro héroes | Pesadilla | 0 | 22 | Campaña completa |
| Los cinco | Héroe | 0 | 2 | Campaña completa |
| Los cinco | Pesadilla | 0 | 17 | Campaña completa |
| Enano, Elfa y Amazona, Descenso | Héroe | — | — | Hasta el nivel 8 (segundo guardián) |
| Amazona, Enano y Hechicero, Descenso | Pesadilla | — | — | Hasta el nivel 7 con su única vela |

Lectura: el grupo recomendado se nota (en Pesadilla, 0 derrotas frente a 6 con un grupo sin nadie que aguante en primera fila), en solitario se puede terminar pero cuesta según el héroe, y bajar los cinco es la forma más cómoda de jugar. Hay bastante variación de una partida a otra con el mismo grupo (dados), así que estos números orientan, no son exactos.

### 11.6 Verificación

- Tutorial completo en ordenador y en móvil, con los pasos nuevos (Lyriel, Bola de fuego del Hechicero, cerradura por intentos, Buscar).
- Pantallas en ordenador, móvil en vertical y móvil en horizontal: elección del grupo, barra de acciones, ficha, campamento con cuatro y cinco héroes, talentos, velada y tienda.
- Partidas guardadas en mitad de una ronda (campaña y Descenso) que se reanudan igual. Las partidas guardadas con las reglas anteriores no se cargan (usaban virtudes); el juego las ignora sin fallar.
- Tocar una puerta, cofre o escrito lejano ahora acerca al héroe todo lo que pueda, en lugar de decir «fuera de alcance».

## 12. Dados en el tablero, Dado del Destino y Dado del Tesoro

### 12.1 Lo que se pidió

- Estudiar qué sistema de dados conviene (partiendo de un análisis de los dados de HeroQuest) y ver en pantalla cómo se tiran los dados en cada tirada, que se vea el resultado y que el juego actúe en consecuencia.
- Probarlo antes en un laboratorio aparte (lab/dados) y, una vez caen los dados, que salga en pantalla simplemente el resultado.

### 12.2 Decisiones

| Pregunta | Opción elegida |
| --- | --- |
| Sistema de dados | El clásico (calavera 3 de 6, escudo blanco 2 de 6, escudo negro 1 de 6) más un Dado del Destino dorado |
| Máscara trágica | Sí: hace ruido (+1 Presagio) |
| Dónde caen | Sobre el tablero, junto a la pelea |
| Movimiento | Fijo, como hasta ahora (sin tirar 2D6) |
| Buscar | Con un Dado del Tesoro |

El laboratorio comparaba tres sistemas con los mismos héroes y enemigos: el clásico, el clásico con Dado del Destino y los dados de máscaras que proponía el análisis (cada dado de combate con caras de comedia y tragedia). El tercero obliga a leer y aplicar un efecto en casi cada tirada; el Dado del Destino deja el combate igual de legible y añade un momento por ataque.

### 12.3 Reglas

- **Dado del Destino:** 2 caras de máscara alegre, 1 de máscara triste y 3 lisas. Lo tira el héroe en cada acción de ataque (ataque básico o habilidad de ataque; en las que golpean a varios, solo con el primero). Los enemigos no lo tiran.
- **Máscara alegre:** un premio propio de cada héroe. Si no se puede aplicar (no hay a quién, no cabe, no hay nada que recargar), el héroe queda Inspirado (+1 dado en su próximo ataque).

| Héroe | Premio |
| --- | --- |
| Bárbaro | **Rebote:** 1 dado de ataque contra otro enemigo junto al objetivo (o contra el mismo si no hay otro) |
| Enano | **Empujón:** el objetivo retrocede una casilla, si está libre (los jefes no se mueven) |
| Elfa | **Paso ligero:** +2 de movimiento este turno |
| Hechicero | **Chispa:** la habilidad con más recarga estará lista una ronda antes |
| Amazona | **¡Conmigo!:** el aliado más cercano a 3 casillas o menos (o ella misma) queda Inspirado |

- **Máscara triste:** +1 Presagio. Contra un jefe, cuando el Presagio ya no corre, el héroe pierde el movimiento que le quedaba.
- **Presagio con dos marcas más** (Relato 11, Héroe 8, Pesadilla 7), porque las máscaras tristes también lo llenan: con tres héroes sale una máscara triste cada dos rondas, más o menos.
- **Dado del Tesoro (Buscar):** oro (2 caras, 10–20 monedas), poción (y 6–14 monedas), objeto (elixir, bomba o poción, y 12–24 monedas), nada y peligro (la mitad de las veces un dardo, −1 PV; la otra mitad el ruido trae un monstruo errante). En el tutorial, la cara de peligro cuenta como oro. Las búsquedas especiales de la historia siguen igual.

### 12.4 Cómo se ve

- El juego decide la tirada primero y los dados 3D solo la muestran: cada dado cae con la cara decidida hacia arriba y el dibujo derecho para la cámara.
- Caen delante de la pelea (hacia la cámara): los del atacante en su lado de la pantalla y los del defensor en el otro, con el dado dorado delante. Nunca encima de muros, salas sin descubrir ni figuras; si delante no hay sitio, detrás. Si la zona queda fuera de la pantalla, la cámara se acerca.
- Los dados de los héroes son de marfil y los de los enemigos rosados, para distinguirlos.
- Al pararse: las calaveras brillan en naranja, los escudos que cuentan en azul y el resto se apaga. Cada escudo lanza una chispa azul a una calavera y las dos se apagan; las que quedan encendidas son el daño.
- **Cartel del resultado:** arriba en el centro (en el móvil en vertical, abajo junto a los botones, y encima del panel del tutorial si está abierto). Dice quién ataca a quién y con qué, los modificadores (+1 Flanqueo…), «calavera ×N − escudo ×M = daño», los escudos que no cuentan (rompe-escudos, tiro certero) y la máscara del Destino, que se completa con lo que ha pasado de verdad.
- Cerraduras, sellos y trampas tiran sus dados igual, con un cartel de «hacen falta N calaveras» y lo que se lleva acumulado.
- Los dados y el cartel desaparecen a los dos segundos o al empezar la siguiente tirada. Los sombreadores de los dados se preparan al cargar cada nivel para que la primera tirada no dé un tirón.

### 12.5 Simulaciones y ajustes

Mismo jugador automático que en 11.5. No aprovecha el movimiento extra de la Elfa (Paso ligero) y sí todo lo demás, así que con jugadores de verdad el Destino ayuda algo más de lo que se ve aquí.

Primera tanda, con el Presagio como antes: el grupo frágil en Pesadilla (Amazona, Elfa y Hechicero) se atascó en el capítulo I con 7 derrotas. Las máscaras tristes llenaban el Presagio bastante más deprisa y salían más monstruos errantes. De ahí las dos marcas más. Con ellas, los errantes por ronda vuelven a lo de antes o algo menos.

Resultados con los valores finales (dos partidas cuando la primera se salía de lo habitual):

| Grupo | Dificultad | Derrotas | Resultado | Antes (11.5) |
| --- | --- | --- | --- | --- |
| Bárbaro solo | Pesadilla | 0 | Campaña completa | 0 |
| Elfa sola | Héroe | 7 | Atascada en el capítulo I | 3 (en otras dos partidas, atascada en el II) |
| Amazona y Hechicero | Héroe | 5 · 0 | Campaña completa las dos veces | 1 |
| Enano, Elfa y Amazona | Héroe | 4 · 0 | Campaña completa las dos veces | 2 |
| Hechicero, Amazona y Bárbaro (recomendado) | Pesadilla | 3 · 1 | Campaña completa las dos veces | 0 |
| Amazona, Elfa y Hechicero (todos frágiles) | Pesadilla | 4 | Campaña completa | 6 |
| Los cinco | Pesadilla | 1 | Campaña completa | 0 |
| Amazona, Enano y Hechicero, Descenso | Pesadilla | — | Hasta el nivel 4 las dos veces | Entre el 2 y el 7 |

Lectura: con las dos marcas más, el juego queda en la misma franja que antes. Las diferencias entre dos partidas del mismo grupo (5 derrotas y luego 0) son mayores que las que trae el Destino. La Elfa sola sigue siendo la forma más difícil de jugar, y depende mucho de la suerte.

### 12.6 Verificación

- Prueba propia de los dados en ordenador y en móvil en vertical: ataque de cerca y a distancia, tirada enemiga, máscara alegre con los cinco héroes (Rebote, Empujón, Paso ligero, Chispa y ¡Conmigo!, y el caso en que no se puede aplicar), máscara triste, cerradura con lo acumulado y búsqueda. Sin errores; los dados y el cartel se recogen solos.
- Tutorial completo en ordenador y en móvil, con el paso nuevo «El Dado del Destino».
- Partidas guardadas en mitad de una ronda (campaña y Descenso) que se reanudan igual.
- Campaña completa con el jugador automático en las combinaciones de 12.5, sin errores.
