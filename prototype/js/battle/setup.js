'use strict';
/* ---------- battle construction and field setup ---------- */
function formation(list,team){
  const dir=team?-1:1,base=team?BW-72:72,out=[];// (each side starts at its edge of the field)
  // (infantry in front; mages a step behind them (their reach is short); archers at the back; riders on the flanks)
  const front=[],mid=[],back=[],flank=[];list.forEach(t=>{(ST[t].range?(ST[t].magic?mid:back):ST[t].charge?flank:front).push(t)});
  const lay=(arr,x0)=>{const per=8;arr.forEach((t,i)=>{const col=Math.floor(i/per),row=i%per,rows=Math.min(per,arr.length-col*per),gap=Math.min(20,(BH-60)/Math.max(rows,1));out.push({t,x:x0-dir*col*13,y:BH/2+(row-(rows-1)/2)*gap})})};
  lay(front,base+dir*32);lay(mid,base+dir*14);lay(back,base-dir*8);
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
  else if(c==='swamp'&&!home.includes('swamp'))o.spd*=s.mounted?.65:.8;
  else if(c==='grass'&&s.mounted)o.spd*=1.15;
  return o;
}
function placeObstacles(env,y0,y1){y0=y0==null?FIELD_EDGE.top:y0;y1=y1==null?BH-FIELD_EDGE.bot:y1;
  const obs=[],c=env.c,list=env.t===T_FOREST?Array(12).fill('tree'):env.t===T_HILL?Array(6).fill('rock'):c==='desert'?['cactus','cactus','cactus','cactus','rock','rock']
    :c==='swamp'?Array(5).fill('tree'):c==='frost'?['tree','tree','rock','rock']:['tree','tree','rock'];
  // (as many again for each screen's worth of field: the larger field keeps its look)
  // (rocks and trees keep room to pass between them and the field's edges; fewer where the field in sight is shorter)
  const lo=y0+FIELD_EDGE.pass+6,hi=Math.max(lo,y1-FIELD_EDGE.pass-6),many=Math.max(1,Math.round(BW*(y1-y0)/(VW*VH)));for(const kind of Array(many).fill(list).flat())for(let k=0;k<30;k++){const x=rint(110,BW-110),y=rint(lo,hi);if(obs.every(o=>Math.hypot(o.x-x,o.y-y)>26)){obs.push({kind,x,y,r:kind==='rock'?7:kind==='cactus'?5:6});break}}
  return obs;
}
/* the field's edges: where the battle HUD leaves it in sight. Its top bar and speed buttons cover the top of the field, its
   orders and unit cards the bottom: nobody fights under them (measured once a battle starts; the field's own edges if the HUD
   cannot be measured). A soldier's feet are its place, so the top leaves room for its body. */
const FIELD_EDGE={top:18,bot:6,body:22,pass:18};
const fieldTop=()=>B&&B.ftop!=null?B.ftop:FIELD_EDGE.top,fieldBot=()=>B&&B.fbot!=null?B.fbot:BH-FIELD_EDGE.bot;
// (measured before the field is laid out, so its rocks and trees go where the fight can be seen)
function measureField(){
  const def={top:FIELD_EDGE.top,bot:BH-FIELD_EDGE.bot};bbar.hidden=false;{const sc=document.getElementById('screen');if(sc)sc.dataset.mode='battle'}// (the HUD laid out as in battle)
  const cv=document.querySelector('canvas'),r=cv&&cv.getBoundingClientRect();if(!r||r.height<50)return def;const k=BVH/r.height/camFit(),box=sel=>{const e=bbar.querySelector(sel);return e&&e.offsetParent!==null?e.getBoundingClientRect():null};
  const tops=['.btop','.btime'].map(box).filter(Boolean),bot=box('.bcmd');
  const top=tops.length?Math.max(...tops.map(b=>b.bottom))-r.top:0,bh=bot?r.bottom-bot.top:0;
  return{top:Math.round(clamp(top*k+FIELD_EDGE.body,FIELD_EDGE.top,BH*.3)),bot:Math.round(clamp(BH-bh*k-FIELD_EDGE.bot,BH*.6,BH-FIELD_EDGE.bot))}}
// One short-lived coordinator per battle. Runtime units remain plain records; saved campaign records are not copied.
// Construction order is deliberate: preserve random draws, chief reuse, HUD measurement and post-layout initialization.
class BattleSetup{
  constructor(opts){this.opts=opts;this.units=[];this.id=0}
  spawn(unit,team,x,y){
    const s=unit.fieldStats(this.env,team,this.opts.lv||1);
    return{id:this.id++,v:Math.floor(Math.random()*6),type:unit.key,unit,team,x,y,hp:s.hp,max:s.hp,cd:Math.random()*.6,hero:unit.role==='hero',face:team?-1:1,s,spdNow:0,tgt:null,rt:0,swing:0};
  }
  createUnits(){
    const {opts,env,units}=this,lv=opts.lv||1,mk=(...args)=>this.spawn(...args);
    // Every soldier comes from its Unit (characters.js): hero, companions, troops and leaders.
    const hero=this.hero=mk(charOf(P),0,72+44,BH/2);hero.cd=0;vitals();hero.hp=Math.max(1,Math.round(P.hp));units.push(hero);
    if(!opts.tournament)compsInBand().forEach((id,i)=>{const u=mk(charOf(compInit(id),id),0,hero.x-14,BH/2+(i%2?1:-1)*(16+Math.floor(i/2)*14));u.comp=true;units.push(u)});
    if(!opts.tournament)formation(P.list,0).forEach(f=>units.push(mk(troopOf(f.t),0,f.x,f.y)));
    formation(opts.enemies,1).forEach(f=>units.push(mk(troopOf(f.t),1,f.x,f.y)));
    // Reinforcing lords arrive behind each line, a little apart.
    const enc=!opts.tournament&&G.enc,side=(ls,team)=>(ls||[]).forEach((l,li)=>formation(l.troops.slice(),team).forEach(f=>{const u=mk(troopOf(f.t),team,clamp(f.x+(team?36:-36)+li*(team?10:-10),12,BW-12),clamp(f.y+(li?18:-18),26,BH-8));u.lord=l;units.push(u)}));
    if(enc){side(enc.allies,0);side(enc.foes,1)}
    // A camp's chieftain is promoted in place rather than spawned twice.
    if(enc)for(const L of battleLeaders(enc)){let u=L.type==='chief'&&L.team===1&&units.find(x=>x.team===1&&x.type==='chief'&&!x.leader);
      const C=charOf(L.ref);if(!u){u=mk(C,L.team,L.team?BW-96:96,BH/2+(L.team?0:30));units.push(u)}else{u.s=C.fieldStats(env,L.team,lv);u.unit=C;u.type=C.key}u.hp=u.max=u.s.hp;u.leader=L}
  }
  createGroups(){
    const {units,hero,opts}=this,groups=this.groups=Object.fromEntries(GRPS.map(g=>[g,new BattleControl(g,0)]));
    units.forEach(u=>{if(u.team===0&&!u.hero&&!u.lord&&!u.leader)u.grp=grpOf(u.s)});hero.grp='hero';
    for(const g of GRPS){const m=units.filter(u=>u.grp===g);if(!m.length)continue;const gr=groups[g];
      gr.ax=m.reduce((a,u)=>a+u.x,0)/m.length;gr.ay=m.reduce((a,u)=>a+u.y,0)/m.length;m.forEach(u=>{u.sx=u.x-gr.ax;u.sy=u.y-gr.ay})}
    foeGroupsInit(units,groups,opts);
  }
  createState(){
    const {units,hero,groups,env,opts}=this,FI=measureField();
    return{units,hero,groups,env,arena:arenaFor(env.c),ftop:FI.top,fbot:FI.bot,obs:opts.tournament?[]:placeObstacles(env,FI.top,FI.bot),sel:'all',rings:[],arrows:[],parts:[],floats:[],slashes:[],corpses:[],aim:0,blocking:false,touchBlock:false,mt:null,over:false,endT:0,kills:0,slain:[],lost:{},heroDown:false,opts,t:0};
  }
  initialize(){
    B.speed=BSPEED.v;B.paused=false;
    for(const g of [...GRPS,...FOE_GRPS,...ALLY_GRPS])if(g!=='hero'&&B.groups[g])layForm(g);
    moraleInit(this.units,this.opts);
    fatigueInit(this.units);
    camInit();
    warmBattle(this.units);
    deployInit(this.opts);
  }
  present(){
    G.mode='battle';hidePanel();bbar.hidden=false;buildSlotBar();setOrderUI();battleSpeedUI();autoUI();updateHint();
    for(const u of this.units)u.y=clamp(u.y,fieldTop(),fieldBot());for(const g of GRPS)if(g!=='hero'&&B.groups[g].ay)B.groups[g].placeAt(B.groups[g].ax,clamp(B.groups[g].ay,fieldTop(),fieldBot()));
    log(this.opts.tournament?'The crowd roars. Defeat the champion.':'The lines meet in the '+this.env.name.toLowerCase()+'. '+this.env.text);
  }
  start(){
    BW=clamp(BVW,FIELD_W.min,FIELD_W.max);
    damageTypesInit();
    this.env=battleEnv(this.opts.tournament);
    this.createUnits();
    this.createGroups();
    B=this.createState();
    this.initialize();
    this.present();
  }
}
// Compatibility entry point used by encounters, tournaments, tests and other callers.
function startBattle(opts){return new BattleSetup(opts).start()}
