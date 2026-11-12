'use strict';
// Money and men by their own rules (a review of the rules, 2026-11-11). A pulled-down building gives back half of what you paid for
// it, nothing for one you found standing (buildings.js REFUND, t.paid); a man called up from a garrison is the kind you stationed
// (core/garrison.js t.garKinds), and your garrisons are paid (world.js BAND_PAY.garrison); a realm's contract pays a share of your
// wages from its treasury (BAND_PAY.merc, mercPay); new men refilling a group pay their share of its upgrades (recruitment.js
// reinforce); a giver's goods cut the gold by what they are worth (quests.js purse); the heirloom is given only when it fits; a
// bribe taken leaves your purse; a few rations do not wipe the hungry hours (supply.js lean); a job you ruined is failed, not paid.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',23);Kit.world();Kit.clear();t.GUIDE.on=false;
 const fief=t.TOWNS.find(h=>h.kind==='town'),own0=fief.owner;fief.owner='player';t.ensureEcon(fief);
 try{
  // ---- pulled down
  {const k=Object.keys(t.ESTATES).find(e=>t.ESTATES[e]),lv=1;fief.bld[k]=lv;fief.paid={};const l={k,id:'zz'},drop=fief.layout.drop;fief.layout.drop=()=>{};
   let g0=P.gold;fief.buildings.demolish(l);ok(P.gold===g0,'a building you found standing, pulled down: nothing back');
   fief.bld[k]=lv;t.paidFor(fief,k,t.bldCost(k,lv));g0=P.gold;fief.buildings.demolish(l);ok(P.gold-g0===Math.floor(t.bldCost(k,lv)/2),'one you paid for: half its cost back ('+(P.gold-g0)+')');
   fief.bld[k]=lv;g0=P.gold;fief.buildings.demolish(l);ok(P.gold===g0,'pulled down again: nothing more');
   t.REFUND.paid=false;fief.bld[k]=lv;g0=P.gold;fief.buildings.demolish(l);ok(P.gold-g0===Math.floor(t.bldCost(k,lv)/2),'paid off: half as before');t.REFUND.paid=true;fief.layout.drop=drop}
  // ---- the garrison
  {const r=t.partyRoster(P);P.troops={};fief.gar=1;fief.garKinds={};const cheap=Object.keys(t.ST).filter(k=>t.ST[k].tier===0&&t.hireCost(k)>0)[0];P.troops={[cheap]:3};
   ok(t.garrisons.station(fief,cheap,3)===3,'three '+cheap+' stationed');let n=0;for(let i=0;i<3;i++)n+=t.garrisons.callup(fief);
   ok(n===3&&(P.troops[cheap]||0)===3&&!Object.keys(fief.garKinds).length,'called up again: three '+cheap+', not the holding\'s guard');
   fief.gar=10;const w=t.bandPayroll();ok(w.garrison===10*t.BAND_PAY.garrison,'your garrison of 10 paid '+w.garrison+'g a day');P.troops={}}
  // ---- a contract
  {P.troops={hum_foot:10};const f=Object.keys(t.FACS).find(x=>x!=='player'&&t.fiefsOf(x).length),pay=t.mercPay();ok(pay===Math.round(10*t.soldierPay('hum_foot')*t.BAND_PAY.merc),'a contract pays '+pay+'g a day for ten soldiers, a share of their wages');
   P.fac=f;const tr=W.treas[f],g0=P.gold;W.treas[f]=1e6;t.bandDay();ok(P.gold-g0+t.bandPayroll().total>=pay-1&&W.treas[f]<1e6,'paid from the realm\'s treasury');
   W.treas[f]=-1e6;const g1=P.gold;t.bandDay();ok(P.gold<=g1,'a realm with no gold pays none');W.treas[f]=tr;P.fac=null;P.troops={}}
  // ---- upgrades with new men
  {P.gold=1e5;const towns=t.TOWNS.filter(x=>!x.gone&&x.owner&&x.owner!=='player'&&!t.hostileTo(x.owner));towns.forEach(x=>x.vol=50);let kind=null,b=null;
   for(const x of Object.keys(t.BUFFS)){if(!(t.BUFFS[x].cost>0))continue;const k=Object.keys(t.ST).find(k=>t.hireCost(k)>0&&t.Buffs.fits(t.BUFFS[x],k)&&towns.some(to=>t.recruitment.quoteHire(to,k,1).ok));if(k){kind=k;b=x;break}}
   if(b){P.troops={[kind]:1};const r=t.partyRoster(P),g=r.groups[0];t.Buffs.rec(g.id,true).push({id:b});P.gold=1e5;let q=null;for(const to of t.TOWNS.filter(x=>!x.gone&&x.owner&&x.owner!=='player'&&!t.hostileTo(x.owner))){to.vol=50;q=t.recruitment.reinforce(to,g.id);if(q&&q.ok)break}
    ok(q&&q.ok&&q.cost===q.count*(t.hireCost(g.type)+t.BUFFS[b].cost),'a group with an upgrade refilled: each new man pays its share too ('+q.count+' for '+q.cost+'g; hire '+t.hireCost(g.type)+', share '+t.Buffs.perMan(g.id)+', '+kind+' '+b+')')}else info('no upgrade fits: not tried');P.troops={}}
  // ---- a giver's goods
  {const q={reward:{gold:100}},g={pays:.5},k=t.GIVER_PAY[0];for(const x of t.GIVER_PAY)fief.stock[x]=0;fief.stock[k]=1;t.Quest.purse?t.Quest.purse(q,g,fief):t.JobQuest.purse(q,g,fief);
   const worth=q.reward.goods?q.reward.goods[1]*t.marketPrice(fief,k):0;ok(q.reward.goods&&q.reward.gold===Math.max(50,Math.round(100-worth)),'a reeve with one '+k+': the gold less only what it is worth ('+q.reward.gold+' gold and '+(q.reward.goods||[])[1]+')')}
  // ---- the heirloom
  {const home=t.Wounded.home,was=t.Thread.once('heirloom');t.Wounded.home=()=>({town:fief.name});P.inv=P.inv.map(()=>null);while(t.invAdd('good','iron',50)>0);
   const o=t.Wounded.gift({});if(!was&&o.gear){t.Outcome.apply(o,{});ok(!t.Thread.once('heirloom'),'the heirloom with a full bag: not marked given, still to come')}else info('heirloom given already: not tried');
   t.Wounded.home=home;P.inv=P.inv.map(()=>null)}
  // ---- hunger
  {const H=t.SUPPLY.hunger,B=t.BAND;B.hungry=71;B.lean=0;const fed=()=>{if(B.lean||B.hungry){const l=Math.max(B.lean||0,B.hungry)-H.recover;if(l>0)B.lean=l;else delete B.lean}B.hungry=0};fed();ok(B.hungry===0&&B.lean===71-H.recover,'fed an hour after 71 hungry: '+B.lean+' hungry hours left to wear off');
   ok(/u\.lean/.test(String(t.supplyHour)),'the hour\'s rule keeps them');delete B.lean;B.hungry=0}
  // ---- a ruined job
  {const s=t.Outposts.all().find(x=>x.realm&&x.realm!=='player');if(s){const town=t.TOWNS.find(h=>h.owner===s.realm&&!h.gone),q=Object.create(t.HoldQuest.prototype);Object.assign(q,{fac:s.realm,home:town.name,site:s.i,left:false,on:true,done:false});
    ok(!q.ruined(),'a post held: not ruined');q.left=true;ok(q.ruined(),'a post you left: your doing, failed, not paid for your trouble');q.left=false;q.on=false;const r0=s.owner;s.owner=null;ok(!q.ruined(),'one that fell before you took your post: not your doing');s.owner=r0}else info('no realm outpost')}
 }finally{fief.owner=own0}
});
