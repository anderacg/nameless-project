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
 relation(a,b){if(a===b)return 1;const x=this.teamRecord(a),y=this.teamRecord(b);return x&&y?this.pair(x,y):0}
 teams(){return [...new Set(this.records.filter(r=>r.joined).map(r=>r.team))]}
 colourKey(team){return team===0?'own':this.relation(0,team)>0?'ally':this.relation(0,team)<0?'foe':'neutral'}
 colour(team){return ['#6fa8e0','#e0605a','#b69ae5','#dba75f','#63c7bf','#da8fa5','#9fbe71','#c8b9a4'][team%8]}
 label(r){return r.owner===P?P.name||'Your army':r.owner.name||r.force?.name||r.owner.label?.()||'An army'}
 activate(){
  if(this.active)return;this.active=true;const b=this.b;
  for(const r of this.records)r.team=r.id;
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
 check(){
  const b=this.b,player=b.units.filter(u=>u.team===0&&fighting(u)),enemies=b.units.filter(u=>battleEnemy(0,u)&&fighting(u));
  if(enemies.length&&retreating()){retreatNow();return}
  if(player.length&&(enemies.length||b.world.pending.some(p=>p.o.troops.length&&this.relation(0,this.byOwner.get(p.o)?.team)<0)))return;b.over=true;b.endT=END_WAIT;b.win=!!player.length;
  if(!b.win&&player.length===0&&b.units.some(u=>u.team===0&&u.left))b.retreat=true;
 }
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
 settle(b,lost,groups){
  const e=this.enc,credit=this.records.find(r=>r.owner===P),kills=credit?.kills||[],saved=heal(lost,groups);for(const g of groups)if(g.count)partyRoster(P).remove(g.type,g.count,g.id);
  let gold=0;for(const k of kills)if(!ST[k].beast)gold+=rint(2,6);gold=Math.round(gold*(1+tm('loot')));P.gold+=gold;P.renown+=kills.length;gainXp(kills.length*8);takePrisoners(kills);
  for(const r of this.records)if(r.owner.mapKind==='monster'&&r.playerKills.length)monsterLoot(r.owner,r.playerKills);
  for(const u of b.units)if(u.team===0&&!u.hero&&!u.comp&&!u.lord&&((u.xp||0)>0||u.atkAt!=null))txpGain(u.type,(u.xp||0)+TROOP_XP.fight+(b.win?TROOP_XP.win:0));txpClamp();
  for(const r of this.records){if(r.owner===P||!r.joined||this.survivors(r).length||!r.playerKills.length)continue;const o=r.owner;
   if(o.mapKind==='lord'&&r.playerLeader){spoilsWon({kind:'lord',ref:o});const res={gold:0,fame:0};lordWon(o,res);P.gold+=res.gold||0;r.handled=true}
   else if(o.mapKind==='caravan'&&r.playerKills.length>=r.start/2){if(e.kind==='caravan'&&o===e.ref&&e.seize)o.seize();else o.loot();r.handled=true}
   else if(o.mapKind==='band'&&o.ld&&r.playerLeader){spoilsWon({kind:'party',ref:o});captureChief(o.ld);o.ld=null}
  }
  this.continueFight();let heading=b.win?'Victory':b.retreat?'Withdrawn':'Defeat',detail='Your army defeated '+kills.length+' foes. Rewards count only your army’s kills.';
  if(!b.win&&!b.retreat){const loss=Math.floor(P.gold*.25);P.gold-=loss;const safe=TOWNS.filter(t=>!hostileTo(t.owner)),near=Spatial.nearest(safe.length?safe:TOWNS,P.x,P.y);heroAtGate(near);detail+=' You lost '+loss+' gold and were carried to '+near.name+'.'}
  const moodLine=battleMood(b.win?(kills.length?4:0):b.retreat?-8:-15,b.win?'victory':b.retreat?'withdrawal':'defeat');G.enc=null;G.encCool=4;G.mode='dialog';worldEmit('battle:ended',{enc:e,how:b.win?'won':b.retreat?'withdrawn':'lost'});
  const report={groups:groups.map(g=>({id:g.id,type:g.type,name:g.name,start:g.start,fit:g.start-g.count,wounded:g.wounded,killed:g.count-g.wounded,saved:g.saved,rearguard:0})),characters:[]};
  lootShow('<h2>'+heading+'</h2><p>'+detail+' Surviving armies keep their own soldiers; other hostile armies can continue fighting.</p>'+moodLine,lost,saved,'cont',report);updateHUD(true);
 }
}
