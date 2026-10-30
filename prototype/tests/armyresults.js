'use strict';
// The battle's results army by army (battle/resolution.js armyReport, ui/loot.js battleArmiesHtml): every army that fought, yours
// first, its fallen, withdrawn, fled and still standing (adding up to those who fought) and its kills; what your army earned (the
// campaign's own change in gold, renown, experience and prisoners); a world battle's withdrawal that ends the battle for you while
// the rest fight on; a classic battle as your band and the enemy.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;
 const adds=a=>a.start===a.fallen+a.withdrew+a.fled+a.standing,rows=()=>[...document.querySelectorAll('[data-report-army]')];
 const world=(wd)=>{t.WORLD_BATTLE.on=true;t.TERRAIN.on=true;t.PHYSICS.on=true;t.EXITS.on=true;G.paused=false;G.speed=1;P.fac='vale';P.hostile={};P.troops={hum_foot:10,hum_bow:6,hum_knight:4};
  const home=Kit.goHome('Ashford');Kit.goTo(home.x+400,home.y+350);const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE);for(let y=ty-30;y<=ty+30;y++)for(let x=tx-30;x<=tx+30;x++){const i=y*t.MW+x;t.tiles[i]=t.T_OPEN;t.WM.edge[i]=0}
  const band=t.asParty({kind:'bandits',troops:Array(14).fill('militia'),x:P.x+25,y:P.y,cool:0});t.bandits.push(band);W.monsters=[t.asMonster({id:'wolf',n:5,lv:1,x:P.x+10,y:P.y+22,hx:P.x+10,hy:P.y+22,t:0,a:0,cool:0})];
  G.enc={kind:'party',ref:band,list:band.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,surprise:true});const b=t.B;t.setAuto(true,true);
  for(let i=0;i<30*(wd?2:60)&&t.B===b&&!b.over;i++)t.updateBattle(1/30);
  let outAt=null;if(wd&&t.B===b){for(const g of Object.values(b.groups).filter(g=>g.player))g.withdraw();for(let i=0;i<30*60&&t.B===b&&!b.over;i++)t.updateBattle(1/30);outAt=b.t}
  const mark={gold:P.gold,renown:P.renown,prisoners:t.prisonerCount()},over=b.over,retreat=!!b.retreat;if(t.B===b)t.finishBattle();return{b,mark,over,retreat,outAt,report:G.lootView&&G.lootView.report}};
 // ---- a world battle of three armies, fought out
 {const {b,mark,report}=world(false),A=report&&report.armies||[];info('armies: '+A.map(a=>a.name+' '+a.start+'/'+a.fallen+'/'+a.withdrew+'/'+a.fled+'/'+a.standing+' k'+a.kills).join('; '));
  ok(A.length>=3&&A[0].stance==='Your army'&&A.slice(1).every(a=>a.stance!=='Your army'),'every army that fought is in the report, yours first');
  ok(A.every(adds),'each army’s fallen, withdrawn, fled and standing add up to those who fought');
  const mine=b.units.filter(u=>u.team===0&&!u.waiting);ok(A[0].start===mine.length&&A[0].fallen===mine.filter(u=>u.hp<=0&&!u.left).length,'your army’s numbers are its soldiers’ own');
  ok(A.reduce((n,a)=>n+a.kills,0)<=A.reduce((n,a)=>n+a.fallen,0)&&A[0].kills===b.sides.records.find(r=>r.owner===P).kills.length,'kills are credited army by army');
  const R=report.rewards;ok(R&&R.gold===P.gold-mark.gold&&R.renown===P.renown-mark.renown&&R.prisoners===t.prisonerCount()-mark.prisoners&&R.xp>0,'what your army earned is the campaign’s own change ('+JSON.stringify(R)+')');
  ok(rows().length===A.length&&/Your army earned/.test(document.querySelector('.battle-rewards')?.textContent||''),'the results show a row for each army and your rewards');
  ok(rows()[0].textContent.includes(t.bandName()),'your army is shown by your band’s name');
  t.act('lt-leave');Kit.done({world:true});Kit.clear()}
 // ---- your army withdraws: it gets off the field (the world battle's circle) and the rest fight on
 {const {report,over,retreat,outAt}=world(true),A=report&&report.armies||[];info('withdrawn at '+(outAt&&outAt.toFixed(1))+' s: '+A.map(a=>a.name+' '+a.start+'/'+a.fallen+'/'+a.withdrew+'/'+a.fled+'/'+a.standing).join('; '));
  ok(over&&retreat,'a withdrawal off a world battle’s circle ends the battle as your retreat (before: stopped at the edge)');
  ok(A[0].withdrew>0&&A[0].standing===0&&A.every(adds),'the report counts those who withdrew');
  const still=A.slice(1).filter(a=>a.standing);ok(!still.length||/fight goes on without you/.test(document.querySelector('.battle-report')?.textContent||''),'armies still on the field are named as fighting on'+(still.length?' ('+still.map(a=>a.name).join(', ')+')':''));
  t.act('lt-leave');Kit.done({world:true});Kit.clear()}
 ok(!ERR.length,'army results have no runtime errors');
});
