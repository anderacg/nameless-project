'use strict';
// White sound waves: ?v=1&scene=source|edge|left|far|still. No participants, result, exclamation mark or rumour marker.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,u=new URLSearchParams(location.search),scene=u.get('scene')||'source';let now=1e7;
 window.requestAnimationFrame=()=>0;Kit.begin('soldier',23);Kit.clear();Kit.world({town:null});t.GUIDE.on=false;G.paused=false;G.dead=false;G.mouse.in=false;
 const home=Kit.goHome('Ashford');P.x=home.x+80;P.y=home.y+100;
 W.lords.forEach(l=>{l.x=l.y=-9999;l.inside=null});W.patrols=[];W.monsters=[];W.critters=[];W.caravans=[];W.refugees=[];W.folk=[];W.ships=[];W.fights=[];
 performance.now=()=>now;t.KNOWLEDGE.reset();G.msgs=[];t.DISTRACTIONS.reset();
 if(['edge','left'].includes(scene))P.sight=()=>Math.max(t.VW,t.VH);
 const dx=scene==='left'?-1:1,d=t.vis()*(scene==='far'?1.3:1.12),p={x:P.x+dx*d,y:P.y};
 // The source lies on open ground. It stays beyond actual sight even when the army's own ground changes its sight.
 const tx=Math.floor(p.x/t.TILE),ty=Math.floor(p.y/t.TILE);t.tiles[ty*t.MW+tx]=t.T_OPEN;
 t.worldEvent({...p,text:W.lords[0].name+' defeats '+W.lords[1].name+'.',noise:'battle',post:false});
 if(scene==='still')window.reducedMotion=()=>true;
 now+=700;t.updateHUD(true);t.frame();
 ok(!G.msgs.length&&!Object.keys(t.KNOWLEDGE.lords).length,'sound gives no battle log or discovered identities');
 ok(t.DISTRACTIONS.active().length===(scene==='far'?0:1),'only nearby unseen sources emit waves');
 info(JSON.stringify({scene,source:p,sight:t.vis(),cues:t.DISTRACTIONS.active(),vw:t.VW,vh:t.VH}));
});
