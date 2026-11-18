'use strict';
// Shared window skin and real viewport layout; run with &v=1 for responsive checks.
Kit.suite(({ok})=>{
  const t=T,G=t.G;window.requestAnimationFrame=()=>0;Kit.begin('soldier',23);Kit.world();
  const check=(name,open)=>{
    t.hidePanel();G.mode='world';G.modal=false;open();t.frame();
    const p=t.panel,animation=p.style.animation;p.style.animation='none';
    try{
      const r=p.getBoundingClientRect(),o=t.ov.getBoundingClientRect();
      ok(r.left>=o.left-1&&r.top>=o.top-1&&r.right<=o.right+1&&r.bottom<=o.bottom+1,name+': frame fits the viewport');
      const clipped=[...p.querySelectorAll('.fb-scroll,.rwbody,.fb-pane,.fb-tabs,.tabs,.btns.nav')].filter(e=>e.clientWidth&&e.scrollWidth>e.clientWidth+3);
      ok(!clipped.length,name+': panes and navigation have no horizontal clipping');
      const nav=p.querySelector('.nav');ok(!!nav&&nav.getBoundingClientRect().height>0,name+': navigation remains visible');
      if(matchMedia('(pointer:coarse)').matches){
        const small=[...p.querySelectorAll('.btn')].filter(e=>e.getBoundingClientRect().height>0&&e.getBoundingClientRect().height<43);
        ok(!small.length,name+': buttons keep a 44px touch target');
      }
      const icon=p.querySelector('.gico');if(icon)ok(getComputedStyle(icon).backgroundImage==='none',name+': illustrated icon has no square background');
      ok(getComputedStyle(document.querySelector('.hudlayer')).visibility==='hidden',name+': underlying HUD controls stay hidden while the window is open');
    }finally{p.style.animation=animation;}
  };
  check('Army',()=>t.openChar());check('Inventory',()=>t.openInv());check('Skills',()=>t.openSkills('prof'));
  check('Journal',()=>t.openJournal());check('Settings',()=>t.showPanel(t.settingsPage()+t.nav(['close',null,'Back'])));
  check('Town',()=>t.enterTown(t.townBy('Ashford')));
  t.hidePanel();G.mode='world';t.updateHUD(true);t.frame();
  ok(getComputedStyle(document.querySelector('.hudlayer')).visibility!=='hidden','Closing a window restores the HUD');
});
