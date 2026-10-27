'use strict';
// Actual generated terrain, without the cleared-ground fixture used by worldbattleplay.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,seed=Number(new URLSearchParams(location.search).get('seed'))||1;
 for(const [name,kind] of [['road',t.T_ROAD],['forest',t.T_FOREST],['hills',t.T_HILL]]){
  Kit.begin('soldier',seed);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.PHYSICS.on=true;t.FOG.on=true;t.GUIDE.on=false;
  const home=t.townBy('Ashford');let tile=-1,best=Infinity;for(let i=0;i<t.WM.kind.length;i++){if(t.WM.kind[i]!==kind)continue;const x=(i%t.MW+.5)*t.TILE,y=(Math.floor(i/t.MW)+.5)*t.TILE,d=Math.hypot(x-home.x,y-home.y);if(d>=100&&d<best){tile=i;best=d}}
  Kit.goTo((tile%t.MW+.5)*t.TILE,(Math.floor(tile/t.MW)+.5)*t.TILE);P.troops={hum_foot:6,hum_bow:4};t.frame();
  const e=t.asParty({kind:'bandits',troops:['militia','militia','militia','archer'],x:P.x+70,y:P.y,cool:0,n:4});t.bandits.push(e);G.enc={kind:'party',ref:e,list:e.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});const b=t.B;for(let i=0;i<4000&&b.muster?.active;i++)t.updateBattle(.05);t.beginFight();t.setAuto(true,true);let frames=0;
  for(;frames<18000&&t.B===b;frames++){t.updateBattle(1/30);if(t.B===b&&frames%120===0)t.frame()}
  ok(t.B===null&&G.mode==='dialog'&&/Victory|Defeat|Disengaged|Withdrawn/.test(Kit.text()),name+' battle on untouched generated terrain reaches a campaign result');
  info(name+': '+frames+' frames, '+(b.stalemate?'disengaged':b.win?'victory':'defeat')+', '+b.kills+' kills');
 }
});
