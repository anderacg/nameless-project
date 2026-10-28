'use strict';
/* ---------- factions and world sim ---------- */
const makeWorldState=()=>({rel:{},lords:[],dead:{},sites:[],critters:[],caravans:[],folk:[],refugees:[],patrols:[],fights:[],lrel:{},treas:{},tolls:{},exiles:[],monsters:[],mythic:{},ships:[],shops:{},uidN:0,fightN:0});
const W=makeWorldState();
// daily war chance per peaceful pair, scaled so more factions don't mean more wars overall
const FIDS=Object.keys(FACS),WAR_RATE=.05*3/(FIDS.length*(FIDS.length-1)/2),LCAP=18;
// the holdings a realm counts on (lcapOf: short of them, its lords rally more): its share of the world's, as each world goes in
let FIEF0=0;onWorld(()=>{FIEF0=Math.round(TOWNS.length/FIDS.length)});
// holdings you take for yourself belong to 'player'. It is not one of FIDS: it never rolls wars, and it is at war with whoever is hostile to you.
FACS.player={n:'Free Banner',col:'#f0d060',d:'Your own banner and the holdings that fly it.',races:[],lords:[]};
const rk=(a,b)=>a<b?a+'|'+b:b+'|'+a;
/* ---------- a realm (doc/STORY_DESIGN.md §7, wave C): one of FACS, or your own banner ('player': PlayerRealm), over the plain
   maps the world saves, so nothing of it is saved itself:
   - its wars and peace: W.rel, one record a pair {s: 'peace' | 'war' | 'ally', since: the day it began}; W.dead once fallen;
   - how it sees you: your honour with it (P.honor) and its hostility (P.hostile, a Timed view: core/timed.js);
   - its holdings (TOWNS by owner) and its lords (W.lords by fac).
   realmOf(fac) gives it (any value, a missing one too: it then holds nothing and is at war with no one). The day's diplomacy is
   Realm.day (worldDay, first). The old names (relOf, atWar, enemiesOf, fiefsOf, lordsOf, hostileTo, honorWith, addHonor,
   setRel, fallFaction, facRaces, armyOf) are one-line aliases. ---------- */
class Realm{
  constructor(id){
    this.id=id;
  }
  get data(){return FACS[this.id]}
  get name(){return FACS[this.id].n}
  get fallen(){return !!W.dead[this.id]}
  // ---- wars and peace: where it stands with realm g
  relWith(g){return W.rel[rk(this.id,g)]||{s:'peace',since:0}}
  atWar(g){
    if(!this.id||!g||this.id===g)return false;
    return g==='player'?this.hostile():this.relWith(g).s==='war';
  }
  enemies(){return FIDS.filter(g=>this.atWar(g))}
  // a new standing with g, told (worldlog.js: by rider when your employer is one of them, in colour; else as news); a war drags in the allies of each
  // that were at peace with the other (once: chain); the lords of both who are not besieging think again
  setRel(g,s,chain){
    const a=this.id,b=g,prev=this.relWith(b).s;
    W.rel[rk(a,b)]={s,since:G.day};
    const A='the '+FACS[a].n,Bn='the '+FACS[b].n,mine=P.fac===a||P.fac===b;
    const m=s==='war'?'War! '+A[0].toUpperCase()+A.slice(1)+' and '+Bn+' are at war.':s==='ally'?A[0].toUpperCase()+A.slice(1)+' and '+Bn+' form an alliance.':prev==='ally'?'The alliance between '+A+' and '+Bn+' ends.':A[0].toUpperCase()+A.slice(1)+' and '+Bn+' agree to a truce.';
    const [pa,pb]=[a,b].sort();
    worldEvent({text:m,cls:mine?(s==='war'?'bad':'good'):'gold',fac:[a,b],news:[s==='war'?'war':s==='ally'?'ally':'peace',realmsMeet(a,b),{a:pa,b:pb,...(s==='peace'&&prev==='ally'?{ended:1}:{})}],
      past:s==='war'?A+' and '+Bn+' went to war':s==='ally'?A+' and '+Bn+' formed an alliance':prev==='ally'?'the alliance between '+A+' and '+Bn+' ended':A+' and '+Bn+' agreed to a truce'});
    if(s==='war'&&!chain)FIDS.forEach(c=>{
      if(c===a||c===b||W.dead[c])return;
      const C=realmOf(c);
      if(C.relWith(a).s==='ally'&&C.relWith(b).s==='peace')C.setRel(b,'war',1);
      if(C.relWith(b).s==='ally'&&C.relWith(a).s==='peace')C.setRel(a,'war',1);
    });
    W.lords.forEach(l=>{if(!l.dead&&(l.fac===a||l.fac===b)&&l.state!=='siege')lordThink(l)});
  }
  // one day between it and realm g (after it in FIDS): a peace of six days or more may break into war; a war of eight days or
  // more may end, likelier the longer it lasts, the more lopsided it is, the nearer one is to falling and when one is weary
  // (economy.js); two at war with the same realm may ally, and allies with no foe in common part
  dayWith(g){
    const a=this.id,b=g,r=this.relWith(b),age=Clock.daysSince(r.since);
    if(r.s==='peace'&&age>=6&&Math.random()<WAR_RATE)this.setRel(b,'war');
    else if(r.s==='war'&&age>=8&&Math.random()<Math.min(.35,.04+(age-8)*.01+(Math.abs(fiefsOf(a).length-fiefsOf(b).length)>=2?.08:0)+(Math.min(fiefsOf(a).length,fiefsOf(b).length)<=1?.25:0)+(econWeary(a)||econWeary(b)?.12:0)))this.setRel(b,'peace');
    else if(r.s==='peace'&&FIDS.some(c=>c!==a&&c!==b&&atWar(a,c)&&atWar(b,c))&&Math.random()<.3)this.setRel(b,'ally');
    else if(r.s==='ally'&&!FIDS.some(c=>c!==a&&c!==b&&atWar(a,c)&&atWar(b,c))&&Math.random()<.2)this.setRel(b,'peace');
  }
  // its last holding lost (at: that holding; involved: you took it): its lords gone for good, its standings dropped, your
  // contract with it ended (your employer's fall you learn at once)
  fall(at,involved){
    const f=this.id;
    W.dead[f]=true;
    W.lords.forEach(l=>{if(l.fac===f){l.dead=true;l.gone=true}});
    FIDS.forEach(g=>{if(g!==f)delete W.rel[rk(f,g)]});
    worldEvent({text:'The '+this.name+' has fallen. Its last holding is lost.',cls:'bad',fac:[f],involved:involved||P.fac===f,x:at&&at.x,y:at&&at.y,
      news:at?['realm',at,{fac:f,town:at.name}]:null,past:'the '+this.name+' fell with the loss of its last holding'});
    if(P.fac===f){P.fac=null;log('Your contract ends with the fall of your employer.','bad','war')}
  }
  // ---- how it sees you: your honour with it (-100..100), and whether it is your foe: at war with your employer, or hostile
  // to you for some days of its own
  get honor(){return P.honor[this.id]||0}
  addHonor(n,quiet){
    if(!n||!FACS[this.id])return;
    P.honor[this.id]=clamp(this.honor+n,-100,100);
    if(!quiet)log('The '+this.name+(n>0?' honors you':' resents you')+' ('+(n>0?'+':'')+n+' honor).',n>0?'good':'bad');
  }
  get hostility(){return Timed.of(P,'hostile')}
  hostile(){
    if(!this.id||this.id==='player')return false;
    return (!!P.fac&&atWar(P.fac,this.id))||this.hostility.has(this.id);
  }
  // you turned on it (its caravan, its watch, its lord): hostile for days, and honour lost quietly; nothing when it already is.
  // True when it turned
  provoke(days,honor){
    if(this.hostile())return false;
    this.hostility.extend(this.id,days);
    this.addHonor(-honor,true);
    return true;
  }
  // a deed against its people (conduct.js wrong, c: a CONDUCT entry): honour lost with it (added to cost, the deed's price),
  // its lords think a little less of you, and hostility for c.hostile days
  wronged(t,c,cost){
    if(c.honor){
      this.addHonor(-c.honor,true);
      cost.push('honour with the '+this.name+' −'+c.honor);
      this.lords().filter(l=>!l.dead).forEach(l=>changeRel(l,RELATION.harmRealm,'you wronged the people of '+t.name));
    }
    if(c.hostile&&!this.hostile()){
      this.hostility.extend(this.id,c.hostile);
      log('The '+this.name+' turns hostile to you for '+c.hostile+' days.','bad');
    }
  }
  // ---- its holdings and lords; its peoples (those of its holdings, else its own) and an army of n raised from them
  fiefs(){return TOWNS.filter(t=>t.owner===this.id)}
  lords(){return W.lords.filter(l=>l.fac===this.id)}
  races(){
    const rs=[...new Set(this.fiefs().flatMap(t=>t.races))];
    return rs.length?rs:FACS[this.id].races;
  }
  army(n){
    const rs=this.races(),a=[],types=[];
    for(let i=0;i<n;i++){
      const c=RACES[rs[rint(0,rs.length-1)]],r=Math.random();
      let type=r<.24?c.melee:r<.36?c.shield:r<.5?UP[c.melee][0]:r<.6?UP[c.shield][0]:r<.76?c.ranged:r<.84?UP[c.ranged][0]:r<.91?c.mage:c.horse;
      if(!types.includes(type)){if(types.length>=ARMY_LIMIT-1)type=types[i%types.length];else types.push(type)}
      a.push(type);
    }
    return a;
  }
  // the day's diplomacy: each pair of standing realms, in FIDS order
  static day(){
    for(let i=0;i<FIDS.length;i++)for(let j=i+1;j<FIDS.length;j++){
      const a=FIDS[i],b=FIDS[j];
      if(W.dead[a]||W.dead[b])continue;
      realmOf(a).dayWith(b);
    }
  }
}
// your own banner: never in FIDS, it rolls no wars; it is at war with whoever is hostile to you, and never hostile itself
class PlayerRealm extends Realm{
  atWar(g){return !!g&&g!=='player'&&realmOf(g).hostile()}
  hostile(){return false}
}
const REALMS=new Map();
function realmOf(f){
  let r=REALMS.get(f);
  if(!r){r=f==='player'?new PlayerRealm(f):new Realm(f);REALMS.set(f,r)}
  return r;
}
// (the old names)
const relOf=(a,b)=>realmOf(a).relWith(b);
const atWar=(a,b)=>realmOf(a).atWar(b);
const enemiesOf=f=>realmOf(f).enemies();
const fiefsOf=f=>realmOf(f).fiefs();
const lordsOf=f=>realmOf(f).lords();
const hostileTo=f=>realmOf(f).hostile();
const honorWith=f=>realmOf(f).honor;
const addHonor=(f,n,quiet)=>realmOf(f).addHonor(n,quiet);
const facCol=t=>t.owner?FACS[t.owner].col:'#98a0ba';
const townBy=n=>TOWNS.find(t=>t.name===n);
const besieged=t=>t.besieged();// (the old name: holdings.js Holding)
const nearestOf=(o,list)=>Spatial.nearest(list,o.x,o.y);// (the old name: core/spatial.js)
/* lords grow as you do: a level from what they win in battle (l.lv, l.xp: level x 60 to the next, as yours), renown, and the
   disciplines of command, which rise by use (l.sk: Leadership by winning, Tactics by fighting, Medicine by tending their fallen;
   levels 0-10, (level+1) x 20 to the next, as yours). Their army is capped as yours is: 8 + 3 a level + renown/25 + Leadership
   (+1 for a lord's bearing), and a realm short of holdings rallies 4 more for each it lacks. Lords from older saves are filled in */
const LORD_SK=['lead','tact','med'];
function lordStats(l){if(l.lv)return l;l.lv=rint(2,6);l.xp=0;l.renown=l.lv*8;l.sk={};for(const k of LORD_SK)l.sk[k]={lv:Math.min(10,Math.floor(l.lv/2)+rint(0,1)),xp:0};return l}
const lordSkill=(l,k)=>{const s=lordStats(l).sk[k];return s?s.lv:0};
function lordTrain(l,k,n){leaderOf(l).train(k,n)}
function lordXp(l,n){leaderOf(l).gainXp(n)}// (leaders.js Lord)
const lcapOf=l=>{lordStats(l);return Math.round(9+3*l.lv+Math.floor((l.renown||0)/25)+lordSkill(l,'lead'))+4*Math.max(0,FIEF0-fiefsOf(l.fac).length)};
// how much a lord's Tactics makes his army count for in a fight
const lordTac=ls=>1+.05*Math.max(0,...ls.filter(o=>W.lords.includes(o)).map(o=>lordSkill(o,'tact')));
// a lord who won: experience and renown, and his Leadership and Tactics rise
function lordWins(l,foes){leaderOf(l).won(foes)}// (leaders.js Lord)
const cull=(l,frac)=>{if(l instanceof Party)return l.cull(frac);const r=new TroopRoster({tc:countsOf(l.troops)},'tc');r.cull(frac);l.troops=r.list;return l};
const facRaces=f=>realmOf(f).races();
const armyOf=(f,n)=>realmOf(f).army(n);
// a holding's guards come from its people: each new one is a volunteer (t.vol, the pool you recruit from too) who leaves the
// population for the garrison. A holding needs at least GUARD_FLOOR people left; returns how many it could draft (up to n)
const GUARD_FLOOR=20;
const draftLocals=(t,n)=>t.draft(n);// (holding.js Holding draft)
const canDraft=t=>t.canDraft();
function garList(t){const a=[];for(let i=0;i<t.gar;i++){const c=RACES[t.races[i%t.races.length]];a.push(i%7===6?c.mage:i%3===2?c.ranged:i%4===1?c.shield:i%2?UP[c.melee][0]:c.melee)}return a}
// a holding's first day (holding.js Holding setUp); a generated world's economy setting (doc/WORLD_DESIGN.md §4.1) on its
// first stocks (ECON_STOCK: poor or rich)
const ECON_STOCK={poor:.75,rich:1.3};
const initHolding=t=>t.setUp();
// told when a holding is added or lost while the world runs: fn(t, 'add' | 'gone')
const HOLDING_HOOKS=[],onHolding=fn=>HOLDING_HOOKS.push(fn);
// a holding made while the world runs (founded): its name kept unique, held by its realm (yours unless given), set up as the
// rest were at the start, its lots laid out; added at the end, so every index into TOWNS stays as it was
function addHolding(data){let name=data.name,n=2;while(townBy(name))name=data.name+' '+n++;
  const t=makeHolding({realm:'player',seed:1+Math.max(0,...TOWNS.map(o=>o.seed)),...data,name});TOWNS.push(t);initHolding(t);initLots(t);
  HOLDING_HOOKS.forEach(f=>f(t,'add'));return t}
// a lost holding (a camp burnt or left): never taken out of TOWNS, so LAND's indices hold; gone, no one's, its lots cleared
function loseHolding(t){if(t.gone)return;t.gone=true;t.owner=null;(t.lots||[]).slice().forEach(l=>lotDrop(t,l));HOLDING_HOOKS.forEach(f=>f(t,'gone'))}
function initWorld(){
  TOWNS.forEach(initHolding);lotsReset();TOWNS.forEach(initLots);W.caravans=[];W.folk=[];W.refugees=[];W.patrols=[];W.fights=[];W.lrel={};W.treas={};W.tolls={};
  W.rel={};W.dead={};W.lords=[];W.exiles=[];W.monsters=[];W.mythic={};
  {const a=FIDS[rint(0,FIDS.length-1)],others=FIDS.filter(x=>x!==a),b=others[rint(0,others.length-1)];W.rel[rk(a,b)]={s:'war',since:1}}
  addMissingLords();patrolDay();
}
// every faction fields its listed lords (a generated world's when it needs more: WM.lords, doc/WORLD_DESIGN.md D10); also fills
// in lords for factions an older save didn't have
function addMissingLords(){
  FIDS.forEach(f=>(WM.lords&&WM.lords[f]||FACS[f].lords).forEach((n,i)=>{if(W.lords.some(l=>l.name===n)||W.dead[f])return;const own=fiefsOf(f);if(!own.length)return;const h=own[i%own.length];
    W.lords.push(asParty({id:f+i,name:n,fac:f,x:h.x+rint(-8,8),y:h.y+14,troops:armyOf(f,12),state:'rest',tgt:h.name,sd:0,cool:0,dead:false,gone:false,back:0}))}));
}
function setRel(a,b,s,chain){realmOf(a).setRel(b,s,chain)}
/* lords inside: a lord resting at one of his realm's holdings goes in (l.inside = its name). He is off the map, and his
   soldiers stand with the garrison: they defend it in any siege, eat from its stores, and fall with it. He rides out when he
   sets off again; he cannot get into a holding under siege, and does not leave one he is defending. */
const lordsInside=t=>W.lords.filter(l=>!l.dead&&l.inside===t.name);
const insideTroops=t=>lordsInside(t).flatMap(l=>l.troops);
// (a lord shelters as every party does: parties.js shelterWhy, enter, leave)
function lordThink(l){
  if(l.inside){const h=townBy(l.inside);if(h&&besieged(h)&&h.owner===l.fac){l.state='rest';l.tgt=h.name;return}}
  const own=fiefsOf(l.fac);if(!own.length){l.dead=true;l.gone=true;return}
  const foes=TOWNS.filter(t=>atWar(l.fac,t.owner)),hit=own.find(besieged);
  if(hit&&l.troops.length>=9){l.state='relieve';l.tgt=hit.name;return}
  if(l.troops.length<9||(!foes.length&&l.troops.length<lcapOf(l)-4)){l.state='home';l.tgt=Spatial.nearest(own,l.x,l.y).name;return}
  if(foes.length){l.state='march';l.tgt=Spatial.nearest(foes,l.x,l.y).name;return}
  l.state='patrol';l.tgt=own[rint(0,own.length-1)].name;
}
// you beat a lord's army: a bounty from your employer, a broken siege, and honor with his enemies (from ON_WIN)
function lordWon(l,res){
  let txt='';worldEmit('lord:routed',{lord:l});if(l.state==='siege'&&townBy(l.tgt))worldEmit('siege:broken',{town:townBy(l.tgt),lord:l});// (the bus: news.js)
  if(P.fac&&atWar(P.fac,l.fac)){res.gold+=40;P.renown+=5;txt+=' Your employer adds a 40 gold bounty.'}
  if(l.state==='siege'){const st=townBy(l.tgt);if(st&&!hostileTo(st.owner)){addRep(st.name,10,true);if(st.owner!=='player')addHonor(st.owner,8,true);lordsInside(st).forEach(o=>changeRel(o,RELATION.breakSiege,'you broke the siege of '+st.name));txt+=' You break the siege of '+st.name+'. Its people cheer you in.'}}
  rippleRel(l,RELATION.beatThem,'you beat them in battle');worldEmit('lord:beaten',{lord:l});captureLord(l);log(l.name+' is taken captive. The '+FACS[l.fac].n+' will remember this.',undefined,'war');txt+=' You take '+l.name+' captive: ransom him or let him go (Hero, Party).';
  FIDS.filter(f=>atWar(f,l.fac)).forEach(f=>addHonor(f,5));addHonor(l.fac,-10);
  return txt;
}
function defeatLord(l){l.inside=null;l.dead=true;l.troops=[];l.back=G.day+4;l.state='rest'}
function fallFaction(f,at,involved){realmOf(f).fall(at,involved)}
function resolveSiege(l,t){
  const mine=t.owner==='player',pa=power(l.troops)*lordTac([l])*(.8+Math.random()*.4),pd=power(garList(t).concat(insideTroops(t)))*(mine?2.2:1.8+.8*Math.max(0,FIEF0-fiefsOf(t.owner).length))*(1+.15*(wallOf(t)-t.T.wall0))*(t.stock&&foodDays(t)<2?.6:1)*(.8+Math.random()*.4);
  if(pa>pd){
    const prev=t.owner;cull(l,clamp(.1+.5*(pd/pa)**2,.05,.6));lordWins(l,t.gar||6);lordsInside(t).forEach(o=>{defeatLord(o);worldEvent({text:o.name+' is taken inside the walls of '+t.name+'.',cls:o.fac===P.fac?'bad':'',x:t.x,y:t.y,fac:[o.fac],towns:[t],past:o.name+' was taken inside the walls of '+t.name})});t.owner=l.fac;t.gar=4;l.state='rest';
    // conquest leaves its mark: turmoil for a while, and sometimes the victors sack the place
    Timed.of(t).set('turmoil',8);breach(t);const sacked=Math.random()<.35;if(sacked){Timed.of(t).set('sacked',15);burnEstates(t,2);sackStock(t,.5,.25)}
    worldEmit('holding:taken',{town:t,lord:l,sacked});
    {const F=FACS[l.fac].n,lost=mine?' You have lost your fief.':'';
     worldEvent({text:t.name+' falls to '+l.name+' of the '+F+(sacked?', who sacks it':'')+'.'+lost,cls:l.fac===P.fac?'good':prev===P.fac||mine?'bad':'gold',x:t.x,y:t.y,fac:[l.fac,prev],towns:[t],heard:['fell',t],
       seen:'You see the banners of the '+F+' go up over '+t.name+': it falls to '+l.name+(sacked?', who sacks it':'')+'.'+lost,past:t.name+' fell to '+l.name+' of the '+F,also:(sacked?' He sacked it.':'')+lost})}
    W.lords.forEach(o=>{if(!o.dead&&o!==l&&o.tgt===t.name)lordThink(o)});
    stayFall(t);
    if(!mine&&!fiefsOf(prev).length)fallFaction(prev,t);
  }else{cull(l,.55);lordXp(l,6);lordTrain(l,'tact',2);t.gar=Math.max(2,Math.round(t.gar*.6));worldEmit('siege:broken',{town:t,lord:l});
    worldEvent({text:'The siege of '+t.name+' fails. '+l.name+' falls back.',x:t.x,y:t.y,fac:[t.owner,l.fac],towns:[t],heard:['relieved',t],seen:'You see the siege of '+t.name+' fail. '+l.name+' falls back.',past:'the siege of '+t.name+' failed and '+l.name+' fell back'});lordThink(l)}
}
function worldDay(){
  Realm.day();// (wars and peace)
  // the realms refill their garrisons a guard a day, paid from the treasury and drafted from the holding's own people
  TOWNS.forEach(t=>{const cap=Math.round(t.T.gar*(Timed.of(t).has('sacked')?.5:1));if(t.owner&&t.owner!=='player'&&!besieged(t)&&t.gar<cap&&canDraft(t)&&payRealm(t.owner,6,t,1)&&draftLocals(t,1))t.gar++});
  for(const l of W.lords){
    if(l.gone)continue;
    if(l.dead){
      if(G.day<l.back)continue;const own=fiefsOf(l.fac);if(!own.length){l.gone=true;continue}
      const h=own.slice().sort((a,b)=>(b.vol||0)-(a.vol||0))[0];ensureEcon(h);const can=Math.min(9,Math.floor(h.vol||0),Math.floor((h.pop||0)-GUARD_FLOOR));if(can<3||!payRealm(l.fac,90,h,9))continue;
      const raised=[];for(let i=draftLocals(h,can);i>0;i--){const c=RACES[h.races[rint(0,h.races.length-1)]];raised.push(Math.random()<.6?c.melee:c.ranged)}
      Object.assign(l,{dead:false,x:h.x,y:h.y+14,troops:raised,state:'rest',tgt:h.name,cool:3});if(!l.shelterWhy(h))l.enter(h);
      worldEvent({text:l.name+' raises a new army at '+h.name+'.',x:h.x,y:h.y,fac:[l.fac],towns:[h],news:['army',h,{lord:l.name,fac:l.fac,town:h.name,n:raised.length}],past:l.name+' raised a new army at '+h.name});continue;
    }
    const t=townBy(l.tgt);
    if(l.state==='siege'){if(!t||!atWar(l.fac,t.owner)){lordThink(l);continue}if(inFight(l))continue;
      if(t.stock&&foodStock(t)<=0)worldNews('starving',t,{town:t.name,fac:t.owner});// (its stores run dry: news only, worldlog.js)
      // the lords inside sally out when they are a match for the besiegers
      const sal=lordsInside(t).filter(o=>!o.fight&&atWar(o.fac,l.fac)),them=siegeLordsAt(t).filter(o=>!o.fight);
      if(sal.length&&power(sal.flatMap(o=>o.troops))>=.9*power(them.flatMap(o=>o.troops))){sal.forEach(o=>{o.inside=null;o.x=t.x;o.y=t.y+12;o.state='rest';o.tgt=t.name});startFight(sal,them);
        {const who=sal.map(o=>o.name).join(' and ');worldEvent({text:who+' ride'+(sal.length>1?'':'s')+' out of '+t.name+' to break the siege.',x:t.x,y:t.y,fac:[t.owner,...sal.map(o=>o.fac)],towns:[t],
          was:Math.hypot(t.x-P.x,t.y-P.y)<vis()*1.5||t.owner===P.fac||t.owner==='player',past:who+' rode out of '+t.name+' to break the siege'})}continue}
      if(++l.sd>=2+wallOf(t))resolveSiege(l,t);continue}
    if(l.state==='rest'&&t&&t.owner===l.fac){
      // he hires as you do: the holding's own volunteers, at the price you pay, from his realm's treasury
      for(let k=0,n=3+Math.max(0,FIEF0-fiefsOf(l.fac).length);k<n&&l.troops.length<lcapOf(l)&&canDraft(t);k++){const c=RACES[t.races[rint(0,t.races.length-1)]],r=Math.random(),type=r<.4?c.melee:r<.6?c.shield:c.ranged;if(!partyRoster(l).canAdd(type)||!payRealm(l.fac,HIRE[type]||22,t,1))break;draftLocals(t,1);l.add(type)}
      const k=l.troops.find(x=>UP[x]);if(k&&Math.random()<.7){const u=UP[k],to=u[rint(0,u.length-1)],r=partyRoster(l);if(r.canAdd(to)||r.groups.find(g=>g.type===k)?.count===1){l.remove(k,1);l.add(to)}}// (one is trained up)
    }
    if(l.state==='rest'||Math.random()<.35)lordThink(l);
  }
}
// each moment on the map: LordBrain (brains.js)
function lordMeet(l,topic){
  KNOWLEDGE.sight(l);
  if(hostileTo(l.fac)&&!lordSpares(l))return cornered(l,'lord')?parley(l,'lord'):startEncounter({kind:'lord',ref:l,list:l.troops.slice()});
  const talk=['dialog','scene'].includes(G.mode)&&G.enc&&G.enc.kind==='lord'&&G.enc.ref===l&&G.enc.talk||{};
  G.enc={kind:'lord',ref:l,talk};G.mode=l.inside&&G.scene?'scene':'dialog';P.tx=null;
  // (the talk: story/conversation.js; its answers kept on the visit's talk, said once each)
  const cv=talk.cv||(talk.cv=new Conversation(new LordSpeaker(l)));
  if(topic==='rumours'&&talk.rumours==null){talk.rumours=rumourSay(rumourSource('lord',l.id,l,{fac:l.fac,from:l.name}))||'I have heard nothing new.';cv.say(talk.rumours)}
  if(topic==='lords'&&talk.lords==null){talk.lords=lordTies(l,false)||'<p>I have no other lords to speak of.</p>';KNOWLEDGE.hear(talk.lords);cv.say(talk.lords,true)}
  cv.show({body:cv.sp.body(talk),close:['lord-leave',null,'Leave']});
}
// its work in the world's day and frame (core/systems.js)
Systems.add({name:'realms',order:{day:30},day:worldDay});
