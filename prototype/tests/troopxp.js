'use strict';
// Troop experience: your soldiers earn XP in battle (damage dealt, kills by the foe's tier, being there, winning), the survivors
// pool it by kind, and training a soldier up its troop tree needs its kind's XP (and the gold, at a barracks); training spends it.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,ST=t.ST;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;
 const fight=(troops,list)=>{P.troops=troops;P.txp={};G.mode='world';G.modal=false;t.hidePanel();G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list,mine:true};t.startBattle({enemies:list,tournament:false});t.beginFight();return t.B};// (begun: a battle opens waiting for Start Battle, deploy.js)
 // the rules
 ok(t.txpNeed('hum_levy')===t.TROOP_XP.need[1]&&t.txpNeed('hum_spear')===t.TROOP_XP.need[2]&&t.txpNeed('hum_spear')>t.txpNeed('hum_levy'),'higher tiers need more XP to train ('+t.txpNeed('hum_levy')+', '+t.txpNeed('hum_spear')+')');
 P.troops={hum_levy:3};P.txp={};t.txpGain('hum_levy',1e6);ok(P.txp.hum_levy===3*t.txpNeed('hum_levy')&&t.txpReady('hum_levy')===3,'a kind holds no more XP than its soldiers can use (all 3 ready)');
 P.troops={hum_knight:2};P.txp={};t.txpGain('hum_knight',100);ok(!t.UP.hum_knight||t.txpReady('hum_knight')===0,'a kind at the top of its tree gains none');
 // in battle: blows and kills
 {const B=fight({hum_levy:4},['militia']);const lv=B.units.find(u=>u.type==='hum_levy'),e=B.units.find(u=>u.team===1);e.hp=e.max=30;
  t.hit(lv,e,10);const x1=lv.xp||0;ok(x1>0,'a blow earns the soldier XP ('+x1.toFixed(1)+')');t.hit(lv,e,999);ok(lv.xp>=x1+t.TROOP_XP.kill*ST.militia.tier,'and a kill more, by the foe’s tier ('+lv.xp.toFixed(1)+')');
  ok(!B.hero.xp&&(t.hit(B.hero,B.units.find(u=>u.team===1)||e,5),!B.hero.xp),'your hero earns none of it (they have their own)');
  B.over=true;B.win=true;B.endT=0;t.updateBattle(.01);
  ok(t.txpOf('hum_levy')>0,'after the victory the survivors bank their XP by kind ('+Math.round(t.txpOf('hum_levy'))+')');t.act('cont')}
 // the fallen take theirs with them
 {const B=fight({hum_levy:2},['militia']);const [a,b]=B.units.filter(u=>u.type==='hum_levy');a.xp=500;b.xp=0;t.applyDmg(a,9999,1);B.over=true;B.win=true;B.endT=0;t.updateBattle(.01);
  ok(t.txpOf('hum_levy')<100,'a soldier who falls takes his XP with him ('+Math.round(t.txpOf('hum_levy'))+' left)');t.act('cont')}
 // training needs it, and spends it
 {const town=t.TOWNS.find(x=>x.T.train);P.troops={hum_levy:2};P.txp={};P.gold=500;G.town={ref:town,tab:'recruit'};G.mode='town';
  t.act('train','hum_levy:hum_spear');ok(P.troops.hum_levy===2&&!P.troops.hum_spear&&P.gold===500,'without the XP, no training');
  P.txp={hum_levy:t.txpNeed('hum_levy')+5};const c=t.trainCost('hum_spear');t.act('train','hum_levy:hum_spear');
  ok(P.troops.hum_levy===1&&P.troops.hum_spear===1&&P.gold===500-c&&Math.round(P.txp.hum_levy)===5,'with it: trained, the XP and gold spent');
  t.renderTown&&t.renderTown();G.mode='world';G.town=null;t.hidePanel()}
 // auto-resolve: a share
 {P.troops={hum_levy:6};P.txp={};G.mode='world';G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia'],mine:true};const r=Math.random;Math.random=()=>.99;t.autoResolve();Math.random=r;
  ok(t.txpOf('hum_levy')>0,'an auto-resolved win teaches them too, a little ('+Math.round(t.txpOf('hum_levy'))+')');t.act('cont')}
 // the party window shows it
 {P.troops={hum_levy:2};P.txp={hum_levy:t.txpNeed('hum_levy')};G.mode='world';G.modal=false;G.char='roster';t.openChar();t.act('party-select',t.partyRoster(P).groups.find(g=>g.type==='hum_levy').id);const pan=document.getElementById('panel').textContent;
  ok(new RegExp('Training · all '+t.ST.hum_levy.n+'\\s*'+Math.floor(t.txpOf('hum_levy'))+' / '+2*t.txpNeed('hum_levy')).test(pan)&&/1 ready to train/.test(pan),'the Army window shows each kind’s experience and who is ready');G.mode='world';t.hidePanel()}
 // saved
 {P.troops={hum_levy:2};P.txp={hum_levy:33};t.saveGame(true);P.txp={};t.loadGame&&t.loadGame();ok(!t.loadGame||P.txp.hum_levy===33,'and it is saved')}
}catch(e){o.push('EXC '+e.message+'\n'+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.join('\n');document.body.appendChild(d)};
