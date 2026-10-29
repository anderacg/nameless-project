'use strict';
/* Hunting is a world battle: ordinary armies and attacks, individual fleeing wildlife, species loot. */
/* the hunt's tracks: each animal's prints as it runs (HUNT_TRACK), where each was last seen, what your hunters can read of them,
   and where a group with no prey in sight goes to find some: along the freshest trail it reads, else to the nearest last sighting */
class HuntTracks{
  constructor(){this.trails=new Map();this.seen=new Map()}
  step(u){const X=HUNT_TRACK;let l=this.trails.get(u);if(!l)this.trails.set(u,l=[]);const q=l[l.length-1];
    if(!q||Math.hypot(u.x-q.x,u.y-q.y)>=X.sample)l.push({x:u.x,y:u.y,t:B.t,a:Math.atan2(u.y-(q?q.y:u.y),u.x-(q?q.x:u.x-1))});
    while(l.length&&(B.t-l[0].t>X.life||l.length>X.keep))l.shift()}
  sight(u){this.seen.set(u,{x:u.x,y:u.y,t:B.t})}
  get reach(){return HUNT_TRACK.read+HUNT_TRACK.scout*skill('scout')}
  // (a print one of your hunters stands within reach of)
  readable(p,hunters,r){return hunters.some(h=>Math.hypot(h.x-p.x,h.y-p.y)<=r)}
  // where a group (C: its middle) goes: on along the freshest trail any of your hunters reads, else the nearest last sighting
  search(C,hunters,live){const r=this.reach;let best=null;
    for(const [u,l] of this.trails){if(!live(u))continue;for(let i=l.length-1;i>=0;i--){if(!this.readable(l[i],hunters,r))continue;if(!best||l[i].t>best.t)best={t:l[i].t,l,i};break}}
    if(best){const p=best.l[Math.min(best.l.length-1,best.i+HUNT_TRACK.ahead)];return {x:p.x,y:p.y}}
    let near=null;for(const [u,p] of this.seen)if(live(u)&&(!near||Math.hypot(p.x-C.x,p.y-C.y)<Math.hypot(near.x-C.x,near.y-C.y)))near=p;return near}
  // the prints your hunters read, under everyone (render.js drawBattle): a beast's own kind of print, fading with its age
  draw(hunters){const r=this.reach,k=WORLD_BATTLE.sprite,CR=Object.keys(TRACKS.col).indexOf('known');
    for(const [u,l] of this.trails){const D=CRITTERS[u.wildlife],art=D&&D.size>=2?TRACKS.art.game.big:TRACKS.art.game.small;
      l.forEach((p,i)=>{if(!this.readable(p,hunters,r))return;const a=1-(B.t-p.t)/HUNT_TRACK.life;if(a<=0)return;
        ctx.save();ctx.globalAlpha=Math.min(1,a);ctx.translate(p.x,p.y);ctx.scale(k,k);const S=trackPic(art,0,p.a,i&1,CR,ctx.getTransform().a);ctx.drawImage(S,S.ox,S.oy,S.w,S.h);ctx.restore()})}}
}
class HuntBattleArea extends WorldBattleArea{
  constructor(e){
    super(e);const a=e.hunt;this.herds=a.herds;this.x=a.x;this.y=a.y;this.r=HUNT_AREA.radius;this.span=Math.ceil(2*(this.r+WORLD_BATTLE.apron));this.x0=this.x-this.span/2;this.y0=this.y-this.span/2;this.cx=this.cy=this.span*this.scale/2;this.radius=this.r*this.scale;
    this.initial=new Set([P,...this.herds]);this.participants=new Set(this.initial);this.pending=[];this.animals=[];this.joinedFight=false;this.tracks=new HuntTracks();
  }
  reinforce(){}
  watchBlocked(){}
  clamp(){
    for(const u of B.units)if(!u.wildlife&&u.hp>0&&!u.rout&&!withdrawing(u)&&!u.waiting){const p=this.constrain(u);u.x=p.x;u.y=p.y}
    for(const g of Object.values(B.groups))if(g.player&&g.order!=='rout'&&g.order!=='withdraw'){const p=this.constrain({x:g.ax,y:g.ay},16);g.ax=p.x;g.ay=p.y;for(const q of g.queue||[]){const a=this.constrain(q,16);q.x=a.x;q.y=a.y}}
  }
  depart(u){if(u.wildlife){u.fled=true;B.fledFoes=(B.fledFoes||0)+1;delete u.regroup;leaveField(u)}else super.depart(u)}
  // Choose a reachable way away from the nearest hunter once, then keep it while that threat stays on the same side.
  flight(u,threat){
    const g=this.escapeRoutes[routeWho(u.s)],old=u.huntWay;if(old&&B.t<old.at&&Math.hypot(threat.x-old.tx,threat.y-old.ty)<HUNT_AREA.threatShift)return old;
    const D=routeDist(g,u.x,u.y),dx=u.x-threat.x,dy=u.y-threat.y,dd=Math.hypot(dx,dy)||1;let at=-1,best=Infinity;
    for(let i=0;i<D.length;i++){if(!Number.isFinite(D[i])||!g.cost[i])continue;const x=(i%g.C+.5)*g.cs,y=(Math.floor(i/g.C)+.5)*g.cs;if(this.distance({x,y})<this.radius+g.cs||y<fieldTop()||y>fieldBot())continue;
      const vx=x-u.x,vy=y-u.y,d=Math.hypot(vx,vy)||1,alignment=(vx*dx+vy*dy)/d/dd,score=D[i]+(1-alignment)*this.radius;
      if(score<best){best=score;at=i}
    }
    if(at<0)return null;const to={x:(at%g.C+.5)*g.cs,y:(Math.floor(at/g.C)+.5)*g.cs},p=routePath(g,u.x,u.y,to.x,to.y,{budget:g.cost.length});return u.huntWay={g,v:g.v,to,p,i:0,tx:threat.x,ty:threat.y,at:B.t+HUNT_AREA.replan};
  }
  turn(u,dt){
    if(!(dt>0)){u.spdNow=0;return}if(!this.inside(u,-2))return this.depart(u);if(u.stun>0){u.stun-=dt;u.spdNow=0;return}if(PHYSICS.on&&physDown(u,dt))return;
    const hunters=B.units.filter(v=>v.team===0&&v.hp>0&&!v.left&&!v.rout),near=Spatial.nearest(hunters,u.x,u.y),previous=u.huntThreat,dist=v=>v?Math.hypot(u.x-v.x,u.y-v.y):Infinity,threat=previous&&hunters.includes(previous)&&dist(previous)<=dist(near)/WILDLIFE_AWARE.switch?previous:near,D=CRITTERS[u.wildlife],seconds=dt/(WORLD_PACE*WORLD_SCALE.move*this.scale),distance=dist(threat),point=threat&&this.world(threat),hidden=point&&hiddenAt(point.x,point.y);u.huntThreat=threat;
    if(u.hp<u.max||distance<D.shy*this.scale*(hidden?WILDLIFE_AWARE.cover:1))u.alert=Math.min(1,u.alert+seconds/(hidden?HUNT_AREA.alertCover:HUNT_AREA.alertOpen));
    if(distance<WORLD_BATTLE.interaction*this.scale||u.hp<u.max)u.alert=1;
    u.spdNow=0;if(!threat||u.alert<1){u.rest=(u.rest||0)+seconds;if(u.rest>ESCAPE_STAMINA.delay)u.escapeSta=Math.min(u.escapeCap,u.escapeSta+u.escapeCap*ESCAPE_STAMINA.recovery*seconds);u.sta=u.escapeSta/u.escapeCap*FATIGUE.max;return}
    u.rest=0;const way=this.flight(u,threat),dir=this.escapeWay(u,way);if(!dir)return;const ratio=clamp(u.escapeSta/u.escapeCap,0,1),factor=ratio>=.6?1:ratio>=.25?.8+(ratio-.25)/.35*.2:ESCAPE_STAMINA.floor+ratio/.25*(.8-ESCAPE_STAMINA.floor),step=Math.min(dir[2],u.s.spd*factor*dt);
    const x=u.x+dir[0]*step,y=u.y+dir[1]*step;if(!lineClear(way.g,u.x,u.y,x,y))return;u.x=x;u.y=y;this.tracks.step(u);u.dir=Math.atan2(dir[1],dir[0]);u.face=dir[0]>=0?1:-1;u.spdNow=step/dt;u.escapeSta=Math.max(0,u.escapeSta-seconds);u.sta=u.escapeSta/u.escapeCap*FATIGUE.max;
    if(!this.inside(u,-2))this.depart(u);
  }
  orders(groups){
    const prey=this.animals.filter(u=>u.hp>0&&!u.left),hunters=B.units.filter(u=>u.team===0&&u.hp>0&&!u.left&&!u.rout),live=u=>u.hp>0&&!u.left;for(const u of prey)if(seenBy(0,u))this.tracks.sight(u);
    for(const g of groups){const m=grpUnits(g.id);if(!m.length||g.order==='withdraw'||g.order==='rout')continue;const C=centroid(m),targets=prey.filter(u=>seenBy(0,u)&&canReach(C,u,groupWho(m))),target=Spatial.nearest(targets,C.x,C.y);
      // (none in sight: on along the tracks, or to where one was last seen)
      if(!target){const to=this.tracks.search(C,hunters,live);if(to&&canReach(C,to,groupWho(m))){g.standAt(to.x,to.y);g.setRun(true)}else if(g.hasTarget&&!targetStands(g))g.hold();continue}if(g.targetGroupId!==target.grp)g.attack(target,{run:true});g.faceTo(Math.atan2(target.y-C.y,target.x-C.x));
    }return groups;
  }
  end(){if(B?.hunt!==this||B.over)return;B.retreat=false;B.over=true;B.win=true;B.endT=0;finishBattle()}
  finish(b){
    super.finish(b);const end=document.getElementById('huntEnd');if(end)end.hidden=true;
    for(const c of this.herds){const survivors=this.animals.filter(u=>u.herd===c&&(u.hp>0||u.left));c.n=survivors.length;if(!c.n){c.gone=true;W.critters=W.critters.filter(o=>o!==c);continue}
      const points=survivors.map(u=>this.world(u));c.x=c.hx=points.reduce((n,p)=>n+p.x,0)/points.length;c.y=c.hy=points.reduce((n,p)=>n+p.y,0)/points.length;c.escapeSta=Math.min(...survivors.map(u=>u.escapeSta));c.cool=1;c.idle=false;
    }
  }
  settle(b,lost,groupLosses){
    BATTLE_MOOD=null;const saved=heal(lost,groupLosses);for(const g of groupLosses)if(g.count)partyRoster(P).remove(g.type,g.count,g.id);
    const dead=this.animals.filter(u=>u.hp<=0&&!u.left),escaped=this.animals.filter(u=>u.left).length;
    for(const c of this.herds){const n=dead.filter(u=>u.herd===c).length;if(n)huntRewards(c,n)}
    for(const u of b.units)if(!u.team&&!u.hero&&!u.comp&&(u.xp||0)>0)txpGain(u.type,u.xp);txpClamp();
    const e=G.enc;G.enc=null;G.encCool=3;G.mode='dialog';WildHunt.controls();worldEmit('battle:ended',{enc:e,how:b.retreat?'withdrawn':'won'});
    const report={groups:groupLosses.map(g=>({id:g.id,type:g.type,name:g.name,start:g.start,fit:g.start-g.count,wounded:g.wounded,killed:g.count-g.wounded,saved:g.saved,rearguard:0})),characters:[]};
    lootShow('<h2>Hunt complete</h2><p>'+dead.length+' animal'+(dead.length===1?'':'s')+' killed · '+escaped+' escaped · '+(this.animals.length-dead.length-escaped)+' still alive. Only kills provide meat and species trophies.</p>',lost,saved,'cont',report);updateHUD(true);
  }
}
class HuntBattleSetup extends WorldBattleSetup{
  constructor(opts){super(opts);this.area=new HuntBattleArea(G.enc)}
  createUnits(){
    super.createUnits();const a=this.area;
    for(const [index,c] of a.herds.entries()){
      const D=CRITTERS[c.id],key='wild_'+c.id;if(!ST[key])ST[key]={n:D.n,hp:D.size*HUNT_AREA.hp,dmg:0,spd:D.spd,reach:2,range:0,cd:1,tier:1,beast:true,wildlife:c.id,arm:0};
      for(let i=0;i<c.n;i++){const side=i%2?-1:1,offset=i?Math.ceil(i/2)*3:0,p={x:c.x+side*offset,y:c.y-offset*.3},u=this.spawn(troopOf(key),1,0,0);Object.assign(u,a.field(p),{grp:'wild_'+index,wildlife:c.id,herd:c,alert:0,escapeCap:EscapeStamina.capacity(c),escapeSta:c.escapeSta??EscapeStamina.capacity(c)});this.units.push(u);a.animals.push(u)}
    }
  }
  createState(){const b=super.createState();b.hunt=this.area;return b}
  initialize(){
    // Standard combat initialization and original marching positions, with no opposing-army preparation phase; each animal's
    // place its first sighting (seen on the map, where the hunt was chosen: HuntTracks)
    super.initialize();const a=this.area;delete B.muster;B.ready=false;B.paused=false;B.auto=true;
    for(const [id,g] of Object.entries(B.groups))if(!g.player){const m=B.units.filter(u=>u.grp===id);for(const u of m){const c=u.herd;if(!c)continue;const index=a.animals.filter(v=>v.herd===c).indexOf(u),offset=index?Math.ceil(index/2)*3:0;Object.assign(u,a.field({x:c.x+(index%2?-1:1)*offset,y:c.y-offset*.3}));u.sta=u.escapeSta/u.escapeCap*FATIGUE.max;delete u.rout;delete u.left;u.hp=u.max;u.sx=u.sy=0;a.tracks.sight(u)}if(m.length){const p=centroid(m);g.ax=p.x;g.ay=p.y;g.order='hold'}}
    B.sight=null;sightStep(true);
  }
  survey(){super.survey();this.env.name='Hunting area';this.env.text='Auto Hunt is on for your whole army. Give orders or use AI to take command. Wildlife can escape beyond the circle; kills provide meat and trophies.'}
  present(){super.present();let end=document.getElementById('huntEnd');if(!end){end=document.createElement('button');end.id='huntEnd';end.type='button';end.className='btn sm';end.textContent='End hunt';end.addEventListener('click',()=>B?.hunt?.end());bbar.querySelector('.btime').appendChild(end)}end.hidden=false;window.mobileBattleHud?.sync();autoUI()}
}
