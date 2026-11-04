'use strict';
// Search, comparison and dragging (ui/invtools.js; the owner, 2026-11-04: "add search items in inventory and shopping"; "allow drag
// and drop, or show a popup comparison between the equipped and the selected item"): the bag's search hides what does not match
// as you type, the market's both panes and their headings; a piece against what it would replace, side by side, as a card by the
// mouse and as a popup for a tap (Equip, Esc); a slot dragged with a mouse or a finger onto another: worn, taken off, swapped.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,q=Kit.q,qa=Kit.qa;Kit.begin('soldier',29);Kit.world();Kit.clear();
 const wp=Object.keys(t.ITEMS).filter(k=>t.ITEMS[k].slot==='weapon'&&t.ITEMS[k].m&&t.ITEMS[k].m.dmg>3).slice(0,2);P.inv=P.inv.map(()=>null);for(const id of wp)t.invAdd('gear',id,1);t.invAdd('good','grain',6);t.invAdd('mat','pelt',2);
 const type=(key,v)=>{const i=q('input[data-find="'+key+'"]');i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}));return i},shown=s=>qa(s).filter(e=>!e.hidden&&e.offsetParent!==null);
 Kit.world();t.openInv();
 // ======== the bag's search
 {const name=t.ITEMS[wp[0]].n,w=name.split(' ').pop().toLowerCase();type('inv',w);const vis=shown('.invgrid .slot');
  ok(vis.length>=1&&vis.every(b=>b.getAttribute('aria-label').toLowerCase().includes(w)),'search "'+w+'": only what matches ('+vis.map(b=>b.getAttribute('aria-label')).join(', ')+'), the empty slots hidden');
  type('inv','zzzz');ok(!shown('.invgrid .slot').length&&!q('[data-find-none="inv"]').hidden,'nothing by that name: it says so');
  type('inv','trophy');ok(shown('.invgrid .slot').length===1,'by category too: "trophy", the pelts');
  t.act('inv-sort');ok(q('input[data-find="inv"]').value==='trophy'&&shown('.invgrid .slot').length===1,'kept as the window redraws');type('inv','')}
 // ======== the comparison: side by side
 {const h=t.GearCompare.html(wp[1]);const cur=P.gear.weapon;ok(/Equipped/.test(h)&&/Selected/.test(h)&&h.includes(t.ITEMS[wp[1]].n)&&(!cur||h.includes(t.ITEMS[cur].n))&&/damage/.test(h),'a piece against what it replaces: both, their stats side by side')}
 // ======== a card by the mouse
 {const i=P.inv.findIndex(x=>x&&x.id===wp[0]),b=q('.slot[data-arg="'+i+'"]'),r=b.getBoundingClientRect();b.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerType:'mouse',clientX:r.left+5,clientY:r.top+5}));
  const tip=document.querySelector('.gc-tip');ok(tip&&!tip.hidden&&tip.textContent.includes(t.ITEMS[wp[0]].n),'the mouse over a piece: its comparison by the pointer');
  q('.slot[data-arg="'+P.inv.findIndex(x=>x&&x.k==='good')+'"]').dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerType:'mouse'}));ok(tip.hidden,'over grain: none')}
 // ======== a popup for a tap
 {const i=P.inv.findIndex(x=>x&&x.id===wp[0]);t.SlotDrag.ptr='touch';t.act('inv-sel',String(i));const pop=q('.gc-pop');
  ok(pop&&/Compare/.test(pop.textContent)&&pop.querySelector('[data-act="gc-equip"]'),'a tap on a piece: the comparison as a popup, Equip on it');
  Kit.key('Escape','Escape');ok(!q('.gc-pop')&&G.mode==='inv','Esc closes it');
  t.act('inv-sel',String(i));t.act('inv-sel',String(i));q('.gc-pop [data-act="gc-equip"]').click();ok(P.gear.weapon===wp[0]&&!q('.gc-pop'),'Equip on it: worn');t.SlotDrag.ptr='mouse'}
 // ======== dragged with a mouse: onto the main hand (on a phone the bag and the equipment are pages apart: two bag slots swapped)
 if(!q('.slot[data-arg="eq:weapon"]').offsetParent){t.act('inv-sel',String(P.inv.findIndex(x=>x&&x.id===wp[1])));t.act('inv-sel',String(P.inv.findIndex(x=>x&&x.id===wp[1])));const i=P.inv.findIndex(x=>x&&x.id===wp[1]),b=q('.slot[data-arg="'+i+'"]'),e=qa('.invgrid .slot.empty')[0],to=+e.dataset.arg;b.scrollIntoView({block:'nearest'});e.scrollIntoView({block:'nearest'});const r=b.getBoundingClientRect(),s=e.getBoundingClientRect(),at=(k,x,y,el)=>(el||window).dispatchEvent(new MouseEvent(k,{bubbles:true,button:0,clientX:x,clientY:y}));
  at('mousedown',r.left+10,r.top+10,b);at('mousemove',r.left+30,r.top+30);at('mousemove',s.left+10,s.top+10);at('mouseup',s.left+10,s.top+10);ok(P.inv[to]&&P.inv[to].id===wp[1]&&!P.inv[i],'a mouse drags a piece to another bag slot: moved ('+i+' → '+to+')');t.act('inv-equip',String(to))}
 else {const i=P.inv.findIndex(x=>x&&x.id===wp[1]),b=q('.slot[data-arg="'+i+'"]'),e=q('.slot[data-arg="eq:weapon"]'),r=b.getBoundingClientRect(),s=e.getBoundingClientRect(),at=(k,x,y,el)=>(el||window).dispatchEvent(new MouseEvent(k,{bubbles:true,button:0,clientX:x,clientY:y}));
  at('mousedown',r.left+10,r.top+10,b);at('mousemove',r.left+30,r.top+30);const g=document.querySelector('.slot-ghost');at('mousemove',s.left+10,s.top+10);const lit=e.classList.contains('drop-over');at('mouseup',s.left+10,s.top+10);
  ok(g&&lit&&P.gear.weapon===wp[1]&&P.inv.some(x=>x&&x.id===wp[0])&&!document.querySelector('.slot-ghost'),'a mouse drags a piece onto the main hand: its ghost follows, the slot lit; let go, worn (the old one into the bag)')}
 // ======== dragged with a finger: a long press, then onto an empty slot of the bag
 {const vis=!!q('.slot[data-arg="eq:weapon"]').offsetParent,b=vis?q('.slot[data-arg="eq:weapon"]'):qa('.invgrid .slot:not(.empty)')[0],e=qa('.invgrid .slot.empty')[0],from=b.dataset.arg,to=+e.dataset.arg;b.scrollIntoView({block:'nearest'});e.scrollIntoView({block:'nearest'});const r=b.getBoundingClientRect(),s=e.getBoundingClientRect(),D=t.SlotDrag,was=vis?null:P.inv[+from];
  D.arm(b,r.left+5,r.top+5,true);ok(!D.on,'a finger on it: not yet (a swipe still scrolls)');D.move(r.left+6,r.top+6);D.start(r.left+6,r.top+6);D.move(s.left+10,s.top+10);D.drop();
  ok(vis?!P.gear.weapon||P.gear.weapon!==wp[1]:P.inv[to]===was&&!P.inv[+from],vis?'held, then onto the bag: taken off ('+(P.gear.weapon||'nothing worn')+')':'held, then onto another bag slot: moved')}
 // ======== the market's search
 {t.act('inv-close');const ash=t.townBy('Ashford');Kit.goHome(ash);t.enterTown(ash);t.act('tab','trade');type('trade','grain');const rows=shown('.tr .tr-row');
  ok(rows.length>=1&&rows.every(r=>/grain/i.test(r.textContent))&&shown('.tr-theirs [data-find-head]').length>=1&&shown('.tr-theirs [data-find-head]').length<qa('.tr-theirs [data-find-head]').length,'the market\'s search: both panes, only what matches, the other headings hidden');
  t.act('deal','b:grain');ok(q('input[data-find="trade"]').value==='grain'&&shown('.tr .tr-row').every(r=>/grain/i.test(r.textContent)),'kept as the window redraws');type('trade','');t.act('deal-clear');t.toWorld()}
 Kit.clear();
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
