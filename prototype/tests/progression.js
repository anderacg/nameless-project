'use strict';
window.ARENA=true;// (the battle screen's own rules, on its own field: tests/harness.js)
// Skills, perks, companions, prisoners, trading, travel and save/load.

window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');ok(G.mode==='world','begin -> world');ok(!P.attr&&t.tmOf(P,'hp')>=10&&Object.keys(P.sk).every(k=>P.sk[k].lv===(P.sk0[k]||0))&&P.sk.oneh.lv>0&&P.apt.oneh>0&&P.origin==='o_soldier'&&P.tree[0]==='o_soldier','no attributes (the Soldier origin\u2019s health instead), every proficiency at 0 but the past\u2019s free start (15 at most), a knack for One-Handed, and the Soldier origin');
 ok(Math.max(...Object.values(P.sk0))<=15,'a past starts its proficiencies at 15 at most ('+JSON.stringify(P.sk0)+')');
 t.gainXp(500);ok(P.level>=3&&t.talentsOf(P).points().left===P.level*t.LEVEL.pts&&!P.perkPend,'a battle\u2019s experience raises the level, a skill point each (points='+t.talentsOf(P).points().left+' lv='+P.level+')');
 t.openChar();ok(G.mode==='char','char opens');t.act('char-close');const h0=t.heroStats().hp;ok(t.takeNode('oneh_str')&&t.heroStats().hp>h0,'a Strength node raises health (what Strength gave)');
 t.takeNode('surv_quarter');ok(t.has('quarter'),'old perks now come from talents (Quartermaster, no milestone)');
 while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 t.act('char-tab','party');t.act('char-close');ok(G.mode==='world','char close');
 P.gold=2000;t.enterTown(t.TOWNS[1]);t.act('tab','tavern');ok(/Brann/.test(document.getElementById('panel').innerHTML),'brann in tavern');
 t.act('hire-comp','brann');ok(!!P.comps.brann,'hire brann');
 t.act('leave');ok(G.mode==='world','leave town ('+G.mode+')');
 t.openChar();t.act('char-tab','party');t.act('role','brann:scout');ok(P.comps.brann.role==='scout'&&Math.abs(t.skill('scout')-(P.sk.scout.lv/PROF.per+2))<1e-9,'role scout bonus');t.act('char-close');
 const b=t.bandits[0];t.startEncounter({kind:'party',ref:b,n:4});t.act('fight');ok(G.mode==='battle'&&t.B.units.some(u=>u.comp),'battle with companion');t.beginFight();
 let i=0;while(t.B&&i<20000){const h=t.B.hero,e=t.B.units.find(u=>u.team===1&&u.hp>0);if(h.hp>0&&e){h.x+= (e.x-h.x)*.05;h.y+=(e.y-h.y)*.05;h.cd=0;}t.swing();t.updateBattle(.033);if(t.B&&i%15===0)t.frame();i++}
 ok(!t.B&&G.mode==='dialog','battle finished in '+i+' steps; oneh xp='+P.sk.oneh.xp.toFixed(1)+' prisoners='+JSON.stringify(P.prisoners));
 t.act('cont');ok(G.mode==='world'||G.mode==='perk','cont -> '+G.mode);while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 t.startEncounter({kind:'party',ref:t.bandits[0],n:3});t.autoResolve();t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 ok(true,'auto-resolve; prisoners='+JSON.stringify(P.prisoners)+' tact xp='+P.sk.tact.xp.toFixed(1));
 P.prisoners={militia:2,archer:1};t.enterTown(t.TOWNS[1]);t.act('tab','tavern');const g0=P.gold;t.act('ransom');const want=2*t.RANSOM[t.ST.militia.tier]+t.RANSOM[t.ST.archer.tier];ok(P.gold===g0+want&&!Object.keys(P.prisoners).length,'ransom +'+(P.gold-g0)+' (want '+want+')');t.act('leave');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 P.prisoners={militia:2};t.openChar();t.act('char-tab','party');const tr=P.troops.militia||0;t.act('p-recruit','militia');ok((P.troops.militia||0)===tr+1,'recruit prisoner');t.act('p-release','militia');ok(!P.prisoners.militia,'release prisoner');t.act('char-close');
 t.enterTown(t.TOWNS[0]);t.act('tab','trade');t.invAdd('good','iron',20);const tx=P.sk.trade.xp;t.act('sell','iron:5');ok(P.sk.trade.xp>tx,'trade xp');t.act('leave');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 P.tx=P.x+200;P.ty=P.y;const sx=P.sk.scout.xp+P.sk.scout.lv*100;for(let k=0;k<120;k++)if(G.mode==='world')t.updateWorld(.05);ok(P.sk.scout.xp+P.sk.scout.lv*100>sx,'travel trains Scouting (xp '+P.sk.scout.xp.toFixed(2)+', mode '+G.mode+')');
 if(G.mode!=='world'){G.modal=false;document.getElementById('ov').hidden=true;G.mode='world';G.enc=null}
 for(let k=0;k<3;k++)t.dayTick();
 t.saveGame();const sv=t.readSave();ok(!!sv&&sv.P.comps.brann,'save written');
 const gold=P.gold,lv=P.level,pk2=P.perks.slice();P.gold=1;P.comps={};P.perks=[];
 t.act('load');ok(P.gold===gold&&P.level===lv&&!!P.comps.brann&&P.perks.length===pk2.length&&G.mode==='world','load restores');
 t.frame();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
