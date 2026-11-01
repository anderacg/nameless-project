'use strict';
/* ---------- the arena (TourneyArena; the owner, 2026-11-01: "can you have some small arena battle screen instead of open green
   field?"): every bout in a town's lists (ui/town.js Lists) is fought in a small ring of raked sand, walled, its crowd in the
   stands round it; any later single fight may ask for it too (setup.js opts.arena: its options, or true for the town's).
   Its size is a field size (setup.js FIELD_SIZES.tourney), so the camera fits it as it fits any field (camera.js camFit). Its wall
   is the field's own edge rules: the ring runs the field's width (every soldier is kept 8 px inside it: battle.js
   keepOffObstacles) and its rows are the field's top and bottom (B.ftop, B.fbot: BattleSetup.survey sets them to the ring's, ring).
   Drawn as the battle's ground layer (render.js drawLayer calls its drawView each frame): a picture painted once in slices
   (paintSteps: the sand, the walls, the culture's gatehouse, the stands and their crowd) and kept by its key (the holding's
   culture, climate and lord, the field and the ring), then over it each frame the banners' flutter and the crowd's arms
   (TourneyCrowd). Drawing only: the crowd reads the fighters (a hard blow, a man down, the end) and changes nothing, and never a die
   (hs: a hash of its seat and the clock), Math.random never. TOURNEY_ARENA.on false: today's tournament on the open field,
   exactly ---------- */
/* TOURNEY_ARENA, the one table. on: the arena (false: the open field); ring: its rows [top, bottom] (field px), each kept inside
   the HUD's measured edges; margin: painted beyond the field [across, down] (px: a wide screen's sides, a squarer one's top and
   bottom, which the camera shows when the field is narrower than the view); tier: a row of the stands (px); seat: a spectator's
   room (px); aisle, aisleGap: the far stands' stairs, their width and the room between them (px); full: the share of seats taken; fans: the share in their lord's colours; hats: the share in a hat; others: the share
   not of the holding's peoples (mostly human); ground: each climate's sand [dark, mid, light] (RGB), snow: its frost's specks,
   wet: its marsh's damp patches; walls: each culture's wall and stands (kind: stone, stake or living; c: its four shades, light
   first; trim: its cap, lashing or leaves; seat: the benches [light, mid, dark]; others: a culture with none drawn as timber);
   pennants: their x along the far wall (share of the field's width); drapes: px between the lord's hangings on the far wall.
   crowd: hard (a blow taking this share of his health or more is cheered), wave (px a second a cheer spreads along the stands),
   reach (px it reaches at strength 1), life (s it lasts), roar (s the end's roar lasts), greet (the cheer as the bout opens),
   arms (waves a second), idle (the share of the crowd moving now and then) */
const TOURNEY_ARENA={on:true,ring:[92,216],margin:[96,64],tier:10,seat:6,aisle:6,aisleGap:72,full:.8,fans:.18,hats:.14,others:.2,
  ground:{grass:{c:[[164,128,84],[190,156,106],[210,180,128]]},desert:{c:[[206,170,108],[226,194,132],[240,214,158]]},
    frost:{c:[[146,138,124],[170,164,150],[194,190,180]],snow:.03},swamp:{c:[[104,92,66],[124,110,80],[144,128,94]],wet:.5}},
  walls:{vale:{kind:'stone',c:['#d8d2c6','#b0a99c','#857e74','#57524c'],trim:'#8b5a2b',seat:['#cb804a','#a15735','#5a2a18']},
    league:{kind:'stone',c:['#f0ead8','#d8cdb4','#b0a488','#857a62'],trim:'#30b3a7',seat:['#cb804a','#a15735','#5a2a18']},
    karn:{kind:'stone',c:['#a6a8b0','#7c7e88','#5a5c66','#3c3e48'],trim:'#d8844a',seat:['#9a9ca4','#6e7078','#44464e']},
    ashgor:{kind:'stake',c:['#cb804a','#a15735','#682a19','#4a1c10'],trim:'#e8e0c8',seat:['#8a5a3a','#5a3a24','#36221a']},
    sylvan:{kind:'living',c:['#e2e6e2','#bcc2bf','#868d8e','#45484e'],trim:'#4a9a5a',seat:['#d8c8a8','#b0a080','#6a6050']},
    timber:{kind:'stake',c:['#cb804a','#a15735','#682a19','#4a1c10'],trim:'#7a6040',seat:['#cb804a','#a15735','#5a2a18']}},
  pennants:[.09,.23,.77,.91],drapes:48,
  crowd:{hard:.12,wave:240,reach:150,life:1.3,roar:3.5,greet:.8,arms:3,idle:.025}};
// (the pictures painted, by key: the last few kept)
const TOURNEY_PICS=new Map();
class TourneyArena{
  // o: {culture, climate, col (its lord's colour), dev (his banner's device), races (the crowd's peoples), seed}
  constructor(o){const A=TOURNEY_ARENA;this.o=Object.assign({culture:'vale',climate:'grass',col:FACS.player.col,dev:'star',races:['human'],seed:1},o);
    this.top=A.ring[0];this.bot=A.ring[1];this.cv=null;this.crowd=new TourneyCrowd(this)}
  // (a holding's options: its culture's walls, its climate's sand, its lord's banner, its peoples in the stands; none: the Vale's)
  static optsOf(h){if(!h)return{};const own=h.owner&&FACS[h.owner],seed=[...String(h.name)].reduce((a,c)=>Math.imul(a,31)+c.charCodeAt(0)|0,7)>>>0;
    return{culture:holdingCulture(h),climate:climAt(h.x,h.y),col:own?own.col:FACS.player.col,dev:h.owner==='player'||!own?'star':h.owner,races:(h.races||[]).filter(r=>RACE_LOOK[r]).slice(0,3),seed:seed%100000+1}}
  // the arena of a battle (its opts): opts.arena (its options, or true), else a tournament's with the arena on; null: the open field
  static forBattle(opts){const a=opts.arena;if(!a&&!(opts.tournament&&TOURNEY_ARENA.on))return null;
    return new TourneyArena(Object.assign(TourneyArena.optsOf(G.town&&G.town.ref),typeof a==='object'?a:{}))}
  // the ring's rows inside the field's measured edges (setup.js measureField's {top, bot}): the fighters' rows
  ring(FI){const [a,b]=TOURNEY_ARENA.ring;this.top=Math.max(a,FI.top);this.bot=Math.min(b,FI.bot);return{top:this.top,bot:this.bot}}
  get style(){return TOURNEY_ARENA.walls[this.o.culture]||TOURNEY_ARENA.walls.timber}
  // (its picture's key: whatever changes a pixel of it)
  get key(){const o=this.o;return[o.culture,o.climate,o.col,o.dev,o.races.join('/'),o.seed,BW+'x'+BH,this.top,this.bot].join('|')}
  // (the picture, painted in slices, or found kept: setup.js BattleSetup.paint)
  *paintSteps(){const k=this.key;let p=TOURNEY_PICS.get(k);if(!p){p=yield* this.paint();if(TOURNEY_PICS.size>=4)TOURNEY_PICS.delete(TOURNEY_PICS.keys().next().value);TOURNEY_PICS.set(k,p)}
    this.cv=p.cv;this.seats=p.seats;this.flags=p.flags;return this}
  *paint(){const [MX,MY]=TOURNEY_ARENA.margin,cv=mkcv(BW+2*MX,BH+2*MY),g=cv.getContext('2d'),seats=[],flags=[];
    yield* this.sand(g);g.save();
    try{g.translate(MX,MY);this.stands(g,seats);yield;this.pavilion(g);this.walls(g);this.gate(g);this.banners(flags);if(this.o.climate==='frost')this.snow(g)}finally{g.restore()}
    return{cv,seats,flags}}
  // the ring's floor and all round it: packed sand by the climate, raked in long wavering grooves, scuffed where they fight
  *sand(g){const A=TOURNEY_ARENA,[MX,MY]=A.margin,W=BW+2*MX,H=BH+2*MY,G=A.ground[this.o.climate]||A.ground.grass,[p0,p1,p2]=G.c,s=this.o.seed,img=g.createImageData(W,H),D=img.data;
    const cx=BW/2,cy=(this.top+this.bot)/2,fw=this.top-4,sx=new Float32Array(W),cxs=new Float32Array(W);for(let i=0;i<W;i++){sx[i]=Math.sin((i-MX)/41);cxs[i]=Math.cos((i-MX)/41)}
    let c8=0,c2=0,c16=0,w16=0;// (each cell's hash, made once along its row)
    for(let j=0;j<H;j++){if(j&&!(j%64))yield;const y=j-MY,sy=Math.sin(y/97+s),cy0=Math.cos(y/97+s),dy=((y-cy)/34)**2;
      for(let i=0;i<W;i++){const x=i-MX;if(!i||!(x&7))c8=hs(x>>3,y>>3,s);if(!i||!(x&1))c2=hs(x>>1,y>>1,s+1);if(!i||!(x&15)){c16=hs(x>>4,y,s+3);w16=hs(x>>4,y>>4,s+7)}
        let v=.5+.3*(c8-.5)+.16*(c2-.5)+.1*(hs(x,y,s+2)-.5);
        const d=((x-cx)/120)**2+dy,rk=Math.min(1,d*.8),r=((y+Math.round(1.4*(sx[i]*cy0+cxs[i]*sy)))%6+6)%6;// (the grooves: sin(x/41 + y/97 + s))
        if(c16>.18){if(r===0)v-=.16*rk;else if(r===1)v+=.07*rk}
        if(d<1&&hs(x>>2,y>>2,s+6)>.72)v-=.12*(1-d);// (scuffed where the fighters meet)
        if(G.wet&&w16<.3)v-=.18*G.wet;
        if(y>=fw&&y<fw+3)v-=.18-(y-fw)*.05;// (the far wall's shadow)
        v=Math.max(0,Math.min(1,v));const lo=v<.5,a=lo?p0:p1,b=lo?p1:p2,t=lo?v*2:(v-.5)*2,o=(j*W+i)*4;
        let R=a[0]+(b[0]-a[0])*t,Gg=a[1]+(b[1]-a[1])*t,Bb=a[2]+(b[2]-a[2])*t;if(G.snow&&hs(x,y,s+4)<G.snow){R=R+(238-R)*.8;Gg=Gg+(242-Gg)*.8;Bb=Bb+(246-Bb)*.8}
        D[o]=R;D[o+1]=Gg;D[o+2]=Bb;D[o+3]=255}}
    g.putImageData(img,0,0)}
  // (the stands: the far side's tiers of benches facing the ring, the ends' beyond its end walls, the near side's crowd standing
  // with its back to you; every seat kept for the crowd's arms)
  stands(g,seats){const A=TOURNEY_ARENA,[MX,MY]=A.margin,T=A.tier,S=this.style.seat,F0=this.top-16,N0=this.bot+4;
    const tier=(y,x0,x1)=>{rect(g,S[2],x0,y-7,x1-x0,7);rect(g,S[1],x0,y,x1-x0,3);rect(g,S[0],x0,y,x1-x0,1);for(let x=x0+((y*7)&15);x<x1;x+=16)rect(g,S[2],x,y,1,3)};
    for(let y=F0-2;y-7>-MY-T;y-=T){tier(y,-MX,BW+MX);this.row(g,seats,y-7,-MX,BW+MX,1,true);
      for(const x of this.aisles()){rect(g,S[1],x,y-7,A.aisle,10);rect(g,S[0],x,y-1,A.aisle,1);rect(g,S[2],x,y+2,A.aisle,1)}}// (the stairs up the aisles)
    for(let y=F0-2+T;y<N0+11;y+=T){tier(y,-MX,-8);tier(y,BW+8,BW+MX);this.row(g,seats,y-7,-MX,-9,1);this.row(g,seats,y-7,BW+9,BW+MX,1)}
    for(let y=N0+12;y<BH+MY;y+=T)this.row(g,seats,y,-MX,BW+MX,-1)}
  // (the far stands' aisles: their x, clear of the gatehouse)
  aisles(){const A=TOURNEY_ARENA,[MX]=A.margin,out=[];for(let x=BW/2-A.aisleGap*Math.ceil((BW/2+MX)/A.aisleGap);x<BW+MX;x+=A.aisleGap)if(Math.abs(x-BW/2)>60)out.push(x);return out}
  // a row of the crowd, heads at y, from x0 to x1: f 1 facing the ring (front on), -1 their backs to you; aisles: leaving the aisles clear
  row(g,seats,y,x0,x1,f,aisles){const A=TOURNEY_ARENA,s=this.o.seed,races=this.o.races.length?this.o.races:['human'],fan=PX.ramp(this.o.col),gap=aisles?this.aisles():[];
    for(let x=x0;x+5<=x1;x+=A.seat){const h=n=>hs(x,y,s+n);if(h(1)>A.full||gap.some(a=>x+6>a&&x<a+A.aisle))continue;const X=x+(h(2)<.5?0:1),race=h(3)<A.others?'human':races[Math.floor(h(4)*races.length)],L=RACE_LOOK[race];
      const pick=(a,n)=>a[Math.floor(h(n)*a.length)],sk=PPAL[pick(L.skin,5)],hr=PPAL[pick(L.hair,6)][1],cl=h(7)<A.fans?fan:PPAL[pick(FOLK_CLOTH,8)];
      this.person(g,X,y,f,sk,hr,cl,L.beard,h(9)<A.hats&&!L.ears?PPAL[pick(['cloth','leather','linen','dark'],10)][1]:null);seats.push({x:X,y,f,k:sk[1],c:cl[1]})}}
  // one of the crowd: a head (hair, face; a dwarf's beard, a hat), shoulders and body in his clothes; seen from behind, all hair
  person(g,x,y,f,sk,hr,cl,beard,hat){
    if(f>0){rect(g,hr,x+1,y,3,1);rect(g,sk[1],x+1,y+1,3,2);rect(g,sk[2],x+3,y+2,1,1);rect(g,PEOPLE_OUT,x+1,y+1,1,1);rect(g,PEOPLE_OUT,x+3,y+1,1,1);if(beard)rect(g,hr,x+1,y+2,3,1)}
    else{rect(g,hr,x+1,y,3,2);rect(g,sk[2],x+1,y+2,3,1)}
    if(hat){rect(g,hat,x,y,5,1);rect(g,hat,x+1,y-1,3,1)}
    rect(g,cl[1],x,y+3,5,1);rect(g,cl[2],x,y+4,5,2);rect(g,cl[3],x,y+4,1,2);rect(g,cl[3],x+4,y+4,1,2);rect(g,cl[3],x+1,y+6,3,1)}
  // the lord's pavilion over the gatehouse: an awning striped in his colour and white on two posts, scalloped
  pavilion(g){const R=PX.ramp(this.o.col),x0=Math.round(BW/2-56),w=112,y0=this.top-82,W=this.style.seat;
    for(const x of [x0+2,x0+w-4]){rect(g,W[2],x,y0+8,2,34);rect(g,W[0],x,y0+8,1,34)}
    for(let x=0;x<w;x++){const c=(x>>3)&1?'#f0ead8':R[1];rect(g,c,x0+x,y0,1,8);if((x&7)>1&&(x&7)<6)rect(g,c,x0+x,y0+8,1,1)}rect(g,R[2],x0,y0,w,1);rect(g,R[3],x0,y0+7,w,1);
    rect(g,'#e8b94a',x0+w/2-1,y0-3,2,3)}// (a gilt finial)
  // the wall round the ring, in its culture's kind: the far one's face toward you, the near one's back, the ends seen from above;
  // the lord's hangings on the far face
  walls(g){const S=this.style,C=S.c,F0=this.top-16,F1=this.top-5,N0=this.bot+4,N1=N0+10,s=this.o.seed,R=PX.ramp(this.o.col);
    const face=(y0,y1)=>{rect(g,C[0],0,y0,BW,2);rect(g,C[1],0,y0+2,BW,y1-y0-2);rect(g,C[3],0,y1,BW,1);
      if(S.kind==='stone'){for(let y=y0+2,k=0;y<y1;y+=4,k++){rect(g,C[2],0,y+3,BW,1);for(let x=(k&1)*4;x<BW;x+=8)rect(g,C[2],x,y,1,3)}rect(g,S.trim,0,y0+2,BW,1)}
      else if(S.kind==='stake'){for(let x=0;x<BW;x+=4){const t=hs(x,y0,s)<.5?1:0;rect(g,C[0],x+1,y0-1-t,2,1+t);rect(g,C[2],x+3,y0,1,y1-y0);rect(g,C[0],x+1,y0+2,1,y1-y0-3)}
        rect(g,C[3],0,y0+4,BW,1);rect(g,C[3],0,y1-3,BW,1);if(S.trim)for(let x=20;x<BW;x+=44)if(hs(x,y0,s+1)<.6){rect(g,S.trim,x,y0+4,3,3);rect(g,C[3],x,y0+5,1,1);rect(g,C[3],x+2,y0+5,1,1)}}// (lashings; an Ashgor wall's bone and skulls)
      else{for(let y=y0+2,k=0;y<y1;y+=3,k++)for(let x=(k&1)*3;x<BW;x+=6){rect(g,C[0],x,y,4,1);rect(g,C[2],x+4,y,2,2)}// (woven living wood, leaves along its top)
        for(let x=0;x<BW;x+=2){const q=hs(x,y0,s+2);if(q<.7)rect(g,q<.2?'#8cd590':S.trim,x,y0-1-(q<.35?1:0),2,2);if(q>.97)rect(g,'#f0b0d0',x,y0-1,1,1)}}};
    face(F0,F1);face(N0,N1);
    for(let x=24;x<BW-24;x+=TOURNEY_ARENA.drapes){if(Math.abs(x+3-BW/2)<44)continue;rect(g,R[1],x,F0+2,7,7);rect(g,R[2],x+5,F0+2,2,7);rect(g,R[0],x,F0+2,7,1);rect(g,R[2],x+2,F0+9,3,1);rect(g,R[3],x+3,F0+10,1,1)}
    for(const x0 of [0,BW-6]){rect(g,C[1],x0,F0,6,N1-F0+1);rect(g,C[0],x0+1,F0,4,N1-F0);for(let y=F0+3;y<N1;y+=4)rect(g,C[2],x0,y,6,1);rect(g,C[3],x0===0?5:x0,F0,1,N1-F0+1)}
    for(const [x0,y0] of [[-2,F0-6],[BW-8,F0-6],[-2,N0-4],[BW-8,N0-4]]){rect(g,C[3],x0,y0,10,16);rect(g,C[1],x0+1,y0+1,8,14);rect(g,C[0],x0+1,y0+1,8,3);rect(g,C[2],x0+7,y0+4,2,11)}}// (corner posts)
  // the gate: the culture's gatehouse (engine/buildmodels.js PX.buildingModel) in the middle of the far wall, its gate on the ring
  gate(g){const m=PX.buildingModel({culture:this.o.culture,type:'gatehouse',seed:this.o.seed,env:this.o.climate}),img=m.img,b=TourneyArena.footOf(img);
    const x=Math.round(BW/2-img.width/2),y=this.top-4-b;g.drawImage(img,x,y);if(m.snow)g.drawImage(m.snow.img,x,y)}
  // (the lowest row of a picture with a pixel in it)
  static footOf(img){if(img._foot!=null)return img._foot;const d=img.getContext('2d').getImageData(0,0,img.width,img.height).data;let b=img.height-1;
    for(;b>0;b--){let any=false;for(let x=0;x<img.width&&!any;x++)any=d[(b*img.width+x)*4+3]>0;if(any)break}return img._foot=b}
  // (its flags: the lord's two banners by the gate, his pennants along the far wall; drawn each frame, fluttering)
  banners(flags){const o=this.o,F0=this.top-16,big={k:'banner',col:o.col,dev:o.dev},pen={k:'pennant',col:o.col,dev:o.dev};
    flags.push({x:Math.round(BW/2-36),y:this.top-5,b:big,i:0},{x:Math.round(BW/2+36),y:this.top-5,b:big,i:1});TOURNEY_ARENA.pennants.forEach((p,i)=>flags.push({x:Math.round(BW*p),y:F0+1,b:pen,i:i+2}))}
  // (the frost: snow along the walls' tops and the benches' edges, drifted at the walls' feet)
  snow(g){const s=this.o.seed,[MX,MY]=TOURNEY_ARENA.margin,F0=this.top-16,N0=this.bot+4,W='#eef2f6';
    for(let x=-MX;x<BW+MX;x++){if(x>=0&&x<BW){if(hs(x,F0,s+8)<.8)rect(g,W,x,F0,1,1);if(hs(x,N0,s+8)<.8)rect(g,W,x,N0,1,1);if(hs(x,1,s+9)<.5)rect(g,W,x,this.top-4,1,1+(hs(x,2,s+9)<.3?1:0))}
      for(let y=F0-2;y>-MY;y-=TOURNEY_ARENA.tier)if(hs(x,y,s+10)<.45)rect(g,W,x,y,1,1)}}
  // the picture each frame (render.js drawLayer: the part in view, x0..x1, y0..y1 in field px), the flags, the crowd's arms, and
  // beyond the field the shade render.js lays over the field's edges, so its rows match across
  drawView(g,x0,y0,x1,y1){if(!this.cv)return;const [MX,MY]=TOURNEY_ARENA.margin,now=performance.now()/1000;this.crowd.watch(now);
    const a=Math.max(-MX,Math.floor(x0)),b=Math.max(-MY,Math.floor(y0)),c=Math.min(BW+MX,Math.ceil(x1)),d=Math.min(BH+MY,Math.ceil(y1));if(c<=a||d<=b)return;
    g.drawImage(this.cv,a+MX,b+MY,c-a,d-b,a,b,c-a,d-b);
    for(const f of this.flags){const s=bannerSprite(f.b,Math.floor(now*2+f.i*.37)%2);g.drawImage(s,f.x-s.px,f.y-s.py)}
    this.crowd.draw(g,a,b,c,d,now);
    if(typeof B!=='undefined'&&B&&!B.world){const t=fieldTop()-FIELD_EDGE.body+6,e=fieldBot()+4;for(const [p,q] of [[a,Math.min(0,c)],[Math.max(BW,a),c]]){if(q<=p)continue;
      g.fillStyle='rgba(8,10,16,.35)';if(t>b)g.fillRect(p,b,q-p,t-b);if(e<d)g.fillRect(p,e,q-p,d-e);g.fillStyle='rgba(232,224,200,.18)';g.fillRect(p,t,q-p,1);g.fillRect(p,e,q-p,1)}}}
}
/* the crowd (one an arena): it watches the bout and cheers, in a wave of raised arms along the stands from where it happened, and
   aloud (audio.js: cheer; the end's roar). A hard blow (TOURNEY_ARENA.crowd.hard of his health or more), a man knocked down or
   felled; the whole crowd as the bout opens and roaring at its end. Its cheers {x, p (strength), t (s), all, life} */
class TourneyCrowd{
  constructor(arena){this.a=arena;this.cheers=[];this.hp=new Map();this.downs=new Set();this.b=null;this.roared=false}
  // (the bout read, as it is drawn: who lost how much since the last frame, who is down, whether it is over)
  watch(now){const b=typeof B!=='undefined'?B:null,C=TOURNEY_ARENA.crowd;if(!b||!b.units)return;
    if(b!==this.b){this.b=b;this.hp.clear();this.downs.clear();this.cheers.length=0;this.roared=false;this.cheer(BW/2,C.greet,now,true,'cheer')}
    for(const u of b.units){const was=this.hp.get(u.id),hp=Math.max(0,u.hp);
      if(was!=null&&hp<was){if(hp<=0)this.cheer(u.x,1.2,now);else if(was-hp>=C.hard*u.max)this.cheer(u.x,.5+Math.min(.7,(was-hp)/u.max*2),now)}this.hp.set(u.id,hp);
      if(u.down>0){if(!this.downs.has(u.id)){this.downs.add(u.id);if(hp>0)this.cheer(u.x,1,now)}}else this.downs.delete(u.id)}
    if(b.over&&!this.roared){this.roared=true;this.cheer(BW/2,1.4,now,true,'roar')}}
  // a cheer at x (p its strength: 1 a man down; all the whole crowd at once), heard (cue: cheer, else roar)
  cheer(x,p,now,all,cue){const C=TOURNEY_ARENA.crowd;this.cheers=this.cheers.filter(c=>now-c.t<c.life+4);this.cheers.push({x,p,t:now,all:!!all,life:cue==='roar'?C.roar:C.life});
    if(cue==='roar')sfx('roar');else sfxAt('cheer',x,(this.a.top+this.a.bot)/2,{vol:Math.min(1,.5+p*.4)})}
  // (how hard the crowd at x cheers now, 0 to about 1.4: the strongest cheer reaching it, fading)
  level(x,now){const C=TOURNEY_ARENA.crowd;let L=0;for(const c of this.cheers){const d=c.all?0:Math.abs(x-c.x),dt=now-c.t-d/C.wave;if(dt<0||dt>c.life)continue;
    const k=c.p*(1-dt/c.life)*(c.all?1:Math.max(0,1-d/(C.reach*(c.p+.5))));if(k>L)L=k}return L}
  // (the arms of those in view, x0..y1: raised as the cheer reaching them outdoes their calm (a hash of the seat), waving; now and
  // then one raises an arm on his own)
  draw(g,x0,y0,x1,y1,now){const C=TOURNEY_ARENA.crowd,S=this.a.seats||[],s=this.a.o.seed,lv=new Map(),tick=Math.floor(now*.7),by=new Map();
    const arm=(col,x,y)=>{let l=by.get(col);if(!l)by.set(col,l=[]);l.push(x,y)};// (by colour, filled at once)
    for(let i=0;i<S.length;i++){const p=S[i];if(p.x+5<x0||p.x>x1||p.y+7<y0||p.y-2>y1)continue;const bx=p.x>>3;let L=lv.get(bx);if(L==null){L=this.level(p.x,now);lv.set(bx,L)}
      let up=0;if(L>.12+.75*hs(i,1,s))up=((now*C.arms+hs(i,2,s))%1)<.6?2:1;else if(hs(i,tick+Math.floor(hs(i,3,s)*9),s+7)<C.idle)up=1;if(!up)continue;
      arm(p.c,p.x+4,p.y+1);arm(p.k,p.x+4,p.y-1);if(up>1){arm(p.c,p.x,p.y+1);arm(p.k,p.x,p.y-1)}}
    for(const [col,l] of by){g.fillStyle=col;g.beginPath();for(let i=0;i<l.length;i+=2)g.rect(l[i],l[i+1],1,2);g.fill()}}
}
