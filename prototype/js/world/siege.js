'use strict';
/* ---------- sieges, raids, conquest and its consequences ---------- */
// P.siege = {town, days}: your camp outside a hostile holding. Ladders after LADDER_DAYS let you assault; a ram after RAM_DAYS
// weakens the walls; from STARVE_DAY on the garrison starves, and a garrison of one surrenders.
// Holdings carry: sacked / raided / turmoil (the day each ends). Holdings you own have owner 'player'.
const LADDER_DAYS=2,RAM_DAYS=4,STARVE_DAY=6;
// Any holding with walls (a palisade or better: wallOf) is taken by siege: a camp, ladders, then the assault. One without walls
// (a village that never built them, or a castle whose walls were breached) is raided or seized outright.
const walled=t=>wallOf(t)>0;
// P.raid = {town, t}: your band plundering an unwalled holding; it takes RAID_TIME on the map and the holding is closed meanwhile
const RAID_TIME=DAY*.5;
const until=(t,k)=>(t[k]||0)>G.day;
const ruined=t=>until(t,'sacked')||until(t,'raided');
// a fief pays its taxes (people x tax rate x prosperity) and market dues; its land feeds it through the economy
const fiefIncome=t=>Math.round(taxOf(t)*(1+.03*skill('stew')));// Stewardship adds to what your fiefs pay
const playerFiefs=()=>TOWNS.filter(t=>t.owner==='player');
const fiefCap=t=>t.T.gar+6+3*wallOf(t);
// who holds the walls: the garrison, plus any lord of the owner resting inside
function siegeDefenders(t){const lords=lordsInside(t);return{list:garList(t).concat(...lords.map(l=>l.troops)),lords}}
// the lords besieging a holding; while any are (or while you siege or raid it) it is closed: no trade, recruits, jobs or rest
const siegeLordsAt=t=>W.lords.filter(l=>!l.dead&&l.state==='siege'&&l.tgt===t.name);
const myRaid=t=>P.raid&&P.raid.town===t.name?P.raid:null;
const closedNow=t=>siegeLordsAt(t).length>0||!!mySiege(t)||!!myRaid(t);
const mySiege=t=>P.siege&&P.siege.town===t.name?P.siege:null;
// how hard the walls make the defenders: 1 + the wall level (no walls 1 … great walls 4), one less once your ram is built
const siegeLv=t=>Math.max(1,1+wallOf(t)-((mySiege(t)||{days:0}).days>=RAM_DAYS?1:0));

/* the siege panel */
function openSiege(t){G.lastTown=t;P.tx=null;G.chase=null;G.bes=t;G.mode='besiege';showSiege()}
// a friendly holding under siege by a lord: you may attack the besiegers, nothing else
function showBlockade(t){
  G.bes=t;G.lastTown=t;P.tx=null;G.chase=null;G.mode='besiege';const ls=siegeLordsAt(t),f=FACS[t.owner];
  showPanel('<div class="top"><h2>'+t.name+' is under siege</h2><span class="muted">'+cap1(t.label)+' of the <span style="color:'+f.col+'">'+f.n+'</span></span></div>'+
    '<p>'+ls.map(l=>l.name+' of the '+FACS[l.fac].n+' ('+l.troops.length+' soldiers, power '+l.power()+')').join(' and ')+' '+(ls.length>1?'surround':'surrounds')+' the walls.</p>'+
    '<p class="bad">The gates are barred. No trade, no recruits, no work and no rest until the siege is broken.</p><p>Your power <strong>'+partyPower()+'</strong>.'+(t.owner==='player'?' This is your fief.':' Breaking the siege earns the thanks of '+t.name+' and the '+f.n+'.')+'</p>'+
    '<div class="lab" style="margin-top:6px">Break the siege</div><p class="muted" style="font-size:13px">Fight the besiegers. The garrison'+(lordsInside(t).length?' and '+lordsInside(t).map(l=>l.name).join(' and '):'')+' sally out beside you.</p>'+
    '<div class="btns">'+ls.map((l,i)=>'<button class="btn'+(i?'':' primary')+'" type="button" data-act="sg-relieve" data-arg="'+i+'"'+(P.fac&&P.fac===l.fac?' disabled title="Your employer"':'')+'>Attack '+l.name+(hostileTo(l.fac)?'':' (the '+FACS[l.fac].n+' turns hostile)')+'</button>').join('')+'</div>'+
    joinHtml(t)+nav(null,['sg-leave',null,'Leave']));
}
// joining a siege: storm the walls beside the besiegers of a realm you are not hostile to (not your employer's holding);
// the owner turns hostile, and if you win, the realm that led the siege may have it
const joinFacs=t=>[...new Set(siegeLordsAt(t).filter(l=>!hostileTo(l.fac)).map(l=>l.fac))].filter(f=>f!==t.owner&&P.fac!==t.owner);
function joinHtml(t){const fs=joinFacs(t);if(!fs.length)return '';const no=troopCount()<3?'Need 3 troops':'';
  return '<div class="lab" style="margin-top:6px">Join the siege</div><p class="muted" style="font-size:13px">Storm the walls of '+t.name+' beside the besiegers.'+(hostileTo(t.owner)?'':' The '+FACS[t.owner].n+' turns hostile for 60 days (−20 honor).')+' Win, and the realm that led the siege will pay you to hand it over.</p><div class="btns">'+
    fs.map(f=>'<button class="btn" type="button" data-act="sg-join" data-arg="'+f+'"'+(no?' disabled title="'+no+'"':'')+'>Storm it with the '+FACS[f].n+'</button><button class="btn" type="button" data-act="sg-join-auto" data-arg="'+f+'"'+(no?' disabled':'')+'>(auto)</button>').join('')+'</div>'}
// your raid in progress
function showRaid(t){
  const r=myRaid(t);G.bes=t;G.mode='besiege';
  showPanel('<div class="top"><h2>Raiding '+t.name+'</h2><span class="muted">'+Math.round(r.t/RAID_TIME*100)+'% plundered</span></div><p>Your band is emptying barns and driving off the herds. Stay close until it is done, or take what you have and go. The '+FACS[t.owner].n+' may send help.</p>'+
    '<div class="btns"><button class="btn primary" type="button" data-act="sg-wait">Keep raiding</button><button class="btn" type="button" data-act="sg-stopraid">Stop and leave with what you have</button></div>');
}
// arriving at a holding: its gates, a siege or a blockade
function approachHolding(t){if(hostileTo(t.owner))openSiege(t);else if(closedNow(t))showBlockade(t);else{G.lastTown=t;enterTown(t)}}
function showSiege(msg){
  const t=G.bes;if(myRaid(t))return showRaid(t);const f=FACS[t.owner],s=mySiege(t),village=!walled(t),def=siegeDefenders(t),lv=siegeLv(t),ep=rating(def.list,lv),pp=partyPower(),r=ep/Math.max(1,pp);
  const threat=r<.6?'<span class="good">Easy</span>':r<1?'<span class="gold">Even</span>':r<1.5?'<span class="bad">Risky</span>':'<span class="bad">Deadly</span>';
  const btn=(act,label,why,primary)=>'<button class="btn'+(primary?' primary':'')+'" type="button" data-act="'+act+'"'+(why?' disabled title="'+why+'"':'')+'>'+label+(why?' · '+why:'')+'</button>';
  let body='<p class="muted">Held by the <span style="color:'+f.col+'">'+f.n+'</span>. Garrison '+t.gar+(def.lords.length?', and '+def.lords.map(l=>l.name).join(' and ')+' with '+def.lords.reduce((a,l)=>a+l.troops.length,0)+' soldiers':'')+'.'+
    (wallOf(t)?' '+WALL_N[wallOf(t)]+' make every defender as strong as level '+lv+'.':' It has no walls.')+'</p><p>Defenders\' power <strong>'+ep+'</strong> vs yours <strong>'+pp+'</strong> · threat <strong>'+threat+'</strong></p>',btns='';
  if(!hostileTo(t.owner)){
    body+='<p>The '+f.n+' is not your enemy. Attacking '+t.name+' makes them hostile for 60 days and costs 20 honor with them.</p>'+(P.fac===t.owner?'<p class="bad">You serve the '+f.n+'. You cannot attack your employer\'s holdings.</p>':'');
    btns=btn('sg-declare','Attack '+t.name,P.fac===t.owner?'Your employer':'');
  }else if(village){
    body+='<p>'+t.name+' has no walls. You can raid it for food and coin, or seize it outright. Either way, its people will hate you.</p>';
    btns=btn('sg-raid','Raid',troopCount()<3?'Need 3 troops':'',true)+btn('sg-raid-auto','Raid (auto)',troopCount()<3?'Need 3 troops':'')+btn('sg-assault','Seize it',troopCount()<3?'Need 3 troops':'')+btn('sg-auto','Seize (auto)',troopCount()<3?'Need 3 troops':'');
  }else if(!s){
    body+='<p>Make camp outside the walls. Your band builds ladders in '+LADDER_DAYS+' days and a ram in '+RAM_DAYS+'. Its stores hold food for about '+foodDays(t)+' days; then the garrison starves. The '+f.n+' will send its lords to break the siege.</p>';
    btns=btn('sg-camp','Make siege camp',troopCount()<5?'Need 5 troops':'',true);
    body+=joinHtml(t);
  }else{
    body+='<p>Day '+s.days+' of the siege. '+(s.days>=RAM_DAYS?'Ladders and a ram are ready.':s.days>=LADDER_DAYS?'Ladders are ready. The ram needs '+(RAM_DAYS-s.days)+' more days.':'Ladders need '+(LADDER_DAYS-s.days)+' more days.')+
      (foodStock(t)<=0?' The garrison is starving.':' Food inside for about '+foodDays(t)+' more days.')+' Walking away from the walls lifts the siege.</p>';
    const no=s.days<LADDER_DAYS?'No ladders yet':'';
    btns=btn('sg-assault','Assault the walls',no,true)+btn('sg-auto','Assault (auto)',no)+btn('sg-wait','Wait in camp')+btn('sg-lift','Lift the siege');
    body+=joinHtml(t);
  }
  showPanel('<div class="top"><h2>'+(s?'Siege of ':'')+t.name+'</h2><span class="muted">'+cap1(t.label)+' · '+P.gold+' gold</span></div>'+body+(msg?'<p class="gold">'+msg+'</p>':'')+
    '<div class="btns">'+btns+'</div>'+(s?'':nav(null,['sg-leave',null,'Leave'])));
}
// with: the realm whose siege you join (its besiegers fight beside you; it may have the holding)
function startAssault(t,kind,auto,with_){
  const def=siegeDefenders(t),lv=siegeLv(t);G.capWith=with_||null;G.enc={kind,ref:t,list:def.list,lv,lords:def.lords};G.enc.allies=nearAllies(G.enc);G.enc.foes=nearFoes(G.enc);
  if(auto)return autoResolve();startBattle({enemies:def.list,tournament:false,lv,deploy:true});
}
function siegeAct(a,arg){
  if(!a.startsWith('sg-'))return false;
  const t=G.bes;if(G.mode!=='besiege'||!t)return true;
  if(a==='sg-leave'||a==='sg-wait'){G.mode='world';hidePanel();return true}
  if(a==='sg-relieve'){const l=siegeLordsAt(t)[+arg];if(l){if(!hostileTo(l.fac)){P.hostile[l.fac]=Math.max(P.hostile[l.fac]||0,G.day+20);addHonor(l.fac,-15,true)}startEncounter({kind:'lord',ref:l,list:l.troops.slice()})}return true}
  if(a==='sg-stopraid'&&myRaid(t)){finishRaid(t,myRaid(t).t/RAID_TIME);G.mode='world';hidePanel();return true}
  if((a==='sg-join'||a==='sg-join-auto')&&joinFacs(t).includes(arg)&&troopCount()>=3){
    if(!hostileTo(t.owner)){P.hostile[t.owner]=Math.max(P.hostile[t.owner]||0,G.day+60);addHonor(t.owner,-20,true);log('You join the '+FACS[arg].n+' against '+t.name+'. The '+FACS[t.owner].n+' is now hostile.','bad')}
    startAssault(t,'siege',a==='sg-join-auto',arg);return true}
  if(a==='sg-declare'&&P.fac!==t.owner){P.hostile[t.owner]=Math.max(P.hostile[t.owner]||0,G.day+60);addHonor(t.owner,-20);log('You turn your band against '+t.name+'. The '+FACS[t.owner].n+' is now hostile.','bad');showSiege();return true}
  if(!hostileTo(t.owner))return true;
  if(a==='sg-camp'&&walled(t)&&troopCount()>=5){P.siege={town:t.name,days:0};log('You make camp outside '+t.name+'. The siege begins.','gold');
    W.lords.forEach(l=>{if(!l.dead&&l.fac===t.owner&&l.state!=='siege')lordThink(l)});showSiege();return true}
  if(a==='sg-lift'){P.siege=null;log('You lift the siege of '+t.name+'.');G.mode='world';hidePanel();return true}
  if((a==='sg-assault'||a==='sg-auto')&&(!walled(t)?troopCount()>=3:(mySiege(t)||{days:0}).days>=LADDER_DAYS)){startAssault(t,'siege',a==='sg-auto');return true}
  if((a==='sg-raid'||a==='sg-raid-auto')&&!walled(t)&&troopCount()>=3){startAssault(t,'raid',a==='sg-raid-auto');return true}
  return true;
}
// the day in camp: build, starve them out, and accept a surrender
function siegeDay(){
  const s=P.siege;if(!s)return;const t=townBy(s.town);
  if(!t||!hostileTo(t.owner)){P.siege=null;log('The siege ends: '+(t?t.name+' is no longer held by your enemies.':''));return}
  s.days++;train('eng',4);if(Math.random()<.1*skill('eng')){s.days++;log('Your engineers work fast at '+t.name+'.','good')}
  if(s.days===LADDER_DAYS)log('Ladders are ready at '+t.name+'. You can assault the walls.','gold');
  if(s.days===RAM_DAYS)log('Your ram is built. The walls of '+t.name+' will not hold as well.','gold');
  if(foodStock(t)<=0&&t.gar>1){t.gar--;log('The garrison of '+t.name+' starves. '+t.gar+' defenders left.')}
  if(t.gar<=1&&!siegeDefenders(t).lords.length){log(t.name+' surrenders!','good');P.renown+=5;G.capture=t;t.gar=0}
}
// won the assault or raid (from concludeEncounter); returns a line for the victory panel
function siegeWon(e){
  const t=e.ref;(e.lords||[]).forEach(l=>{if(!l.dead){defeatLord(l);log(l.name+' is beaten inside the walls of '+t.name+'.','good')}});
  if(e.kind==='raid')return startRaid(t);
  t.gar=0;G.capture=t;return ' The gates of '+t.name+' are open. Decide its fate.';
}
// the militia is beaten: the plundering starts, and the village's people and lords know who is doing it
function startRaid(t){
  P.raid={town:t.name,t:0};t.gar=0;P.siege=null;addRep(t.name,-25,true);addHonor(t.owner,-10,true);FIDS.forEach(g=>{if(g!==t.owner)addHonor(g,-2,true)});
  W.lords.forEach(l=>{if(!l.dead&&l.fac===t.owner&&l.state!=='siege')lordThink(l)});
  return ' The militia of '+t.name+' is broken. Your band starts plundering; it takes half a day, and you must stay close. Reputation there −25, honor with the '+FACS[t.owner].n+' −10.';
}
// each moment on the map: plunder on, or give up if you walk away
function raidTick(d){
  const r=P.raid;if(!r)return;const t=townBy(r.town);if(!t){P.raid=null;return}
  if(Math.hypot(P.x-t.x,P.y-t.y)>80){finishRaid(t,r.t/RAID_TIME);return}
  r.t+=d;if(r.t>=RAID_TIME)finishRaid(t,1);
}
// the loot, by how much of the raid you finished; a full raid burns the herds and counts for quests
function finishRaid(t,f){
  f=clamp(f,0,1);P.raid=null;
  ensureEcon(t);const tk=(g,n)=>{n=Math.min(n,t.stock[g]||0);const k=invAdd('good',g,n);t.stock[g]-=n;return k};
  const food=tk('grain',Math.round(rint(10,18)*f))+tk('meat',Math.round(rint(4,10)*f))+tk('cheese',Math.round(rint(0,6)*f)),gold=Math.round((rint(40,80)+G.day)*f);
  t.pop=Math.max(10,Math.round(t.pop*(1-.1*f)));for(const g of FOODS)t.stock[g]=Math.round((t.stock[g]||0)*(1-.4*f));P.gold+=gold;P.morale=clamp(P.morale+5*f,0,100);
  if(f>=.5)W.critters=W.critters.filter(c=>c.home!==t.name);
  t.raided=G.day+12;const burnt=f>=1?burnEstates(t,1):[];
  if(f>=1){log('You raid '+t.name+' to the ground: '+food+' food and '+gold+' gold'+(burnt.length?', and burn its '+burnt.join(' and '):'')+'. Its people will not forget.','bad');questNotify('raid',t)}
  else log('You break off the raid of '+t.name+' with '+food+' food and '+gold+' gold.','bad');
}

/* the fate of a captured holding */
function showCapture(){
  const t=G.capture;G.mode='capture';const f=FACS[t.owner],lead=P.fac||G.capWith,emp=lead&&FACS[lead],led=!P.fac&&!!G.capWith,loot=Math.round(t.T.sack*(1+G.day/50));
  const opt=(act,title,sub)=>'<div class="row"><div class="info"><strong>'+title+'</strong><small>'+sub+'</small></div><div class="acts"><button class="btn sm" type="button" data-act="'+act+'">Choose</button></div></div>';
  showPanel('<div class="top"><h2>'+t.name+' has fallen</h2><span class="muted">'+cap1(t.label)+' of the '+f.n+'</span></div><p>Your soldiers hold the gates. The people of '+t.name+' wait to learn what you will do.</p>'+
    opt('cap-peace',emp?'Take it in peace for the '+emp.n:'Take it in peace and rule it','No looting. Other factions respect your restraint (+3 honor). '+(emp?(led?'The '+emp.n+', who led the siege, pays you and it becomes their fief.':'Your employer rewards you and it becomes their fief.'):'It becomes your fief: about '+taxOf(t)+' gold a day in taxes, but every faction hostile to you will want it.'))+
    opt('cap-sack',emp?'Sack it, then hand it over':'Sack it, then rule it','About '+loot+' gold and goods. Reputation there −40 and −10 in nearby holdings, −6 honor with every faction. The town lies ruined for 20 days.')+
    opt('cap-leave','Sack it and leave','Take the loot and go. The '+f.n+' keeps a ruined, empty '+t.label+'.')+
    (emp?opt('cap-keep','Keep it for yourself',led?'The '+emp.n+' led the siege and will resent it: −15 honor with them.':'Break your contract with the '+emp.n+': −30 honor with them, and they turn hostile for 30 days.'):''));
}
function captureAct(a){
  if(!a.startsWith('cap-'))return false;
  const t=G.capture;if(G.mode!=='capture'||!t)return true;
  const prev=t.owner,sack=a==='cap-sack'||a==='cap-leave',lines=[];
  G.capture=null;P.siege=null;breach(t);P.renown+=t.T.renown;
  if(prev!=='player'){P.hostile[prev]=Math.max(P.hostile[prev]||0,G.day+60);addHonor(prev,-15,true)}
  if(sack){const loot=Math.round(t.T.sack*(1+G.day/50));P.gold+=loot;P.morale=clamp(P.morale+12,0,100);
    let got=sackStock(t,.5,.3,true);
    addRep(t.name,-40,true);TOWNS.forEach(o=>{if(o!==t&&Math.hypot(o.x-t.x,o.y-t.y)<20*TILE)addRep(o.name,-10,true)});FIDS.forEach(g=>addHonor(g,-6,true));
    t.sacked=G.day+20;const burnt=burnEstates(t,2);lines.push('You sack '+t.name+': '+loot+' gold and '+got+(burnt.length?'. Your soldiers burn its '+burnt.join(' and '):'')+'. Word spreads of what you did.');mood('ransom')}
  else{addRep(t.name,-5,true);FIDS.forEach(g=>{if(g!==prev)addHonor(g,3,true)});lines.push('You spare '+t.name+'. Even your enemies speak of your restraint.')}
  if(a==='cap-leave'){t.gar=1;lines.push('You leave the '+t.label+' to the '+FACS[prev].n+', empty and burning.')}
  else{
    const lead=P.fac||G.capWith;let to=lead&&a!=='cap-keep'?lead:'player';
    if(a==='cap-keep'&&!P.fac&&G.capWith){addHonor(G.capWith,-15,true);lines.push('You keep it for yourself. The '+FACS[G.capWith].n+', who led the siege, will not forget it.')}
    if(a==='cap-keep'&&P.fac){const e=P.fac;addHonor(e,-30,true);P.fac=null;P.hostile[e]=G.day+30;lines.push('You keep it for yourself. The '+FACS[e].n+' calls you a traitor.')}
    if(to!=='player'){const pay=t.T.handover;P.gold+=pay;addHonor(to,15,true);lines.push('The '+FACS[to].n+' takes '+t.name+' and pays you '+pay+' gold.')}
    else lines.push(t.name+' is your fief now. Garrison it from the Fief tab when you enter.');
    t.owner=to;t.gar=to==='player'?2:4;t.turmoil=G.day+10;
    W.lords.forEach(o=>{if(!o.dead&&o.tgt===t.name)lordThink(o)});
    if(prev!=='player'&&!fiefsOf(prev).length)fallFaction(prev);
  }
  G.capWith=null;
  lines.forEach(l=>log(l,'gold'));
  showPanel('<h2>'+t.name+'</h2><p>'+lines.join(' ')+'</p>'+nav(null,['cont',null,'Continue']));G.mode='dialog';updateHUD(true);
  return true;
}
// fiefs pay every day; a weekly note in the log
// sacking: the soldiers carry off what fits of the most valuable stock, the rest of share is burned; people flee or die
function sackStock(t,share,killed,mine){
  ensureEcon(t);const taken=[];
  const gs=Object.keys(t.stock).filter(g=>t.stock[g]>0).sort((a,b)=>GOODS[b].base*t.stock[b]-GOODS[a].base*t.stock[a]);
  for(const g of gs){const n=Math.floor(t.stock[g]*share);t.stock[g]-=n;if(mine&&taken.length<3&&n>0){const k=invAdd('good',g,Math.min(n,20));if(k)taken.push(k+' '+GOODS[g].n.toLowerCase())}}
  t.pop=Math.max(10,Math.round(t.pop*(1-killed)));t.pros=Math.max(0,t.pros-30);
  return taken.join(', ')||'little else';
}
function fiefDay(){
  const fs=playerFiefs();if(!fs.length)return;train('stew',1.5*fs.length);const g=fs.reduce((a,t)=>a+fiefIncome(t),0);P.gold+=g;P.fiefWeek=(P.fiefWeek||0)+g;
  if(G.day%7===0){log('Your fiefs paid '+P.fiefWeek+' gold this week'+(P.tradeWeek?', and their caravans '+P.tradeWeek+' more':'')+'.','gold');P.fiefWeek=0;P.tradeWeek=0}
}
// the Fief tab inside a holding you own
function fiefBody(t){
  const cap=fiefCap(t),row=(title,sub,acts)=>'<div class="row"><div class="info"><strong>'+title+'</strong><small>'+sub+'</small></div><div class="acts">'+acts+'</div></div>';
  const b=(act,arg,label,dis)=>'<button class="btn sm" type="button" data-act="'+act+'" data-arg="'+arg+'"'+(dis?' disabled':'')+'>'+label+'</button>';
  return fiefEconBody(t)+'<p class="muted" style="font-size:13px">'+t.name+' rules '+landOf(t)+' tiles of land, reaching '+landReach(t)+' (grows to '+(t.T.reach+growCap(t))+' in peace; clear camps nearby to push further).</p><div class="lab">Your fief · '+fiefIncome(t)+' gold a day'+(until(t,'turmoil')?' (halved while in turmoil)':'')+(ruined(t)?' (nothing while it lies ruined)':'')+'</div>'+
    '<p class="muted" style="font-size:13px">Garrison '+t.gar+' / '+cap+': hire, station and call up soldiers in the Garrison tab.</p>'+estatesBody(t);
}
/* the Garrison tab: everyone who would defend a holding, how well, and for how long; in your own fief, its soldiers */
function garrisonBody(t){
  const row=(title,sub,acts,own)=>'<div class="row"><div class="info"><strong>'+title+'</strong><small>'+sub+'</small></div>'+(own!=null?'<span class="own">'+own+'</span>':'')+(acts?'<div class="acts">'+acts+'</div>':'')+'</div>';
  const b=(act,arg,label,why)=>'<button class="btn sm" type="button" data-act="'+act+'" data-arg="'+arg+'"'+(why?' disabled title="'+why+'"':'')+'>'+label+'</button>';
  const mine=t.owner==='player',cap=mine?fiefCap(t):t.T.gar,def=siegeDefenders(t),lv=siegeLv(t),wl=wallOf(t),pt=patrolOf(t),gl=garList(t),fd=t.stock?foodDays(t):null;
  const groups=list=>Object.entries(countsOf(list)).sort((a,b)=>b[1]-a[1]);
  const lab=s=>'<div class="lab" style="margin-top:6px">'+s+'</div>';
  // the numbers that decide a siege
  let html='<div class="loot-stats" style="margin-bottom:4px">'+[['Garrison',t.gar+' / '+cap],['Lords inside',def.lords.length+(def.lords.length?' ('+def.lords.reduce((a,l)=>a+l.troops.length,0)+' soldiers)':'')],['Defenders',def.list.length],
      ['Defence power',rating(def.list,lv)],['Walls',WALL_N[wl]],['Food',fd==null?'—':fd+' days']].map(([n,v])=>'<span><b>'+n+'</b><span>'+v+'</span></span>').join('')+'</div>'+
    '<p class="muted" style="font-size:13px">'+(wl?WALL_N[wl]+' make every defender fight as level '+lv+'; a lord\'s siege takes '+(2+wl)+' days.':'No walls: defenders fight as they are, and a lord\'s siege takes 2 days.')+
      (fd!=null?' Its stores feed the garrison'+(def.lords.length?' and the lords\' soldiers':'')+' for about '+fd+' days under siege.':'')+'</p>';
  // its state
  const notes=[besieged(t)&&'<span class="bad">Under siege'+(siegeLordsAt(t).length?' by '+siegeLordsAt(t).map(l=>l.name).join(' and '):mySiege(t)?' by you':'')+'.</span>',
    until(t,'sacked')&&'<span class="bad">Sacked: the garrison is held at half until day '+t.sacked+'.</span>',until(t,'turmoil')&&'<span class="gold">In turmoil after changing hands, until day '+t.turmoil+'.</span>',
    !mine&&crimeAt(t)&&'<span class="bad">The guards want you for a crime here: '+crimeAt(t).fine+' gold, until day '+crimeAt(t).until+'.</span>'].filter(Boolean);
  if(notes.length)html+='<p style="font-size:14px">'+notes.join(' ')+'</p>';
  // the soldiers on the walls
  html+=lab('On the walls · '+t.gar+' '+t.races.map(r=>RACES[r].n).join(' and ')+' soldiers'+(mine?'':' ('+(t.gar<cap?'refilling to '+cap:'full')+')'))+
    (gl.length?groups(gl).map(([k,n])=>{const s=ST[k];return row(s.n,'Tier '+s.tier+' · '+s.hp+' hp · '+s.dmg+' damage'+(s.range?' · ranged':'')+'<br><span class="vs">'+vsLine(s)+'</span>',null,'×'+n)}).join(''):'<p class="muted">No one holds the walls.</p>');
  // lords staying, and the patrol out on the land
  html+=lab('Lords inside')+(def.lords.length?def.lords.map(l=>{const tr=groups(l.troops);return row(l.name+' · <span style="color:'+FACS[l.fac].col+'">'+FACS[l.fac].n+'</span>',
      l.troops.length+' soldiers: '+tr.slice(0,4).map(([k,n])=>n+' '+ST[k].n.toLowerCase()).join(', ')+(tr.length>4?'…':'')+' · toward you '+relTag(relWith(l)),null,'power '+l.power())}).join(''):'<p class="muted">'+(mine?'None: your fief is held by its garrison alone.':'None. A lord of the '+(FACS[t.owner]||{n:'realm'}).n+' resting here would go inside and defend it.')+'</p>');
  html+=lab('Patrol')+(pt?row(pt.troops.length+' guards out on the land','Back by day '+pt.back+(pt.fight?' · <span class="bad">fighting now</span>':'')+' · '+(d=>d<1?'by the gate':d+(d===1?' tile ':' tiles ')+compass(pt.x-t.x,pt.y-t.y))(Math.round(Math.hypot(pt.x-t.x,pt.y-t.y)/TILE))+'. They rejoin the garrison when they return.',null,'power '+pt.power()):
    '<p class="muted">None out'+(t.gar<t.T.patrol.keep+t.T.patrol.size?': the garrison needs '+(t.T.patrol.keep+t.T.patrol.size)+' before it can spare '+t.T.patrol.size+' to ride the land.':'; one rides out each day it can spare the soldiers.')+'</p>');
  // in your fief: hire, station and call up
  if(mine){const cu=ST[RACES[t.races[0]].melee].n.toLowerCase();
    html+=lab('Your soldiers here')+
      (()=>{const v=Math.max(0,Math.min(Math.floor(t.vol||0),Math.floor((t.pop||0)-GUARD_FLOOR)));return row('Hire guards','A local volunteer joins the garrison and leaves the townsfolk ('+v+' willing now; more come as '+t.name+' grows and prospers).',b('fief-hire','1','+1 for 30g',P.gold<30?'Not enough gold':t.gar>=cap?'The garrison is full':v<1?'No volunteers left':'')+b('fief-hire','5','+5 for 150g',P.gold<150?'Not enough gold':t.gar+5>cap?'No room for 5':v<5?'Only '+v+' volunteers':''))})()+
      Object.keys(P.troops).filter(k=>P.troops[k]>0).map(k=>row('Station '+ST[k].n.toLowerCase()+'s','You have '+P.troops[k]+'. Each one adds 1 to the garrison.',b('fief-station',k+':1','Station 1',t.gar>=cap?'The garrison is full':'')+b('fief-station',k+':5','Station 5',P.troops[k]<5?'You have fewer than 5':t.gar+5>cap?'No room for 5':''))).join('')+
      row('Call up a garrison soldier','Takes '+an(cu)+' into your party.',b('fief-callup','1','Take 1',t.gar<=1?'The walls need someone':partySize()>=partyCap()?'Your band is full':''));
  }
  return html;
}
function fiefAct(a,arg,t){
  if(!a.startsWith('fief-'))return false;if(t.owner!=='player')return true;
  if(a==='fief-hire'){const n=+arg;if(garrisons.canHire(t,n)){const k=garrisons.hire(t,n);if(k<n)log('Only '+k+' of the people of '+t.name+' will take up arms.','bad')}}
  else if(a==='fief-station'){const [k,ns]=String(arg).split(':'),n=garrisons.station(t,k,+ns);if(n>0)log(n+' '+ST[k].n.toLowerCase()+(n>1?'s':'')+' join the garrison of '+t.name+'.')}
  // a new estate is placed by hand on the map; an upgrade or the walls start at once
  else if(a==='fief-build'){if(ESTATES[arg]&&!bldLv(t,arg)&&!lotAt(t,arg)){const c=bldCost(arg,1);if(!t.work&&bldCap(t,arg)&&needsMet(t,arg)&&P.gold>=c&&!matsLacking(t,ESTATE_MAT(arg,1)).length)startPlace(t,arg)}else buildAct(t,arg)}
  else if(a==='fief-house'){if(!t.work&&P.gold>=HOUSE_COST.gold&&!matsLacking(t,HOUSE_COST.mats).length)startPlace(t,'house')}
  else if(a==='fief-demolish'){demolish(t,arg==='house'?(t.lots||[]).filter(l=>l.k==='house'&&l.st==='built').pop():lotAt(t,arg))}
  else if(fiefEconAct(a,arg,t)){}
  else if(a==='fief-callup')garrisons.callup(t);
  return true;
}
onAct('sg-',siegeAct);onAct('cap-',captureAct);
