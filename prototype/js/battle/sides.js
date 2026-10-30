'use strict';
/* Armies retain ownership; diplomacy, not different IDs, decides who may fight whom. */
const armySource=o=>o?.src||o;
function armyRelation(a,b){
 a=armySource(a);b=armySource(b);if(a===b)return 1;if(!a||!b)return 0;
 const ak=a.mapKind||a.kind,bk=b.mapKind||b.kind,player=o=>o===P||o.mapKind==='cparty'||forceRealm(o)==='player';
 if(ak==='monster'||bk==='monster')return ak===bk&&a.id===b.id?1:-1;
 if(ak==='band'||bk==='band')return ak===bk&&(a.kind||'bandits')===(b.kind||'bandits')?1:-1;
 if(player(a)&&player(b))return 1;const fa=forceRealm(a),fb=forceRealm(b);
 if(player(a)||player(b)){const f=player(a)?fb:fa;return f==='player'?1:f&&hostileTo(f)?-1:f&&(f===P.fac||friendFac(f))?1:0}
 return fa&&fb?fa===fb||relOf(fa,fb).s==='ally'?1:atWar(fa,fb)?-1:0:0;
}
const battleTeam=x=>typeof x==='number'?x:x?.team;
const battleEnemy=(a,b)=>B?.sides?.active?B.sides.relation(battleTeam(a),battleTeam(b))<0:battleTeam(a)!==battleTeam(b);
const battleFriend=(a,b)=>B?.sides?.active?B.sides.relation(battleTeam(a),battleTeam(b))>0:battleTeam(a)===battleTeam(b);
// (a fight your own army is out of (your hero and your groups, none of them fighting) while others fight on, in any battle (the
// owner, 2026-10-30: "if player army fallen, ensure that we can skip or end battle with auto resolve"): Skip to the end runs it
// on at once, in the field's own steps (a world battle's WORLD_BATTLE.step, as its frames are; else step s), at most max s of it,
// still undecided then the stronger has the field; Auto-resolve settles it now, by chance as their strength stands)
const BATTLE_SKIP={step:1/30,max:180};
// (beaten or withdrawn: your hero's experience for each of your army's kills, as a withdrawal's: resolution.js conclude)
const BATTLE_SPOILS={lostXp:4};
// (what an army has left on the field: each man's health by his tier, a character as four)
const armyPower=u=>u.hp/Math.max(1,u.max)*(isChar(u)?4:ST[u.type]?.tier||1);
const ownDown=()=>!!B&&!B.over&&!B.opts?.tournament&&!B.units.some(u=>u.team===0&&(u.hero||B.groups[u.grp]?.player)&&fighting(u));
function skipBattle(){if(!ownDown())return;B.paused=false;if(B.sides?.active)return B.sides.skip();runOn(B);if(!B.over)settleBy(B,...teamPowers(B),false)}
function resolveBattle(){if(!ownDown())return;if(B.sides?.active)return B.sides.skip(true);settleBy(B,...teamPowers(B),true)}
function runOn(b){const X=BATTLE_SKIP,st=b.world?WORLD_BATTLE.step:X.step;for(let i=0;i<X.max/st&&!b.over&&B===b;i++)battleStep(st,!!b.world)}
// (two sides: what each has left fighting)
const teamPowers=b=>[0,1].map(t=>b.units.filter(u=>u.team===t&&fighting(u)).reduce((n,u)=>n+armyPower(u),0));
// (settled by what is left, f for you and e against: the stronger has the field; now, by chance as they stand)
function settleBy(b,f,e,now){b.over=true;b.endT=END_WAIT;b.win=now?Math.random()<f/Math.max(1e-9,f+e):f>e}
class BattleSides{
 static eligible(e){return ['party','lord','patrol','caravan','monster','field'].includes(e?.kind)}
 static limit(e,enemies=e?.list?.length||0){if(!e)return;const slots=BATTLE_JOIN.armies-(enemies?2:1),keepFoes=!enemies&&e.foes?.length?1:0;e.allies=(e.allies||[]).slice(0,Math.max(0,slots-keepFoes));e.foes=(e.foes||[]).slice(0,slots-e.allies.length)}
 constructor(b,e){
  this.b=b;this.enc=e;this.records=[];this.byOwner=new Map();this.byForce=new Map();this.active=false;
  for(const g of Object.values(b.groups)){
   const members=b.units.filter(u=>u.grp===g.id),first=members[0];if(!first)continue;const force=g.player?P:first.sourceArmy||first.leader?.ref||e.ref;let owner=armySource(force);
   if(!g.player&&g.team===1&&e.kind!=='field'&&e.list?.length&&!(e.ref instanceof Party)&&!force?.src&&!force?.fac)owner=e.ref;
   let r=this.byForce.get(force)||this.byOwner.get(owner);if(!r)r=this.add(owner,force,g.team,true);r.neutral=(e.neutralForces||[]).some(o=>armySource(o)===owner);r.start=(r.start||0)+members.length;r.groups.push(g.id);r.joined=r.joined||members.some(u=>!u.waiting);
  }
  if(this.records.some(r=>r.neutral))this.activate();for(const r of this.records)for(const q of this.records)if(r.id<q.id&&r.base===q.base&&r.owner!==P&&q.owner!==P&&armyRelation(r.owner,q.owner)<0)this.activate();
 }
 add(owner,force,base,initial=false){const r={id:this.records.length,owner,force,base,team:base,initial,joined:false,groups:[],damage:0,kills:[],playerKills:[]};this.records.push(r);this.byOwner.set(owner,r);this.byForce.set(force,r);return r}
 teamRecord(team){return this.records.find(r=>r.team===team)}
 record(u){return this.records.find(r=>r.groups.includes(u.grp))||this.teamRecord(u.team)}
 pair(a,b){
  if(a===b)return 1;if(a.owner===P||b.owner===P){const other=a.owner===P?b:a;if(other.initial&&!other.neutral)return other.base===0?1:-1;if(other.duty&&armyRelation(a.owner,b.owner)>=0)return 1}
  const relation=armyRelation(a.owner,b.owner);if(relation)return relation;if(a.initial&&b.initial&&!a.neutral&&!b.neutral)return a.base===b.base?1:-1;return 0;
 }
 // (asked for every pair of men near each other in the jostle (battle.js): remembered while it runs (memo, nothing can change
 // who is whose foe meanwhile), asked afresh everywhere else)
 relation(a,b){if(a===b)return 1;const M=this.memo,k=a*4096+b;let v=M?M.get(k):undefined;
  if(v===undefined){const x=this.teamRecord(a),y=this.teamRecord(b);v=x&&y?this.pair(x,y):0;if(M)M.set(k,v)}return v}
 teams(){return [...new Set(this.records.filter(r=>r.joined).map(r=>r.team))]}
 colourKey(team){return team===0?'own':this.relation(0,team)>0?'ally':this.relation(0,team)<0?'foe':'neutral'}
 colour(team){return ['#6fa8e0','#e0605a','#b69ae5','#dba75f','#63c7bf','#da8fa5','#9fbe71','#c8b9a4'][team%8]}
 label(r){return r.owner===P?P.name||'Your army':r.owner.name||r.force?.name||r.owner.label?.()||'An army'}
 activate(){
  if(this.active)return;this.active=true;const b=this.b;
  this.memo=null;for(const r of this.records)r.team=r.id;
  for(const r of this.records)for(const id of r.groups){const g=b.groups[id];if(!g)continue;g.team=r.team;if(r.team!==0&&!g.armyName){g.armyName=this.label(r);g.name=g.armyName+' · '+g.name}g.ally=r.team!==0&&this.relation(0,r.team)>0;g.foe=this.relation(0,r.team)<0;if(g.resolve)g.resolve.team=r.team;for(const u of b.units)if(u.grp===id){u.team=r.team;u.hid=0;delete u.ls;delete u.rv;u.tgt=null;if(u.leader)u.leader.team=r.team}}
  for(const a of b.arrows)if(a.by)a.team=a.by.team;b.captains={};b.sight=null;b.cmdT=0;
 }
 // (your side by duty: an ally of yours in this fight, or the land's own lord or watch against outlaws on it: engage.js localBanditDuty;
 // a neutral lord riding in for the bounty stays his own)
 duty(o){const e=this.enc;return (e.allies||[]).some(f=>armySource(f)===o)||(o.mapKind==='lord'||o.mapKind==='patrol')&&!!localBanditDuty(e,o)}
 reserve(o){
  o=armySource(o);const old=this.byOwner.get(o);if(old)return old;if(this.records.length>=BATTLE_JOIN.armies)return null;
  const relations=this.records.map(r=>armyRelation(o,r.owner)),duty=this.duty(o);if(!relations.some(v=>v<0))return null;
  // (a friend of yours by duty joins your side where it is at odds with no one on it: pair)
  let team=-1;if(!this.active)for(const t of [0,1])if(this.records.every((r,i)=>duty&&t===0&&r.team===0?relations[i]>=0:relations[i]===(r.team===t?1:-1))){team=t;break}
  if(team<0)this.activate();const r=this.add(o,o,team<0?this.records.length:team);r.duty=duty;if(this.active)r.team=r.id;return r;
 }
 room(o,count=null){return this.b.units.filter(u=>u.hp>0&&!u.left).length+(count??(o.fighters||o.troops.length))<=BATTLE_JOIN.fighters}
 joined(o,force,groups){const r=this.byOwner.get(armySource(o));if(!r)return;r.force=force;this.byForce.set(force,r);r.groups.push(...groups);r.start=this.b.units.filter(u=>groups.includes(u.grp)).length;r.joined=true}
 intent(r){const enemies=this.records.filter(q=>q!==r&&this.pair(r,q)<0).map(q=>this.label(q));return enemies.length?'hostile to '+enemies.join(' and '):'neutral'}
 damage(t,n,source){const r=source&&this.record(source);if(r&&battleEnemy(source,t))r.damage+=n}
 kill(t,source,credit=true){
  const r=source&&this.record(source),victim=this.record(t);if(!r||!battleEnemy(source,t))return;r.kills.push(t.type);if(victim&&t.leader&&r.owner===P)victim.playerLeader=true;
  if(credit&&source.grp){const K=this.b.grpKills||(this.b.grpKills={});K[source.grp]=(K[source.grp]||0)+1}
  if(r.owner===P){if(credit){this.b.kills++;this.b.slain.push(t.type)}if(victim)victim.playerKills.push(t.type)}
 }
 // (over once your side has no one fighting or no foe is left: your side is your army and, once yours is down, whoever fights
 // on against your foes: your allies, or an army not at war with you that is with them (the owner, 2026-10-30: captured by the
 // bandits while another army fought them still); b.byAllies: won by them; withdrawn is withdrawn, whatever the others do)
 check(){
  const b=this.b,player=b.units.filter(u=>u.team===0&&fighting(u)),enemies=b.units.filter(u=>battleEnemy(0,u)&&fighting(u));
  if(enemies.length&&retreating()){retreatNow();return}
  const friends=player.length?player:this.fightOn();
  // (no one fights for you, but your foes are at war with each other: they fight on, and whoever holds the field takes you (the
  // owner, 2026-10-30: a watch and bandits both on you, "captured or have to do something with the winner, instead of withdrawn"))
  if(!player.length&&!friends.length&&this.rivals()){if(!b.allyOn){b.allyOn=b.rivals=true;log('Your army is down. Your foes fight on against each other: whoever holds the field decides your fate.','bad','war')}return}
  if(!player.length&&friends.length&&!b.allyOn){b.allyOn=true;log('Your army is down. '+(friends.some(u=>this.relation(0,u.team)>0)?'Your allies fight on.':'The others fight on against your foes.'),'bad','war')}
  if(friends.length&&(enemies.length||b.world.pending.some(p=>p.o.troops.length&&this.relation(0,this.byOwner.get(p.o)?.team)<0)))return;b.over=true;b.endT=END_WAIT;b.win=!!friends.length;b.byAllies=b.win&&!player.length;
  // (withdrawn only as you withdrew (morale.js retreating): a man of yours routing off the field is no withdrawal; beaten, the
  // strongest of your foes still standing has you: victor)
  if(!b.win&&retreating())b.retreat=true;if(!b.win&&!b.retreat)b.captor=this.victor();
 }
 // (your foes still fighting, at war with each other)
 rivals(){const t=[...new Set(this.b.units.filter(u=>battleEnemy(0,u)&&fighting(u)).map(u=>u.team))];return t.some(a=>t.some(c=>this.relation(a,c)<0))}
 // (who holds the field among your foes: the strongest still fighting, by power (their health by their tier); its record)
 victor(){const by=new Map();for(const u of this.b.units)if(battleEnemy(0,u)&&fighting(u))by.set(u.team,(by.get(u.team)||0)+armyPower(u));
  let best=null,bp=0;for(const [t,p] of by)if(p>bp){bp=p;best=t}return best==null?null:this.teamRecord(best)}
 // (the encounter you are beaten by: the one you met, or the army that holds the field)
 captorEnc(r){const e=this.enc,o=r?.owner;if(!o||o===P||o===armySource(e?.ref))return e;return{kind:o.mapKind==='band'?'party':o.mapKind,ref:o,list:(o.troops||[]).slice()}}
 // (who fights on for you, your army down: an ally, or one not at war with you at war with a foe of yours: any of the field's,
 // fled or fallen too, so a foe beaten still leaves them yours)
 fightOn(){const teams=[...new Set(this.b.units.filter(u=>battleEnemy(0,u)).map(u=>u.team))];return this.b.units.filter(u=>u.team!==0&&fighting(u)&&(this.relation(0,u.team)>0||this.relation(0,u.team)===0&&teams.some(t=>this.relation(u.team,t)<0)))}
 /* skip to the end (your army down, the rest fighting on: BATTLE_SKIP): the fight run on at once, as it would go, at most max s of
    it; still undecided then, the stronger side by what is left of it (power: their health by their tier) has the field; now
    (Auto-resolve): settled at once, by chance as they stand */
 skip(now){const b=this.b;if(!now)runOn(b);if(b.over||B!==b)return;
  const enemies=b.units.filter(u=>battleEnemy(0,u)&&fighting(u)),friends=this.fightOn(),sum=a=>a.reduce((n,u)=>n+armyPower(u),0);
  settleBy(b,sum(friends),sum(enemies),now);b.byAllies=b.win;if(!b.win)b.captor=this.victor()}
 survivors(r){return this.b.units.filter(u=>r.groups.includes(u.grp)&&(u.hp>0||u.left)&&!u.waiting)}
 continueFight(){
  const b=this.b,old=b.world.fight;if(old)W.fights=W.fights.filter(f=>f!==old);
  const alive=[];
  for(const r of this.records){if(r.owner===P||!r.joined)continue;syncForces([r.force]);const survivors=this.survivors(r),o=r.owner;
   if(o instanceof Party){const leader=survivors.find(u=>u.leader);if(leader)o.hp=leader.left?leader.hpLeft:leader.hp;
    if(!survivors.length){if(r.handled)continue;if(r.playerKills.length){if(o.mapKind==='monster')worldEmit('monster:slain',{monster:o});if(o.mapKind==='band')worldEmit('band:beaten',{band:o});if(o.mapKind==='lord')worldEmit('lord:beaten',{lord:o})}routParty(o,[]);continue}
    const positions=survivors.map(u=>b.world.world(u));o.x=positions.reduce((n,p)=>n+p.x,0)/positions.length;o.y=positions.reduce((n,p)=>n+p.y,0)/positions.length;o.fight=null;o.cool=4;const live=survivors.filter(u=>u.hp>0&&!u.rout&&b.groups[u.grp]?.order!=='withdraw');if(live.length&&o.troops.length)alive.push(o);
   }
  }
  if(old)for(const o of fightParties(old))if(!this.byOwner.has(o)&&o.troops.length){o.fight=null;o.cool=4;alive.push(o)}
  resumeArmyFight(alive,(a,b)=>{const x=this.byOwner.get(a),y=this.byOwner.get(b);return x&&y?this.pair(x,y)<0:old?fightHostile(old,a,b):armyRelation(a,b)<0});
 }
 // (won: the armies that won it with you, each with its share of the spoils by its part in the fight (the harm it did the foe, else
 // its kills; yours from before you fell too): you, your allies, and those not at war with you who fought your foes)
 shares(){const me=this.records.find(r=>r.owner===P);if(!me)return new Map();
  const won=this.records.filter(r=>r===me||r.joined&&(this.pair(me,r)>0||this.pair(me,r)===0&&r.damage>0&&this.records.some(q=>this.pair(me,q)<0&&this.pair(r,q)<0)));
  const by=won.some(r=>r.damage>0)?r=>r.damage:won.some(r=>r.kills.length)?r=>r.kills.length:r=>r===me?1:0,all=won.reduce((n,r)=>n+by(r),0)||1;return new Map(won.map(r=>[r,by(r)/all]))}
 // (won: each army that stood beside you thinks better of you: a lord (RELATION.fightBeside), his realm (REINF.honor.beside), a
 // watch's holding (REINF.rep))
 thanks(){for(const r of this.records){if(r.owner===P||!r.joined||this.relation(0,r.team)<=0)continue;const o=r.owner;
   if(o.mapKind==='lord'&&!o.dead)changeRel(o,RELATION.fightBeside,'you fought beside them');if(o.fac&&FACS[o.fac]&&o.fac!=='player')addHonor(o.fac,REINF.honor.beside,true);if(o.mapKind==='patrol'&&o.home)addRep(o.home,REINF.rep,true)}}
 settle(b,lost,groups){
  const e=this.enc,credit=this.records.find(r=>r.owner===P),kills=credit?.kills||[],saved=heal(lost,groups);for(const g of groups)if(g.count)partyRoster(P).remove(g.type,g.count,g.id);
  // (the owner, 2026-10-30: won, "the split shared based on army performance"; lost or withdrawn, "no reward beside exp": only the
  // experience your army earned, its kills', BATTLE_SPOILS.lostXp of them)
  const sh=b.win?this.shares():null,mine=sh?.get(credit)||0,spoils=sh?[...sh.keys()].flatMap(r=>r.kills):[];gainXp(kills.length*(b.win?8:BATTLE_SPOILS.lostXp));
  if(b.win){let gold=0;for(const k of spoils)if(!ST[k].beast)gold+=rint(2,6);gold=Math.round(gold*mine*(1+tm('loot')));P.gold+=gold;P.renown+=Math.round(spoils.length*mine);takePrisoners(spoils.slice(0,Math.round(spoils.length*mine)));
   for(const r of this.records)if(r.owner.mapKind==='monster'&&r.playerKills.length)monsterLoot(r.owner,r.playerKills)}
  for(const u of b.units)if(u.team===0&&!u.hero&&!u.comp&&!u.lord&&((u.xp||0)>0||u.atkAt!=null))txpGain(u.type,(u.xp||0)+TROOP_XP.fight+(b.win?TROOP_XP.win:0));txpClamp();
  if(b.win)for(const r of this.records){if(r.owner===P||!r.joined||this.survivors(r).length||!r.playerKills.length)continue;const o=r.owner;
   if(o.mapKind==='lord'&&r.playerLeader){spoilsWon({kind:'lord',ref:o});const res={gold:0,fame:0};lordWon(o,res);P.gold+=res.gold||0;r.handled=true}
   else if(o.mapKind==='caravan'&&r.playerKills.length>=r.start/2){if(e.kind==='caravan'&&o===e.ref&&e.seize)o.seize();else o.loot();r.handled=true}
   else if(o.mapKind==='band'&&o.ld&&r.playerLeader){spoilsWon({kind:'party',ref:o});captureChief(o.ld);o.ld=null}
  }
  this.continueFight();let heading=b.win?'Victory':b.retreat?'Withdrawn':'Defeat',detail=(b.byAllies?'Your army fell, but '+(b.units.some(u=>u.team!==0&&u.hp>0&&this.relation(0,u.team)>0)?'your allies':'the others')+' held the field. ':'')+'Your army defeated '+kills.length+' foes. '+(b.win?'The spoils are shared by each army’s part in the fight: yours '+Math.round(mine*100)+'%.':'You keep only what your men learned.');
  if(b.win){this.thanks();
   // (as a battle of two gives (resolution.js conclude, engage.js reinfAfter): the holding near the fight thinks better of you, and a
   // common enemy cleared on a realm's land with its men beside you, that realm more)
   const O=ON_WIN[e?.kind]||ON_WIN.party,fame=O.fame==null?Math.max(2,Math.round(spoils.length*mine/2)):O.fame;if(fame)repNear(P.x,P.y,fame);
   const h=e&&commonFoe(e)&&landHold(P.x,P.y),lf=h&&h.owner;if(lf&&lf!=='player'&&this.records.some(r=>r.owner!==P&&r.joined&&this.relation(0,r.team)>0&&forceRealm(r.owner)===lf))addHonor(lf,REINF.honor.land,true)}
  // (beaten, your allies too: taken captive, or away in the rout: world/captivity.js)
  // (by whoever holds the field: captorEnc; it grows by its win as in a battle of two, resolution.js conclude)
  if(!b.win&&!b.retreat){if(prisonerCount()){P.prisoners={};log('Your prisoners escape in the chaos.','bad','war')}captivesEscape();const ce=this.captorEnc(b.captor)||e,fate=Captivity.defeat(ce);if(ce?.ref&&ce.kind!=='camp')ce.ref.cool=8;
   if(ce?.kind==='party')chiefWins(ce.ref,partySize()+1);if(ce?.kind==='lord')lordWins(ce.ref,partySize());if(ce?.kind==='patrol'){const h=townBy(ce.ref.home);if(h)h.crime=null}
   if(ce!==e)detail+=' '+cap1(this.label(b.captor))+' held the field.';detail+=' '+fate.text;log('Defeat. '+fate.text,'bad','war')}
  if(!b.win)encLost(e);
  const moodLine=battleMood(b.win?(kills.length?4:0):b.retreat?-8:-15,b.win?'victory':b.retreat?'withdrawal':'defeat');G.enc=null;G.encCool=4;G.mode='dialog';worldEmit('battle:ended',{enc:e,how:b.win?'won':b.retreat?'withdrawn':'lost'});
  const report={groups:groups.map(g=>({id:g.id,type:g.type,name:g.name,start:g.start,fit:g.start-g.count,wounded:g.wounded,killed:g.count-g.wounded,saved:g.saved,rearguard:0})),characters:[]};
  lootShow('<h2>'+heading+'</h2><p>'+detail+' Surviving armies keep their own soldiers; other hostile armies can continue fighting.</p>'+moodLine,lost,saved,'cont',report);updateHUD(true);
 }
}
