# UMBRAL · Estudio de diseño: personajes, dificultad y mecánica

Este documento recoge el análisis de la versión anterior, las estrategias que se compararon para darle profundidad de juego de rol (al estilo de HeroQuest y Baldur's Gate) y la solución que se implantó.

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

