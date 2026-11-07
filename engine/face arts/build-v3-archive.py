from pathlib import Path
import json,base64
p=Path(__file__).resolve().parent
ids=['master','base','planes','nose','eyes','brows','mouth','beard','hair']
art={id:'data:image/png;base64,'+base64.b64encode((p/'layers'/(id+'.png')).read_bytes()).decode() for id in ids}
html=(p/'workshop.template.html').read_text().replace('__ART_DATA__',json.dumps(art,separators=(',',':')))
(p/'portrait-workshop-v3-archive.html').write_text(html)
(p/'preview.html').write_text((p/'workshop.template.html').read_text().replace('__ART_DATA__',json.dumps({id:'layers/'+id+'.png' for id in ids},separators=(',',':'))))
m={'version':3,'canvas':{'width':1254,'height':1254},'master':'layers/master.png','base':'layers/base.png','draw_order':['base','planes','nose','eyes','brows','mouth','beard','hair'],'layers':{id:'layers/'+id+'.png' for id in ids if id!='master'},'replacement_variants':0,'reconstruction':'Pixel-identical to alpha-normalized master; source images retained unchanged. Alpha >=128 becomes 255, others 0. Layer coordinates are never rescaled or shifted.'}
(p/'manifest.json').write_text(json.dumps(m,indent=2)+'\n')
