"""Monta el probador de dados en una sola página.

Reutiliza piezas del juego (utilidades, sonido, texturas, miniaturas y los
datos de héroes y enemigos) y añade el módulo de dados 3D y el probador.
Genera dos archivos:
  - dados.html: el contenido para publicar (sin <html>/<head>, lo pone el visor).
  - dados_local.html: la misma página completa, para probarla en el ordenador.
"""
import os

R = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.normpath(os.path.join(R, '..', '..', 'src', 'js'))
read = lambda p: open(p, encoding='utf-8').read()

game = [read(os.path.join(SRC, f)) for f in ['01_util.js', '02_icons.js', '03_audio.js', '04_textures.js', '05_shaders.js', '06_models.js', '10_story.js']]
# el tema de la cripta, copiado de 08_world.js tal cual
w = read(os.path.join(SRC, '08_world.js')).splitlines()
i = next(k for k, l in enumerate(w) if l.startswith('  crypt: {'))
crypt = w[i].replace('  crypt: ', 'const CRYPT = ', 1) + '\n' + w[i + 1].rstrip().rstrip(',') + ';'
js = '\n'.join(game + [crypt, read(os.path.join(SRC, '09_dice3d.js')), read(os.path.join(R, 'tester.js'))])

head = ('<title>Probador de dados</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'
        '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya+Sans:ital,wght@0,400;0,500;0,700;1,400&family=Alegreya+Sans+SC:wght@500;700&family=Grenze+Gotisch:wght@500;700&display=swap">\n'
        f'<style>\n{read(os.path.join(R, "tester.css"))}\n</style>\n')
body = read(os.path.join(R, 'tester.html'))
scripts = ('<script src="https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js"></script>\n'
           f"<script>\n(function () {{\n'use strict';\n{js}\n}})();\n</script>\n")
page = head + body + scripts
open(os.path.join(R, 'dados.html'), 'w', encoding='utf-8').write(page)
local = ('<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n'
         '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + head + '</head>\n<body>\n' + body + scripts + '</body>\n</html>\n')
open(os.path.join(R, 'dados_local.html'), 'w', encoding='utf-8').write(local)
print(f'dados.html: {len(page.encode()) // 1024} KB')
