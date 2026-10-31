'use strict';
// A prisoner recruited joins a group of his kind that has room (core/recruitment.js quotePrisoner, recruitPrisoner, the rules'
// prisonerTarget; the owner, 2026-10-31: "why i cannot recruit prisoner into existing group that has the same unit type?"): never
// refused for want of a new group slot when one of his kind has room, whatever the hiring desk chose last; a new group only when
// none has room.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();P.sk.lead.lv=1;P.gold=500;
 const r=t.partyRoster(P);P.troops={};r.add('hum_levy',2,'new');while(r.slots<r.groupLimit)r.add('militia',1,'new');
 const levy=r.groups.find(g=>g.type==='hum_levy');P.prisoners={hum_levy:2};G.recruitTarget='new';
 ok(r.slots>=r.groupLimit&&r.groupRoom('hum_levy',levy.id)>0,'(every group slot taken; the levies\' group has room; the hiring desk last chose a new group)');
 const q=t.recruitment.quotePrisoner('hum_levy');ok(q.ok,'a levy prisoner can be recruited ('+(q.ok?'ok':q.code)+')');
 const n=levy.count,res=t.recruitment.recruitPrisoner('hum_levy');ok(res.ok&&levy.count===n+1&&P.prisoners.hum_levy===1,'he joins the levies\' own group ('+n+' → '+levy.count+')');
 ok(t.recruitment.recruitPrisoner('hum_levy').ok&&levy.count===n+2&&r.slots===r.groupLimit,'and the next, no new group made');
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
