# Builds self-contained single-file pages into dist/ (CSS and JS inlined).
#   dist/index.html = current v1.1 (src/), dist/v1.html = archive-v1/, dist/v2.html = archive-v2/
import os
ROOT=os.path.dirname(os.path.abspath(__file__)); OUT=os.path.join(ROOT,'dist')
def inline(d):
    d=os.path.join(ROOT,d); h=open(f'{d}/index.html',encoding='utf-8').read()
    h=h.replace('<link rel="stylesheet" href="css/style.css">','<style>\n'+open(f'{d}/css/style.css',encoding='utf-8').read()+'\n</style>')
    return h.replace('<script src="js/app.js"></script>','<script>\n'+open(f'{d}/js/app.js',encoding='utf-8').read()+'\n</script>')
os.makedirs(OUT,exist_ok=True)
for name,src in [('index.html','src'),('v1.html','archive-v1'),('v2.html','archive-v2')]:
    open(os.path.join(OUT,name),'w',encoding='utf-8').write(inline(src))
print('built',OUT)
