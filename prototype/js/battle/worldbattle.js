'use strict';
/* ---------- campaign formations and battles on the land where the armies meet ---------- */
const WORLD_BATTLE={on:true,scale:6,inner:18,outer:38,interaction:8,apron:22,join:220,regroup:7,returns:1,turn:3.5,blocked:30,sprite:3,step:1/60};
class WorldBattleArea{
  constructor(e){
    const other=e.ref?.src||e.ref,a={x:P.x,y:P.y,facing:marchFacing(P)},b=other&&Number.isFinite(other.x)&&Number.isFinite(other.y)?other:{x:P.x+worldBattleReach(other),y:P.y};
    const r0=Math.max(marchOuter(P),MarchArmy.spread(P)),r1=other instanceof Party?Math.max(marchOuter(other),MarchArmy.spread(other)):WORLD_BATTLE.outer,d=Math.hypot(a.x-b.x,a.y-b.y),r=Math.max(r0,r1,(d+r0+r1)/2),at=d>0?(r-r0)/d:0;
    this.viewport={x:G.cam.x,y:G.cam.y};this.scale=WORLD_BATTLE.scale;this.x=r0>=d+r1?a.x:r1>=d+r0?b.x:a.x+(b.x-a.x)*at;this.y=r0>=d+r1?a.y:r1>=d+r0?b.y:a.y+(b.y-a.y)*at;this.r=r;
    this.span=Math.ceil(2*(this.r+WORLD_BATTLE.apron));this.x0=this.x-this.span/2;this.y0=this.y-this.span/2;this.cx=this.cy=this.span*this.scale/2;this.radius=this.r*this.scale;
    this.joinedFight=e.kind==='field';this.starts=[a,{x:b.x,y:b.y,facing:other instanceof Party?marchFacing(other):Math.atan2(a.y-b.y,a.x-b.x)}];this.participants=new Set([other,P]);this.pending=[];this.arrivals=[];this.serial=0;this.marchClamp=p=>this.world(this.constrain(this.field(p),18));this.marchInside=p=>this.inside(this.field(p),6);
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
  place(g,units,anchor,offset,owner=anchor){
    const face=anchor.facing??Math.atan2(this.y-anchor.y,this.x-anchor.x),co=Math.cos(face),si=Math.sin(face),dir=co>=0?1:-1,p=this.openPoint(this.field({x:anchor.x+offset.x*co-offset.y*si,y:anchor.y+offset.x*si+offset.y*co}));
    g.ax=p.x;g.ay=p.y;g.face=g.currentFacing=face;g.order='hold';const slots=formSlots(g.form,units.length,face,g.files,WORLD_BATTLE.sprite);
    const army=MARCH_ARMIES.get(owner),march=army?.forGroup(g.sourceGroupId||g.id)||[];
    units.forEach((u,i)=>{u.sx=slots[i][0];u.sy=slots[i][1];const mini=march[i],q=mini?this.field(mini):this.openPoint({x:p.x+u.sx,y:p.y+u.sy});u.x=q.x;u.y=q.y;u.dir=mini?.dir??face;u.face=Math.cos(u.dir)>=0?1:-1;
      if(mini){u.marchUnit=mini;if(!this.inside(q,6)){u.hpLeft=u.hp;u.hp=0;u.left=true;u.waiting=true;this.arrivals.push({u,mini,army})}}});
    if(march.length){const live=units.filter(u=>u.hp>0);if(live.length){g.ax=live.reduce((n,u)=>n+u.x-u.sx,0)/live.length;g.ay=live.reduce((n,u)=>n+u.y-u.sy,0)/live.length}}
  }
  syncCamera(){
    BVW=VW;BVH=VH;const c=B.cam||(B.cam={keys:{},lt:0});c.z=1/this.scale;c.fit=false;c.x=(G.cam.x-this.x0)*this.scale;c.y=(G.cam.y-this.y0)*this.scale;
  }
  pan(dx,dy){G.cam.x=clamp(G.cam.x+dx,0,Math.max(0,MW*TILE-VW));G.cam.y=clamp(G.cam.y+dy,0,Math.max(0,MH*TILE-VH));this.syncCamera()}
  base(){ctx.save();try{drawWorld()}finally{ctx.restore()}this.syncCamera()}
  hides(o){return o===P||this.participants.has(o)&&!this.pending.some(p=>p.o===o)}
  visible(p){return true}
  // Keep campaign fog outside the fight, including its escape apron, without exploring that land permanently.
  fog(cam,draw){ctx.save();try{ctx.beginPath();ctx.rect(0,0,VW+1,VH+1);ctx.moveTo(this.x-cam.x+this.r+WORLD_BATTLE.apron,this.y-cam.y);ctx.arc(this.x-cam.x,this.y-cam.y,this.r+WORLD_BATTLE.apron,0,Math.PI*2,true);ctx.clip('evenodd');draw()}finally{ctx.restore()}}
  draw(){
    ctx.save();ctx.strokeStyle='#d1b464';ctx.lineWidth=this.scale;ctx.setLineDash([3*this.scale,4*this.scale]);ctx.beginPath();ctx.arc(this.cx,this.cy,this.radius,0,Math.PI*2);ctx.stroke();ctx.restore();
    for(const a of this.pending){if(!Number.isFinite(a.o.x))continue;const p=this.field(a.o);if(a.team&&!this.visible(p))continue;const x=clamp(p.x,16,BW-16),y=clamp(p.y,22,BH-16);ctx.fillStyle=a.team?'#dd7060':'#b9d28c';ctx.fillRect(x-3,y-9,6,9);txt('Reinforcements',x,y-15,ctx.fillStyle,'center')}
    for(const a of this.arrivals){const p=this.field(a.mini);ctx.fillStyle=a.u.team?'#dd7060':'#b9d28c';ctx.fillRect(p.x-1.5*this.scale,p.y-5*this.scale,3*this.scale,5*this.scale)}
    for(const u of B.units)if(u.regroup&&(!u.team||this.visible(u))){ctx.fillStyle=sideCol(u,'ui');ctx.fillRect(u.x-2*WORLD_BATTLE.sprite,u.y-6*WORLD_BATTLE.sprite,4*WORLD_BATTLE.sprite,6*WORLD_BATTLE.sprite)}
  }
  // Choose once from the reachable apron, rather than chasing a radial point which can be rock or behind a cliff.
  escapePlan(u){
    const g=this.escapeRoutes?.[routeWho(u.s)];if(!g)return null;const old=u.worldEscape;if(old&&old.g===g&&old.v===g.v)return old;
    const D=routeDist(g,u.x,u.y);let at=-1,best=Infinity;
    for(let i=0;i<D.length;i++){if(!Number.isFinite(D[i])||!g.cost[i])continue;const x=(i%g.C+.5)*g.cs,y=(Math.floor(i/g.C)+.5)*g.cs;
      if(this.distance({x,y})<this.radius+g.cs||x<8||x>BW-8||y<fieldTop()||y>fieldBot())continue;
      if(D[i]<best){at=i;best=D[i]}}
    const to=at<0?this.exit(u,2*g.cs):{x:(at%g.C+.5)*g.cs,y:(Math.floor(at/g.C)+.5)*g.cs},p=routePath(g,u.x,u.y,to.x,to.y,{budget:g.cost.length});
    return u.worldEscape={g,v:g.v,to,p,i:0};
  }
  escapeWay(u){
    const w=this.escapePlan(u);if(!w)return null;const {g,p}=w;
    while(w.i<p.length-1&&(Math.hypot(p[w.i][0]-u.x,p[w.i][1]-u.y)<1||lineClear(g,u.x,u.y,...p[w.i+1])))w.i++;
    const q=p[w.i];if(!q)return null;const dx=q[0]-u.x,dy=q[1]-u.y,d=Math.hypot(dx,dy);return d>.001?[dx/d,dy/d,d]:null;
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
    this.enterMarchers(dt);
    for(const u of B.units){const a=u.regroup;if(!a)continue;
      if(a.phase==='rest'){a.t+=dt;if(a.t>=WORLD_BATTLE.regroup)a.phase='return';continue}
      const p=this.openPoint(this.exit(u,-18)),d=Math.hypot(p.x-u.x,p.y-u.y),s=Math.min(d,u.s.spd*dt);
      if(d>0){u.x+=(p.x-u.x)*s/d;u.y+=(p.y-u.y)*s/d}if(d>s+2)continue;
      if(u.worldFled){const key=u.team?'fledFoes':'fledMine';B[key]=Math.max(0,(B[key]||0)-1);delete u.worldFled}u.hp=u.hpLeft;delete u.left;delete u.fled;delete u.regroup;delete u.worldEscape;u.rout=false;u.shattered=false;u.rallied=false;u.tgt=null;
      const g=B.groups[u.grp],r=g?.resolve;if(r){if((r.worldReturns||0)<=a.cycle){r.worldReturns=a.cycle+1;r.routed=false;r.shattered=false;r.rallied=true;r.breakT=0;r.mor=MORALE.rally;r.confidence=0}r.refreshState();r.sync()}if(g&&!r?.routed){g.hold();g.aiReset()}battleEvent('rejoin',{u});
    }
    this.reinforce(dt);this.watchBlocked();
  }
  enterMarchers(dt){
    if(!this.arrivals.length)return;for(const army of new Set(this.arrivals.map(a=>a.army))){const o=army.owner,d=Math.hypot(o.x-this.x,o.y-this.y);if(o!==P&&d>Math.max(0,this.r-marchOuter(o)-3))walk(o,this.x-o.x,this.y-o.y,Math.min(d,partySpeed(o,o.troops)*dt/this.scale));army.step(dt/(this.scale*WORLD_SCALE.move),false,this.marchClamp,this.marchInside)}let entered=false;
    this.arrivals=this.arrivals.filter(a=>{const p=this.field(a.mini),u=a.u;u.x=p.x;u.y=p.y;if(!this.inside(p,6))return true;u.hp=u.hpLeft;delete u.waiting;delete u.left;const r=B.groups[u.grp]?.resolve;if(r){r.refreshState();r.sync()}entered=true;return false});
    if(entered){B.cmdT=0;B.moraleNext=0;setOrderUI()}
  }
  teamFor(o){
    const e=G.enc;if(!e)return -1;if((e.allies||[]).some(f=>(f.src||f)===o))return 0;if((e.foes||[]).some(f=>(f.src||f)===o))return 1;
    if(o.mapKind==='band'&&e.kind==='party')return 1;const f=foeRealm(e);if(f&&o.faction&&(o.faction===f||relOf(o.faction,f).s==='ally'))return 1;
    return o.mapKind==='cparty'?0:o.mapKind==='lord'&&lordWhy(e,o)||o.mapKind==='patrol'&&watchWhy(e,o)?0:-1;
  }
  reinforce(dt){
    for(const o of [...W.lords,...W.patrols,...cparties(),...bandits]){if(this.participants.has(o)||o.dead||o.gone||o.inside||o.fight||!o.troops.length||Math.hypot(o.x-this.x,o.y-this.y)>this.r+WORLD_BATTLE.join)continue;const team=this.teamFor(o);if(team<0)continue;this.participants.add(o);this.pending.push({o,team})}
    for(let i=this.pending.length-1;i>=0;i--){const a=this.pending[i],o=a.o,d=Math.hypot(o.x-this.x,o.y-this.y);if(d>this.r-3){const sp=Math.min(d,partySpeed(o,o.troops)*dt/this.scale);walk(o,this.x-o.x,this.y-o.y,sp);MARCH_ARMIES.get(o)?.step(dt/(this.scale*WORLD_SCALE.move),false);continue}if(a.existing){for(const id of a.existing){const g=B.groups[id],m=B.units.filter(u=>u.grp===id);for(const u of m){u.hp=u.hpLeft;delete u.left;delete u.waiting}this.place(g,m,o,{x:0,y:(a.existing.indexOf(id)-(a.existing.length-1)/2)*5},o);if(g.resolve){g.resolve.refreshState();g.resolve.sync()}}B.cmdT=0;B.moraleNext=0;B.sight=null;log((o.mapKind==='lord'?lordName(o):o.name||o.label?.()||'An army')+' enters the battle.',a.team?'bad':'good','war');battleEvent('reinforcement',{party:o,team:a.team});setOrderUI()}else this.join(o,a.team);this.pending.splice(i,1)}
  }
  join(o,team){
    const e=G.enc,list=team?e.foes:e.allies;let force=list.find(f=>(f.src||f)===o);if(!force){force=forceOf(o);list.push(force);(e.help||(e.help=new Map())).set(force,{why:'riding into the battle',n:o.troops.length})}
    const owner=asParty(force),r=partyRoster(owner),builder=new BattleSetup(B.opts);builder.env=B.env;builder.id=Math.max(-1,...B.units.map(u=>u.id))+1;
    const prefix='w'+(++this.serial)+'_',rows=[];
    for(const row of r.groups){const id=prefix+row.id,g=new BattleControl(id,team,{player:false,ally:team===0,foe:team===1,role:grpOf(ST[row.type]),name:row.name||ST[row.type].n,type:row.type,sourceGroupId:row.id,form:row.form||'line',files:row.files||null});B.groups[id]=g;
      const units=Array.from({length:row.count},()=>{const u=builder.spawn(troopOf(row.type),team,0,0);Object.assign(u,{grp:id,sourceGroupId:row.id,sourceArmy:owner,lord:owner});return u});B.units.push(...units);rows.push([g,units]);}
    for(const leader of battleLeaders({kind:'field',allies:team?[]:[force],foes:team?[force]:[]})){const unit=leader.comp?charOf(compInit(leader.comp),leader.comp):charOf(leader.ref),u=builder.spawn(unit,team,0,0),id=prefix+'leader';Object.assign(u,{grp:id,leader,sourceArmy:owner});if(leader.comp)u.comp=true;const g=new BattleControl(id,team,{player:false,ally:team===0,foe:team===1,role:'hero',name:W.lords.includes(leader.ref)?lordName(leader.ref):leader.name,type:u.type});B.groups[id]=g;B.units.push(u);rows.push([g,[u]])}
    const added=rows.flatMap(a=>a[1]);for(const u of added){u.mor0=u.mor=unitMoraleOf(u.s);u.sta=FATIGUE.max;u.vig=1}
    rows.forEach(([g,m],i)=>{this.place(g,m,o,{x:0,y:(i-(rows.length-1)/2)*5},o);if(m.some(u=>!steady(u)))g.resolve=new BattleResolve(g.id,team,m.filter(u=>!steady(u)))});
    warmBattle(added);B.cmdT=0;B.moraleNext=0;B.sight=null;B.captains={};log((o.mapKind==='lord'?lordName(o):force.name||o.label())+' enters the battle.',team?'bad':'good','war');battleEvent('reinforcement',{party:o,team});setOrderUI();
  }
  finish(b){
    for(const u of b.units)if(u.marchUnit&&!u.waiting){const m=u.marchUnit;if(u.hp>0||u.left){const p=this.world(u);m.x=p.x;m.y=p.y;m.dir=u.dir}else m.dead=true}
    const waiting=new Set(this.pending.map(p=>p.o)),e=G.enc;
    if(e)for(const key of ['allies','foes'])e[key]=(e[key]||[]).filter(f=>!waiting.has(f.src||f));
    BVH=FIELD_H;BVW=Math.round(FIELD_H*MAPZOOM.vw/MAPZOOM.vh);if(b.hero&&(b.hero.hp>0||b.hero.left)){const p=this.world(b.hero);P.x=p.x;P.y=p.y;P.tx=null;const a=MARCH_ARMIES.get(P);if(a){a.x=P.x;a.y=P.y}}
  }
  ended(ap,ae){return !ap||!ae}
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
  createState(){const b=super.createState();b.world=this.area;b.obs=[];b.fog=false;return b}
  initialize(){
    BVW=VW;BVH=VH;const deploy=this.opts.deploy;this.opts.deploy=false;try{super.initialize()}finally{this.opts.deploy=deploy}const a=this.area,e=G.enc,rows=marchRows(P),primary=e.ref?.src||e.ref;
    for(const [id,g] of Object.entries(B.groups)){const m=B.units.filter(u=>u.grp===id),first=m[0],source=first?.sourceArmy,anchor=g.player?a.starts[0]:source?.src||source;
      if(!g.player&&source&&source!==primary&&source!==e.ref&&!a.joinedFight&&Number.isFinite(anchor?.x)&&Number.isFinite(anchor?.y)){a.participants.add(anchor);const team=g.team;let p=a.pending.find(p=>p.o===anchor);if(!p){p={o:anchor,team,existing:[]};a.pending.push(p)}p.existing.push(id);m.forEach(u=>{u.hpLeft=u.hp;u.hp=0;u.left=true;u.waiting=true});continue}
      const key=g.sourceGroupId||id,formation=g.player?rows:primary instanceof Party?marchRows(primary):[],offset=formation.find(r=>r.id===key)||{x:0,y:(Object.keys(B.groups).indexOf(id)%5-2)*7};a.place(g,m,g.player?a.starts[0]:this.area.joinedFight&&Number.isFinite(anchor?.x)?anchor:a.starts[1],offset,g.player?P:source?.src||source);
    }
    B.speed=G.speed;B.deploy=false;exitInit(B.units);a.clamp();
  }
  present(){super.present();B.deploy=false;bbar.hidden=false;this.area.syncCamera()}
  start(after){this.survey();this.terrain();this.muster();this.open();if(after)after();return Promise.resolve()}
}
function worldBattleEligible(opts){return WORLD_BATTLE.on&&!opts.sandbox&&!opts.tournament&&G.enc&&['party','lord','patrol','caravan','monster','field'].includes(G.enc.kind)}
