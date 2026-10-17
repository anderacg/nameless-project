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
const monPower=m=>m.pw||(m.pw=rating(Array(m.n).fill(MONSTERS[m.id].unit),m.lv));
// move a party for one frame by its stance: hunt, keep its distance, or run
function stanceMove(o,st,dist,dx,dy,see,sp,canHunt){
  if(P.stay)return false;
  if(st==='attack'&&canHunt&&dist<see){const s=G.encCool>0?Math.min(dist,sp,dist-GRACE_GAP):Math.min(dist,sp);if(s>0)walk(o,dx,dy,s);return true}// (the grace after a fight: they keep a few steps off, no step into the gap)
  if(st==='afraid'&&dist<see){walk(o,-dx,-dy,sp*.85);o.fled=true;return true}
  if(st==='wary'&&dist<see*.45){walk(o,-dx,-dy,sp*.5);return true}
  return false;
}
function playerList(){return ['hero',...Object.keys(P.comps),...P.list]}
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
/* ---------- battle types from the world (setup.js BTYPE), only with terrain (TERRAIN.on) ----------
   Hold the bridge: a fight with a lord, a band, a patrol or a caravan on a road bridge or next to one (a road tile with water on
   both sides, within near tiles; not where the river is ice (frost) nor in the desert (no river)): the side set upon (you, unless
   you rode at them) holds it. Ambush: a band, or a hostile lord's army, that comes at you where there is cover springs one at
   cover's chance (a forest tile or 3 forest tiles round it; hills or peaks; else woods or rock on the field) × by its kind's
   (bandits, raiders, bog raiders; lord). Riding at a party where there is cover, you may lie in wait for it instead (Spring an
   ambush). Each drawn from the tile and the day (hash), never Math.random: the game's random sequence is untouched */
const BTYPE_WORLD={kinds:['lord','party','patrol','caravan'],near:1,cover:{forest:.35,hills:.3,field:.15},by:{bandits:1,raiders:1.2,bog:1.2,lord:.5}};
const roadBridge=(tx,ty)=>tAt(tx,ty)===T_ROAD&&(tAt(tx-1,ty)===T_WATER&&tAt(tx+1,ty)===T_WATER||tAt(tx,ty-1)===T_WATER&&tAt(tx,ty+1)===T_WATER);
function bridgeNear(tx,ty){const N=BTYPE_WORLD.near;for(let dy=-N;dy<=N;dy++)for(let dx=-N;dx<=N;dx++)if(roadBridge(tx+dx,ty+dy))return true;return false}
// the cover at world point (x,y) for an ambush: 'forest', 'hills', 'field' (woods or rock on its battlefield) or null; and its words
function coverAt(x,y){const env=battleEnv(),t=terrAt(x,y),g=terrainAt(x,y,env);if(g.recipe==='forest')return 'forest';if(t===T_HILL||t===T_MOUNT||env.t===T_HILL)return 'hills';
  const T=buildTerrain({...g,W:clamp(BVW,FIELD_W.min,FIELD_W.max)});return T.has.wood||T.has.rock?'field':null}
const COVER_SAY={forest:'the trees',hills:'the rocky rises',field:'the thickets'};
function battleTypeFor(e){
  if(!TERRAIN.on||!BTYPE_WORLD.kinds.includes(e.kind))return null;const env=battleEnv(),g=terrainAt(P.x,P.y,env);
  if(g.river&&!g.river.frozen&&!g.river.stream&&bridgeNear(g.tx,g.ty))return{kind:'bridge',def:e.mine?1:0,ford:hash(g.tx,g.ty,4447)<BTYPE.ford};
  const by=e.mine?0:e.kind==='lord'?BTYPE_WORLD.by.lord:e.kind==='party'?BTYPE_WORLD.by[e.band||'bandits']||0:0,cv=by&&coverAt(P.x,P.y);
  return cv&&hash(g.tx,g.ty,G.day*13+7)<BTYPE_WORLD.cover[cv]*by?{kind:'ambush',hid:1}:null}
// you may lie in wait for them: you rode at them, where there is cover, and it is no bridge's fight
const canSpring=e=>TERRAIN.on&&!!e.mine&&BTYPE_WORLD.kinds.includes(e.kind)&&!e.btype&&!!coverAt(P.x,P.y);
// the pre-battle panel's word on the battle's type
function typeHtml(e){const bt=e.btype;
  if(bt&&bt.kind==='bridge')return bt.def===0?'<p class="gold"><strong>Hold the bridge.</strong> You stand on your bank by it: they must come at you over the river, by the bridge'+(bt.ford?' or a ford far off it.':' or not at all.')+'</p>'
    :'<p class="gold"><strong>Take the bridge.</strong> They hold the far bank by it'+(bt.ford?', a ford far off it':'')+': you must cross.</p>';
  if(bt&&bt.kind==='ambush')return '<p class="bad"><strong>Ambush!</strong> They burst from cover beside the road: your band is caught in march order, with no time to deploy.</p>';
  return canSpring(e)?'<p class="muted">There is cover here: you can lie in wait beside the road and spring an ambush on them as they pass.</p>':''}
// (Spring an ambush: your band hidden beside the road, theirs on it in march order; no deployment for either)
onAct('bt-',a=>{const e=G.enc;if(a==='bt-spring'&&e&&G.mode==='dialog'&&canSpring(e)){e.btype={kind:'ambush',hid:0};startBattle({enemies:e.list,tournament:false,lv:e.lv||1,deploy:false})}});
function startEncounter(e){
  if(e.mine==null)e.mine=!!G.youAttack;G.youAttack=false;if(e.lv==null&&e.ref&&e.ref.ld)e.lv=chiefLv(e.ref);// did you start it (you may call that off)? a chieftain's band fights at its level
  if(e.btype==null){const bt=battleTypeFor(e);if(bt)e.btype=bt}// (a battle type: none with terrain off)
  e.list=e.list||makeEnemies(e.n,e.kind==='camp',e.band);const env=battleEnv(),ground='<p class="muted">Battleground: '+env.name+'. '+terrainEnvText(env,e.kind,e.btype)+'</p>',band=BANDS[e.band||'bandits'];G.enc=e;G.mode='dialog';P.tx=null;G.chase=null;
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
  showPanel('<h2>'+(e.title?e.title:lord?lord.name+' attacks':e.kind==='camp'?e.ref.name||'Bandit camp':band[0])+'</h2>'+(lord?'<p class="muted">An army of the <span style="color:'+f.col+'">'+f.n+'</span>.</p>':'')+'<p>Scouts count about <strong>'+e.list.length+'</strong> '+(lord||e.kind==='estate'||e.kind==='caravan'||e.kind==='patrol'?'soldiers':band[1]+(e.kind==='camp'?' and a chieftain':''))+'.'+ground+' You have <strong>'+playerList().length+'</strong> fighters, including yourself.</p>'+typeHtml(e)+hurt+'<p>'+vs+'</p><div class="btns"><button class="btn primary" type="button" data-act="fight">Fight</button>'+(canSpring(e)?'<button class="btn" type="button" data-act="bt-spring">Spring an ambush</button>':'')+'<button class="btn" type="button" data-act="auto">Auto-resolve</button>'+fleeBtn(e)+'</div>');
}
/* fleeing is a real escape. A fight you started (you rode at them, or you are storming, raiding or joining a battle) you can
   simply call off, as you can with a foe that is afraid of you. Otherwise it is a race: your band's speed on this ground (a big
   band is slower, low morale slower still) against theirs, helped by night and by cover. Some fights cannot be fled: a foe far
   faster than you, or more of them closing in around you. Caught, your rearguard pays and you must fight. Got away, they lose
   your trail for a while and go back to their own business. */
const mySpeed=()=>MAP_BASE*travelMul()*(P.morale<25?.8:1);
function chaserSpeed(e){const o=e.ref,k=e.kind,at=Math.max(.45,speedAt(P.x,P.y)||1);
  if(k==='monster'&&MONSTERS[o.id].mythic)return MONSTERS[o.id].mythic.speed[1];
  if(k==='lord')return lordSpeed(o);if(k==='party')return partySpeed(o,o.troops);if(k==='patrol')return partySpeed(o,o.troops)*.75*1.25;
  return (k==='camp'?30:k==='caravan'?CARAVAN_SPD:k==='estate'?22:26)*at}
function fleeOdds(e){
  if(['siege','raid','field','tourney','cave'].includes(e.kind)||e.mine&&!(e.ref&&e.ref.sab))return{leave:true,ch:1};
  if(e.btype&&e.btype.kind==='ambush'&&e.btype.hid===1)return{ch:0,why:'They have you in their trap'};// (an ambush: no way out but through)
  const pw=['lord','party','patrol'].includes(e.kind)?e.ref.power():null;if(pw!=null&&stance(pw)==='afraid')return{leave:true,ch:1};
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
    const n=P.size?Math.max(1,Math.round(P.size*.1*(has('rearguard')?.5:1))):0,lost=countsOf(P.removeAny(n));e.noFlee=true;
    log('They run you down'+(n?': your rearguard loses '+lossText(lost):'')+'. You must fight.','bad');mood('flee');return startEncounter(e)}
  let dx=P.x-o.x,dy=P.y-o.y;const l=Math.hypot(dx,dy)||1;
  walk(P,dx/l,dy/l,od.leave?40:56);if(e.kind!=='camp')o.cool=od.leave?6:12;G.encCool=od.leave?4:3;// got away: they lose your trail for a while
  if(!od.leave)P.morale=clamp(P.morale-2,0,100);G.enc=null;G.mode='world';hidePanel();log(od.leave?'You leave them be.':'You get away.');if(!od.leave)mood('flee');
}
// experience: yours (leaders.js), and your companions share what you learn
function gainXp(n){leaderOf(P).gainXp(n);for(const id of compsInBand())compXp(id,n)}
function applyLosses(lost){return partyRoster(P).lose(lost)}
function lossText(lost){const k=Object.keys(lost).filter(x=>lost[x]>0);return k.length?k.map(x=>lost[x]+' '+ST[x].n.toLowerCase()).join(', '):'none'}
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
  caravan:{fame:0,won:e=>e.seize?e.ref.seize():e.ref.loot()},
  estate:{fame:0,won:e=>estateWon(e)},
  patrol:{fame:0,won:e=>patrolWon(e)},
  field:{won:e=>fieldWon(e)+(e.spoils||'')},
  siege:{big:true,fame:0,won:e=>siegeWon(e)},
  raid:{fame:0,won:e=>siegeWon(e)}
};
function autoResolve(){
  const e=G.enc,pl=playerList(),al=e.allies||[],fl=e.foes||[],pp=(power(pl)+power(lordTroops(al)))*(.8+Math.random()*.4)*(1+.05*skill('tact')),ep=(power(e.list)*lvPow(e.lv)+power(lordTroops(fl)))*(e.kind==='lord'?lordTac([e.ref,...fl]):lordTac(fl))*(.8+Math.random()*.4),win=pp>ep;
  const loser=win?ep/pp:pp/ep,frac=win?clamp(.1+.6*loser*loser,.05,.8):1,lost=partyRoster(P).losses(frac);
  const helpers=e.kind==='field'&&win?lordTroops(fl).slice():[];
  al.forEach(l=>cull(l,Math.min(frac,.85)));fl.forEach(l=>cull(l,win?.6:clamp(.1+.6*loser*loser,.05,.5)));
  concludeEncounter(win,lost,e.list.length+helpers.length,true,e.list.concat(helpers));
}
