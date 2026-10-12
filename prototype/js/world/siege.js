'use strict';
/* ---------- sieges, raids, conquest and its consequences ---------- */
// P.siege = {town, days}: your camp outside a hostile holding. Ladders after LADDER_DAYS let you assault; a ram after RAM_DAYS
// weakens the walls; from STARVE_DAY on the garrison starves, and a garrison of one surrenders.
// Holdings carry: sacked / raided / turmoil (the day each ends). Holdings you own have owner 'player'.
const LADDER_DAYS=2,RAM_DAYS=4,STARVE_DAY=6;
// P.raid = {town, t}: your band plundering a village; it takes RAID_TIME on the map and the village is closed meanwhile
const RAID_TIME=DAY*.5;
const WALLS={castle:4,town:3,village:1};
const FIEF_INCOME={town:25,castle:15,village:8};
const SACK_GOLD={town:300,castle:200,village:80};
const until=(t,k)=>(t[k]||0)>G.day;
const ruined=t=>until(t,'sacked')||until(t,'raided');
// a fief pays its taxes (people x tax rate x prosperity) and market dues; its land feeds it through the economy
const fiefIncome=t=>taxOf(t);
const playerFiefs=()=>TOWNS.filter(t=>t.owner==='player');
const fiefCap=t=>GARCAP[t.kind]+6+3*wallOf(t);
// who holds the walls: the garrison, plus any lord of the owner resting inside
function siegeDefenders(t){const lords=W.lords.filter(l=>!l.dead&&l.fac===t.owner&&l.state==='rest'&&l.tgt===t.name&&Math.hypot(l.x-t.x,l.y-t.y)<40);return{list:garList(t).concat(...lords.map(l=>l.troops)),lords}}
// the lords besieging a holding; while any are (or while you siege or raid it) it is closed: no trade, recruits, jobs or rest
const siegeLordsAt=t=>W.lords.filter(l=>!l.dead&&l.state==='siege'&&l.tgt===t.name);
const myRaid=t=>P.raid&&P.raid.town===t.name?P.raid:null;
const closedNow=t=>siegeLordsAt(t).length>0||!!mySiege(t)||!!myRaid(t);
const mySiege=t=>P.siege&&P.siege.town===t.name?P.siege:null;
// how hard the walls make the defenders: 1 + the wall level (no walls 1 … great walls 4), one less once your ram is built
const siegeLv=t=>Math.max(1,1+wallOf(t)-((mySiege(t)||{days:0}).days>=RAM_DAYS?1:0));
// a besieged holding lives on its stores: the day of the siege its food runs out
const starveDay=t=>((mySiege(t)||{days:0}).days)+foodDays(t);

/* the siege panel */
function openSiege(t){G.lastTown=t;P.tx=null;G.chase=null;G.bes=t;G.mode='besiege';showSiege()}
// a friendly holding under siege by a lord: you may attack the besiegers, nothing else
function showBlockade(t){
  G.bes=t;G.lastTown=t;P.tx=null;G.chase=null;G.mode='besiege';const ls=siegeLordsAt(t),f=FACS[t.owner];
  showPanel('<div class="top"><h2>'+t.name+' is under siege</h2><span class="muted">'+cap1(t.kind)+' of the <span style="color:'+f.col+'">'+f.n+'</span></span></div>'+
    '<p>'+ls.map(l=>l.name+' of the '+FACS[l.fac].n+' ('+l.troops.length+' soldiers, power '+rating(l.troops)+')').join(' and ')+' '+(ls.length>1?'surround':'surrounds')+' the walls.</p>'+
    '<p class="bad">The gates are barred. No trade, no recruits, no work and no rest until the siege is broken.</p><p>Your power <strong>'+partyPower()+'</strong>.'+(t.owner==='player'?' This is your fief.':' Breaking the siege earns the thanks of '+t.name+' and the '+f.n+'.')+'</p>'+
    '<div class="btns">'+ls.map((l,i)=>'<button class="btn'+(i?'':' primary')+'" type="button" data-act="sg-relieve" data-arg="'+i+'">Attack '+l.name+(hostileTo(l.fac)?'':' (the '+FACS[l.fac].n+' turns hostile)')+'</button>').join('')+
    '<button class="btn" type="button" data-act="sg-leave">Leave</button></div>');
}
// your raid in progress
function showRaid(t){
  const r=myRaid(t);G.bes=t;G.mode='besiege';
  showPanel('<div class="top"><h2>Raiding '+t.name+'</h2><span class="muted">'+Math.round(r.t/RAID_TIME*100)+'% plundered</span></div><p>Your band is emptying barns and driving off the herds. Stay close until it is done, or take what you have and go. The '+FACS[t.owner].n+' may send help.</p>'+
    '<div class="btns"><button class="btn primary" type="button" data-act="sg-wait">Keep raiding</button><button class="btn" type="button" data-act="sg-stopraid">Stop and leave with what you have</button></div>');
}
// arriving at a holding: its gates, a siege or a blockade
function approachHolding(t){if(hostileTo(t.owner))openSiege(t);else if(closedNow(t))showBlockade(t);else{G.lastTown=t;enterTown(t)}}
function showSiege(msg){
  const t=G.bes;if(myRaid(t))return showRaid(t);const f=FACS[t.owner],s=mySiege(t),village=t.kind==='village',def=siegeDefenders(t),lv=siegeLv(t),ep=rating(def.list,lv),pp=partyPower(),r=ep/Math.max(1,pp);
  const threat=r<.6?'<span class="good">Easy</span>':r<1?'<span class="gold">Even</span>':r<1.5?'<span class="bad">Risky</span>':'<span class="bad">Deadly</span>';
  const btn=(act,label,why,primary)=>'<button class="btn'+(primary?' primary':'')+'" type="button" data-act="'+act+'"'+(why?' disabled title="'+why+'"':'')+'>'+label+(why?' · '+why:'')+'</button>';
  let body='<p class="muted">Held by the <span style="color:'+f.col+'">'+f.n+'</span>. Garrison '+t.gar+(def.lords.length?', and '+def.lords.map(l=>l.name).join(' and ')+' with '+def.lords.reduce((a,l)=>a+l.troops.length,0)+' soldiers':'')+'.'+
    (wallOf(t)?' '+WALL_N[wallOf(t)]+' make every defender as strong as level '+lv+'.':' It has no walls.')+'</p><p>Defenders\' power <strong>'+ep+'</strong> vs yours <strong>'+pp+'</strong> · threat <strong>'+threat+'</strong></p>',btns='';
  if(!hostileTo(t.owner)){
    body+='<p>The '+f.n+' is not your enemy. Attacking '+t.name+' makes them hostile for 60 days and costs 20 honor with them.</p>'+(P.fac===t.owner?'<p class="bad">You serve the '+f.n+'. You cannot attack your employer\'s holdings.</p>':'');
    btns=btn('sg-declare','Attack '+t.name,P.fac===t.owner?'Your employer':'');
  }else if(village){
    body+='<p>You can raid it for food and coin, or seize it outright. Either way, its people will hate you.</p>';
    btns=btn('sg-raid','Raid',troopCount()<3?'Need 3 troops':'',true)+btn('sg-raid-auto','Raid (auto)',troopCount()<3?'Need 3 troops':'')+btn('sg-assault','Seize it',troopCount()<3?'Need 3 troops':'')+btn('sg-auto','Seize (auto)',troopCount()<3?'Need 3 troops':'');
  }else if(!s){
    body+='<p>Make camp outside the walls. Your band builds ladders in '+LADDER_DAYS+' days and a ram in '+RAM_DAYS+'. Its stores hold food for about '+foodDays(t)+' days; then the garrison starves. The '+f.n+' will send its lords to break the siege.</p>';
    btns=btn('sg-camp','Make siege camp',troopCount()<5?'Need 5 troops':'',true);
  }else{
    body+='<p>Day '+s.days+' of the siege. '+(s.days>=RAM_DAYS?'Ladders and a ram are ready.':s.days>=LADDER_DAYS?'Ladders are ready. The ram needs '+(RAM_DAYS-s.days)+' more days.':'Ladders need '+(LADDER_DAYS-s.days)+' more days.')+
      (foodStock(t)<=0?' The garrison is starving.':' Food inside for about '+foodDays(t)+' more days.')+' Walking away from the walls lifts the siege.</p>';
    const no=s.days<LADDER_DAYS?'No ladders yet':'';
    btns=btn('sg-assault','Assault the walls',no,true)+btn('sg-auto','Assault (auto)',no)+btn('sg-wait','Wait in camp')+btn('sg-lift','Lift the siege');
  }
  showPanel('<div class="top"><h2>'+(s?'Siege of ':'')+t.name+'</h2><span class="muted">'+cap1(t.kind)+' · '+P.gold+' gold</span></div>'+body+(msg?'<p class="gold">'+msg+'</p>':'')+
    '<div class="btns">'+btns+(s?'':'<button class="btn" type="button" data-act="sg-leave">Leave</button>')+'</div>');
}
function startAssault(t,kind,auto){
  const def=siegeDefenders(t),lv=siegeLv(t);G.enc={kind,ref:t,list:def.list,lv,lords:def.lords};G.enc.allies=nearAllies(G.enc);G.enc.foes=nearFoes(G.enc);
  if(auto)return autoResolve();startBattle({enemies:def.list,tournament:false,lv});
}
function siegeAct(a,arg){
  if(!a.startsWith('sg-'))return false;
  const t=G.bes;if(G.mode!=='besiege'||!t)return true;
  if(a==='sg-leave'||a==='sg-wait'){G.mode='world';hidePanel();return true}
  if(a==='sg-relieve'){const l=siegeLordsAt(t)[+arg];if(l){if(!hostileTo(l.fac)){P.hostile[l.fac]=Math.max(P.hostile[l.fac]||0,G.day+20);addHonor(l.fac,-15,true)}startEncounter({kind:'lord',ref:l,list:l.troops.slice()})}return true}
  if(a==='sg-stopraid'&&myRaid(t)){finishRaid(t,myRaid(t).t/RAID_TIME);G.mode='world';hidePanel();return true}
  if(a==='sg-declare'&&P.fac!==t.owner){P.hostile[t.owner]=Math.max(P.hostile[t.owner]||0,G.day+60);addHonor(t.owner,-20);log('You turn your band against '+t.name+'. The '+FACS[t.owner].n+' is now hostile.','bad');showSiege();return true}
  if(!hostileTo(t.owner))return true;
  if(a==='sg-camp'&&t.kind!=='village'&&troopCount()>=5){P.siege={town:t.name,days:0};log('You make camp outside '+t.name+'. The siege begins.','gold');
    W.lords.forEach(l=>{if(!l.dead&&l.fac===t.owner&&l.state!=='siege')lordThink(l)});showSiege();return true}
  if(a==='sg-lift'){P.siege=null;log('You lift the siege of '+t.name+'.');G.mode='world';hidePanel();return true}
  if((a==='sg-assault'||a==='sg-auto')&&(t.kind==='village'?troopCount()>=3:(mySiege(t)||{days:0}).days>=LADDER_DAYS)){startAssault(t,'siege',a==='sg-auto');return true}
  if((a==='sg-raid'||a==='sg-raid-auto')&&t.kind==='village'&&troopCount()>=3){startAssault(t,'raid',a==='sg-raid-auto');return true}
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
  const t=G.capture;G.mode='capture';const f=FACS[t.owner],emp=P.fac&&FACS[P.fac],loot=Math.round(SACK_GOLD[t.kind]*(1+G.day/50));
  const opt=(act,title,sub)=>'<div class="row"><div class="info"><strong>'+title+'</strong><small>'+sub+'</small></div><div class="acts"><button class="btn sm" type="button" data-act="'+act+'">Choose</button></div></div>';
  showPanel('<div class="top"><h2>'+t.name+' has fallen</h2><span class="muted">'+cap1(t.kind)+' of the '+f.n+'</span></div><p>Your soldiers hold the gates. The people of '+t.name+' wait to learn what you will do.</p>'+
    opt('cap-peace',emp?'Take it in peace for the '+emp.n:'Take it in peace and rule it','No looting. Other factions respect your restraint (+3 honor). '+(emp?'Your employer rewards you and it becomes their fief.':'It becomes your fief: about '+taxOf(t)+' gold a day in taxes, but every faction hostile to you will want it.'))+
    opt('cap-sack',emp?'Sack it, then hand it over':'Sack it, then rule it','About '+loot+' gold and goods. Reputation there −40 and −10 in nearby holdings, −6 honor with every faction. The town lies ruined for 20 days.')+
    opt('cap-leave','Sack it and leave','Take the loot and go. The '+f.n+' keeps a ruined, empty '+t.kind+'.')+
    (emp?opt('cap-keep','Keep it for yourself','Break your contract with the '+emp.n+': −30 honor with them, and they turn hostile for 30 days.'):''));
}
function captureAct(a){
  if(!a.startsWith('cap-'))return false;
  const t=G.capture;if(G.mode!=='capture'||!t)return true;
  const prev=t.owner,sack=a==='cap-sack'||a==='cap-leave',lines=[];
  G.capture=null;P.siege=null;breach(t);P.renown+=t.kind==='castle'?30:t.kind==='town'?25:10;
  if(prev!=='player'){P.hostile[prev]=Math.max(P.hostile[prev]||0,G.day+60);addHonor(prev,-15,true)}
  if(sack){const loot=Math.round(SACK_GOLD[t.kind]*(1+G.day/50));P.gold+=loot;P.morale=clamp(P.morale+12,0,100);
    let got=sackStock(t,.5,.3,true);
    addRep(t.name,-40,true);TOWNS.forEach(o=>{if(o!==t&&Math.hypot(o.x-t.x,o.y-t.y)<20*TILE)addRep(o.name,-10,true)});FIDS.forEach(g=>addHonor(g,-6,true));
    t.sacked=G.day+20;const burnt=burnEstates(t,2);lines.push('You sack '+t.name+': '+loot+' gold and '+got+(burnt.length?'. Your soldiers burn its '+burnt.join(' and '):'')+'. Word spreads of what you did.');mood('ransom')}
  else{addRep(t.name,-5,true);FIDS.forEach(g=>{if(g!==prev)addHonor(g,3,true)});lines.push('You spare '+t.name+'. Even your enemies speak of your restraint.')}
  if(a==='cap-leave'){t.gar=1;lines.push('You leave the '+t.kind+' to the '+FACS[prev].n+', empty and burning.')}
  else{
    let to=P.fac&&a!=='cap-keep'?P.fac:'player';
    if(a==='cap-keep'&&P.fac){const e=P.fac;addHonor(e,-30,true);P.fac=null;P.hostile[e]=G.day+30;lines.push('You keep it for yourself. The '+FACS[e].n+' calls you a traitor.')}
    if(to!=='player'){const pay={town:150,castle:200,village:60}[t.kind];P.gold+=pay;addHonor(to,15,true);lines.push('The '+FACS[to].n+' takes '+t.name+' and pays you '+pay+' gold.')}
    else lines.push(t.name+' is your fief now. Garrison it from the Fief tab when you enter.');
    t.owner=to;t.gar=to==='player'?2:4;t.turmoil=G.day+10;
    W.lords.forEach(o=>{if(!o.dead&&o.tgt===t.name)lordThink(o)});
    if(prev!=='player'&&!fiefsOf(prev).length)fallFaction(prev);
  }
  lines.forEach(l=>log(l,'gold'));
  showPanel('<h2>'+t.name+'</h2><p>'+lines.join(' ')+'</p><div class="btns"><button class="btn primary" type="button" data-act="cont">Continue</button></div>');G.mode='dialog';updateHUD(true);
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
  const fs=playerFiefs();if(!fs.length)return;const g=fs.reduce((a,t)=>a+fiefIncome(t),0);P.gold+=g;P.fiefWeek=(P.fiefWeek||0)+g;
  if(G.day%7===0){log('Your fiefs paid '+P.fiefWeek+' gold this week'+(P.tradeWeek?', and their caravans '+P.tradeWeek+' more':'')+'.','gold');P.fiefWeek=0;P.tradeWeek=0}
}
// the Fief tab inside a holding you own
function fiefBody(t){
  const cap=fiefCap(t),row=(title,sub,acts)=>'<div class="row"><div class="info"><strong>'+title+'</strong><small>'+sub+'</small></div><div class="acts">'+acts+'</div></div>';
  const b=(act,arg,label,dis)=>'<button class="btn sm" type="button" data-act="'+act+'" data-arg="'+arg+'"'+(dis?' disabled':'')+'>'+label+'</button>';
  return fiefEconBody(t)+'<p class="muted" style="font-size:13px">'+t.name+' rules '+landOf(t)+' tiles of land, reaching '+landReach(t)+' (grows to '+(LAND_REACH[t.kind]+growCap(t))+' in peace; clear camps nearby to push further).</p><div class="lab">Your fief · '+fiefIncome(t)+' gold a day'+(until(t,'turmoil')?' (halved while in turmoil)':'')+(ruined(t)?' (nothing while it lies ruined)':'')+'</div>'+
    '<p class="muted" style="font-size:13px">Garrison '+t.gar+' / '+cap+'. Factions hostile to you will besiege it, and a weak garrison falls fast.</p>'+
    row('Hire guards','A local guard joins the garrison',b('fief-hire','1','+1 for 30g',P.gold<30||t.gar>=cap)+b('fief-hire','5','+5 for 150g',P.gold<150||t.gar+5>cap))+
    Object.keys(P.troops).filter(k=>P.troops[k]>0).map(k=>row('Station '+ST[k].n.toLowerCase()+'s','You have '+P.troops[k]+'. Each one adds 1 to the garrison.',b('fief-station',k+':1','Station 1',t.gar>=cap)+b('fief-station',k+':5','Station 5',P.troops[k]<5||t.gar+5>cap))).join('')+
    row('Call up a garrison soldier','Takes a '+ST[RACES[t.races[0]].melee].n.toLowerCase()+' into your party',b('fief-callup','1','Take 1',t.gar<=1||partySize()>=partyCap()))+estatesBody(t);
}
function fiefAct(a,arg,t){
  if(!a.startsWith('fief-'))return false;if(t.owner!=='player')return true;const cap=fiefCap(t);
  if(a==='fief-hire'){const n=+arg;if(P.gold>=30*n&&t.gar+n<=cap){P.gold-=30*n;t.gar+=n}}
  else if(a==='fief-station'){const [k,ns]=arg.split(':'),n=Math.min(+ns,P.troops[k]||0,cap-t.gar);if(n>0){P.troops[k]-=n;t.gar+=n;log(n+' '+ST[k].n.toLowerCase()+(n>1?'s':'')+' join the garrison of '+t.name+'.')}}
  else if(a==='fief-build')buildAct(t,arg);
  else if(fiefEconAct(a,arg,t)){}
  else if(a==='fief-callup'){const k=RACES[t.races[0]].melee;if(t.gar>1&&partySize()<partyCap()){t.gar--;P.troops[k]=(P.troops[k]||0)+1}}
  return true;
}
onAct('sg-',siegeAct);onAct('cap-',captureAct);
