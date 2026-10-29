# Ashmark's tracks, drawn once here: writes art/tracks.svg (the sheet, each print a <symbol>) and js/data/trackart.js (the same
# shapes as SVG path strings, for the game: gfx/tracks.js draws them with Path2D). Run from prototype/: python3 art/tracks.py
# Every print points up (the way it went), in units of a 100-wide box round 0,0; 'p' is the pressed-in dark, 'm' its details
# (lighter: tread, nails, the frog), drawn over it.
import math,json,os
HERE=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.dirname(HERE)
f=lambda v:('%.1f'%v).rstrip('0').rstrip('.')
def circle(cx,cy,r):return f'M{f(cx-r)},{f(cy)} a{f(r)},{f(r)} 0 1,0 {f(2*r)},0 a{f(r)},{f(r)} 0 1,0 {f(-2*r)},0 Z'
def ellipse(cx,cy,rx,ry,rot=0):
    a=math.radians(rot);dx,dy=rx*math.cos(a),rx*math.sin(a)
    return f'M{f(cx-dx)},{f(cy-dy)} A{f(rx)},{f(ry)} {f(rot)} 1,0 {f(cx+dx)},{f(cy+dy)} A{f(rx)},{f(ry)} {f(rot)} 1,0 {f(cx-dx)},{f(cy-dy)} Z'
def rect(x,y,w,h,rot=0,ox=None,oy=None):
    ox=x+w/2 if ox is None else ox;oy=y+h/2 if oy is None else oy;a=math.radians(rot);c,s=math.cos(a),math.sin(a)
    pts=[(x,y),(x+w,y),(x+w,y+h),(x,y+h)];pts=[(ox+(px-ox)*c-(py-oy)*s,oy+(px-ox)*s+(py-oy)*c) for px,py in pts]
    return 'M'+' L'.join(f'{f(px)},{f(py)}' for px,py in pts)+' Z'
ART={}
def art(id,name,p,m=(),vb=(-50,-50,100,100)):ART[id]={'name':name,'vb':list(vb),'p':' '.join(p),'m':' '.join(m)}
def claw(x,y,ang,l=7):
    a=math.radians(ang);return f'M{f(x-1.6)},{f(y)} L{f(x+l*math.sin(a))},{f(y-l*math.cos(a))} L{f(x+1.6)},{f(y)} Z'
def toe(ang,l,w):
    a=math.radians(ang);ex,ey=l*math.sin(a),-l*math.cos(a);nx,ny=math.cos(a)*w,math.sin(a)*w
    return f'M{f(-nx)},{f(-ny)} L{f(ex-nx*.4)},{f(ey-ny*.4)} L{f(ex*1.18)},{f(ey*1.18)} L{f(ex+nx*.4)},{f(ey+ny*.4)} L{f(nx)},{f(ny)} Z'
sole="M0,-46 C15,-46 19,-31 18,-17 C17,-5 12,4 10,13 L-10,13 C-11,4 -18,-6 -18,-19 C-18,-33 -13,-46 0,-46 Z"
heel="M-10,20 C-9,17 9,17 10,20 L11,42 C11,48 -11,48 -11,42 Z"
# a soldier's hobnailed boot: a ring of nails, a row down the middle, the heel's
nails=[(12.5*math.sin(math.radians(t)),-20-22*math.cos(math.radians(t))) for t in range(0,360,24)]+[(0,y) for y in (-34,-26,-18,-10,-2,6)]+[(-6,-30),(6,-30),(-7,-14),(7,-14),(-5,2),(5,2)]
art('hobnail',"Soldier's hobnailed boot",[sole,heel],[circle(x,y,1.6) for x,y in nails if abs(x)<16]+[circle(x,y,1.6) for x in (-6,0,6) for y in (24,32,40)])
art('boot','Boot (tread)',[sole,heel],[rect(-14,y,28,2.2) for y in (-38,-31,-24,-17,-10,-3,4)]+[rect(-8,y,16,2) for y in (25,32,39)])
foot="M-4,46 C-14,46 -16,36 -15,26 C-14,14 -9,6 -10,-6 C-11,-18 -16,-24 -14,-32 C-12,-40 8,-40 14,-32 C18,-24 16,-10 12,2 C9,12 9,22 8,32 C7,42 4,46 -4,46 Z"
art('barefoot','Bare foot',[foot]+[ellipse(x,y,rx,ry) for x,y,rx,ry in [(-11,-44,5.2,6.5),(-1,-47,4.2,5.2),(7,-45,3.6,4.6),(13,-41,3.1,4),(17,-35,2.7,3.4)]])
shoe="M-30,30 C-38,6 -34,-30 0,-36 C34,-30 38,6 30,30 L20,30 C26,8 24,-20 0,-25 C-24,-20 -26,8 -20,30 Z"
frog="M0,-14 C6,0 12,16 12,26 C6,22 3,20 0,20 C-3,20 -6,22 -12,26 C-12,16 -6,0 0,-14 Z"
art('horse','Horse, shod',[shoe],[rect(x-1.8,y-1,3.6,2,r) for x,y,r in [(-28,10,80),(-27,-6,65),(-20,-20,40),(28,10,-80),(27,-6,-65),(20,-20,-40)]]+[frog])
art('hoof','Horse, unshod',["M-28,28 C-36,4 -32,-30 0,-36 C32,-30 36,4 28,28 C18,34 -18,34 -28,28 Z"],[frog])
half=lambda s:f'M{s*3},-40 C{s*18},-36 {s*22},-6 {s*20},24 C{s*18},34 {s*6},34 {s*4},24 C{s*2},6 {s*1},-20 {s*3},-40 Z'
art('cloven','Cloven hoof (deer, boar, ox)',[half(1),half(-1),ellipse(-17,42,4,3),ellipse(17,42,4,3)])
pad="M0,0 C10,0 20,8 20,18 C20,28 12,34 6,32 C3,31 2,28 0,28 C-2,28 -3,31 -6,32 C-12,34 -20,28 -20,18 C-20,8 -10,0 0,0 Z"
wt=[(-14,-14,6,8,-25),(-5,-30,6.5,8.5,-6),(6,-30,6.5,8.5,6),(15,-14,6,8,25)]
art('wolf','Wolf / dog',[pad]+[ellipse(x,y,rx,ry,r) for x,y,rx,ry,r in wt]+[claw(x+math.sin(math.radians(r))*ry,y-math.cos(math.radians(r))*ry-1,r) for x,y,rx,ry,r in wt])
bpad="M-26,-4 C-14,-10 14,-10 26,-4 C30,8 24,24 14,28 C4,32 -4,32 -14,28 C-24,24 -30,8 -26,-4 Z"
bt=[(-24,-20),(-12,-26),(0,-28),(12,-26),(24,-20)]
art('bear','Bear',[bpad,ellipse(0,40,9,6)]+[ellipse(x,y,5.5,6.5) for x,y in bt]+[claw(x,y-8,x*.8,10) for x,y in bt])
cpad="M-18,8 C-18,0 -8,-2 0,-2 C8,-2 18,0 18,8 C20,18 16,28 10,30 C7,31 5,27 3,28 C1,29 -1,29 -3,28 C-5,27 -7,31 -10,30 C-16,28 -20,18 -18,8 Z"
art('cat','Big cat (tiger, lynx)',[cpad]+[circle(x,y,r) for x,y,r in [(-17,-10,6.5),(-6,-24,7),(7,-24,7),(18,-10,6.5)]])
art('troll','Troll',["M-6,46 C-24,44 -30,24 -28,4 C-26,-16 -22,-28 -8,-30 C10,-32 26,-24 28,-4 C30,18 22,44 -6,46 Z"]+[ellipse(x,y,rx,ry) for x,y,rx,ry in [(-20,-38,7,8),(-6,-44,7.5,8.5),(9,-43,7,8),(22,-35,6,7)]],vb=(-50,-56,100,106))
art('talon','Bird / griffin',[circle(0,6,7),toe(-32,34,4),toe(0,40,4.5),toe(32,34,4),toe(180,22,3.5)])
art('dragon','Dragon / wyrm',["M-14,10 C-16,30 -6,44 0,44 C6,44 16,30 14,10 C10,0 -10,0 -14,10 Z",toe(-30,40,7),toe(0,46,8),toe(30,40,7),toe(-70,22,5)],vb=(-50,-54,100,104))
art('ruts','Wagon ruts',[rect(-26,-48,12,96),rect(14,-48,12,96)],[rect(-21,-48,2,96),rect(19,-48,2,96)])
art('drag','Dragged beast',["M-4,-48 C10,-30 -12,-14 4,4 C16,18 -8,32 4,48 L-4,48 C-16,32 8,18 -4,4 C-20,-14 2,-30 -12,-48 Z"])
# ---- js/data/trackart.js: the game's copy
js="'use strict';\n/* ---------- data: the tracks' pictures (written by art/tracks.py, which writes art/tracks.svg from the same shapes: change them\n   there and run it). Each print points up, in a 100-wide box round 0,0 (vb: its box); p, the pressed-in dark, m its lighter details\n   (tread, nails, a frog), as SVG paths; gfx/tracks.js draws them (Path2D) ---------- */\nconst TRACK_ART="+json.dumps({k:{kk:v[kk] for kk in ('vb','p','m')} for k,v in ART.items()},separators=(',',':'))+";\n"
open(os.path.join(ROOT,'js','data','trackart.js'),'w').write(js)
# ---- art/tracks.svg: the sheet
GROUND='#c9ad7f';DARK='#6a4e31';MID='#8f7148';LIGHT='#efdcb4'
CW,CH,COLS=230,250,4;items=list(ART.items());rows=(len(items)+COLS-1)//COLS;W=CW*COLS+40;TR=330;H=90+rows*CH+TR
o=[f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {W} {H}" width="{W}" height="{H}">','<title>Ashmark tracks</title>',
 '<desc>Each print a &lt;symbol&gt; pointing up (the way it went): its fill the pressed-in dark, its details lighter; drawn once more 2 px up-left in a light colour for the edge that catches the light, as the game draws them. Written by art/tracks.py.</desc><defs>',
 f'<pattern id="grain" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="{GROUND}"/><circle cx="4" cy="6" r="1" fill="#bfa173"/><circle cx="15" cy="3" r=".8" fill="#d4ba8e"/><circle cx="19" cy="16" r="1.1" fill="#bfa173"/><circle cx="8" cy="19" r=".8" fill="#d4ba8e"/></pattern>']
for k,v in ART.items():
    vb=' '.join(str(x) for x in v['vb']);o.append(f'<symbol id="{k}" viewBox="{vb}" overflow="visible"><path d="{v["p"]}"/>'+(f'<path d="{v["m"]}" fill="var(--detail,{MID})"/>' if v['m'] else '')+'</symbol>')
o.append('</defs>');o.append(f'<rect width="{W}" height="{H}" fill="url(#grain)"/>')
o.append(f'<text x="{W/2}" y="48" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="#3d2c1a">Tracks</text>')
def press(k,x,y,s,rot=0,mirror=False):
    t=f'translate({f(x)},{f(y)}) rotate({rot})'+(' scale(-1,1)' if mirror else '')
    return f'<g transform="{t}"><use href="#{k}" xlink:href="#{k}" x="{-s/2-2}" y="{-s/2-2}" width="{s}" height="{s}" fill="{LIGHT}" style="--detail:{LIGHT}"/><use href="#{k}" xlink:href="#{k}" x="{-s/2}" y="{-s/2}" width="{s}" height="{s}" fill="{DARK}"/></g>'
for i,(k,v) in enumerate(items):
    cx=20+CW*(i%COLS)+CW/2;cy=90+CH*(i//COLS)+CH/2-14
    o.append(f'<rect x="{cx-CW/2+8}" y="{cy-CH/2+18}" width="{CW-16}" height="{CH-12}" rx="10" fill="none" stroke="#a88b5f" stroke-width="1.5"/>'+press(k,cx,cy,170))
    o.append(f'<text x="{cx}" y="{cy+CH/2-4}" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#3d2c1a">{v["name"]}</text>')
y0=90+rows*CH+20;o.append(f'<text x="30" y="{y0+20}" font-family="Georgia,serif" font-size="20" fill="#3d2c1a">Trails (going right)</text>')
def trail(k,y,n,step,s,lanes,alt,label):
    g=[]
    for li,ly in enumerate(lanes):
        for j in range(n):g.append(press(k,60+j*step+(li%2)*step/2*(1 if alt else 0),y+ly+((j%2)*(s*.35) if alt else 0),s,90,alt and j%2==1))
    return ''.join(g)+f'<text x="{W-30}" y="{y+6}" text-anchor="end" font-family="Georgia,serif" font-size="15" fill="#3d2c1a">{label}</text>'
o+= [trail('hobnail',y0+70,14,50,34,[-30,0,30],True,'A column of soldiers'),trail('horse',y0+160,11,62,34,[-14,14],True,'Riders'),trail('wolf',y0+230,16,42,26,[0],True,'A wolf'),trail('ruts',y0+290,12,57.6,60,[0],False,'A wagon'),'</svg>']
open(os.path.join(HERE,'tracks.svg'),'w').write('\n'.join(o));print(len(ART),'prints')
