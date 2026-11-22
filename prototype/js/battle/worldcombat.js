'use strict';
/* Continuous world encounters: individual targets, earned rewards and a return to travel without a results window. */
class WorldFigure extends WorldObject{
  constructor(owner,unit,index=null){super();this.owner=owner;this.unit=unit;this.index=index}
  get x(){return this.unit.x} get y(){return this.unit.y}
  get mapKind(){return this.owner.mapKind}
  get wild(){return this.owner.wild}
  get id(){return this.owner.id}
  get fac(){return this.owner.fac}
  get faction(){return this.owner.faction}
  get meetsAnyTime(){return true}
  here(){return this.owner.here()&&!this.unit.dead&&(this.index==null?MARCH_ARMIES.get(this.owner)?.units.includes(this.unit):HERD_FLOCK.get(this.owner)?.m[this.index]===this.unit)}
  inView(V){return this.owner.inView(V)&&manSpotted(yourSight(V),this)}
  chaseable(){return this.here()}
  meetPoint(){return this}
  pick(at){const b=this.index!=null?[-critterArt(this.id,0).w/2,-critterArt(this.id,0).h,critterArt(this.id,0).w/2,1]:MARCH_ARMIES.get(this.owner)?.figure(this.unit);if(b)at.box(this,this.x+b[0],this.y+b[1],this.x+b[2],this.y+b[3])}
  meet(){if(!this.here())return false;G.worldTarget=this;return this.index!=null?WildHunt.prepare(this.owner,this):this.owner.meet()}
  tip(){const n=this.index!=null?CRITTERS[this.id].n:ST[this.unit.type]?.n||this.owner.label();return '<b>'+htmlText(n)+'</b><small>'+htmlText(this.index!=null?'Wild game':this.owner.label())+'</small><span class="act">Click: '+(this.index!=null?'hunt':'attack')+' this individual</span>'}
}
const WORLD_REWARD={life:.85,merge:.28,max:32,dots:3,spread:24,arc:12,xp:'#efd27d',proficiency:'#9dcee8'};
class WorldCombat{
  static figures=new WeakMap();
  static afterglow=[];
  static glowTime=0;
  static figure(owner,unit,index=null){let f=this.figures.get(unit);if(!f||f.owner!==owner||f.index!==index)this.figures.set(unit,f=new WorldFigure(owner,unit,index));return f}
  static live(b=B){return !!(b?.world&&!b.opts.tournament&&!b.opts.sandbox&&!b.inside&&!b.works)}
  static begin(b){
    if(!this.live(b))return;G.paused=false;pauseUI();setSpeed(1);setBattleSpeed(1);b.worldMark={gold:P.gold,renown:P.renown,xp:xpTotal()};const target=G.worldTarget;G.worldTarget=null;
    if(!b.sides)b.world.sides=b.sides=new BattleSides(b,G.enc);
    if(!target?.here())return;
    const u=b.units.find(u=>target.index!=null?u.herd===target.owner&&u.herdIndex===target.index:u.marchUnit===target.unit);
    if(u){setAuto(false,true);this.attack(u,playerGroups())}
  }
  static attack(u,gs=selGroups()){
    if(!this.live()||B.over||!u||u.hp<=0||u.left||!battleEnemy(0,u)||!seenBy(0,u))return false;
    if(!gs.length)gs=playerGroups().filter(id=>grpUnits(id).some(u=>u.hero));
    playerOrder(gs,()=>{for(const id of gs)B.groups[id].attack(u,{run:true,individual:true})});
    B.worldTarget=u;B.mark={x:u.x,y:u.y,t:.7,foe:true};return true;
  }
  // A normal click/tap on an enemy has the same meaning before and during combat.
  static click(x,y,externalOnly=false){
    if(!this.live()||B.over||B.deploy)return false;const u=externalOnly?null:rtsUnitAt(x,y,1);
    const a=B.world,p=a.world({x,y:fieldGround(x,y)}),f=pickAt(p.x,p.y),o=f instanceof WorldFigure?f.owner:f;
    if(!o||!o.here()||!o.inView(vis())||a.participants.has(o)||!a.inside(a.field(f),12))return !!u&&this.attack(u);
    if(o.mapKind==='critter'&&o.wild)this.addHerd(o);
    else if(o instanceof Party&&wuiKind(o)==='foe'){
      const r=B.sides?.byOwner.get(o);if(r?.joined)return false;
      a.join(o,1);
    }else return !!u&&this.attack(u);
    if(!a.participants.has(o)){toast('Too many fighters nearby to engage another army.');return true}
    const target=B.units.find(u=>f instanceof WorldFigure?(f.index!=null?u.herd===o&&u.herdIndex===f.index:u.marchUnit===f.unit):(u.herd===o||armySource(u.sourceArmy)===o));
    this.attack(target);return true;
  }
  static move(x,y){
    if(!this.live()||B.over||rtsUnitAt(x,y,0))return false;
    if(!B.world.inside({x,y},16)){
      B.worldTravel=B.world.world({x,y:fieldGround(x,y)});
      playerOrder(playerGroups(),()=>{for(const id of playerGroups())B.groups[id].withdraw()});toast('Disengaging. Your army will continue toward that destination.');return true;
    }
    if(!selGroups().length)B.sel=B.hero?.grp;
    rtsOrder(x,y);return true;
  }
  static addHerd(c){
    const b=B,a=b.world;if(a.participants.has(c)||b.sides?.records.length>=BATTLE_JOIN.armies||b.units.filter(u=>u.hp>0&&!u.left).length+c.n>BATTLE_JOIN.fighters){toast('Too many fighters nearby.');return false}
    const wild=b.hunt||(b.wild||(b.wild=new WorldWildlife(a))),builder=new BattleSetup(b.opts);builder.env=b.env;builder.id=Math.max(-1,...b.units.map(u=>u.id))+1;
    const r=b.sides?.add(c,c,1);if(r){r.joined=true;r.start=c.n;b.sides.activate()}
    wild.herds.push(c);a.participants.add(c);const team=r?.team??1,id='wild_join_'+(++a.serial);
    for(let i=0;i<c.n;i++){const u=WorldBattleSetup.prototype.spawn.call(builder,troopOf(wildTroop(c.id)),team,0,0),p=herdSpotNow(c,i);
      Object.assign(u,a.field(p),{grp:id,wildlife:c.id,herd:c,herdIndex:i,alert:c.run>0?1:0,escapeCap:EscapeStamina.capacity(c),escapeSta:c.m?.[i]?.sta??c.escapeSta??EscapeStamina.capacity(c),face:p.f||1});
      u.mor=u.mor0=unitMoraleOf(u.s);u.sta=FATIGUE.max;u.vig=1;b.units.push(u);wild.animals.push(u);if(!b.groups[id]){b.groups[id]=new BattleControl(id,team,{player:false,foe:true,role:'beast',type:u.type,name:CRITTERS[c.id].n,ax:u.x,ay:u.y});r?.groups.push(id)}
    }
    b.sight=null;sightStep(true);setOrderUI();return true;
  }
  static killed(u,source){
    const b=B;if(!this.live(b)||u.worldRewarded||!source||!battleEnemy(source,u)||!(source.hero||b.groups[source.grp]?.player))return;
    u.worldRewarded=true;const n=u.wildlife?CRITTERS[u.wildlife].xp:8;
    b.worldXp=(b.worldXp||0)+n;if(!u.wildlife)b.worldWarXp=(b.worldWarXp||0)+n;
    const was=b.worldRewardOrigin;b.worldRewardOrigin=u;try{gainXp(n,u.wildlife?'hunt':undefined)}finally{b.worldRewardOrigin=was}
    if(u.wildlife){b.worldHuntXp=b.worldHuntXp||new Map();b.worldHuntXp.set(u.herd,(b.worldHuntXp.get(u.herd)||0)+n)}
  }
  static remaining(b,n){return Math.max(0,n-(this.live(b)?b.worldWarXp||0:0))}
  static wildlifeRewards(b){const wild=b.hunt||b.wild;if(!wild)return;for(const c of wild.herds){const n=wild.animals.filter(u=>u.herd===c&&u.hp<=0&&!u.left).length;if(n)huntRewards(c,n,this.live(b)?n*CRITTERS[c.id].xp:b.worldHuntXp?.get(c)||0)}}
  // Cosmetic only: real gains are already paid. Merge practice by recipient, without numbers or popup logs.
  static notice(label,n,character){
    if(!this.live()||!(n>0))return;
    const to=character?B.units.find(u=>u.unit===character&&(u.hero||u.comp||B.groups[u.grp]?.player)):B.hero;
    if(!to||to.hp<=0||to.left)return;
    const kind=label==='XP'?'xp':'proficiency',L=B.worldRewards||(B.worldRewards=[]),R=WORLD_REWARD;
    if(L.some(f=>f.to===to&&f.kind===kind&&f.age<R.merge))return;
    const serial=B.worldRewardSerial=(B.worldRewardSerial||0)+1,k=worldEffectScale(),from=B.worldRewardOrigin,a=hash(serial,to.id||0,712)*Math.PI*2;
    if(L.length>=R.max)L.shift();
    L.push({to,kind,age:0,c:R[kind],x:from?.x??to.x+Math.cos(a)*R.spread*k,y:from?.y??to.y+Math.sin(a)*R.spread*k,serial});
  }
  static rewardPoint(f,p){
    p=clamp(p,0,1);const e=1-(1-p)**3,k=f.scale??worldEffectScale(),arc=Math.sin(p*Math.PI)*WORLD_REWARD.arc*k;
    return{x:f.x+(f.to.x-f.x)*e+arc*(hash(f.serial,0,713)-.5),y:f.y+(f.to.y-f.y)*e-arc};
  }
  static drawRewards(){
    if(!this.live()||!B.worldRewards?.length)return;
    const R=WORLD_REWARD,rm=reducedMotion();
    for(const f of B.worldRewards){if(f.to.hp<=0||f.to.left)continue;
      for(let i=0;i<(rm?1:R.dots);i++){
        const p=(f.age-i*.07)/(R.life-.14);if(p<0||p>1)continue;
        const at=this.rewardPoint(f,rm?1:p),tail=this.rewardPoint(f,Math.max(0,p-.08)),alpha=Math.min(1,p*8,(1-p)*5);
        ctx.save();try{
          effectTransform(at.x,at.y,worldEffectScale(),0,fxUp(8));ctx.globalCompositeOperation='lighter';
          ctx.strokeStyle=f.c;ctx.fillStyle=f.c;ctx.globalAlpha=alpha*.45;ctx.lineWidth=.65;
          if(!rm){const dx=at.x-tail.x,dy=at.y-tail.y,d=Math.hypot(dx,dy)||1,len=Math.min(3,d/worldEffectScale());ctx.beginPath();ctx.moveTo(at.x-dx/d*len,at.y-dy/d*len);ctx.lineTo(at.x,at.y);ctx.stroke()}
          ctx.globalAlpha=alpha*.18;ctx.beginPath();ctx.arc(at.x,at.y,3,0,Math.PI*2);ctx.fill();
          ctx.globalAlpha=alpha;ctx.beginPath();ctx.arc(at.x,at.y,1,0,Math.PI*2);ctx.fill();
        }finally{ctx.restore()}
      }
    }
  }
  // The final kill's motes finish in the world after settlement, following the restored marchers.
  static carryRewards(b){
    for(const f of b.worldRewards||[]){const to=f.to.hero?P:f.to.marchUnit||b.world.world(f.to);this.afterglow.push({...f,...b.world.world(f),to,scale:WORLD_BATTLE.sprite/b.world.scale})}
    b.worldRewards=[];this.afterglow=this.afterglow.slice(-WORLD_REWARD.max);this.glowTime=performance.now()/1000;
  }
  static drawAfterglow(){
    const now=performance.now()/1000,dt=Math.max(0,now-(this.glowTime||now));this.glowTime=now;
    for(const f of this.afterglow)f.age+=dt;
    this.afterglow=this.afterglow.filter(f=>f.age<WORLD_REWARD.life&&!f.to.dead&&!(f.to.hp<=0));
    if(!this.afterglow.length)return;
    const d=dprOf(),k=VS/d,rm=reducedMotion();ctx.save();
    try{ctx.setTransform(d,0,0,d,0,0);ctx.globalCompositeOperation='lighter';
      for(const f of this.afterglow)for(let i=0;i<(rm?1:WORLD_REWARD.dots);i++){
        const p=(f.age-i*.07)/(WORLD_REWARD.life-.14);if(p<0||p>1)continue;
        const at=this.rewardPoint(f,rm?1:p),x=(at.x-G.cam.x)*k,y=(at.y-liftAt(at.x,at.y)-8*f.scale-G.cam.y)*k,a=Math.min(1,p*8,(1-p)*5);
        ctx.fillStyle=f.c;ctx.globalAlpha=a*.2;ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=a;ctx.beginPath();ctx.arc(x,y,1,0,Math.PI*2);ctx.fill();
      }
    }finally{ctx.restore()}
  }
  static step(rt){
    if(!this.live())return;const b=B,h=b.hero;if(h)P.hp=Math.max(0,h.hp/FIELD_HP);
    if(b.worldRewards){for(const f of b.worldRewards)f.age+=rt;b.worldRewards=b.worldRewards.filter(f=>f.age<WORLD_REWARD.life&&f.to.hp>0&&!f.to.left)}
  }
  // Settlement still owns diplomacy, medicine and casualties; presentation never blocks world play.
  static complete(b){
    if(!this.live(b))return;this.carryRewards(b);
    const L=G.loot;if(L){L.capture=false;for(const s of L.pile.slice())if(lootBound(s)){const {k,id,n,...extra}=s;s.n-=playerInventory.add(k,id,n,true,extra)}L.pile=L.pile.filter(s=>s.n>0);
      if(L.pile.length){const p=b.world.world(b.hero||{x:b.world.cx,y:b.world.cy}),c=asCarcass({cc:1,x:p.x,y:p.y,cache:true,day:G.day+Clock.frac,items:L.pile.map(s=>({...s}))});Carcass.list.push(c);Carcass.prune()}}
    lootEnd();hidePanel();G.mode='world';G.worldTarget=null;updateHUD(true);openFightOver();
    const gold=P.gold-(b.worldMark?.gold??P.gold),renown=P.renown-(b.worldMark?.renown??P.renown),gains=[gold&&(gold>0?'+':'')+gold+' gold',renown&&(renown>0?'+':'')+renown+' renown'].filter(Boolean);
    toast((b.retreat?'Disengaged':b.win?'Threat cleared':'Your army fell')+(gains.length?' · '+gains.join(' · '):'')+(Carcass.list.some(c=>!c.empty()&&Math.hypot(c.x-P.x,c.y-P.y)<vis())?' · Loot remains on the fallen.':''),b.win?'good':undefined,'war');
    if(Death.slain)return Death.open();if(Captivity.held)return Captivity.open();if(G.capture)return showCapture();
    // A failed withdrawal may immediately be pursued again; it never opens a summary.
    if(G.encAgain){const e=G.encAgain;G.encAgain=null;return startEncounter(e)}
    if(b.worldTravel&&P.hp>0)worldMove(b.worldTravel.x,b.worldTravel.y);
    setTimeout(()=>{if(!B&&G.mode==='world'&&!G.modal)saveGame(true)},0);
  }
}
// Wildlife introduced during an army fight uses that fight's ground and routes, with the same fleeing rules as a hunt.
class WorldWildlife extends HuntBattleArea{
  constructor(area){super({...G.enc,hunt:{x:area.x,y:area.y,herds:[]}});Object.assign(this,area);this.herds=[];this.animals=[];this.tracks=new HuntTracks()}
}

onWorld(()=>{WorldCombat.afterglow=[];WorldCombat.glowTime=0});
