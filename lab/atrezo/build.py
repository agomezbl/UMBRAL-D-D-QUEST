"""Monta el probador de atrezo: una página que enseña todas las piezas de DECO
(muebles, adornos de pared, piezas de suelo) sobre su casilla, con una figura
para comparar tamaños y el volumen permitido dibujado en líneas.

  python3 lab/atrezo/build.py            -> lab/atrezo/atrezo_local.html
  python3 lab/atrezo/foto.py salida.png [pieza1,pieza2] [columnas] [ancho] [alto]
"""
import glob, os

R = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(R, '..', '..'))
SRC = os.path.join(ROOT, 'src', 'js')
read = lambda p: open(p, encoding='utf-8').read()
import sys
base = ['00_i18n.js', '01_util.js', '02_icons.js', '03_audio.js', '04_textures.js', '05_shaders.js', '06_models.js', '06_deco.js', '10_story.js']
deco = sorted(os.path.basename(f) for f in glob.glob(os.path.join(SRC, '06_deco_*.js')))
js = '\n'.join(read(os.path.join(SRC, f)) for f in base) + '\nObject.assign(window, { DECO, G, U, TEX, MAT, MODELS, SHADERS, L });'
three = read(os.path.join(ROOT, 'src', 'vendor', 'three', 'three.min.js')).replace('</script', '<\\/script')
# cada archivo de piezas va en su propia etiqueta: si uno tiene un error, los demás siguen viéndose
piezas = '\n'.join(f'<script>\n/* {f} */\n{read(os.path.join(SRC, f))}\n</script>' for f in deco)
page = ('<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<title>Probador de atrezo</title>\n'
        '<style>html,body{margin:0;height:100%;background:#0b0908;overflow:hidden}canvas{display:block}</style>\n</head>\n<body>\n'
        f'<script>\n{three}\n</script>\n<script>\n(function () {{\n\'use strict\';\n{js}\n}})();\n</script>\n{piezas}\n'
        f'<script>\n{read(os.path.join(R, "visor.js"))}\n</script>\n</body>\n</html>\n')
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(R, 'atrezo_local.html')
open(out, 'w', encoding='utf-8').write(page)
print(f'{os.path.basename(out)}: {len(page.encode()) // 1024} KB · archivos de piezas: {", ".join(deco)}')
