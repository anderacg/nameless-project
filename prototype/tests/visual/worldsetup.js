'use strict';
// Not a test: the New world screen (ui/worldsetup.js) for a screenshot. Ashmark.html?gen=1&test=visual/worldsetup and
// &preset=classic|normal|large|huge|frontier|crowded, &seed=<a seed or a world code>, &adv=1 (the Advanced fold-out open),
// &scroll=<px> (the settings scrolled), &full=1 (the full preview made), &race=, &past=; &page=world: that world forged and
// the Esc menu's World page open
window.RUN=()=>{const t=T,q=new URLSearchParams(location.search);t.G.race=q.get('race')||'human';t.showTitle('new');t.act('begin','world:'+(q.get('past')||'soldier'));
  const p=q.get('preset');if(p)t.act('ws-preset',p);
  const s=q.get('seed');if(s){const i=document.getElementById('wsSeed');i.value=s;i.dispatchEvent(new Event('input',{bubbles:true}));t.wsPreview(true)}
  if(q.get('full'))t.act('ws-full');if(q.get('adv'))t.act('ws-adv');if(q.get('scroll'))document.querySelector('.ws-set').scrollTop=+q.get('scroll');
  if(q.get('page')==='world'){t.act('ws-forge');t.G.quietEvents=true;t.G.mode='world';t.G.modal=false;t.hidePanel();t.showEsc();t.act('esc-wpage')}};
