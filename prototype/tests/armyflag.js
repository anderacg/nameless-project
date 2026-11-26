'use strict';
// Your army's flag (the owner, 2026-11-24: "Change level to army flag, add army flag customization at the start and use it everywhere
// for player faction"; data/names.js ARMY_FLAG, ui/names.js armyFlag, facDev, flagFields): a field's colour and a device, chosen on the
// New game page and in the Names window; kept as P.flag only when not the Free Banner's (so a game that keeps it saves as before);
// its colour the Free Banner's wherever yours shows, its device on every banner of yours.
Kit.suite(({ok,info})=>{const t=T,G=t.G,A=t.ARMY_FLAG;window.requestAnimationFrame=()=>0;
 // (a game with the flag left as it is: none stored, the Free Banner's gold and crown)
 Kit.begin('soldier',1);let P=t.P;
 ok(P.flag===undefined&&t.FACS.player.col===A.def.col&&P.banner().dev===A.def.dev,'a game that keeps the Free Banner\'s flag stores none (its gold, its crown)');
 // (the choices: the page's colours and devices, each device's picture its own)
 {const d=document.createElement('div');d.innerHTML=t.flagFields({col:A.cols[1][0],dev:A.devs[2][0]});const sw=d.querySelectorAll('[data-act="nm-col"]'),dv=d.querySelectorAll('[data-act="nm-dev"]');
  ok(sw.length===A.cols.length&&dv.length===A.devs.length&&d.querySelectorAll('.on').length===2,'the choices: '+sw.length+' colours, '+dv.length+' devices, the chosen two marked');
  const pics=new Set([...dv].map(b=>b.querySelector('img').getAttribute('src')));ok(pics.size===A.devs.length&&A.devs.every(([k])=>t.BANNER_DEV[k]),'each device drawn, each its own picture')}
 // (the owner, 2026-11-26: "Make flag emblem aligned and add more color options and more emblems": each device's drawn part centred,
 // on its slot of a banner and on the hung banner; the choices each a device alone on its field, not a whole flag)
 {ok(A.cols.length>=20&&A.devs.length>=20&&new Set(A.cols.map(c=>c[0])).size===A.cols.length,'more choices: '+A.cols.length+' colours, '+A.devs.length+' devices');
  const mid=(T)=>{const xs=[],ys=[];T.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.'){xs.push(x);ys.push(y)}}));return[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2]};
  const off=[];for(const [k] of A.devs){const T=t.BANNER_DEV[k],[mx,my]=mid(T),[dx,dy]=t.devFit(T,9,9);if(Math.abs(dx+mx-4)>.5||Math.abs(dy+my-4)>.5)off.push(k)
   const Q=t.BATTLE_BANNER.hang,[hx,hy]=t.devFit(T,Q.w,Q.h-1);if(Math.abs(hx+mx-(Q.w-1)/2)>.5||Math.abs(hy+my-(Q.h-2)/2)>.5)off.push(k+' hung')}
  ok(!off.length,'every device centred, in a box and on the hung banner'+(off.length?': off '+off.join(', '):''));
  const d=document.createElement('div');d.innerHTML=t.flagFields({col:A.def.col,dev:'wolf'});ok(d.querySelector('[data-arg="wolf"] img').getAttribute('src')===t.deviceUrl(A.def.col,'wolf'),'each choice a device alone on its field')}
 // (chosen on the New game page: the game's flag, everywhere yours shows)
 t.NEW_NAMES.col='#3f66c4';t.NEW_NAMES.dev='sun';Kit.begin('soldier',1);P=t.P;
 ok(P.flag&&P.flag.col==='#3f66c4'&&P.flag.dev==='sun'&&t.NEW_NAMES.col===A.def.col,'chosen on the New game page: the game\'s flag (the page\'s choice cleared for the next)');
 const b=P.banner(),want=x=>x&&x.col==='#3f66c4'&&x.dev==='sun';
 ok(want(b)&&t.FACS.player.col==='#3f66c4'&&t.facDev('player')==='sun','your band\'s banner, the Free Banner\'s colour and its device');
 ok(want(t.holdingFlag({owner:'player'},t.FACS.player.col))&&t.holdingFlag({owner:'vale'},'#000').dev==='vale','a holding of yours flies it, another realm\'s its own');
 ok(t.facFlag('player',16).includes(t.flagUrl({k:'banner',col:'#3f66c4',dev:'sun'})),'its flag in the windows (a realm\'s flag, yours)');
 // (the Names window: changed and saved; back to the Free Banner's, none stored)
 G.mode='world';G.modal=false;t.act('nm-open');t.act('nm-col','#c23b3b');t.act('nm-dev','tower');t.act('nm-save');
 ok(P.flag.col==='#c23b3b'&&P.flag.dev==='tower'&&t.FACS.player.col==='#c23b3b'&&P.banner().dev==='tower','changed in the Names window: in force at once');
 t.act('nm-open');t.act('nm-col',A.def.col);t.act('nm-dev',A.def.dev);t.act('nm-save');
 ok(P.flag===undefined&&t.FACS.player.col===A.def.col,'set back to the Free Banner\'s: none stored');
 t.act('nm-open');t.act('nm-col','#zzzzzz');t.act('nm-dev','nothing');ok(t.nameDraft.col===A.def.col&&t.nameDraft.dev===A.def.dev,'a colour or device not on the list is ignored');t.act('nm-back');
 // (a save loaded: its flag in force; another without one: the Free Banner's again)
 t.resetSession({...P,flag:{col:'#2c8c8c',dev:'key'}});ok(t.FACS.player.col==='#2c8c8c'&&t.P.banner().dev==='key','a save loaded with a flag: its flag in force');
 const plain={...t.P};delete plain.flag;t.resetSession(plain);ok(t.FACS.player.col===A.def.col&&t.P.banner().dev===A.def.dev,'a save without one: the Free Banner\'s again');
 ok(!ERR.length,'no runtime errors');
});
