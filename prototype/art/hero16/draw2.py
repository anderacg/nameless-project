from PIL import Image,ImageDraw
exec(open('draw.py').read().split("F={}")[0])  # PAL
F={}
F['S']=["................",".....kkkkkk.....","....kHLLHHhk....","....kHHHHHHk....","....kHHsHHHk....","....kHesseSk....",".....kSssSk.....",
"...kpPkmmkcCk...","..kpPPbmgbbcCk..","..kPkbgbbBbcCk..","..kskbBggbbkCk..","..kkkbbbbbbksk..","....kBbBBbBkk...",".....kBk.kBk....",".....kdk.kdk....",".....kkk.kkk...."]
F['SW']=["................","......kkkkk.....",".....kHLLHhk....","....kHHHHHHk....","....kHHsHHHk....","....kesseSHk....",".....kSsSkk.....",
"...kpPkmkcCCk...","..kpPPbmgbccCk..","..kPkbgbbBbcCk..","..kskbBggbbkCk..","..kkkbbbbbbkk...",".....kBbbBbk....",".....kBkkBk.....","....kdk.kdk.....","....kkk.kkk....."]
F['W']=["................","......kkkkk.....",".....kHLLHHk....","....kHHHHHHHk...","....kssHHHHHk...","...kessHHHHk....","....kSSkHHk.....",
".....kpPkcCk....","....kpPPbcCCk...","....kPPbbBcCk...","....ksbgBbbCk...","....kkbbbbBk....",".....kBbbBk.....",".....kBkkBk.....",".....kdkkdk.....",".....kkk.kk....."]
F['NW']=["................",".....kkkkk......","....khHLLHk.....","....kHHHHHHk....","....kHHHHHHk....","....kSHHHHHk....",".....kHHHHk.....",
"...kCcccckpk....","..kCccccCpPPk...","..kCcccCbbPkk...","..kCccCbBbbksk..","...kCCbbbbbkk...","....kBbBBbBk....","....kBk.kBk.....","....kdk.kdk.....","....kkk.kkk....."]
F['N']=["................",".....kkkkkk.....","....kHLLHHHk....","....kHHHHHHk....","....kHHHHHHk....","....kHHHHHHk....",".....kHHHHk.....",
"...kCcccccpPk...","..kCccccccPPPk..","..kCcccccCbPkk..","..kCccccCbbksk..","...kCCCCbbbkk...","....kBbBBbBk....","....kBk.kBk.....","....kdk.kdk.....","....kkk.kkk....."]
F['NE']=["................","......kkkkk.....",".....kHLLHhk....","....kHHHHHHk....","....kHHHHHHk....","....kHHHHHSk....",".....kHHHHk.....",
"...kCccccckPk...","..kCcccccccPk...","..kCcccccCbkk...","..kCccccCbbksk..","...kCCCCbbbkk...","....kBbBBbBk....",".....kBk.kBk....",".....kdk.kdk....",".....kkk.kkk...."]
F['E']=["................",".....kkkkk......","....kHHLLHk.....","...kHHHHHHHk....","...kHHHHHssk....","....kHHHHssek...",".....kHHkSSk....",
".....kccCmk.....","....kcccccbk....","...kCcccCbbk....","...kCccCbgsk....","...kCCCbbbbk....","....kBbbBk......","....kBkkBk......","....kdkkdk......","....kk.kkk......"]
F['SE']=["................",".....kkkkk......","....khHLLHk.....","....kHHHHHHk....","....kHHHsHHk....","....kHSessek....",".....kkSsSk.....",
"...kPkmmkcCCk...","..kpPbmgbbccCk..","..kPbgbbBbbccCk.","..ksbBggbbkcCCk.","..kkbbbbbbksCk..","....kBbBBbBkk...",".....kBk.kBk....",".....kdk.kdk....",".....kkk.kkk...."]
# (facing east his right side is toward you, so the plate shows there and the cape on the west: the bodies of each pair swapped,
# W and E mirrored, each frame keeping its own head (rows 1-6))
mir=lambda rows:[r[::-1] for r in rows]
W0,E0,SW0,SE0,NW0,NE0=F['W'],F['E'],F['SW'],F['SE'],F['NW'],F['NE']
F['W']=mir(E0);F['E']=mir(W0)
F['SW']=SW0[:7]+SE0[7:];F['SE']=SE0[:7]+SW0[7:]
F['NW']=NW0[:7]+NE0[7:];F['NE']=NE0[:7]+NW0[7:]
# (side views: the back of the head rounded, not a point)
WH=[".....kHLLHHk....","....kHHHHHHHk...","....kssHHHHHk...","...kessHHHHHk...","....kSSkHHHk...."]
F['W']=F['W'][:2]+WH+F['W'][7:];F['E']=F['E'][:2]+mir(WH)+F['E'][7:]
# (hair detail: T top shine, L light, H mid, D strand shade, h deepest; rows 2-6 of each head)
PAL['T']=(178,120,70);PAL['D']=(82,46,26)
HAIR={'S':["....kLTTLHHk....","....kLHLHHDk....","....kHsDHsDk....","....kDesseSk....","....kkSssSkk...."],
 'SW':[".....kLTTLHk....","....kLLHLHDk....","....kHsDsHDk....","....kesseSDk....","....kkSsSkkk...."],
 'W':[".....kTTLLHk....","....kLLLHLHDk...","....kssDHLHDk...","...kessHSHDHk...","....kSSkhDhk...."],
 'NW':["....kHLTTLk.....","....kHLLHLHk....","....kHDHLHDk....","....kSHDHDHk....","....kkDhDhkk...."],
 'N':["....kHLTTLHk....","....kLHLLHLk....","....kHDHLHDk....","....kDHDHDHk....","....kkhDDhkk...."],
 'NE':[".....kLTTLHk....","....kHLHLLHk....","....kDHLHDHk....","....kHDHDHSk....","....kkhDhDk....."],
 'SE':["....kHLTTLk.....","....kDHLLHLk....","....kDHsDsHk....","....kDSessek....","....kkkSsSkk...."]}
HAIR['E']=mir(HAIR['W'])
for n,r in HAIR.items():F[n]=F[n][:2]+r+F[n][7:]
# (outline: every fill pixel that touches the empty gets a dark edge on that side)
def seal(R):
    R=[list(r) for r in R];at=lambda x,y:R[y][x] if 0<=x<16 and 0<=y<16 else 'k'
    add=[(x+dx,y+dy) for y in range(16) for x in range(16) if R[y][x] not in '.k' for dx,dy in((1,0),(-1,0),(0,1),(0,-1)) if at(x+dx,y+dy)=='.']
    for x,y in add:R[y][x]='k'
    return [''.join(r) for r in R]
for n in list(F):F[n]=seal(F[n])
order=['S','SW','W','NW','N','NE','E','SE']
def img(rows):
    im=Image.new('RGBA',(16,16),(0,0,0,0))
    for y,r in enumerate(rows):
        assert len(r)==16,(y,len(r),r)
        for x,ch in enumerate(r):
            c=PAL[ch]
            if c: im.putpixel((x,y),c+(255,))
    return im
sheet=Image.new('RGBA',(128,16),(0,0,0,0))
for i,n in enumerate(order):sheet.paste(img(F[n]),(16*i,0))
sheet.save('hero16_sheet.png')
Z=12;big=Image.new('RGBA',(8*(16*Z+8),16*Z+30),(24,22,26,255));d=ImageDraw.Draw(big)
for i,n in enumerate(order):im=img(F[n]).resize((16*Z,16*Z),Image.NEAREST);x=i*(16*Z+8);big.paste(im,(x,30),im);d.text((x+16*Z//2-6,8),n,fill=(230,210,160))
g=Image.new('RGBA',(144,24),(86,112,52,255))
for i,n in enumerate(order):im=img(F[n]);g.paste(im,(8+16*i,4),im)
g=g.resize((g.width*4,g.height*4),Image.NEAREST)
o=Image.new('RGBA',(big.width,big.height+g.height+10),(24,22,26,255));o.paste(big,(0,0));o.paste(g,(0,big.height+10));o.save('hero16_review.png');print('ok')
