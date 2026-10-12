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
const bandPower=b=>b.pw||(b.pw=rating(b.list||(b.list=makeEnemies(b.n,false,b.kind))));
const monPower=m=>m.pw||(m.pw=rating(Array(m.n).fill(MONSTERS[m.id].unit),m.lv));
// move a party for one frame by its stance: hunt, keep its distance, or run
function stanceMove(o,st,dist,dx,dy,see,sp,canHunt){
  if(st==='attack'&&canHunt&&dist<see){walk(o,dx,dy,Math.min(dist,sp));return true}
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
const foeFac=e=>e.kind==='lord'||e.kind==='caravan'||e.kind==='estate'?e.ref.fac:e.kind==='siege'||e.kind==='raid'?e.ref.owner:null;
const nearLords=(e,ok)=>W.lords.filter(l=>!l.dead&&l!==e.ref&&!(e.lords||[]).includes(l)&&l.troops.length>=3&&l.state!=='siege'&&Math.hypot(l.x-P.x,l.y-P.y)<REINF_R&&ok(l)).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y)).slice(0,REINF_MAX);
function nearAllies(e){if(e.kind==='tourney')return[];const ff=foeFac(e);return nearLords(e,l=>friendFac(l.fac)&&(!ff||ff!=='player'&&atWar(l.fac,ff)))}
function nearFoes(e){const ff=foeFac(e);if(!ff||ff==='player')return[];return nearLords(e,l=>(l.fac===ff||relOf(l.fac,ff).s==='ally')&&hostileTo(l.fac))}
const lordTroops=ls=>ls.flatMap(l=>l.troops);
function reinfHtml(e){
  return (e.allies.length?'<p class="good">At your side: '+e.allies.map(l=>l.name+' of the '+FACS[l.fac].n+' ('+l.troops.length+')').join(', ')+'.</p>':'')+
    (e.foes.length?'<p class="bad">Riding to help them: '+e.foes.map(l=>l.name+' of the '+FACS[l.fac].n+' ('+l.troops.length+')').join(', ')+'.</p>':'');
}
// after the fight: the enemy's helpers are routed if you win; your helpers thank you, and anyone left with too few troops goes home to regroup
function reinfAfter(e,win){
  for(const l of e.foes||[]){if(l.dead)continue;if(win){defeatLord(l);log(l.name+' is routed with the rest.','good')}else l.cool=4}
  for(const l of e.allies||[]){if(l.dead)continue;if(l.troops.length<3){defeatLord(l);log(l.name+' has too few soldiers left and goes home.','bad')}else{l.cool=4;if(win)addHonor(l.fac,3,true)}}
  if(win&&(e.allies||[]).length)log('You fought beside '+e.allies.map(l=>l.name).join(' and ')+'. The '+[...new Set(e.allies.map(l=>FACS[l.fac].n))].join(' and ')+' will remember it.','good');
}
function startEncounter(e){
  e.list=e.list||makeEnemies(e.n,e.kind==='camp',e.band);const env=battleEnv(),ground='<p class="muted">Battleground: '+env.name+'. '+env.text+'</p>',band=BANDS[e.band||'bandits'];G.enc=e;G.mode='dialog';P.tx=null;G.chase=null;
  e.allies=e.allies||nearAllies(e);e.foes=e.foes||nearFoes(e);
  const ratio=(power(e.list)*lvPow(e.lv)+power(lordTroops(e.foes)))/(power(playerList())+power(lordTroops(e.allies))),threat=ratio<.6?'Easy':ratio<1?'Even':ratio<1.5?'Risky':'Deadly';
  const vm=vitals(),hurt=reinfHtml(e)+(P.hp<vm[0]*.6?'<p class="bad">You are wounded: '+Math.round(P.hp)+' / '+vm[0]+' health. Rest at an inn or travel to recover.</p>':''),cls=ratio<.6?'good':ratio<1?'gold':'bad',vs='Your power <strong>'+partyPower()+'</strong> vs <strong>'+rating(e.list,e.lv)+'</strong> · threat <strong class="'+cls+'">'+threat+'</strong>',lord=e.kind==='lord'&&e.ref,f=lord&&FACS[lord.fac];
  if(e.kind==='monster'||e.kind==='cave'){const M=MONSTERS[e.ref.id],u=ST[M.unit],Y=M.mythic;
    const finds=[M.mat&&'Trophy: '+MATS[M.mat].n+'.',M.gear.length&&'Rare finds: '+M.gear.map(([it])=>'<span style="color:'+RARITY[ITEMS[it].r]+'">'+ITEMS[it].n+'</span>').join(', ')+'.',Y&&Y.hoard&&'It guards a hoard of about '+Y.hoard.gold+' gold.'].filter(Boolean).join(' ');
    return showPanel('<h2>'+(Y?Y.title:(e.kind==='cave'?e.ref.name+': ':'')+M.n+' <span class="muted">· level '+e.lv+'</span>')+'</h2><p>'+M.d+'</p><p>'+e.list.length+' × '+u.n+' ('+u.hp+' hp'+(e.lv>1?', stronger with level':'')+'). '+vsLine(u)+'. You have <strong>'+playerList().length+'</strong> fighters.</p>'+ground+
      (finds?'<p class="muted">'+finds+'</p>':'')+hurt+'<p>'+vs+'</p>'+
      '<div class="btns"><button class="btn primary" type="button" data-act="fight">Fight</button><button class="btn" type="button" data-act="auto">Auto-resolve</button><button class="btn" type="button" data-act="flee">'+(M.aggro?'Flee':'Leave')+'</button></div>')}
  showPanel('<h2>'+(e.title?e.title:lord?lord.name+' attacks':e.kind==='camp'?e.ref.name||'Bandit camp':band[0])+'</h2>'+(lord?'<p class="muted">An army of the <span style="color:'+f.col+'">'+f.n+'</span>.</p>':'')+'<p>Scouts count about <strong>'+e.list.length+'</strong> '+(lord||e.kind==='estate'||e.kind==='caravan'?'soldiers':band[1]+(e.kind==='camp'?' and a chieftain':''))+'.'+ground+' You have <strong>'+playerList().length+'</strong> fighters, including yourself.</p>'+hurt+'<p>'+vs+'</p><div class="btns"><button class="btn primary" type="button" data-act="fight">Fight</button><button class="btn" type="button" data-act="auto">Auto-resolve</button><button class="btn" type="button" data-act="flee">Flee</button></div>');
}
function flee(){
  const e=G.enc;const o=e.ref;let dx=P.x-o.x,dy=P.y-o.y;const l=Math.hypot(dx,dy)||1;
  walk(P,dx/l,dy/l,40);if(e.kind!=='camp')o.cool=6;G.encCool=4;P.morale=clamp(P.morale-2,0,100);G.enc=null;G.mode='world';hidePanel();log('You slip away from the fight.');mood('flee');
}
function gainXp(n){
  P.xp+=n;let up=0;while(P.xp>=P.level*60){P.xp-=P.level*60;P.level++;P.tp=(P.tp||0)+1;up++}
  if(up)log('You reach level '+P.level+'. '+(up>1?up+' skill points':'A skill point')+' to spend in Skills (K).','gold');
}
function applyLosses(lost){for(const k in lost)P.troops[k]=Math.max(0,(P.troops[k]||0)-lost[k])}
function lossText(lost){const k=Object.keys(lost).filter(x=>lost[x]>0);return k.length?k.map(x=>lost[x]+' '+ST[x].n.toLowerCase()).join(', '):'none'}
function heal(lost){
  let saved=0,total=0;const ch=.07*skill('med');
  for(const k in lost){total+=lost[k];for(let i=lost[k];i>0;i--)if(Math.random()<ch){lost[k]--;saved++}}
  train('med',total*2);return saved;
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
  camp:{big:true,fame:10,drop:()=>Math.random()<.8?randomGear(0,gearTop()):null,won:e=>{questNotify('site',e.ref);clearPlace(e.ref,10);return ''}},
  monster:{won:(e,slain,res)=>{const m=e.ref;questNotify('monster',m);W.monsters=W.monsters.filter(x=>x!==m);gainXp(monsterXp(m,slain));return monsterLoot(m,slain)+(MONSTERS[m.id].mythic?mythicSlain(m,res):'')}},
  cave:{won:(e,slain)=>{questNotify('site',e.ref);gainXp(monsterXp(e.ref,slain));const txt=monsterLoot(e.ref,slain)+siteChest(e.ref);clearPlace(e.ref,SITE_TYPES[e.ref.type].respawn);return txt}},
  lord:{big:true,fame:0,drop:()=>Math.random()<.6?randomGear(1,gearTop()+1):null,won:(e,slain,res)=>lordWon(e.ref,res)},
  caravan:{fame:0,won:e=>e.seize?seizeCaravan(e.ref):caravanLoot(e.ref)},
  estate:{fame:0,won:e=>estateWon(e)},
  siege:{big:true,fame:0,won:e=>siegeWon(e)},
  raid:{fame:0,won:e=>siegeWon(e)}
};
function concludeEncounter(win,lost,kills,auto,slain){
  const e=G.enc;if(e)reinfAfter(e,win);let html;const saved=heal(lost);applyLosses(lost);
  const savedTxt=saved?' '+saved+' more were wounded but saved by your medicine.':'';
  if(win){
    const O=ON_WIN[e.kind]||ON_WIN.party,big=!!O.big,res={gold:0,fame:O.fame};let bounty='';slain=slain||[];
    const beasts=slain.filter(k=>ST[k].beast).length;for(let i=0;i<kills-beasts;i++)res.gold+=rint(2,6);
    const furs=invAdd('good','furs',Math.floor(slain.filter(k=>k==='wolf').length/2));if(furs>0)bounty+=' You skin '+furs+' furs from the wolves.';
    if(big)res.gold+=25;if(auto)res.gold=Math.floor(res.gold*.8);res.gold=Math.round(res.gold*(1+tm('loot')));
    P.renown+=Math.ceil(kills*(big?1.5:1));P.morale=clamp(P.morale+4,0,100);gainXp(kills*8+(big?30:0));
    if(troopCount()>0)train('lead',3+kills*.5);train('tact',auto?6:2);
    const taken=takePrisoners(slain),drop=O.drop&&O.drop();
    if(drop){if(invAdd('gear',drop,1))bounty+=' You find a <span style="color:'+RARITY[ITEMS[drop].r]+'">'+ITEMS[drop].n+'</span>.';else log('Your bag is full. You leave a '+ITEMS[drop].n+' behind.','bad')}
    bounty=(O.won(e,slain,res)||'')+bounty;
    P.gold+=res.gold;
    const fame=res.fame==null?Math.max(2,Math.round(kills/2)):res.fame;if(fame)repNear(P.x,P.y,fame);
    html='<h2>Victory</h2><p>You defeated '+(e.kind==='monster'?(kills>1?kills+' ':'the ')+MONSTERS[e.ref.id].n.toLowerCase():kills+' '+(e.kind==='lord'?'soldiers':'foes'))+' and took <strong class="gold">'+res.gold+' gold</strong>'+(taken?' and '+taken+' prisoner'+(taken>1?'s':''):'')+'.'+bounty+'</p><p class="muted">Losses: '+lossText(lost)+'.'+savedTxt+'</p>';
    log('Victory. +'+res.gold+' gold, renown now '+P.renown+'.','good');mood('win');
  }else{
    const lose=Math.floor(P.gold*.25);P.gold-=lose;P.morale=clamp(P.morale-15,0,100);if(auto){vitals();P.hp=Math.max(1,Math.round(P.hp*.5))}
    if(prisonerCount()){P.prisoners={};log('Your prisoners escape in the chaos.','bad')}
    if(e.kind==='siege'||e.kind==='raid'){P.siege=null;e.ref.gar=Math.max(1,Math.round(e.ref.gar*.75))}
    const safe=TOWNS.filter(t=>!hostileTo(t.owner)),near=nearestOf(P,safe.length?safe:TOWNS);
    P.x=near.x;P.y=near.y+24;G.lastTown=near;if(e.kind!=='camp')e.ref.cool=8;
    if(e.kind==='lord'){const l=e.ref;if(auto)cull(l,.3);else for(const k of slain){const i=l.troops.indexOf(k);if(i>=0)l.troops.splice(i,1)}}
    html='<h2>Defeat</h2><p>Your band was routed. You lost '+lose+' gold and woke up near '+near.name+'.</p><p class="muted">Losses: '+lossText(lost)+'.'+savedTxt+'</p>';
    log('Defeat. You wake near '+near.name+'.','bad');
  }
  G.encCool=3;G.enc=null;G.mode='dialog';
  showPanel(html+'<div class="btns"><button class="btn primary" type="button" data-act="cont">Continue</button></div>');updateHUD(true);
}
function autoResolve(){
  const e=G.enc,pl=playerList(),al=e.allies||[],fl=e.foes||[],pp=(power(pl)+power(lordTroops(al)))*(.8+Math.random()*.4)*(1+.05*skill('tact')),ep=(power(e.list)*lvPow(e.lv)+power(lordTroops(fl)))*(.8+Math.random()*.4),win=pp>ep;
  const lost={};const loser=win?ep/pp:pp/ep,frac=win?clamp(.1+.6*loser*loser,.05,.8):1;
  for(const k in P.troops)for(let i=0;i<P.troops[k];i++)if(Math.random()<frac)lost[k]=(lost[k]||0)+1;
  al.forEach(l=>cull(l,Math.min(frac,.85)));fl.forEach(l=>cull(l,win?.6:clamp(.1+.6*loser*loser,.05,.5)));
  concludeEncounter(win,lost,e.list.length,true,e.list);
}
