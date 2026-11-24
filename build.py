"""Wrap room.html (the page content) into index.html (a full page you can open or host)."""
s = open('room.html', encoding='utf8').read()
head = ('<!doctype html>\n<html lang="zh-Hant">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '<style>body{margin:0;font:14px system-ui,sans-serif}[hidden]{display:none!important}</style>\n</head>\n<body>\n')
open('index.html', 'w', encoding='utf8').write(head + s + '\n</body>\n</html>\n')
