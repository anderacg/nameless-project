'use strict';
// Attacking a bandit camp goes into battle (the owner, 2026-10-30: "when you try to attack a bandit camp you won't get into the battle
// screen"): from its page (Attack, then Fight), with bands sheltering in it, the same after a load, and an empty camp after a load,
// each opens a world battle on the map (its men stand for the camp when they are no army of their own: worldbattle.js); no errors.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);
 const go=(c,label)=>{Kit.world({encCool:0});P.troops={hum_foot:10};c.seen=true;P.x=c.x+30;P.y=c.y+10;const e0=ERR.length;
  t.enterSite(c);t.act('site-ask');t.act('site-attack');const f=document.querySelector('#panel [data-act="fight"]');ok(!!f,label+': the encounter offers Fight');if(f)f.click();
  for(let i=0;i<10&&t.B;i++){t.updateBattle(.05);t.frame()}
  ok(G.mode==='battle'&&t.B&&t.B.world&&t.B.units.some(u=>u.team===1)&&ERR.length===e0,label+': into battle ('+G.mode+', '+(t.B?t.B.units.filter(u=>u.team===1).length:0)+' foes)'+(ERR.length>e0?': '+ERR[e0]:''));
  if(t.B){t.B.over=true;t.B.endT=0;t.updateBattle(.01);if(t.B)t.finishBattle();Kit.done({cont:true,world:true})}};
 let c=t.camps()[0];c.cleared=false;c.bands=[];
 const band=(n,ld)=>t.asParty({x:c.x,y:c.y+3,n,kind:'bandits',list:t.makeEnemies(n,false,'bandits'),t:0,a:0,idle:true,cool:5,ld});
 t.bandits.length=0;t.bandits.push(band(4,null),band(5,t.newChief('bandits',2)));P.x=c.x+3000;P.y=c.y;G.clock=t.DAY*.95;t.updateBands(.01);
 ok(c.bands.length===2,'(two bands shelter in the camp)');go(c,'bands sheltering');
 c=t.camps()[0];c.cleared=false;c.bands=[];t.bandits.length=0;t.bandits.push(band(4,null));P.x=c.x+3000;t.updateBands(.01);
 Kit.world();t.saveGame(true,'1');t.loadGame('1');go(t.camps()[0],'bands sheltering, after a load');
 {const c2=t.camps()[1]||t.camps()[0];c2.bands=[];c2.cleared=false;go(c2,'an empty camp, after a load')}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
