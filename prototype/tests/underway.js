'use strict';
// Under way (ui/underway.js; the owner, 2026-10-30: "staying should be more compact and use less space, at a corner of the screen;
// a panel that groups all the special actions"): under the minimap at the right edge, one line for each thing your band is doing
// that lasts, each with its way out: staying (Leave), in camp (Break), making camp (Stop), following (Stop), by road (Off),
// your siege or raid (Open). Nothing under way, or not on the map: no panel.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,ash=t.townBy('Ashford');Kit.begin('soldier',1);Kit.clear();Kit.world();Kit.goTo(ash.x+60,ash.y+40);t.GUIDE.on=false;
 const el=()=>document.getElementById('underway'),row=k=>el()?.querySelector('[data-k="'+k+'"]'),hud=()=>{t.frame();t.updateHUD(true)},press=k=>{row(k).querySelector('button').click();hud()};
 hud();ok(!el()||el().hidden,'nothing under way: no panel');
 // ======== staying: one short line, Leave
 {P.stay={town:ash.name,paidTo:t.worldTime()+t.DAY};hud();const r=row('stay');
  ok(r&&r.textContent.includes(ash.name)&&r.querySelector('[data-act="sy-leave"]'),'staying: '+(r&&r.textContent));
  const b=r.getBoundingClientRect();ok(b.height<=40,'one line ('+Math.round(b.height)+' px high)');
  // (the owner, 2026-11-01: "the ui is a bit off") just under the minimap's frame (UW_FRAME round its map), its edges the frame's
  {const c=t.cv.getBoundingClientRect(),m=t.worldMiniRect(),k=c.width/t.VW,f=t.UW_FRAME,e=el().getBoundingClientRect(),fb=c.top+(m.y+m.h+f)*k,fl=c.left+(m.x-f)*k,fr=c.left+(m.x+m.w+f)*k;
   ok(e.top>=fb&&e.top-fb<=8&&Math.abs(e.right-fr)<2,'just under the frame of the minimap, at its right edge ('+[e.top,fb,e.right,fr].map(Math.round)+')');
   ok(fr-fl<t.UW_MIN||Math.abs(e.left-fl)<2,'as wide as the frame: its left edge the same ('+[e.left,fl].map(Math.round)+')')}
  press('stay');ok(!P.stay&&!row('stay'),'Leave: you leave, the line goes')}
 // ======== the rest, each its line and way out
 {P.byRoad=true;hud();ok(row('road')&&el().querySelectorAll('.uw-row').length===1,'by road: its line in the panel');
  press('road');ok(!P.byRoad&&!row('road')&&el().hidden,'By road: Off; nothing left, no panel')}
 {t.pitchCamp();hud();ok(row('camp'),'in camp');press('camp');ok(!P.camp&&!row('camp'),'Break: camp struck')}
 {G.pitch={x:P.x+40,y:P.y};P.tx=P.x+40;P.ty=P.y;hud();ok(row('pitch'),'making for a camp spot');press('pitch');ok(!G.pitch&&P.tx==null,'Stop: you stay where you are')}
 {const L=W_LORD();if(L){G.follow={o:L,crumbs:[[L.x,L.y]]};hud();ok(row('follow')&&row('follow').textContent.includes(t.lordName(L)),'following '+t.lordName(L));press('follow');ok(!G.follow&&!row('follow'),'Stop: you stop following')}else ok(false,'(a lord to follow)')}
 // ======== a siege of yours: Open, its window
 {const h=t.TOWNS.find(x=>x!==ash&&t.walled(x));P.siege={town:h.name,days:1};hud();ok(row('siege')&&/day 1/.test(row('siege').textContent),'your siege: '+row('siege').textContent);
  press('siege');ok(G.mode==='besiege'&&G.bes===h,'Open: its window');t.act('sg-leave');P.siege=null;hud()}
 // ======== not on the map: none
 {P.byRoad=true;G.mode='battle';hud();ok(el().hidden,'not in battle');G.mode='world';G.modal=true;hud();ok(el().hidden,'nor under a window');G.modal=false;t.setByRoad(false);hud()}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
 function W_LORD(){return t.W.lords.find(l=>!l.dead&&!l.inside)}
});
