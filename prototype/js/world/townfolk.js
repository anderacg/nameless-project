'use strict';
/* ---------- townsfolk: the people living in each holding, and their day by the clock (data/townfolk.js TOWNFOLK; the owner,
   2026-11-15: "Add people to the town and make their daily life routines") ----------
   Only round holdings near you, never saved, as the estates' workers (world/folk.js) and a camp's people (world/encampments.js
   CampFolk) are: made from the holding's seed as you come near, each where the hour has him (as if you had watched all along),
   forgotten far off. As many as its people give (TOWNFOLK.per, least to most). Each has a home (one of its houses, or its centre)
   and, by his role, a place of work (TOWNFOLK.work: the smithy's door, the market, a stall or a cart in the street, the well);
   the rest have no trade (at their door, on errands to the well and the square), and the children play in the square. Their day:
   asleep at home by night (inside, unseen); out at their door at dawn; at work in the morning; at midday some at the square before
   the centre, the market or the well; back to work; in the evening at the tavern (the brewery's door) or chatting outside their
   own; home at dusk. A band or a beast near, the holding afraid, besieged or sacked: everyone indoors. They walk the town's open
   ground and streets (TownWalk: never through a building, a field or a wall), each way found once as they set out. Drawn within
   your sight in the world's figures and their land's dress. Their own seeded streams: the world's Math.random untouched ---------- */

/* the ground a holding's people walk: its town and TOWNFOLK.pad tiles round it, its square too; a byte a tile, free where one may
   walk (no water or peak, no building, field or wall: lots.js occAt, townwalls.js), and its cost (TOWNFOLK.cost: the streets
   cheapest). The cheapest way to a tile from anywhere in it (field), made once for each tile asked and kept */
const TF_STEPS=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
class TownWalk{
  constructor(t){const F=TOWNFOLK,b=Layout.of(t).innerBox()||{x0:t.tx,y0:t.ty,x1:t.tx,y1:t.ty},p=F.pad,C=F.cost,wall=new Set(TownWall.of(t)?.shut||[]);
    this.x0=Math.max(0,Math.min(b.x0,t.tx-F.square.w)-p);this.y0=Math.max(0,b.y0-p);this.x1=Math.min(MW-1,Math.max(b.x1,t.tx+F.square.w)+p);this.y1=Math.min(MH-1,Math.max(b.y1,t.ty+F.square.d)+p);
    const w=this.w=this.x1-this.x0+1,h=this.h=this.y1-this.y0+1;this.free=new Uint8Array(w*h);this.cost=new Float32Array(w*h);this.fields=new Map();
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const X=this.x0+x,Y=this.y0+y,i=Y*MW+X,k=tiles[i];if(!passable(k)||occAt(X,Y)>0||wall.has(i))continue;
      const j=y*w+x;this.free[j]=1;this.cost[j]=k===T_ROAD||k===T_FORD?C.road:k===T_OPEN?C.open:k===T_HILL?C.hill:k===T_FOREST?C.forest:C.other}}
  // (a tile's place in the box, -1 outside it; whether it is free; a point's)
  at(tx,ty){return tx<this.x0||ty<this.y0||tx>this.x1||ty>this.y1?-1:(ty-this.y0)*this.w+tx-this.x0}
  ok(tx,ty){const j=this.at(tx,ty);return j>=0&&this.free[j]===1}
  okAt(x,y){return this.ok(Math.floor(x/TILE),Math.floor(y/TILE))}
  mid(j){const x=j%this.w;return{x:(this.x0+x+.5)*TILE,y:(this.y0+(j-x)/this.w+.5)*TILE}}
  // (each tile's cost to reach tile j, Dijkstra's way from it, kept as floats (fround: a tile popped is the one pushed): a diagonal
  // only between two free tiles, as the lanes go)
  field(j){let D=this.fields.get(j);if(D)return D;const w=this.w,h=this.h,H=new WayHeap();D=new Float32Array(w*h).fill(Infinity);
    if(this.free[j]){D[j]=0;H.push(0,j)}
    while(H.n){const d=H.top,q=H.pop();if(d>D[q])continue;const x=q%w,y=(q-x)/w;
      for(const [a,b,c] of TF_STEPS){const X=x+a,Y=y+b,m=Y*w+X;if(X<0||Y<0||X>=w||Y>=h||!this.free[m]||a&&b&&!(this.free[y*w+X]&&this.free[Y*w+x]))continue;
        const e=Math.fround(d+c*(this.cost[m]+this.cost[q])/2);if(e<D[m]){D[m]=e;H.push(e,m)}}}
    if(this.fields.size>=64)this.fields.clear();this.fields.set(j,D);return D}
  // (is the straight line from one point to another clear, and 3 px either side of it: a figure never brushes a wall)
  clear(x0,y0,x1,y1){const d=Math.hypot(x1-x0,y1-y0);if(!d)return this.okAt(x0,y0);const n=Math.ceil(d/2),nx=-(y1-y0)/d*3,ny=(x1-x0)/d*3;
    for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n,y=y0+(y1-y0)*i/n;if(!this.okAt(x,y)||!this.okAt(x+nx,y+ny)||!this.okAt(x-nx,y-ny))return false}return true}
  // the way from (x, y) to the point g: down the field tile by tile, cut to its corners where the line is clear; null: none
  way(x,y,g){const w=this.w,j=this.at(Math.floor(g.x/TILE),Math.floor(g.y/TILE));let s=this.at(Math.floor(x/TILE),Math.floor(y/TILE));if(j<0||s<0||!this.free[j])return null;
    const D=this.field(j);if(!(D[s]<Infinity))return null;const pts=[];
    while(s!==j){const sx=s%w,sy=(s-sx)/w;let b=-1,bd=D[s];
      for(const [a,c] of TF_STEPS){const X=sx+a,Y=sy+c,m=Y*w+X;if(X>=0&&Y>=0&&X<w&&Y<this.h&&D[m]<bd&&(!a||!c||this.free[sy*w+X]&&this.free[Y*w+sx])){bd=D[m];b=m}}
      if(b<0)return null;s=b;if(s!==j)pts.push(this.mid(s))}
    pts.push({x:g.x,y:g.y});const out=[];let cx=x,cy=y;
    for(let i=0;i<pts.length;){let k=pts.length-1;while(k>i&&!this.clear(cx,cy,pts[k].x,pts[k].y))k--;out.push(pts[k]);cx=pts[k].x;cy=pts[k].y;i=k+1}
    return out}
}

/* a holding's person on the map (TownFolk makes them): a world object seen within your sight while out of doors, his name, role
   and holding over him; a click on him walks you to him and he greets you (TOWNFOLK.greet: by what he is about), nothing more */
class TownDweller extends WorldObject{
  get mapKind(){return 'townsfolk'}
  here(){const C=TownFolk.of.get(this.holding);return !!C&&!this.hid&&C.ppl.includes(this)}
  get meetsAnyTime(){return true}
  inView(V){return !this.hid&&yourSight(V).sees(this.x,this.y,1.3)}
  pick(at){if(this.inView(at.V))at.add(this,5,4)}
  meet(){const L=TOWNFOLK.greet[this.mode]||TOWNFOLK.greet.chat,line=L[folkHash(this.id+'|'+G.day+'|'+this.mode)%L.length];toast(this.name+', '+this.role+' of '+Discovery.nameOf(this.holding)+': “'+line+'”')}
  tip(){const n=Discovery.nameOf(this.holding);return '<b>'+htmlText(this.name)+'</b><small>'+cap1(this.role)+', of '+htmlText(n)+'</small><span class="act">Click: greet</span>'}
}

/* ---------- a holding's people (C: its ground, walk; its spots: homes, places of work, the square (before the centre's gate), the
   wells, the market, the tavern; ppl) ----------
   a spot: where people stand ({id, area: the free tiles round it they stand on, its own first, face: the x they look to there}) */
class TownFolk{
  static of=new Map();
  // (what changes them: its lots, built or not, where they stand)
  static key(t){return t.lots.length+'|'+t.lots.reduce((n,l)=>n+(l.st==='built'?1:0)+l.x*3+l.y*7,0)}
  // (how many are about: one for every TOWNFOLK.per of its people, least to most)
  static count(t){const F=TOWNFOLK;return clamp(Math.round((t.pop||t.T.pop0)/F.per),F.least,F.most)}
  // (a spot at the free tiles within r of tile (tx, ty) its people reach from the square (C.reach), the nearest first, 9 at most;
  // null: none)
  static spot(C,id,tx,ty,r,face){const W=C.walk,area=[];for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){const k=W.at(tx+i,ty+j);if(k>=0&&W.free[k]&&C.reach[k]<Infinity)area.push([Math.hypot(i,j),k])}
    if(!area.length)return null;area.sort((a,b)=>a[0]-b[0]);return{id,area:area.slice(0,9).map(a=>a[1]),face:face??null}}
  // (a lot's door: the free tile before its face (lots.js lotDoor), else the nearest round it; its people stand there and beside it)
  static door(C,l,r){const [dx,dy]=lotDoor(l),W=C.walk,ring=[];for(let j=-1;j<=l.n;j++)for(let i=-1;i<=l.n;i++)if(i<0||j<0||i>=l.n||j>=l.n)ring.push([l.x+i,l.y+j]);
    ring.sort((a,b)=>Math.hypot(a[0]-dx,a[1]-dy)-Math.hypot(b[0]-dx,b[1]-dy));
    for(const [x,y] of ring){const k=W.at(x,y);if(k>=0&&W.free[k]&&C.reach[k]<Infinity)return this.spot(C,'lot'+l.id,x,y,r||0,(l.x+l.n/2)*TILE)}return null}
  /* who lives there (count): homes by the room each gives (its households, its centre's; lots.js HOUSING), the places of work
     filled first one a place, then the second of each, children and those of no trade the rest; each his home, name, look and
     stream */
  static make(t){const F=TOWNFOLK,walk=new TownWalk(t),C={t,walk,ppl:[],key:this.key(t),f:Clock.frac,danger:this.danger(t)};this.of.set(t,C);
    // (the square: the tiles before the centre's gate, F.square.w either side and d out; its reach from the gate, or the nearest free tile)
    const g=[[t.tx,t.ty+1],...TF_STEPS.map(([a,b])=>[t.tx+a,t.ty+1+b])].map(([x,y])=>walk.at(x,y)).find(k=>k>=0&&walk.free[k]);if(g==null)return C;
    C.reach=walk.field(g);const sq=[];for(let y=t.ty+1;y<=t.ty+F.square.d;y++)for(let x=t.tx-F.square.w;x<=t.tx+F.square.w;x++){const k=walk.at(x,y);if(k>=0&&walk.free[k]&&C.reach[k]<Infinity)sq.push(k)}
    C.square={id:'square',area:sq.length?sq:[g],face:null};
    const R=seeded(t.seed*7919+29),lots=(t.lots||[]).filter(l=>l.st==='built'),homes=[],jobs=[],well=[];
    for(const l of lots){const k=l.k==='nook'?l.type:INNER.includes(l.k)&&bldLv(t,l.k)>0?l.k:null,J=k&&F.work[k];
      if(l.k==='house'||l.k==='centre'){const s=this.door(C,l),room=l.k==='house'?lotHouseholds(t,l)*HOUSING.household:HOUSING.centre[l.type]||0;if(s&&room>0)homes.push([s,room])}
      if(!J)continue;const s=this.door(C,l,k==='brewery'||k==='market'?2:1);if(!s)continue;
      if(k==='well')well.push(s);if(k==='market')C.market=s;if(k==='brewery')C.tavern=s;for(let n=0;n<J.n;n++)jobs.push({n,k,s,J})}
    if(!homes.length)homes.push([C.square,1]);jobs.sort((a,b)=>a.n-b.n);
    C.noon=[C.square,C.market,...well].filter(Boolean);C.errands=[C.square,...well];
    const N=this.count(t),kids=Math.round(N*F.child),work=Math.min(jobs.length,N-kids-Math.round((N-kids)*F.folk)),room=homes.reduce((a,h)=>a+h[1],0),D=F.day,span=a=>a[0]+R()*(a[1]-a[0]);
    // (each home as many as its share of the room; one with a trade in the home nearest his work with a place left, the rest by chance)
    const hs=homes.map(([s,r])=>({s,cap:Math.max(1,Math.ceil(r/room*N)),n:0})),homeOf=job=>{const L=hs.filter(h=>h.n<h.cap),A=L.length?L:hs;let h;
      if(job){const W=walk.field(job.s.area[0]);h=A.reduce((a,b)=>W[b.s.area[0]]<W[a.s.area[0]]?b:a)}else{let w=R()*A.reduce((a,b)=>a+b.cap,0);h=A.find(b=>(w-=b.cap)<0)||A[0]}
      h.n++;return h.s};
    for(let i=0;i<N;i++){const job=i<work?jobs[i]:null,child=!job&&i>=N-kids,race=t.races.length>1&&R()<.2?t.races[1]:t.races[0],id=t.name+'|tf|'+i,Nm=FOLK_NAMES[race]||FOLK_NAMES.human,home=homeOf(job);
      const J=job&&job.J,p=Object.assign(new TownDweller(),{holding:t,id,i,name:Nm[folkHash(id)%Nm.length],race,child,home,job:job?job.s:null,
        role:J?J.role:child?'child':t.T.rural?'villager':'townsman',look:J&&J.look||'folk',trade:J&&J.trade||null,v:folkHash(id+'|v')%32,R:seeded(t.seed*31+i*977+5),
        wake:span(D.wake),work:span(D.work),noon:span(D.noon),back:span(D.back),eve:span(D.eve),bed:span(D.home),x:0,y:0,dir:R()<.5?-1:1,walked:0,wait:0,wp:[],mode:null,hid:true,moving:false,shifts:0});
      C.ppl.push(p)}
    this.place(C);return C}
  // (everyone where the hour has them, at once: as you first come near, or after the clock leapt (a rest, a wait))
  static place(C){const f=Clock.frac;C.f=f;for(const p of C.ppl){const m=this.mode(C,p,f);this.aim(C,p,m);p.pend=false;p.wp=[];p.x=p.stand.x;p.y=p.stand.y;p.hid=m==='home';p.moving=false;p.wait=p.R()*3;if(!p.hid)this.face(C,p)}}
  // (what he does now, by the hour: home (asleep: inside), at his door (dawn, and a child's midday and evening), at work (a child
  // at play), at the square, the market or the well at midday, at the tavern or chatting at his door in the evening)
  static mode(C,p,f){if(C.danger||f<p.wake||f>=p.bed)return 'home';if(f<p.work)return 'door';
    if(p.child)return f>=p.noon&&f<p.back||f>=p.eve?'door':'play';
    if(f>=p.noon&&f<p.back&&this.goes(p,'n',TOWNFOLK.noon))return 'noon';
    if(f>=p.eve)return p.job&&p.job===C.tavern?'work':C.tavern&&this.goes(p,'e',TOWNFOLK.tavern)?'tavern':'chat';
    return 'work'}
  static goes(p,k,share){return folkHash(p.id+'|'+G.day+'|'+k)%1000/1000<share}
  // (the spot for it: his home; his work, or for one of no trade the day's errand (the square, a well, his door); the children's
  // square; the day's stop at midday; the tavern)
  static spotFor(C,p,m){const pick=(a,k)=>a[folkHash(p.id+'|'+G.day+'|'+k)%a.length];
    if(m==='work')return p.job||pick([...C.errands,p.home],'w');if(m==='play')return C.square;if(m==='noon')return pick(C.noon,'m');if(m==='tavern')return C.tavern;return p.home}
  // (where he stands at spot s: one of its tiles, by him and how often he has moved there, a few px off its middle)
  static stand(C,p,s){const q=C.walk.mid(s.area[folkHash(p.id+'|'+s.id+'|'+p.shifts)%s.area.length]);return{x:q.x+p.R()*8-4,y:q.y+p.R()*6-2}}
  // he turns to a new thing to do: his spot and the point he stands at there, the way to it looked for (route); out of his house,
  // he steps out of his door
  static aim(C,p,m){p.mode=m;p.spot=this.spotFor(C,p,m);p.stand=this.stand(C,p,p.spot);p.hurry=m==='home'&&C.danger;p.wait=0;
    if(p.hid&&m!=='home'){p.hid=false;const d=this.stand(C,p,p.home);p.x=d.x;p.y=d.y}p.pend=!p.hid;p.wp=[]}
  // (the way to his stand, at most TOWNFOLK.searches a frame; none found: he stands where he is)
  static route(C,p){if(this.budget<=0)return false;this.budget--;p.pend=false;p.wp=C.walk.way(p.x,p.y,p.stand)||[];if(!p.wp.length)this.arrive(C,p);return true}
  // (there: home, in at his door; else a while, facing whoever stands by him or the place he works at)
  static arrive(C,p){p.moving=false;if(p.mode==='home'){p.hid=true;return}const I=TOWNFOLK.idle;p.wait=I.wait[0]+p.R()*(I.wait[1]-I.wait[0])*(p.child?.5:1);this.face(C,p)}
  static face(C,p){const I=TOWNFOLK.idle;let o=null,od=I.chat;for(const q of C.ppl){if(q===p||q.hid||q.moving)continue;const d=Math.hypot(q.x-p.x,q.y-p.y);if(d<od){od=d;o=q}}
    const fx=o?o.x:p.mode==='work'&&p.spot&&p.spot.face!=null?p.spot.face:null;if(fx!=null&&Math.abs(fx-p.x)>1)p.dir=fx>p.x?1:-1}
  // (a band or a beast near, the holding afraid, besieged or sacked: everyone in)
  static danger(t){return besieged(t)||ruined(t)||Timed.of(t).has('fear')||folkThreat(t.x,t.y,TOWNFOLK.danger)}
  // his moment: a new thing to do as the hour turns; on his way, a step; there, a while, then maybe another spot of it (shift),
  // a turn, or a look at whoever is by him. Still out late (TOWNFOLK.day.late), in at once
  static live(C,p,d){const F=TOWNFOLK,f=Clock.frac,m=this.mode(C,p,f);if(m!==p.mode)this.aim(C,p,m);if(p.hid)return;
    if(m==='home'&&(f>=F.day.late||f<p.wake)&&!C.danger){p.hid=true;p.moving=false;p.wp=[];return}
    if(p.pend){if(!this.route(C,p))p.moving=false;return}
    if(p.wp.length){const q=p.wp[0],dx=q.x-p.x,dy=q.y-p.y,dd=Math.hypot(dx,dy),st=footStep(p.hurry?F.haste:F.gait,d)*(p.child?F.kid:1);
      if(Math.abs(dx)>.2)p.dir=dx>0?1:-1;p.moving=true;
      if(dd<=st){p.x=q.x;p.y=q.y;p.walked+=dd;p.wp.shift();if(!p.wp.length)this.arrive(C,p)}else{p.x+=dx/dd*st;p.y+=dy/dd*st;p.walked+=st}return}
    p.moving=false;if((p.wait-=d)>0)return;const I=F.idle,r=p.R();
    if(r<I.shift*(p.child?2:1)&&p.spot.area.length>1){p.shifts++;const s=this.stand(C,p,p.spot);if(C.walk.clear(p.x,p.y,s.x,s.y)){p.stand=s;p.wp=[s];return}}
    else if(r<I.shift+I.turn)p.dir=-p.dir;
    this.arrive(C,p)}
  // each moment: the holdings near you have their people, those far (or laid out anew) forget them; a leap of the clock places
  // everyone again
  static step(d){const F=TOWNFOLK;if(!F.on){this.of.clear();return}
    for(const [t,C] of this.of)if(!TOWNS.includes(t)||!t.lots||Math.hypot(t.x-P.x,t.y-P.y)>F.near+F.forget||C.key!==this.key(t))this.of.delete(t);
    this.budget=F.searches;const f=Clock.frac;
    for(const t of TOWNS){if(!t.lots||Math.hypot(t.x-P.x,t.y-P.y)>F.near)continue;const C=this.of.get(t)||this.make(t);C.danger=this.danger(t);
      if(((f-C.f)%1+1)%1>.03)this.place(C);C.f=f;for(const p of C.ppl)this.live(C,p,d)}}
  // (everyone out of doors, for a click: world.js worldObjects)
  static all(){const out=[];for(const C of this.of.values())for(const p of C.ppl)if(!p.hid)out.push(p);return out}
  // within your sight, each by his feet: a trade's peasant (data/units.js peasantKind: as the estates' workers, in the owner's
  // colour) or his role's dress (people.js folkLook), his land's clothes; a child smaller
  static draw(ents,cam,V){if(!this.of.size)return;const S=yourSight(V),k0=WORLD_BATTLE.sprite/WORLD_BATTLE.scale;
    for(const [t,C] of this.of){const cl=dressClimAt(t.x,t.y),tint=FACS[t.owner]?.col||'#bda882';
      for(const p of C.ppl){const sx=Math.round(p.x-cam.x),sy=Math.round(p.y-cam.y);if(p.hid||sx<-16||sy<-8||sx>VW+16||sy>VH+40||!S.sees(p.x,p.y,1.3)||B?.world?.hides(p))continue;
        ents.push({y:p.y,f:()=>dressedIn(cl,()=>{const pose=p.moving?2+footFrame(p.walked,p.i):0,k=k0*(p.child?.72:1),
          sp=p.trade?unitSprite(peasantKind(p.race,p.trade),0,false,p.v%6,pose,false,false,tint):personSprite(p.look,p.race,p.v,pose);
          ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(sx-2,sy-1,5,2);ctx.save();ctx.translate(sx,sy);ctx.scale(p.dir<0?-k:k,k);ctx.drawImage(sp,-Math.floor(sp.width/2),-sp.height+2);ctx.restore()})})}}}
}
const drawTownFolk=(ents,cam,V)=>TownFolk.draw(ents,cam,V);
Systems.add({name:'town folk',order:{frame:143},frame:d=>TownFolk.step(d)});
onWorld(()=>TownFolk.of.clear());
