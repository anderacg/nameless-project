'use strict';
/* ---------- fights inside (the owner, 2026-11-06: "small fights in caves"; doc/INTERIORS_DESIGN.md): a cave's beasts and a
   ruin's guardians are fought inside, not on the field outside. Its own ground, seeded by the place (InteriorLayout: the same
   cave every visit): rock all round, a mouth passage from the west edge (the only way out, so the only way to withdraw) into a
   string of chambers joined by passages, one loop at times; a cave's ragged, a ruin's cellars square-cut. Up to INTERIOR.men of
   your band go in with you (Interior.pick: chosen on the cave's page, Inside; the rest wait outside, safe whatever comes of it);
   no one rides; it is dark (the fog of war always on, each man seeing B.sightK of his range, the unseen darker: B.dark); the
   foes wait in their chambers until roused (insideRoused: a foe they see near, or one of theirs hurt), the strongest in the
   deepest, by the chest. A hideout is fought inside too (the owner, 2026-11-06: "inside with more camp detail"): its bandits'
   camp in the chambers, a stake palisade across the way in (a gap to pass), tents, bedrolls and fires whose light shows whoever
   stands in it to both sides (B.lights: battlefog.js fogGrid), the chieftain's tent and the plunder in the deepest.
   The rock is the battle terrain's (BattleTerrain.raster: plan.solid), so routes, sight, shots and the ways off the field obey it
   as they obey a mountain; its look is its own (InteriorArt, painted once, as the arena's). INTERIOR.on false: today's field ---------- */
/* INTERIOR, the one table. on; men: the most of your band that go in with you (companions count); sight: × each man's sight range
   inside; dark: the fog's darkness inside (FOG.dark outside); notice: a waiting group is roused by a foe it sees this near one of its own (px); files: your groups' files going in; squad: a camp's men a group; zoom: the camera's
   opening zoom, × the whole field's; face: a wall's face (px, seen from the south); margin: rock painted
   beyond the field [across, down] (px). Each style (cave: a beast's lair; cellar: a ruin's): rooms [least, most] chambers; r:
   their radii [least, most] (px, the deepest deep, the first mouthR); pass: a passage's width [least, most] (px); mouth: the
   way in's width (more than EXITS.min, morale.js: the one way off the field); loop: the chance of a passage joining two chambers past the next; jag: how ragged the walls (0 straight);
   box: square-cut chambers and passages; edge: rock kept between a chamber and the field's rows (px); bones, props: how many
   painted in a chamber [least, most]; look: the floor's [dark, mid, light] and the rock's five shades (RGB, dark first) */
const INTERIOR={on:true,men:8,sight:.5,dark:.9,notice:180,files:2,zoom:2.4,squad:3,face:10,margin:[96,64],
  cave:{rooms:[4,6],r:[76,108],mouthR:80,deep:128,pass:[40,52],mouth:68,loop:.5,jag:.22,edge:26,bones:[2,5],props:[2,4],
    look:{floor:[[44,40,36],[60,55,48],[78,72,62]],rock:[[18,17,16],[30,28,26],[48,45,41],[74,69,62],[102,95,84]]}},
  cellar:{rooms:[4,5],r:[68,92],mouthR:72,deep:104,pass:[32,40],mouth:64,loop:.35,jag:0,box:true,edge:26,bones:[0,2],props:[2,4],
    look:{floor:[[58,54,48],[76,70,62],[94,88,78]],rock:[[24,22,22],[38,35,33],[60,56,52],[90,84,76],[118,110,98]]}}};
// (a hideout: a cave's shape, or a ruin's cellars (within), with the bandits' camp in it: camp, its tents [least, most] a chamber, a fire's
// light (px), the palisade's gap and thickness (px))
INTERIOR.hideout={...INTERIOR.cave,rooms:[5,6],r:[80,108],deep:134,pass:[42,54],bones:[0,1],camp:true,tents:[1,3],light:110,gap:40,thick:10};
INTERIOR.den={...INTERIOR.cellar,rooms:[5,5],deep:110,bones:[0,1],camp:true,tents:[1,2],light:100,gap:40,thick:10};
// (its field: FIELD_SIZES.cave, setup.js)
/* ---------- the layout: chambers {x, y, rx, ry} (the first the mouth's, the last the deepest), passages (segments, each
   {ax, ay, bx, by, h}: its half width), and d(x, y): under 1 open ground, 1 or more rock ---------- */
class InteriorLayout{
  constructor(style,seed,W,top,bot){Object.assign(this,{style,seed,W,top,bot});this.X=INTERIOR[style];this.make()}
  // (a layout whose every chamber is reached from the mouth on the field's cells, by the seed or the next few)
  static make(style,seed,W,top,bot,cs=TERRAIN.cs){let L=null;for(let k=0;k<6;k++){L=new InteriorLayout(style,(seed+k*7919)>>>0,W,top,bot);if(L.joined(cs))break}return L}
  make(){const X=this.X,R=seeded(this.seed||1),rf=(a,b)=>a+R()*(b-a),ri=(a,b)=>a+Math.floor(R()*(b-a+1)),{W,top,bot}=this,mid=(top+bot)/2,H=bot-top;
    const n=ri(X.rooms[0],X.rooms[1]),rooms=[],fit=(r,y)=>clamp(y,top+r+X.edge,bot-r-X.edge);
    {const r=X.mouthR;rooms.push({x:X.mouth+r+40,y:fit(r*.85,mid+rf(-.12,.12)*H),rx:r,ry:r*.85})}
    for(let i=1;i<n;i++){const deep=i===n-1,r=deep?X.deep:rf(X.r[0],X.r[1]),ry=Math.min(r*rf(.72,.92),H/2-X.edge-4),x0=rooms[0].x+X.mouthR+r+30,x1=W-r-X.edge;
      const x=n>2?x0+(x1-x0)*(i-1)/(n-2)+rf(-24,24):x1,y=fit(ry,mid+(i%2?-1:1)*rf(.1,.28)*H);rooms.push({x:clamp(x,x0-20,x1),y,rx:r,ry})}
    this.rooms=rooms;this.deep=n-1;const segs=[];
    // (the way in: from beyond the west edge to the first chamber)
    {const a=rooms[0];segs.push({ax:-60,ay:a.y,bx:a.x,by:a.y,h:X.mouth/2})}
    const link=(a,b,w)=>{const h=w/2;if(X.box){const lv=R()<.5,mx=lv?b.x:a.x,my=lv?a.y:b.y;segs.push({ax:a.x,ay:a.y,bx:mx,by:my,h},{ax:mx,ay:my,bx:b.x,by:b.y,h})}
      else{const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1,k=rf(-.3,.3)*l,mx=(a.x+b.x)/2-dy/l*k,my=fit(h,(a.y+b.y)/2+dx/l*k);segs.push({ax:a.x,ay:a.y,bx:mx,by:my,h},{ax:mx,ay:my,bx:b.x,by:b.y,h})}};
    for(let i=1;i<n;i++)link(rooms[i-1],rooms[i],rf(X.pass[0],X.pass[1]));
    if(n>=4&&R()<X.loop){const a=ri(0,n-3);link(rooms[a],rooms[a+2],rf(X.pass[0],X.pass[0]+8))}
    this.segs=segs;this.ns=Math.floor(R()*997);
    // (a camp's palisade across the way from the first chamber to the next: the middle of that passage's first stretch; its fires, one a chamber past the first)
    if(X.camp){const s=segs[1],dx=s.bx-s.ax,dy=s.by-s.ay,l=Math.hypot(dx,dy)||1;this.pal={x:s.ax+dx*.55,y:s.ay+dy*.55,ux:dx/l,uy:dy/l,h:s.h};
      this.fires=rooms.slice(1).map(m=>{const a=R()*6.283;return{x:Math.round(m.x+Math.cos(a)*m.rx*.2),y:Math.round(m.y+Math.sin(a)*m.ry*.2)}})}
    // (what is painted in each chamber: bones, props, by the stream after the shape)
    this.bits=rooms.map((m,i)=>({bones:i?ri(X.bones[0],X.bones[1]):0,props:ri(X.props[0],X.props[1]),k:Math.floor(R()*1e6)}))}
  // how far into rock (x, y) lies: under 1 open
  d(x,y){const X=this.X;let d=9;
    if(y<this.top+2||y>this.bot-2)return 9;
    for(const m of this.rooms){const ex=(x-m.x)/m.rx,ey=(y-m.y)/m.ry,v=X.box?Math.pow(ex**4+ey**4,.25):Math.hypot(ex,ey);if(v<d)d=v}
    for(const s of this.segs){const dx=s.bx-s.ax,dy=s.by-s.ay,l2=dx*dx+dy*dy,t=l2?clamp(((x-s.ax)*dx+(y-s.ay)*dy)/l2,0,1):0,px=s.ax+t*dx,py=s.ay+t*dy;
      const v=(X.box?Math.max(Math.abs(x-px),Math.abs(y-py)):Math.hypot(x-px,y-py))/s.h;if(v<d)d=v}
    return X.jag?d*(1+X.jag*(noise(x/30,y/30,this.ns)-.5)*2):d}
  // (a stake of the palisade stands at (x, y): on its line, off its gap)
  palAt(x,y){const p=this.pal;if(!p)return false;const X=this.X,u=(x-p.x)*p.ux+(y-p.y)*p.uy,v=(x-p.x)*-p.uy+(y-p.y)*p.ux;return Math.abs(u)<X.thick&&Math.abs(v)>X.gap/2&&Math.abs(v)<p.h*1.8}
  // (the rock on the battle's cells: 1 where a cell's middle is rock, or a stake)
  solid(C,R,cs){const s=new Uint8Array(C*R);for(let r=0;r<R;r++)for(let c=0;c<C;c++){const x=(c+.5)*cs,y=(r+.5)*cs;s[r*C+c]=this.d(x,y)<1&&!this.palAt(x,y)?0:1}return s}
  // (every chamber's middle reached from the mouth over open cells)
  joined(cs){const C=Math.ceil(this.W/cs),R=Math.ceil((this.bot+64)/cs),S=this.solid(C,R,cs),seen=new Uint8Array(C*R),q=[];
    const at=(x,y)=>clamp(Math.floor(y/cs),0,R-1)*C+clamp(Math.floor(x/cs),0,C-1),s0=at(1,this.rooms[0].y);if(S[s0])return false;seen[s0]=1;q.push(s0);
    while(q.length){const i=q.pop(),c=i%C,r=(i-c)/C;for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){const c2=c+dc,r2=r+dr;if(c2<0||r2<0||c2>=C||r2>=R)continue;const j=r2*C+c2;if(!seen[j]&&!S[j]){seen[j]=1;q.push(j)}}}
    return this.rooms.every(m=>seen[at(m.x,m.y)])}
  // (its plan for the battle's terrain: rock where it is not open; nothing else on the ground)
  plan(W,H,top,bot){return{recipe:'interior',layout:this.style,W,H,top,bot,hills:[],woods:[],marsh:[],rocks:[],rivers:[],lane:null,interior:this}}
}
/* ---------- its look: painted once (in slices), floor and walls; a chamber's bones, stones and props, the deepest's chest; the
   daylight in at the mouth. drawView each frame: the part in view (render.js drawLayer) ---------- */
class InteriorArt{
  constructor(L,chest){this.L=L;this.chest=!!chest;this.cv=null}
  *paintSteps(){const L=this.L,X=L.X,[MX,MY]=INTERIOR.margin,W=BW+2*MX,H=BH+2*MY,cv=mkcv(W,H),g=cv.getContext('2d'),img=g.createImageData(W,H),D=img.data,s=L.seed%100000+3,FACE=INTERIOR.face;
    const F=X.look.floor,RK=X.look.rock,hw=Math.ceil(W/2),hh=Math.ceil(H/2),half=new Float32Array(hw*hh);
    for(let j=0;j<hh;j++){if(j&&!(j%32))yield;for(let i=0;i<hw;i++)half[j*hw+i]=L.d(i*2-MX,j*2-MY)}
    const dAt=(i,j)=>half[Math.min(hh-1,j>>1)*hw+Math.min(hw-1,i>>1)],open=(i,j)=>j>=0&&j<H&&i>=0&&i<W&&dAt(i,j)<1;
    const ramp=(P,v)=>{v=clamp(v,0,1);const lo=v<.5,a=lo?P[0]:P[1],b=lo?P[1]:P[2],t=lo?v*2:(v-.5)*2;return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]};
    const rock=v=>{v=clamp(v,0,1)*(RK.length-1);const k=Math.min(RK.length-2,Math.floor(v)),t=v-k,a=RK[k],b=RK[k+1];return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]};
    for(let j=0;j<H;j++){if(j&&!(j%40))yield;const y=j-MY;for(let i=0;i<W;i++){const x=i-MX,o=(j*W+i)*4,d=dAt(i,j);let c;
      if(d<1){// (the floor: worn stone and grit, darker toward the walls and in a face's shadow; a cellar's flags; daylight at the mouth)
        let v=.55+.26*(hs(x>>3,y>>3,s)-.5)+.18*(hs(x>>1,y>>1,s+1)-.5)+.08*(hs(x,y,s+2)-.5)-Math.max(0,d-.5)*.8;
        if(!open(i,j-1)||!open(i,j-2))v-=.22;else if(!open(i,j-4))v-=.1;
        if(X.box&&(((x+((y>>4)&1)*10)%20+20)%20===0||(y&15)===0))v-=.16;
        if(x<140)v+=.32*Math.max(0,1-x/140)*(1-Math.min(1,Math.abs(y-L.rooms[0].y)/X.mouth));
        c=ramp(F,v)}
      else{let k=1;for(;k<=FACE;k++)if(open(i,j+k))break;
        if(k<=FACE){// (a wall's face, seen from the south: dark at its foot, lit at its lip; strata, or a cellar's courses of stone)
          const t=k/FACE;let v=.3+.42*t+.1*(hs(x>>2,(y+(x>>4))>>1,s+5)-.5);if(X.box&&((y&3)===0||(((x+((y>>2)&1)*4)&7)===0)))v-=.14;if(k===FACE)v+=.12;c=rock(v)}
        else{// (the rock's top: rough and dark, deeper darker, a lit rim where it breaks off)
          const rim=open(i-2,j)||open(i+2,j)||open(i,j-2);let v=.16+.12*(hs(x>>2,y>>2,s+6)-.5)+.06*(hs(x,y,s+7)-.5)-Math.min(.12,(d-1)*.15);if(rim)v+=.2;c=rock(v)}}
      D[o]=c[0];D[o+1]=c[1];D[o+2]=c[2];D[o+3]=255}}
    g.putImageData(img,0,0);g.save();g.translate(MX,MY);try{this.things(g);if(X.camp)this.camp(g)}finally{g.restore()}
    this.cv=cv;return this}
  // (each chamber's things: bones and stones, stalagmites by its walls (a cave's), barrels, crates and a fallen pillar (a cellar's); the chest in the deepest)
  things(g){const L=this.L,X=L.X;
    L.rooms.forEach((m,i)=>{const b=L.bits[i],h=n=>hs(i,n,b.k),spot=n=>{for(let t=0;t<8;t++){const a=h(n*9+t)*6.283,q=.25+.6*h(n*9+t+50),x=Math.round(m.x+Math.cos(a)*m.rx*q),y=Math.round(m.y+Math.sin(a)*m.ry*q);if(L.d(x,y)<.8&&L.d(x,y+6)<1)return[x,y]}return null};
      for(let k=0;k<b.bones;k++){const p=spot(k);if(p)this.bone(g,p[0],p[1],h(k+20))}
      for(let k=0;k<b.props;k++){const p=spot(k+10);if(!p)continue;if(X.box)this.crate(g,p[0],p[1],h(k+30));else this.stone(g,p[0],p[1],h(k+30))}
      if(i===L.deep&&this.chest)this.chestAt(g,Math.round(m.x+m.rx*.35),Math.round(m.y))})}
  // (the camp: the palisade's stakes, each chamber's tents and bedrolls round its fire's stones, the deepest's chieftain's tent and plunder)
  camp(g){const L=this.L,X=L.X,p=L.pal;
    if(p){const n=Math.ceil(p.h*1.8/3);for(let k=-n;k<=n;k++){const x=Math.round(p.x-p.uy*k*3),y=Math.round(p.y+p.ux*k*3);if(!this.L.palAt(x,y)||L.d(x,y)>=1.05)continue;const t=2+(hs(k,1,L.seed)<.5?1:0);
      rect(g,'#2a1a0c',x-1,y-12-t,4,14+t);rect(g,'#8a5a32',x,y-12-t,2,13+t);rect(g,'#b07a44',x,y-12-t,1,2);rect(g,'#5a3a1e',x,y-4,2,1)}}
    L.rooms.forEach((m,i)=>{if(!i)return;const b=L.bits[i],h=n=>hs(i,n+90,b.k),f=L.fires[i-1],deep=i===L.deep,nt=deep?1:X.tents[0]+Math.floor(h(1)*(X.tents[1]-X.tents[0]+1));
      for(let k=0;k<nt;k++){const a=h(k+3)*6.283,x=Math.round(m.x+Math.cos(a)*m.rx*.6),y=Math.round(m.y+Math.sin(a)*m.ry*.55);if(L.d(x,y)<.85&&L.d(x-10,y)<1&&L.d(x+10,y)<1)this.tent(g,x,y,deep?14:10,h(k+7))}
      for(let k=0;k<3;k++){const a=h(k+11)*6.283,x=Math.round(f.x+Math.cos(a)*22),y=Math.round(f.y+Math.sin(a)*14);if(L.d(x,y)<.9)this.bedroll(g,x,y,h(k+13))}
      this.ring(g,f.x,f.y);if(deep)this.plunder(g,Math.round(m.x+m.rx*.35),Math.round(m.y+m.ry*.25))})}
  tent(g,x,y,w,v){const C=v<.5?['#7a6a4a','#9a8a62','#5a4c34']:['#6a4a3a','#8a644e','#4a3428'];for(let k=0;k<w;k++){const hh=Math.round(k*.9);rect(g,C[1],x-w+k,y-hh,1,hh+1);rect(g,C[0],x+w-k,y-hh,1,hh+1)}
    rect(g,C[2],x-2,y-Math.round(w*.5),4,Math.round(w*.5)+1);rect(g,'#2a2014',x-w,y+1,w*2+1,1);rect(g,'#3a2a1a',x,y-Math.round(w*.9)-3,1,4)}
  bedroll(g,x,y,v){const c=v<.5?'#6a5a7a':'#7a4a3a';rect(g,c,x-5,y-1,10,3);rect(g,'#b8a888',x-5,y-1,3,3);rect(g,'#2a2016',x-5,y+2,10,1)}
  ring(g,x,y){for(let k=0;k<8;k++){const a=k/8*6.283;rect(g,k%2?'#5a5650':'#7a7670',Math.round(x+Math.cos(a)*6)-1,Math.round(y+Math.sin(a)*4)-1,3,2)}rect(g,'#2a2420',x-3,y-1,6,3)}
  plunder(g,x,y){this.chestAt(g,x,y);rect(g,'#c8a24a',x+9,y-3,5,3);rect(g,'#e8c860',x+10,y-4,3,1);rect(g,'#8a6a3a',x-14,y-6,6,7);rect(g,'#a88454',x-13,y-7,4,2);rect(g,'#7a5a3a',x-20,y-4,5,5)}
  bone(g,x,y,v){const W='#d8d0bc',S='#8a826e';if(v<.5){rect(g,W,x,y,6,1);rect(g,W,x-1,y-1,2,3);rect(g,W,x+5,y-1,2,3);rect(g,S,x,y+1,6,1)}else{rect(g,W,x,y,4,3);rect(g,S,x+1,y+1,1,1);rect(g,S,x+3,y+1,1,1);rect(g,S,x,y+3,4,1)}}
  stone(g,x,y,v){const R=INTERIOR.cave.look.rock.map(c=>'rgb('+c.join(',')+')');if(v<.45){const h=6+Math.floor(v*10);for(let k=0;k<h;k++){const w=Math.max(1,Math.round(4*(1-k/h)));rect(g,R[k<2?2:3],x-(w>>1),y-k,w,1)}rect(g,R[4],x,y-h+1,1,1);rect(g,R[0],x-2,y+1,5,1)}
    else{rect(g,R[2],x-3,y-2,7,3);rect(g,R[3],x-2,y-3,4,1);rect(g,R[1],x-3,y+1,7,1)}}
  crate(g,x,y,v){if(v<.5){rect(g,'#3a2a1a',x-4,y-8,8,9);rect(g,'#7a5634',x-3,y-7,6,7);rect(g,'#5a3e26',x-3,y-5,6,1);rect(g,'#5a3e26',x-3,y-2,6,1);rect(g,'#9a7448',x-3,y-7,6,1)}
    else{rect(g,'#3a2a1a',x-5,y-6,10,7);rect(g,'#6e4e30',x-4,y-5,8,5);rect(g,'#4a3420',x-4,y-3,8,1);rect(g,'#8a6640',x-4,y-5,8,1)}}
  chestAt(g,x,y){rect(g,'#2a1c10',x-7,y-9,14,11);rect(g,'#7a4a24',x-6,y-8,12,9);rect(g,'#9a6232',x-6,y-8,12,3);rect(g,'#c8a24a',x-6,y-5,12,1);rect(g,'#e8c860',x-1,y-6,2,3);rect(g,'#1a120a',x-7,y+2,14,1)}
  // (the small map's picture: the field's, a pixel a cell: camera.js drawMiniField)
  get mini(){if(this._mini||!this.cv)return this._mini||null;const [MX,MY]=INTERIOR.margin,cs=TERRAIN.cs,C=Math.ceil(BW/cs),R=Math.ceil(BH/cs),cv=mkcv(C,R),g=cv.getContext('2d');
    g.imageSmoothingEnabled=true;g.drawImage(this.cv,MX,MY,BW,BH,0,0,C,R);return this._mini=cv}
  // (the part in view, the rock beyond the field too)
  drawView(g,x0,y0,x1,y1){if(!this.cv)return;const [MX,MY]=INTERIOR.margin,a=Math.max(-MX,Math.floor(x0)),b=Math.max(-MY,Math.floor(y0)),c=Math.min(BW+MX,Math.ceil(x1)),d=Math.min(BH+MY,Math.ceil(y1));
    if(c>a&&d>b)g.drawImage(this.cv,a+MX,b+MY,c-a,d-b,a,b,c-a,d-b);
    // (a camp's fires, burning: their glow and flames, by the clock, never a die)
    const F=this.L.fires;if(F){const now=performance.now()/1000;for(const f of F){if(f.x<a-60||f.x>c+60||f.y<b-60||f.y>d+60)continue;const k=Math.floor(now*8+f.x)%3,fl=.85+.15*Math.sin(now*9+f.y);
      g.save();const G=g.createRadialGradient(f.x,f.y,2,f.x,f.y,48*fl);G.addColorStop(0,'rgba(255,170,70,.35)');G.addColorStop(1,'rgba(255,120,40,0)');g.fillStyle=G;g.fillRect(f.x-50,f.y-50,100,100);g.restore();
      rect(g,'#3a2010',f.x-4,f.y,8,2);rect(g,'#ff7a30',f.x-3,f.y-4-k,6,4+k);rect(g,'#ffd24a',f.x-2,f.y-3-k,4,3);rect(g,'#fff2a0',f.x-1,f.y-2,2,1)}}}
}
/* ---------- going in: who goes (Interior.pick: {g: {group id: how many}, comps: [companion ids]}; by default your companions,
   then your best foot, then the rest, INTERIOR.men in all), what that band is worth, the page that chooses (Inside: the cave's
   Enter; Back to its page, Enter to fight) ---------- */
class Interior{
  static on(e){return INTERIOR.on&&!!e&&(e.kind==='cave'||e.kind==='camp'&&e.ref instanceof Hideout&&(e.ref.tunnel||!!e.ref.within))}// (a hideout's camp of tents is fought on the map; a bandit lair, or a den in ruins, inside)
  static styleOf(e){const r=e&&e.ref,cel=r instanceof Ruins||r&&r.within;return r instanceof Hideout?cel?'den':'hideout':cel?'cellar':'cave'}
  static seedOf(e){const r=e&&e.ref||{};return Math.floor(hash(Math.floor(r.x||0),Math.floor(r.y||0),911+(r.cyc||0))*4294967296)>>>0}
  // (your troop groups by who should go first: foot before riders and shooters, the better tier first)
  static order(){return partyRoster(P).groups.filter(g=>g.count>0).map(g=>({g,u:ST[g.type]})).filter(x=>x.u).sort((a,b)=>(!!a.u.range-!!b.u.range)||(!!a.u.mounted-!!b.u.mounted)||(b.u.tier-a.u.tier)).map(x=>x.g)}
  static pick(max=INTERIOR.men){const k={g:{},comps:[]};let n=0;for(const id of compsInBand()){if(n>=max)break;k.comps.push(id);n++}
    for(const g of Interior.order()){if(n>=max)break;const c=Math.min(g.count,max-n);k.g[g.id]=c;n+=c}return k}
  static count(k){return (k.comps||[]).length+Object.values(k.g||{}).reduce((a,v)=>a+v,0)}
  // (its fighters as a list: you, its companions, its men by type)
  static list(k){const r=partyRoster(P),out=['hero',...(k.comps||[])];for(const [id,n] of Object.entries(k.g||{})){const g=r.groups.find(x=>String(x.id)===String(id));if(g)for(let i=0;i<Math.min(n,g.count);i++)out.push(g.type)}return out}
  // (what it loses in an auto-resolved fight: each of its men at frac)
  static losses(k,frac){const lost={};for(const t of Interior.list(k))if(ST[t]&&t!=='hero'&&!COMPS[t]&&Math.random()<frac)lost[t]=(lost[t]||0)+1;return lost}
  // the page: who goes in with you
  // (what waits inside as your scouts saw it: its power; none known, null)
  static theirs(site,lv){if(site instanceof Hideout){const y=site.spied();return y?site.power(site.all(y.list)):null}return site.spied&&site.spied()?site.power(lv||site.spied().lv):null}
  static show(site,lv){const I=G.inside&&G.inside.site===site?G.inside:(G.inside={site,lv,k:Interior.pick()}),k=I.k,max=INTERIOR.men,n=Interior.count(k),r=partyRoster(P);
    const row=(label,sub,have,act,arg,can)=>'<div class="in-row"><span class="in-n">'+label+(sub?' <span class="muted">'+sub+'</span>':'')+'</span><span class="in-q">'+
      '<button class="btn sm" type="button" data-act="'+act+'-" data-arg="'+arg+'"'+(have>0?'':' disabled')+' aria-label="Fewer">−</button><b>'+have+'</b>'+
      '<button class="btn sm" type="button" data-act="'+act+'+" data-arg="'+arg+'"'+(can?'':' disabled')+' aria-label="More">+</button></span></div>';
    const comps=compsInBand().map(id=>row(COMPS[id].n,'companion',k.comps.includes(id)?1:0,'in-c',id,!k.comps.includes(id)&&n<max)).join('');
    const men=r.groups.filter(g=>g.count>0&&ST[g.type]).map(g=>{const have=k.g[g.id]||0;return row(htmlText(r.nameOf(g.id)||ST[g.type].n),ST[g.type].n+' · '+g.count+' in your band'+(ST[g.type].mounted?' · on foot inside':''),have,'in-g',g.id,have<g.count&&n<max)}).join('');
    showPanel('<div class="top"><h2>Into the '+site.name+'</h2><span class="muted">Up to '+max+' go in with you; the rest wait outside</span></div>'+
      '<p>'+(site instanceof Hideout?'Their camp lies deep inside, behind a palisade of stakes. ':'')+'The way in is narrow and dark. Riders go on foot; your shooters will find few clear shots between the rocks.</p>'+
      '<div class="in-list">'+(comps+men||'<p class="muted">You go in alone.</p>')+'</div>'+
      '<p class="muted">Going in: you and '+n+' of '+max+'. Power '+rating(Interior.list(k))+(Interior.theirs(site,lv)!=null?' vs '+Interior.theirs(site,lv):'')+'.</p>'+
      nav(['site-tab','home','Back'],['in-go',null,'Enter']));panel.classList.add('picker','inside')}
}
// (the camera close on you: the camera's step nearest under INTERIOR.zoom × the whole field's (BCAM.zooms): the dark is near)
Interior.look=()=>{camInit();const c=B.cam,V=bview(),h=B.hero;c.fit=false;const f=camFar();c.z=Math.max(f,BCAM.zooms.filter(z=>z<=f*INTERIOR.zoom).pop()||f);if(h){c.x=h.x-V.w/c.z*.3;c.y=h.y-V.h/c.z/2}camClamp()};
onAct('in-',(a,arg)=>{const I=G.inside;if(!I)return false;const k=I.k,r=partyRoster(P),n=Interior.count(k),max=INTERIOR.men;
  if(a==='in-c+'&&n<max&&!k.comps.includes(arg))k.comps.push(arg);else if(a==='in-c-')k.comps=k.comps.filter(x=>x!==arg);
  else if(a==='in-g+'){const g=r.groups.find(x=>String(x.id)===String(arg));if(g&&n<max&&(k.g[g.id]||0)<g.count)k.g[g.id]=(k.g[g.id]||0)+1}
  else if(a==='in-g-'){const g=r.groups.find(x=>String(x.id)===String(arg));if(g&&k.g[g.id]>0){k.g[g.id]--;if(!k.g[g.id])delete k.g[g.id]}}
  else if(a==='in-go'){G.inside=null;G.site=null;if(I.site instanceof Hideout){const y=I.site.spied();I.site.fight(true,y&&y.list,k)}else caveFight(I.site,I.lv,k);return true}else return false;
  Interior.show(I.site,I.lv);return true});
/* ---------- the battle inside (startBattle: the encounter Interior.on): BattleSetup's steps on its own ground ---------- */
class InteriorSetup extends BattleSetup{
  constructor(opts){super({...opts,deploy:false});const e=G.enc;this.style=Interior.styleOf(e);this.pick=e.inside||Interior.pick();this.seed=Interior.seedOf(e)}
  fieldSize(){return 'cave'}
  // (its ground (the layout is made once the field's rows are measured: terrain); in the dark, on stone: no climate's rule)
  groundSpec(){const E=this.env,w=this.style==='cellar'?'cellars':'cave';E.c='grass';E.t=T_OPEN;E.name=this.style==='cellar'?'Cellars':'Cave';
    E.name=this.style==='hideout'||this.style==='den'?'Hideout':E.name;
    E.text=(this.style==='hideout'||this.style==='den'?'Their hideout: a palisade bars the way in but for its gap; their fires show whoever stands by them. ':this.style==='cellar'?'Dark cellars: ':'A dark cave: ')+'you see only a short way, the rock stops arrows, and the only way out is the way you came in.';return{interior:this.style,seed:this.seed,w}}
  // (only those who went in: you, the companions and the men chosen)
  createUnits(){super.createUnits();const k=this.pick,left=new Map(Object.entries(k.g||{}).map(([id,n])=>[String(id),n]));
    this.units=this.units.filter(u=>{if(u.team!==0||u.hero||u.lord||u.leader)return true;if(u.comp)return (k.comps||[]).some(id=>u.grp==='comp_'+id);
      const id=String(u.sourceGroupId),n=left.get(id)||0;if(n<=0)return false;left.set(id,n-1);return true})}
  terrain(){const FI=this.field;this.lay=InteriorLayout.make(this.style,this.seed,BW,FI.top,FI.bot);return this.TR=buildTerrain({...this.ground,W:BW,top:FI.top,bot:FI.bot,interior:this.lay})}
  *paint(){const e=G.enc,chest=this.style==='cave'&&!(e&&e.ref&&e.ref.within)||this.style==='hideout'||this.style==='den';this.painted=yield* new InteriorArt(this.lay,chest).paintSteps()}
  fogOn(){return true}
  muster(){super.muster();B.inside=this.style;B.interior=this.lay;B.dark=INTERIOR.dark;B.sightK=INTERIOR.sight;if(this.lay.fires)B.lights=this.lay.fires.map(f=>({x:f.x,y:f.y,r:this.lay.X.light}));
    for(const u of B.units)if(isRider(u))Dismount.down(u,'none');// (no one rides inside)
    this.place();Interior.look()}
  // (a camp's men in squads of INTERIOR.squad, each a group of its own (as beastmind.js beastPacks splits a pack), so they keep the chambers)
  squads(){const n=INTERIOR.squad;for(const id of Object.keys(B.groups)){const g=B.groups[id],m=grpUnits(id);if(g.team===0||g.role==='hero'||m.length<=n)continue;
    const k=Math.ceil(m.length/n),name=g.name.replace(/ \d+$/,'');for(let i=1;i<k;i++){const q=B.groups[id+'~'+(i+1)]=new BattleControl(id+'~'+(i+1),g.team,{player:false,ally:g.ally,foe:g.foe,role:g.role,type:g.type,sourceGroupId:g.sourceGroupId,name:name+' '+(i+1),face:g.face});
      for(const u of m.slice(i*n,(i+1)*n))u.grp=q.id}}}
  /* (yours in the first chamber, facing in, in blocks of four files; theirs in theirs, the strongest in the deepest, the rest from
     the next deepest back; a chamber holding two, side by side) */
  place(){const L=this.lay,R=L.rooms;if(L.X.camp)this.squads();const gs=Object.values(B.groups).filter(g=>grpUnits(g.id).length),mine=gs.filter(g=>g.team===0),foes=gs.filter(g=>g.team!==0);
    const put=(g,x,y,face)=>{const m=grpUnits(g.id);if(g.role!=='hero'&&g.form!=='pack'){g.form='line';g.files=Math.max(1,Math.min(INTERIOR.files,m.length))}g.face=g.currentFacing=face;g.ax=x;g.ay=y;g.tgt=null;g.queue=[];
      const S=formSlots(g.form,m.length,face,g.files);m.forEach((u,i)=>{u.sx=S[i][0];u.sy=S[i][1];u.x=x+u.sx;u.y=y+u.sy;u.dir=face;u.face=Math.cos(face)>=0?1:-1})};
    const a=R[0];mine.forEach((g,i)=>{const k=i-(mine.length-1)/2;put(g,a.x-a.rx*.25+(Math.abs(k)>1.6?-24:0),a.y+k*Math.min(26,a.ry*1.4/Math.max(1,mine.length)),0)});
    // (their chieftain, if any, in the deepest)
    const w=g=>grpUnits(g.id).reduce((s,u)=>s+u.max,0)+(grpUnits(g.id).some(u=>u.leader)?1e6:0),order=[];for(let i=R.length-1;i>=1;i--)order.push(i);
    foes.sort((x,y)=>w(y)-w(x)).forEach((g,i)=>{const m=R[order[i%order.length]],same=Math.floor(i/order.length);put(g,m.x+(same?-m.rx*.35:m.rx*.1),m.y+(same?m.ry*.3*(same%2?1:-1):0),Math.PI)})}
}
// (inside, the foes wait in their chambers until they see you: Commander#typeHolds, PackMind.think)
const insideHolds=team=>!!B&&(!!B.inside||!!B.holds)&&team!==0;// (B.holds: a siege's defenders at their posts, battle/siegeworks.js)
// (a group roused, and roused it stays: one of its own hurt, or a foe it sees within INTERIOR.notice px of one of its own; then its
// captain orders it as anywhere)
function insideRoused(g){if(g.roused)return true;const m=grpUnits(g.id),N=INTERIOR.notice;
  if(m.some(u=>u.hp<u.max)||B.units.some(e=>e.team!==g.team&&e.hp>0&&!e.left&&seenBy(g.team,e)&&m.some(u=>Math.abs(e.x-u.x)<N&&Math.abs(e.y-u.y)<N&&Math.hypot(e.x-u.x,e.y-u.y)<N)))g.roused=true;
  return !!g.roused}
