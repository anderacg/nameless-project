'use strict';
/* ---------- factions and world sim ---------- */
const makeWorldState=()=>({rel:{},lords:[],dead:{},sites:[],critters:[],caravans:[],folk:[],refugees:[],patrols:[],fights:[],lrel:{},treas:{},tolls:{},exiles:[],monsters:[],mythic:{},ships:[],shops:{},uidN:0,fightN:0});
const W=makeWorldState();
// daily war chance per peaceful pair, scaled so more factions don't mean more wars overall
const FIDS=Object.keys(FACS),WAR_RATE=.05*3/(FIDS.length*(FIDS.length-1)/2),LCAP=18,FIEF0=Math.round(TOWNS.length/FIDS.length);
// holdings you take for yourself belong to 'player'. It is not one of FIDS: it never rolls wars, and it is at war with whoever is hostile to you.
FACS.player={n:'Free Banner',col:'#f0d060',d:'Your own banner and the holdings that fly it.',races:[],lords:[]};
const rk=(a,b)=>a<b?a+'|'+b:b+'|'+a;
const relOf=(a,b)=>W.rel[rk(a,b)]||{s:'peace',since:0};
const atWar=(a,b)=>!!a&&!!b&&a!==b&&(a==='player'?hostileTo(b):b==='player'?hostileTo(a):relOf(a,b).s==='war');
const enemiesOf=f=>FIDS.filter(g=>atWar(f,g));
const fiefsOf=f=>TOWNS.filter(t=>t.owner===f);
const facCol=t=>t.owner?FACS[t.owner].col:'#98a0ba';
const hostileTo=f=>!!f&&f!=='player'&&((!!P.fac&&atWar(P.fac,f))||(P.hostile[f]||0)>G.day);
const townBy=n=>TOWNS.find(t=>t.name===n);
const besieged=t=>W.lords.some(l=>!l.dead&&l.state==='siege'&&l.tgt===t.name)||!!(P.siege&&P.siege.town===t.name)||!!(P.raid&&P.raid.town===t.name);
const nearestOf=(o,list)=>{let b=null,bd=1e9;for(const t of list){const d=Math.hypot(t.x-o.x,t.y-o.y);if(d<bd){bd=d;b=t}}return b};
/* lords grow as you do: a level from what they win in battle (l.lv, l.xp: level x 60 to the next, as yours), renown, and the
   disciplines of command, which rise by use (l.sk: Leadership by winning, Tactics by fighting, Medicine by tending their fallen;
   levels 0-10, (level+1) x 20 to the next, as yours). Their army is capped as yours is: 8 + 3 a level + renown/25 + Leadership
   (+1 for a lord's bearing), and a realm short of holdings rallies 4 more for each it lacks. Lords from older saves are filled in */
const LORD_SK=['lead','tact','med'];
function lordStats(l){if(l.lv)return l;l.lv=rint(2,6);l.xp=0;l.renown=l.lv*8;l.sk={};for(const k of LORD_SK)l.sk[k]={lv:Math.min(10,Math.floor(l.lv/2)+rint(0,1)),xp:0};return l}
const lordSkill=(l,k)=>{const s=lordStats(l).sk[k];return s?s.lv:0};
function lordTrain(l,k,n){leaderOf(l).train(k,n)}
function lordXp(l,n){leaderOf(l).gainXp(n)}// (leaders.js)
const lcapOf=l=>{lordStats(l);return Math.round(9+3*l.lv+Math.floor((l.renown||0)/25)+lordSkill(l,'lead'))+4*Math.max(0,FIEF0-fiefsOf(l.fac).length)};
// how much a lord's Tactics makes his army count for in a fight
const lordTac=ls=>1+.05*Math.max(0,...ls.filter(o=>W.lords.includes(o)).map(o=>lordSkill(o,'tact')));
// a lord who won: experience and renown, and his Leadership and Tactics rise
function lordWins(l,foes){lordXp(l,12+2*foes);l.renown=(l.renown||0)+Math.ceil(foes/3);lordTrain(l,'lead',3+foes*.5);lordTrain(l,'tact',2)}
const cull=(l,frac)=>{if(l instanceof Party)return l.cull(frac);const r=new TroopRoster({tc:countsOf(l.troops)},'tc');r.cull(frac);l.troops=r.list;return l};
const facRaces=f=>{const rs=[...new Set(fiefsOf(f).flatMap(t=>t.races))];return rs.length?rs:FACS[f].races};
function armyOf(f,n){const rs=facRaces(f),a=[],types=[];for(let i=0;i<n;i++){const c=RACES[rs[rint(0,rs.length-1)]],r=Math.random();let type=r<.24?c.melee:r<.36?c.shield:r<.5?UP[c.melee][0]:r<.6?UP[c.shield][0]:r<.76?c.ranged:r<.84?UP[c.ranged][0]:r<.91?c.mage:c.horse;
    if(!types.includes(type)){if(types.length>=ARMY_LIMIT-1)type=types[i%types.length];else types.push(type)}a.push(type)}return a}
// a holding's guards come from its people: each new one is a volunteer (t.vol, the pool you recruit from too) who leaves the
// population for the garrison. A holding needs at least GUARD_FLOOR people left; returns how many it could draft (up to n)
const GUARD_FLOOR=20;
function draftLocals(t,n){ensureEcon(t);const k=Math.max(0,Math.min(n,Math.floor(t.vol||0),Math.floor((t.pop||0)-GUARD_FLOOR)));if(k){t.vol-=k;t.pop-=k}return k}
const canDraft=t=>(t.vol||0)>=1&&(t.pop||0)-GUARD_FLOOR>=1;
function garList(t){const a=[];for(let i=0;i<t.gar;i++){const c=RACES[t.races[i%t.races.length]];a.push(i%7===6?c.mage:i%3===2?c.ranged:i%4===1?c.shield:i%2?UP[c.melee][0]:c.melee)}return a}
function initWorld(){
  TOWNS.forEach(t=>{t.owner=t.lastOwner=HOME[t.name];t.gar=t.T.gar;t.sacked=t.raided=t.turmoil=0;t.grow=GROW0;initEstates(t);initEconomy(t)});lotsReset();TOWNS.forEach(initLots);W.caravans=[];W.folk=[];W.refugees=[];W.patrols=[];W.fights=[];W.lrel={};W.treas={};W.tolls={};
  W.rel={};W.dead={};W.lords=[];W.exiles=[];W.monsters=[];W.mythic={};
  {const a=FIDS[rint(0,FIDS.length-1)],others=FIDS.filter(x=>x!==a),b=others[rint(0,others.length-1)];W.rel[rk(a,b)]={s:'war',since:1}}
  addMissingLords();patrolDay();
}
// every faction fields its listed lords; also fills in lords for factions an older save didn't have
function addMissingLords(){
  FIDS.forEach(f=>FACS[f].lords.forEach((n,i)=>{if(W.lords.some(l=>l.name===n)||W.dead[f])return;const own=fiefsOf(f);if(!own.length)return;const h=own[i%own.length];
    W.lords.push(asParty({id:f+i,name:n,fac:f,x:h.x+rint(-8,8),y:h.y+14,troops:armyOf(f,12),state:'rest',tgt:h.name,sd:0,cool:0,dead:false,gone:false,back:0}))}));
}
function setRel(a,b,s,chain){
  const prev=relOf(a,b).s;W.rel[rk(a,b)]={s,since:G.day};
  const A='the '+FACS[a].n,Bn='the '+FACS[b].n,mine=P.fac===a||P.fac===b;
  const m=s==='war'?'War! '+A[0].toUpperCase()+A.slice(1)+' and '+Bn+' are at war.':s==='ally'?A[0].toUpperCase()+A.slice(1)+' and '+Bn+' form an alliance.':prev==='ally'?'The alliance between '+A+' and '+Bn+' ends.':A[0].toUpperCase()+A.slice(1)+' and '+Bn+' agree to a truce.';
  log(m,mine?(s==='war'?'bad':'good'):'gold');
  if(s==='war'&&!chain)FIDS.forEach(c=>{if(c!==a&&c!==b&&!W.dead[c]){if(relOf(c,a).s==='ally'&&relOf(c,b).s==='peace')setRel(c,b,'war',1);if(relOf(c,b).s==='ally'&&relOf(c,a).s==='peace')setRel(c,a,'war',1)}});
  W.lords.forEach(l=>{if(!l.dead&&(l.fac===a||l.fac===b)&&l.state!=='siege')lordThink(l)});
}
/* lords inside: a lord resting at one of his realm's holdings goes in (l.inside = its name). He is off the map, and his
   soldiers stand with the garrison: they defend it in any siege, eat from its stores, and fall with it. He rides out when he
   sets off again; he cannot get into a holding under siege, and does not leave one he is defending. */
const lordsInside=t=>W.lords.filter(l=>!l.dead&&l.inside===t.name);
const insideTroops=t=>lordsInside(t).flatMap(l=>l.troops);
// (a lord shelters as every party does: parties.js)
const canEnter=(l,t)=>!!t&&!asParty(l).shelterWhy(t);
const lordEnter=(l,t)=>asParty(l).enter(t);
const lordLeave=l=>asParty(l).leave();
function lordThink(l){
  if(l.inside){const h=townBy(l.inside);if(h&&besieged(h)&&h.owner===l.fac){l.state='rest';l.tgt=h.name;return}}
  const own=fiefsOf(l.fac);if(!own.length){l.dead=true;l.gone=true;return}
  const foes=TOWNS.filter(t=>atWar(l.fac,t.owner)),hit=own.find(besieged);
  if(hit&&l.troops.length>=9){l.state='relieve';l.tgt=hit.name;return}
  if(l.troops.length<9||(!foes.length&&l.troops.length<lcapOf(l)-4)){l.state='home';l.tgt=nearestOf(l,own).name;return}
  if(foes.length){l.state='march';l.tgt=nearestOf(l,foes).name;return}
  l.state='patrol';l.tgt=own[rint(0,own.length-1)].name;
}
// you beat a lord's army: a bounty from your employer, a broken siege, and honor with his enemies (from ON_WIN)
function lordWon(l,res){
  let txt='';
  if(P.fac&&atWar(P.fac,l.fac)){res.gold+=40;P.renown+=5;txt+=' Your employer adds a 40 gold bounty.'}
  if(l.state==='siege'){const st=townBy(l.tgt);if(st&&!hostileTo(st.owner)){addRep(st.name,10,true);if(st.owner!=='player')addHonor(st.owner,8,true);lordsInside(st).forEach(o=>changeRel(o,RELATION.breakSiege,'you broke the siege of '+st.name));txt+=' You break the siege of '+st.name+'. Its people cheer you in.'}}
  rippleRel(l,RELATION.beatThem,'you beat them in battle');questNotify('lord',l);captureLord(l);log(l.name+' is taken captive. The '+FACS[l.fac].n+' will remember this.');txt+=' You take '+l.name+' captive: ransom him or let him go (Hero, Party).';
  FIDS.filter(f=>atWar(f,l.fac)).forEach(f=>addHonor(f,5));addHonor(l.fac,-10);
  return txt;
}
function defeatLord(l){l.inside=null;l.dead=true;l.troops=[];l.back=G.day+4;l.state='rest'}
function fallFaction(f){
  W.dead[f]=true;W.lords.forEach(l=>{if(l.fac===f){l.dead=true;l.gone=true}});FIDS.forEach(g=>{if(g!==f)delete W.rel[rk(f,g)]});
  log('The '+FACS[f].n+' has fallen. Its last holding is lost.','bad');
  if(P.fac===f){P.fac=null;log('Your contract ends with the fall of your employer.','bad')}
}
function resolveSiege(l,t){
  const mine=t.owner==='player',pa=power(l.troops)*lordTac([l])*(.8+Math.random()*.4),pd=power(garList(t).concat(insideTroops(t)))*(mine?2.2:1.8+.8*Math.max(0,FIEF0-fiefsOf(t.owner).length))*(1+.15*(wallOf(t)-t.T.wall0))*(t.stock&&foodDays(t)<2?.6:1)*(.8+Math.random()*.4);
  if(pa>pd){
    const prev=t.owner;cull(l,clamp(.1+.5*(pd/pa)**2,.05,.6));lordWins(l,t.gar||6);lordsInside(t).forEach(o=>{defeatLord(o);log(o.name+' is taken inside the walls of '+t.name+'.',o.fac===P.fac?'bad':'')});t.owner=l.fac;t.gar=4;l.state='rest';
    // conquest leaves its mark: turmoil for a while, and sometimes the victors sack the place
    t.turmoil=G.day+8;breach(t);const sacked=Math.random()<.35;if(sacked){t.sacked=G.day+15;burnEstates(t,2);sackStock(t,.5,.25)}
    log(t.name+' falls to '+l.name+' of the '+FACS[l.fac].n+(sacked?', who sacks it':'')+'.'+(mine?' You have lost your fief.':''),l.fac===P.fac?'good':prev===P.fac||mine?'bad':'gold');
    W.lords.forEach(o=>{if(!o.dead&&o!==l&&o.tgt===t.name)lordThink(o)});
    stayFall(t);
    if(!mine&&!fiefsOf(prev).length)fallFaction(prev);
  }else{cull(l,.55);lordXp(l,6);lordTrain(l,'tact',2);t.gar=Math.max(2,Math.round(t.gar*.6));log('The siege of '+t.name+' fails. '+l.name+' falls back.');lordThink(l)}
}
function worldDay(){
  for(let i=0;i<FIDS.length;i++)for(let j=i+1;j<FIDS.length;j++){
    const a=FIDS[i],b=FIDS[j];if(W.dead[a]||W.dead[b])continue;const r=relOf(a,b),age=G.day-r.since;
    if(r.s==='peace'&&age>=6&&Math.random()<WAR_RATE)setRel(a,b,'war');
    else if(r.s==='war'&&age>=8&&Math.random()<Math.min(.35,.04+(age-8)*.01+(Math.abs(fiefsOf(a).length-fiefsOf(b).length)>=2?.08:0)+(Math.min(fiefsOf(a).length,fiefsOf(b).length)<=1?.25:0)+(econWeary(a)||econWeary(b)?.12:0)))setRel(a,b,'peace');
    else if(r.s==='peace'&&FIDS.some(c=>c!==a&&c!==b&&atWar(a,c)&&atWar(b,c))&&Math.random()<.3)setRel(a,b,'ally');
    else if(r.s==='ally'&&!FIDS.some(c=>c!==a&&c!==b&&atWar(a,c)&&atWar(b,c))&&Math.random()<.2)setRel(a,b,'peace');
  }
  // the realms refill their garrisons a guard a day, paid from the treasury and drafted from the holding's own people
  TOWNS.forEach(t=>{const cap=Math.round(t.T.gar*(until(t,'sacked')?.5:1));if(t.owner&&t.owner!=='player'&&!besieged(t)&&t.gar<cap&&canDraft(t)&&payRealm(t.owner,6,t,1)&&draftLocals(t,1))t.gar++});
  for(const l of W.lords){
    if(l.gone)continue;
    if(l.dead){
      if(G.day<l.back)continue;const own=fiefsOf(l.fac);if(!own.length){l.gone=true;continue}
      const h=own.slice().sort((a,b)=>(b.vol||0)-(a.vol||0))[0];ensureEcon(h);const can=Math.min(9,Math.floor(h.vol||0),Math.floor((h.pop||0)-GUARD_FLOOR));if(can<3||!payRealm(l.fac,90,h,9))continue;
      const raised=[];for(let i=draftLocals(h,can);i>0;i--){const c=RACES[h.races[rint(0,h.races.length-1)]];raised.push(Math.random()<.6?c.melee:c.ranged)}
      Object.assign(l,{dead:false,x:h.x,y:h.y+14,troops:raised,state:'rest',tgt:h.name,cool:3});if(canEnter(l,h))lordEnter(l,h);
      log(l.name+' raises a new army at '+h.name+'.');continue;
    }
    const t=townBy(l.tgt);
    if(l.state==='siege'){if(!t||!atWar(l.fac,t.owner)){lordThink(l);continue}if(inFight(l))continue;
      // the lords inside sally out when they are a match for the besiegers
      const sal=lordsInside(t).filter(o=>!o.fight&&atWar(o.fac,l.fac)),them=siegeLordsAt(t).filter(o=>!o.fight);
      if(sal.length&&power(sal.flatMap(o=>o.troops))>=.9*power(them.flatMap(o=>o.troops))){sal.forEach(o=>{o.inside=null;o.x=t.x;o.y=t.y+12;o.state='rest';o.tgt=t.name});startFight(sal,them);
        if(Math.hypot(t.x-P.x,t.y-P.y)<vis()*1.5||t.owner===P.fac||t.owner==='player')log(sal.map(o=>o.name).join(' and ')+' ride'+(sal.length>1?'':'s')+' out of '+t.name+' to break the siege.');continue}
      if(++l.sd>=2+wallOf(t))resolveSiege(l,t);continue}
    if(l.state==='rest'&&t&&t.owner===l.fac){
      // he hires as you do: the holding's own volunteers, at the price you pay, from his realm's treasury
      for(let k=0,n=3+Math.max(0,FIEF0-fiefsOf(l.fac).length);k<n&&l.troops.length<lcapOf(l)&&canDraft(t);k++){const c=RACES[t.races[rint(0,t.races.length-1)]],r=Math.random(),type=r<.4?c.melee:r<.6?c.shield:c.ranged;if(!partyRoster(asParty(l)).canAdd(type)||!payRealm(l.fac,HIRE[type]||22,t,1))break;draftLocals(t,1);partyAdd(l,type)}
      const k=l.troops.find(x=>UP[x]);if(k&&Math.random()<.7){const u=UP[k],to=u[rint(0,u.length-1)],r=partyRoster(asParty(l));if(r.canAdd(to)||r.groups.find(g=>g.type===k)?.count===1){partyRemove(l,k,1);partyAdd(l,to)}}// (one is trained up)
    }
    if(l.state==='rest'||Math.random()<.35)lordThink(l);
  }
}
// each moment on the map: LordBrain (brains.js)
function lordMeet(l){
  if(hostileTo(l.fac)&&!lordSpares(l))return cornered(l,'lord')?parley(l,'lord'):startEncounter({kind:'lord',ref:l,list:l.troops.slice()});
  G.enc={kind:'lord',ref:l};G.mode=l.inside&&G.scene?'scene':'dialog';P.tx=null;const f=FACS[l.fac];
  const st=hostileTo(l.fac)?'Your realms are at odds, but '+l.name+' will not draw on a friend.':P.fac===l.fac?'You serve the '+f.n+'.':P.fac?'Your employer is at '+(relOf(P.fac,l.fac).s==='ally'?'alliance':'peace')+' with them.':'They have no quarrel with you.';
  showPanel('<h2>'+l.name+'</h2><p class="muted">Lord of the <span style="color:'+f.col+'">'+f.n+'</span>, leading '+l.troops.length+' soldiers (power '+rating(l.troops)+' vs your '+partyPower()+').</p><p class="muted">Level '+lordStats(l).lv+' · renown '+(l.renown||0)+' · Leadership '+lordSkill(l,'lead')+' · Tactics '+lordSkill(l,'tact')+' · Medicine '+lordSkill(l,'med')+' · leads up to '+lcapOf(l)+'.</p><p>'+st+'</p>'+
    relHtml(l)+(l.inside?'<p class="muted">Holding court in '+l.inside+', with '+l.troops.length+' soldiers quartered alongside the garrison.</p>':'')+lordJobHtml(l)+'<div class="btns">'+(P.fac===l.fac||l.inside?'':'<button class="btn" type="button" data-act="lord-attack">Attack</button>')+'</div>'+
    (P.fac===l.fac||l.inside?'':'<p class="muted">Attacking makes the '+f.n+' hostile to you for 20 days.</p>')+nav(null,['lord-leave',null,'Leave']));
}
