'use strict';
// Dev mode (ui/ui.js PREFS.dev; the owner, 2026-11-14: "remove the numbers above the group, make it available for dev mode only"):
// off by default; the count over an army's banner on the map drawn only with it on; turned on and off by the developer console's
// devmode and Settings → Developer tools, and kept.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;
 t.prefSet('dev',false);ok(!t.DEV.on&&t.PREFS.dev.def===false,'dev mode is off by default');
 const band=t.asParty({kind:'bandits',troops:Array(7).fill('militia'),x:P.x+40,y:P.y,cool:99});W.parties.push(band);t.bandits.push(band);
 const counts=()=>{const said=[],txt=window.txt;window.txt=function(s,...a){said.push(String(s));return txt.call(this,s,...a)};try{t.frame()}finally{window.txt=txt}return said.filter(s=>/^\d+$/.test(s))};
 const off=counts();ok(!off.length,'no count over the band\'s banner ('+(off.join(',')||'none')+')');
 ok(/on/.test(t.DevConsole.execute('devmode on'))&&t.DEV.on,'the console\'s devmode turns it on');
 let kept=null;try{kept=localStorage.getItem('ashmark.dev')}catch(e){}ok(kept==='1','and it is kept');
 const on=counts();ok(on.includes('7'),'dev mode: the band\'s count over its banner ('+on.join(',')+')');
 t.act('dev-mode');ok(!t.DEV.on,'Settings → Developer tools: Dev mode turns it off');
 t.prefSet('dev',false)});
