'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();P.comps={brann:{ap:0,role:''}};const c=t.compInit('brann');G.clock=t.DAY/4;c.hurt=G.day+t.Clock.frac+2;P.stay=null;P.camp=null;
 const rate=t.compRecoveryRate(c),base=t.compRecoveryHours(c);ok(Math.abs(base-48/rate)<.001,'companion estimate uses actual remaining recovery and current healing rate');
 P.camp={at:0};ok(t.compRecoveryHours(c)<base,'camp immediately shortens the companion estimate');P.camp=null;P.stay='Ashford';ok(t.compRecoveryHours(c)<base,'lodging immediately shortens the companion estimate');P.stay=null;
 const text=t.partyRecoveryText(t.partyGroup('comp_brann'));ok(/Est\. recovery: ~/.test(text)&&/Day \d+, \d\d:00/.test(text),'wounded companion shows time remaining and estimated return day/hour');
 const comphtml=t.partyCard('comp_brann',t.partyRoster(P),2);ok(comphtml.includes('Est. recovery:'),'companion roster card includes recovery time');
 P.troops={hum_foot:2};P.wounded={hum_foot:1};P.woundedGroups=[];const r=t.partyRoster(P),g=r.groups.find(g=>g.type==='hum_foot');P.woundedGroups=[{id:g.id,type:g.type,count:1}];
 const share=t.healShare().share,hours=t.woundedRecoveryHours('hum_foot',g.id);ok(Math.abs(hours-(1/share-t.Clock.frac)*24)<.001,'one wounded soldier estimate includes the probability of daily recovery and time to the next roll');
 const before=JSON.stringify([P.wounded,P.woundedGroups]),rnd=Math.random;let draws=0;try{Math.random=()=>{draws++;return .5};t.woundedRecoveryHours('hum_foot',g.id)}finally{Math.random=rnd}
 ok(!draws&&JSON.stringify([P.wounded,P.woundedGroups])===before,'forecast neither changes recovery state nor consumes random rolls');
 const estimate=t.partyRecoveryText(t.partyGroup(g.id,r));ok(estimate.includes('Est. recovery:')&&t.partyCard(g.id,r,1).includes(estimate),'troop roster card displays an estimated recovery time');
 G.mode='char';const detail=t.partyUnitCard(t.partyUnit(g.id,r),r);ok(detail.includes('Est. recovery:')&&detail.includes('checked daily'),'unit detail explains daily troop recovery uncertainty');
 ok(t.woundedPanel().includes('Est. recovery:')&&t.woundedPanel().includes('daily rolls can vary'),'army condition recovery summary gives estimated ready times');
 P.camp={at:0};ok(t.woundedRecoveryHours('hum_foot',g.id)<hours,'camp shortens the troop forecast without changing healing rules');P.camp=null;
 c.hurt=0;P.wounded={};P.woundedGroups=[];ok(t.partyRecoveryText(t.partyGroup('comp_brann'))===''&&t.partyRecoveryText(t.partyGroup(g.id,r))==='','fit units show no pending recovery time');
});
