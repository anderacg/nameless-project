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
  quoteHire(t,k){
    const cost=this.hireCost(k),fail=code=>({ok:false,code,kind:k,cost});
    if(!this.rules.troops[k]||!Number.isFinite(this.rules.hire[k]))return fail('invalid-unit');
    if(this.closed(t))return fail('closed');
    if(!t.races.some(r=>t.hires(r).includes(k)))return fail('unavailable');
    if(!this.rules.canHire(t,k))return fail('standing');
    if((t.vol||0)<1)return fail('volunteers');
    if(this.player.gold<cost)return fail('gold');
    if(this.rules.size()>=this.rules.capacity())return fail('capacity');
    return {ok:true,code:'hire',kind:k,cost};
  }
  hire(t,k){const result=this.quoteHire(t,k);if(!result.ok)return result;this.player.gold-=result.cost;t.vol--;t.pop=Math.max(10,t.pop-1);this.player.add(k);return result}
  quoteTraining(t,from,to){
    const cost=this.trainCost(to),fail=code=>({ok:false,code,from,to,cost});
    if(!this.rules.troops[to]||!Array.isArray(this.rules.upgrades[from])||!this.rules.upgrades[from].includes(to))return fail('upgrade');
    if(this.closed(t)||!t.T.train)return fail('training-unavailable');
    if(this.player.gold<cost)return fail('gold');
    if(!(this.player.troops[from]>0))return fail('troops');
    if(this.ready(from)<1)return fail('experience');
    return {ok:true,code:'training',from,to,cost};
  }
  train(t,from,to){
    const result=this.quoteTraining(t,from,to);if(!result.ok)return result;
    const p=this.player;p.gold-=result.cost;p.txp[from]-=this.xpNeed(from);p.remove(from);p.add(to);this.clampXp();return result;
  }
  quoteCompanion(t,id){
    const c=this.rules.companions[id],cost=c&&c.cost,fail=code=>({ok:false,code,id,cost});
    if(!c||!Number.isFinite(cost)||!t||c.town!==t.name)return fail('companion-unavailable');
    if(this.player.comps[id])return fail('companion-hired');
    if(this.player.gold<cost)return fail('gold');
    if(this.rules.size()>=this.rules.capacity())return fail('capacity');
    return {ok:true,code:'companion',id,cost};
  }
  hireCompanion(t,id){const result=this.quoteCompanion(t,id);if(!result.ok)return result;this.player.gold-=result.cost;this.player.comps[id]={ap:0,role:''};return result}
  quotePrisoner(k){
    const cost=this.rules.prisonerCost,fail=code=>({ok:false,code,kind:k,cost});
    if(!this.rules.troops[k]||!((this.player.prisoners||{})[k]>0))return fail('prisoner-unavailable');
    if(this.player.gold<cost)return fail('gold');
    if(this.rules.size()>=this.rules.capacity())return fail('capacity');
    return {ok:true,code:'prisoner',kind:k,cost};
  }
  recruitPrisoner(k){const result=this.quotePrisoner(k);if(!result.ok)return result;this.player.gold-=result.cost;this.player.prisoners[k]--;this.player.add(k);return result}
}
// Survivors pool XP by kind. Training spends one soldier's threshold; casualties cannot leave more XP than the survivors can use.
const TROOP_XP={need:{1:40,2:80,3:140,4:220},dmg:.5,kill:6,fight:4,win:4,auto:.6};
const recruitment=new RecruitmentService(P,{troops:ST,upgrades:UP,companions:COMPS,hire:HIRE,xp:TROOP_XP,prisonerCost:10,has,effect:tm,
  lead:()=>skill('lead'),size:partySize,capacity:partyCap,canHire:(t,k)=>canHire(t,k),day:()=>G.day});
const hireCost=k=>recruitment.hireCost(k),trainCost=k=>recruitment.trainCost(k);
const txpNeed=k=>recruitment.xpNeed(k),txpOf=k=>recruitment.xpOf(k),txpReady=k=>recruitment.ready(k);
const txpGain=(k,n)=>recruitment.gainXp(k,n),txpClamp=()=>recruitment.clampXp();
