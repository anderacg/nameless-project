from PIL import Image
PAL={'.':None,'k':(28,20,16),'h':(62,34,20),'H':(107,63,34),'L':(146,92,52),'s':(232,178,138),'S':(184,126,92),'e':(28,20,16),
 'p':(214,216,224),'P':(140,144,156),'c':(150,44,50),'C':(94,24,30),'b':(108,70,42),'B':(66,42,26),'g':(226,178,64),'m':(150,150,160),
 'w':(228,232,238),'W':(138,144,156),'d':(42,28,20),'n':(80,52,32)}
F={}
F['S']=[
"................",
".....kkkkkk.....",
"....kHLLHHhk....",
"....kHHHHHHk....",
"....kHHsHHHk....",
"....kHesseSk....",
".....kSssSk.....",
"...kpPkmmkcCk...",
"..kpPPbmgbbcCk..",
"..kPkbgbbBbcCk..",
"..kskbBggbbkCk..",
"..kwkbbbbbbkk...",
"..kwkBbBBbBk....",
"..kwkkBk.kBk....",
"..kWkkdk.kdk....",
"...k.kkk.kkk....",
]
F['SW']=[
"................",
"......kkkkk.....",
".....kHLLHhk....",
"....kHHHHHHk....",
"....kHHsHHHk....",
"....kesseSHk....",
".....kSsSkk.....",
"...kpPkmkcCCk...",
"..kpPPbmgbccCk..",
"..kPkbgbbBbcCk..",
"..kskbBggbbkCk..",
".kwkkbbbbbbkk...",
".kwk.kBbbBbk....",
".kwk.kBkkBk.....",
".kWkkdk.kdk.....",
"..k.kkk.kkk.....",
]
F['W']=[
"................",
"......kkkkk.....",
".....kHLLHHk....",
"....kHHHHHHHk...",
"....kssHHHHHk...",
"...kessHHHHk....",
"....kSSkHHk.....",
".....kpPkcCk....",
"....kpPPbcCCk...",
"....kPPbbBcCk...",
"....ksbgBbbCk...",
"....kwbbbbBk....",
"....kwBbbBk.....",
"....kWkBkdk.....",
".....kdkkdk.....",
".....kkk.kk.....",
]
F['NW']=[
"................",
".....kkkkk......",
"....khHLLHk.....",
"....kHHHHHHk....",
"....kHHHHHHk....",
"....kSHHHHHk....",
".....kHHHHk.....",
"...kCcccckpk....",
"..kCccccCpPPk...",
"..kCcccCbbPkk...",
"..kCccCbBbbksk..",
"...kCCbbbbbkwk..",
"....kBbBBbBkwk..",
"....kBk.kBk.kWk.",
"....kdk.kdk..k..",
"....kkk.kkk.....",
]
F['N']=[
"................",
".....kkkkkk.....",
"....kHLLHHHk....",
"....kHHHHHHk....",
"....kHHHHHHk....",
"....kHHHHHHk....",
".....kHHHHk.....",
"...kCcccccpPk...",
"..kCccccccPPPk..",
"..kCcccccCbPkk..",
"..kCccccCbbksk..",
"...kCCCCbbbkwk..",
"....kBbBBbBkwk..",
"....kBk.kBk.Wk..",
"....kdk.kdk.k...",
"....kkk.kkk.....",
]
def img(rows,flip=False):
    im=Image.new('RGBA',(16,16),(0,0,0,0))
    for y,r in enumerate(rows):
        assert len(r)==16,(y,len(r),r)
        for x,ch in enumerate(r):
            c=PAL[ch]
            if c: im.putpixel((15-x if flip else x,y),c+(255,))
    return im
order=[('S',False,'S'),('SW',False,'SW'),('W',False,'W'),('NW',False,'NW'),('N',False,'N'),('NE',True,'NW'),('E',True,'W'),('SE',True,'SW')]
sheet=Image.new('RGBA',(16*8,16),(0,0,0,0))
for i,(n,fl,src) in enumerate(order):sheet.paste(img(F[src],fl),(16*i,0))
sheet.save('hero16_sheet.png')
Z=12;big=Image.new('RGBA',(16*8*Z+7*8,16*Z+30),(24,22,26,255))
from PIL import ImageDraw
d=ImageDraw.Draw(big)
for i,(n,fl,src) in enumerate(order):
    im=img(F[src],fl).resize((16*Z,16*Z),Image.NEAREST);x=i*(16*Z+8);big.paste(im,(x,30),im);d.text((x+16*Z//2-6,8),n,fill=(230,210,160))
big.save('hero16_preview.png')
# on grass, at 1x and 4x
g=Image.new('RGBA',(16*8+16,24),(86,112,52,255));
for i,(n,fl,src) in enumerate(order):im=img(F[src],fl);g.paste(im,(8+16*i,4),im)
g.resize((g.width*4,g.height*4),Image.NEAREST).save('hero16_grass.png')
print('ok')
