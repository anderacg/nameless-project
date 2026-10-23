'use strict';
// Not a test: ?scene=title|load|save|esc-load; &w=844&h=390, &long=1 for wrapping save metadata.
Kit.suite(({ok})=>{
  const t=T,q=new URLSearchParams(location.search),scene=q.get('scene')||'title';
  window.requestAnimationFrame=()=>0;Kit.fresh();
  const size=()=>{const e=document.getElementById('screen');if(q.get('w')){e.style.width=q.get('w')+'px';e.style.height=q.get('h')+'px'}t.MainMenu.size='';t.MainMenu.frame(performance.now())};
  if(scene==='title'){t.toTitle('main');size()}
  else{
    Kit.begin('soldier',23);Kit.world();
    for(const [i,s] of t.SAVE_SLOTS.entries()){if(s==='3'||s==='5')continue;t.G.day=i+1;t.P.gold=60+i*120;t.saveGame(true,s);
      if(q.get('long')){const k=t.slotKey(s),d=JSON.parse(localStorage.getItem(k));d.world.map.settings={...d.world.map.settings,preset:'normal',seed:'blackbarrow-and-the-long-road-through-the-elderwood'};localStorage.setItem(k,JSON.stringify(d))}}
    localStorage.setItem(t.slotKey('5'),JSON.stringify({v:1}));
    if(scene==='load')t.toTitle('load');else{t.showEsc();t.act(scene==='save'?'esc-saves':'esc-loads')}
    size();if(q.get('bottom')){const list=document.querySelector('.slots');list.scrollTop=list.scrollHeight}
  }
  addEventListener('resize',size);ok(true,'menu layout '+scene);
});
