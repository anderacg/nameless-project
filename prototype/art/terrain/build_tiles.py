"""Bake reusable terrain textures. Run offline; the game loads only the PNG."""
from pathlib import Path
from PIL import Image, ImageDraw
import math, random
CELL, VARIANTS = 32, 8
# Ashmark's grass/earth/river palette (engine/ground.js and gfx/worldterrain.js).
PALETTES = [
    [(70,110,50),(84,126,58),(104,146,70)],
    [(144,128,94),(164,146,106),(182,164,124)],
    [(78,64,46),(108,88,60),(126,106,74)],
    [(144,134,100),(166,152,116),(186,170,130)],
    [(102,146,148),(116,162,160),(136,182,174)],
    [(66,118,146),(78,138,158),(94,154,168)],
]
def smooth(v): return v*v*(3-2*v)
def field(rng, n): return [[rng.random() for _ in range(n)] for _ in range(n)]
def noise(grid,x,y):
    n=len(grid); ix,iy=math.floor(x),math.floor(y); a,b=smooth(x-ix),smooth(y-iy)
    return ((grid[iy%n][ix%n]*(1-a)+grid[iy%n][(ix+1)%n]*a)*(1-b)
            +(grid[(iy+1)%n][ix%n]*(1-a)+grid[(iy+1)%n][(ix+1)%n]*a)*b)
def build():
    image=Image.new('RGBA',(CELL*VARIANTS,CELL*(len(PALETTES)+1)))
    for row,palette in enumerate(PALETTES):
        common=field(random.Random(4101+row),4)
        for variant in range(VARIANTS):
            rng=random.Random(923+row*101+variant*8191); detail=field(rng,8)
            for y in range(CELL):
                for x in range(CELL):
                    # All variants share their edge pixels; no light/dark tile borders.
                    inset=min(x,y,CELL-1-x,CELL-1-y)/6
                    weight=smooth(min(1,inset))*.3
                    broad=noise(common,x*4/CELL,y*4/CELL)
                    value=.52+(broad-.5)*.08+(noise(detail,x*8/CELL,y*8/CELL)-.5)*weight
                    grain=(rng.random()-.5)*(.32 if row<4 else .10)
                    k=max(0,min(2,(value+grain)*2)); a=int(k); f=k-a
                    col=tuple(round(palette[a][c]*(1-f)+palette[min(2,a+1)][c]*f) for c in range(3))
                    if row==0 and rng.random()<.035 and x>2 and y>2:
                        col=tuple(min(255,round(v*1.12)) for v in col)
                    image.putpixel((variant*CELL+x,row*CELL+y),col)
    draw=ImageDraw.Draw(image)
    for variant in range(VARIANTS):
        x=variant*CELL+CELL//2;y=len(PALETTES)*CELL+22;rng=random.Random(variant+703)
        for j in range(5):
            a=x-4+j*2;top=y-rng.randint(3,8)
            draw.line([(a,y),(a+rng.choice([-2,-1,0,1,2]),top)],fill=(62,100,43),width=1)
            draw.point((a,top),fill=(111,151,65))
    target=Path(__file__).with_name('grassland-tiles.png'); image.save(target,optimize=True)
    print(target.name, target.stat().st_size, 'bytes')
if __name__=='__main__': build()
