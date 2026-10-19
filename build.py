"""Une todo src/ en un único index.html que funciona sin conexión.

El motor 3D (three.js) y las tipografías van dentro del archivo, así que no hace
falta internet para jugar. También genera sw.js, que permite instalar el juego
en el móvil y abrirlo sin conexión cuando se juega desde GitHub Pages.
"""
import base64, glob, hashlib, json, os

R = os.path.dirname(os.path.abspath(__file__))
S = f'{R}/src'
css = open(f'{S}/style.css', encoding='utf-8').read()
body = open(f'{S}/body.html', encoding='utf-8').read()
js = '\n'.join(open(f, encoding='utf-8').read() for f in sorted(glob.glob(f'{S}/js/*.js')))

# --- motor 3D (three.js r147 y posprocesado), incrustado ---
LIBS = ['three.min.js', 'CopyShader.js', 'LuminosityHighPassShader.js', 'Pass.js', 'ShaderPass.js', 'MaskPass.js',
        'EffectComposer.js', 'RenderPass.js', 'UnrealBloomPass.js']
vendor = '\n'.join(open(f'{S}/vendor/three/{n}', encoding='utf-8').read().replace('</script', '<\\/script') for n in LIBS)

# --- tipografías, incrustadas como @font-face ---
FONTS = [
    ('Alegreya Sans SC', 500, 'normal', 'alegreya-sans-sc-latin-500-normal'), ('Alegreya Sans SC', 700, 'normal', 'alegreya-sans-sc-latin-700-normal'),
    ('Alegreya Sans', 400, 'normal', 'alegreya-sans-latin-400-normal'), ('Alegreya Sans', 400, 'italic', 'alegreya-sans-latin-400-italic'),
    ('Alegreya Sans', 500, 'normal', 'alegreya-sans-latin-500-normal'), ('Alegreya Sans', 700, 'normal', 'alegreya-sans-latin-700-normal'),
    ('Grenze Gotisch', 500, 'normal', 'grenze-gotisch-latin-500-normal'), ('Grenze Gotisch', 700, 'normal', 'grenze-gotisch-latin-700-normal'),
    ('Grenze Gotisch', 900, 'normal', 'grenze-gotisch-latin-900-normal'),
    ('IM Fell English', 400, 'normal', 'im-fell-english-latin-400-normal'), ('IM Fell English', 400, 'italic', 'im-fell-english-latin-400-italic'),
]
def face(fam, w, st, f):
    b64 = base64.b64encode(open(f'{S}/vendor/fonts/{f}.woff2', 'rb').read()).decode()
    return f"@font-face{{font-family:'{fam}';font-style:{st};font-weight:{w};font-display:swap;src:url(data:font/woff2;base64,{b64}) format('woff2')}}"
fontcss = '\n'.join(face(*f) for f in FONTS)

meta = ('<title>Umbral</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'
        '<meta name="description" content="Umbral: crónicas de la Última Llama. Táctica por turnos en 3D con dados, historia y sustos.">\n'
        '<link rel="manifest" href="manifest.webmanifest">\n<link rel="icon" href="icon-192.png">\n<link rel="apple-touch-icon" href="apple-touch-icon.png">\n'
        '<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n'
        '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n<meta name="apple-mobile-web-app-title" content="Umbral">')
head = f'{meta}\n<style>\n{fontcss}\n{css}\n</style>'
# Registro del modo sin conexión: solo cuando el juego se abre como página propia (no dentro de otra web)
swreg = ("<script>\n(function () { try { if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost') && window.top === window)"
         " window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); }); } catch (e) {} })();\n</script>")
app = f"<script>\n(function () {{\n'use strict';\n{js}\n}})();\n</script>"
html = (f'<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n'
        f'<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">\n'
        f'<meta name="theme-color" content="#0b0908">\n{head}\n</head>\n<body>\n{body}\n<script>\n{vendor}\n</script>\n{app}\n{swreg}\n</body>\n</html>\n')
open(f'{R}/index.html', 'w', encoding='utf-8').write(html)

# --- instalación en el móvil ---
manifest = {
    'name': 'Umbral · Crónicas de la Última Llama', 'short_name': 'Umbral', 'lang': 'es',
    'description': 'Mazmorra táctica por turnos en 3D con dados de calavera.',
    'start_url': './', 'scope': './', 'display': 'fullscreen', 'orientation': 'any',
    'background_color': '#0b0908', 'theme_color': '#0b0908',
    'icons': [{'src': 'icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any maskable'},
              {'src': 'icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any maskable'}]}
open(f'{R}/manifest.webmanifest', 'w', encoding='utf-8').write(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')

# --- trabajador sin conexión: la versión cambia con cada index.html nuevo ---
ver = hashlib.sha1(html.encode()).hexdigest()[:10]
sw = f"""// Umbral sin conexión. Generado por build.py: no editar a mano.
const CACHE = 'umbral-{ver}';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', (e) => {{ e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); }});
self.addEventListener('activate', (e) => {{ e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); }});
self.addEventListener('fetch', (e) => {{
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // La página: primero la red (así llegan las actualizaciones) y, sin conexión, la copia guardada
  if (req.mode === 'navigate') {{
    e.respondWith(fetch(req).then((r) => {{ const cp = r.clone(); caches.open(CACHE).then((c) => c.put('./index.html', cp)); return r; }}).catch(() => caches.match('./index.html')));
    return;
  }}
  e.respondWith(caches.match(req).then((m) => m || fetch(req)));
}});
"""
open(f'{R}/sw.js', 'w', encoding='utf-8').write(sw)
print('index.html generado:', len(html) // 1024, 'KB · sin conexión · versión', ver)
