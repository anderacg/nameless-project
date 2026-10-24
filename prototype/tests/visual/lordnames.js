'use strict';
// Screenshot scenes: ?scene=hall|known|journal|street; &w=844&h=390.
Kit.suite(({ok})=>{
 const t=T,G=t.G,W=t.W,u=new URLSearchParams(location.search),scene=u.get('scene')||'hall';
 window.requestAnimationFrame=()=>0;Kit.begin('soldier',23);Kit.clear();Kit.world({town:null});
 const size=()=>{if(u.get('w')){const s=document.getElementById('screen').style;s.width=u.get('w')+'px';s.height=u.get('h')+'px'}};size();
 const home=t.townBy('Ashford'),ls=W.lords.filter(l=>l.fac===home.owner).slice(0,2);ls.forEach(l=>{l.inside=home.name;l.x=home.x;l.y=home.y});
 t.enterTown(home);t.act('tab','hall');
 if(scene==='known'){document.querySelector('[data-act="hall-talk"][data-arg="'+ls[0].id+'"]').click();t.act('lord-leave')}
 if(scene==='journal'){t.lordMeet(ls[0]);t.act('lord-leave');Kit.world({town:null});G.town=null;t.openJournal('lords')}
 if(scene==='street'){t.enterScene(home);const n=G.scene.npcs.find(x=>x.lord===ls[0].id);G.scene.p.x=n.x+10;G.scene.p.y=n.y+10}
 document.getElementById('panel').style.animation='none';t.frame();addEventListener('resize',()=>{size();t.frame()});ok(true,'lord names '+scene);
});
