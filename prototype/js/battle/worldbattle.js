'use strict';
/* ---------- campaign formations and battles on the land where the armies meet ---------- */
const WORLD_BATTLE={on:true,scale:6,inner:18,outer:38,interaction:8,apron:22,approach:9,join:220,regroup:7,clear:16,returns:1,turn:3.5,blocked:30};
const MARCH_FACING=new WeakMap();
function marchFacing(o){
  const now=performance.now()/1000,old=MARCH_FACING.get(o),dx=old?o.x-old.x:0,dy=old?o.y-old.y:0,to=Math.hypot(dx,dy)>.05?Math.atan2(dy,dx):old?.to??((o.look?.().dir||o.dir||1)<0?Math.PI:0);
  const dt=old?clamp(now-old.at,0,.1):0,gap=old?Math.atan2(Math.sin(to-old.a),Math.cos(to-old.a)):0,a=old?old.a+clamp(gap,-WORLD_BATTLE.turn*dt,WORLD_BATTLE.turn*dt):to;
  MARCH_FACING.set(o,{x:o.x,y:o.y,a,to,at:now});return a;
}
const marchExtent=row=>3+Math.max(0,...formSlots(row.form||'line',row.count||1,0,row.files).map(p=>Math.hypot(...p)))/WORLD_BATTLE.scale;
const marchOuter=o=>Math.max(WORLD_BATTLE.outer,WORLD_BATTLE.inner+4+Math.max(0,...partyRoster(o).groups.map(marchExtent)));
// March offsets are in world pixels, relative to the hero (east is the front). Missing entries use a stable default.
function marchRows(o){
  const r=partyRoster(o),ids=o===P?r.order.filter(id=>id==='hero'||(id.startsWith('comp_')?compsInBand().includes(id.slice(5)):r.groups.some(g=>g.id===id&&g.count>0))):r.groups.filter(g=>g.count>0).map(g=>g.id),others=ids.filter(id=>id!=='hero');
  return ids.map(id=>{const g=r.groups.find(g=>g.id===id),character=!g,at=others.indexOf(id),a=at/Math.max(1,others.length)*Math.PI*2;
    const saved=o.army?.march?.[id],p=id==='hero'?{x:0,y:0}:saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y)?saved:{x:Math.cos(a)*WORLD_BATTLE.inner,y:Math.sin(a)*WORLD_BATTLE.inner};
    const limit=Math.max(0,marchOuter(o)-marchExtent(g||{count:1})),d=Math.hypot(p.x,p.y),k=d>limit?limit/d:1;
    return{id,type:g?.type||id,count:g?.count||1,character,x:p.x*k,y:p.y*k,form:g?.form||'line',files:g?.files||null};
  });
}
const worldBattleReach=o=>WORLD_BATTLE.on&&o instanceof Party&&o!==P?marchOuter(P)+marchOuter(o)+2*WORLD_BATTLE.interaction:REACH;
function marchDraw(ents,o,cam){
  if(!WORLD_BATTLE.on)return false;marchCircle(ents,o,cam);const L=o.look(),face=marchFacing(o),co=Math.cos(face),si=Math.sin(face);
  for(const row of marchRows(o)){if(row.id==='hero')continue;const x=o.x+row.x*co-row.y*si,y=o.y+row.x*si+row.y*co,slots=formSlots(row.form,row.count,face,row.files);
    ents.push({y,own:o===P||o.faction==='player',f:()=>{for(let i=0;i<slots.length;i++){const sx=Math.round(x-cam.x+slots[i][0]/WORLD_BATTLE.scale),sy=Math.round(y-cam.y+slots[i][1]/WORLD_BATTLE.scale);
      rect(ctx,'#211c18',sx-1,sy-4,3,5);rect(ctx,row.character?'#e8cf91':L.col,sx-1,sy-3,3,3);rect(ctx,'#d5c5a4',sx,sy-4,1,1)}}});
  }return true;
}
function marchCircle(ents,o,cam){
  const r=marchOuter(o),col=o===P?'#e4c777':o.look().col;ents.push({y:o.y-r,f:()=>{ctx.save();ctx.strokeStyle=col;ctx.lineWidth=1;ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(o.x-cam.x,o.y-cam.y,r,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=.28;ctx.setLineDash([3,4]);ctx.beginPath();ctx.arc(o.x-cam.x,o.y-cam.y,r+WORLD_BATTLE.interaction,0,Math.PI*2);ctx.stroke();ctx.restore()}});
}
class WorldBattleArea{
  constructor(e){
    const other=e.ref?.src||e.ref,a={x:P.x,y:P.y,facing:marchFacing(P)},b=other&&Number.isFinite(other.x)&&Number.isFinite(other.y)?other:{x:P.x+worldBattleReach(other),y:P.y};
    const r0=marchOuter(P),r1=other instanceof Party?marchOuter(other):WORLD_BATTLE.outer,d=Math.hypot(a.x-b.x,a.y-b.y),r=Math.max(r0,r1,(d+r0+r1)/2),at=d>0?(r-r0)/d:0;
    this.viewport={x:G.cam.x,y:G.cam.y};this.scale=WORLD_BATTLE.scale;this.x=r0>=d+r1?a.x:r1>=d+r0?b.x:a.x+(b.x-a.x)*at;this.y=r0>=d+r1?a.y:r1>=d+r0?b.y:a.y+(b.y-a.y)*at;this.r=r;
    this.span=Math.ceil(2*(this.r+WORLD_BATTLE.apron));this.x0=this.x-this.span/2;this.y0=this.y-this.span/2;this.cx=this.cy=this.span*this.scale/2;this.radius=this.r*this.scale;
    this.joinedFight=e.kind==='field';this.starts=[a,{x:b.x,y:b.y,facing:other instanceof Party?marchFacing(other):Math.atan2(a.y-b.y,a.x-b.x)}];this.participants=new Set([other,P]);this.pending=[];this.serial=0;this.clearAt=null;
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
    for(const town of TOWNS)for(const l of town.lots||[]){if(l.st==='ruined'||l.k==='field'||l.k==='pasture')continue;const x=l.x*TILE,y=l.y*TILE,n=l.n*TILE;if(x>this.x0+this.span||y>this.y0+this.span||x+n<this.x0||y+n<this.y0)continue;
      const pic=lotSprite(town,l),b=opaqueBox(pic),box={x:b[0],y:Math.max(b[1],b[3]-Math.min(12,n*.3)),w:b[2]-b[0]+1,h:Math.min(12,n*.3)};
      for(let r=Math.max(0,Math.floor((y+box.y-this.y0)*this.scale/cs));r<Math.min(R,Math.ceil((y+box.y+box.h-this.y0)*this.scale/cs));r++)for(let c=Math.max(0,Math.floor((x+box.x-this.x0)*this.scale/cs));c<Math.min(C,Math.ceil((x+box.x+box.w-this.x0)*this.scale/cs));c++)T.built[r*C+c]=1;
    }
    const plan={recipe:'world',hills:[],woods:[],marsh:[],rocks:[],rivers:[],lane:0,built:{houses:[],fields:[]}};T.routes.build(8,BH-8);this.escapeRoutes=T.route;T.route=Object.fromEntries(Object.entries(T.route).map(([who,g])=>{const cost=g.cost.slice();for(let i=0;i<cost.length;i++)if(!this.inside({x:(i%g.C+.5)*g.cs,y:(Math.floor(i/g.C)+.5)*g.cs},4))cost[i]=0;return[who,{...g,cost,pv:0,mv:null,off:null,memo:new Map(),dm:new Map()}]}));T.finish({seed:WM.seedNum||1},plan,BW,8,BH-8,1,false);return T;
  }
  openPoint(p,T=B?.terrain){
    const a=this.constrain(p,12),ok=q=>!T||!T.solid[tIx(T,q.x,q.y)];if(ok(a))return a;
    for(let r=16;r<this.radius*2;r+=16)for(let k=0;k<16;k++){const q={x:a.x+Math.cos(k*Math.PI/8)*r,y:a.y+Math.sin(k*Math.PI/8)*r};if(this.inside(q,12)&&ok(q))return q}return a;
  }
  place(g,units,anchor,offset){
    const face=anchor.facing??Math.atan2(this.y-anchor.y,this.x-anchor.x),co=Math.cos(face),si=Math.sin(face),dir=co>=0?1:-1,p=this.openPoint(this.field({x:anchor.x+offset.x*co-offset.y*si,y:anchor.y+offset.x*si+offset.y*co}));
    g.ax=p.x;g.ay=p.y;g.face=g.currentFacing=face;g.order='hold';const slots=formSlots(g.form,units.length,face,g.files);
    units.forEach((u,i)=>{u.sx=slots[i][0];u.sy=slots[i][1];const q=this.openPoint({x:p.x+u.sx,y:p.y+u.sy});u.x=q.x;u.y=q.y;u.dir=face;u.face=dir});
  }
  syncCamera(){
    BVW=VW;BVH=VH;const c=B.cam||(B.cam={keys:{},lt:0});c.z=1/this.scale;c.fit=false;c.x=(G.cam.x-this.x0)*this.scale;c.y=(G.cam.y-this.y0)*this.scale;
  }
  pan(dx,dy){G.cam.x=clamp(G.cam.x+dx,0,Math.max(0,MW*TILE-VW));G.cam.y=clamp(G.cam.y+dy,0,Math.max(0,MH*TILE-VH));this.syncCamera()}
  base(){ctx.save();try{drawWorld()}finally{ctx.restore()}this.syncCamera()}
  hides(o){return o===P||this.participants.has(o)&&!this.pending.some(p=>p.o===o)}
  visible(p){const f=B.sight?.fog;if(!FOG.on||!f)return true;const c=Math.floor(p.x/f.cs),r=Math.floor(p.y/f.cs);return c>=0&&r>=0&&c<f.C&&r<f.R&&!!f.vis[0]?.[r*f.C+c]}
  draw(){
    ctx.save();ctx.strokeStyle='#d1b464';ctx.lineWidth=this.scale;ctx.setLineDash([3*this.scale,4*this.scale]);ctx.beginPath();ctx.arc(this.cx,this.cy,this.radius,0,Math.PI*2);ctx.stroke();ctx.restore();
    for(const a of this.pending){if(!Number.isFinite(a.o.x))continue;const p=this.field(a.o);if(a.team&&!this.visible(p))continue;const x=clamp(p.x,16,BW-16),y=clamp(p.y,22,BH-16);ctx.fillStyle=a.team?'#dd7060':'#b9d28c';ctx.fillRect(x-3,y-9,6,9);txt('Reinforcements',x,y-15,ctx.fillStyle,'center')}
    for(const u of B.units)if(u.regroup&&(!u.team||this.visible(u))){ctx.fillStyle=sideCol(u,'ui');ctx.fillRect(u.x-2,u.y-6,4,6)}
  }
  escapeWay(u,to){
    const g=this.escapeRoutes?.[routeWho(u.s)];if(!g)return null;const p=routePath(g,u.x,u.y,to.x,to.y);for(const [x,y] of p){const dx=x-u.x,dy=y-u.y,d=Math.hypot(dx,dy);if(d>8)return[dx/d,dy/d]}return null;
  }
  watchBlocked(){
    if(B.over||B.t<(this.blockCheck||0))return;this.blockCheck=B.t+3;
    const a=B.units.filter(u=>u.team===0&&fighting(u)),b=B.units.filter(u=>u.team===1&&fighting(u));if(!a.length||!b.length||B.t-(B.lastHit||0)<WORLD_BATTLE.blocked){this.blockAt=null;return}
    const canReach=(mine,foes)=>{
      const tested={};for(const u of mine){const range=u.empty?BLADE.reach:u.s.range||u.s.reach||12;if(foes.some(e=>Math.hypot(u.x-e.x,u.y-e.y)<=range+8&&!terrainBlocksView(u,e)))return true;
        const who=routeWho(u.s),g=B.terrain.route[who],i=routeIx(g,u.x,u.y);let seen=tested[who];if(!seen)tested[who]=seen=new Uint8Array(g.cost.length);if(seen[i])continue;const flood=routeFlood(g,i);for(let k=0;k<flood.length;k++)if(flood[k])seen[k]=1;if(foes.some(e=>flood[routeIx(g,e.x,e.y)]))return true;
      }return false;
    };
    if(canReach(a,b)||canReach(b,a))return;
    B.stalemate=true;B.retreat=true;B.over=true;B.win=false;B.endT=END_WAIT;log('The armies disengage: impassable ground blocks every route through the battle area.','gold','war');
  }
  escape(u,dt){
    const exit=this.exit(u,WORLD_BATTLE.apron*.65*this.scale),way=B.terrain&&this.escapeWay(u,exit),p=way?{x:u.x+way[0]*32,y:u.y+way[1]*32}:exit,d=Math.hypot(p.x-u.x,p.y-u.y),s=Math.min(d,u.s.spd*1.1*dt*tiredMul(u).spd);
    if(d>0){u.x+=(p.x-u.x)*s/d;u.y+=(p.y-u.y)*s/d;u.dir=Math.atan2(p.y-u.y,p.x-u.x);u.face=Math.cos(u.dir)>0?1:-1;u.spdNow=u.s.spd}fatigueStep(u,dt,s>0,false,false);
    if(Math.hypot(exit.x-u.x,exit.y-u.y)<=3){u.fled=true;u.worldFled=true;const key=u.team?'fledFoes':'fledMine';B[key]=(B[key]||0)+1;const r=B.groups[u.grp]?.resolve;if((r?.worldReturns||0)<WORLD_BATTLE.returns)u.regroup={t:0,phase:'rest',cycle:r?.worldReturns||0};leaveField(u)}
  }
  clamp(){for(const u of B.units)if(u.hp>0&&!u.rout&&!withdrawing(u)){const p=this.constrain(u);u.x=p.x;u.y=p.y}
    for(const g of Object.values(B.groups))if(g.order!=='rout'&&g.order!=='withdraw'){const p=this.constrain({x:g.ax,y:g.ay},16);g.ax=p.x;g.ay=p.y;for(const q of g.queue||[]){const a=this.constrain(q,16);q.x=a.x;q.y=a.y}}}
  step(dt){
    for(const u of B.units){const a=u.regroup;if(!a)continue;
      if(a.phase==='rest'){a.t+=dt;if(a.t>=WORLD_BATTLE.regroup)a.phase='return';continue}
      const p=this.openPoint(this.exit(u,-18)),d=Math.hypot(p.x-u.x,p.y-u.y),s=Math.min(d,u.s.spd*dt);
      if(d>0){u.x+=(p.x-u.x)*s/d;u.y+=(p.y-u.y)*s/d}if(d>s+2)continue;
      if(u.worldFled){const key=u.team?'fledFoes':'fledMine';B[key]=Math.max(0,(B[key]||0)-1);delete u.worldFled}u.hp=u.hpLeft;delete u.left;delete u.fled;delete u.regroup;u.rout=false;u.shattered=false;u.rallied=false;u.tgt=null;
      const g=B.groups[u.grp],r=g?.resolve;if(r){if((r.worldReturns||0)<=a.cycle){r.worldReturns=a.cycle+1;r.routed=false;r.shattered=false;r.rallied=true;r.breakT=0;r.mor=MORALE.rally;r.confidence=0}r.refreshState();r.sync()}if(g&&!r?.routed){g.hold();g.aiReset()}battleEvent('rejoin',{u});
    }
    this.reinforce(dt);this.watchBlocked();
  }
  teamFor(o){
    const e=G.enc;if(!e)return -1;if((e.allies||[]).some(f=>(f.src||f)===o))return 0;if((e.foes||[]).some(f=>(f.src||f)===o))return 1;
    if(o.mapKind==='band'&&e.kind==='party')return 1;const f=foeRealm(e);if(f&&o.faction&&(o.faction===f||relOf(o.faction,f).s==='ally'))return 1;
    return o.mapKind==='cparty'?0:o.mapKind==='lord'&&lordWhy(e,o)||o.mapKind==='patrol'&&watchWhy(e,o)?0:-1;
  }
  reinforce(dt){
    for(const o of [...W.lords,...W.patrols,...cparties(),...bandits]){if(this.participants.has(o)||o.dead||o.gone||o.inside||o.fight||!o.troops.length||Math.hypot(o.x-this.x,o.y-this.y)>this.r+WORLD_BATTLE.join)continue;const team=this.teamFor(o);if(team<0)continue;this.participants.add(o);this.pending.push({o,team})}
    for(let i=this.pending.length-1;i>=0;i--){const a=this.pending[i],o=a.o,d=Math.hypot(o.x-this.x,o.y-this.y);if(d>this.r-3){const sp=Math.min(d,WORLD_BATTLE.approach*dt);walk(o,this.x-o.x,this.y-o.y,sp);continue}if(a.existing){for(const id of a.existing){const g=B.groups[id],m=B.units.filter(u=>u.grp===id);for(const u of m){u.hp=u.hpLeft;delete u.left;delete u.waiting}this.place(g,m,o,{x:0,y:(a.existing.indexOf(id)-(a.existing.length-1)/2)*5});if(g.resolve){g.resolve.refreshState();g.resolve.sync()}}B.cmdT=0;B.moraleNext=0;B.sight=null;log((o.mapKind==='lord'?lordName(o):o.name||o.label?.()||'An army')+' enters the battle.',a.team?'bad':'good','war');battleEvent('reinforcement',{party:o,team:a.team});setOrderUI()}else this.join(o,a.team);this.pending.splice(i,1)}
  }
  join(o,team){
    const e=G.enc,list=team?e.foes:e.allies;let force=list.find(f=>(f.src||f)===o);if(!force){force=forceOf(o);list.push(force);(e.help||(e.help=new Map())).set(force,{why:'riding into the battle',n:o.troops.length})}
    const owner=asParty(force),r=partyRoster(owner),builder=new BattleSetup(B.opts);builder.env=B.env;builder.id=Math.max(-1,...B.units.map(u=>u.id))+1;
    const prefix='w'+(++this.serial)+'_',rows=[];
    for(const row of r.groups){const id=prefix+row.id,g=new BattleControl(id,team,{player:false,ally:team===0,foe:team===1,role:grpOf(ST[row.type]),name:row.name||ST[row.type].n,type:row.type,sourceGroupId:row.id,form:row.form||'line',files:row.files||null});B.groups[id]=g;
      const units=Array.from({length:row.count},()=>{const u=builder.spawn(troopOf(row.type),team,0,0);Object.assign(u,{grp:id,sourceGroupId:row.id,sourceArmy:owner,lord:owner});return u});B.units.push(...units);rows.push([g,units]);}
    for(const leader of battleLeaders({kind:'field',allies:team?[]:[force],foes:team?[force]:[]})){const unit=leader.comp?charOf(compInit(leader.comp),leader.comp):charOf(leader.ref),u=builder.spawn(unit,team,0,0),id=prefix+'leader';Object.assign(u,{grp:id,leader,sourceArmy:owner});if(leader.comp)u.comp=true;const g=new BattleControl(id,team,{player:false,ally:team===0,foe:team===1,role:'hero',name:W.lords.includes(leader.ref)?lordName(leader.ref):leader.name,type:u.type});B.groups[id]=g;B.units.push(u);rows.push([g,[u]])}
    const added=rows.flatMap(a=>a[1]);for(const u of added){u.mor0=u.mor=unitMoraleOf(u.s);u.sta=FATIGUE.max;u.vig=1}
    rows.forEach(([g,m],i)=>{this.place(g,m,o,{x:0,y:(i-(rows.length-1)/2)*5});if(m.some(u=>!steady(u)))g.resolve=new BattleResolve(g.id,team,m.filter(u=>!steady(u)))});
    warmBattle(added);B.cmdT=0;B.moraleNext=0;B.sight=null;B.captains={};log((o.mapKind==='lord'?lordName(o):force.name||o.label())+' enters the battle.',team?'bad':'good','war');battleEvent('reinforcement',{party:o,team});setOrderUI();
  }
  finish(b){
    const waiting=new Set(this.pending.map(p=>p.o)),e=G.enc;
    if(e)for(const key of ['allies','foes'])e[key]=(e[key]||[]).filter(f=>!waiting.has(f.src||f));
    BVH=FIELD_H;BVW=Math.round(FIELD_H*MAPZOOM.vw/MAPZOOM.vh);if(b.hero&&(b.hero.hp>0||b.hero.left)){const p=this.world(b.hero);P.x=p.x;P.y=p.y;P.tx=null}
  }
  ended(ap,ae){if(ap&&ae){this.clearAt=null;return false}if(this.clearAt==null)this.clearAt=B.t;return B.t-this.clearAt>=WORLD_BATTLE.clear}
}
class WorldBattleSetup extends BattleSetup{
  constructor(opts){super(opts);this.area=new WorldBattleArea(G.enc)}
  survey(){
    const a=this.area;BFIELD=null;BW=BH=a.span*a.scale;this.site=this.battleSite();this.env=battleEnv(false,this.site);a.env=this.env;this.env.text='Fight on the world map. The gold circle is fixed; routed soldiers can regroup beyond it and return.';
    this.field={top:8,bot:BH-8};this.createUnits();this.createGroups();
  }
  createGroups(){super.createGroups();for(const u of this.units)if(u.leader&&W.lords.includes(u.leader.ref))this.groups[u.grp].name=lordName(u.leader.ref)}
  terrain(){return this.TR=this.area.terrain()}
  *paint(){yield}
  canopy(){}
  createState(){const b=super.createState();b.world=this.area;b.obs=[];b.fog=true;return b}
  initialize(){
    BVW=VW;BVH=VH;const deploy=this.opts.deploy;this.opts.deploy=false;try{super.initialize()}finally{this.opts.deploy=deploy}const a=this.area,e=G.enc,rows=marchRows(P),primary=e.ref?.src||e.ref;
    for(const [id,g] of Object.entries(B.groups)){const m=B.units.filter(u=>u.grp===id),first=m[0],source=first?.sourceArmy,anchor=g.player?a.starts[0]:source?.src||source;
      if(!g.player&&source&&source!==primary&&source!==e.ref&&!a.joinedFight&&Number.isFinite(anchor?.x)&&Number.isFinite(anchor?.y)){a.participants.add(anchor);const team=g.team;let p=a.pending.find(p=>p.o===anchor);if(!p){p={o:anchor,team,existing:[]};a.pending.push(p)}p.existing.push(id);m.forEach(u=>{u.hpLeft=u.hp;u.hp=0;u.left=true;u.waiting=true});continue}
      const key=g.sourceGroupId||id,formation=g.player?rows:primary instanceof Party?marchRows(primary):[],offset=formation.find(r=>r.id===key)||{x:0,y:(Object.keys(B.groups).indexOf(id)%5-2)*7};a.place(g,m,g.player?a.starts[0]:this.area.joinedFight&&Number.isFinite(anchor?.x)?anchor:a.starts[1],offset);
    }
    B.deploy=false;exitInit(B.units);a.clamp();
  }
  present(){super.present();B.deploy=false;bbar.hidden=false;this.area.syncCamera()}
  start(after){this.survey();this.terrain();this.muster();this.open();if(after)after();return Promise.resolve()}
}
function worldBattleEligible(opts){return WORLD_BATTLE.on&&!opts.sandbox&&!opts.tournament&&G.enc&&['party','lord','patrol','caravan','monster','field'].includes(G.enc.kind)}
