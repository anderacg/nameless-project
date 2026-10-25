'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;P.stay=null;P.hostile={};
 const lord=W.lords[0],home=t.townBy(lord.tgt)||t.TOWNS[0];Kit.goTo(home.x+160,home.y+120);Object.assign(lord,{dead:false,gone:false,inside:null,fight:null,state:'rest',x:P.x+100,y:P.y});
 W.lords=[lord];W.patrols=[];W.monsters=[];W.caravans=[];W.refugees=[];W.critters=[];W.folk=[];t.bandits.length=0;
 const i=Math.floor(P.y/t.TILE)*t.MW+Math.floor(P.x/t.TILE),tile=t.tiles[i],ctx=t.ctx,draw=ctx.drawImage;
 try{t.tiles[i]=t.T_OPEN;let d=t.travelDetection(lord);ok(!d.sees&&d.exposure>0&&d.exposure<1,'eye partially opens just outside the actual detection threshold');
  ok(d.range===lord.brain.sight(t.WORLD_SCALE.sight.lord),'lord indicator reads the same sight range used by its brain');
  lord.x=P.x+80;d=t.travelDetection(lord);ok(d.sees&&d.exposure===1,'eye is fully open when the entity can detect the player');
  t.tiles[i]=t.T_FOREST;d=t.travelDetection(lord);ok(!d.sees&&Math.abs(d.range-90*.55)<.001,'forest cover immediately reduces the indicated detection range');
  lord.x=P.x+40;ok(t.travelDetection(lord).sees,'forest cover does not claim invisibility when an observer is close enough');
  const band=t.asParty({kind:'bandits',troops:['militia'],x:P.x+70,y:P.y});ok(Math.abs(t.travelDetection(band).range-t.BRAINS.band.sight(95))<.001,'bandit eye uses the bandit brain threshold');
  const herd=t.asHerd({id:'deer',n:2,x:P.x+20,y:P.y});ok(t.travelDetection(herd).range===t.CRITTERS.deer.shy*.6,'wildlife eye follows its species shy distance and separate cover modifier');
  const calls=[];ctx.drawImage=function(...a){calls.push(a);return draw.apply(this,a)};
  const eye=t.drawTravelDetection(G.cam);ok(eye.seen.some(d=>d.o===lord)&&calls.length===2,'visible observer gets an individual eye and the player gets an overall eye');
  calls.length=0;lord.inView=()=>false;t.drawTravelDetection(G.cam);ok(calls.length===1,'unseen entities receive no revealing eye marker');delete lord.inView;
  const s=t.stealthEyeSprite(1,'#dbca91');ok(s===t.stealthEyeSprite(1,'#dbca91')&&s!==t.stealthEyeSprite(0,'#dbca91'),'open and closed eyelid artwork is distinct and cached');
  ok(t.tipFor(lord).includes('Can detect your army'),'observer tooltip explicitly explains current detection');
  const before=JSON.stringify([lord.x,lord.y,lord.state,P.x,P.y]),random=Math.random;let n=0;try{Math.random=()=>{n++;return .5};t.travelDetectionState()}finally{Math.random=random}
  ok(n===0&&JSON.stringify([lord.x,lord.y,lord.state,P.x,P.y])===before,'indicators do not change behavior or consume random rolls');
  P.stay={town:home.name};ok(t.drawTravelDetection(G.cam)===null&&t.travelDetection(lord)===null,'no travel detection gauge while sheltered inside a holding');P.stay=null;
  window.eval('B={world:{}}');ok(t.drawTravelDetection(G.cam)===null,'battle keeps its existing detection indicators');window.eval('B=null');
  t.frame();ok(!ERR.length,'normal world frame renders the detection gauges without errors');
 }finally{ctx.drawImage=draw;delete lord.inView;t.tiles[i]=tile;P.stay=null;window.eval('B=null')}
});
