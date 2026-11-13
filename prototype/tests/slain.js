'use strict';
// The Slain page (world/death.js Death.open, gfx/spirit.js Spirit; the owner, 2026-11-13: "After you die Make a cool spirit glowing and
// moving around at the center of the screen and make a choices around it to select whether to load, new character or go to the void
// (exit game)"): the spirit's stage, drawn and moving, its three ways round it; Esc still a new life; the void leaves the game.
window.RUN=()=>{const R=Kit.report(),{ok}=R,t=T,P=t.P,G=t.G,W=t.W,D=t.Death,X=t.DEATH,on0=X.on,die0=X.die,mm=[X.min,X.max],q=s=>document.querySelector(s);
 let st=null,cv=null,img0=null;
 try{Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;X.on=true;X.die=true;X.min=X.max=0;P.troops={};P.comps={};
  const m=t.asMonster({id:'wolf',n:3,lv:1,x:P.x+20,y:P.y,hx:P.x+3000,hy:P.y,cool:0,t:0,a:0});W.monsters=[m];
  t.startEncounter({kind:'monster',ref:m,lv:1,list:m.troops.slice(),allies:[],foes:[]});t.concludeEncounter(false,{},0,true,[],null,{});[X.min,X.max]=mm;t.act('cont');
  st=q('#panel [data-spirit]');cv=st&&st.querySelector('canvas');const ways=st?[...st.querySelectorAll('.spirit-way')].map(b=>b.dataset.act):[];
  ok(/<h2>Slain<\/h2>/.test(q('#panel').innerHTML)&&st&&cv&&ways.join()==='death-load,death-new,death-void','slain: the spirit\'s stage, its three ways round it ('+ways.join(', ')+')');
  const S=st.getBoundingClientRect(),B=[...st.querySelectorAll('.spirit-way')].map(b=>b.getBoundingClientRect()),inside=B.every(b=>b.left>=S.left-1&&b.right<=S.right+1&&b.top>=S.top-1&&b.bottom<=S.bottom+1);
  const apart=B.every((a,i)=>B.every((b,j)=>i===j||a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top));
  ok(inside&&apart&&B[0].right<S.left+S.width/2&&B[1].left>S.left+S.width/2&&B[2].top>S.top+S.height/2,'its ways round it: a save on the left, a new life on the right, the void below, none over another');
  const nav=q('#panel .nav [data-nav="close"]');ok(nav&&nav.dataset.act==='death-new'&&getComputedStyle(q('#panel .nav')).display==='none','the bottom bar kept for Esc (a new life), hidden');
  img0=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data.slice()}
 catch(e){R.exc(e)}
 // (a moment later: drawn, lit, and moved)
 setTimeout(()=>{try{const d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let lit=0,diff=0;for(let i=0;i<d.length;i+=4){if(d[i+2]>180&&d[i+3]>0)lit++;if(d[i]!==img0[i]||d[i+2]!==img0[i+2])diff++}
   ok(lit>20&&diff>20,'the spirit drawn and alive: '+lit+' pixels lit, '+diff+' changed since');
   const sv=t.toTitle;let to=null;window.toTitle=s=>{to=s};try{t.act('death-void')}finally{window.toTitle=sv}ok(to==='exit','the void: the game left (the farewell where the tab stays)');
   t.act('death-new');ok(!q('#panel').classList.contains('slain')&&q('#panel .nav')&&getComputedStyle(q('#panel .nav')).display!=='none','on as someone new: the next window\'s bottom bar shown again');
  }catch(e){R.exc(e)}finally{X.on=on0;X.die=die0;D.slain=null;t.Remains.list=[];t.Legacy.clear()}
  ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));R.out()},900)};
