'use strict';
// Villages may fortify during world simulation. The raid precondition is no walls, not merely kind === 'village'.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
  const t=T,G=t.G,P=t.P,W=t.W;t.act('begin','soldier');G.quietEvents=true;
  W.lords=[];W.patrols=[];W.monsters=[];W.critters=[];t.bandits.length=0;
  const village=t.TOWNS.find(h=>h.kind==='village'&&h.owner==='karn');
  P.hostile={karn:G.day+60};P.troops={hum_knight:30,hum_long:20};P.x=village.x;P.y=village.y+5;village.gar=2;village.wall=1;
  t.openSiege(village);
  const snapshot=()=>JSON.stringify({troops:P.troops,gold:P.gold,gar:village.gar,raid:P.raid});let before=snapshot();
  ok(t.walled(village)&&!!document.querySelector('[data-act="sg-camp"]')&&!document.querySelector('[data-act="sg-raid-auto"]'),'a fortified village offers a siege camp, not a raid');
  t.act('sg-raid-auto');ok(snapshot()===before&&!P.raid,'a direct raid command cannot bypass the wall requirement');
  village.wall=0;t.openSiege(village);ok(!!document.querySelector('[data-act="sg-raid-auto"]'),'an unwalled village offers the raid action');
  const random=Math.random;try{Math.random=()=>.5;t.act('sg-raid-auto')}finally{Math.random=random}
  ok(P.raid&&P.raid.town===village.name,'beating an unwalled village starts the raid');
  const lord=t.asParty({id:'fixture',name:'Rescuer',fac:'karn',troops:Array(12).fill('dw_clan'),x:village.x+300,y:village.y,state:'rest',tgt:village.name});W.lords=[lord];t.lordThink(lord);
  ok(lord.state==='relieve'&&lord.tgt===village.name,'its lord responds to the active raid');
  P.x+=200;t.raidTick(.01);ok(!P.raid&&village.raided>G.day,'walking away ends an actual raid');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
