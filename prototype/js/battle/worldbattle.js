'use strict';
/* ---------- campaign formations and battles on the land where the armies meet ---------- */
/* melee: on the world map each fighter is drawn sprite times as big (and his formation's slots as wide), so his melee reach and
   the few fixed melee distances (meleeK: a duel's slack, the riders' contact, a bowman's blade) are that much more too (the owner,
   2026-10-29: "the units overlap in world battle"); off, as they were */
// (an army coming in is told as it comes ("X enters the battle"): where its men stepped in, every other side has as last seen (BattleSight
// lastSeen), so a captain who has not set eyes on them still knows where to go: commander.js search; the owner, 2026-10-30: his army
// stood idle as bandits joined, the watch routing)
function heralded(units){const teams=B.sides?.active?B.sides.teams():[0,1];for(const u of units){const p=u.ls||(u.ls=[]);for(const t of teams)if(t!==u.team){p[2*t]=u.x;p[2*t+1]=u.y}}}
// (where a joining army comes in: the marker's radius r px, its colours by where it stands with you, its pulse a second, its fade s once in)
const ARRIVAL={r:5,pulse:1.2,fade:1.5,col:{own:'#6fa8e0',ally:'#8fd08a',foe:'#e0605a',neutral:'#dba75f'}};
const WORLD_BATTLE={on:true,melee:true,scale:6,inner:8,outer:14,interaction:6,apron:22,join:220,regroup:7,returns:1,turn:3.5,blocked:30,stall:6,sprite:3,step:1/60,sightBase:1,perFighter:4,avoid:28,avoidScan:1};
// Only local avoidance runs while campaign time is paused. Existing work/travel orders stay on their owners.
class BattleBystanders{
  constructor(area){this.area=area;this.time=0;this.next=0;this.entries=new Map();this.navs=new Map()}
  eligible(o){
    if(o===P||this.area.participants.has(o)||o.dead||o.gone||o.inside||o.fight||!Number.isFinite(o.x)||!Number.isFinite(o.y))return false;
    if(o.mapKind==='worker')return folkSeen(o);if(o.mapKind==='critter')return o.wild;
    if(o.mapKind==='road')return !o.trace&&!o.done&&(['approach','flee','walk','leave','bolt','graze'].includes(o.beh)||o.beh==='stay'&&o.D?.scene?.(o)?.every(([k])=>['walk','stand','soldier','rider','graze'].includes(k)));
    return ['lord','patrol','band','cparty','monster','caravan','refugee','ship'].includes(o.mapKind);
  }
  margin(o){return WORLD_BATTLE.avoid+(o instanceof Party?marchOuter(o):6)}
  mode(o){return o.mapKind==='ship'?'water':o.mapKind==='monster'&&MONSTERS[o.id]?.mythic?.fly?'air':'land'}
  nav(o){
    const mode=this.mode(o);let nav=this.navs.get(mode);if(nav&&nav.version===WAYV)return nav;
    const a=this.area,r=a.r+WORLD_BATTLE.avoid+96;
    nav=new MarchGround(P,[{x:Math.max(1,a.x-r),y:Math.max(1,a.y-r)},{x:Math.min(MW*TILE-1,a.x+r),y:Math.min(MH*TILE-1,a.y+r)}]);
    if(mode!=='land'){const g=nav.grid;nav.fly=mode==='air';for(let i=0;i<g.cost.length;i++){const x=nav.x+(i%g.C+.5)*g.cs,y=nav.y+(Math.floor(i/g.C)+.5)*g.cs;g.cost[i]=mode==='air'||isWater(Math.floor(x/TILE),Math.floor(y/TILE))?ROUTE.unit:0}g.wall.fill(0);nav.blocks=[];if(mode==='water')nav.stand=p=>nav.open(p)}
    this.navs.set(mode,nav);return nav;
  }
  plan(o){
    const a=this.area,nav=this.nav(o),safe=a.r+this.margin(o),dx=o.x-a.x,dy=o.y-a.y,d=Math.hypot(dx,dy),angle=d>1?Math.atan2(dy,dx):(folkHash(String(o.id||o.mapKind))%6283)/1000,goal={x:a.x+Math.cos(angle)*(safe+8),y:a.y+Math.sin(angle)*(safe+8)},reach=nav.island(o);
    let to=nav.snap(goal,reach,null,q=>Math.hypot(q.x-a.x,q.y-a.y)>=safe);
    // Trapped on a small island: move to the furthest reachable refuge instead of walking through water or walls.
    if(!to){const g=nav.grid;let best=d;for(let i=0;i<reach.length;i++)if(reach[i]&&g.cost[i]){const q={x:nav.x+(i%g.C+.5)*g.cs,y:nav.y+(Math.floor(i/g.C)+.5)*g.cs},r=Math.hypot(q.x-a.x,q.y-a.y);if(r>best&&nav.stand(q)){best=r;to=q}}}
    return to?{nav,to,path:nav.path(o,to),i:0,moving:o.moving}:null;
  }
  scan(){
    const objects=new Set([...W.parties,...W.monsters.map(asMonster),...W.caravans,...W.refugees.map(asRefugees),...W.critters.map(asHerd),...W.folk.map(asWorker),...W.ships.map(asShip),...roadList()]);
    for(const o of objects)if(!this.entries.has(o)&&this.eligible(o)&&Math.hypot(o.x-this.area.x,o.y-this.area.y)<this.area.r+this.margin(o)){const p=this.plan(o);if(p)this.entries.set(o,p)}
    for(const [o,p] of this.entries)if(!objects.has(o)||!this.eligible(o)){if(o.mapKind==='worker')o.moving=p.moving;this.entries.delete(o)}
  }
  speed(o){if(o.mapKind==='ship')return o.k==='trade'?SHIP_SPD:BOAT_SPD;if(o.mapKind==='worker')return FIELD.hurry;if(o.mapKind==='critter')return CRITTERS[o.id].spd||20;if(o instanceof Party)return partySpeed(o,o.troops);return ENC_SPD.run}
  step(dt){
    this.time+=dt;if(this.time>=this.next){this.next=this.time+WORLD_BATTLE.avoidScan;this.scan()}
    for(const [o,p] of this.entries){if(!this.eligible(o))continue;if(p.nav.version!==WAYV){const q=this.plan(o);if(!q)continue;Object.assign(p,q)}
      let left=this.speed(o)*dt/this.area.scale,moved=0;
      while(left>0&&p.i<p.path.length){const q=p.path[p.i],dx=q.x-o.x,dy=q.y-o.y,d=Math.hypot(dx,dy);if(d<.1){p.i++;continue}const n=Math.min(left,d),to={x:o.x+dx*n/d,y:o.y+dy*n/d};if(!p.nav.clear(o,to))break;o.x=to.x;o.y=to.y;o.dir=dx>=0?1:-1;WALKED.set(o,(WALKED.get(o)||0)+n);left-=n;moved+=n}
      if(o.mapKind==='worker')o.moving=moved>0;
      if(o instanceof Party)MarchArmy.of(o).step(dt/(this.area.scale*WORLD_SCALE.move));
    }
  }
  finish(){for(const [o,p] of this.entries)if(o.mapKind==='worker')o.moving=p.moving;this.entries.clear();this.navs.clear()}
}
class WorldBattleArea{
  constructor(e){
    const other=e.ref?.src||e.ref,a={x:P.x,y:P.y,facing:marchFacing(P)},b=other&&Number.isFinite(other.x)&&Number.isFinite(other.y)?other:{x:P.x+worldBattleReach(other),y:P.y};
    const r0=Math.max(marchOuter(P),MarchArmy.spread(P)),r1=other instanceof Party?Math.max(marchOuter(other),MarchArmy.spread(other)):Math.max(WORLD_BATTLE.outer,...(other?.ws||[]).map(f=>Math.hypot(f.x-b.x,f.y-b.y)+3)),d=Math.hypot(a.x-b.x,a.y-b.y),r=Math.max(r0,r1,(d+r0+r1)/2),at=d>0?(r-r0)/d:0;
    this.fight=e.fight||(e.kind==='field'?e.ref:null);this.initial=new Set([P,...(this.fight?[...this.fight.sides.flatMap((_,i)=>sideParties(this.fight,i))]:other?[other]:[])]);
    this.sightRadius=Math.max(vis(),WORLD_SCALE.sight[other?.mapKind==='lord'?'lord':other?.mapKind==='monster'?'monster':'band']);this.fighters=P.fighters+(this.fight?[...this.initial].filter(o=>o!==P).reduce((n,o)=>n+(o.fighters??o.troops.length),0):other instanceof Party?other.fighters:e.list?encounterMainFighters(e):e.n||0);
    this.viewport={x:G.cam.x,y:G.cam.y};this.scale=WORLD_BATTLE.scale;this.x=r0>=d+r1?a.x:r1>=d+r0?b.x:a.x+(b.x-a.x)*at;this.y=r0>=d+r1?a.y:r1>=d+r0?b.y:a.y+(b.y-a.y)*at;this.r=r;
    // A joined fight has several existing armies, each with its own formation footprint.
    if(this.fight)for(const o of this.initial){if(o===P)continue;const reach=Math.max(marchOuter(o),MarchArmy.spread(o)),dx=o.x-this.x,dy=o.y-this.y,dist=Math.hypot(dx,dy);if(dist+reach<=this.r)continue;if(reach>=dist+this.r){this.x=o.x;this.y=o.y;this.r=reach}else{const size=(this.r+dist+reach)/2,k=dist?(size-this.r)/dist:0;this.x+=dx*k;this.y+=dy*k;this.r=size}}
    this.r=Math.max(this.r,this.sightRadius*WORLD_BATTLE.sightBase+Math.sqrt(this.fighters)*WORLD_BATTLE.perFighter);
    this.span=Math.ceil(2*(this.r+WORLD_BATTLE.apron));this.x0=this.x-this.span/2;this.y0=this.y-this.span/2;this.cx=this.cy=this.span*this.scale/2;this.radius=this.r*this.scale;
    this.joinedFight=!!this.fight;this.starts=[a,{x:b.x,y:b.y,facing:other instanceof Party?marchFacing(other):Math.atan2(a.y-b.y,a.x-b.x)}];this.participants=new Set([...this.initial,other,this.fight,...(e.kind==='villagers'?other?.ws||[]:[])]);this.pending=[];this.turned=new Set();this.arrivals=[];this.serial=0;this.marchClamp=p=>this.world(this.constrain(this.field(p),18));this.marchInside=p=>this.inside(this.field(p),6);
  }
  field(p){return{x:(p.x-this.x0)*this.scale,y:(p.y-this.y0)*this.scale}}
  world(p){return{x:this.x0+p.x/this.scale,y:this.y0+p.y/this.scale}}
  distance(p){return Math.hypot(p.x-this.cx,p.y-this.cy)}
  inside(p,pad=0){return this.distance(p)<=this.radius-pad}
  constrain(p,pad=6){const d=this.distance(p),r=Math.max(0,this.radius-pad);return d>r?{x:this.cx+(p.x-this.cx)*r/d,y:this.cy+(p.y-this.cy)*r/d}:{x:p.x,y:p.y}}
  exit(u,extra=0){let dx=u.x-this.cx,dy=u.y-this.cy,d=Math.hypot(dx,dy);if(d<1){dx=u.team?1:-1;dy=0;d=1}const r=this.radius+extra;return{x:this.cx+dx*r/d,y:this.cy+dy*r/d}}
  // The combat grid samples this exact window of the world. No mirrored/generated arena replaces it.
  terrain(){
    const cs=TERRAIN.cs,C=Math.ceil(BW/cs),R=Math.ceil(BH/cs),N=C*R,T=new BattleTerrain({cs,C,R,kind:new Uint8Array(N),lvl:new Uint8Array(N),up:new Int8Array(N).fill(-1)});
    T.c0=CLIMS.indexOf(this.env.c);T.mix={c0:this.env.c,c:this.env.c,t:this.env.t,w:[]};T.clim=new Uint8Array(N);T.road=new Uint8Array(N);T.wall=new Uint8Array(N);
    for(let r=0;r<R;r++)for(let c=0;c<C;c++){const i=r*C+c,p=this.world({x:(c+.5)*cs,y:(r+.5)*cs}),tx=Math.floor(p.x/TILE),ty=Math.floor(p.y/TILE),j=ty*MW+tx,k=tAt(tx,ty);
      T.kind[i]=k===T_WATER?TKIND.deep:k===T_MOUNT?TKIND.rock:k===T_FOREST?TKIND.wood:k===T_FORD?TKIND.ford:climAt(p.x,p.y)==='swamp'?TKIND.marsh:TKIND.open;
      if(k===T_ROAD){T.kind[i]=TKIND.open;T.road[i]=1}T.clim[i]=WM.climAt(tx,ty);
      if(WM.has(tx,ty)){T.lvl[i]=Math.max(0,Math.min(3,(WM.elev[j]-64)>>5));const edge=WM.edge[j];if(p.x%TILE<cs/this.scale&&edge&4)T.wall[i]|=4;if(p.x%TILE>TILE-cs/this.scale&&edge&1)T.wall[i]|=1;if(p.y%TILE<cs/this.scale&&edge&8)T.wall[i]|=8;if(p.y%TILE>TILE-cs/this.scale&&edge&2)T.wall[i]|=2}
    }
    T.built=new Uint8Array(N);
    for(const box of marchFootprints(this.x0,this.y0,this.x0+this.span,this.y0+this.span)){
      for(let r=Math.max(0,Math.floor((box.y-this.y0)*this.scale/cs));r<Math.min(R,Math.ceil((box.y+box.h-this.y0)*this.scale/cs));r++)for(let c=Math.max(0,Math.floor((box.x-this.x0)*this.scale/cs));c<Math.min(C,Math.ceil((box.x+box.w-this.x0)*this.scale/cs));c++)T.built[r*C+c]=1;
    }
    const plan={recipe:'world',hills:[],woods:[],marsh:[],rocks:[],rivers:[],lane:0,built:{houses:[],fields:[]}};T.routes.build(8,BH-8);this.escapeRoutes=T.route;T.route=Object.fromEntries(Object.entries(T.route).map(([who,g])=>{const cost=g.cost.slice();for(let i=0;i<cost.length;i++)if(!this.inside({x:(i%g.C+.5)*g.cs,y:(Math.floor(i/g.C)+.5)*g.cs},4))cost[i]=0;return[who,{...g,cost,pv:0,mv:null,off:null,memo:new Map(),dm:new Map()}]}));T.finish({seed:WM.seedNum||1},plan,BW,8,BH-8,1,false);return T;
  }
  openPoint(p,T=B?.terrain){
    const a=this.constrain(p,12),ok=q=>!T||!T.solid[tIx(T,q.x,q.y)];if(ok(a))return a;
    for(let r=16;r<this.radius*2;r+=16)for(let k=0;k<16;k++){const q={x:a.x+Math.cos(k*Math.PI/8)*r,y:a.y+Math.sin(k*Math.PI/8)*r};if(this.inside(q,12)&&ok(q))return q}return a;
  }
  place(g,units,anchor,offset,owner=anchor,initial=false){
    const face=anchor.facing??(initial&&owner instanceof Party?marchFacing(owner):Math.atan2(this.y-anchor.y,this.x-anchor.x)),co=Math.cos(face),si=Math.sin(face),dir=co>=0?1:-1,p=this.openPoint(this.field({x:anchor.x+offset.x*co-offset.y*si,y:anchor.y+offset.x*si+offset.y*co}));
    g.ax=p.x;g.ay=p.y;g.face=g.currentFacing=face+(offset.face||0);g.order='hold';if(initial&&offset.id&&g.form!=='pack'){g.form=offset.form;g.files=offset.files}const slots=formSlots(g.form,units.length,g.face,g.files,WORLD_BATTLE.sprite);
    const army=MARCH_ARMIES.get(owner),march=army?.forGroup(g.sourceGroupId||g.id).filter(m=>!B.units.some(u=>!units.includes(u)&&u.marchUnit===m))||[];
    units.forEach((u,i)=>{u.sx=slots[i][0];u.sy=slots[i][1];const mini=march[i],worker=owner.ws?.find(f=>!f.gone&&workerAppearance(f).type===u.type&&!B.units.some(v=>v.worker===f));let q=worker?this.field(worker):mini?this.field(mini):initial&&Number.isFinite(owner.x)?this.field(owner):this.openPoint({x:p.x+u.sx,y:p.y+u.sy});if(!initial&&mini&&this.inside(q,6)&&B.terrain?.solid[tIx(B.terrain,q.x,q.y)])q=this.openPoint(q);u.x=q.x;u.y=q.y;u.dir=worker?(worker.dir<0?Math.PI:0):mini?.dir??face;u.face=Math.cos(u.dir)>=0?1:-1;
      u.v=mini?mini.id%6:u.hero||u.leader?0:u.v;u.worldTint=owner!==P&&FACS[forceRealm(owner)]?.col||owner?.look?.().col;u.worldSide=owner.mapKind==='monster'?1:0;delete u.look;delete u.side;// (your band keeps its map colour, P.look; any other force wears its realm's)
      if(owner.ws)u.worldTint=FACS[owner.fac]?.col||'#bda882';if(worker){u.worker=worker;const L=workerAppearance(worker);u.v=L.v;u.worldTint=L.tint}
      if(mini){u.marchUnit=mini;if(!this.inside(q,6)){u.hpLeft=u.hp;u.hp=0;u.left=true;u.waiting=true;this.arrivals.push({u,mini,army})}}});
    if(march.length){const live=units.filter(u=>u.hp>0);if(live.length){g.ax=live.reduce((n,u)=>n+u.x-u.sx,0)/live.length;g.ay=live.reduce((n,u)=>n+u.y-u.sy,0)/live.length}}
  }
  syncCamera(){
    BVW=VW;BVH=VH;const c=B.cam||(B.cam={keys:{},lt:0});c.z=1/this.scale;c.fit=false;c.x=(G.cam.x-this.x0)*this.scale;c.y=(G.cam.y-this.y0)*this.scale;
  }
  pan(dx,dy){G.cam.x=clamp(G.cam.x+dx,0,Math.max(0,MW*TILE-VW));G.cam.y=clamp(G.cam.y+dy,0,Math.max(0,MH*TILE-VH));this.syncCamera()}
  base(){ctx.save();try{drawWorld()}finally{ctx.restore()}this.syncCamera()}
  hides(o){return o===P||this.participants.has(o)&&!this.pending.some(p=>p.o===o)}
  sight(team=0){
    const b=B,V=vis();if(!b||b.world!==this)return[];
    if(!team)return[{...worldEye(),r:V}];
    if(!this.view||this.view.t!==b.t||this.view.v!==V||this.view.n!==b.units.length)this.view={t:b.t,v:V,n:b.units.length,teams:{}};
    if(this.view.teams[team])return this.view.teams[team];
    const points=b.units.filter(u=>u.team===team&&u.hp>0&&!u.left&&!u.rout).map(u=>({...this.world(u),r:(team?this.sightRadius:V)*fogRange(u)/FOG.char}));
    return this.view.teams[team]=points.filter((p,i)=>!points.some((q,j)=>j!==i&&(q.r>p.r||q.r===p.r&&j<i)&&Math.hypot(p.x-q.x,p.y-q.y)<=q.r-p.r));
  }
  seesWorld(x,y,team=0){return this.sight(team).some(p=>(x-p.x)**2+(y-p.y)**2<p.r*p.r)}
  visible(p,team=0){const q=this.world(p);return this.seesWorld(q.x,q.y,team)}
  clipSight(){ctx.beginPath();for(const p of this.sight()){const q=this.field(p),r=p.r*this.scale;ctx.moveTo(q.x+r,q.y);ctx.arc(q.x,q.y,r,0,Math.PI*2)}ctx.clip()}
  draw(){
    ctx.save();ctx.strokeStyle='#d1b464';ctx.lineWidth=this.scale;ctx.setLineDash([3*this.scale,4*this.scale]);ctx.beginPath();ctx.arc(this.cx,this.cy,this.radius,0,Math.PI*2);ctx.stroke();ctx.restore();
    this.drawArrivals();
    for(const a of this.arrivals){const p=this.field(a.mini);if(a.u.team&&!this.visible(p))continue;const s=marchSprite(a.mini,a.army.owner),k=WORLD_BATTLE.sprite;ctx.save();ctx.translate(p.x,p.y);ctx.scale(Math.cos(a.mini.dir??a.army.face)<0?-k:k,k);ctx.drawImage(s,-Math.floor(s.width/2),-s.height+2);ctx.restore()}
    for(const u of B.units)if(u.regroup&&(!u.team||this.visible(u))){ctx.fillStyle=sideCol(u,'ui');ctx.fillRect(u.x-2*WORLD_BATTLE.sprite,u.y-6*WORLD_BATTLE.sprite,4*WORLD_BATTLE.sprite,6*WORLD_BATTLE.sprite)}
  }
  /* where each army joining comes in (the owner, 2026-10-30: "an icon at the edge of the ring where that unit is coming in"): a
     marker on the ring toward it, while it closes in (pending) and while its men walk in (arrivals), in its colour by where it
     stands with you (ARRIVAL.col), its banner over it, its name, an arrow in; it fades over ARRIVAL.fade s once all are in. Drawn
     only (on the real clock; this.marks: the last seen of each) */
  arrivalsNow(){const at=new Map(),add=(o,team,p)=>{if(!o||!Number.isFinite(p.x))return;const m=at.get(o)||{o,team,x:0,y:0,n:0};m.x+=p.x;m.y+=p.y;m.n++;at.set(o,m)};
    for(const a of this.pending)add(a.o,a.team,this.field(a.o));for(const a of this.arrivals)add(a.army.owner,a.u.team,this.field(a.mini));return [...at.values()]}
  drawArrivals(){const A=ARRIVAL,now=performance.now()/1000,M=this.marks||(this.marks=new Map()),k=this.scale/WORLD_BATTLE.scale*WORLD_BATTLE.sprite,S=this.sides;
    for(const m of this.arrivalsNow()){const a=Math.atan2(m.y/m.n-this.cy,m.x/m.n-this.cx),r=S?.byOwner.get(armySource(m.o)),key=S&&r?S.colourKey(r.team):m.team?'foe':'ally';
      M.set(m.o,{a,col:A.col[key]||A.col.neutral,name:r?S.label(r):m.o.name||(m.o.mapKind==='lord'?lordName(m.o):'An army'),b:m.o.banner?.(),seen:now})}
    for(const [o,m] of M){const q=(now-m.seen)/A.fade;if(q>=1){M.delete(o);continue}const al=q>0?1-q:.75+.25*Math.sin(now*A.pulse*6.283),c=Math.cos(m.a),s=Math.sin(m.a),x=this.cx+c*this.radius,y=this.cy+s*this.radius;
      ctx.save();ctx.globalAlpha=al;ctx.translate(Math.round(x),Math.round(y));ctx.scale(k,k);
      ctx.fillStyle='#14161e';ctx.beginPath();ctx.arc(0,0,A.r+1,0,6.283);ctx.fill();ctx.fillStyle=m.col;ctx.beginPath();ctx.arc(0,0,A.r,0,6.283);ctx.fill();
      ctx.fillStyle='#14161e';ctx.beginPath();ctx.moveTo(-c*A.r*.65,-s*A.r*.65);ctx.lineTo(-s*A.r*.45+c*A.r*.25,c*A.r*.45+s*A.r*.25);ctx.lineTo(s*A.r*.45+c*A.r*.25,-c*A.r*.45+s*A.r*.25);ctx.closePath();ctx.fill();// (its arrow: in)
      if(m.b){const sp=bannerSprite(m.b,Math.floor(now*2)%2);ctx.drawImage(sp,-2,-A.r-sp.height)}ctx.restore();
      ctx.save();ctx.globalAlpha=al;txt(m.name,Math.round(x),Math.round(y+(A.r+5)*k),m.col,'center');ctx.restore()}}
  // Choose once from the reachable apron, rather than chasing a radial point which can be rock or behind a cliff.
  escapePlan(u){
    const g=this.escapeRoutes?.[routeWho(u.s)];if(!g)return null;const old=u.worldEscape;if(old&&old.g===g&&old.v===g.v)return old;
    const D=routeDist(g,u.x,u.y);let at=-1,best=Infinity;
    for(let i=0;i<D.length;i++){if(!Number.isFinite(D[i])||!g.cost[i])continue;const x=(i%g.C+.5)*g.cs,y=(Math.floor(i/g.C)+.5)*g.cs;
      if(this.distance({x,y})<this.radius+2||x<8||x>BW-8||y<fieldTop()||y>fieldBot())continue;
      if(D[i]<best){at=i;best=D[i]}}
    const to=at<0?this.exit(u,2*g.cs):{x:(at%g.C+.5)*g.cs,y:(Math.floor(at/g.C)+.5)*g.cs},p=routePath(g,u.x,u.y,to.x,to.y,{budget:g.cost.length});
    return u.worldEscape={g,v:g.v,to,p,i:0};
  }
  escapeWay(u,w=this.escapePlan(u)){if(!w)return null;const {g,p}=w;
    while(w.i<p.length-1&&(Math.hypot(p[w.i][0]-u.x,p[w.i][1]-u.y)<1||lineClear(g,u.x,u.y,...p[w.i+1])))w.i++;
    const q=p[w.i];if(!q)return null;const dx=q[0]-u.x,dy=q[1]-u.y,d=Math.hypot(dx,dy);return d>.001?[dx/d,dy/d,d]:null;
  }
  // Re-enter on the same terrain grid used to escape, through the nearest reachable point inside the ring.
  returnPlan(u){
    const g=this.escapeRoutes?.[routeWho(u.s)];if(!g)return null;
    const D=routeDist(g,u.x,u.y);let at=-1,best=Infinity;
    for(let i=0;i<D.length;i++){if(!g.cost[i]||!Number.isFinite(D[i]))continue;const x=(i%g.C+.5)*g.cs,y=(Math.floor(i/g.C)+.5)*g.cs;
      if(!this.inside({x,y},18))continue;if(D[i]<best){at=i;best=D[i]}}
    if(at<0)return null;const to={x:(at%g.C+.5)*g.cs,y:(Math.floor(at/g.C)+.5)*g.cs},p=routePath(g,u.x,u.y,to.x,to.y,{budget:g.cost.length});
    return{g,v:g.v,to,p,i:0};
  }
  watchBlocked(){
    if(B.over||B.t<(this.blockCheck||0))return;this.blockCheck=B.t+3;
    const a=B.units.filter(u=>u.team===0&&fighting(u)),b=B.units.filter(u=>battleEnemy(0,u)&&fighting(u));if(!a.length||!b.length||B.t-(B.lastHit||0)<WORLD_BATTLE.blocked){this.blockAt=null;return}
    const canReach=(mine,foes)=>{
      const tested={};for(const u of mine){const range=u.empty?BLADE.reach*meleeK():u.s.range||u.s.reach||12;if(foes.some(e=>Math.hypot(u.x-e.x,u.y-e.y)<=range+8*meleeK()&&!terrainBlocksView(u,e)))return true;
        const who=routeWho(u.s),g=B.terrain.route[who],i=routeIx(g,u.x,u.y);let seen=tested[who];if(!seen)tested[who]=seen=new Uint8Array(g.cost.length);if(seen[i])continue;const flood=routeFlood(g,i);for(let k=0;k<flood.length;k++)if(flood[k])seen[k]=1;if(foes.some(e=>flood[routeIx(g,e.x,e.y)]))return true;
      }return false;
    };
    if(canReach(a,b)||canReach(b,a))return;
    B.stalemate=true;B.retreat=true;B.over=true;B.win=false;B.endT=END_WAIT;log('The armies disengage: impassable ground blocks every route through the battle area.','gold','war');
  }
  escape(u,dt){
    if(!this.inside(u,-2)){this.depart(u);return}
    const exit=this.escapePlan(u)?.to||this.exit(u,2),way=this.escapeWay(u),p=way?{x:u.x+way[0]*way[2],y:u.y+way[1]*way[2]}:exit,d=Math.hypot(p.x-u.x,p.y-u.y),s=Math.min(d,u.s.spd*1.1*dt*tiredMul(u).spd);
    if(d>0){u.x+=(p.x-u.x)*s/d;u.y+=(p.y-u.y)*s/d;u.dir=Math.atan2(p.y-u.y,p.x-u.x);u.face=Math.cos(u.dir)>0?1:-1;u.spdNow=u.s.spd}fatigueStep(u,dt,s>0,false,false);
    if(!this.inside(u,-2))this.depart(u);
  }
  depart(u){
    u.fled=true;u.worldFled=true;const key=u.team?'fledFoes':'fledMine';B[key]=(B[key]||0)+1;const r=B.groups[u.grp]?.resolve;
    if(!B.over&&(r?.worldReturns||0)<WORLD_BATTLE.returns)u.regroup={t:0,phase:'rest',cycle:r?.worldReturns||0};delete u.worldEscape;leaveField(u);
  }
  clamp(){for(const u of B.units)if(u.hp>0&&!u.rout&&!withdrawing(u)){const p=this.constrain(u);u.x=p.x;u.y=p.y}
    for(const g of Object.values(B.groups))if(g.order!=='rout'&&g.order!=='withdraw'){const p=this.constrain({x:g.ax,y:g.ay},16);g.ax=p.x;g.ay=p.y;for(const q of g.queue||[]){const a=this.constrain(q,16);q.x=a.x;q.y=a.y}}}
  step(dt){
    B.surprise?.step();this.enterMarchers(dt);
    for(const u of B.units){const a=u.regroup;if(!a)continue;
      if(a.phase==='rest'){a.t+=dt;if(a.t>=WORLD_BATTLE.regroup)a.phase='return';continue}
      const w=a.way||(a.way=this.returnPlan(u));if(!w)continue;const way=this.escapeWay(u,w),s=way?Math.min(way[2],u.s.spd*dt):0;
      if(s>0){u.x+=way[0]*s;u.y+=way[1]*s;u.dir=Math.atan2(way[1],way[0]);u.face=way[0]>=0?1:-1}
      if(Math.hypot(w.to.x-u.x,w.to.y-u.y)>1)continue;
      if(u.worldFled){const key=u.team?'fledFoes':'fledMine';B[key]=Math.max(0,(B[key]||0)-1);delete u.worldFled}u.hp=u.hpLeft;delete u.left;delete u.fled;delete u.regroup;delete u.worldEscape;u.rout=false;u.shattered=false;u.rallied=false;u.tgt=null;
      const g=B.groups[u.grp],r=g?.resolve;if(r){if((r.worldReturns||0)<=a.cycle){r.worldReturns=a.cycle+1;r.routed=false;r.shattered=false;r.rallied=true;r.breakT=0;r.mor=MORALE.rally;r.confidence=0}r.refreshState();r.sync()}if(g&&!r?.routed){g.hold();g.aiReset()}battleEvent('rejoin',{u});
    }
    this.reinforce(dt);(this.bystanders||(this.bystanders=new BattleBystanders(this))).step(dt);this.watchBlocked();
  }
  enterMarchers(dt){
    if(!this.arrivals.length)return;for(const army of new Set(this.arrivals.map(a=>a.army))){const o=army.owner,d=Math.hypot(o.x-this.x,o.y-this.y);if(o!==P&&d>Math.max(0,this.r-marchOuter(o)-3))walk(o,this.x-o.x,this.y-o.y,Math.min(d,partySpeed(o,o.troops)*dt/this.scale));army.step(dt/(this.scale*WORLD_SCALE.move),false,this.marchClamp,this.marchInside)}let entered=false;
    this.arrivals=this.arrivals.filter(a=>{const p=this.field(a.mini),u=a.u;u.x=p.x;u.y=p.y;if(!this.inside(p,6))return true;u.hp=u.hpLeft;delete u.waiting;delete u.left;heralded([u]);const r=B.groups[u.grp]?.resolve;if(r){r.refreshState();r.sync()}entered=true;return false});
    if(entered){B.cmdT=0;B.moraleNext=0;setOrderUI()}
  }
  teamFor(o){
    const e=G.enc;if(!e)return -1;if(this.sides){const r=this.sides.reserve(o);return r?r.team:-1}if(o.mapKind==='monster')return e.kind==='monster'&&o.id===e.ref?.id?1:-1;const side=reinforceSide(e,o);if(side!==null)return side;if((e.allies||[]).some(f=>(f.src||f)===o))return 0;if((e.foes||[]).some(f=>(f.src||f)===o))return 1;
    if(o.mapKind==='band'&&e.kind==='party')return (o.kind||'bandits')===((e.ref?.src||e.ref)?.kind||'bandits')?1:-1;
    return o.mapKind==='cparty'?0:o.mapKind==='lord'&&lordWhy(e,o)||o.mapKind==='patrol'&&watchWhy(e,o)?0:-1;
  }
  reinforce(dt){
    for(const o of [...W.lords,...W.patrols,...cparties(),...bandits,...W.monsters.map(asMonster)]){if(this.participants.has(o)||o.dead||o.gone||o.inside||o.fight||!o.troops.length||Math.hypot(o.x-this.x,o.y-this.y)>this.r+WORLD_BATTLE.join)continue;const team=this.teamFor(o);if(team<0)continue;this.participants.add(o);this.pending.push({o,team});if(this.sides){const r=this.sides.byOwner.get(o);log(this.sides.label(r)+' approaches: '+this.sides.intent(r)+'.',battleEnemy(0,team)?'bad':'gold','war')}}
    for(let i=this.pending.length-1;i>=0;i--){const a=this.pending[i],o=a.o,d=Math.hypot(o.x-this.x,o.y-this.y);if(this.sides){const r=this.sides.byOwner.get(o);if(r)a.team=r.team}if(d>this.r-3){const sp=Math.min(d,partySpeed(o,o.troops)*dt/this.scale);walk(o,this.x-o.x,this.y-o.y,sp);MARCH_ARMIES.get(o)?.step(dt/(this.scale*WORLD_SCALE.move),false);if(d<(a.best??Infinity)-1){a.best=d;a.stuck=0}else if((a.stuck=(a.stuck||0)+dt)>WORLD_BATTLE.stall)this.turnAway(i);continue}if(this.sides&&!this.sides.room(o,a.existing?a.existing.reduce((n,id)=>n+B.units.filter(u=>u.grp===id).length,0):null))continue;if(a.existing){for(const id of a.existing){const g=B.groups[id],m=B.units.filter(u=>u.grp===id);for(const u of m){u.hp=u.hpLeft;delete u.left;delete u.waiting}this.place(g,m,o,{x:0,y:(a.existing.indexOf(id)-(a.existing.length-1)/2)*5},o);if(g.resolve){g.resolve.refreshState();g.resolve.sync()}}if(this.sides){const r=this.sides.byOwner.get(o);if(r)r.joined=true}B.cmdT=0;B.moraleNext=0;B.sight=null;log((o.mapKind==='lord'?lordName(o):o.name||o.label?.()||'An army')+' enters the battle.',a.team?'bad':'good','war');battleEvent('reinforcement',{party:o,team:a.team});setOrderUI()}else this.join(o,a.team);this.pending.splice(i,1)}
  }
  // a pending army that stops closing in (a river, a wall, the land) turns away: the fight no longer waits on it
  turnAway(i){const o=this.pending.splice(i,1)[0].o,r=this.sides?.byOwner.get(o);this.turned.add(o);if(r)r.away=true;log((r?this.sides.label(r):o.mapKind==='lord'?lordName(o):o.name||'An army')+' cannot reach the battle and turns away.','gold','war')}
  join(o,team){
    if(this.sides){let r=this.sides.byOwner.get(o)||this.sides.reserve(o);if(!r||r.joined||!this.sides.room(o))return false;team=r.team}
    const e=G.enc,list=team?e.foes:e.allies;let force=list.find(f=>(f.src||f)===o);if(!force){force=forceOf(o);if(!this.sides||team===0||this.sides.active&&battleEnemy(0,team))list.push(force);(e.help||(e.help=new Map())).set(force,{why:'riding into the battle',n:o.troops.length})}
    const owner=asParty(force),r=partyRoster(owner),builder=new BattleSetup({...B.opts,lv:o.lv||1});builder.env=B.env;builder.id=Math.max(-1,...B.units.map(u=>u.id))+1;
    const prefix='w'+(++this.serial)+'_',rows=[];
    for(const row of r.groups){const id=prefix+row.id,g=new BattleControl(id,team,{player:false,ally:team!==0&&battleFriend(0,team)||team===0,foe:battleEnemy(0,team),role:grpOf(ST[row.type]),name:row.name||ST[row.type].n,type:row.type,sourceGroupId:row.id,form:row.form||'line',files:row.files||null});B.groups[id]=g;
      const units=Array.from({length:row.count},()=>{const u=builder.spawn(troopOf(row.type),team,0,0);Object.assign(u,{grp:id,sourceGroupId:row.id,sourceArmy:owner,lord:owner});return u});B.units.push(...units);rows.push([g,units]);}
    for(const leader of battleLeaders({kind:'field',allies:team?[]:[force],foes:team?[force]:[]})){const unit=leader.comp?charOf(compInit(leader.comp),leader.comp):charOf(leader.ref),u=builder.spawn(unit,team,0,0),id=prefix+'leader';leader.team=team;Object.assign(u,{grp:id,leader,sourceArmy:owner});if(leader.comp)u.comp=true;const g=new BattleControl(id,team,{player:false,ally:team!==0&&battleFriend(0,team)||team===0,foe:battleEnemy(0,team),role:'hero',name:W.lords.includes(leader.ref)?lordName(leader.ref):leader.name,type:u.type});B.groups[id]=g;B.units.push(u);rows.push([g,[u]])}
    this.participants.add(o);this.sides?.joined(o,owner,rows.map(([g])=>g.id));if(this.sides?.active)for(const [g] of rows){g.armyName=this.sides.label(this.sides.byOwner.get(o));g.name=g.armyName+' · '+g.name}const added=rows.flatMap(a=>a[1]);for(const u of added){u.mor0=u.mor=unitMoraleOf(u.s);u.sta=FATIGUE.max;u.vig=1}
    rows.forEach(([g,m],i)=>{this.place(g,m,o,{x:0,y:(i-(rows.length-1)/2)*5},o);if(m.some(u=>!steady(u)))g.resolve=new BattleResolve(g.id,team,m.filter(u=>!steady(u)))});heralded(added);
    warmBattle(added);B.cmdT=0;B.moraleNext=0;B.sight=null;B.captains={};log((o.mapKind==='lord'?lordName(o):force.name||o.label())+' enters the battle.',team?'bad':'good','war');battleEvent('reinforcement',{party:o,team});setOrderUI();
  }
  finish(b){
    this.bystanders?.finish();
    if(G.enc?.kind==='villagers')workerBattleFinish(b,this);
    const marched=new Set();for(const u of b.units)if(u.marchUnit&&!u.waiting){const m=u.marchUnit,army=MARCH_ARMIES.get(u.sourceArmy?.src||u.sourceArmy);if(army)marched.add(army);if(u.hp>0||u.left){const p=this.world(u);m.x=p.x;m.y=p.y;m.dir=u.dir}else m.dead=true}
    for(const army of marched)army.settlePivot();
    const waiting=new Set([...this.pending.map(p=>p.o),...this.turned]),e=G.enc;
    if(e)for(const key of ['allies','foes'])e[key]=(e[key]||[]).filter(f=>!waiting.has(f.src||f));
    BVH=FIELD_H;BVW=Math.round(FIELD_H*MAPZOOM.vw/MAPZOOM.vh);if(b.hero&&(b.hero.hp>0||b.hero.left)){const p=this.world(b.hero);P.x=p.x;P.y=p.y;P.tx=null;const a=MARCH_ARMIES.get(P);if(a){a.x=P.x;a.y=P.y}}
  }
  ended(ap,ae){return !ap||!ae}
}
// Preparation has its own real-time movement clock. No combat systems or late arrivals run here.
const BATTLE_MUSTER={gap:20,retreat:16,inset:10,speed:1,minimum:18,queries:6,reach:.001,look:.25};
class BattleMuster{
  constructor(b){
    this.b=b;this.area=b.world;this.active=true;this.time=0;this.done=0;this.entries=[];this.armies=[];this.reserved=new Set();
    const a=this.area,by=new Map(),centers=[0,1].map(team=>{const m=b.units.filter(u=>u.team===team&&u.hp>0&&!u.left);return{x:m.reduce((n,u)=>n+u.x,0)/Math.max(1,m.length),y:m.reduce((n,u)=>n+u.y,0)/Math.max(1,m.length)}}),angle=Math.atan2(centers[1].y-centers[0].y,centers[1].x-centers[0].x);
    for(const g of Object.values(b.groups)){const units=b.units.filter(u=>u.grp===g.id&&u.hp>0&&!u.left),owner=g.player?P:units[0]?.sourceArmy;if(!owner||!units.length)continue;let army=by.get(owner);if(!army){army={owner,team:g.team,groups:[],rows:marchRows(owner)};by.set(owner,army);this.armies.push(army)}army.groups.push({g,units})}
    for(const army of this.armies){
      const face=angle+(army.team?Math.PI:0),co=Math.cos(face),si=Math.sin(face);
      const layout=army.groups.map(({g,units})=>{const row=army.rows.find(r=>r.id===(g.sourceGroupId||g.id))||{x:0,y:0,face:0,form:g.form,files:g.files};if(g.form!=='pack'){g.form=row.form;g.files=row.files}g.face=g.currentFacing=face+row.face;g.order='hold';
        const slots=formSlots(g.form,units.length,g.face,g.files,WORLD_BATTLE.sprite),offset={x:(row.x*co-row.y*si)*a.scale,y:(row.x*si+row.y*co)*a.scale};return{g,units,slots,offset}});
      const points=layout.flatMap(l=>l.slots.map(([x,y])=>({x:l.offset.x+x,y:l.offset.y+y}))),extent=Math.max(0,...points.map(p=>Math.hypot(p.x,p.y))),front=Math.max(0,...points.map(p=>p.x*co+p.y*si)),origin=a.field(army.owner),middle={x:(centers[0].x+centers[1].x)/2,y:(centers[0].y+centers[1].y)/2},room=(middle.x-origin.x)*co+(middle.y-origin.y)*si;
      const back=clamp(front+BATTLE_MUSTER.gap*a.scale/2-room,0,BATTLE_MUSTER.retreat*a.scale),anchor=a.constrain({x:origin.x-co*back,y:origin.y-si*back},extent+BATTLE_MUSTER.inset*a.scale);
      army.anchor={...a.world(anchor),facing:face};
      for(const l of layout){const {g,units,slots,offset}=l;g.ax=anchor.x+offset.x;g.ay=anchor.y+offset.y;
        units.forEach((u,i)=>{[u.sx,u.sy]=slots[i];this.entries.push({u,g,goal:a.constrain({x:g.ax+u.sx,y:g.ay+u.sy},12),path:null,at:0,done:false})});
      }
    }
  }
  plan(e){
    const grid=this.b.terrain.route[routeWho(e.u.s)],u=e.u;let goal=e.goal,p=routePath(grid,u.x,u.y,goal.x,goal.y,{budget:grid.cost.length}),ix=routeIx(grid,goal.x,goal.y);
    // An island, bank or building may prevent the ideal slot. Choose reachable ground without moving the actor there.
    if(!p.ok||this.reserved.has(ix)){
      const reach=routeFlood(grid,routeIx(grid,u.x,u.y));let best=-1,score=Infinity;
      for(let i=0;i<reach.length;i++){if(!reach[i]||!grid.cost[i]||this.reserved.has(i))continue;const x=(i%grid.C+.5)*grid.cs,y=(Math.floor(i/grid.C)+.5)*grid.cs,d=(x-goal.x)**2+(y-goal.y)**2;if(d<score){score=d;best=i}}
      if(best>=0){goal={x:(best%grid.C+.5)*grid.cs,y:(Math.floor(best/grid.C)+.5)*grid.cs};p=routePath(grid,u.x,u.y,goal.x,goal.y,{budget:grid.cost.length});ix=best}
    }
    this.reserved.add(ix);e.grid=grid;e.path=p;e.goal=p.length?{x:p.at(-1)[0],y:p.at(-1)[1]}:{x:u.x,y:u.y};u.sx=e.goal.x-e.g.ax;u.sy=e.goal.y-e.g.ay;
  }
  step(rt){
    if(!this.active||this.b!==B||B.paused||G.modal)return;const dt=Math.min(.1,Math.max(0,rt));if(!dt)return;this.time+=dt;let queries=0;
    const hero={x:B.hero.x,y:B.hero.y};
    for(const e of this.entries){
      if(e.done)continue;const u=e.u;if(!e.path){if(queries++>=BATTLE_MUSTER.queries)continue;this.plan(e)}
      let budget=Math.max(BATTLE_MUSTER.minimum,u.s.spd*WORLD_BATTLE.sprite*BATTLE_MUSTER.speed)*dt,moved=0;
      while(e.at<e.path.length&&budget>0){const q=e.path[e.at],dx=q[0]-u.x,dy=q[1]-u.y,d=Math.hypot(dx,dy);if(d<=BATTLE_MUSTER.reach){e.at++;continue}const step=Math.min(d,budget);u.x+=dx/d*step;u.y+=dy/d*step;u.dir=Math.atan2(dy,dx);u.face=Math.cos(u.dir)>=0?1:-1;budget-=step;moved+=step;if(step===d)e.at++}
      u.spdNow=moved/dt;u.run=0;
      if(e.at===e.path.length){e.done=true;this.done++;u.spdNow=0;u.vel=0;u.movF=0;u.dir=e.g.face;u.face=Math.cos(u.dir)>=0?1:-1}
    }
    // Follow the hero's actual movement, preserving the user's current zoom and framing.
    this.area.pan((B.hero.x-hero.x)/this.area.scale,(B.hero.y-hero.y)/this.area.scale);this.area.view=null;
    if(this.time>=(this.look||0)){this.look=this.time+BATTLE_MUSTER.look;B.sight=null;sightStep(true)}
    if(this.done===this.entries.length){this.active=false;B.ready=true;B.paused=true;B.sight=null;B.captains={};battleSpeedUI();setOrderUI();toast('Armies are in position. Press Start Battle when ready.')}
  }
}
const meleeK=()=>B?.world&&WORLD_BATTLE.melee?WORLD_BATTLE.sprite:1;
class WorldBattleSetup extends BattleSetup{
  // (each fighter's reach as big as he is drawn: meleeK)
  spawn(unit,team,x,y){const u=super.spawn(unit,team,x,y);if(WORLD_BATTLE.melee&&u.s.reach)u.s={...u.s,reach:u.s.reach*WORLD_BATTLE.sprite};return u}
  constructor(opts){super(opts);if(BattleSides.eligible(G.enc))BattleSides.limit(G.enc,opts.enemies?.length||0);this.area=new WorldBattleArea(G.enc)}
  survey(){
    const a=this.area,primary=G.enc.ref?.src||G.enc.ref;for(const owner of new Set([P,primary,...(G.enc.allies||[]).map(o=>o.src||o),...(G.enc.foes||[]).map(o=>o.src||o)]))if(owner instanceof Party)MarchArmy.of(owner).sync();BFIELD=null;BW=BH=a.span*a.scale;this.site=this.battleSite();this.env=battleEnv(false,this.site);a.env=this.env;this.env.text='Fight on the world map. The gold circle is fixed; routed soldiers can regroup beyond it and return.';
    this.field={top:8,bot:BH-8};this.createUnits();this.createGroups();
  }
  createGroups(){super.createGroups();for(const u of this.units)if(u.leader&&W.lords.includes(u.leader.ref))this.groups[u.grp].name=lordName(u.leader.ref)}
  terrain(){return this.TR=this.area.terrain()}
  *paint(){yield}
  canopy(){}
  createState(){const b=super.createState();b.world=this.area;b.obs=[];b.fog=false;return b}
  initialize(){
    BVW=VW;BVH=VH;const deploy=this.opts.deploy;this.opts.deploy=false;try{super.initialize()}finally{this.opts.deploy=deploy}const a=this.area,e=G.enc,rows=marchRows(P),primary=e.ref?.src||e.ref;
    for(const [id,g] of Object.entries(B.groups)){const m=B.units.filter(u=>u.grp===id),first=m[0],source=first?.sourceArmy,anchor=g.player?a.starts[0]:source?.src||source;
      if(!g.player&&source&&Number.isFinite(anchor?.x)&&Number.isFinite(anchor?.y)){a.participants.add(anchor);if(source!==primary&&source!==e.ref&&!a.initial.has(anchor)&&!a.inside(a.field(anchor),6)){const team=g.team;let p=a.pending.find(p=>p.o===anchor);if(!p){p={o:anchor,team,existing:[]};a.pending.push(p)}p.existing.push(id);m.forEach(u=>{u.hpLeft=u.hp;u.hp=0;u.left=true;u.waiting=true});continue}}
      const key=g.sourceGroupId||id,formation=g.player?rows:source instanceof Party?marchRows(source):[],offset=formation.find(r=>r.id===key)||{x:0,y:first?.leader?0:(Object.keys(B.groups).indexOf(id)%5-2)*7};a.place(g,m,g.player?a.starts[0]:this.area.joinedFight&&Number.isFinite(anchor?.x)?anchor:a.starts[1],offset,g.player?P:source?.src||source||e.ref,true);// (men of no army of their own, a camp's after a load: they stand for the place, e.ref)
    }
    if(this.surprise||a.joinedFight){B.ready=false;B.paused=false}else{B.muster=new BattleMuster(B);B.ready=false;B.paused=false}B.speed=G.speed;B.deploy=false;exitInit(B.units);a.clamp();B.sight=null;for(const u of B.units){delete u.ls;u.hid=0}if(BattleSides.eligible(e))this.area.sides=B.sides=new BattleSides(B,e);Surprise.begin(B,e);sightStep(true);warmBattle(B.units);
  }
  present(){super.present();B.deploy=false;bbar.hidden=false;this.area.syncCamera();if(B.muster?.active)toast('Armies are moving to their starting formations. Combat begins only after Start Battle.')}
  start(after){this.survey();this.terrain();this.muster();this.open();if(after)after();return Promise.resolve()}
}
function worldBattleEligible(opts){return WORLD_BATTLE.on&&!opts.sandbox&&!opts.tournament&&G.enc&&['party','lord','patrol','caravan','monster','field','villagers','estate','camp','ruin'].includes(G.enc.kind)}
