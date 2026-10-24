'use strict';
/* Recruitment owns prices, eligibility and roster changes. Quotes are read-only and shared by screens and commands. */
class RecruitmentService{
  constructor(player,rules){this.player=player;this.rules=rules}
  hireCost(k){const s=this.rules.troops[k];return s?Math.round(this.rules.hire[k]*(this.rules.has('silver')?.8:1)*(1-.02*this.player.attr.cha)*(s.race&&s.race===this.player.race?.85:1)*(1-this.rules.effect('hire'))):0}
  trainCost(k){const s=this.rules.troops[k];return s?Math.round((s.tier>=3?45:25)*(this.rules.has('drill')?.6:1)*(1-this.rules.effect('train'))):0}
  xpNeed(k){return this.rules.xp.need[this.rules.troops[k]&&this.rules.troops[k].tier||1]||this.rules.xp.need[4]}
  xpOf(k){return (this.player.txp||{})[k]||0}
  ready(k){return this.rules.upgrades[k]?Math.min(this.player.troops[k]||0,Math.floor(this.xpOf(k)/this.xpNeed(k))):0}
  gainXp(k,n){
    const p=this.player;if(!this.rules.upgrades[k]||!(p.troops[k]>0)||n<=0)return;
    p.txp=p.txp||{};p.txp[k]=Math.min(this.xpOf(k)+n*(1+.05*this.rules.lead()),p.troops[k]*this.xpNeed(k));
  }
  clampXp(){const p=this.player;p.txp=p.txp||{};for(const k in p.txp){const cap=this.rules.upgrades[k]?(p.troops[k]||0)*this.xpNeed(k):0;if(p.txp[k]>cap)p.txp[k]=cap;if(!p.txp[k])delete p.txp[k]}}
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
  quoteGroupTraining(t,id,to){
    const g=this.rules.roster&&this.rules.roster().groups.find(g=>g.id===id),from=g&&g.type,count=g&&g.count||0,unitCost=this.trainCost(to),cost=unitCost*count,xpCost=from?this.xpNeed(from)*count:0;
    const result={id,from,to,count,unitCost,cost,xpCost},fail=code=>({...result,ok:false,code});
    if(!g)return fail('target');
    if(!this.rules.troops[to]||!Array.isArray(this.rules.upgrades[from])||!this.rules.upgrades[from].includes(to))return fail('upgrade');
    if(this.closed(t)||!t.T.train)return fail('training-unavailable');
    if(!Number.isSafeInteger(cost)||cost<0||!Number.isSafeInteger(xpCost))return fail('amount');
    if(this.player.gold<cost)return fail('gold');
    if(this.xpOf(from)<xpCost)return fail('experience');
    if((this.player.woundedGroups||[]).some(w=>w.id===id&&w.count>0))return fail('wounded-group');
    return {...result,ok:true,code:'group-training'};
  }
  trainGroup(t,id,to){
    const result=this.quoteGroupTraining(t,id,to);if(!result.ok)return result;
    // Spend XP before roster change clamps the old type's pool; preserve the group's ID and its slot.
    this.player.txp[result.from]-=result.xpCost;
    if(!this.rules.roster().upgrade(id,to)){this.player.txp[result.from]+=result.xpCost;return {...result,ok:false,code:'target'}}
    this.player.gold-=result.cost;this.clampXp();return result;
  }
  quoteTraining(t,from,to){
    const cost=this.trainCost(to),fail=code=>({ok:false,code,from,to,cost});
    if(!this.rules.troops[to]||!Array.isArray(this.rules.upgrades[from])||!this.rules.upgrades[from].includes(to))return fail('upgrade');
    if(this.closed(t)||!t.T.train)return fail('training-unavailable');
    if(this.player.gold<cost)return fail('gold');
    if(!(this.player.troops[from]>0))return fail('troops');
    if(this.ready(from)<1)return fail('experience');
    if(this.rules.canTrainGroup&&!this.rules.canTrainGroup(from,to))return fail('groups');
    return {ok:true,code:'training',from,to,cost};
  }
  train(t,from,to){
    const result=this.quoteTraining(t,from,to);if(!result.ok)return result;
    const p=this.player;p.gold-=result.cost;p.txp[from]-=this.xpNeed(from);p.remove(from);p.add(to);this.clampXp();return result;
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
// Survivors pool XP by kind. Training spends one soldier's threshold; casualties cannot leave more XP than the survivors can use.
const TROOP_XP={need:{1:40,2:80,3:140,4:220},dmg:.5,kill:6,fight:4,win:4,auto:.6};
const recruitment=new RecruitmentService(P,{troops:ST,upgrades:UP,companions:COMPS,compTown:id=>compTown(id),hire:HIRE,xp:TROOP_XP,prisonerCost:10,has,effect:tm,
  lead:()=>skill('lead'),size:partySize,capacity:partyCap,canHire:(t,k)=>canHire(t,k),day:()=>G.day,
  roster:()=>partyRoster(P),target:k=>recruitTarget(k)||partyRoster(P).groups.find(g=>g.type===k&&partyRoster(P).groupRoom(k,g.id)>0)?.id||'new',
  canGroup:(k,target,n=1)=>partyRoster(P).canAdd(k,target===undefined?recruitTarget(k):target,n),freeGroup:()=>partyRoster(P).slots<partyRoster(P).groupLimit,
  add:(k,n=1,target=recruitTarget(k))=>{const r=partyRoster(P),added=r.add(k,n,target);if(added&&target==='new')G.recruitTarget=r.groups[r.groups.length-1].id;if(added)skinsJoin(added);return added},// (each recruit brings an empty waterskin: world/supply.js)
  canTrainGroup:(from,to)=>partyRoster(P).canAdd(to)||partyRoster(P).groups.find(g=>g.type===from)?.count===1});
const hireCost=k=>recruitment.hireCost(k),trainCost=k=>recruitment.trainCost(k);
const txpNeed=k=>recruitment.xpNeed(k),txpOf=k=>recruitment.xpOf(k),txpReady=k=>recruitment.ready(k);
const txpGain=(k,n)=>recruitment.gainXp(k,n),txpClamp=()=>recruitment.clampXp();
function recruitTarget(k){const id=G.recruitTarget;return id==='new'||partyRoster(P).groups.some(g=>g.id===id&&g.type===k)?id:undefined}
