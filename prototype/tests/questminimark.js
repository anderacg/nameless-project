'use strict';
// A quest's goal on the minimap (the owner, 2026-11-22: "Quest tracker destination in minimap seems to be too big and look weird in pc";
// world/quests.js drawQuestDots, questMiniMark, QUEST_MARK.dia): a small inked diamond in the minimap's own unit, as your own mark there
// is, the tracked one a little bigger and lit; never a square sized by the map's zoom (a seventh of the minimap on a big screen).
Kit.suite(({ok,info})=>{const t=T,P=t.P;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();
 const h=t.TOWNS.slice().sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];let q=null;for(let i=0;i<10&&!q;i++)q=t.makeQuest('courier',h);
 if(!q){info('no courier job offered here');ok(true,'skipped');return}t.acceptQuest(q);t.QuestTrack.set('q'+q.id);const g=t.questGoal(q);
 // (the minimap's own unit: its width a 112th, as drawMiniMap reckons it)
 const v=t.worldMiniView(),u=v.w/112,marks=[],dots=[];
 t.drawQuestDots((x,y,c,s)=>dots.push(s),(x,y,on)=>marks.push(on));ok(marks.filter(Boolean).length===1&&!dots.length,'given a mark, every goal is drawn as one (the tracked one once), never a dot ('+marks.length+' goals)');
 // (drawn on a canvas: its painted px across, the minimap's width in its units)
 const cv=document.createElement('canvas');cv.width=cv.height=200;const c=cv.getContext('2d'),k=200/v.w;c.setTransform(k,0,0,k,0,0);
 const span=on=>{c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,200,200);c.setTransform(k,0,0,k,0,0);t.questMiniMark(c,v.w/2,v.w/2,u,on,'#3b1a0e');const d=c.getImageData(0,0,200,200).data;let x0=1e9,x1=-1;for(let y=0;y<200;y++)for(let x=0;x<200;x++)if(d[(y*200+x)*4+3]>40){x0=Math.min(x0,x);x1=Math.max(x1,x)}return (x1-x0+1)/200};
 const on=span(true),off=span(false),you=2*2.4/112;
 info('across the minimap: the tracked goal '+(on*100).toFixed(1)+'%, another '+(off*100).toFixed(1)+'%, your own mark '+(you*100).toFixed(1)+'%');
 ok(on>off&&on<=you*1.6&&on>=you*.8,'the tracked goal about your own mark\'s size on the minimap, whatever the screen ('+(on*100).toFixed(1)+'% of its width)');
 ok(off>0&&off<on,'another goal smaller');
 t.frame();ok(!ERR.length,'no runtime errors');
});
