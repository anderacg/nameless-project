'use strict';
/* Recruitment owns prices, eligibility and roster changes. Quotes are read-only and shared by screens and commands. */
class RecruitmentService{
  constructor(player,rules){this.player=player;this.rules=rules}
  hireCost(k){const s=this.rules.troops[k];return s?Math.round(this.rules.hire[k]*(this.rules.has('silver')?.8:1)*(1-.02*this.player.attr.cha)*(s.race&&s.race===this.player.race?.85:1)*(1-this.rules.effect('hire'))):0}
  // (a group's upgrade (the owner, 2026-10-30): at its last rank (core/ranks.js), anywhere and free; a special one (to
  // TRAIN_PLACE.tier or up, or into a caster) with an expert trainer of its role (world/trainers.js upgradeTrainer): a holding's
  // for trainCost a man, yours in your camp free)
  anywhere(k){const s=this.rules.troops[k],at=this.rules.trainPlace;return !!at&&!!s&&!s.magic&&s.tier<at.tier}
  trainPrice(k){return this.anywhere(k)?0:this.trainCost(k)}
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
    const cost=this.hireCost(g.type),room=r.groupRoom(g.type,id),funds=cost>0?Math.floor(this.player.gold/cost):room;
    const n=Math.max(0,Math.floor(Math.min(room,t.vol||0,this.rules.capacity()-this.rules.size(),funds)));
    return n>0?this.hire(t,g.type,n,id):null;
  }
  quoteGroupTraining(t,id,to){
    const g=this.rules.roster&&this.rules.roster().groups.find(g=>g.id===id),from=g&&g.type,count=g&&g.count||0,tr=this.anywhere(to)||!this.rules.upgradeTrainer?null:this.rules.upgradeTrainer(t,to),unitCost=this.anywhere(to)||tr?.own?0:this.trainCost(to),cost=unitCost*count;
    const result={id,from,to,count,unitCost,cost,rank:g?rankOf(g):0,trainer:tr?.name},fail=code=>({...result,ok:false,code});
    if(!g)return fail('target');
    if(!this.rules.troops[to]||!Array.isArray(this.rules.upgrades[from])||!this.rules.upgrades[from].includes(to))return fail('upgrade');
    if(!this.anywhere(to)&&!tr)return fail('training-unavailable');
    if(!Number.isSafeInteger(cost)||cost<0)return fail('amount');
    if(this.player.gold<cost)return fail('gold');
    if(!rankReady(g))return fail('experience');
    if((this.player.woundedGroups||[]).some(w=>w.id===id&&w.count>0))return fail('wounded-group');
    return {...result,ok:true,code:'group-training'};
  }
  trainGroup(t,id,to){
    const result=this.quoteGroupTraining(t,id,to);if(!result.ok)return result;
    // (the group's ID and its slot kept; its rank starts again: ArmyRoster#upgrade)
    if(!this.rules.roster().upgrade(id,to))return {...result,ok:false,code:'target'};
    this.player.gold-=result.cost;return result;
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
    if(this.rules.canGroup&&!this.rules.canGroup(k))return fail('groups');
    return {ok:true,code:'prisoner',kind:k,cost};
  }
  recruitPrisoner(k){const result=this.quotePrisoner(k);if(!result.ok)return result;this.player.gold-=result.cost;this.player.prisoners[k]--;if(this.rules.add)this.rules.add(k);else this.player.add(k);return result}
}
// a soldier's experience in a fight (attacks.js: by the harm he does and his kills), and his group's for fighting, winning and
// an auto-resolved fight's share; his group gains its men's average (battle/resolution.js groupRanks)
const TROOP_XP={dmg:.5,kill:6,fight:4,win:4,auto:.6};
// (a special upgrade: to this tier or up, or into a caster, only with an expert trainer of its role)
const TRAIN_PLACE={tier:3};
const recruitment=new RecruitmentService(P,{troops:ST,upgrades:UP,companions:COMPS,compTown:id=>compTown(id),hire:HIRE,xp:TROOP_XP,trainPlace:TRAIN_PLACE,prisonerCost:10,has,effect:tm,
  lead:()=>skill('lead'),size:partySize,capacity:partyCap,canHire:(t,k)=>canHire(t,k),day:()=>G.day,
  upgradeTrainer:(t,to)=>upgradeTrainer(t,to),roster:()=>partyRoster(P),target:k=>recruitTarget(k)||partyRoster(P).groups.find(g=>g.type===k&&partyRoster(P).groupRoom(k,g.id)>0)?.id||'new',
  canGroup:(k,target,n=1)=>partyRoster(P).canAdd(k,target===undefined?recruitTarget(k):target,n),freeGroup:()=>partyRoster(P).slots<partyRoster(P).groupLimit,
  add:(k,n=1,target=recruitTarget(k))=>{const r=partyRoster(P),added=r.add(k,n,target);if(added&&target==='new')G.recruitTarget=r.groups[r.groups.length-1].id;if(added)skinsJoin(added);return added}});// (each recruit brings an empty waterskin: world/supply.js)
const hireCost=k=>recruitment.hireCost(k),trainCost=k=>recruitment.trainCost(k),trainPrice=k=>recruitment.trainPrice(k),trainsAnywhere=k=>recruitment.anywhere(k);
function recruitTarget(k){const id=G.recruitTarget;return id==='new'||partyRoster(P).groups.some(g=>g.id===id&&g.type===k)?id:undefined}
// Saved per group; passing a friendly hiring place fills only that group through the normal paid recruitment rules.
const autoReinforceOn=id=>!!P.army?.autoReinforce?.[id];
function autoReinforceStep(d,dt){
  if(G.mode!=='world'||G.paused||G.dead||G.modal||B||!(dt>0))return;
  const r=partyRoster(P),groups=r.groups.filter(g=>autoReinforceOn(g.id)&&r.groupRoom(g.type,g.id)>0);if(!groups.length)return;
  const towns=TOWNS.filter(t=>Math.hypot(t.x-P.x,t.y-P.y)<=REACH&&!hostileTo(t.owner)&&!closedNow(t)).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y));if(!towns.length){recruitment.autoWait=0;return}
  recruitment.autoWait=Math.max(0,(recruitment.autoWait||0)-dt);if(recruitment.autoWait)return;recruitment.autoWait=.5;let hired=0;
  for(const g of groups)for(const t of towns){const q=recruitment.reinforce(t,g.id);if(q?.ok){hired+=q.count;log(q.count+' '+ST[g.type].n+' join '+armyGroupLabel(g.id,r)+' at '+t.name+' for '+q.cost+'g.','good','band')}if(!r.groupRoom(g.type,g.id))break}
  if(hired)updateHUD(true);
}
Systems.add({name:'auto reinforce',order:{frame:148},frame:autoReinforceStep});
