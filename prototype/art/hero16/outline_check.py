exec(open('draw2.py').read().split("order=['S'")[0])
def at(R,x,y):return R[y][x] if 0<=x<16 and 0<=y<16 else '.'
for n in ['S','SW','W','NW','N','NE','E','SE']:
    R=F[n];gaps=[];stray=[];thick=[]
    for y in range(16):
        for x in range(16):
            c=R[y][x]
            if c=='.':continue
            nb4=[at(R,x+dx,y+dy) for dx,dy in((1,0),(-1,0),(0,1),(0,-1))]
            if c!='k' and '.' in nb4:gaps.append((x,y))
            if c=='k':
                nb8=[at(R,x+dx,y+dy) for dx in(-1,0,1) for dy in(-1,0,1) if dx or dy]
                if not any(v not in '.k' for v in nb8):stray.append((x,y))
    print(n,'gaps',gaps,'stray',stray)
