'use strict';
// A travel click walks there, a second on the same spot too (Hurry, a double click's forced march, is gone: the owner, 2026-10-31,
// "remove hurry features"); a party approached at the march's pace; a world battle keeps the screen still
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;P.bsta=100;
 const h=Kit.goHome('Ashford');Kit.goTo(h.x+240,h.y+200);const x=P.x+130,y=P.y+40,pick=window.pickAt;
 try{window.pickAt=()=>null;
  t.worldGo(x,y);ok(P.tx===x,'one travel click walks to the destination');
  t.worldGo(x,y);ok(P.tx===x&&!G.hurry&&!('setHurry' in window)&&!('hurryPace' in window),'a double click walks there too: no Hurry');
  t.worldGo(x+20,y);ok(P.tx===x+20,'the next travel click walks to the new one');
 }finally{window.pickAt=pick}
 const enemy=t.asParty({kind:'bandits',troops:['militia'],x:P.x+180,y:P.y,cool:0});t.bandits.push(enemy);
 t.worldApproach(enemy);ok(!G.hurry&&G.chase===enemy,'a party approached: you make for it at the march\'s pace');
 t.prefSet('bpause',false);G.enc={kind:'party',ref:enemy,list:enemy.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});
 const b=t.B,cam=JSON.stringify(b.cam),pos={x:P.x,y:P.y};G.shake=10;t.jolt(5);const shake=t.shakeView(true);
 ok(!shake||Math.abs(shake.x)<=1&&Math.abs(shake.y)<=1,'world battle limits strong blows and charge jolts to subtle screen movement');
 ok(JSON.stringify(b.cam)===cam&&P.x===pos.x&&P.y===pos.y,'reduced shake does not move the camera or campaign anchor');
 b.jolt=null;b.paused=true;G.shake=10;ok(t.shakeView(true)===null,'paused combat has no ordinary blow shake');
});
