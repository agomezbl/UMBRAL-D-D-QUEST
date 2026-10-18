import glob, os
R = os.path.dirname(os.path.abspath(__file__))
css = open(f'{R}/src/style.css').read()
body = open(f'{R}/src/body.html').read()
js = '\n'.join(open(f).read() for f in sorted(glob.glob(f'{R}/src/js/*.js')))
V = '0.147.0'
base = f'https://cdn.jsdelivr.net/npm/three@{V}'
libs = [f'{base}/build/three.min.js'] + [f'{base}/examples/js/{p}' for p in [
  'shaders/CopyShader.js', 'shaders/LuminosityHighPassShader.js', 'postprocessing/Pass.js', 'postprocessing/ShaderPass.js',
  'postprocessing/MaskPass.js', 'postprocessing/EffectComposer.js', 'postprocessing/RenderPass.js', 'postprocessing/UnrealBloomPass.js']]
fonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya+Sans+SC:wght@500;700&family=Alegreya+Sans:wght@400;500;700&family=Grenze+Gotisch:wght@500;700;900&family=IM+Fell+English:ital@0;1&display=swap">'
head = f'<title>Umbral</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<meta name="description" content="Umbral: crónicas de la Última Llama. Táctica por turnos en 3D con dados, historia y sustos.">\n{fonts}\n<style>\n{css}\n</style>'
scripts = '\n'.join(f'<script src="{u}"></script>' for u in libs)
app = f"<script>\n(function () {{\n'use strict';\n{js}\n}})();\n</script>"
artifact = f'{head}\n{body}\n{scripts}\n{app}\n'
standalone = f'<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">\n<meta name="theme-color" content="#0b0908">\n{head}\n</head>\n<body>\n{body}\n{scripts}\n{app}\n</body>\n</html>\n'


open(f'{R}/index.html', 'w').write(standalone)
print('index.html generado:', len(standalone)//1024, 'KB')
