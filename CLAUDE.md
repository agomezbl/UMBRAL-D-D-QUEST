# UMBRAL — ficha para Claude

Mazmorra táctica 3D por turnos estilo HeroQuest, **ocio con saber dentro**, **PEGI 7**, en **español y francés** (v1.2 beta): 5 héroes, campaña de 3 capítulos y modo Descenso.
En Curionauta: `/juegos/umbral/` (clave `umbral.save.v3`). Detalle de carpetas en `README.md` y diseño en `DISENO.md`.

## Construir
- Código en `src/` (`src/js/10_rules.js` equilibrio, `10_story.js` historia, `10_descent.js` generador).
- `python build.py` genera `index.html`, `sw.js` y `manifest.webmanifest`; subir los tres a `main`.
- Decisiones: sin virtudes ni cooperativo en el mismo aparato; app Android solo cuando la web esté bien.
- Textos: siempre `L('español', 'français')` (ver `src/js/00_i18n.js`). Todo nuevo texto en los dos idiomas y apto para PEGI 7 (sin sangre ni muertes explícitas).
- Aspecto de las salas (v1.2): `src/js/07_salas.js` (estilos), `src/js/06_deco*.js` (piezas; ver la cabecera de `06_deco.js` y probarlas con `python3 lab/atrezo/foto.py`), `TEX.floorKind`/`TEX.decals` en `04_textures.js` y la luz horneada en `05_bake.js`. Detalle en `DISENO.md` §14.
- Capa de saber en `src/js/10_saber.js` (Ojo de Tahúr, Dilema y Crónica de la noche). Reglas en `DISENO.md` §13: saber da ventaja, no saber nunca castiga, nada bloquea el paso. Historial en `CAMBIOS.md`.

## Cómo trabajar con Alejandro
- Escribe en **español**, para alguien que **no programa**: pasos numerados, sin jerga, y di qué botón pulsar.
- Pregunta antes de construir algo grande o caro de rehacer; lo pequeño, hazlo directamente.
- Nivel de producto profesional: probar en navegador real (PC y móvil) antes de dar algo por terminado.
- Idiomas: **francés y español** como mínimo (público: Francia y España); inglés más adelante.
- Diseño para niños: sin ansiedad, sin perseguir al niño, sin publicidad ni rastreadores.
- Los repositorios son **públicos**: nada de datos personales de la familia ni del niño.
- **Nunca** guardes ni pidas claves secretas en el chat o en el repositorio (ElevenLabs, Gemini, `service_role` de Supabase).
  Las claves van como secretos de GitHub Actions. La clave `sb_publishable_…` de Supabase sí es pública.
- Commits: `git -c user.name="agomezbl" -c user.email="agomezbl@users.noreply.github.com" commit …`.
- Después de publicar un cambio aquí, la web **curionauta** no se actualiza sola: hay que subir un commit
  (aunque sea vacío) a `agomezbl/curionauta` para que Cloudflare vuelva a montarla.
