'use strict';
// Detection read by skill (the owner, 2026-11-15: "make an eye detection unlock via skills"; data/tree.js DETECT_SKILL, world/
// worldobject.js detectSkill): with none of the Scouting tree's perks no eye shows who watches you (nor your own, nor your army's ring
// by it, nor a word of it in their tips); Scout's Eye (seen) shows those who have seen your army and your own eye; Tracker (near)
// also those close to it and where a search last saw you. What they know of you is the same either way: only what you can read.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,X=t.DETECT_SKILL;Kit.begin('soldier',1);Kit.clear();Kit.world();P.troops={};t.GUIDE.on=false;P.stay=null;P.hostile={};X.on=true;
 const lord=W.lords[0],band=W.lords[1],home=t.townBy(lord.tgt)||t.TOWNS[0];Kit.goTo(home.x+160,home.y+120);Object.assign(lord,{dead:false,gone:false,inside:null,fight:null,state:'rest',x:P.x+80,y:P.y});
 W.lords=[lord];Object.assign(band,{dead:false,gone:false,inside:null,fight:null,state:'rest',x:-9999,y:-9999});W.patrols=[];W.monsters=[];W.caravans=[];W.refugees=[];W.critters=[];W.folk=[];t.bandits.length=0;
 const i=Math.floor(P.y/t.TILE)*t.MW+Math.floor(P.x/t.TILE),tile=t.tiles[i],ctx=t.ctx,draw=ctx.drawImage,tree0=(P.tree||[]).slice(),perks0=P.perks.slice();
 const calls=[],eyes=()=>{calls.length=0;ctx.drawImage=function(...a){calls.push(a);return draw.apply(this,a)};try{t.drawTravelDetection(G.cam)}finally{ctx.drawImage=draw}return calls.length};
 const ring=()=>t.travelDetectionColor(t.travelDetectionShown(t.travelDetectionState())),learn=L=>{P.tree=tree0.filter(id=>!['scout_eye','scout_track'].includes(id)).concat(L);P.perks=perks0.filter(p=>p!==X.seen&&p!==X.near);t.TravelAwareness.gen++};
 try{G.paused=false;G.speed=1;t.TravelAwareness.reset();t.tiles[i]=t.T_OPEN;t.TravelAwareness.step(2);
  W.lords.push(band);band.x=P.x-80;band.y=P.y;t.lodFile();t.TravelAwareness.step(.5);
  const dl=t.travelDetection(lord),db=t.travelDetection(band);ok(dl.sees&&!db.sees&&db.exposure>0,'the scene: a lord who has seen your army, another growing suspicious of it ('+Math.round(db.exposure*100)+'%)');
  ok(t.TREE.scout_eye.m.perk===X.seen&&t.TREE.scout_track.m.perk===X.near&&/who has seen your army/.test(t.TREE.scout_eye.d)&&/close to spotting you/.test(t.TREE.scout_track.d),'learned on the Scouting tree: '+t.TREE.scout_eye.n+' ("'+t.TREE.scout_eye.d+'"), then '+t.TREE.scout_track.n+' ("'+t.TREE.scout_track.d+'")');
  learn([]);const n0=eyes();
  ok(n0===0&&ring()==='#82c6b3'&&!/detected|suspicious|searching/i.test(t.tipFor(lord)+t.tipFor(band)),'none learned: no eye over anyone or over you ('+n0+' drawn), your army\'s ring as calm, not a word of it in their tips');
  learn(['scout_eye']);const n1=eyes();
  ok(P.hasPerk(X.seen)&&n1===2&&ring()==='#dbca91'&&t.tipFor(lord).includes('Has detected your army')&&!/suspicious/i.test(t.tipFor(band)),'Scout\'s Eye: the lord who has seen you and your own eye ('+n1+' drawn), the ring by it; the other\'s suspicion not yet read');
  learn(['scout_track']);const n2=eyes();
  ok(P.hasPerk(X.near)&&n2===3&&/Suspicious of your army \(\d+%\)/.test(t.tipFor(band)),'Tracker: the other growing suspicious too ('+n2+' drawn), how close in its tip: "'+t.travelDetectionText(band)+'"');
  const s1=JSON.stringify([t.travelDetection(lord).sees,t.travelDetection(band).exposure]);learn([]);ok(JSON.stringify([t.travelDetection(lord).sees,t.travelDetection(band).exposure])===s1,'what they know of you is the same learned or not: only what you read');
  X.on=false;learn([]);ok(eyes()===3,'DETECT_SKILL off: every eye as before')}
 finally{X.on=true;ctx.drawImage=draw;t.tiles[i]=tile;P.tree=tree0;P.perks=perks0;t.TravelAwareness.gen++}
});
