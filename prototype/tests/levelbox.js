'use strict';
// The level up's box (gfx/render.js lvBox; the owner, 2026-11-04: "a level up button at the bottom left corner ... another left
// panel group ... like a square box and animated in blinking"): choices waiting (a level's, a tree's), a square at the bottom left,
// blinking, its count on it, the party card's badge gone; a click opens your Skills; chosen, gone; not in battle.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;document.getElementById('screen').dataset.mode='world';// (as a frame on the map marks it)
 const box=()=>document.getElementById('lgroup'),btn=()=>box().querySelector('.lvup'),shown=()=>!box().hidden&&getComputedStyle(box()).display!=='none';
 t.takeNode('oneh_third');P.lvUp=0;t.updateHUD(true);ok(box()&&!shown(),'nothing to choose: no box');
 P.lvUp=2;t.updateHUD(true);const b=btn(),r=b&&b.getBoundingClientRect();
 ok(shown()&&b&&/\+2/.test(b.textContent)&&/Level up/i.test(b.textContent),'two level choices waiting: the box, its count on it ('+(b&&b.textContent)+')');
 ok(r&&Math.abs(r.width-r.height)<2&&r.left<40&&innerHeight-r.bottom<40,'a square at the bottom left ('+(r&&[Math.round(r.left),Math.round(innerHeight-r.bottom),Math.round(r.width)+'×'+Math.round(r.height)])+')');
 ok(getComputedStyle(b).animationName==='lvup-blink','blinking');
 ok(!document.querySelector('#stats .pc-pts')&&!/\+2/.test(document.getElementById('stats').textContent),'the party card no longer carries it');
 {const L=document.getElementById('log').getBoundingClientRect();ok(L.left>=r.right-1,'the messages beside it, not under it')}
 b.click();ok(G.mode==='skills','a click opens your Skills');t.act('sk-map');
 P.lvUp=0;t.updateHUD(true);ok(!shown(),'chosen: gone');
 P.sk.lead.lv=15;t.updateHUD(true);ok(shown()&&/New skill/.test(btn().textContent),'a tree\'s milestone reached: the box too ('+btn().textContent+')');btn().click();ok(G.mode==='skills'&&G.skTab==='talents'&&/Leadership · 15/.test(document.getElementById('panel').textContent),'its click opens that tree');t.act('sk-map');t.takeNode('lead_cry');
 P.lvUp=1;t.updateHUD(true);document.getElementById('screen').dataset.mode='battle';ok(!shown(),'not in battle');document.getElementById('screen').dataset.mode='world';
 P.lvUp=0;t.updateHUD(true);Kit.clear();
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
