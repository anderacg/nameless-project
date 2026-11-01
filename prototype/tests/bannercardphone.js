'use strict';
window.PHONE=true;// (run in a phone's window, 844 x 390 with touch: tests/run-tests.ps1)
// The banner on the card on a phone (tests/bannercard.js on a desktop): the long press's card (the map ring's Look: input.js
// holdCard) shows a lord's banner as a flag tab on its top left corner, crisp at the phone's density, the header clear of it, the
// tab kept on the screen wherever the card is held.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.frame();
 const scr=document.getElementById('screen'),tip=document.getElementById('tip'),rect=e=>e.getBoundingClientRect(),S=rect(scr);
 ok(innerWidth===844&&innerHeight===390,'a phone on its side ('+innerWidth+' x '+innerHeight+')');
 const lord=W.lords[0];Object.assign(lord,{inside:null,fight:null,dead:false,x:P.x+40,y:P.y});t.frame();
 const look=t.mapRingItems(lord.x,lord.y,lord,S.left+S.width/2,S.top+S.height/2).find(i=>i.label==='Look');ok(!!look,'the map ring on a lord has Look');
 const held=(what)=>{const f=tip.querySelector('.tipflag'),b=tip.querySelector('b');if(!f||!b||tip.hidden)return ok(false,what+': the held card and its tab ('+(tip.hidden?'hidden':f?'tab':'no tab')+')');
  const R=rect(tip),F=rect(f),rg=document.createRange();rg.selectNodeContents(b);const H=rg.getClientRects()[0],k=t.TIP_FLAG.k,dpr=devicePixelRatio;
  ok(getComputedStyle(tip).display!=='none'&&F.width>0&&F.left<R.left&&F.top<R.top&&F.right>R.left&&F.bottom>R.top,what+': the tab on the card\'s top left corner (tab '+[F.left,F.top,F.width,F.height].map(Math.round)+', card '+[R.left,R.top,R.width,R.height].map(Math.round)+')');
  ok(F.left>=S.left-.5&&F.top>=S.top-.5&&R.right<=S.right+.5&&R.bottom<=S.bottom+.5,what+': card and tab on the screen');
  ok(H&&H.left>=F.right-.5,what+': the header clear of the cloth');
  ok(getComputedStyle(f).imageRendering==='pixelated'&&Number.isInteger(k*dpr),what+': crisp: '+k+' CSS px a pixel, '+k*dpr+' of the screen\'s')};
 if(look){look.run();held('held over the middle')}
 t.holdCard(t.tipFor(lord),S.left+2,S.top+2);held('held by the top left corner');
 t.holdCard(t.tipFor(lord),S.right-2,S.bottom-2);held('held by the bottom right corner');t.hideTip();
 ok(!ERR.length,'no errors ('+ERR.length+')');
});
