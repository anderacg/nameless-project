'use strict';
// Under way (ui/underway.js; the owner, 2026-10-30: "staying should be more compact and use less space, at a corner of the screen;
// a panel that groups all the special actions"): under the minimap at the right edge, one line for each thing your band is doing
// that lasts, each with its way out: staying (Leave), in camp (Break), making camp (Stop), following (Stop), by road (Off),
// hurrying (Stop), your siege or raid (Open). Nothing under way, or not on the map: no panel.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,ash=t.townBy('Ashford');Kit.begin('soldier',1);Kit.clear();Kit.world();Kit.goTo(ash.x+60,ash.y+40);t.GUIDE.on=false;
 const el=()=>document.getElementById('underway'),row=k=>el()?.querySelector('[data-k="'+k+'"]'),hud=()=>{t.frame();t.updateHUD(true)},press=k=>{row(k).querySelector('button').click();hud()};
 hud();ok(!el()||el().hidden,'nothing under way: no panel');
 // ======== staying: one short line, Leave
 {P.stay={town:ash.name,paidTo:t.worldTime()+t.DAY};hud();const r=row('stay');
  ok(r&&r.textContent.includes(ash.name)&&r.querySelector('[data-act="sy-leave"]'),'staying: '+(r&&r.textContent));
  const b=r.getBoundingClientRect();ok(b.height<=40,'one line ('+Math.round(b.height)+' px high)');
  {const c=t.cv.getBoundingClientRect(),m=t.worldMiniRect(),k=c.width/t.VW,e=el().getBoundingClientRect();ok(e.top>=c.top+(m.y+m.h)*k&&Math.abs(e.right-(c.left+(m.x+m.w)*k))<2,'under the minimap, at its right edge ('+[e.top,c.top+(m.y+m.h)*k,e.right,c.left+(m.x+m.w)*k].map(Math.round)+')')}
  press('stay');ok(!P.stay&&!row('stay'),'Leave: you leave, the line goes')}
 // ======== the rest, each its line and way out
 {P.byRoad=true;t.setHurry(true);hud();ok(row('road')&&row('hurry')&&el().querySelectorAll('.uw-row').length===2,'by road and hurrying: two lines in the one panel');
  press('road');ok(!P.byRoad&&!row('road'),'By road: Off');press('hurry');ok(!G.hurry&&!row('hurry')&&el().hidden,'Hurrying: Stop; nothing left, no panel')}
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
