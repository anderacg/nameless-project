'use strict';
// The action ring closes when anything else opens (ui/ring.js; the owner, 2026-10-31: it stayed open under other menus): every
// window (ui.js showPanel: the Army, the Inventory, the Journal, the full map, the Game Menu), the keys that open them, a press on
// the HUD outside it (the dock), and the map no longer yours (a battle). A press on one of its own buttons keeps it.
Kit.suite(({ok})=>{
 const t=T,G=t.G,P=t.P,q=Kit.q;window.requestAnimationFrame=()=>0;Kit.begin('soldier',4100);Kit.clear();Kit.world();t.frame();
 const ring=()=>t.ActionRing.now,scr=q('#screen').getBoundingClientRect();
 const open=()=>{Kit.world();G.esc=null;t.frame();t.ActionRing.close();return t.ringOpen(scr.left+scr.width/2,scr.top+scr.height/2,P.x+40,P.y+20)&&!!ring()&&!!q('.aring')};
 const closed=(how,what)=>{const was=open();how();ok(was&&!ring()&&!q('.aring'),what+' closes the ring (mode '+G.mode+')')};
 closed(()=>t.openChar(),'the Army window');
 closed(()=>t.openInv(),'the Inventory');
 closed(()=>t.journalKey(),'the Journal (a field book window: fieldbook.js fbShow)');
 closed(()=>t.fullMapOpen(),'the full map');
 closed(()=>t.showEsc(),'the Game Menu');
 closed(()=>t.showPanel('<div class="top"><h2>Any</h2></div>'),'any window shown (ui.js showPanel)');
 closed(()=>Kit.key('KeyC','c'),'C (the Army)');
 closed(()=>Kit.key('KeyI','i'),'I (the Inventory)');
 closed(()=>Kit.key('KeyM','m'),'M (the full map)');
 closed(()=>Kit.key('Tab','Tab'),'Tab (the Game Menu)');
 closed(()=>q('#campBtn').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,pointerType:'mouse',pointerId:3})),'a press on the dock');
 closed(()=>{G.mode='battle';t.drawMapHold()},'the map no longer yours (a battle begun), by the next frame');
 {const was=open(),b=q('.aring .ar-btn');b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,pointerType:'mouse',pointerId:3}));ok(was&&!!ring(),'a press on one of its own buttons keeps it open');t.ActionRing.close()}
 Kit.world();G.esc=null;
});
