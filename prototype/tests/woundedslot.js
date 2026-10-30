'use strict';
// A group all wounded keeps its place (core/army.js ArmyRoster#held; the owner, 2026-10-30: "3 army, fought and got 1 wounded, then
// I hired a new unit type which created a new group, and that was allowed"; the wounded then could not come back, "not available
// due to maximum army unit"): while its men heal it counts among your groups, so no new group takes its place; healed, they
// come back into it.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();const ash=t.townBy('Ashford'),r=t.partyRoster(P),lim=r.groupLimit-r.reserved;
 const kinds=['hum_foot','hum_bow','hum_levy','hum_knight','hum_spear'].filter(k=>t.ST[k]);P.troops={};
 for(let i=0;i<lim;i++)r.add(kinds[i],i?3:1,'new');ok(r.slots===r.groupLimit,'your groups at the limit ('+r.slots+' / '+r.groupLimit+')');
 const one=r.groups[0];P.wounded={[one.type]:1};P.woundedGroups=[{id:one.id,type:one.type,count:1}];r.remove(one.type,1,one.id);
 ok(!r.groups.some(g=>g.id===one.id)&&r.slots===r.groupLimit,'its one man wounded: the group out of the ranks, its place still held');
 const fresh=kinds.find(k=>!r.groups.some(g=>g.type===k)&&k!==one.type);
 ok(!r.canAdd(fresh,'new',1)&&r.groupRoom(fresh)===0,'no new group for another kind ('+t.ST[fresh].n+')');
 P.gold=5000;P.rep[ash.name]=90;ash.vol=20;const res=t.recruitment.quoteHire(ash,fresh,1,'new');ok(!res.ok&&res.code==='groups','the Barracks will not hire it ('+res.code+')');
 ok(t.woundedBack(one.type,1)===1&&r.groups.some(g=>g.id===one.id&&g.count===1)&&r.slots===r.groupLimit,'healed: he comes back into his own group');
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
