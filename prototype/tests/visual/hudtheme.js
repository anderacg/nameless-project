'use strict';
// Not a test: the brown HUD and full map. ?scene=world|map|battle, &deploy=1, &zoom=1 for the battle camera.
Kit.suite(({ok})=>{
  const t=T,q=new URLSearchParams(location.search),scene=q.get('scene')||'world';
  window.requestAnimationFrame=()=>0;Kit.begin('soldier',23);Kit.clear();Kit.world();
  const home=Kit.goHome('Ashford');t.P.x=home.x+40;t.P.y=home.y+30;t.G.clock=t.DAY*.3;t.GUIDE.on=false;
  t.P.band='The Free Company';t.P.troops={hum_spear:8,hum_bow:6,hum_knight:3};t.P.gold=160;
  if(scene==='battle'){
    t.TERRAIN.on=true;t.FOG.on=true;t.FIELD_SIZES.on=true;t.BDEPLOY.on=!!q.get('deploy');
    t.startBattle({enemies:[...Array(10).fill('militia'),...Array(5).fill('archer')],deploy:!!q.get('deploy')});
    t.battlePause(true);t.selectGroup(t.playerGroups()[0]);if(q.get('zoom'))t.camZoom(1);
    t.setOrderUI();t.bhudInfo();t.frame();
  }else{t.updateHUD(true);t.frame();if(scene==='map')t.fullMapOpen()}
  ok(true,'HUD theme '+scene);
});
