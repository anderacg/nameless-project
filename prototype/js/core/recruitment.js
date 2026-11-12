'use strict';
/* Recruitment owns prices, eligibility and roster changes. Quotes are read-only and shared by screens and commands. */
class RecruitmentService{
  constructor(player,rules){this.player=player;this.rules=rules}
  hireCost(k){const s=this.rules.troops[k];return s?Math.round(this.rules.hire[k]*(this.rules.has('silver')?.8:1)*(s.race&&s.race===this.player.race?.85:1)*(1-this.rules.effect('hire'))):0}
  // (a group's upgrade (the owner, 2026-10-31: "every tier after levy require enlist"): at its last rank (core/ranks.js), at a
  // barracks, for trainCost a man; a special one (to TRAIN_PLACE.tier or up, or into a caster) with an expert trainer of its role
  // there too (world/trainers.js upgradeTrainer); into a mounted kind, a horse a man (the rules' horses: yours first, then its
  // stable's). Never in the field: anywhere is no more)
  special(k){const s=this.rules.troops[k],at=this.rules.trainPlace;return !!s&&(!!s.magic||!!at&&s.tier>=at.tier)}
  anywhere(k){return false}
  trainPrice(k){return this.trainCost(k)}
  trainCost(k){const s=this.rules.troops[k];return s?Math.round((s.tier>=3?45:25)*(this.rules.has('drill')?.6:1)*(1-this.rules.effect('train'))):0}
  closed(t){return !t||['sacked','raided','turmoil'].some(k=>(t[k]||0)>this.rules.day())}
  quoteHire(t,k,n=1,target){
    if(target===undefined&&this.rules.target)target=this.rules.target(k);
    const unitCost=this.hireCost(k),cost=unitCost*n,fail=code=>({ok:false,code,kind:k,count:n,target,cost,unitCost});
    if(!this.rules.troops[k]||!Number.isFinite(this.rules.hire[k]))return fail('invalid-unit');
    if(!troopAmount(n)||!Number.isSafeInteger(cost)||cost<0)return fail('amount');
    if(this.closed(t))return fail('closed');
    if(!t.races.some(r=>t.hires(r).includes(k)))return fail('unavailable');
    if(!this.rules.canHire(t,k))return fail('standing');
    if((t.vol||0)<n)return fail('volunteers');
    if(this.player.gold<cost)return fail('gold');
    if(this.rules.size()+n>this.rules.capacity())return fail('capacity');
    if(this.rules.roster&&target!=='new'&&!this.rules.roster().groups.some(g=>g.id===target&&g.type===k))return fail('target');
    if(this.rules.canGroup&&!this.rules.canGroup(k,target,n))return fail('groups');
    return {ok:true,code:'hire',kind:k,count:n,target,cost,unitCost};
  }
  hire(t,k,n=1,target){
    const result=this.quoteHire(t,k,n,target);if(!result.ok)return result;
    if(this.rules.add){if(this.rules.add(k,n,result.target)!==n)return {...result,ok:false,code:'target'}}else for(let i=0;i<n;i++)this.player.add(k);
    this.player.gold-=result.cost;t.vol-=n;t.pop=Math.max(10,t.pop-n);return result;
  }
  reinforce(t,id){
    const r=this.rules.roster(),g=r.groups.find(g=>g.id===id);if(!g)return null;
    // (the new men's share of the group's upgrades too, as at the hiring desk: world/buffs.js perMan. Auto-refill paid only the hire)
    const extra=typeof Buffs!=='undefined'?Buffs.perMan(id):0,cost=this.hireCost(g.type),each=cost+extra,room=r.groupRoom(g.type,id),funds=each>0?Math.floor(this.player.gold/each):room;
    const n=Math.max(0,Math.floor(Math.min(room,t.vol||0,this.rules.capacity()-this.rules.size(),funds)));
    const q=n>0?this.hire(t,g.type,n,id):null;if(q?.ok&&extra){const x=extra*q.count;this.player.gold-=x;q.cost+=x}return q;
  }
  // (it moves at most one full unit of its new kind, the rest staying behind (core/army.js ArmyRoster#upgrade): count, the men who
  // go, priced and horsed alone; stay, the rest; split, a new unit for them, which needs a free unit slot (slot))
  quoteGroupTraining(t,id,to){
    const R=this.rules.roster&&this.rules.roster(),g=R&&R.groups.find(g=>g.id===id),from=g&&g.type,count=g?R.upgradeCount(g,to):0,split=!!g&&count<g.count,tr=!this.special(to)||!this.rules.upgradeTrainer?null:this.rules.upgradeTrainer(t,to),unitCost=tr?.own?0:this.trainCost(to);
    const horses=this.rules.horses?this.rules.horses(t,from,to,count):null,cost=unitCost*count+(horses?horses.cost:0);
    const result={id,from,to,count,stay:g?g.count-count:0,split,unitCost,cost,horses,rank:g?rankOf(g):0,trainer:tr?.name},fail=code=>({...result,ok:false,code});
    if(!g)return fail('target');
    if(!this.rules.troops[to]||!Array.isArray(this.rules.upgrades[from])||!this.rules.upgrades[from].includes(to))return fail('upgrade');
    if(split&&R.slots>=R.groupLimit)return fail('slot');
    if(this.rules.barracks&&!this.rules.barracks(t))return fail('barracks');
    if(this.special(to)&&!tr)return fail('training-unavailable');
    if(horses&&horses.why)return fail('horses');
    if(!Number.isSafeInteger(cost)||cost<0)return fail('amount');
    if(this.player.gold<cost)return fail('gold');
    if(!rankReady(g))return fail('experience');
    if((this.player.woundedGroups||[]).some(w=>w.id===id&&w.count>0))return fail('wounded-group');
    return {...result,ok:true,code:'group-training'};
  }
  trainGroup(t,id,to){
    const result=this.quoteGroupTraining(t,id,to);if(!result.ok)return result;
    // (the group's ID and its slot kept, its rank begun again; split, the new unit's ID (unit): ArmyRoster#upgrade)
    const unit=this.rules.roster().upgrade(id,to);if(!unit)return {...result,ok:false,code:'target'};
    if(result.horses&&result.horses.own&&this.rules.useHorses)this.rules.useHorses(result.horses);this.player.gold-=result.cost;return {...result,unit};
  }
  quoteCompanion(t,id){
    const c=this.rules.companions[id],cost=c&&c.cost,fail=code=>({ok:false,code,id,cost});
    if(!c||!Number.isFinite(cost)||!t||(this.rules.compTown?this.rules.compTown(id)!==t:c.town!==t.name))return fail('companion-unavailable');
    if(this.player.comps[id])return fail('companion-hired');
    if(this.player.gold<cost)return fail('gold');
    if(this.rules.size()>=this.rules.capacity())return fail('capacity');
    if(this.rules.freeGroup&&!this.rules.freeGroup())return fail('groups');
    return {ok:true,code:'companion',id,cost};
  }
  hireCompanion(t,id){const result=this.quoteCompanion(t,id);if(!result.ok)return result;this.player.gold-=result.cost;this.player.comps[id]={ap:0,role:''};return result}
  quotePrisoner(k){
    const cost=this.rules.prisonerCost,fail=code=>({ok:false,code,kind:k,cost});
    if(!this.rules.troops[k]||!((this.player.prisoners||{})[k]>0))return fail('prisoner-unavailable');
    if(this.player.gold<cost)return fail('gold');
    if(this.rules.size()>=this.rules.capacity())return fail('capacity');
    if(this.rules.canGroup&&!this.rules.canGroup(k,this.rules.prisonerTarget?.(k)))return fail('groups');
    return {ok:true,code:'prisoner',kind:k,cost};
  }
  recruitPrisoner(k){const result=this.quotePrisoner(k);if(!result.ok)return result;this.player.gold-=result.cost;this.player.prisoners[k]--;if(this.rules.add)this.rules.add(k,1,this.rules.prisonerTarget?.(k));else this.player.add(k);return result}

}
// a soldier's experience in a fight (attacks.js: by the harm he does and his kills), and his group's for fighting, winning and
// an auto-resolved fight's share; his group gains its men's average (battle/resolution.js groupRanks)
const TROOP_XP={dmg:.5,kill:6,fight:4,win:4,auto:.6};
// (a special upgrade: to this tier or up, or into a caster, only with an expert trainer of its role)
const TRAIN_PLACE={tier:3};
const recruitment=new RecruitmentService(P,{troops:ST,upgrades:UP,companions:COMPS,compTown:id=>compTown(id),hire:HIRE,xp:TROOP_XP,trainPlace:TRAIN_PLACE,prisonerCost:10,has,effect:tm,
  lead:()=>skill('lead'),size:partySize,capacity:partyCap,canHire:(t,k)=>canHire(t,k),day:()=>G.day,
  upgradeTrainer:(t,to)=>upgradeTrainer(t,to),roster:()=>partyRoster(P),target:k=>recruitTarget(k)||partyRoster(P).groups.find(g=>g.type===k&&partyRoster(P).groupRoom(k,g.id)>0)?.id||'new',
  // (a barracks open to you: a holding with one, not sacked, raided or in turmoil; a mounted kind's horses: horsesFor)
  barracks:t=>!!t&&!!t.T?.tabs?.includes('recruit')&&!recruitment.closed(t),horses:(t,from,to,n)=>horsesFor(t,from,to,n),useHorses:h=>playerInventory.take('gear',h.id,h.own),
  canGroup:(k,target,n=1)=>partyRoster(P).canAdd(k,target===undefined?recruitTarget(k):target,n),
  // (the group a freed prisoner joins: one of his kind with room, else a new one; never the hiring desk's last choice, the owner,
  // 2026-10-31: "why i cannot recruit prisoner into existing group that has the same unit type?")
  prisonerTarget:k=>{const r=partyRoster(P),g=r.groups.find(g=>g.type===k&&r.groupRoom(k,g.id)>0);return g?g.id:'new'},freeGroup:()=>partyRoster(P).slots<partyRoster(P).groupLimit,
  add:(k,n=1,target=recruitTarget(k))=>{const r=partyRoster(P),added=r.add(k,n,target);if(added&&target==='new')G.recruitTarget=r.groups[r.groups.length-1].id;if(added)skinsJoin(added);return added}});// (each recruit brings an empty waterskin: world/supply.js)
// a mounted kind's horses (the owner, 2026-10-31: "to upgrade to cavalry unit you also require horse"): one a man of its horse (ST[k].horse,
// a riding horse by default; a knight's a war horse), none when it rides the same as before; your spare ones first (in your bag),
// the rest bought at the holding's stable at its price, if it sells them (the same economy as your own mount's: town.js Stable)
const horseOf=k=>ST[k]?.mounted?ST[k].horse||'m_horse':null;
function horsesFor(t,from,to,n){const id=horseOf(to);if(!id||id===horseOf(from)||!(n>0))return null;const own=Math.min(n,invCount('gear',id)),buy=n-own,sold=!!t&&stableStock(t).includes(id)&&canBuyMount(t,id);
  return{id,n,own,buy,cost:sold?buy*gearPrice(id):0,why:buy&&!sold?ITEMS[id].n+'s: '+n+' needed, '+own+' yours'+(t?', none for sale here':''):''}}
const hireCost=k=>recruitment.hireCost(k),trainCost=k=>recruitment.trainCost(k),trainPrice=k=>recruitment.trainPrice(k),trainsAnywhere=k=>recruitment.anywhere(k);
function recruitTarget(k){const id=G.recruitTarget;return id==='new'||partyRoster(P).groups.some(g=>g.id===id&&g.type===k)?id:undefined}
// Saved per group; passing a friendly hiring place fills only that group through the normal paid recruitment rules.
const autoReinforceOn=id=>!!P.army?.autoReinforce?.[id];
function autoReinforceStep(d,dt){
  if(G.mode!=='world'||G.paused||G.dead||G.modal||B||!(dt>0))return;
  const r=partyRoster(P),groups=r.groups.filter(g=>autoReinforceOn(g.id)&&r.groupRoom(g.type,g.id)>0);if(!groups.length)return;
  const towns=TOWNS.filter(t=>Math.hypot(t.x-P.x,t.y-P.y)<=worldBattleReach(t)&&!hostileTo(t.owner)&&!closedNow(t)).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y));if(!towns.length){recruitment.autoWait=0;return}
  recruitment.autoWait=Math.max(0,(recruitment.autoWait||0)-dt);if(recruitment.autoWait)return;recruitment.autoWait=.5;let hired=0;
  for(const g of groups)for(const t of towns){const q=recruitment.reinforce(t,g.id);if(q?.ok){hired+=q.count;log(q.count+' '+ST[g.type].n+' join '+armyGroupLabel(g.id,r)+' at '+t.name+' for '+q.cost+'g.','good','band')}if(!r.groupRoom(g.type,g.id))break}
  if(hired)updateHUD(true);
}
Systems.add({name:'auto reinforce',order:{frame:148},frame:autoReinforceStep});
