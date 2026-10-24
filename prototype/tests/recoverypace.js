'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();
 P.comps={brann:{ap:0,role:''}};const c=t.compInit('brann'),now=()=>G.day+t.Clock.frac;
 c.hurt=now()+2;ok(!t.compInBand('brann')&&t.compHealthShare(c)===0,'newly wounded companion is unavailable');
 G.clock+=t.DAY/2;const half=t.compHealthShare(c);ok(half>.2&&half<.3,'wounded companion health progresses during the day');
 P.camp={at:0};const before=c.hurt;t.compRecoveryHour();ok(c.hurt<before,'camp and Medicine accelerate companion recovery');P.camp=null;
 c.hurt=now()-.01;t.compRecoveryHour();ok(c.hurt===0&&t.compInBand('brann')&&t.partyGroup('comp_brann').fit===1,'expired wounds clear and companion returns to the fit roster');
 const L=t.supplyLand();P.stay=null;P.camp=null;const stopped=t.staminaRate(false,'water',L).n;P.camp={at:0};const camp=t.staminaRate(false,'water',L).n;P.camp=null;
 ok(t.SUPPLY.rest.stop===4&&t.SUPPLY.rest.camp===16&&t.SUPPLY.rest.stay===20&&camp>stopped,'rest recovery is doubled and camp remains faster than stopping');
 const battle=t.moveStep(34,1,false),travel=t.moveStep(34,1);
 ok(Math.abs(battle-34*.68)<1e-8&&travel===battle*2,'campaign movement doubles while battle movement keeps its prior scale');
});
