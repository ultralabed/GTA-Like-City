"""Glue the small files in src/ into one page.

  src/page.html   the page: styles, buttons, and the links to three.js
  src/js/*.js     the game, in the order of the numbers in the file names

Writes room.html (the page content) and index.html (the same thing as a full page you can open or host).
Run:  python3 build.py
"""
import glob
page = open('src/page.html', encoding='utf8').read()
js = ''.join(open(f, encoding='utf8').read() + '\n' for f in sorted(glob.glob('src/js/*.js')))
room = page + '<script>\n(function(){\n' + js + '})();\n</script>\n'
open('room.html', 'w', encoding='utf8').write(room)
head = ('<!doctype html>\n<html lang="zh-Hant">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '<style>body{margin:0;font:14px system-ui,sans-serif}[hidden]{display:none!important}</style>\n</head>\n<body>\n')
open('index.html', 'w', encoding='utf8').write(head + room + '</body>\n</html>\n')
print('built room.html and index.html from', len(glob.glob('src/js/*.js')), 'script files')
