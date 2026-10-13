'use strict';
/* ---------- battle ---------- */
const GRPS=['hero','inf','arc','cav'],GN={hero:'Hero',inf:'Infantry',arc:'Archers',cav:'Cavalry',all:'All troops'};
// the manual control of your hero (WASD, Space, F, B, skill slots) is set aside for now: you command, your hero fights on their
// own (RTS command, below). true brings it back here (its keys and buttons are commented out in input.js and Ashmark.html)
let MANUAL_HERO=false;
const grpOf=s=>s.range?'arc':s.charge?'cav':'inf';
const grpUnits=g=>B.units.filter(u=>u.grp===g&&u.hp>0);
// what you have selected: all, one group, or several (a box round them)
const selGroups=()=>B.sel==='all'?GRPS:Array.isArray(B.sel)?B.sel:[B.sel];
const selLabel=()=>B.sel==='all'?GN.all:selGroups().map(g=>GN[g]).join(' and ');
function regroup(g){const m=grpUnits(g),gr=B.groups[g];if(!m.length)return;gr.ax=m.reduce((a,u)=>a+u.x,0)/m.length;gr.ay=m.reduce((a,u)=>a+u.y,0)/m.length}
/* how a group of yours moves and fights, besides its order (hold, follow, charge, advance; halt and withdraw are holds):
   walk (at its slowest member's pace, keeping formation; no running charge), firm (holds its ground: strikes only what
   comes into reach, never steps out of line), fire (archers shoot at will; off, only at the enemy you set them on),
   skirmish (archers step back from enemies coming at them), queue (waypoints, Shift + right-click, taken in turn) */
const GRP_FLAGS={walk:false,firm:false,fire:true,skirmish:false};
const MARCH={reached:10,skirmish:44,edge:40};
function updateGroups(dt){
  const h=B.hero;
  for(const g of GRPS){
    const gr=B.groups[g],m=grpUnits(g);
    if(m.length){gr.pace=Math.min(...m.map(u=>u.s.spd));// (walking: the slowest sets the pace)
      // the next waypoint once they are there
      if(gr.queue&&gr.queue.length&&gr.order==='hold'){const cx=m.reduce((a,u)=>a+u.x-u.sx,0)/m.length,cy=m.reduce((a,u)=>a+u.y-u.sy,0)/m.length;
        if(Math.hypot(cx-gr.ax,cy-gr.ay)<MARCH.reached){const w=gr.queue.shift();gr.ax=w.x;gr.ay=w.y}}}
    if(gr.order==='follow'&&h&&h.hp>0&&g!=='hero'){gr.ax=h.x-(g==='arc'?40:22);gr.ay=h.y}
    else if(gr.order==='advance'&&!B.auto){
      let nd=1e9;for(const e of B.units)if(e.team===1&&e.hp>0)nd=Math.min(nd,Math.hypot(e.x-gr.ax,e.y-gr.ay));
      if(nd>(g==='arc'?85:40)&&gr.ax<BW-40)gr.ax+=22*dt;
    }
  }
}
function formation(list,team){
  const dir=team?-1:1,base=team?BW-72:72,out=[];// (each side starts at its edge of the field)
  const front=[],back=[],flank=[];list.forEach(t=>{(ST[t].range?back:ST[t].charge?flank:front).push(t)});
  const lay=(arr,x0)=>{const per=8;arr.forEach((t,i)=>{const col=Math.floor(i/per),row=i%per,rows=Math.min(per,arr.length-col*per),gap=Math.min(20,(BH-60)/Math.max(rows,1));out.push({t,x:x0-dir*col*13,y:BH/2+(row-(rows-1)/2)*gap})})};
  lay(front,base+dir*32);lay(back,base-dir*8);
  flank.forEach((t,i)=>{const up=i%2===0;out.push({t,x:base+dir*10-dir*Math.floor(i/2)*12,y:up?40+Math.floor(i/2)*12:BH-34-Math.floor(i/2)*12})});
  return out;
}
// the ground under the player decides the battle's look and its one rule
function battleEnv(tourney){
  if(tourney)return{c:'grass',t:T_OPEN,name:'Tournament ground',text:'An open field with no tricks.'};
  const r=regionAt(P.x,P.y),t=r.t===T_MOUNT||r.t===T_WATER?T_HILL:r.t,c=r.c;
  const text=t===T_FOREST?'Trees block movement and stop some arrows. Elves shoot through them.':t===T_HILL?'High ground: archers reach 15% farther.'
    :c==='frost'?'Snow slows everyone but dwarves and wolves.':c==='desert'?'The heat slows melee attacks, except for orcs and scorpions.':c==='swamp'?'Mud slows everyone and stalls cavalry charges. Orcs wade through.':'Open ground: cavalry rides 15% faster.';
  return{c,t,name:r.name,text};
}
function envStats(s,race,env){
  if(s.big)return s;const o={...s},home=race?RACES[race].home:s.home||[],c=env.c,t=env.t;
  if(t===T_FOREST||t===T_HILL){if(t===T_HILL&&s.range)o.range*=1.15}
  else if(c==='frost'&&!home.includes('frost'))o.spd*=.85;
  else if(c==='desert'&&!s.range&&!home.includes('desert'))o.cd*=1.1;
  else if(c==='swamp'&&!home.includes('swamp'))o.spd*=s.charge?.65:.8;
  else if(c==='grass'&&s.charge)o.spd*=1.15;
  return o;
}
function placeObstacles(env){
  const obs=[],c=env.c,list=env.t===T_FOREST?Array(12).fill('tree'):env.t===T_HILL?Array(6).fill('rock'):c==='desert'?['cactus','cactus','cactus','cactus','rock','rock']
    :c==='swamp'?Array(5).fill('tree'):c==='frost'?['tree','tree','rock','rock']:['tree','tree','rock'];
  // (as many again for each screen's worth of field: the larger field keeps its look)
  const many=Math.round(BW*BH/(VW*VH));for(const kind of Array(many).fill(list).flat())for(let k=0;k<30;k++){const x=rint(110,BW-110),y=rint(34,BH-22);if(obs.every(o=>Math.hypot(o.x-x,o.y-y)>26)){obs.push({kind,x,y,r:kind==='rock'?7:kind==='cactus'?5:6});break}}
  return obs;
}
function startBattle(opts){
  const units=[];let id=0;const env=battleEnv(opts.tournament);
  const lv=opts.lv||1,mk=(type,team,x,y,hero)=>{let s=envStats(hero?heroStats():P.comps[type]&&team===0?compStats(type):ST[type],hero?P.race:ST[type].race,env);if(team===1&&lv>1)s={...s,hp:Math.round(s.hp*(1+.2*(lv-1))),dmg:s.dmg*(1+.12*(lv-1))};if(team===0&&s.charge&&G.enc&&G.enc.kind==='siege'&&wallOf(G.enc.ref)>0)s={...s,dmg:s.dmg*.7,charge:false};// riders at the walls
    if(team===0&&!hero&&(tm('tHp')||tm('tDmg')))s={...s,hp:Math.round(s.hp*(1+tm('tHp'))),dmg:s.dmg*(1+tm('tDmg'))};return{id:id++,v:Math.floor(Math.random()*6),type,team,x,y,hp:s.hp,max:s.hp,cd:Math.random()*.6,hero:!!hero,face:team?-1:1,s,spdNow:0,tgt:null,rt:0,swing:0}};
  const hero=mk('hero',0,72+44,BH/2,true);hero.cd=0;vitals();hero.hp=Math.max(1,Math.round(P.hp));units.push(hero);
  if(!opts.tournament)compsInBand().forEach((id,i)=>{const u=mk(id,0,hero.x-14,BH/2+(i%2?1:-1)*(16+Math.floor(i/2)*14));u.comp=true;units.push(u)});
  if(!opts.tournament){const l=[];for(const k in P.troops)for(let i=0;i<P.troops[k];i++)l.push(k);formation(l,0).forEach(f=>units.push(mk(f.t,0,f.x,f.y)))}
  formation(opts.enemies,1).forEach(f=>units.push(mk(f.t,1,f.x,f.y)));
  // reinforcing lords arrive behind each line, a little apart
  const enc=!opts.tournament&&G.enc,side=(ls,team)=>(ls||[]).forEach((l,li)=>formation(l.troops.slice(),team).forEach(f=>{const u=mk(f.t,team,clamp(f.x+(team?36:-36)+li*(team?10:-10),12,BW-12),clamp(f.y+(li?18:-18),26,BH-8));u.lord=l;units.push(u)}));
  if(enc){side(enc.allies,0);side(enc.foes,1)}
  // the leaders fight at the head of their men (captives.js): a camp's chieftain is the one already in its ranks
  if(enc)for(const L of battleLeaders(enc)){let u=L.type==='chief'&&L.team===1&&units.find(x=>x.team===1&&x.type==='chief'&&!x.leader);
    if(!u){u=mk(L.type,L.team,L.team?BW-96:96,BH/2+(L.team?0:30));units.push(u)}u.s=leaderStats(u.s,L.lv);u.hp=u.max=u.s.hp;u.leader=L}
  // (each holds where it stands until you order otherwise, or hand the army to the AI: deploy.js)
  const groups={hero:{order:'hold',spread:false,ax:0,ay:0},inf:{order:'hold',spread:false,ax:0,ay:0},arc:{order:'hold',spread:false,ax:0,ay:0},cav:{order:'hold',spread:false,ax:0,ay:0}};
  for(const g in groups)Object.assign(groups[g],GRP_FLAGS,{queue:[],form:'line',face:0,files:null});
  units.forEach(u=>{if(u.team===0&&!u.hero&&!u.lord&&!u.leader)u.grp=grpOf(u.s)});hero.grp='hero';// (you lead your own group, and fight on your own)
  for(const g of GRPS){const m=units.filter(u=>u.grp===g);if(!m.length)continue;const gr=groups[g];
    gr.ax=m.reduce((a,u)=>a+u.x,0)/m.length;gr.ay=m.reduce((a,u)=>a+u.y,0)/m.length;m.forEach(u=>{u.sx=u.x-gr.ax;u.sy=u.y-gr.ay})}
  foeGroupsInit(units,groups,opts);// the enemy army's groups, under their captain (commander.js)
  B={units,hero,groups,env,arena:arenaFor(env.c),obs:opts.tournament?[]:placeObstacles(env),sel:'all',rings:[],arrows:[],parts:[],floats:[],slashes:[],corpses:[],aim:0,blocking:false,touchBlock:false,mt:null,over:false,endT:0,kills:0,slain:[],lost:{},heroDown:false,opts,t:0};
  B.speed=BSPEED.v;B.paused=false;// (each battle starts at the speed set in Settings)
  for(const g of GRPS)if(g!=='hero')layForm(g);// (into line: formations.js)
  moraleInit(units,opts);// (each soldier's morale: morale.js)
  camInit();// (the field seen whole; zoom and pan: camera.js)
  deployInit(opts);// (deployment, and who commands your army: deploy.js)
  G.mode='battle';hidePanel();bbar.hidden=false;buildSlotBar();setOrderUI();battleSpeedUI();autoUI();updateHint();
  log(opts.tournament?'The crowd roars. Defeat the champion.':'The lines meet in the '+env.name.toLowerCase()+'. '+env.text);
}
const nearest=u=>{let best=null,bd=1e9;for(const e of B.units){if(e.hp<=0||e.team===u.team)continue;const d=((e.x-u.x)**2+(e.y-u.y)**2)*(e.rout?9:1);if(d<bd){bd=d;best=e}}return best};
function fx(x,y,c,n){for(let i=0;i<n;i++)B.parts.push({x,y,vx:(Math.random()-.5)*70,vy:(Math.random()-.5)*70,life:.35,c})}
function applyDmg(t,amt,m){
  if(t.hero&&B.hx&&B.hx.inv>0){B.floats.push({x:t.x,y:t.y-16,t:'Dodge',life:.4,c:'#cfe0ff'});return}
  if(t.hero)amt*=1-tm('dr');
  if(t.wardT>0)amt*=.75;
  if(t.comp&&t.s.block)amt*=1-t.s.block;// a companion's shield and armour
  amt=Math.max(1,Math.round(amt));t.hp-=amt;t.flash=.1;t.hitAt=B.t;moraleHurt(t,amt);
  B.floats.push({x:t.x,y:t.y-14,t:String(amt),life:.7,c:m>=1.25?'#ffb04a':m&&m<=.8?'#9aa3ad':t.team?'#ffe08a':'#ff9a90'});
  for(let i=0;i<3;i++)B.parts.push({x:t.x,y:t.y-6,vx:(Math.random()-.5)*60,vy:-Math.random()*40,life:.4,c:'#a8322e'});
  if(t.hp<=0){
    t.hp=0;B.corpses.push({x:t.x,y:t.y,team:t.team,face:t.face,hero:t.hero});moraleDeath(t);
    if(t.team===1){B.kills++;B.slain.push(t.type)}
    else if(t.hero){B.heroDown=true;B.floats.push({x:t.x,y:t.y-22,t:'You are down!',life:1.6,c:'#fff'});log('You are knocked down. Your troops fight on.','bad')}
    else if(t.comp){const c=compInit(t.type);if(c)c.hurt=Math.max(c.hurt||0,G.day+2);log(COMPS[t.type].n+' is wounded and drops out of the fight: out for 2 days.','bad')}// (never killed)
    else if(!t.lord)B.lost[t.type]=(B.lost[t.type]||0)+1;
    if(t.lord&&!t.leader){partyRemove(t.lord,t.type,1)}
    if(t.grp){if(B.sel===t.grp&&!grpUnits(t.grp).length)B.sel='all';setOrderUI()}
    shakeIt(2);
  }
}
function shakeIt(n){G.shake=Math.max(G.shake,n)}
// one of your troops (not your hero, a companion or a lord's man) earns XP for a blow: the damage it dealt, and a kill by the foe's tier
function earnXp(u,t,was){if(!u||u.team!==0||u.hero||u.comp||u.lord||u.leader||!t||t.team===0)return;const dealt=Math.max(0,was-Math.max(0,t.hp));
  u.xp=(u.xp||0)+dealt*TROOP_XP.dmg+(was>0&&t.hp<=0?TROOP_XP.kill*(ST[t.type]&&ST[t.type].tier||1):0)}
function hit(att,t,dm){
  const m=matchup(att.s,t.s);dm*=m*(att.buffT>0?1.3:1);if(att.comp)compTrain(att.type,compMeleeSk(att.type),2);
  if(t.hero&&B.blocking){const a=Math.atan2(att.y-t.y,att.x-t.x),df=Math.abs(Math.atan2(Math.sin(a-B.aim),Math.cos(a-B.aim)));if(df<1.25&&guard(dm)){dm*=blockMul();fx(t.x+Math.cos(B.aim)*10,t.y-6,'#cfe0ff',5);B.floats.push({x:t.x,y:t.y-14,t:'Block',life:.5,c:'#9fc0ff'})}}
  const was=t.hp;applyDmg(t,dm*formTaken(t,att)*flankMul(t,att),m);earnXp(att,t,was);// (its formation: formations.js; the side it is hit on: morale.js)
}
// arrows and bolts: src is the shooter's stats (its class, tags and bolt colour)
// Bow arrows (and thrown spears, sling stones, webs) fly in an arc: launched at a spot dist away, they rise, peak halfway and come
// down there. The arc grows with the square of the distance: point-blank shots fly almost flat, long ones lob high.
// An arrow hits whatever it passes while it is low (under 9 high), so a lob sails over the middle of the field.
// Crossbow bolts (flat) and magic bolts fly straight.
// Every arcing arrow is a real throw: height z, rising speed vz and gravity g. An aimed shot picks vz and g so it lands dist away
// (opts.speed sets how fast it travels); a manual bow shot (opts.v, opts.ang) is launched at a speed and an angle and lands where physics says.
const ARC_SPEED=100,BOLT_SPEED=190,MAGIC_SPEED=125,ARROW_G=260;
function fireBolt(u,a,dmg,src,dist,opts){
  const mag=!!src.magic,base={by:u,team:u.team,dmg,a,src,elf:src.race==='elf',web:src.ability==='web',tk:0};
  if(!mag&&!src.flat){
    if(opts&&opts.v){const gv=opts.v*Math.cos(opts.ang);B.arrows.push({...base,x:u.x,y:u.y,vx:Math.cos(a)*gv,vy:Math.sin(a)*gv,z:0,vz:opts.v*Math.sin(opts.ang),g:ARROW_G,t:0,life:9,arc:true});return}
    const d0=clamp(dist||120,24,300),sp=opts&&opts.speed||ARC_SPEED*(.8+d0/250),sc=src.race==='elf'?.03:.06,d=d0*(opts&&opts.exact?1:1-sc+Math.random()*sc*2),T=d/sp,H=Math.min(44,d*d/700);
    B.arrows.push({...base,x:u.x,y:u.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,z:0,vz:4*H/T,g:8*H/T/T,T,H,t:0,life:9,arc:true});return}
  const v=mag?MAGIC_SPEED:BOLT_SPEED;
  B.arrows.push({...base,x:u.x,y:u.y-6,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:mag?1.4:1.1,magic:mag,col:src.bolt||'#c58af0'});
}
const arcZ=a=>a.z||0;
// where a bow shot of speed v at angle ang comes down
const arrowRange=(v,ang)=>v*v*Math.sin(2*ang)/ARROW_G;
// one step of an arcing arrow: trees catch it only low, it hits on the way down, a miss sticks in the ground
function arcStep(a,dt){
  a.t+=dt;a.x+=a.vx*dt;a.y+=a.vy*dt;a.z+=a.vz*dt;a.vz-=a.g*dt;const z=Math.max(0,a.z);
  if(z<10&&!a.elf)for(let k=0;k<B.obs.length;k++){const o=B.obs[k];if(o.kind==='tree'&&!(a.tk&1<<k)&&Math.hypot(a.x-o.x,a.y-o.y)<o.r+2){a.tk|=1<<k;if(Math.random()<.35){a.life=0;fx(a.x,a.y-z-4,'#8b5a2b',2);return}}}
  if(z<9)for(const e of B.units){if(e.hp<=0||e.team===a.team)continue;if(Math.abs(e.x-a.x)<(e.s.big?14:6)&&Math.abs(e.y-a.y)<(e.s.big?10:5)){
    const mu=matchup(a.src||{},e.s);let dm=a.dmg*mu;
    if(e.hero&&B.blocking){const df=Math.abs(Math.atan2(Math.sin(a.a+Math.PI-B.aim),Math.cos(a.a+Math.PI-B.aim)));if(df<1.25&&guard(dm)){dm*=blockMul();fx(a.x,a.y-6,'#cfe0ff',4)}}
    if(a.web){e.slow=2;B.floats.push({x:e.x,y:e.y-20,t:'Webbed',life:.6,c:'#e4e0cf'})}if(a.src&&a.src.heroShot)train('archery',1.5);{const O={x:a.x-a.vx,y:a.y-a.vy,arrow:!a.magic},was=e.hp;applyDmg(e,dm*formTaken(e,O)*flankMul(e,O),mu);earnXp(a.by,e,was)}a.life=0;return}}
  if(a.z<=0&&a.t>.03){a.life=0;B.parts.push({x:a.x,y:a.y-1,vx:0,vy:0,life:1.2,c:'#c9b48a',stuck:a.vx>=0?1:-1})}
}
// a quiver per battle: bows 16, crossbows 12, slings 20, javelins 6; casters and beasts never run out.
// When it is empty the unit draws a blade: melee reach, weaker blows.
const quiverOf=s=>s.magic||s.beast||s.big?Infinity:s.ammo||(s.flat?12:s.bow?16:20);
function outOfAmmo(u){u.s={...u.s,range:0,reach:Math.max(u.s.reach||0,10),dmg:u.s.dmg*.6};u.empty=true;B.floats.push({x:u.x,y:u.y-20,t:'Out of ammo',life:.7,c:'#9aa3ad'})}
function attack(u,t){
  const s=u.s;u.cd=s.cd*(.9+Math.random()*.2);u.atkAt=B.t;
  if(s.range){const flat=s.magic||s.flat;fireBolt(u,Math.atan2(t.y-(flat?u.y-6:u.y),t.x-u.x)+(Math.random()-.5)*(flat?.2:s.race==='elf'?.04:.08),s.dmg*(.85+Math.random()*.3)*(u.buffT>0?1.3:1),s,Math.hypot(t.x-u.x,t.y-u.y))}
  else{let dm=s.dmg*(.8+Math.random()*.4)*chargeMul(u,t);// (a charge: by how far it ran, morale.js)
    hit(u,t,dm);meleeFollow(u,t,dm)}
  if(s.range&&!u.hero){if(u.ammo==null)u.ammo=quiverOf(s);if(--u.ammo<=0)outOfAmmo(u)}
}
// a troop's melee blow: the look of its weapon, and what it does beyond the one it hits
function meleeFollow(u,t,dm){
  const s=u.s,a=Math.atan2(t.y-u.y,t.x-u.x),R=(s.reach||11)+2;u.face=Math.cos(a)>=0?1:-1;u.atkN=(u.atkN||0)+1;
  if(s.beast){B.slashes.push({kind:'claw',x:t.x,y:t.y-8,a,life:.18,max:.18,col:'255,255,255',w:1});return}
  const style=troopStyle(u);u.atkStyle=style;
  if(style==='thrust'){B.slashes.push({kind:'thrust',x:u.x,y:u.y-6,a,life:.14,max:.14,r:R+4,w:1,col:'230,236,255',wid:3});
    const b=B.units.find(o=>o!==t&&o.hp>0&&o.team===t.team&&inShape(u.x,u.y,a,R+14,{shape:'thrust',wid:5},o));if(b)hit(u,b,dm*.5)}
  else{B.slashes.push({kind:style==='overhead'?'slam':'arc',x:u.x,y:u.y-6,a,life:.14,max:.14,arc:.8,r:R,w:1,dir:u.atkN%2?1:-1,area:7,col:'255,255,255'});
    if(s.big||style==='overhead'){const b=B.units.find(o=>o!==t&&o.hp>0&&o.team===t.team&&Math.hypot(o.x-t.x,o.y-t.y)<12);if(b)hit(u,b,dm*.5)}}
}
// spears thrust; chieftains, trolls and the heaviest hitters come down from above; the rest swing, with now and then an overhead blow
const troopStyle=u=>unitClass(u.s)==='spear'?'thrust':u.type==='chief'||u.s.big||u.s.dmg>=14?'overhead':(u.atkN%3===0?'overhead':'swing');
function breathe(u,t){
  const a=Math.atan2(t.y-u.y,t.x-u.x),ox=u.x+Math.cos(a)*14,oy=u.y-10;u.face=Math.cos(a)>=0?1:-1;u.atkAt=B.t;
  for(const e of B.units){if(e.hp<=0||e.team===u.team)continue;const ea=Math.atan2(e.y-u.y,e.x-u.x),df=Math.abs(Math.atan2(Math.sin(ea-a),Math.cos(ea-a)));
    if(df<.5&&Math.hypot(e.x-u.x,e.y-u.y)<95)hit(u,e,14*(.8+Math.random()*.4)*(tagsOf(e.s).includes('ward')?.6:1))}
  for(let i=0;i<34;i++){const j=a+(Math.random()-.5)*.9,v=70+Math.random()*90;B.parts.push({x:ox,y:oy,vx:Math.cos(j)*v,vy:Math.sin(j)*v-20,life:.5,c:Math.random()<.5?'#ff7a30':'#ffd24a'})}
  B.floats.push({x:u.x,y:u.y-30,t:'FIRE',life:.6,c:'#ff9a50'});shakeIt(3);
}
function monsterAbility(u,dt){
  const ab=u.s.ability;
  if(ab==='regen')u.hp=Math.min(u.max,u.hp+4*dt);
  else if(ab==='pounce'){u.ab=(u.ab??1.5)-dt;if(u.ab>0)return;const t=nearest(u);if(!t)return;const d=Math.hypot(t.x-u.x,t.y-u.y);if(d<24||d>110)return;
    const a=Math.atan2(t.y-u.y,t.x-u.x);fx(u.x,u.y-6,'#e8d8a0',6);u.x=t.x-Math.cos(a)*10;u.y=t.y-Math.sin(a)*10;u.face=Math.cos(a)>=0?1:-1;
    hit(u,t,u.s.dmg*1.6);B.floats.push({x:u.x,y:u.y-20,t:'POUNCE',life:.6,c:'#ffb070'});u.ab=4.5}
}
// strike: how it hits (your hero: combos, the bow and casts, heroai.js); else a troop's attack
function aiUnit(u,dt,strike){
  if(u.stun>0){u.stun-=dt;u.spdNow=0;return}
  if(u.rout)return routStep(u,dt);// (broken: it runs for its edge, morale.js)
  if(withdrawing(u))return withdrawStep(u,dt);// (withdrawn: it leaves the field, morale.js)
  u.inSlot=false;
  // its target: the enemy its group was set on (right-click), else the nearest
  const s=u.s,g=u.grp&&B.groups[u.grp];if(g&&g.tgt&&g.tgt.hp<=0)g.tgt=null;u.rt-=dt;if(g&&g.tgt)u.tgt=g.tgt;else if(u.rt<=0||!u.tgt||u.tgt.hp<=0){u.tgt=nearest(u);u.rt=.4}
  const t=u.tgt;u.spdNow=0;
  const order=g?(g.tgt||u.grp==='hero'&&g.order==='follow'?'charge':g.order):'charge';// (your hero has no one to follow: fights)
  if(!t&&!(g&&order!=='charge'))return;
  const dx=t?t.x-u.x:0,dy=t?t.y-u.y:0,d=Math.hypot(dx,dy)||1,de=t?d-(t.s.big&&!s.range?12:0):1e9;
  const reach=s.range?s.range:s.reach+2;let mv=false,mx=0,my=0,chase=false,back=false;
  if(g&&order!=='charge'){
    // keep a slot in the group's formation; melee breaks off only for enemies that come close to it (never, holding its
    // ground or withdrawing: it strikes only what is in reach)
    const k=order==='follow'?.7:1,sx=clamp(g.ax+u.sx*k,8,BW-8),sy=clamp(g.ay+u.sy*k,18,BH-6);
    const engage=order==='withdraw'||g.firm||FORMS[g.form]&&FORMS[g.form].firm?0:order==='follow'?55:28;
    if(t&&!s.range&&de<=reach){}
    else if(t&&!s.range&&engage&&Math.hypot(t.x-sx,t.y-sy)<engage){mv=true;mx=dx/d;my=dy/d;chase=true}
    else if(t&&s.range&&g.skirmish&&!t.s.range&&d<MARCH.skirmish){mv=true;mx=-dx/d;my=-dy/d;chase=true;back=true}// (skirmishers step back)
    else{const px=sx-u.x,py=sy-u.y,pd=Math.hypot(px,py);if(pd>2){mv=true;mx=px/pd;my=py/pd}else u.inSlot=true}// (in its slot: it faces the formation's way)
  }else{
    if(s.range){if(d>s.range*.85){mv=true;mx=dx/d;my=dy/d}else if(d<28){mv=true;mx=-dx/d;my=-dy/d;back=true}}
    else if(de>reach){mv=true;mx=dx/d;my=dy/d}
    chase=true;
  }
  // walking, they keep to the slowest one's pace (and keep their formation); running, or fighting, each goes as fast as it can
  let spd=g&&g.walk&&!chase?Math.min(s.spd,g.pace||s.spd):s.spd;if(g&&(!chase||g.form==='wall'))spd*=formPace(g);// (a column marches faster, a shield wall is slow)
  if(mv){const sp=spd*dt*(u.slow>0?.5:1)*(u.buffT>0?1.25:1);u.x+=mx*sp;u.y+=my*sp;u.spdNow=spd;u.face=mx>=0?1:-1;u.dir=back&&t?Math.atan2(dy,dx):Math.atan2(my,mx);u.run=chase&&!back?(u.run||0)+sp:0}
  else{if(t){u.face=dx>=0?1:-1;if(!u.inSlot)u.dir=Math.atan2(dy,dx)}u.run=Math.max(0,(u.run||0)-CHARGE.run*dt)}
  // (facing: where it marches or whom it fights; momentum: the run at its target, spent on its first blow)
  // archers with fire at will off shoot only at the enemy you set them on
  if(t&&u.cd<=0&&de<=reach+(s.range?0:1)&&!(s.range&&g&&g.fire===false&&!g.tgt))(strike||attack)(u,t);
}
/* RTS command, as in Total War: select your units (click one for its group, drag a box round several; 1-4 a group, 5 all),
   then right-click the ground to send them there in formation, or an enemy to set them on it. Z X C V give the old orders. */
const RTS_PICK=10;
function rtsUnitAt(x,y,team){let best=null,bd=RTS_PICK;for(const u of B.units){if(u.hp<=0||u.team!==team)continue;const d=Math.hypot(u.x-x,u.y-6-y);if(d<bd){bd=d;best=u}}return best}
// select: a click picks the group of the unit under it (nothing under it: all); a box picks every group with a unit inside
function rtsSelect(x0,y0,x1,y1,add){
  const was=add?selGroups():[];
  if(Math.hypot(x1-x0,y1-y0)<5){const u=rtsUnitAt(x1,y1,0);B.sel=u&&u.grp?u.grp:add?B.sel:'all'}
  else{const xa=Math.min(x0,x1),xb=Math.max(x0,x1),ya=Math.min(y0,y1),yb=Math.max(y0,y1),gs=GRPS.filter(g=>grpUnits(g).some(u=>u.x>=xa&&u.x<=xb&&u.y-6>=ya&&u.y-6<=yb));
    B.sel=!gs.length?B.sel:gs.length===1?gs[0]:gs.length===GRPS.filter(g=>grpUnits(g).length).length?'all':gs}
  if(add&&B.sel!=='all'){const all=[...new Set([...was,...selGroups()])].filter(g=>grpUnits(g).length);B.sel=all.length>=GRPS.filter(g=>grpUnits(g).length).length?'all':all.length===1?all[0]:all}// (Shift: added to what you had)
  setOrderUI();
}
// right-click: on an enemy, the selected set on it; on the ground, sent there keeping their places relative to one another
// (opt.queue: Shift, a waypoint after the ones they have; opt.run: a double right-click, at a run)
function rtsOrder(x,y,opt){
  opt=opt||{};const gs=selGroups().filter(g=>grpUnits(g).length);if(!gs.length)return;takeCommand();
  if(B.deploy){const p=inZone(x,y);x=p.x;y=p.y;opt={}}// (deploying: a spot in your zone, no enemy to set them on)
  const e=B.deploy?null:rtsUnitAt(x,y,1);
  if(opt.run)gs.forEach(g=>B.groups[g].walk=false);
  if(!e&&opt.queue){// a waypoint after their last, the groups keeping their places relative to one another
    gs.forEach(g=>{const gr=B.groups[g];if(gr.order!=='hold'){regroup(g);gr.order='hold';gr.tgt=null}});
    const last=g=>{const gr=B.groups[g];return gr.queue.length?gr.queue[gr.queue.length-1]:{x:gr.ax,y:gr.ay}},cx=gs.reduce((a,g)=>a+last(g).x,0)/gs.length,cy=gs.reduce((a,g)=>a+last(g).y,0)/gs.length;
    gs.forEach(g=>{const l=last(g);B.groups[g].queue.push({x:clamp(x+l.x-cx,8,BW-8),y:clamp(y+l.y-cy,18,BH-6)})});B.mark={x,y,t:.7,foe:false};setOrderUI();return}
  gs.forEach(g=>B.groups[g].queue=[]);
  if(e){gs.forEach(g=>{breakWall(g);B.groups[g].tgt=e;B.groups[g].order='charge'});log(selLabel()+': attack the '+(e.leader?e.leader.name:ST[e.type]?ST[e.type].n.toLowerCase():'enemy')+'.')}
  else{gs.forEach(regroup);const cx=gs.reduce((a,g)=>a+B.groups[g].ax,0)/gs.length,cy=gs.reduce((a,g)=>a+B.groups[g].ay,0)/gs.length;
    gs.forEach(g=>{const gr=B.groups[g];gr.tgt=null;gr.order='hold';const nx=clamp(x+gr.ax-cx,8,BW-8),ny=clamp(y+gr.ay-cy,18,BH-6);faceToward(g,nx,ny);gr.ax=nx;gr.ay=ny})}
  if(B.deploy)deploySnap(gs);
  B.mark={x,y,t:.7,foe:!!e};setOrderUI();
}
/* the manual control of your hero, set aside for now (RTS command above): WASD, Space, F, B, the skill slots (input.js) */
function updateHero(dt){
  const h=B.hero;B.blocking=!!(G.keys.b||B.touchBlock);
  if(!h||h.hp<=0){B.blocking=false;return}
  h.cd-=dt;h.swing=Math.max(0,h.swing-dt);h.spdNow=0;
  if(heroActions(dt))return;
  const k=G.keys;let dx=(k.d||k.arrowright?1:0)-(k.a||k.arrowleft?1:0),dy=(k.s||k.arrowdown?1:0)-(k.w||k.arrowup?1:0);
  if(dx||dy)B.mt=null;else if(B.mt){const ex=B.mt.x-h.x,ey=B.mt.y-h.y,ed=Math.hypot(ex,ey);if(ed<3)B.mt=null;else{dx=ex/ed;dy=ey/ed}}
  const l=Math.hypot(dx,dy);
  const X=heroState(),run=l>0&&G.keys.shift&&!B.blocking&&X.sp>0;if(run){X.sp=Math.max(0,X.sp-STAM.sprint*dt);X.spT=0}
  if(l>0){dx/=l;dy/=l;const sp=h.s.spd*(B.blocking?.55:1)*(B.draw?.6:1)*(run?SPRINT_MUL:1)*(h.slow>0?.5:1)*dt;h.x+=dx*sp;h.y+=dy*sp;h.face=dx>=0?1:-1;h.spdNow=h.s.spd;if(run)train('athl',dt*.4)}
  if(G.mouse.in&&G.mouse.type==='mouse')B.aim=Math.atan2(G.mouse.y-(h.y-6),G.mouse.x-h.x);
  else{const n=nearest(h);if(n)B.aim=Math.atan2(n.y-h.y,n.x-h.x)}
}
// rt is real time; fighting runs on dt, slowed by BATTLE_PACE, while effects keep real time
function updateBattle(rt){
  // the battle's speed: everything runs on its clock; paused, nothing moves but you can still give orders
  if(B.paused||B.deploy)return;rt*=B.speed||1;
  const dt=rt*BATTLE_PACE;B.t+=dt;
  // hit-stop: heavy blows freeze the fight for a moment while effects keep moving
  const frozen=B.hx&&B.hx.stop>0;if(frozen)B.hx.stop-=rt;
  if(!frozen&&!B.over){
    // (RTS command: your hero fights on their own, as every unit does; the manual control is set aside for now)
    if(MANUAL_HERO)updateHero(rt*HERO_PACE);else heroAuto(rt*HERO_PACE);updateGroups(dt);command(dt);updateFoeGroups(dt);// (your hero fights on their own: heroai.js; the enemy's captain: commander.js)
    for(const u of B.units){if(u.hp<=0)continue;if(u.kx||u.ky){u.x+=u.kx*dt;u.y+=u.ky*dt;const k=Math.pow(.004,dt);u.kx*=k;u.ky*=k;if(Math.abs(u.kx)+Math.abs(u.ky)<2)u.kx=u.ky=0}if(u.buffT>0)u.buffT-=dt;if(u.wardT>0)u.wardT-=dt}
    for(const u of B.units){if(u.hp<=0)continue;if(u.slow>0)u.slow-=dt;if(u.hero&&gm('regen'))u.hp=Math.min(u.max,u.hp+gm('regen')*dt)}
    // every unit's moment (lords, chieftains and companions fight as champions: commander.js)
    for(const u of B.units){if(u.hp<=0||u.hero)continue;u.cd-=dt;if(isFighter(u)&&!withdrawing(u)&&champThink(u,dt))continue;aiUnit(u,dt,isFighter(u)?champStrike:null);monsterAbility(u,dt);if(u.s.breath){u.br=(u.br??2.5)-dt;if(u.br<=0){const t=nearest(u);if(t&&Math.hypot(t.x-u.x,t.y-u.y)<90){breathe(u,t);u.br=3.5}}}}
    // (soldiers jostle apart; those running off the field, withdrawn or routed, slip through their own side)
    for(let i=0;i<B.units.length;i++){const a=B.units[i];if(a.hp<=0)continue;for(let j=i+1;j<B.units.length;j++){const b=B.units[j];if(b.hp<=0||a.team===b.team&&(a.rout||b.rout||withdrawing(a)||withdrawing(b)))continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);const R=a.s.big||b.s.big?18:8;if(d<R&&d>.01){const p=(R-d)*.5/d;if(!a.hero){a.x-=dx*p;a.y-=dy*p}if(!b.hero){b.x+=dx*p;b.y+=dy*p}}}}
    for(const u of B.units){if(u.hp<=0||u.s.big)continue;for(const o of B.obs){const dx=u.x-o.x,dy=u.y-o.y,dd=Math.hypot(dx,dy),r=o.r+3;if(dd<r&&dd>.01){u.x=o.x+dx/dd*r;u.y=o.y+dy/dd*r}}}
    for(const u of B.units){u.x=clamp(u.x,8,BW-8);u.y=clamp(u.y,18,BH-6)}
    for(const a of B.arrows){
      if(a.arc){arcStep(a,dt);continue}
      a.x+=a.vx*dt;a.y+=a.vy*dt;a.life-=dt;
      if(!a.elf&&!a.magic)for(let k=0;k<B.obs.length;k++){const o=B.obs[k];if(o.kind==='tree'&&!(a.tk&1<<k)&&Math.hypot(a.x-o.x,a.y-(o.y-6))<o.r+2){a.tk|=1<<k;if(Math.random()<.25){a.life=0;fx(a.x,a.y,'#8b5a2b',2)}}}
      if(a.life<=0)continue;
      for(const e of B.units){if(e.hp<=0||e.team===a.team)continue;if(Math.abs(e.x-a.x)<(e.s.big?14:6)&&Math.abs((e.y-(e.s.big?10:6))-a.y)<(e.s.big?11:7)){
        const mu=matchup(a.src||{},e.s);let dm=a.dmg*mu;if(e.hero&&B.blocking){const df=Math.abs(Math.atan2(Math.sin(a.a+Math.PI-B.aim),Math.cos(a.a+Math.PI-B.aim)));if(df<1.25&&guard(dm)){const bl=blockMul();dm*=a.magic?Math.max(.5,bl):bl;fx(a.x,a.y,'#cfe0ff',4)}}
        if(a.web){e.slow=2;B.floats.push({x:e.x,y:e.y-20,t:'Webbed',life:.6,c:'#e4e0cf'})}if(a.by&&a.by.comp)compTrain(a.by.type,'archery',1.5);{const O={x:a.x-a.vx,y:a.y-a.vy,arrow:!a.magic},was=e.hp;applyDmg(e,dm*formTaken(e,O)*flankMul(e,O),mu);earnXp(a.by,e,was)}a.life=0;
        if(a.magic){const sr=a.src&&a.src.splash||18,sm=a.src&&a.src.splashMul||.5;B.rings.push({x:a.x,y:a.y,r:sr,life:.25,max:.25,col:'210,170,255'});for(const o of B.units)if(o!==e&&o.hp>0&&o.team!==a.team&&Math.hypot(o.x-a.x,o.y-6-a.y)<sr)applyDmg(o,a.dmg*matchup(a.src||{},o.s)*sm,1)}
        break}}
    }
    B.arrows=B.arrows.filter(a=>a.life>0&&a.x>-4&&a.x<BW+4&&a.y>-4&&a.y<BH+4);
    moraleTick(dt);// (morale.js)
    const ap=B.units.filter(u=>u.team===0&&fighting(u)).length,ae=B.units.filter(u=>u.team===1&&fighting(u)).length;
    if(ae>0&&retreating())retreatNow();// (you withdrew: morale.js)
    else if(ae===0||ap===0){B.over=true;B.endT=1.1;B.win=ae===0;const run=B.units.some(u=>u.hp>0&&u.rout&&u.team===(B.win?1:0))||(B.win?B.fledFoes:B.fledMine);
      if(run){B.routed=B.win?1:0;log(B.win?'The enemy breaks and flees the field.':'Your men break and run.',B.win?'good':'bad')}}
  }else if(B.over){B.endT-=rt;if(B.endT<=0){finishBattle();return}}
  for(const p of B.parts){p.life-=rt;if(p.stuck)continue;p.x+=p.vx*rt;p.y+=p.vy*rt;p.vy+=90*rt}B.parts=B.parts.filter(p=>p.life>0);
  for(const f of B.floats){f.y-=14*rt;f.life-=rt}B.floats=B.floats.filter(f=>f.life>0);
  for(const s of B.slashes)s.life-=rt;B.slashes=B.slashes.filter(s=>s.life>0);
  for(const r of B.rings)r.life-=rt;B.rings=B.rings.filter(r=>r.life>0);
  G.shake=Math.max(0,G.shake-rt*14);
}
function finishBattle(){
  if(!B.opts.tournament)for(const u of B.units)if(u.team===0&&!u.hero&&!u.comp&&!u.lord&&!u.leader&&(u.hp>0||u.left))(B.txp=B.txp||{})[u.type]=(B.txp[u.type]||0)+(u.xp||0)+TROOP_XP.fight+(B.win?TROOP_XP.win:0);
  const txp=B.txp||{},o=B.opts,win=B.win,retreat=!!B.retreat,caught=B.caught||0,got=B.withdrawn||0,standing=B.units.filter(u=>u.team===1&&u.hp>0).length,fallen=Object.values(B.lost).reduce((a,n)=>a+n,0);bbar.hidden=true;G.mode='dialog';lootStart();
  const lost=o.tournament?{}:B.lost,kills=B.kills,slain=B.slain,h=B.hero,X=B.hx;
  if(B.fired&&B.win&&ammoOf()){const back=invAdd('good',ammoOf(),Math.floor(B.fired*(.35+Math.random()*.2)));if(back)log('You gather '+back+' '+GOODS[ammoOf()].n.toLowerCase()+' from the field.')}
  // carry the hero's condition out of the fight; a knocked-out hero comes to at 10% health
  if(h.hp>0||h.left)P.hp=h.left?h.hpLeft:h.hp;else{P.hp=Math.max(1,Math.round(h.max*.1));log('You come to after the fight, badly wounded.','bad')}
  if(X){P.sp=X.sp;P.mp=X.mp}
  B=null;updateHint();
  if(o.tournament){
    let html;if(win){P.gold+=45;P.renown+=6;gainXp(25);if(G.town)addRep(G.town.ref.name,8);html='<h2>Champion</h2><p>The crowd chants your name. You take <strong class="gold">45 gold</strong> and gain renown.</p>';log('You win the tournament.','good')}
    else{html='<h2>Beaten</h2><p>The champion takes your entry fee and sends you off with a bruised pride.</p>';log('You lose the tournament.','bad')}
    lootShow(html,null,0,'back-town');return;
  }
  concludeEncounter(win,lost,kills,false,slain,retreat&&{caught,got,standing,fallen,carried:h.hp<=0&&!h.left},txp);
}
