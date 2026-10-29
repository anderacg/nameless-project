# The troops' portraits for the game (the owner, 2026-10-29: "change all unit icon to portrait"): a 256 × 256 WebP copy in game/
# of each unit's PNG here (portraits.json), and js/data/unitportraits.js (UNIT_PORTRAITS: its file, ?v= its checksum so a changed
# picture loads afresh). The named companions and lords, the player's hero and the corrected animals keep their own copies
# (ui/characterportraits.js NAMED_PORTRAITS). Run from prototype/: python3 art/portrait/gamecopies.py
import json,os,hashlib
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.dirname(os.path.dirname(HERE));GAME=os.path.join(HERE,'game')
SIZE,QUALITY=256,80
named=open(os.path.join(ROOT,'js','ui','characterportraits.js')).read()
out={}
for p in json.load(open(os.path.join(HERE,'portraits.json')))['portraits']:
    i=p['id']
    if {'companion','lord','hero'}&set(p.get('tags',[])) or '"'+i+'":' in named:continue
    f=os.path.join(GAME,i+'.webp');Image.open(os.path.join(HERE,p['file'])).convert('RGB').resize((SIZE,SIZE),Image.LANCZOS).save(f,'WEBP',quality=QUALITY,method=6)
    out[i]=i+'.webp?v='+hashlib.sha256(open(f,'rb').read()).hexdigest()[:8]
js="'use strict';\n/* ---------- data: the troops' portraits (written by art/portrait/gamecopies.py: each unit's 256 × 256 WebP in art/portrait/game/,\n   ?v= its checksum); ui/battlehud.js portrait shows them, the battle's own cards keep the sprite ---------- */\nconst UNIT_PORTRAITS="+json.dumps(out,separators=(',',':'))+";\n"
open(os.path.join(ROOT,'js','data','unitportraits.js'),'w').write(js);print(len(out),'portraits')
