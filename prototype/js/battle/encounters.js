'use strict';
/* ---------- encounters ---------- */
// fighting strength: each unit counts as √(health × damage per second), so numbers matter as much as one strong fighter
const power=list=>list.reduce((a,t)=>{const s=t==='hero'?heroStats():ST[t];return a+Math.sqrt(s.hp*s.dmg/s.cd)*(s.range?1.15:1)*(s.breath?1.45:1)},0);
const lvPow=lv=>Math.sqrt(lvMul(lv||1));
const rating=(list,lv)=>Math.round(power(list)*lvPow(lv));
const partyPower=()=>rating(playerList());
// stance: how a roaming party judges you from its power against yours
const ATTACK_AT=.8,FLEE_AT=.5,STANCE_COL={attack:'#ff9a90',wary:'#e8d8a0',afraid:'#78c474'};
const stance=pw=>{const r=pw/Math.max(1,partyPower());return r>=ATTACK_AT?'attack':r>=FLEE_AT?'wary':'afraid'};
const bandPower=b=>b.pw||(b.pw=rating(b.list||(b.list=makeEnemies(b.n,false,b.kind)),chiefLv(b)));// (its chieftain hardens it, leaders.js)
const monPower=m=>m.pw||(m.pw=rating(Array(m.n).fill(MONSTERS[m.id].unit),m.lv));
// move a party for one frame by its stance: hunt, keep its distance, or run
function stanceMove(o,st,dist,dx,dy,see,sp,canHunt){
  if(P.stay)return false;
  if(st==='attack'&&canHunt&&dist<see){if(!(G.encCool>0&&dist<GRACE_GAP))walk(o,dx,dy,Math.min(dist,sp));return true}// (the grace after a fight: they keep a few steps off)
  if(st==='afraid'&&dist<see){walk(o,-dx,-dy,sp*.85);o.fled=true;return true}
  if(st==='wary'&&dist<see*.45){walk(o,-dx,-dy,sp*.5);return true}
  return false;
}
function playerList(){const a=['hero',...Object.keys(P.comps)];for(const k in P.troops)for(let i=0;i<P.troops[k];i++)a.push(k);return a}
const BANDS={bandits:['Bandits ahead','raiders'],raiders:['Desert raiders','raiders'],bog:['Bog raiders','raiders']};
function makeEnemies(n,camp,band){
  const a=[];
  for(let i=0;i<n;i++){const r=Math.random();if(Math.random()<.08){a.push(band==='raiders'||band==='bog'?'orc_shaman':'hedge');continue}
    if(band==='raiders')a.push(r<.4?'orc_thrower':r<.7?'militia':'orc_grunt');
    else if(band==='bog')a.push(r<.4?'orc_grunt':r<.7?'orc_thrower':'militia');
    else a.push(r<.42?'militia':r<.58?'orc_grunt':r<.8?'archer':'spearman')}
  if(camp)a.push('chief');return a;
}
/* reinforcements: lords near the fight join it. Your friends (your employer, its allies, or a faction that honors you, 25+)
   help against bandits and beasts, and against an enemy their faction is at war with; an enemy lord's own faction and allies join him. */
const REINF_R=110,REINF_MAX=2;
const friendFac=f=>!hostileTo(f)&&(!!P.fac&&(f===P.fac||relOf(f,P.fac).s==='ally')||honorWith(f)>=25);
const foeFac=e=>e.kind==='lord'||e.kind==='caravan'||e.kind==='estate'||e.kind==='patrol'?e.ref.fac:e.kind==='siege'||e.kind==='raid'?e.ref.owner:null;
// the holding a fight is over: the one you storm or raid, or the one the lord you fight is besieging (or riding to relieve)
const siegeTown=e=>e.kind==='siege'||e.kind==='raid'?e.ref.name:e.kind==='lord'&&(e.ref.state==='siege'||e.ref.state==='relieve')?e.ref.tgt:null;
// lords near you who could take part: free lords, plus, in a fight over a siege, its besiegers and the lords holding its walls
const nearLords=(e,ok)=>{const st=siegeTown(e);return W.lords.filter(l=>!l.dead&&(!l.inside||st&&l.inside===st&&e.kind==='lord')&&l!==e.ref&&!(e.lords||[]).includes(l)&&l.troops.length>=3&&(l.state!=='siege'||l.tgt===st)&&Math.hypot(l.x-P.x,l.y-P.y)<REINF_R&&ok(l)).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y)).slice(0,REINF_MAX+(st?2:0))};
function nearAllies(e){if(e.kind==='tourney')return[];const ff=foeFac(e),st=siegeTown(e);return nearLords(e,l=>(friendFac(l.fac)||lordHelps(l)||st&&(l.tgt===st&&l.state==='siege'||l.inside===st))&&(!ff||ff!=='player'&&atWar(l.fac,ff)))}
function nearFoes(e){const ff=foeFac(e),st=siegeTown(e);if(!ff||ff==='player')return[];return nearLords(e,l=>(l.fac===ff||relOf(l.fac,ff).s==='ally')&&(hostileTo(l.fac)||st&&l.tgt===st&&l.state==='siege'))}
const lordTroops=ls=>ls.flatMap(l=>l.troops);
const ofFac=l=>l.fac&&FACS[l.fac]?' of the '+FACS[l.fac].n:'';
function reinfHtml(e){
  return (e.allies.length?'<p class="good">At your side: '+e.allies.map(l=>l.name+ofFac(l)+' ('+l.troops.length+')').join(', ')+'.</p>':'')+
    (e.foes.length?'<p class="bad">'+(e.kind==='field'?'Against you: ':'Riding to help them: ')+e.foes.map(l=>l.name+ofFac(l)+' ('+l.troops.length+')').join(', ')+'.</p>':'');
}
// after the fight: the enemy's helpers are routed if you win; your helpers thank you, and anyone left with too few troops
// goes home. Forces other than lords (patrols, bands, caravans in a battle you joined) are written back to their parties.
function reinfAfter(e,win){
  syncForces(e.foes);syncForces(e.allies);
  for(const l of e.foes||[]){if(l.dead||l.kind==='garrison')continue;if(win){if(!l.src)rippleRel(l,RELATION.beatThem,'you beat them in battle');const t=routForce(l,true);if(t)e.spoils=(e.spoils||'')+t;log(l.name+' is routed with the rest.','good')}else (l.src||l).cool=4}
  for(const l of e.allies||[]){if(l.dead||l.kind==='garrison')continue;if(l.troops.length<(l.src?1:3)){routForce(l,false);log(l.name+' has too few soldiers left and goes home.','bad')}else{(l.src||l).cool=4;if(win&&l.fac&&l.fac!=='player')addHonor(l.fac,3,true)}}
  if(win){const ls=(e.allies||[]).filter(l=>!l.src&&!l.dead);ls.forEach(l=>changeRel(l,RELATION.fightBeside,'you fought beside them'));ls.forEach((a,i)=>ls.slice(i+1).forEach(b=>changeLordRel(a,b,RELATION.together)))}
  const facs=[...new Set((e.allies||[]).filter(l=>l.fac&&l.fac!=='player').map(l=>FACS[l.fac].n))];
  if(win&&(e.allies||[]).length)log('You fought beside '+e.allies.map(l=>l.name).join(' and ')+'.'+(facs.length?' The '+facs.join(' and ')+' will remember it.':''),'good');
}
function startEncounter(e){
  if(e.mine==null)e.mine=!!G.youAttack;G.youAttack=false;if(e.lv==null&&e.ref&&e.ref.ld)e.lv=chiefLv(e.ref);// did you start it (you may call that off)? a chieftain's band fights at its level
  e.list=e.list||makeEnemies(e.n,e.kind==='camp',e.band);const env=battleEnv(),ground='<p class="muted">Battleground: '+env.name+'. '+env.text+'</p>',band=BANDS[e.band||'bandits'];G.enc=e;G.mode='dialog';P.tx=null;G.chase=null;
  const given=!!e.allies;e.allies=e.allies||nearAllies(e);e.foes=e.foes||nearFoes(e);
  if(!given&&e.kind!=='tourney')for(const p of cparties())if(!p.fight&&!p.inside&&Math.hypot(p.x-P.x,p.y-P.y)<REINF_R)e.allies.push(forceOf(p));// your companions' parties
  // the garrison sallies: beside you when you fight a holding's besiegers, against you when an army comes to relieve your siege
  if(!given&&e.kind==='lord'){const t=townBy(e.ref.tgt);if(t&&t.gar>0){if(e.ref.state==='siege'&&!hostileTo(t.owner)&&t.owner!=='player')e.allies.push(garrisonForce(t));else if(e.ref.state==='relieve'&&mySiege(t))e.foes.push(garrisonForce(t))}}
  const ratio=(power(e.list)*lvPow(e.lv)+power(lordTroops(e.foes)))/(power(playerList())+power(lordTroops(e.allies))),threat=ratio<.6?'Easy':ratio<1?'Even':ratio<1.5?'Risky':'Deadly';
  const vm=vitals(),hurt=reinfHtml(e)+(P.hp<vm[0]*.6?'<p class="bad">You are wounded: '+Math.round(P.hp)+' / '+vm[0]+' health. Rest at an inn or travel to recover.</p>':''),cls=ratio<.6?'good':ratio<1?'gold':'bad',vs='Your power <strong>'+partyPower()+'</strong> vs <strong>'+rating(e.list,e.lv)+'</strong> · threat <strong class="'+cls+'">'+threat+'</strong>',lord=e.kind==='lord'&&e.ref,f=lord&&FACS[lord.fac];
  if(e.kind==='monster'||e.kind==='cave'){const M=MONSTERS[e.ref.id],u=ST[M.unit],Y=M.mythic;
    const finds=[M.mat&&'Trophy: '+MATS[M.mat].n+'.',M.gear.length&&'Rare finds: '+M.gear.map(([it])=>'<span style="color:'+RARITY[ITEMS[it].r]+'">'+ITEMS[it].n+'</span>').join(', ')+'.',Y&&Y.hoard&&'It guards a hoard of about '+Y.hoard.gold+' gold.'].filter(Boolean).join(' ');
    return showPanel('<h2>'+(Y?Y.title:(e.kind==='cave'?e.ref.name+': ':'')+M.n+' <span class="muted">· level '+e.lv+'</span>')+'</h2><p>'+M.d+'</p><p>'+e.list.length+' × '+u.n+' ('+u.hp+' hp'+(e.lv>1?', stronger with level':'')+'). '+vsLine(u)+'. You have <strong>'+playerList().length+'</strong> fighters.</p>'+ground+
      (finds?'<p class="muted">'+finds+'</p>':'')+hurt+'<p>'+vs+'</p>'+
      '<div class="btns"><button class="btn primary" type="button" data-act="fight">Fight</button><button class="btn" type="button" data-act="auto">Auto-resolve</button>'+fleeBtn(e)+'</div>')}
  if(e.kind==='field')return showPanel('<h2>'+e.title+'</h2><p>You ride into the battle'+(e.allies.length?' beside '+e.allies.map(l=>l.name).join(', '):'')+'.</p>'+ground+hurt+'<p>'+vs+'</p><div class="btns"><button class="btn primary" type="button" data-act="fight">Fight</button><button class="btn" type="button" data-act="auto">Auto-resolve</button><button class="btn" type="button" data-act="flee">Leave them to it</button></div>');
  showPanel('<h2>'+(e.title?e.title:lord?lord.name+' attacks':e.kind==='camp'?e.ref.name||'Bandit camp':band[0])+'</h2>'+(lord?'<p class="muted">An army of the <span style="color:'+f.col+'">'+f.n+'</span>.</p>':'')+'<p>Scouts count about <strong>'+e.list.length+'</strong> '+(lord||e.kind==='estate'||e.kind==='caravan'||e.kind==='patrol'?'soldiers':band[1]+(e.kind==='camp'?' and a chieftain':''))+'.'+ground+' You have <strong>'+playerList().length+'</strong> fighters, including yourself.</p>'+hurt+'<p>'+vs+'</p><div class="btns"><button class="btn primary" type="button" data-act="fight">Fight</button><button class="btn" type="button" data-act="auto">Auto-resolve</button>'+fleeBtn(e)+'</div>');
}
/* fleeing is a real escape. A fight you started (you rode at them, or you are storming, raiding or joining a battle) you can
   simply call off, as you can with a foe that is afraid of you. Otherwise it is a race: your band's speed on this ground (a big
   band is slower, low morale slower still) against theirs, helped by night and by cover. Some fights cannot be fled: a foe far
   faster than you, or more of them closing in around you. Caught, your rearguard pays and you must fight. Got away, they lose
   your trail for a while and go back to their own business. */
const mySpeed=()=>MAP_BASE*travelMul()*(P.morale<25?.8:1);
function chaserSpeed(e){const o=e.ref,k=e.kind,at=Math.max(.45,speedAt(P.x,P.y)||1);
  if(k==='monster'&&MONSTERS[o.id].mythic)return MONSTERS[o.id].mythic.speed[1];
  if(k==='lord')return lordSpeed(o);if(k==='party')return partySpeed(o,o.list||[]);if(k==='patrol')return partySpeed(o,o.troops)*.75*1.25;
  return (k==='camp'?30:k==='caravan'?CARAVAN_SPD:k==='estate'?22:26)*at}
function fleeOdds(e){
  if(['siege','raid','field','tourney','cave'].includes(e.kind)||e.mine&&!(e.ref&&e.ref.sab))return{leave:true,ch:1};
  const pw=e.kind==='lord'?rating(e.ref.troops):e.kind==='party'?bandPower(e.ref):e.kind==='patrol'?rating(e.ref.troops):null;if(pw!=null&&stance(pw)==='afraid')return{leave:true,ch:1};
  if(e.noFlee)return{ch:0,why:'They caught you'};
  if((e.foes||[]).length)return{ch:0,why:'More of them are closing in around you'};
  if(e.kind==='monster'&&MONSTERS[e.ref.id].mythic&&MONSTERS[e.ref.id].mythic.fly)return{ch:0,why:'It is on the wing: nothing outruns it'};
  const my=mySpeed(),th=chaserSpeed(e);if(th>=my*1.2)return{ch:0,why:'They are far faster than your band'};
  const rough=terrAt(P.x,P.y)===T_FOREST||terrAt(P.x,P.y)===T_HILL,night=darkness()>.5,feet=mountDef()?.01*skill('ride'):.01*skill('athl');
  return{ch:clamp(.45+1.0*(my/th-1)+(night?.1:0)+(hiddenAt(P.x,P.y)?.1:0)+feet+(has('vanish')&&(rough||night)?.15:0),.1,.9)};
}
// the button: Leave, Flee with its odds, or why you cannot
function fleeBtn(e,label){const od=fleeOdds(e);if(od.leave)return '<button class="btn" type="button" data-act="flee">'+(label||'Leave')+'</button>';
  return '<button class="btn" type="button" data-act="flee"'+(od.ch<=0?' disabled title="'+od.why+'"':'')+'>Flee · '+(od.ch<=0?od.why:Math.round(od.ch*100)+'% to get away')+'</button>'}
function flee(){
  const e=G.enc;if(!e)return;const o=e.ref,od=fleeOdds(e);if(!od.leave&&od.ch<=0)return;
  if(!od.leave&&Math.random()>=od.ch){// they run you down: the rearguard pays, and you must fight
    const all=[];for(const k in P.troops)for(let i=0;i<P.troops[k];i++)all.push(k);const n=all.length?Math.max(1,Math.round(all.length*.1*(has('rearguard')?.5:1))):0,lost={};
    for(let i=0;i<n;i++){const k=all.splice(rint(0,all.length-1),1)[0];lost[k]=(lost[k]||0)+1}applyLosses(lost);e.noFlee=true;
    log('They run you down'+(n?': your rearguard loses '+lossText(lost):'')+'. You must fight.','bad');mood('flee');return startEncounter(e)}
  let dx=P.x-o.x,dy=P.y-o.y;const l=Math.hypot(dx,dy)||1;
  walk(P,dx/l,dy/l,od.leave?40:56);if(e.kind!=='camp')o.cool=od.leave?6:12;G.encCool=od.leave?4:3;// got away: they lose your trail for a while
  if(!od.leave)P.morale=clamp(P.morale-2,0,100);G.enc=null;G.mode='world';hidePanel();log(od.leave?'You leave them be.':'You get away.');if(!od.leave)mood('flee');
}
// experience: yours (leaders.js), and your companions share what you learn
function gainXp(n){leaderOf(P).gainXp(n);for(const id of compsInBand())compXp(id,n)}
function applyLosses(lost){for(const k in lost)P.remove(k,lost[k])}
function lossText(lost){const k=Object.keys(lost).filter(x=>lost[x]>0);return k.length?k.map(x=>lost[x]+' '+ST[x].n.toLowerCase()).join(', '):'none'}
// after a battle: Medicine brings some of the fallen straight back; of the rest, some live but are wounded (more with Medicine):
// they leave the ranks and ride with the band until they heal (woundedDay)
function heal(lost){
  let saved=0,total=0,hurt=0;const ch=.07*skill('med'),wc=Math.min(.7,.25+.04*skill('med'));P.wounded=P.wounded||{};
  for(const k in lost){total+=lost[k];for(let i=lost[k];i>0;i--){if(Math.random()<ch){lost[k]--;saved++}else if(ST[k]&&!ST[k].beast&&Math.random()<wc){P.wounded[k]=(P.wounded[k]||0)+1;hurt++}}}
  train('med',total*2);if(hurt)log(hurt+' of your fallen live, wounded: they ride with the band until they heal.','gold');return saved;
}
function takePrisoners(slain){
  let n=0;const pool=slain.filter(k=>ST[k].tier<4&&!ST[k].beast),want=Math.round(pool.length*.35);
  while(n<want&&pool.length&&prisonerCount()<prisonCap()){const k=pool.splice(rint(0,pool.length-1),1)[0];P.prisoners[k]=(P.prisoners[k]||0)+1;n++}
  return n;
}
/* what winning brings: every fight pays gold per foe, renown, XP and morale; then each kind of encounter has its own outcome.
   big: a hard-won fight (more gold, renown and XP); drop: rolls a piece of gear; fame: reputation it earns at the nearest holding
   (0 for fights against a holding's own people; unset: by the number slain); won(e, slain, res) settles the rest, may add to
   res.gold or set res.fame, and returns a line for the victory panel. */
const gearTop=()=>Math.min(MATERIALS.length-1,1+Math.floor(G.day/20));
const clearPlace=(o,days)=>{o.cleared=true;o.back=G.day+days;pacify(o.x,o.y)};
const ON_WIN={
  party:{drop:()=>Math.random()<.3?randomGear(0,gearTop()):null,won:e=>{questNotify('band',e.ref);bandits=bandits.filter(x=>x!==e.ref);return ''}},
  camp:{big:true,fame:10,drop:()=>Math.random()<.8?randomGear(0,gearTop()):null,won:e=>{questNotify('site',e.ref);(e.ref.bands||[]).forEach(b=>{questNotify('band',b);chiefEscapes(b.ld)});e.ref.bands=[];clearPlace(e.ref,10);return ''}},
  monster:{won:(e,slain,res)=>{const m=e.ref;questNotify('monster',m);W.monsters=W.monsters.filter(x=>x!==m);gainXp(monsterXp(m,slain));return monsterLoot(m,slain)+(MONSTERS[m.id].mythic?mythicSlain(m,res):'')}},
  cave:{won:(e,slain)=>{questNotify('site',e.ref);gainXp(monsterXp(e.ref,slain));const txt=monsterLoot(e.ref,slain)+siteChest(e.ref);clearPlace(e.ref,SITE_TYPES[e.ref.type].respawn);return txt}},
  lord:{big:true,fame:0,drop:()=>Math.random()<.6?randomGear(1,gearTop()+1):null,won:(e,slain,res)=>lordWon(e.ref,res)},
  caravan:{fame:0,won:e=>e.seize?seizeCaravan(e.ref):caravanLoot(e.ref)},
  estate:{fame:0,won:e=>estateWon(e)},
  patrol:{fame:0,won:e=>patrolWon(e)},
  field:{won:e=>fieldWon(e)+(e.spoils||'')},
  siege:{big:true,fame:0,won:e=>siegeWon(e)},
  raid:{fame:0,won:e=>siegeWon(e)}
};
// retreat: you withdrew from the battle ({caught}: the rearguard cut down), neither a victory nor a rout
function concludeEncounter(win,lost,kills,auto,slain,retreat,txp){
  lootStart();const e=G.enc;if(e)reinfAfter(e,win);let html;const saved=heal(lost);applyLosses(lost);
  if(win){
    const O=ON_WIN[e.kind]||ON_WIN.party,big=!!O.big,res={gold:0,fame:O.fame};let bounty='';slain=slain||[];
    const beasts=slain.filter(k=>ST[k].beast).length;for(let i=0;i<kills-beasts;i++)res.gold+=rint(2,6);
    const furs=invAdd('good','furs',Math.floor(slain.filter(k=>k==='wolf').length/2));if(furs>0)bounty+=' You skin '+furs+' furs from the wolves.';
    if(big)res.gold+=25;if(auto)res.gold=Math.floor(res.gold*.8);res.gold=Math.round(res.gold*(1+tm('loot')));
    P.renown+=Math.ceil(kills*(big?1.5:1));P.morale=clamp(P.morale+4,0,100);gainXp(kills*8+(big?30:0));
    if(troopCount()>0)train('lead',3+kills*.5);train('tact',auto?6:2);
    const taken=takePrisoners(slain),drop=O.drop&&O.drop();
    if(drop&&!invAdd('gear',drop,1))log('Your bag is full. You leave a '+ITEMS[drop].n+' behind.','bad');
    {const c=(e.kind==='party'||e.kind==='camp')&&e.ref&&e.ref.ld;if(c){captureChief(c);e.ref.ld=null;bounty+=' You take '+chiefLabel(c)+' captive: hand him over for '+bountyOf(c)+' gold, or let him go (Hero, Party).'}}
    bounty=(O.won(e,slain,res)||'')+bounty;
    P.gold+=res.gold;
    const fame=res.fame==null?Math.max(2,Math.round(kills/2)):res.fame;if(fame)repNear(P.x,P.y,fame);
    html='<h2>Victory</h2><p>You defeated '+(e.kind==='monster'?(kills>1?kills+' ':'the ')+MONSTERS[e.ref.id].n.toLowerCase():kills+' '+(e.kind==='lord'?'soldiers':'foes'))+(taken?' and took '+taken+' prisoner'+(taken>1?'s':''):'')+'.'+bounty+'</p>';
    log('Victory. +'+res.gold+' gold, renown now '+P.renown+'.','good');mood('win');
  }else if(retreat){
    // as fleeing on the map (fleeOdds): a fight you started you simply leave; else a race. Got away, they lose your trail for a
    // while; run down, your rearguard pays and you must face them again. The foes you slew stay dead either way.
    const o=e.ref;slain=slain||[];if(o&&(e.kind==='lord'||e.kind==='patrol'||e.kind==='party'))for(const k of slain){try{partyRemove(o,k,1)}catch(err){}}
    if(e.list)for(const k of slain){const i=e.list.indexOf(k);if(i>=0)e.list.splice(i,1)}
    P.morale=clamp(P.morale-2,0,100);mood('flee');if(kills)gainXp(kills*4);
    const od=fleeOdds(e),away=od.leave||od.ch>0&&Math.random()<od.ch,rear={};
    if(away){if(o&&o.x!=null){const dx=P.x-o.x,dy=P.y-o.y,l=Math.hypot(dx,dy)||1;walk(P,dx/l,dy/l,40)}if(o&&e.kind!=='camp')o.cool=12}
    else{const all=[];for(const k in P.troops)for(let i=0;i<P.troops[k];i++)all.push(k);const n=all.length?Math.max(1,Math.round(all.length*.1*(has('rearguard')?.5:1))):0;
      for(let i=0;i<n;i++){const k=all.splice(rint(0,all.length-1),1)[0];rear[k]=(rear[k]||0)+1}applyLosses(rear);for(const k in rear)lost[k]=(lost[k]||0)+rear[k];
      e.noFlee=true;e.foes=[];e.allies=[];G.encAgain=e}
    const n=troopCount(),rn=Object.values(rear).reduce((a,x)=>a+x,0);
    html='<h2>'+(away?'Withdrawn':'Run down')+'</h2><p>'+(retreat.carried?'You fall in the fight, and your men carry you off the field. ':'')+'You pull your band out of the fight'+(kills?', leaving '+kills+' of them dead':'')+'. '+(retreat.caught?retreat.caught+' '+(retreat.caught>1?'were':'was')+' cut down before reaching the withdrawal point.':'Everyone who withdrew got clear of the field.')+'</p>'+
      '<p class="'+(away?'good':'bad')+'">'+(od.leave?'They let you go.':away?'You get away ('+Math.round(od.ch*100)+'% chance): they lose your trail.':(od.ch<=0?od.why+': ':'')+'They run you down'+(rn?': your rearguard loses '+lossText(rear):'')+'. You must face them again.')+' You ride on with '+n+' soldier'+(n===1?'':'s')+'.</p>'+
      '<div class="lab">The battle</div><div class="loot-stats">'+[['Enemies slain',kills,'good'],['Your fallen',retreat.fallen||0,retreat.fallen?'bad':''],['Got away',retreat.got||0,''],['Enemies still standing',retreat.standing||0,'']].map(([k,v,c])=>'<span><b>'+k+'</b><span class="'+c+'">'+v+'</span></span>').join('')+'</div>';
  }else{
    const lose=Math.floor(P.gold*.25);P.gold-=lose;P.morale=clamp(P.morale-15,0,100);if(auto){vitals();P.hp=Math.max(1,Math.round(P.hp*.5))}
    if(prisonerCount()){P.prisoners={};log('Your prisoners escape in the chaos.','bad')}
    captivesEscape();
    if(e.kind==='siege'||e.kind==='raid'){P.siege=null;G.capWith=null;e.ref.gar=Math.max(1,Math.round(e.ref.gar*.75))}
    if(e.kind==='patrol'){const h=townBy(e.ref.home);if(h)h.crime=null}
    if(e.kind==='party'||e.kind==='camp')chiefWins(e.ref,partySize()+1);// the chieftain who beat you grows
    const safe=TOWNS.filter(t=>!hostileTo(t.owner)),near=nearestOf(P,safe.length?safe:TOWNS);
    P.x=near.x;P.y=near.y+24;G.lastTown=near;if(e.kind!=='camp')e.ref.cool=8;
    if(e.kind==='lord'){const l=e.ref;if(auto)cull(l,.3);else for(const k of slain)partyRemove(l,k,1);lordWins(l,partySize())}
    html='<h2>Defeat</h2><p>Your band was routed. You lost '+lose+' gold and woke up near '+near.name+'.</p>';
    log('Defeat. You wake near '+near.name+'.','bad');
  }
  // your troops' experience (state.js): what each kind earned in the battle (an auto-resolve: a share by the kills), after the losses
  {const before=Object.keys(P.troops).reduce((a,k)=>a+txpReady(k),0);
    if(auto){const n=troopCount(),each=TROOP_XP.auto*(TROOP_XP.fight+(win?TROOP_XP.win:0)+(n?kills*TROOP_XP.kill*2/n:0));for(const k in P.troops)txpGain(k,each*P.troops[k])}
    else for(const k in txp||{})txpGain(k,txp[k]);txpClamp();const ready=Object.keys(P.troops).reduce((a,k)=>a+txpReady(k),0);
    if(ready>before)html+='<p class="gold">Your troops learn from the fight: '+ready+' soldier'+(ready>1?'s are':' is')+' ready to train at a barracks.</p>'}
  G.encCool=retreat?4:3;G.enc=null;G.mode='dialog';
  lootShow(html,lost,saved,'cont');
}
function autoResolve(){
  const e=G.enc,pl=playerList(),al=e.allies||[],fl=e.foes||[],pp=(power(pl)+power(lordTroops(al)))*(.8+Math.random()*.4)*(1+.05*skill('tact')),ep=(power(e.list)*lvPow(e.lv)+power(lordTroops(fl)))*(e.kind==='lord'?lordTac([e.ref,...fl]):lordTac(fl))*(.8+Math.random()*.4),win=pp>ep;
  const lost={};const loser=win?ep/pp:pp/ep,frac=win?clamp(.1+.6*loser*loser,.05,.8):1;
  for(const k in P.troops)for(let i=0;i<P.troops[k];i++)if(Math.random()<frac)lost[k]=(lost[k]||0)+1;
  const helpers=e.kind==='field'&&win?lordTroops(fl).slice():[];
  al.forEach(l=>cull(l,Math.min(frac,.85)));fl.forEach(l=>cull(l,win?.6:clamp(.1+.6*loser*loser,.05,.5)));
  concludeEncounter(win,lost,e.list.length+helpers.length,true,e.list.concat(helpers));
}
