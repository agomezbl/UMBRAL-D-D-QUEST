"""Foto del probador de atrezo con Chrome real (sin tarjeta gráfica).
  python3 lab/atrezo/foto.py salida.png [pieza1,pieza2|todas] [columnas] [ancho] [alto] [extra, p. ej. "slot=wall&tema=crypt&yaw=0.5"]
Imprime, por cada pieza, si se sale del volumen permitido y cuántos triángulos tiene."""
import os, subprocess, sys
from playwright.sync_api import sync_playwright
R = os.path.dirname(os.path.abspath(__file__))
PAGE = os.path.join(R, f'_atrezo_{os.getpid()}.html')   # una página por proceso: varias fotos a la vez no se pisan
subprocess.run([sys.executable, os.path.join(R, 'build.py'), PAGE], check=True)
out = sys.argv[1]; only = sys.argv[2] if len(sys.argv) > 2 else 'todas'
cols = sys.argv[3] if len(sys.argv) > 3 else ''; W = int(sys.argv[4]) if len(sys.argv) > 4 else 1600; H = int(sys.argv[5]) if len(sys.argv) > 5 else 1000
extra = sys.argv[6] if len(sys.argv) > 6 else ''
q = '&'.join(x for x in [('only=' + only) if only != 'todas' else '', ('cols=' + cols) if cols else '', extra] if x)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'])
    page = b.new_page(viewport={'width': W, 'height': H})
    errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    page.goto('file://' + PAGE + ('?' + q if q else ''))
    try: page.wait_for_function('() => window.__listo', timeout=60000)
    except Exception as e: print('NO CARGA:', e)
    page.wait_for_timeout(1500)
    for s in (page.evaluate('() => window.__stats || []')):
        print(('OK ' if s['ok'] else 'SE SALE ') + f"{s['name']:<24} {s['slot']:<7} {int(s['tris']):>5} tri  min {s['min']} max {s['max']}  luces {s['luces']}")
    page.screenshot(path=out)
    if errs: print('ERRORES:', errs[:6])
    b.close()
try: os.remove(PAGE)
except OSError: pass
