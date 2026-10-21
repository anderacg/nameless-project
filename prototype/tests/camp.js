'use strict';
// Make camp (doc/SUPPLY_DESIGN.md §7, world/supply.js): Z, the dock's Camp (and the action ring: tests/ring.js). Your band stops
// and pitches its tents: stamina +8 an hour, the wounded mend faster, food and drink at the rest rate; any travel order breaks
// camp; going faster than 1x, anything hostile in sight brings the speed back to 1x; a band that finds you in camp catches you
// unready; there is no camping inside a holding; the camp is drawn at your figure, and saved.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,S=t.SUPPLY,ev=s=>(0,eval)(s);
 Kit.begin('soldier',4242);Kit.clear();Kit.world();
 const spot=(()=>{for(let ty=8;ty<t.MH-8;ty++)for(let tx=8;tx<t.MW-8;tx++){const x=(tx+.5)*16,y=(ty+.5)*16;if(t.tAt(tx,ty)===t.T_OPEN&&t.climAt(x,y)==='grass'&&!t.TOWNS.some(h=>Math.hypot(h.x-x,h.y-y)<160)&&!t.nearWater(x,y,4))return [x,y]}})();
 const bag=g=>{for(const k of ['water','ale','liquor',...t.FOODS])t.goodTake(k,1e9);for(const k in g)t.playerInventory.add('good',k,g[k])};
 const reset=()=>{Kit.world();Kit.goTo(spot[0],spot[1]);P.troops={hum_levy:5};P.wounded={};P.woundedGroups=[];P.comps={};P.bsta=50;P.morale=60;ev('BAND=freshBand()');G.speed=1;G.encCool=99;G.clock=t.DAY*.3;bag({water:200,grain:60})};
 const msgs=re=>G.msgs.filter(x=>re.test(x.m)).length;
 // ---- Z, and the dock
 reset();Kit.key('KeyZ','z');ok(!!P.camp&&P.tx==null&&msgs(/makes camp/)===1,'Z: your band makes camp');
 t.updateHUD(true);{const tags=[...document.querySelectorAll('#stats .pc-tags .tag')].map(x=>x.textContent);ok(tags.includes('In camp')&&document.getElementById('campBtn').classList.contains('on'),'the card says In camp, the dock’s Camp is lit')}
 {const L=t.supplyLand();ok(t.staminaRate(false,t.drinkNext(L),L).n===S.rest.camp,'in camp stamina comes back +'+S.rest.camp+' an hour');const b0=P.bsta;t.supplyHour();ok(Math.abs(P.bsta-b0-S.rest.camp)<1e-9,'and an hour passes so ('+Math.round(b0)+' → '+Math.round(P.bsta)+')')}
 Kit.key('KeyZ','z');ok(!P.camp&&msgs(/breaks camp/)===1,'Z again: it breaks camp');
 document.getElementById('campBtn').click();ok(!!P.camp,'the dock’s Camp makes camp');document.getElementById('campBtn').click();ok(!P.camp,'and breaks it');
 // ---- a travel order breaks it
 reset();t.makeCamp();P.tx=P.x+60;P.ty=P.y;t.updateWorld(.05);ok(!P.camp&&P.tx!=null,'a travel order breaks camp, and you march');
 // ---- not inside a holding
 reset();{const h=Kit.goHome();P.rep[h.name]=40;t.startStay(h);ok(!t.makeCamp()&&!P.camp&&/staying/.test(t.campWhy()),'no camp while you stay in a holding ('+t.campWhy()+')');t.leaveStay();Kit.world()}
 // ---- faster than 1x, anything hostile in sight brings it back
 reset();t.makeCamp();t.setSpeed(8);t.updateWorld(.02);ok(G.speed===8&&!!P.camp,'fast forward in camp, with nothing in sight: it stays 8x');
 {t.bandits.push(t.asParty({x:P.x+40,y:P.y,n:4,kind:'bandits',cool:99,t:0,a:0,idle:true}));t.updateWorld(.02);
  ok(G.speed===1&&!!P.camp&&msgs(/camp stirs/)>=1,'bandits come into sight: back to 1x, still in camp ('+t.dangerInSight()+')');t.bandits.length=0}
 // ---- the wounded mend faster in camp
 reset();{const heal=camp=>{P.camp=camp?{at:0}:null;P.wounded={hum_levy:10};P.woundedGroups=[];P.troops={};Kit.stub(0,()=>t.woundedDay());return 10-(P.wounded.hum_levy||0)};
  const a=heal(false),b=heal(true);ok(b>a&&b===Math.floor(10*.2*S.camp.heal),'the wounded mend ×'+S.camp.heal+' in camp ('+a+' a day out of it, '+b+' in it)');P.camp=null}
 // ---- caught in camp
 reset();t.makeCamp();P.morale=60;G.enc={kind:'party',ref:{cool:0,x:P.x+8,y:P.y},list:['militia']};t.startBattle({enemies:['militia'],tournament:false});
 ok(!P.camp&&P.morale===60-S.camp.caught&&msgs(/catch your band in camp/)===1,'a band that finds you in camp catches you unready: morale −'+S.camp.caught+', the camp struck');
 ev('B.over=true;B=null');t.fieldDone();Kit.world();
 // ---- drawn at your figure, and saved
 reset();t.makeCamp();{const e=t.bandCampEnt({x:Math.floor(P.x-t.VW/2),y:Math.floor(P.y-t.VH/2)});let err='';t.ctx.save();try{e.f()}catch(x){err=x.message}t.ctx.restore();ok(!err&&e.y<P.y,'the camp, two tents and a fire, is drawn behind your figure'+(err?' ('+err+')':''))}
 G.mode='world';t.saveGame(true,'quick');ev('BAND=freshBand()');ok(!P.camp,'(a fresh record has no camp)');t.loadGame('quick');ok(!!P.camp,'saved and loaded in camp');
 Kit.begin('soldier',4242);ok(!P.camp,'a new game: no camp');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
