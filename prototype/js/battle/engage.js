'use strict';
/* ---------- encounters ---------- */
// fighting strength: each unit counts as √(health × damage per second), so numbers matter as much as one strong fighter
const power=list=>list.reduce((a,t)=>{const s=t==='hero'?heroStats():ST[t];return a+Math.sqrt(s.hp*s.dmg/s.cd)*(s.range?1.15:1)*(s.breath?1.45:1)},0);
const lvPow=lv=>Math.sqrt(lvMul(lv||1));
const rating=(list,lv)=>Math.round(power(list)*lvPow(lv));
const partyPower=()=>rating(playerList());
// stance: how a roaming party judges you from its power against yours
const ATTACK_AT=.8,FLEE_AT=.5,STANCE_COL={attack:'#ff9a90',wary:'#e8d8a0',afraid:'#78c474'};
const stance=(pw,observer=null)=>{const r=pw/Math.max(1,observer?TravelAwareness.power(observer):partyPower());return r>=ATTACK_AT?'attack':r>=FLEE_AT?'wary':'afraid'};
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
/* reinforcements (the owner, 2026-10-23: armies on neutral or better terms help; the numbers: REINF, data/factions.js). Who
   may help you depends on whom you fight:
   - a common enemy (a band of bandits or raiders, a camp or hideout, a beast, a lair's or a ruin's guardians: no realm's men):
     any army within REINF.r that is not hostile to you. Your friends always (your liege's men, its allies', a realm that
     honours you (25+), a lord who likes you: RELATION.helpAt). A neutral lord by chance, from how he feels about you
     (REINF.chance at 0, sure at helpAt, none at -helpAt; drawn once for the encounter from the day, where you stand and who he
     is: e.rolls, never Math.random), and only if the odds look fair (his strength and yours at least REINF.fair x theirs).
     A holding's watch always on its realm's land (it is their job), and off it as a neutral lord;
   - a realm's men (a lord, a holding you storm, raid or rob, its caravan, its watch, its real toll-men on the road): only your
     friends at war with that realm (as before), and the watches of a realm at war with it, on their own land;
   - a siege: its besiegers and the lords holding its walls, as before.
   At most REINF.max, the nearest first (and of those about as near, within REINF.band px, the strongest). Your companions'
   parties come too, and on the road a caravan you ride to save fights with its own guards. Each helper's why (the pre-battle
   page) and his men at the start (his share of the spoils) are kept on the encounter (e.help). An enemy lord's realm and
   allies join him (nearFoes, at most REINF.foes). */
const friendFac=f=>!hostileTo(f)&&(!!P.fac&&(f===P.fac||relOf(f,P.fac).s==='ally')||honorWith(f)>=25);
const forceRealm=o=>{const src=o?.src||o;return src?.fac||src?.faction||src?.owner||o?.fac||null};
const foeFac=e=>['lord','caravan','estate','patrol','villagers','party'].includes(e.kind)?forceRealm(e.ref)||(e.kind==='villagers'?townBy(e.ref?.town)?.owner:null):e.kind==='siege'||e.kind==='raid'?e.ref.owner:null;
// the realm whose men you fight (foeFac's, or a realm's real toll-men on the road); none: a common enemy
const foeRealm=e=>foeFac(e)||(e.road&&e.road.real&&e.road.fac)||null;
// Realm loyalty precedes friendship/help rolls and remembered participant lists. null leaves ordinary eligibility in charge.
function reinforceSide(e,o){
  const src=o.src||o;if(src.mapKind==='cparty'||o.kind==='cparty')return 0;
  const f=forceRealm(o);if(!f)return null;
  const foes=[foeRealm(e),...(e.foes||[]).map(forceRealm)].filter(Boolean),friends=['player',P.fac,...(e.kind==='field'?(e.allies||[]).map(forceRealm):[])].filter(Boolean);
  if(e.kind==='field'&&foes.includes(f)&&friends.includes(f)){if((e.allies||[]).some(a=>(a.src||a)===src))return 0;if((e.foes||[]).some(a=>(a.src||a)===src))return 1;return -1}
  if(foes.includes(f))return 1;
  if(foes.some(g=>g!=='player'&&relOf(f,g).s==='ally'))return friends.includes(f)||friends.some(g=>g!==f&&g!=='player'&&relOf(f,g).s==='ally')?-1:1;
  return null;
}
function alignReinforcements(e){
  const sides=[[],[]],seen=new Set();for(const [team,list] of [[0,e.allies||[]],[1,e.foes||[]]])for(const o of list){const key=o.src||o;if(seen.has(key))continue;seen.add(key);const side=reinforceSide(e,o);if(side!==-1)sides[side??team].push(o)}
  [e.allies,e.foes]=sides;
}
const commonFoe=e=>e.kind==='field'?(e.foes||[]).every(f=>!f.fac):e.kind!=='tourney'&&!foeRealm(e);
// the holding a fight is over: the one you storm or raid, or the one the lord you fight is besieging (or riding to relieve)
const siegeTown=e=>e.kind==='siege'||e.kind==='raid'?e.ref.name:e.kind==='lord'&&(e.ref.state==='siege'||e.ref.state==='relieve')?e.ref.tgt:null;
const nearYou=o=>Math.hypot(o.x-P.x,o.y-P.y);
// lords near you who could take part: free lords, plus, in a fight over a siege, its besiegers and the lords holding its walls
const lordFree=(e,l,st)=>!l.dead&&(!l.inside||st&&l.inside===st&&e.kind==='lord')&&l!==e.ref&&!(e.lords||[]).includes(l)&&l.troops.length>=3&&(l.state!=='siege'||l.tgt===st)&&nearYou(l)<REINF.r;
const nearLords=(e,ok)=>{const st=siegeTown(e);return W.lords.filter(l=>lordFree(e,l,st)&&ok(l)).sort((a,b)=>nearYou(a)-nearYou(b)).slice(0,REINF.foes+(st?2:0))};
// a friend's why ('' for none, or when his realm is hostile to you): your own, your liege's, his ally's, a lord who likes you,
// a realm that honours you
function friendWhy(o){const f=o.fac;if(!f||hostileTo(f))return '';if(f==='player')return 'your own men';if(P.fac===f)return 'your liege’s man';
  if(P.fac&&relOf(f,P.fac).s==='ally')return 'an ally of your liege';if(!o.pt&&lordHelps(o))return 'a friend';return honorWith(f)>=25?'the '+FACS[f].n+' honours you':''}
// a neutral one: his chance by how he feels about you (v), his draw for this encounter (once), and whether the odds look fair
const helpChance=v=>clamp(REINF.chance+(1-REINF.chance)*v/RELATION.helpAt,0,1);
const helpRoll=(e,k)=>{const R=e.rolls||(e.rolls={});return R[k]!=null?R[k]:R[k]=hash(Math.floor(P.x),Math.floor(P.y),G.day*7919+folkHash(k))};
const fairOdds=(e,o)=>o.power()+partyPower()>=REINF.fair*rating(e.list||[],e.lv);
const neutralHelps=(e,o,k,v)=>helpRoll(e,k)<helpChance(v)&&fairOdds(e,o);
// Local law enforcement is duty, not a friendship roll. Current land ownership overrides a watch's old home.
const banditBattle=e=>{const band=f=>(f?.src||f)?.mapKind==='band';return !foeRealm(e)&&(e.kind==='party'&&band(e.ref)||e.kind==='field'&&(e.foes||[]).length>0&&e.foes.every(band))};
function localBanditDuty(e,o){
  if(!banditBattle(e)||hostileTo(o.fac))return '';const p=B?.world&&G.enc===e?B.world:P,t=landHold(p.x,p.y);
  return t?.owner===o.fac?'clearing bandits from its realm’s land':'';
}
const bountyWhy=e=>e.kind==='monster'||e.kind==='cave'?'to see the beast dead':'for the bounty';
// why a lord rides to help you ('' if he won't): a friend; or a neutral lord by chance at fair odds, against a common enemy or
// against a realm his own is at war with (the owner, 2026-10-23: "they fight each other, why not?")
function lordWhy(e,l){const side=reinforceSide(e,l);if(side===1||side===-1)return '';const fr=foeRealm(e),st=siegeTown(e);if(fr&&(fr==='player'||!atWar(l.fac,fr)))return '';
  if(st&&l.tgt===st&&l.state==='siege')return 'besieging '+st;if(st&&l.inside===st)return 'holding the walls of '+st;
  const duty=localBanditDuty(e,l);if(duty)return duty;
  const fw=friendWhy(l);if(fw||hostileTo(l.fac))return fw;return neutralHelps(e,l,l.id,relWith(l))?(fr?'at war with the '+FACS[fr].n:bountyWhy(e)):''}
// why a holding's watch rides to help you ('' if it won't): on its realm's land against a common enemy, or against a realm at
// war with its own; off its land against a common enemy as a neutral lord would (or a friend)
function watchWhy(e,p){const side=reinforceSide(e,p);if(side===1||side===-1||hostileTo(p.fac))return '';const duty=localBanditDuty(e,p);if(duty)return duty;const fr=foeRealm(e),land=!banditBattle(e)&&patrolLand(p,P.x,P.y);
  if(fr)return land&&fr!=='player'&&fr!==p.fac&&atWar(p.fac,fr)?'riding out against the '+FACS[fr].n+' on its land':'';
  if(land)return 'riding in to clear its '+(e.kind==='monster'||e.kind==='cave'?'land':'road');
  return friendWhy(p)||(neutralHelps(e,p,'w:'+p.home+':'+watchOf(p),0)?bountyWhy(e):'')}
function nearAllies(e){if(e.kind==='tourney')return[];const st=siegeTown(e),H=e.help||(e.help=new Map()),why=new Map();
  for(const o of [...W.lords.filter(l=>lordFree(e,l,st)),...W.patrols.filter(p=>!p.gone&&!inFight(p)&&p!==e.ref&&p.troops.length&&nearYou(p)<REINF.r)]){const w=o.pt?watchWhy(e,o):lordWhy(e,o);if(w)why.set(o,w)}
  const band=o=>Math.floor(nearYou(o)/REINF.band);
  return [...why.keys()].sort((a,b)=>band(a)-band(b)||b.power()-a.power()).slice(0,REINF.max+(st?2:0)).map(o=>{const f=o.pt?forceOf(o):o;H.set(f,{why:why.get(o),n:f.troops.length});return f})}
function nearFoes(e){const ff=foeFac(e),st=siegeTown(e);if(!ff||ff==='player')return[];return nearLords(e,l=>(l.fac===ff||relOf(l.fac,ff).s==='ally')&&(hostileTo(l.fac)||st&&l.tgt===st&&l.state==='siege'))}
// the caravan you ride to save on the road (world/encounters.js caravan): its own guards, of the land's people
const guardsForce=r=>{const t=Spatial.nearestHolding(P.x,P.y),u=RACES[t.races[0]].melee;return{kind:'guards',name:'the caravan’s guards',fac:r.fac,troops:Array(REINF.guards).fill(u)}};
const lordTroops=ls=>ls.flatMap(l=>l.troops);
const ofFac=l=>!l.kind&&l.fac&&FACS[l.fac]?' of the '+FACS[l.fac].n:'';
// a helper's why on the pre-battle page: kept when he was asked (nearAllies), else by what he is
const helpWhy=(e,l)=>(e.help&&e.help.get(l)||{}).why||(l.kind==='cparty'?'your companion':l.kind==='garrison'?'sallying from its walls':l.kind==='guards'?'defending their carts':e.kind==='field'?'already in the fight':'');
function reinfHtml(e){const why=l=>{const w=helpWhy(e,l);return w?', '+w:''};
  return (e.allies.length?'<p class="good">At your side: '+e.allies.map(l=>l.name+ofFac(l)+' ('+(l.troops.length+battleLeaders({kind:'field',allies:[l],foes:[]}).length)+' fighters)'+why(l)).join('; ')+'.</p>':'')+
    (e.foes.length?'<p class="bad">'+(e.kind==='field'?'Against you: ':'Riding to help them: ')+e.foes.map(l=>l.name+ofFac(l)+' ('+(l.troops.length+battleLeaders({kind:'field',allies:[],foes:[l]}).length)+' fighters)').join(', ')+'.</p>':'');
}
// after the fight: the enemy's helpers are routed if you win; your helpers thank you, and anyone left with too few troops
// goes home. Forces other than lords (patrols, bands, caravans in a battle you joined) are written back to their parties.
// Won: each realm's force beside you gives honour (REINF.honor.beside), its lords like you more (RELATION.fightBeside); a
// common enemy cleared on a realm's land with its men beside you, that realm a little more (REINF.honor.land, once)
function reinfAfter(e,win){
  syncForces(e.foes);syncForces(e.allies);
  for(const l of e.foes||[]){if(l.dead||l.kind==='garrison')continue;if(win){if(!l.src)rippleRel(l,RELATION.beatThem,'you beat them in battle');const t=routForce(l,true);if(t)e.spoils=(e.spoils||'')+t;log(l.name+' is routed with the rest.','good')}else (l.src||l).cool=4}
  for(const l of e.allies||[]){if(l.dead||l.kind==='garrison'||l.kind==='guards')continue;if(l.troops.length<(l.src?1:3)){routForce(l,false);log(l.name+' has too few soldiers left and goes home.','bad','war')}else{(l.src||l).cool=4;if(win&&l.fac&&l.fac!=='player')addHonor(l.fac,REINF.honor.beside,true)}}
  if(win){const ls=(e.allies||[]).filter(l=>!l.src&&!l.kind&&!l.dead);ls.forEach(l=>changeRel(l,RELATION.fightBeside,'you fought beside them'));ls.forEach((a,i)=>ls.slice(i+1).forEach(b=>changeLordRel(a,b,RELATION.together)));
    const h=commonFoe(e)&&landHold(P.x,P.y),lf=h&&h.owner;if(lf&&lf!=='player'&&realmHelpers(e).some(x=>x.l.fac===lf))addHonor(lf,REINF.honor.land,true)}
  const facs=[...new Set((e.allies||[]).filter(l=>l.fac&&l.fac!=='player').map(l=>FACS[l.fac].n))];
  if(win&&(e.allies||[]).length)log('You fought beside '+e.allies.map(l=>l.name).join(' and ')+'.'+(facs.length?' The '+facs.join(' and ')+' will remember it.':''),'good','war');
}
// the lords and watches beside you, each with his men at the start: they share the renown (yours x REINF.renown) and, those
// still standing, the gold: each his share by his men against everyone's at your side (yours at the start too), rounded
const realmHelpers=e=>(e.allies||[]).filter(l=>!l.kind||l.kind==='patrol').map(l=>({l,n:(e.help&&e.help.get(l)||{}).n||l.troops.length}));
const reinfRenown=e=>realmHelpers(e).length?REINF.renown:1;
function reinfCut(e,res){const hs=realmHelpers(e);if(!hs.length)return '';const all=(e.men||playerList().length)+hs.reduce((a,h)=>a+h.n,0),g0=res.gold-(res.own||0),cuts=[];
  for(const h of hs){if(h.l.dead||h.l.src&&h.l.src.gone)continue;const g=Math.min(res.gold-(res.own||0),Math.round(g0*h.n/all));if(g>0){res.gold-=g;cuts.push(h.l.name+' takes '+g+' gold for '+(h.l.kind?'its':'his')+' '+h.n+' men')}}
  return ' '+(cuts.length?cuts.join(', ')+' as a share of the spoils. ':'')+'You share the renown with '+(hs.length>1?'them':hs[0].l.name)+'.'}
/* ---------- battle types from the world (setup.js BTYPE), only with terrain (TERRAIN.on) ----------
   Hold the bridge: a fight with a lord, a band, a patrol or a caravan on a road bridge or next to one (a road tile with water on
   both sides, within near tiles; not where the river is ice (frost) nor in the desert (no river)): the side set upon (you, unless
   you rode at them) holds it. Ambush: a band, or a hostile lord's army, that comes at you where there is cover springs one at
   cover's chance (a forest tile or 3 forest tiles round it; hills or peaks; else woods or rock on the field) × by its kind's
   (bandits, raiders, bog raiders; lord). Riding at a party where there is cover, you may lie in wait for it instead (Spring an
   ambush). Each drawn from the tile and the day (hash), never Math.random: the game's random sequence is untouched */
const BTYPE_WORLD={kinds:['lord','party','patrol','caravan'],near:1,cover:{forest:.35,hills:.3,field:.15},by:{bandits:1,raiders:1.2,bog:1.2,lord:.5}};
// (a road bridge within near tiles of tile (tx,ty): its BattleSite's, worldmap.js; a generated world's from its crossings, its bridges)
const bridgeNear=(tx,ty,S=WM.battleSite(tx,ty))=>S.bridge!==null&&S.bridge<=BTYPE_WORLD.near;
// the cover at world point (x,y) for an ambush (its BattleSite's): 'forest', 'hills', 'field' (woods or rock on its battlefield) or null; and its words
function coverAt(x,y){const S=battleSiteAt(x,y),env=battleEnv(false,S),g=terrainOf(S,env);if(g.recipe==='forest')return 'forest';if(S.t===T_HILL||S.t===T_MOUNT||env.t===T_HILL)return 'hills';
  const T=buildTerrain({...g,W:clamp(BVW,FIELD_W.min,FIELD_W.max)});return T.has.wood||T.has.rock?'field':null}
const COVER_SAY={forest:'the trees',hills:'the rocky rises',field:'the thickets'};
function battleTypeFor(e){
  if(WORLD_BATTLE.on||!TERRAIN.on||!BTYPE_WORLD.kinds.includes(e.kind))return null;const S=battleSiteAt(P.x,P.y),env=battleEnv(false,S),g=terrainOf(S,env);
  if(g.river&&!g.river.frozen&&!g.river.stream&&bridgeNear(g.tx,g.ty,S))return{kind:'bridge',def:e.mine?1:0,ford:hash(g.tx,g.ty,4447)<BTYPE.ford};
  const by=e.mine?0:e.kind==='lord'?BTYPE_WORLD.by.lord:e.kind==='party'?BTYPE_WORLD.by[e.band||'bandits']||0:0,cv=by&&coverAt(P.x,P.y);
  return cv&&hash(g.tx,g.ty,G.day*13+7)<BTYPE_WORLD.cover[cv]*by?{kind:'ambush',hid:1}:null}
// you may lie in wait for them: you rode at them, where there is cover, and it is no bridge's fight
const canSpring=e=>!WORLD_BATTLE.on&&TERRAIN.on&&!!e.mine&&BTYPE_WORLD.kinds.includes(e.kind)&&!e.btype&&!!coverAt(P.x,P.y);
// the pre-battle panel's word on the battle's type
function typeHtml(e){const bt=e.btype;
  if(bt&&bt.kind==='bridge')return bt.def===0?'<p class="gold"><strong>Hold the bridge.</strong> You stand on your bank by it: they must come at you over the river, by the bridge'+(bt.ford?' or a ford far off it.':' or not at all.')+'</p>'
    :'<p class="gold"><strong>Take the bridge.</strong> They hold the far bank by it'+(bt.ford?', a ford far off it':'')+': you must cross.</p>';
  if(bt&&bt.kind==='ambush')return '<p class="bad"><strong>Ambush!</strong> They burst from cover beside the road: your band is caught in march order, with no time to deploy.</p>';
  return canSpring(e)?'<p class="muted">There is cover here: you can lie in wait beside the road and spring an ambush on them as they pass.</p>':''}
// (Spring an ambush: your band hidden beside the road, theirs on it in march order; no deployment for either)
onAct('bt-',a=>{const e=G.enc;if(a==='bt-spring'&&e&&G.mode==='dialog'&&canSpring(e)){e.btype={kind:'ambush',hid:0};startBattle({enemies:e.list,tournament:false,lv:e.lv||1,deploy:false})}});
function startEncounter(e){
  WildHunt.active?.finish('The hunt is interrupted.');
  if(e.mine==null)e.mine=!!G.youAttack;G.youAttack=false;if(e.lv==null&&e.ref&&e.ref.ld)e.lv=chiefLv(e.ref);// did you start it (you may call that off)? a chieftain's band fights at its level
  if(e.btype==null){const bt=battleTypeFor(e);if(bt)e.btype=bt}// (a battle type: none with terrain off)
  e.list=e.list||makeEnemies(e.n,e.kind==='camp',e.band);const env=battleEnv(),ground='<p class="muted">Battleground: '+env.name+'. '+terrainEnvText(env,e.kind,e.btype)+'</p>',band=BANDS[e.band||'bandits'];G.enc=e;G.mode='dialog';P.tx=null;G.chase=null;
  const given=!!e.allies;e.allies=e.allies||nearAllies(e);e.foes=e.foes||nearFoes(e);
  if(!given&&e.kind!=='tourney'){for(const p of cparties())if(!p.fight&&!p.inside&&nearYou(p)<REINF.r)e.allies.push(forceOf(p));// your companions' parties
    if(e.road&&e.road.k==='caravan')e.allies.push(guardsForce(e.road))}// (the caravan you ride to save: its own guards)
  for(const l of [e.kind==='lord'&&e.ref,...e.allies,...e.foes])if(l&&W.lords.includes(l))KNOWLEDGE.sight(l);
  if(e.men==null)e.men=playerList().length;// (your men at the start: the helpers' share of the spoils, reinfCut)
  // the garrison sallies: beside you when you fight a holding's besiegers, against you when an army comes to relieve your siege
  if(!given&&e.kind==='lord'){const t=townBy(e.ref.tgt);if(t&&t.gar>0){if(e.ref.state==='siege'&&!hostileTo(t.owner)&&t.owner!=='player')e.allies.push(garrisonForce(t));else if(e.ref.state==='relieve'&&mySiege(t))e.foes.push(garrisonForce(t))}}
  alignReinforcements(e);
  const ratio=(power(e.list)*lvPow(e.lv)+power(lordTroops(e.foes)))/(power(playerList())+power(lordTroops(e.allies))),threat=ratio<.6?'Easy':ratio<1?'Even':ratio<1.5?'Risky':'Deadly';
  const vm=vitals(),hurt=reinfHtml(e)+(P.hp<vm[0]*.6?'<p class="bad">You are wounded: '+Math.round(P.hp)+' / '+vm[0]+' health. Rest at an inn or travel to recover.</p>':''),cls=ratio<.6?'good':ratio<1?'gold':'bad',vs='Your power <strong>'+partyPower()+'</strong> vs <strong>'+rating(e.list,e.lv)+'</strong> · threat <strong class="'+cls+'">'+threat+'</strong>',lord=e.kind==='lord'&&e.ref,f=lord&&FACS[lord.fac];
  if(e.kind==='monster'||e.kind==='cave'){const M=MONSTERS[e.ref.id],u=ST[M.unit],Y=M.mythic;
    const finds=[M.mat&&'Trophy: '+MATS[M.mat].n+'.',M.gear.length&&'Rare finds: '+M.gear.map(([it])=>'<span style="color:'+RARITY[ITEMS[it].r]+'">'+ITEMS[it].n+'</span>').join(', ')+'.',Y&&Y.hoard&&'It guards a hoard of about '+Y.hoard.gold+' gold.'].filter(Boolean).join(' ');
    return showPanel('<h2>'+(Y?Y.title:(e.kind==='cave'?e.ref.name+': ':'')+M.n+' <span class="muted">· level '+e.lv+'</span>')+'</h2><p>'+M.d+'</p><p>'+e.list.length+' × '+u.n+' ('+u.hp+' hp'+(e.lv>1?', stronger with level':'')+'). '+vsLine(u)+'. You have <strong>'+P.fighters+'</strong> fighters.</p>'+ground+
      (finds?'<p class="muted">'+finds+'</p>':'')+hurt+'<p>'+vs+'</p>'+
      '<div class="btns"><button class="btn primary" type="button" data-act="fight">Fight</button><button class="btn" type="button" data-act="auto">Auto-resolve</button>'+fleeBtn(e)+'</div>')}
  if(e.kind==='field')return showPanel('<h2>'+e.title+'</h2><p>You ride into the battle'+(e.allies.length?' beside '+e.allies.map(l=>l.name).join(', '):'')+'.</p>'+ground+hurt+'<p>'+vs+'</p><div class="btns"><button class="btn primary" type="button" data-act="fight">Fight</button><button class="btn" type="button" data-act="auto">Auto-resolve</button><button class="btn" type="button" data-act="flee">Leave them to it</button></div>');
  showPanel('<h2>'+(e.title?e.title:lord?lord.name+' attacks':e.kind==='camp'?e.ref.name||'Bandit camp':band[0])+'</h2>'+(lord?'<p class="muted">An army of the <span style="color:'+f.col+'">'+f.n+'</span>.</p>':'')+'<p>Scouts count about <strong>'+encounterMainFighters(e)+'</strong> '+(e.word||'fighters')+(encounterMainFighters(e)>e.list.length?' including their leader':'')+'.'+ground+' You have <strong>'+P.fighters+'</strong> fighters, including yourself.</p>'+typeHtml(e)+hurt+'<p>'+vs+'</p><div class="btns"><button class="btn primary" type="button" data-act="fight">Fight</button>'+(canSpring(e)?'<button class="btn" type="button" data-act="bt-spring">Spring an ambush</button>':'')+'<button class="btn" type="button" data-act="auto">Auto-resolve</button>'+fleeBtn(e)+'</div>');
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
  if(P.staminaState()==='exhausted')return{ch:0,why:'Your band is too exhausted to run'};// (world/supply.js: you cannot outrun anyone)
  const my=mySpeed(),th=chaserSpeed(e);if(th>=my*1.2)return{ch:0,why:'They are far faster than your band'};
  const rough=terrAt(P.x,P.y)===T_FOREST||terrAt(P.x,P.y)===T_HILL,night=darkness()>.5,feet=mountDef()?.01*skill('ride'):.01*skill('athl');
  return{ch:clamp(.45+1.0*(my/th-1)+(night?.1:0)+(hiddenAt(P.x,P.y)?.1:0)+feet+(has('vanish')&&(rough||night)?.15:0),.1,.9)};
}
// the button: Leave, Flee with its odds, or why you cannot (sealed: a fight that cannot be left before the first blow, its why:
// woken guardians, sites.js Ruins)
function fleeBtn(e,label){if(e.sealed)return '<button class="btn" type="button" data-act="flee" disabled title="'+e.sealed+'">Leave · '+e.sealed+'</button>';const od=fleeOdds(e);if(od.leave)return '<button class="btn" type="button" data-act="flee">'+(label||'Leave')+'</button>';
  return '<button class="btn" type="button" data-act="flee"'+(od.ch<=0?' disabled title="'+od.why+'"':'')+'>Flee · '+(od.ch<=0?od.why:Math.round(od.ch*100)+'% to get away')+'</button>'}
function flee(){
  const e=G.enc;if(!e||e.sealed)return;const o=e.ref,od=fleeOdds(e);if(!od.leave&&od.ch<=0)return;
  if(!od.leave&&Math.random()>=od.ch){// they run you down: the rearguard pays, and you must fight
    const n=P.size?Math.max(1,Math.round(P.size*.1*(has('rearguard')?.5:1))):0,lost=countsOf(P.removeAny(n));e.noFlee=true;
    log('They run you down'+(n?': your rearguard loses '+lossText(lost):'')+'. You must fight.','bad','war');mood('flee');return startEncounter(e)}
  let dx=P.x-o.x,dy=P.y-o.y;const l=Math.hypot(dx,dy)||1;
  walk(P,dx/l,dy/l,od.leave?40:56);if(e.kind!=='camp')o.cool=od.leave?6:12;G.encCool=od.leave?4:3;// got away: they lose your trail for a while
  if(!od.leave)P.morale=clamp(P.morale-2,0,100);G.enc=null;G.mode='world';hidePanel();log(od.leave?'You leave them be.':'You get away.',undefined,'war');if(!od.leave)mood('flee');encLost(e);
}
// experience: yours (leaders.js), and your companions share what you learn
function gainXp(n){leaderOf(P).gainXp(n);for(const id of compsInBand())compXp(id,n)}
function applyLosses(lost){return partyRoster(P).lose(lost)}
function lossText(lost){const k=Object.keys(lost).filter(x=>lost[x]>0);return k.length?k.map(x=>lost[x]+' '+ST[x].n.toLowerCase()).join(', '):'none'}
/* what winning brings: every fight pays gold per foe, renown, XP and morale; then each kind of encounter has its own outcome.
   big: a hard-won fight (more gold, renown and XP); drop: rolls a piece of gear; fame: reputation it earns at the nearest holding
   (0 for fights against a holding's own people; unset: by the number slain); won(e, slain, res) settles the rest, may add to
   res.gold or set res.fame, and returns a line for the victory panel; lost(e), if it has one: what fleeing or losing it costs
   or leaves behind (encLost: fled before the first blow, withdrawn or beaten: resolution.js) */
const gearTop=()=>Math.min(MATERIALS.length-1,1+Math.floor(G.day/20));
const clearPlace=(o,days)=>{o.cleared=true;o.back=G.day+days;pacify(o.x,o.y)};
const ON_WIN={
  party:{drop:()=>Math.random()<.3?randomGear(0,gearTop()):null,won:e=>{worldEmit('band:beaten',{band:e.ref});bandits=bandits.filter(x=>x!==e.ref);return ''}},
  camp:{big:true,fame:10,drop:()=>Math.random()<.8?randomGear(0,gearTop()):null,won:(e,slain,res)=>{worldEmit('site:cleared',{site:e.ref});(e.ref.bands||[]).forEach(b=>{worldEmit('band:beaten',{band:b});chiefEscapes(b.ld)});e.ref.bands=[];clearPlace(e.ref,10);return e.ref.plunder(res)}},
  monster:{won:(e,slain,res)=>{const m=e.ref;worldEmit('monster:slain',{monster:m});W.monsters=W.monsters.filter(x=>x!==m);gainXp(monsterXp(m,slain));return monsterLoot(m,slain)+(MONSTERS[m.id].mythic?mythicSlain(m,res):'')}},
  cave:{won:(e,slain)=>{worldEmit('site:cleared',{site:e.ref});gainXp(monsterXp(e.ref,slain));return monsterLoot(e.ref,slain)+e.ref.lairWon()},lost:e=>e.ref.lairLost(e)},
  lord:{big:true,fame:0,drop:()=>Math.random()<.6?randomGear(1,gearTop()+1):null,won:(e,slain,res)=>lordWon(e.ref,res)},
  caravan:{fame:0,won:e=>e.seize?e.ref.seize():e.ref.loot()},
  estate:{fame:0,won:e=>estateWon(e)},
  patrol:{fame:0,won:(e,slain)=>patrolWon(e,slain)},
  field:{won:e=>fieldWon(e)+(e.spoils||'')},
  siege:{big:true,fame:0,won:e=>siegeWon(e)},
  raid:{fame:0,won:e=>siegeWon(e)},
  villagers:{fame:0,won:e=>villagersWon(e),lost:e=>villagersLost(e)},
  ruin:{drop:()=>Math.random()<RUIN.drop?randomGear(0,gearTop()):null,won:e=>e.ref.occWon(e)}
};
const encLost=e=>{const L=ON_WIN[e.kind]&&ON_WIN[e.kind].lost;if(L)L(e)};
function autoResolve(){
  const e=G.enc,pl=playerList(),al=e.allies||[],fl=e.foes||[],pp=(power(pl)+power(lordTroops(al)))*(.8+Math.random()*.4)*(1+.05*skill('tact')),ep=(power(e.list)*lvPow(e.lv)+power(lordTroops(fl)))*(e.kind==='lord'?lordTac([e.ref,...fl]):lordTac(fl))*(.8+Math.random()*.4),win=pp>ep;
  const loser=win?ep/pp:pp/ep,frac=win?clamp(.1+.6*loser*loser,.05,.8):1,lost=partyRoster(P).losses(frac);
  const helpers=e.kind==='field'&&win?lordTroops(fl).slice():[];
  al.forEach(l=>cull(l,Math.min(frac,.85)));fl.forEach(l=>cull(l,win?.6:clamp(.1+.6*loser*loser,.05,.5)));
  concludeEncounter(win,lost,e.list.length+helpers.length,true,e.list.concat(helpers));
}
