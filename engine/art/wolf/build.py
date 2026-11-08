"""Rebuild lossless wolf frame data from the approved combat and map sheets."""
from pathlib import Path
import json
from PIL import Image

root=Path(__file__).parent
def encode(images):
    palette=[(0,0,0,0)]
    frames=[]
    for image in images:
        bounds=image.getbbox()
        runs=[]
        previous=None
        length=0
        for color in image.crop(bounds).getdata():
            if not color[3]:
                color=(0,0,0,0)
            if color not in palette:
                palette.append(color)
            index=palette.index(color)
            if index==previous:
                length+=1
            else:
                if previous is not None:
                    runs.extend([length,previous])
                previous,length=index,1
        runs.extend([length,previous])
        frames.append([*bounds,runs])
    return dict(palette=palette,frames=frames)

metadata=json.loads((root/'manifest.json').read_text())
sheet=Image.open(root/'wolf.png').convert('RGBA')
images=[]
clips={}
for name,clip in metadata['animations'].items():
    clips[name]=[len(images),clip['count'],clip['frameDurationMs']]
    for frame in clip['frames']:
        x,y,w,h=(frame[k] for k in ('x','y','w','h'))
        images.append(sheet.crop((x,y,x+w,y+h)))
data=encode(images)
data['clips']=clips
world=Image.open(root/'wolf-map.png').convert('RGBA')
data['map']=encode([world.crop((i*16,0,(i+1)*16,16)) for i in range(8)])
source="'use strict';\n// Approved wolf frames, losslessly indexed from art/wolf/.\n(function(PX){PX.WOLF_ART="+json.dumps(data,separators=(',',':'))+";})(window.PX=window.PX||{});\n"
(root.parent.parent/'wolf-data.js').write_text(source)
print(f'{len(images)} combat frames, {len(clips)} clips, 8 native map frames')
