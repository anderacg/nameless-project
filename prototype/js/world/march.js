'use strict';
/* ---------- campaign formations around each army leader ---------- */
const MARCH_FACING=new WeakMap();
let MARCH_ARMIES=new WeakMap();
function marchFacing(o){
  const army=MARCH_ARMIES.get(o);if(army)return army.face;
  const now=performance.now()/1000,old=MARCH_FACING.get(o),dx=old?o.x-old.x:0,dy=old?o.y-old.y:0,to=Math.hypot(dx,dy)>.05?Math.atan2(dy,dx):old?.to??((o.look?.().dir||o.dir||1)<0?Math.PI:0);
  const dt=old?clamp(now-old.at,0,.1):0,gap=old?Math.atan2(Math.sin(to-old.a),Math.cos(to-old.a)):0,a=old?old.a+clamp(gap,-WORLD_BATTLE.turn*dt,WORLD_BATTLE.turn*dt):to;
  MARCH_FACING.set(o,{x:o.x,y:o.y,a,to,at:now});return a;
}
const marchExtent=row=>3+Math.max(0,...formSlots(row.form||'line',row.count||1,0,row.files,WORLD_BATTLE.sprite).map(p=>Math.hypot(...p)))/WORLD_BATTLE.scale;
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
// The battle's full sprites at its world scale, with weapons included and movement-driven poses.
function marchSprite(u,o){
  const type=u.character?u.type.replace(/^comp_/,''):u.type;
  return unitSprite(type,0,false,u.id%6,u.walking?2+Math.floor(u.walk/WALK.foot)%4:0,false,false,o.look().col);
}
function marchDraw(ents,o,cam){
  if(!WORLD_BATTLE.on)return false;const army=MarchArmy.of(o);army.sync();marchCircle(ents,o,cam);
  for(const u of army.units)ents.push({y:u.y,own:o===P||o.faction==='player',f:()=>drawMarcher(u,o,cam)});return true;
}
function drawMarcher(u,o,cam){
  subT(u);const s=marchSprite(u,o),k=WORLD_BATTLE.sprite/WORLD_BATTLE.scale,x=Math.round(u.x-cam.x),y=Math.round(u.y-cam.y);
  ctx.save();ctx.translate(x,y);ctx.scale(Math.cos(u.dir??marchFacing(o))<0?-k:k,k);ctx.drawImage(s,-Math.floor(s.width/2),-s.height+2);ctx.restore();
}
function marchCircle(ents,o,cam){
  const r=marchOuter(o),col=o===P?'#e4c777':o.look().col;ents.push({y:o.y-r,f:()=>{ctx.save();ctx.strokeStyle=col;ctx.lineWidth=1;ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(o.x-cam.x,o.y-cam.y,r,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=.28;ctx.setLineDash([3,4]);ctx.beginPath();ctx.arc(o.x-cam.x,o.y-cam.y,r+WORLD_BATTLE.interaction,0,Math.PI*2);ctx.stroke();ctx.restore()}});
}

// Positions are runtime state. Saved group offsets remain the destination, never a rigid transform of the men.
const MARCH_MOVE={cell:4,pad:48,chunk:64,repath:.45,refresh:2,catchup:1.8,turn:3.5,settle:.2,gap:2.4,active:180,queries:6,teleport:160,bucket:8,waypoint:.15,sidestep:[0,.65,-.65,1.2,-1.2]};
const marchFootprints=(x0,y0,x1,y1)=>TOWNS.flatMap(t=>(t.lots||[]).filter(l=>l.st!=='ruined'&&l.k!=='field'&&l.k!=='pasture'&&l.x*TILE<x1&&l.y*TILE<y1&&(l.x+l.n)*TILE>x0&&(l.y+l.n)*TILE>y0).map(l=>{
  const b=opaqueBox(lotSprite(t,l)),h=Math.min(12,l.n*TILE*.3);return{x:l.x*TILE+b[0],y:l.y*TILE+Math.max(b[1],b[3]-h),w:b[2]-b[0]+1,h};
}));
class MarchGround{
  constructor(o,units){
    const r=marchOuter(o),pad=MARCH_MOVE.pad,chunk=MARCH_MOVE.chunk,cs=MARCH_MOVE.cell;
    this.x=Math.max(0,Math.floor((Math.min(o.x-r,...units.map(u=>u.x))-pad)/chunk)*chunk);this.y=Math.max(0,Math.floor((Math.min(o.y-r,...units.map(u=>u.y))-pad)/chunk)*chunk);
    const x1=Math.min(MW*TILE,Math.ceil((Math.max(o.x+r,...units.map(u=>u.x))+pad)/chunk)*chunk),y1=Math.min(MH*TILE,Math.ceil((Math.max(o.y+r,...units.map(u=>u.y))+pad)/chunk)*chunk);
    const g=this.grid=routeGrid(Math.max(1,Math.ceil((x1-this.x)/cs)),Math.max(1,Math.ceil((y1-this.y)/cs)),cs);this.version=WAYV;this.blocks=marchFootprints(this.x,this.y,x1,y1).filter(b=>b.x<x1&&b.y<y1&&b.x+b.w>this.x&&b.y+b.h>this.y);
    const ferries=WM.crossings.filter((c,i)=>c.kind==='ferry'&&!WM.graph?.closed[i]).map(c=>{const [x,y]=wayCentre(c.i),[tx,ty]=wayCentre(c.j);return{x,y,tx,ty}}).filter(f=>Math.max(f.x,f.tx)>=this.x-cs&&Math.min(f.x,f.tx)<=x1+cs&&Math.max(f.y,f.ty)>=this.y-cs&&Math.min(f.y,f.ty)<=y1+cs);
    for(let i=0;i<g.cost.length;i++){const x=this.x+(i%g.C+.5)*cs,y=this.y+(Math.floor(i/g.C)+.5)*cs,tx=Math.floor(x/TILE),ty=Math.floor(y/TILE),k=ty*MW+tx;
      let open=WM.has(tx,ty)&&wayOpen(k);if(!open&&tAt(tx,ty)===T_WATER)open=ferries.some(f=>{const dx=f.tx-f.x,dy=f.ty-f.y,d=dx*dx+dy*dy,t=clamp(((x-f.x)*dx+(y-f.y)*dy)/d,0,1);return Math.hypot(x-f.x-t*dx,y-f.y-t*dy)<cs});
      g.cost[i]=open&&!this.blocks.some(b=>x+cs/2>b.x&&x-cs/2<b.x+b.w&&y+cs/2>b.y&&y-cs/2<b.y+b.h)?ROUTE.unit:0;
    }
  }
  local(p){return{x:p.x-this.x,y:p.y-this.y}}
  world(p){return{x:p.x+this.x,y:p.y+this.y}}
  contains(p,pad=0){const g=this.grid;return p.x>=this.x+pad&&p.y>=this.y+pad&&p.x<this.x+g.C*g.cs-pad&&p.y<this.y+g.R*g.cs-pad}
  covers(p,pad){const g=this.grid,x1=this.x+g.C*g.cs,y1=this.y+g.R*g.cs;return p.x>=this.x+(this.x>0?pad:0)&&p.y>=this.y+(this.y>0?pad:0)&&p.x<x1-(x1<MW*TILE?pad:0)&&p.y<y1-(y1<MH*TILE?pad:0)}
  open(p){return this.contains(p)&&!!this.grid.cost[routeIx(this.grid,p.x-this.x,p.y-this.y)]}
  clear(a,b){return this.contains(a)&&this.contains(b)&&lineClear(this.grid,a.x-this.x,a.y-this.y,b.x-this.x,b.y-this.y)}
  // Keep blocked slots on the leader's connected ground; distinct nearby slots prevent a pile on a riverbank or building.
  snap(p,reach,reserved,inside){
    const g=this.grid,a=this.local(p),i=routeIx(g,a.x,a.y),ok=j=>g.cost[j]&&(!reach||reach[j])&&(!reserved||!reserved.has(j))&&(!inside||inside({x:this.x+(j%g.C+.5)*g.cs,y:this.y+(Math.floor(j/g.C)+.5)*g.cs}));
    if(this.contains(p)&&ok(i)){if(reserved)reserved.add(i);return{x:p.x,y:p.y}}
    const c0=i%g.C,r0=Math.floor(i/g.C);let best=-1,dist=Infinity;
    for(let k=0;k<Math.max(g.C,g.R)&&!(best>=0&&k*k>dist);k++)for(let r=Math.max(0,r0-k);r<=Math.min(g.R-1,r0+k);r++){
      const edge=r===r0-k||r===r0+k;for(let c=c0-k;c<=c0+k;c+=edge||k===0?1:2*k){if(c<0||c>=g.C)continue;const j=r*g.C+c,d=(c-c0)**2+(r-r0)**2;if(ok(j)&&d<dist){best=j;dist=d}}}
    if(best<0)return null;if(reserved)reserved.add(best);return{x:this.x+(best%g.C+.5)*g.cs,y:this.y+(Math.floor(best/g.C)+.5)*g.cs};
  }
  reachable(p){const a=this.local(p),i=routeNear(this.grid,routeIx(this.grid,a.x,a.y));if(this.root!==i){this.root=i;this.reach=routeFlood(this.grid,i)}return this.reach}
  path(a,b){const p=routePath(this.grid,a.x-this.x,a.y-this.y,b.x-this.x,b.y-this.y);return p.map(([x,y])=>({x:x+this.x,y:y+this.y}))}
}
class MarchArmy{
  constructor(o){this.owner=o;this.face=this.heading=marchFacing(o);this.x=o.x;this.y=o.y;this.units=[];this.serial=0;this.time=0;this.key='';this.ground=null}
  static of(o){let a=MARCH_ARMIES.get(o);if(a&&Math.hypot(o.x-a.x,o.y-a.y)>MARCH_MOVE.teleport){MARCH_ARMIES.delete(o);a=null}if(!a){a=new MarchArmy(o);MARCH_ARMIES.set(o,a);a.sync()}return a}
  static spread(o){const a=MARCH_ARMIES.get(o);return a&&Math.hypot(o.x-a.x,o.y-a.y)<=MARCH_MOVE.teleport?Math.max(0,...a.units.map(u=>Math.hypot(u.x-o.x,u.y-o.y)+3)):0}
  targets(){
    const o=this.owner,co=Math.cos(this.face),si=Math.sin(this.face),out=[];
    for(const row of this.rows)if(row.id!=='hero'){
      const x=o.x+row.x*co-row.y*si,y=o.y+row.x*si+row.y*co,slots=formSlots(row.form,row.count,this.face,row.files,WORLD_BATTLE.sprite);
      slots.forEach(([sx,sy],i)=>out.push({row:row.id,index:i,type:row.type,character:row.character,x:x+sx/WORLD_BATTLE.scale,y:y+sy/WORLD_BATTLE.scale}));
    }return out;
  }
  sync(){
    this.rows=marchRows(this.owner);const key=JSON.stringify(this.rows);if(key===this.key&&!this.units.some(u=>u.dead))return;this.key=key;
    const targets=this.targets(),old=this.units.filter(u=>!u.dead),used=new Set(),units=[];
    this.ground=new MarchGround(this.owner,old);this.refresh=this.time+MARCH_MOVE.refresh;const g=this.ground,reach=g.reachable(this.owner),reserved=new Set();
    for(const p of targets){let u=old.find(u=>!used.has(u)&&u.row===p.row&&u.type===p.type);if(u){used.add(u);reserved.add(routeIx(g.grid,u.x-g.x,u.y-g.y))}else{const q=g.snap(p,reach,reserved)||g.snap(this.owner,null,reserved);if(!q)continue;u={id:++this.serial,x:q.x,y:q.y,walk:0,walking:false};}
      Object.assign(u,{row:p.row,index:p.index,type:p.type,character:p.character,goal:{x:p.x,y:p.y},plan:null});units.push(u)}this.units=units;
  }
  step(d,sync=true,bounds=null,inside=null){
    if(!(d>0))return;const o=this.owner;if(Math.hypot(o.x-this.x,o.y-this.y)>MARCH_MOVE.teleport){MARCH_ARMIES.delete(o);MarchArmy.of(o);return}
    if(sync)this.sync();this.time+=d;const dx=o.x-this.x,dy=o.y-this.y,moved=Math.hypot(dx,dy),to=moved>.001?(this.heading=Math.atan2(dy,dx)):this.heading,gap=Math.atan2(Math.sin(to-this.face),Math.cos(to-this.face));this.face+=clamp(gap,-MARCH_MOVE.turn*d,MARCH_MOVE.turn*d);this.x=o.x;this.y=o.y;
    if(!this.ground||this.ground.version!==WAYV||this.time>=(this.refresh||0)||!this.ground.covers(o,marchOuter(o)+8)||this.units.some(u=>!this.ground.covers(u,8))){this.ground=new MarchGround(o,this.units);this.refresh=this.time+MARCH_MOVE.refresh}
    const nav=this.ground,reach=nav.reachable(o),reserved=new Set(),targets=this.targets();this.queries=0;
    const pace=o===P?MAP_BASE*travelMul()*(P.morale<25?.8:1)*roadSprint()*hurryPace():partySpeed(o,o.troops),step=moveStep(pace,d)*MARCH_MOVE.catchup;
    const buckets=new Map(),cell=MARCH_MOVE.bucket,key=(x,y)=>Math.floor(x/cell)+','+Math.floor(y/cell),put=u=>{const k=key(u.x,u.y),a=buckets.get(k)||[];if(!buckets.has(k))buckets.set(k,a);a.push(u);u.bucket=k};this.units.forEach(put);
    const near=u=>{const out=[],cx=Math.floor(u.x/cell),cy=Math.floor(u.y/cell);for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++)out.push(...buckets.get(x+','+y)||[]);return out};
    const wanted=new Map(targets.map(p=>[p.row+':'+p.index,p])),requests=[],sameGoals=this.goalGround===nav&&this.goalX===o.x&&this.goalY===o.y&&this.goalFace===this.face&&this.goalRoster===this.key&&this.goalBounds===bounds;
    this.goalGround=nav;this.goalX=o.x;this.goalY=o.y;this.goalFace=this.face;this.goalRoster=this.key;this.goalBounds=bounds;
    for(const u of this.units){u.walking=false;const p=wanted.get(u.row+':'+u.index);if(!sameGoals)u.goal=p&&nav.snap(bounds?bounds(p):p,reach,reserved,inside);if(!u.goal)continue;
      u.straight=nav.clear(u,u.goal);if(u.straight){u.plan=null;delete u.needAt;continue}
      const w=u.plan;if(!w||w.ground!==nav||this.time>=w.at||Math.hypot(w.goal.x-u.goal.x,w.goal.y-u.goal.y)>nav.grid.cs){u.needAt??=this.time;requests.push(u)}}
    requests.sort((a,b)=>a.needAt-b.needAt||a.id-b.id);for(const u of requests.slice(0,MARCH_MOVE.queries)){this.queries++;u.plan={ground:nav,p:nav.path(u,u.goal),i:0,goal:u.goal,at:this.time+MARCH_MOVE.repath+u.id%7*.025};delete u.needAt}
    for(const u of this.units){const goal=u.goal;if(!goal||Math.hypot(goal.x-u.x,goal.y-u.y)<=MARCH_MOVE.settle)continue;
      let aim=goal;if(!u.straight){const w=u.plan;if(!w||w.ground!==nav||!w.p.length)continue;while(w.i<w.p.length-1&&(Math.hypot(w.p[w.i].x-u.x,w.p[w.i].y-u.y)<MARCH_MOVE.waypoint||nav.clear(u,w.p[w.i+1])))w.i++;aim=w.p[w.i]}
      const ax=aim.x-u.x,ay=aim.y-u.y,l=Math.hypot(ax,ay);if(l<.001)continue;const amount=Math.min(step,l),friends=near(u),angle=Math.atan2(ay,ax);let q=null;
      for(const off of MARCH_MOVE.sidestep){const p={x:u.x+Math.cos(angle+off)*amount,y:u.y+Math.sin(angle+off)*amount};if(nav.clear(u,p)&&!friends.some(v=>v!==u&&Math.hypot(v.x-p.x,v.y-p.y)<MARCH_MOVE.gap&&Math.hypot(v.x-p.x,v.y-p.y)<Math.hypot(v.x-u.x,v.y-u.y)-.001)){q=p;break}}if(!q)continue;
      const at=buckets.get(u.bucket);at.splice(at.indexOf(u),1);u.dir=Math.atan2(q.y-u.y,q.x-u.x);u.x=q.x;u.y=q.y;u.walk+=amount;u.walking=true;put(u);
    }
  }
  forGroup(id){return this.units.filter(u=>u.row===id)}
}
onWorld(()=>{MARCH_ARMIES=new WeakMap()});
Systems.add({name:'march formations',order:{frame:145},frame:d=>{
  if(!WORLD_BATTLE.on)return;const range=vis()+MARCH_MOVE.active;
  for(const o of [P,...W.parties]){if(o===P?(P.stay||P.camp):o.dead||o.gone||o.inside||o.fight||Math.hypot(o.x-P.x,o.y-P.y)>range)continue;MarchArmy.of(o).step(d)}
}});
