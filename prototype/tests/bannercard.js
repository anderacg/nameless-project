'use strict';
// The banner on the card (the owner, 2026-11-01: "remove a floating banner, show the banner detail only when you inspect them
// along with the detail window"): no banner over any army on the map (render.js drawBanners: only your camp's, on its pole), each
// party's label still over its army (armyTagAt); your badges and the eye over your hero (heroTagAt); the hover card (#tip) and the
// long press's card (holdCard) show a party's banner as a flag tab on their top left corner (ui.js tipFlag), crisp, the header
// clear of it, none for a beast or a place; an army is still clicked by its men (world.js pickAt), no banner to click.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,TILE=t.TILE;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;t.frame();// (the screen in the world's mode: its HUD, the card among it, shown)
 const home=Kit.goHome('Ashford');Kit.goTo(home.x+240,home.y+200);const tx=Math.floor(P.x/TILE),ty=Math.floor(P.y/TILE);
 for(let y=ty-25;y<=ty+25;y++)for(let x=tx-25;x<=tx+30;x++)if(t.WM.has(x,y)){const i=y*t.MW+x;t.WM.kind[i]=t.T_OPEN;t.WM.edge[i]=0;t.WM.elev[i]=64}
 const site=W.sites[0];W.sites=W.sites.filter(s=>Math.hypot(s.x-P.x,s.y-P.y)>400);t.reveal();
 const x0=P.x,y0=P.y,cv=document.querySelector('canvas'),scr=document.getElementById('screen'),tip=document.getElementById('tip'),rect=e=>e.getBoundingClientRect();
 const form=(o,n=300)=>{t.MARCH_ARMIES.delete(o);const a=t.MarchArmy.of(o);for(let i=0;i<n;i++)a.step(1/30);a.ring=new t.MarchOutline();a.ring.update(a);return a};
 // (a party's banner pictures, both frames; what drawWorld drew, on any canvas)
 const flags=q=>[0,1].map(f=>t.bannerSprite(q.banner(),f));
 const drawn=()=>{const C=CanvasRenderingContext2D.prototype,d0=C.drawImage,out=[];C.drawImage=function(s,...a){out.push(s);return d0.call(this,s,...a)};try{t.drawWorld()}finally{C.drawImage=d0}return out};
 // ---- a lord, a band and a caravan in sight, each its army
 P.troops={hum_foot:6};P.comps={};form(P);
 const lord=W.lords[0];Object.assign(lord,{inside:null,fight:null,dead:false,x:x0-70,y:y0});lord.troops=Array(20).fill('hum_foot');t.KNOWLEDGE.lord(lord);const A=form(lord);
 const band=t.asParty({kind:'bandits',troops:Array(8).fill('militia'),x:x0+70,y:y0-20,t:0,a:0,idle:true,cool:9,n:8});t.bandits.push(band);form(band);
 const tw=t.TOWNS.find(x=>x.owner&&x.owner!=='player'),to=t.TOWNS.find(x=>x!==tw);
 const car=t.asParty({cv:true,fac:tw.owner,from:tw.name,to:to.name,x:x0-10,y:y0+70,goods:{grain:5},guards:6,cool:0,dir:1});W.caravans=[car];form(car);
 const beast=t.asMonster({id:'wolf',x:x0+60,y:y0+60,hx:x0+60,hy:y0+60,lv:1,n:4,t:0,a:0,cool:5});W.monsters=[beast];
 // ---- the map: no banner over any army, your own neither; the labels still over theirs
 {const labels=[],mt=window.mapTxt;window.mapTxt=function(...a){labels.push(a);return mt.apply(this,a)};let d;try{d=drawn()}finally{window.mapTxt=mt}
  const flew=[P,lord,band,car].filter(q=>flags(q).some(s=>d.includes(s))).map(q=>q.mapKind);
  ok(!flew.length&&[P,lord,band,car].every(q=>q.inView(t.vis())),'no banner flies over an army: yours, a lord\'s, a band\'s, a caravan\'s, all in sight ('+(flew.join(', ')||'none drawn')+')');
  const L=lord.look(),T0=t.armyTagAt(lord,null,G.cam),lab=L.label&&labels.find(a=>a[0]===L.label&&Math.abs(a[1]-T0.x)<1);
  if(!L.label)info('the lord has no label now');else ok(!!lab&&Math.abs(lab[2]-T0.y)<1,'his label ('+L.label+') still over his army, at its tag over his men\'s middle ('+(lab?lab.slice(1,3).map(v=>v.toFixed(1)):'not drawn')+' for '+T0.x.toFixed(1)+','+T0.y.toFixed(1)+')')}
 // ---- your camp: your banner still on its pole (the one left on the map)
 {t.makeCamp();if(!P.camp)info('no camp here');else{const d=drawn();ok(flags(P).some(s=>d.includes(s)),'camped: your banner planted on its pole in the camp');t.breakCamp()}}
 // ---- the badges and the eye over your hero
 {const i=Math.floor(P.y/TILE)*t.MW+Math.floor(P.x/TILE),old=t.tiles[i],ba=window.bannerAt,eye=window.drawStealthEye;let asked=0,eyes=[];
  window.bannerAt=function(o){if(o===P)asked++;return ba.apply(this,arguments)};window.drawStealthEye=function(...a){eyes.push(a);return eye.apply(this,a)};
  try{t.tiles[i]=t.T_FOREST;P.tx=P.x+80;P.ty=P.y;t.drawWorld();eyes=[];const cam=G.cam,cover=t.drawTravelConcealment(cam),pace=t.drawTravelPace(cam);t.drawTravelDetection(cam);
   const a=t.marchPicked(P),u=a&&a.carrier,T1=u&&{x:t.snapV(u.x)-cam.x,y:t.snapV(u.y)+a.figure(u)[1]-cam.y},me=eyes[eyes.length-1],k=t.dprOf()/t.VS,w=t.STEALTH_EYE.player*k,h=w*2/3;
   ok(cover&&pace&&u&&/hero/.test(u.type),'in a wood, on the move: the cover and pace badges drawn ('+(u?u.type:'no hero')+' carries the army)');
   ok(me&&Math.abs(me[2]+w/2-T1.x)<.01&&me[3]+h<=T1.y+.01,'the eye watching you: centred over your hero\'s head ('+(me?me[2].toFixed(1)+','+me[3].toFixed(1):'none')+'; his head '+T1.x.toFixed(1)+','+T1.y.toFixed(1)+')');
   ok(cover.x>=me[2]+w-.01&&pace.x>=cover.x+cover.w-.01&&cover.y===pace.y&&cover.y+cover.h<=T1.y+.01,'the badges in a row right of it, the cover then the pace, over your head too ('+[cover,pace].map(r=>r.x.toFixed(1)+','+r.y.toFixed(1)).join(' / ')+')');
   ok(cover.x-T1.x<(w/2+t.TRAVEL_HIDE.gap*k)+.01&&T1.y-cover.y<40*k,'and close by your figure, not where the banner was ('+(cover.x-T1.x).toFixed(1)+' px right, '+(T1.y-cover.y).toFixed(1)+' px up)');
   ok(!asked,'nothing asks where a banner over you would stand ('+asked+')')}
  finally{t.tiles[i]=old;P.tx=null;window.bannerAt=ba;window.drawStealthEye=eye}}
 // ---- the card's tab: a lord, a band, a caravan; none for a beast or a place
 const tab=o=>/<img class="tipflag"/.test(t.tipFor(o));
 ok(tab(lord)&&tab(band)&&tab(car),'the card shows the banner tab for a lord, a band and a caravan');
 {const town=t.TOWNS[0];ok(!tab(beast)&&(!site||!tab(site))&&!tab(town),'and none for a beast, a site or a holding (they fly no banner)'+(site?'':' (no site on the map)'))}
 ok(t.tipFor(lord).startsWith(t.tipFlag(lord))&&t.tipFlag(lord)!==t.tipFlag(band)&&t.tipFlag(band)!==t.tipFlag(car),'each its own banner, the tab first on the card');
 {const n=t.TIP_FLAG.tags.size,a=t.tipFlag(lord);ok(a===t.tipFlag(lord)&&t.TIP_FLAG.tags.size===n,'each banner\'s tab made once and kept')}
 // (its picture: the banner's own pixels, cut to them, at a whole number of CSS px a pixel)
 {const s=t.bannerSprite(lord.banner(),0),q=t.opaqueBox(s),k=t.TIP_FLAG.k,m=/width="(\d+)" height="(\d+)"/.exec(t.tipFlag(lord));
  ok(Number.isInteger(k)&&k>=2&&m&&+m[1]===(q[2]-q[0]+1)*k&&+m[2]===(q[3]-q[1]+1)*k,'the tab: the banner cut to its pixels ('+(q[2]-q[0]+1)+' x '+(q[3]-q[1]+1)+'), '+k+' CSS px a pixel')}
 // ---- hovered with a mouse: the card by the pointer, the tab on its top left corner, the header clear of it
 const hover=(wx,wy)=>{G.mode='world';G.modal=false;t.drawWorld();const r=rect(cv);cv.dispatchEvent(new PointerEvent('pointermove',{clientX:r.left+(wx-G.cam.x)*r.width/t.VW,clientY:r.top+(wy-G.cam.y)*r.height/t.VH,pointerType:'mouse',bubbles:true}))};
 const card=(what)=>{const f=tip.querySelector('.tipflag'),b=tip.querySelector('b');if(!f||!b)return ok(false,what+': the tab on the card ('+(f?'tab':'no tab')+')');const R=rect(tip),F=rect(f),rg=document.createRange();rg.selectNodeContents(b);const H=rg.getClientRects()[0],k=t.TIP_FLAG.k;
  ok(F.left<R.left&&F.right>R.left&&F.top<R.top&&F.bottom>R.top,what+': the tab over the card\'s top left corner, past its top and its left edge (tab '+[F.left,F.top,F.right,F.bottom].map(Math.round)+', card '+[R.left,R.top].map(Math.round)+')');
  ok(H&&H.left>=F.right-.5,what+': the header clear of the cloth (text from '+(H?Math.round(H.left):'-')+', tab to '+Math.round(F.right)+')');
  const rest=[...tip.children].filter(e=>e!==f&&e!==b);ok(rest.every(e=>rect(e).left>=F.left+4*k-.5),what+': the lines under it clear of its pole');
  ok(getComputedStyle(f).imageRendering==='pixelated'&&Math.abs(F.width-f.width)<.01&&Math.abs(F.height-f.height)<.01,what+': crisp, never smoothed ('+getComputedStyle(f).imageRendering+', '+F.width+' x '+F.height+')')};
 {const live=A.units.filter(u=>!u.dead),u=live[live.length-1];hover(u.x,u.y-4);
  ok(!tip.hidden&&tip.innerHTML===t.tipFor(lord)&&t.pickAt(u.x,u.y-4)===lord,'the pointer on a man of his army: his card ('+(tip.hidden?'hidden':'shown')+')');card('hovered');
  const r=rect(scr),F=rect(tip.querySelector('.tipflag'));ok(F.top>=r.top-.5&&F.left>=r.left-.5,'the tab inside the screen')}
 {const s=t.MARCH_ARMIES.get(car).units.find(u=>!u.dead);hover(s.x,s.y-4);const f=tip.querySelector('.tipflag');ok(!tip.hidden&&tip.innerHTML===t.tipFor(car)&&!!f,'a caravan\'s guard hovered: the caravan\'s card, its trade pennant on it');
  hover(beast.x,beast.y-4);ok(tip.hidden||!tip.querySelector('.tipflag'),'a beast hovered: no tab');hover(home.x,home.y-8);ok(tip.hidden||!tip.querySelector('.tipflag'),'a holding hovered: no tab')}
 t.hideTip();
 // ---- the long press's card (the map ring's Look): the tab too, kept on the screen held by the top left corner
 {const items=t.mapRingItems(lord.x,lord.y,lord,300,200),look=items.find(i=>i.label==='Look');ok(!!look,'the map ring on him has Look');
  if(look){look.run();ok(!tip.hidden&&tip.classList.contains('hold')&&!!tip.querySelector('.tipflag'),'Look: the held card, his banner tab on it');card('held')}
  const r=rect(scr);t.holdCard(t.tipFor(lord),r.left+2,r.top+2);const F=rect(tip.querySelector('.tipflag'));
  ok(F.top>=r.top-.5&&F.left>=r.left-.5,'held by the screen\'s top left corner: the tab still on the screen ('+[F.left-r.left,F.top-r.top].map(Math.round)+')');t.hideTip()}
 // ---- a click on an army still picks it: on a man, on its outline; no banner to click
 {const far=A.units.filter(u=>!u.dead).map(u=>({u,d:Math.hypot(u.x-lord.x,u.y-lord.y)})).sort((p,q)=>q.d-p.d)[0].u;
  ok(t.pickAt(far.x,far.y-4)===lord,'a click on his flank man still picks him');
  {const ba=window.bannerAt;let n=0;window.bannerAt=function(){n++;return ba.apply(this,arguments)};try{t.pickAt(far.x,far.y-4);t.pickAt(lord.x,lord.y-30)}finally{window.bannerAt=ba}ok(!n,'no banner asked where a click lands: none to click ('+n+')')}
  t.drawWorld();const r=rect(cv),e={clientX:r.left+(far.x-G.cam.x)*r.width/t.VW,clientY:r.top+(far.y-4-G.cam.y)*r.height/t.VH,pointerType:'mouse',pointerId:1,isPrimary:true,bubbles:true};
  cv.dispatchEvent(new PointerEvent('pointerdown',e));window.dispatchEvent(new PointerEvent('pointerup',e));const q=t.PARTY_CLICK.last,o=t.ActionRing.now&&q&&t.ActionRing.now===q.R?q.o:null;t.ActionRing.close();
  ok(o===lord,'clicked: his ring opens')}
 {for(let i=0;i<10;i++){Object.assign(G.mouse,{x:t.VW/2+i*3,y:t.VH/2,in:true,type:'mouse'});t.wuiHover(performance.now(),.05);t.drawWorld()}ok(!ERR.length,'drawn and hovered: no errors ('+ERR.length+')')}
});
