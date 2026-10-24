'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;P.bsta=100;
 const h=Kit.goHome('Ashford');Kit.goTo(h.x+240,h.y+200);const x=P.x+130,y=P.y+40,pick=window.pickAt;
 try{window.pickAt=()=>null;
  G.travelClick=null;t.worldGo(x,y);ok(!G.hurry&&P.tx===x,'one travel click walks to the destination');
  t.worldGo(x,y);ok(G.hurry&&t.hurryPace()===t.SUPPLY.forcedMarch.pace,'double click starts the existing Hurry pace');
  t.worldGo(x+20,y);ok(!G.hurry&&P.tx===x+20&&!G.travelClick,'next travel click cancels Hurry and resumes walking');
  t.worldGo(x,y);G.travelClick.t-=t.WORLD_CLICK.dbl+1;t.worldGo(x,y);ok(!G.hurry,'clicks separated beyond the double-click interval keep walking');
  G.travelClick=null;t.worldGo(x,y);t.worldGo(x+100,y);ok(!G.hurry,'two clicks on different destinations do not trigger Hurry');
  P.bsta=0;G.travelClick=null;t.worldGo(x,y);t.worldGo(x,y);ok(!G.hurry,'double clicking cannot bypass exhaustion');P.bsta=100;
  t.setHurry(true);t.worldMove(x,y);ok(!G.hurry,'direct travel commands also cancel Hurry');
 }finally{window.pickAt=pick}
 const enemy=t.asParty({kind:'bandits',troops:['militia'],x:P.x+180,y:P.y,cool:0});t.bandits.push(enemy);
 t.worldApproach(enemy,true);ok(G.hurry&&G.chase===enemy,'double-click party approach can Hurry toward a distant party');
 t.worldApproach(enemy);ok(!G.hurry&&G.chase===enemy,'normal party approach returns to walking');
 t.prefSet('bpause',false);G.enc={kind:'party',ref:enemy,list:enemy.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});
 const b=t.B,cam=JSON.stringify(b.cam),pos={x:P.x,y:P.y};G.shake=10;t.jolt(5);const shake=t.shakeView(true);
 ok(!shake||Math.abs(shake.x)<=1&&Math.abs(shake.y)<=1,'world battle limits strong blows and charge jolts to subtle screen movement');
 ok(JSON.stringify(b.cam)===cam&&P.x===pos.x&&P.y===pos.y,'reduced shake does not move the camera or campaign anchor');
 b.jolt=null;b.paused=true;G.shake=10;ok(t.shakeView(true)===null,'paused combat has no ordinary blow shake');
});
