'use strict';
/* A site's residents own their wounds and routine positions. Combat borrows those people, never an extra decorative watch. */
/* look: how much further a man up at a hideout's lookout sees (sites.js Hideout layout); alarm: hours a camp stays roused once anyone
   of it has seen you (no one sleeps; in a fight there all are awake); picket: the lookout's men, taken on alone while unseen, how long
   (hours) before those who get away are back at their camp (the owner, 2026-11-25: the hideout's places, step 3) */
const SITE_LIFE={near:600,scan:.7,sight:85,night:.65,shout:45,wake:2.5,leash:120,raid:3,raidHours:5,heal:.08,look:1.8,alarm:1,picket:.5};
class ResidentForce extends Party{
  constructor(site){super();this.residentSite=site;this.tc={};this.refresh()}
  refresh(){const s=this.residentSite;this.x=s.x;this.y=s.y;this.kind=s.band||s.bandKind||'bandits';this.fac=s.realm||null;this.name=s.name+' defenders';this.troops=SiteLife.fighters(s).map(p=>p.type);return this}
  get mapKind(){return this.residentSite instanceof BanditCamp||this.residentSite.band?'band':'campguard'}
  get faction(){return this.fac}
  here(){return false}
  label(){return this.name}
  banner(){return this.residentSite.flag?.()||null}
  look(){return{col:this.residentSite.TR?.col||FACS[this.fac]?.col||BAND_FLAG[this.kind]||BAND_FLAG.bandits,dir:1}}
}
class ResidentFigure extends WorldObject{
  constructor(site,person){super();this.site=site;this.person=person}
  get x(){return this.person.x} get y(){return this.person.y}
  get mapKind(){return 'resident'}
  get meetsAnyTime(){return true}
  here(){return W.sites.includes(this.site)&&!!this.site.residents?.people.includes(this.person)&&!this.site.cleared&&this.person.hp>0&&!this.person.away&&!SiteLife.inBattle(this.site)}
  inView(V){return this.here()&&this.person.mode!=='sleep'&&yourSight(V).sees(this.x,this.y,1.2)}
  pick(at){if(this.inView(at.V))at.add(this,6,4)}
  meet(){if(!this.here())return false;if(!SiteLife.hostile(this.site))return this.site.meet();if(SiteLife.picket(this.site,this.person))return true;G.residentTarget={site:this.site.i,id:this.person.id};const started=SiteLife.engage(this.site);if(!started)G.residentTarget=null;return started}
  tip(){return '<b>'+htmlText(this.person.name)+'</b><small>'+htmlText(this.site.name)+' · '+htmlText(this.person.mode||'guard')+'</small><span class="act">Click: '+(SiteLife.hostile(this.site)?'attack this individual':'approach')+'</span>'}
}
class SiteLife{
  static active=new Map();
  static forces=new WeakMap();
  static timer=0;
  // (a camp of folk, an outpost, and a bandit camp or hideout with people of its own: sites.js Lair life, LAIR_LIFE)
  static managed(s){return s instanceof Encampment||s instanceof Outpost||s instanceof Lair&&!!s.life}
  // (where a bandit camp's or a hideout's people live: round its fire, LAIR_LIFE ring; else under its point)
  static centre(s){const L=s.life;return L?{x:s.x+L.ring[0],y:s.y+L.ring[1],rx:L.ring[2],ry:L.ring[3]}:{x:s.x,y:s.y+13,rx:22,ry:10}}
  // (a hideout's people at its places (sites.js Hideout layout): the watch up at its lookout, the raiders by turns at its pen, its cage,
  //  its stash; null: round its fire)
  static post(s,p,mode){const L=s instanceof Hideout?s.layout():[];if(!L.length)return null;
    // (a stronghold's watch shared between its lookouts and its gate, by his id)
    if(mode==='watch'){const W=L.filter(q=>q.k.startsWith('look')||q.k==='gate'),q=W.length?W[p.id%W.length]:L[0];return{x:q.x+((p.id%3)-1)*4,y:q.y+4}}
    if(mode==='train'&&p.beat%2){const q=L[(p.id+p.beat)%L.length];return{x:q.x+((p.id%3)-1)*5,y:q.y+5}}
    return null}
  // (underground, a lair's people are not seen on the map: no figures, no watch over it)
  static under(s){return !!s.tunnel}
  static hostile(s){if(LairDeal.open(s))return false;return s instanceof BanditCamp||!!s.band||s.realm&&s.realm!=='player'&&hostileTo(s.realm)}
  static epoch(s){return s instanceof Outpost?s.owner||'none':s instanceof Lair?'bandits:'+s.back:'folk'}
  static book(s){const owner=this.epoch(s);let b=s.residents;
    if(!b||b.owner!==owner){const next=b?.next||1;b=s.residents={owner,next,slots:s.pop||0,x:s.x,y:s.y,people:[]};this.active.delete(s);this.forces.delete(s)}
    const dx=s.x-b.x,dy=s.y-b.y;if(dx||dy){for(const p of b.people){if(!p.away){p.x+=dx;p.y+=dy}p.home.x+=dx;p.home.y+=dy}b.x=s.x;b.y=s.y}
    return b}
  static person(s,type,role,x,y,name){const b=this.book(s),id=b.next++,max=ST[type]?.hp||100;
    const p={id,type,role,name:name||ST[type]?.n||'Resident',hp:max,max,x,y,home:{x,y},mode:'watch',walk:0,dir:0,waiting:0,beat:0};b.people.push(p);return p}
  static ensure(s){if(!this.managed(s)||s.cleared)return [];
    const b=this.book(s);
    if(s instanceof Encampment){if(!b.people.length&&!CampFolk.of.has(s))CampFolk.make(s);return b.people}
    if(s instanceof Outpost){const alive=b.people.filter(p=>p.hp>0),n=Math.max(0,s.guards||0);
      if(alive.length>n)for(const p of alive.slice(n)){p.hp=0;p.mode='dead'}
      if(alive.length<n){const types=s.guardDraw(),posts=s.posts();for(let i=alive.length;i<n;i++){const q=i<OUTPOST.sentries.most?s.door(i,OUTPOST.sentries.most):posts[i%posts.length]||s.door();this.person(s,types[i]||s.sentryType(),i%3===0?'watch':'guard',q.x,q.y)}}
    }else if(!b.people.length){
      // (a bandit camp's or a hideout's: as many as it holds now, its chieftain one of them; its band's men (engage.js bandMan) by
      //  its seed, in a ring round its fire)
      const R=seeded((s.seed||1)*997+73),n=Math.max(1,s.lifeTarget()),C=this.centre(s);
      for(let i=0;i<n;i++){const last=i===n-1,a=i/n*Math.PI*2,x=C.x+Math.cos(a)*C.rx,y=C.y+Math.sin(a)*C.ry,type=last?'chief':bandMan(s.bandKind,R(),R());
        this.person(s,type,last?'chief':i<2?'watch':i%3===0?'cook':'raider',x,y,last?s.ld?.name:null)}
      this.routines(s,b.people,0)}
    return b.people}
  static fighters(s){return this.ensure(s).filter(p=>p.hp>0&&!p.away&&p.fighter!==false)}
  static roster(s){return this.fighters(s).map(p=>p.type)}
  static attachCamp(C){const s=C.s,b=this.book(s),now=Clock.hours(),later=b.hour!=null&&Math.abs(now-b.hour)>.1;b.slots=b.slots||C.ppl.length;
    for(const p of C.ppl){let r=b.people[p.i];if(!r){const type=RACES[s.folkRace][p.R.unit||'melee'];r=this.person(s,type,p.role,p.x,p.y,p.name);r.fighter=!!p.R.unit||!!p.R.watch||p.role==='guard';r.home={...p.seat}}
      if(later&&r.hp>0){r.x=p.x;r.y=p.y}p.resident=r;p.name=r.name;p.x=r.x;p.y=r.y;if(r.hp<=0)p.hid=true}b.hour=now;
  }
  static busy(p){return p.resident&&(p.resident.hp<=0||this.inBattle(p.site))}
  static syncCamp(C){if(this.inBattle(C.s))return;this.book(C.s).hour=Clock.hours();for(const p of C.ppl){const r=p.resident;if(!r)continue;r.x=p.x;r.y=p.y;r.mode=p.hid?'sleep':p.mode;r.walk=p.walked;r.walking=p.moving;r.dir=p.dir<0?Math.PI:0}}
  static force(s){let f=this.forces.get(s);if(!f)this.forces.set(s,f=new ResidentForce(s));return f.refresh()}
  static inBattle(s){return !!B?.world&&B.units.some(u=>u.residentSite===s&&!u.residentRoamer&&!u.waiting)}
  static engage(s){if(B||G.modal||s.cleared)return false;
    if(s instanceof Lair){s.attack();return true}
    if(s instanceof Outpost){if(s.ours)return s.meet();return s.act('site-attack',null,()=>{})}
    return s.meet()}
  static frame(d){this.timer-=d;const scan=this.timer<=0;if(scan){this.timer=SITE_LIFE.scan;
      for(const [s] of this.active)if(!W.sites.includes(s)||s.cleared||Math.hypot(s.x-P.x,s.y-P.y)>SITE_LIFE.near+100)this.active.delete(s);
      for(const s of W.sites||[])if(this.managed(s)&&!s.cleared&&s.known()&&Math.hypot(s.x-P.x,s.y-P.y)<=SITE_LIFE.near)this.active.set(s,this.ensure(s))}
    for(const [s,people] of this.active){
      if(s instanceof Encampment){const C=CampFolk.of.get(s);if(C)this.syncCamp(C)}
      else if(!this.inBattle(s))this.routines(s,people,d);
      if(scan&&!this.inBattle(s)&&!this.under(s))this.defend(s);
    }
  }
  static routines(s,people,d){const night=Clock.frac>=ENCAMP.day.dusk||Clock.frac<ENCAMP.day.dawn,up=this.roused(s);
    const patrol=s instanceof Outpost?OutpostWatch.of.get(s)?.men:[];
    for(const p of people){if(patrol?.includes(p))continue;p.walking=false;if(p.hp<=0||p.away)continue;
      const watch=p.role==='watch',mode=watch?'watch':night&&!up?'sleep':p.role==='cook'?'cook':p.role==='chief'?'rest':'train';p.mode=mode;
      if(p.waiting>0){p.waiting-=d;continue}
      if(!p.goal){p.beat=(p.beat+1)%4;const a=(p.beat+(p.id%8)/8)*Math.PI/2,r=watch?30:mode==='sleep'?4:12,C=this.centre(s);p.goal=this.post(s,p,mode)||{x:C.x+Math.cos(a)*r,y:C.y+Math.sin(a)*r*.5};
        if(s instanceof Outpost){const S=[...s.posts(),s.door(p.id%3,3)];p.goal=S[(p.beat+p.id)%S.length];p.route=s.around(p,p.goal)}
      }
      const q=p.route?.[0]||p.goal,dx=q.x-p.x,dy=q.y-p.y,dd=Math.hypot(dx,dy),step=Math.min(dd,footStep('walk',d));
      if(dd>1){const x=p.x,y=p.y;walk(p,dx,dy,step);const moved=Math.hypot(p.x-x,p.y-y);p.walk+=moved;p.walking=moved>.01;if(Math.abs(dx)>.2)p.dir=dx<0?Math.PI:0}
      else if(p.route?.length)p.route.shift();else{p.goal=null;p.waiting=mode==='watch'?2:5}
    }
  }
  static detects(s,p,o){if(p.hp<=0||p.away||p.mode==='sleep')return false;const r=SITE_LIFE.sight*(Clock.frac>=ENCAMP.day.dusk?SITE_LIFE.night:1)*(hiddenAt(o.x,o.y)?.6:1)*(this.atLook(s,p)?SITE_LIFE.look:1);
    return Math.hypot(p.x-o.x,p.y-o.y)<r}
  // (a hideout's lookout, and whether p stands up at it)
  static looks(s){return(s instanceof Hideout?s.layout():[]).filter(q=>q.k.startsWith('look'))}
  static lookOf(s,p){const L=this.looks(s);if(!p)return L[0]||null;return L.find(q=>Math.hypot(p.x-q.x,p.y-q.y-4)<12)||null}
  static atLook(s,p){return !!this.lookOf(s,p)}
  // (roused: someone of it saw you within SITE_LIFE.alarm hours; alarm: rouse it now)
  static roused(s){const b=s.residents;return !!b&&b.alarm!=null&&Clock.hours()-b.alarm<SITE_LIFE.alarm}
  static alarm(s){this.book(s).alarm=Clock.hours()}
  /* taking a hideout's lookout alone (a ResidentFigure met: its man up at the lookout): while the camp is not roused and its fire is
     beyond a shout of the lookout, its men there come down to you as a party of their own (a raid's: residentHome, their ids), the
     rest of the camp none the wiser; beaten, they are gone (SiteLife.hour: away with no party left); those who get away are back at
     its fire within SITE_LIFE.picket hours, and the camp is roused */
  static picket(s,p){const q=this.lookOf(s,p);if(!q||this.roused(s))return false;const C=this.centre(s);if(Math.hypot(q.x-C.x,q.y-C.y)<=SITE_LIFE.shout)return false;
    const men=this.fighters(s).filter(m=>this.lookOf(s,m)===q);if(!men.length)return false;const book=this.book(s);
    const b=asParty({kind:s.bandKind,x:p.x,y:p.y,list:men.map(m=>m.type),residentHome:s.i,residentEpoch:book.owner,residentIds:men.map(m=>m.id),returnAt:Clock.hours()+SITE_LIFE.picket,picket:true,t:1,a:0,idle:true,cool:0,ld:null});
    for(const m of men)m.away=true;bandits.push(b);startEncounter({kind:'party',ref:b,list:b.troops.slice(),mine:true,title:'The lookout of the '+s.name});return true}
  static defend(s){if(G.modal||!B&&(G.enc||G.encCool>0))return;
    const residents=this.fighters(s);if(!residents.length)return;
    if(!B){const sight=yourSight();if(!residents.some(p=>sight.sees(p.x,p.y,1.2)))return}
    if(this.hostile(s)){const army=MARCH_ARMIES.get(P),targets=army&&!army.idle?army.units.filter(u=>!u.dead):[P];if(!P.stay&&!P.inside&&residents.some(p=>targets.some(o=>this.detects(s,p,o)))&&!B){this.alarm(s);this.engage(s);return}}
    const force=this.force(s),foes=[...bandits,...W.monsters.map(asMonster).filter(m=>MONSTERS[m.id]?.aggro),...W.lords,...W.patrols].filter(o=>!o.gone&&!o.dead&&!o.inside&&!o.fight&&!o.qid&&armyRelation(force,o)<0);
    const foe=foes.find(o=>Math.hypot(o.x-s.x,o.y-s.y)<SITE_LIFE.leash&&residents.some(p=>this.detects(s,p,o)));if(!foe)return;
    if(B?.world){if(B.world.inside(B.world.field(s),12)&&B.world.participants.has(foe))B.world.join(force,0);return}
    startEncounter({kind:['monster','lord','patrol'].includes(foe.mapKind)?foe.mapKind:'party',ref:foe,list:foe.troops.slice(),allies:[forceOf(force)],title:s.name+' under attack'});
  }
  static figures(){const out=[];for(const [s,people] of this.active){if(s instanceof Encampment||this.under(s))continue;for(const p of people){const f=new ResidentFigure(s,p);if(f.here())out.push(f)}}return out}
  static visible(){const out=[],S=yourSight();for(const [s,people] of this.active)if(!this.inBattle(s)&&!this.under(s))for(const p of people)if(p.hp>0&&!p.away&&p.mode!=='sleep'&&S.sees(p.x,p.y,1.2))out.push(p);return out}
  static draw(ents,cam,V){const S=yourSight(V);for(const [s,people] of this.active){if(s instanceof Encampment||s instanceof Outpost||this.inBattle(s)||this.under(s))continue;const owner=this.force(s);
    for(const p of people)if(p.hp>0&&!p.away&&p.mode!=='sleep'&&S.sees(p.x,p.y,1.2))ents.push({x:p.x,y:p.y,f:()=>drawMarcher(p,owner,cam)})}}
  static bind(b,area,only=null){const units=only||b.units,used=new Set(b.units.filter(u=>u.resident).map(u=>u.resident)),main=G.enc?.ref;let changed=false;
    for(const u of units){if(u.resident||u.hero||u.comp||u.waiting)continue;const source=armySource(u.sourceArmy);let s=source?.residentSite;
      if(!s&&u.team===1&&u.grp.startsWith('e0_')&&this.managed(main))s=main;
      const raid=source?.residentHome!=null?W.sites.find(s=>s.i===source.residentHome):null;if(!s&&raid)s=raid;
      if(!s)continue;const people=raid?this.book(s).people.filter(p=>source.residentIds.includes(p.id)&&p.hp>0):this.fighters(s),p=people.find(p=>!used.has(p)&&(p.type===u.type||p.type==='chief'&&u.leader));if(!p)continue;used.add(p);
      changed=true;u.resident=p;u.residentSite=s;u.hp=u.max*clamp(p.hp/p.max,0,1);p.max=u.max;p.hp=u.hp;
      if(raid){u.residentRoamer=true;u.residentAwake=true;continue}
      const tower=u.grp.endsWith('_tower'),at=area.constrain(area.field(p),16);if(!tower){u.x=at.x;u.y=at.y}
      const old=b.groups[u.grp],id='resident_'+s.i+'_'+p.id,g=new BattleControl(id,u.team,{player:false,ally:u.team===0,foe:u.team!==0,post:true,resident:true,role:old.role,type:u.type,name:p.name,ax:u.x,ay:u.y});
      if(tower){old.post=true;u.residentHome={x:u.x,y:u.y}}else{u.grp=id;b.groups[id]=g;u.residentHome=area.field(p.home)}
      u.residentAwake=p.mode!=='sleep'||this.roused(s);u.residentHidden=!u.residentAwake;u.residentAlarm=null;
    }
    if(!changed)return;for(const id of Object.keys(b.groups))if(!b.units.some(u=>u.grp===id))delete b.groups[id];
    if(b.sides)for(const r of b.sides.records){const members=b.units.filter(u=>u.sourceArmy===r.force||armySource(u.sourceArmy)===r.owner||r.owner===P&&b.groups[u.grp]?.player);if(members.length)r.groups=[...new Set(members.map(u=>u.grp))]}
  }
  static local(u,e){if(!u.resident||u.residentRoamer)return true;const h=u.residentHome;return u.residentAwake&&u.residentAlarm!=null&&Math.hypot(e.x-h.x,e.y-h.y)<=SITE_LIFE.leash*B.world.scale}
  static battle(dt){if(!B?.world)return;const people=B.units.filter(u=>u.resident&&!u.residentRoamer&&u.hp>0&&!u.left),scale=B.world.scale;
    for(const u of people){const p=u.resident,h=u.residentHome,g=B.groups[u.grp];if(u.rout||g.resolve?.routed)continue;
      const foes=B.units.filter(e=>e.hp>0&&!e.left&&battleEnemy(u,e)),near=foes.find(e=>Math.hypot(e.x-u.x,e.y-u.y)<(u.residentAwake?SITE_LIFE.sight:12)*scale&&seenBy(u.team,e)&&!terrainBlocksView(u,e));
      if(u.hp<p.hp-.01||near){u.residentAwake=true;u.residentAlarm=B.t}
      if(u.residentAlarm==null){const shout=people.find(v=>v!==u&&v.team===u.team&&v.residentAlarm!=null&&Math.hypot(v.x-u.x,v.y-u.y)<SITE_LIFE.shout*scale);if(shout&&u.heardAt==null)u.heardAt=B.t+.8;if(u.heardAt!=null&&B.t>=u.heardAt)u.residentAlarm=B.t}
      if(!u.residentAwake){const shout=people.find(v=>v!==u&&v.team===u.team&&v.residentAlarm!=null&&Math.hypot(v.x-u.x,v.y-u.y)<SITE_LIFE.shout*scale);if(shout&&u.wakeAt==null)u.wakeAt=B.t+SITE_LIFE.wake+(p.id%3)*.3;
        if(u.wakeAt!=null&&B.t>=u.wakeAt){u.residentAwake=true;u.residentAlarm=B.t}}
      u.residentHidden=!u.residentAwake;if(!u.residentAwake){u.tgt=null;continue}
      if(u.residentThink>B.t)continue;u.residentThink=B.t+.5;
      if(g.id.endsWith('_tower'))continue;
      const e=foes.filter(e=>seenBy(u.team,e)&&this.local(u,e)&&Math.hypot(e.x-u.x,e.y-u.y)<SITE_LIFE.sight*scale).sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0];
      if(e){u.residentAlarm=B.t;if(u.s.range&&Math.hypot(e.x-u.x,e.y-u.y)<=u.s.range){g.hold();u.tgt=e}else g.attack(e,{run:true,individual:true})}
      else{u.tgt=null;if(g.hasTarget||Math.hypot(u.x-h.x,u.y-h.y)>8*scale)g.moveTo(h.x,h.y);else g.toHold()}
    }
  }
  static finish(b,area){const touched=new Set();for(const u of b.units){if(!u.resident||u.waiting)continue;const p=u.resident,q=area.world(u);p.hp=Math.max(0,u.left?u.hpLeft??u.hp:u.hp);p.max=u.max;p.x=q.x;p.y=q.y;p.mode=p.hp>0?'return':'dead';p.goal=null;p.waiting=0;touched.add(u.residentSite)}
    for(const s of touched){if(s instanceof Outpost&&G.enc?.ref!==s)s.guards=this.book(s).people.filter(p=>p.hp>0).length;
      if(s instanceof Encampment){const C=CampFolk.of.get(s);for(const r of this.book(s).people)if(r.hp<=0&&!r.counted){s.pop=Math.max(0,s.pop-1);r.counted=true}if(C)for(const p of C.ppl)if(p.resident){p.x=p.resident.x;p.y=p.resident.y;p.hid=p.resident.hp<=0;p.mode=null}}}
  }
  static raid(s){const book=this.book(s);if(!(s instanceof Lair)||s.cleared||book.raidDay===G.day||Clock.frac<ENCAMP.day.dawn||Clock.frac>=ENCAMP.day.work||this.inBattle(s))return;
    const people=this.fighters(s),party=people.filter(p=>p.role==='raider').slice(0,SITE_LIFE.raid);if(party.length<SITE_LIFE.raid||people.length-party.length<3)return;
    const C=this.centre(s),b=asParty({kind:s.bandKind,x:C.x,y:C.y+C.ry+10,list:party.map(p=>p.type),residentHome:s.i,residentEpoch:book.owner,residentIds:party.map(p=>p.id),returnAt:Clock.hours()+SITE_LIFE.raidHours,t:1,a:0,idle:false,cool:4,ld:null});
    for(const p of party)p.away=true;book.raidDay=G.day;bandits.push(b);
  }
  static returnRaid(b,sp,night){if(b.residentHome==null)return false;const s=W.sites.find(s=>s.i===b.residentHome);
    if(!s||s.cleared||this.book(s).owner!==b.residentEpoch){delete b.residentHome;return false}
    if(!night&&Clock.hours()<b.returnAt)return false;b.waylay=null;b.corpse=null;
    const dd=Math.hypot(b.x-s.x,b.y-s.y);if(dd>12){Router.travel(b,s,sp)||walk(b,s.x-b.x,s.y-b.y,Math.min(dd,sp));return true}
    this.settleRaid(s,b,true);if(b.picket)this.alarm(s);else if(s.addHoard)s.addHoard();bandits=bandits.filter(o=>o!==b);return true;
  }
  static settleRaid(s,b,returned=false){const counts=countsOf(b&&!b.gone?b.troops:[]),people=this.book(s).people.filter(p=>b.residentIds.includes(p.id));
    for(const p of people){if(p.hp<=0)continue;if(!(counts[p.type]>0)){p.hp=0;p.away=false;p.mode='dead';continue}counts[p.type]--;
      if(returned){const C=this.centre(s);p.away=false;p.x=C.x+(p.id%3-1)*6;p.y=C.y+4;p.mode='rest';p.goal=null}}
  }
  static hour(){for(const s of W.sites||[]){if(!s.residents||this.inBattle(s))continue;
    const raids=bandits.filter(b=>b.residentHome===s.i);for(const b of raids)this.settleRaid(s,b);
    for(const p of s.residents.people){if(p.away&&!raids.some(b=>b.residentIds.includes(p.id))){p.hp=0;p.away=false;p.mode='dead'}if(p.hp>0&&!p.away)p.hp=Math.min(p.max,p.hp+p.max*SITE_LIFE.heal)}
    this.found(s);this.grow(s);this.raid(s)}}
  // (a hideout's stash found bare (Hideout atStash: taken unseen): by day, LAIR_HOARD.find hours on at the earliest, the camp roused)
  static found(s){const b=s.residents,t=b.robbed;if(t==null||Clock.hours()-t<LAIR_HOARD.find||Clock.frac<ENCAMP.day.dawn||Clock.frac>=ENCAMP.day.dusk)return;
    delete b.robbed;this.alarm(s);if(Math.hypot(P.x-s.x,P.y-s.y)<LAIR_HOARD.near)log('A cry goes up at the '+s.name+': their stash is found bare. The camp is roused.','bad')}
  // (a bandit camp or a hideout short of what it holds (its losses, the days' growth: sites.js lifeTarget) takes in one more a day: its
  //  band's man (bandMan) by its seed and the day, at its fire)
  static grow(s){const b=s.residents;if(!s.life||s.cleared||!b||b.owner!==this.epoch(s)||b.grewDay===G.day)return;b.grewDay=G.day;
    if(b.people.filter(p=>p.hp>0).length>=s.lifeTarget())return;const R=seeded((s.seed||1)*991+G.day*7),C=this.centre(s);
    this.person(s,bandMan(s.bandKind,R(),R()),'raider',C.x+(R()-.5)*C.rx,C.y+(R()-.5)*C.ry);if(s.strengthen)s.strengthen()}
}
Systems.add({name:'site residents',order:{frame:147.5,hour:45.5},frame:d=>SiteLife.frame(d),hour:()=>SiteLife.hour()});
onWorld(()=>{SiteLife.active.clear();SiteLife.forces=new WeakMap();SiteLife.timer=0});
