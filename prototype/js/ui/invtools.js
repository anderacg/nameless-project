'use strict';
/* ---------- the inventory's and the market's helpers (the owner, 2026-11-04: "add search items in inventory and shopping"; "make
   inventory more user friendly: allow drag and drop, or show a popup comparison between the equipped and the selected item").
   - Finder: a search box (findBox(key, hint)) over a list; what you type hides what does not match, as you type, with no redraw
     (each thing's words in its data-find; a category's heading hidden with all its rows); kept in G.find[key] and put back after
     every redraw (Finder.apply, called by the inventory and the town windows);
   - GearCompare: a piece against what it would replace, side by side: each one's picture, name, rarity and every stat, the
     difference marked better or worse (html(id)); with a mouse, a small box beside the bag piece the pointer is over, else
     beside the one picked (no window of its own); on a touch screen, a popup over the window when a piece is tapped (popup:
     Equip, Off hand, Close; Esc closes it);
   - SlotDrag: dragging a bag slot or a worn one onto another, with a mouse or a finger (a long press, SLOT_DRAG.hold ms, so a
     swipe still scrolls): a ghost of it follows you, the slot under it lit; let go on a slot, the inventory's own move (invMove:
     wear, take off, swap, stack). The click after a drag is swallowed ---------- */
const SLOT_DRAG={hold:260,slop:8,move:5};
const Finder={
  html(key,hint){const v=(G.find||{})[key]||'';return '<label class="find"><span class="find-ico" aria-hidden="true">⌕</span><input type="search" data-find="'+key+'" value="'+htmlText(v)+'" placeholder="'+htmlText(hint||'Search')+'" aria-label="'+htmlText(hint||'Search')+'" autocomplete="off" spellcheck="false"></label>'},
  // (what is shown: everything of its list whose words hold every word typed; a heading only if one of its rows is)
  apply(root){
    root=root||panel;
    for(const inp of root.querySelectorAll('input[data-find]')){
      const key=inp.dataset.find,v=((G.find||{})[key]||'').trim().toLowerCase(),words=v?v.split(/\s+/):[],scope=inp.closest('[data-find-scope]')||root;
      for(const e of scope.querySelectorAll('[data-find-of="'+key+'"]')){const w=(e.dataset.findWords||'').toLowerCase();e.hidden=!!words.length&&!words.every(x=>w.includes(x))}
      for(const h of scope.querySelectorAll('[data-find-head="'+key+'"]')){let n=h.nextElementSibling,any=false;while(n&&!n.hasAttribute('data-find-head')){if(n.hasAttribute('data-find-of')&&!n.hidden){any=true;break}n=n.nextElementSibling}h.hidden=!!words.length&&!any}
      const none=scope.querySelector('[data-find-none="'+key+'"]');if(none)none.hidden=!words.length||!!scope.querySelector('[data-find-of="'+key+'"]:not([hidden])');
    }
  },
  // (a thing's words: its name and its category, lower case)
  attrs(key,words){return ' data-find-of="'+key+'" data-find-words="'+htmlText(String(words).toLowerCase())+'"'},
};
panel.addEventListener('input',e=>{const inp=e.target.closest&&e.target.closest('input[data-find]');if(!inp)return;(G.find||(G.find={}))[inp.dataset.find]=inp.value;Finder.apply()});
const GearCompare={
  // (its stats: GEAR_STAT's and its skills', as rows [name, mine, its, better] where either has it)
  rows(id,cur){
    const a=ITEMS[id].m||{},b=cur?ITEMS[cur].m||{}:{},out=[],fmt=(v,u)=>v==null||v===0?'—':(u?Math.round(v*100)+u:+(+v).toFixed(1));
    for(const k of Object.keys(GEAR_STAT)){const x=b[k]||0,y=a[k]||0;if(!x&&!y)continue;const [n,u,dir]=GEAR_STAT[k],d=y-x;out.push([n,fmt(x,u),fmt(y,u),d?(dir===-1?d<0:d>0):null])}
    const sk=new Set([...Object.keys(a.sk||{}),...Object.keys(b.sk||{})]);
    for(const k of sk){const x=(b.sk||{})[k]||0,y=(a.sk||{})[k]||0;out.push([SKILLS[k].n,x||'—',y||'—',y===x?null:y>x])}
    return out;
  },
  card(id,what){const I=ITEMS[id];return '<div class="gc-item"><small>'+what+'</small>'+(id?'<span data-icon="gear:'+id+'"></span><b style="color:'+RARITY[I.r]+'">'+htmlText(I.n)+'</b><small>'+cap1(I.r)+', '+I.v+'g</small>':'<span class="gc-empty"></span><b class="muted">Nothing</b><small>an empty slot</small>')+'</div>'},
  html(id){
    const key=targetKey(id),cur=P.gear[key],rows=this.rows(id,cur);
    return '<div class="gc"><div class="gc-head">'+this.card(cur,'Equipped')+'<span class="gc-vs">vs</span>'+this.card(id,'Selected')+'</div>'+
      '<table class="gc-stats"><tbody>'+(rows.length?rows.map(([n,x,y,b])=>'<tr><td>'+x+'</td><th>'+n+'</th><td class="'+(b==null?'':b?'good':'bad')+'">'+y+(b==null?'':b?' ▲':' ▼')+'</td></tr>').join(''):'<tr><td colspan="3" class="muted">No stats to compare.</td></tr>')+'</tbody></table></div>';
  },
  // ---- a small box beside a bag piece (a mouse: the owner, 2026-11-04: "on PC a small box alongside the weapon, no new window"):
  // beside the one the pointer is over, else beside the one picked (it stays while it is picked)
  tip:null,
  at(b,k){
    const s=P.inv[+k];if(!b||!s||s.k!=='gear')return this.hide();
    if(!this.tip){this.tip=document.createElement('div');this.tip.className='gc-tip';document.body.appendChild(this.tip)}
    if(this.tip.dataset.k!==k){this.tip.innerHTML=this.html(s.id);this.tip.dataset.k=k;fillIcons(this.tip)}
    this.tip.hidden=false;const r=b.getBoundingClientRect(),w=this.tip.offsetWidth,h=this.tip.offsetHeight,x=r.right+6+w>innerWidth?r.left-6-w:r.right+6,y=Math.min(innerHeight-h-6,Math.max(6,r.top));
    this.tip.style.left=Math.max(6,x)+'px';this.tip.style.top=y+'px';
  },
  // (the picked one, if it is a bag piece and you use a mouse)
  pinned(){const k=G.invSel;if(G.mode!=='inv'||SlotDrag.ptr==='touch'||k==null||String(k).startsWith('eq:'))return null;const b=panel.querySelector('.fb-inv .slot[data-arg="'+k+'"]');return b&&b.offsetParent?b:null},
  hover(e){
    if(G.mode!=='inv'||e.pointerType==='touch'||SlotDrag.on)return this.hide();
    const b=e.target.closest&&e.target.closest('.fb-inv .invgrid .slot[data-arg]'),s=b&&P.inv[+b.dataset.arg];
    if(s&&s.k==='gear')return this.at(b,b.dataset.arg);
    this.rest();
  },
  // (back beside the picked one, or none)
  rest(){const b=this.pinned();if(b)this.at(b,b.dataset.arg);else this.hide()},
  hide(){if(this.tip){this.tip.hidden=true;this.tip.dataset.k=''}},
  // ---- a popup over the window, for a piece tapped on a touch screen: its comparison and its verbs
  popup(i){
    const s=P.inv[i];if(!s||s.k!=='gear')return;this.close();const K=itemKind(s),why=K.verb('equip').why(i),off=K.verb('off').shown(i),cur=P.gear[targetKey(s.id)];
    const el=document.createElement('div');el.className='gc-pop';el.setAttribute('role','dialog');el.setAttribute('aria-label','Compare');
    el.innerHTML='<div class="gc-card"><div class="top"><h3>Compare</h3></div>'+this.html(s.id)+(why?'<p class="bad">'+why+'</p>':'')+
      '<div class="gc-acts"><button class="btn" type="button" data-act="gc-close">Close</button>'+(off?'<button class="btn" type="button" data-act="gc-off" data-arg="'+i+'"'+(K.verb('off').why(i)?' disabled':'')+'>Off hand</button>':'')+
      '<button class="btn primary" type="button" data-act="gc-equip" data-arg="'+i+'"'+(why?' disabled':'')+'>'+(cur?'Swap':'Equip')+'</button></div></div>';
    el.addEventListener('click',e=>{if(e.target===el)this.close()});
    panel.appendChild(el);fillIcons(el);this.el=el;el.querySelector('[data-act="'+(why?'gc-close':'gc-equip')+'"]').focus({preventScroll:true});
  },
  el:null,
  open(){return !!this.el&&this.el.isConnected},
  close(){if(this.el)this.el.remove();this.el=null},
  // (Esc: closes it, while it is open: ui.js escDismiss)
  esc(){return this.open()?this.el.querySelector('[data-act="gc-close"]'):null},
};
onAct('gc-',(a,arg)=>{GearCompare.close();if(a==='gc-equip')invAct('inv-equip',arg);else if(a==='gc-off')invAct('inv-off',arg);return true});
panel.addEventListener('pointermove',e=>GearCompare.hover(e));
// (how you last pressed on the window: a touch opens a piece's comparison as a popup, inventory.js)
panel.addEventListener('pointerdown',e=>{SlotDrag.ptr=e.pointerType},true);
panel.addEventListener('pointerleave',()=>GearCompare.rest());
const SlotDrag={
  on:false,ptr:'mouse',src:null,ghost:null,over:null,timer:0,x0:0,y0:0,ate:false,
  slotAt(x,y){const e=document.elementFromPoint(x,y);return e&&e.closest&&e.closest('#panel .fb-inv .slot[data-arg]')},
  arm(b,x,y,touch){
    if(G.mode!=='inv'||!b||b.classList.contains('empty'))return;this.src=b;this.x0=x;this.y0=y;
    if(touch)this.timer=setTimeout(()=>this.start(x,y),SLOT_DRAG.hold);
  },
  start(x,y){
    const b=this.src;if(!b||!b.isConnected)return this.end();this.on=true;GearCompare.hide();clearTimeout(this.timer);
    const g=document.createElement('div');g.className='slot-ghost';const art=b.querySelector('.item-illustration'),c=b.querySelector('canvas');if(art)g.appendChild(art.cloneNode(true));else if(c){const k=document.createElement('canvas');k.width=c.width;k.height=c.height;k.getContext('2d').drawImage(c,0,0);g.appendChild(k)}
    document.body.appendChild(g);this.ghost=g;b.classList.add('dragging');this.move(x,y);
  },
  move(x,y){
    if(!this.on){if(this.src&&Math.hypot(x-this.x0,y-this.y0)>SLOT_DRAG.slop){if(this.timer){clearTimeout(this.timer);this.timer=0;this.src=null}}return}
    this.ghost.style.left=x+'px';this.ghost.style.top=y+'px';const t=this.slotAt(x,y);
    if(t!==this.over){if(this.over)this.over.classList.remove('drop-over');this.over=t&&t!==this.src?t:null;if(this.over)this.over.classList.add('drop-over')}
  },
  drop(){
    const f=this.src&&this.src.dataset.arg,t=this.over&&this.over.dataset.arg,on=this.on;this.end();
    if(!on||f==null||t==null)return false;
    const num=x=>x.startsWith('eq:')?x:+x;invMove(num(f),num(t));G.invSel=num(t);G.invArm=null;updateHUD(true);renderInv();this.ate=true;setTimeout(()=>{this.ate=false},350);return true;
  },
  end(){clearTimeout(this.timer);this.timer=0;if(this.ghost)this.ghost.remove();this.ghost=null;if(this.over)this.over.classList.remove('drop-over');if(this.src)this.src.classList.remove('dragging');this.over=null;this.src=null;this.on=false},
};
// (a mouse: pressed on a slot, moved past SLOT_DRAG.move px, a drag)
panel.addEventListener('mousedown',e=>{if(e.button!==0)return;const b=e.target.closest&&e.target.closest('.fb-inv .slot[data-arg]');if(b)SlotDrag.arm(b,e.clientX,e.clientY,false)});
addEventListener('mousemove',e=>{const D=SlotDrag;if(!D.src)return;if(!D.on&&Math.hypot(e.clientX-D.x0,e.clientY-D.y0)>SLOT_DRAG.move)D.start(e.clientX,e.clientY);else D.move(e.clientX,e.clientY)});
addEventListener('mouseup',()=>{if(SlotDrag.src)SlotDrag.drop()});
// (a finger: held still SLOT_DRAG.hold ms on a slot, a drag (the page kept from scrolling while it lasts); moved sooner, a scroll)
panel.addEventListener('touchstart',e=>{const t=e.touches[0],b=t&&e.target.closest&&e.target.closest('.fb-inv .slot[data-arg]');if(b&&e.touches.length===1)SlotDrag.arm(b,t.clientX,t.clientY,true)},{passive:true});
panel.addEventListener('touchmove',e=>{const D=SlotDrag,t=e.touches[0];if(!D.src||!t)return;D.move(t.clientX,t.clientY);if(D.on)e.preventDefault()},{passive:false});
panel.addEventListener('touchend',e=>{const D=SlotDrag;if(D.on){e.preventDefault();D.drop()}else D.end()},{passive:false});
panel.addEventListener('touchcancel',()=>SlotDrag.end());
// (the click a drag ends with does nothing)
panel.addEventListener('click',e=>{if(SlotDrag.ate&&e.target.closest&&e.target.closest('.slot')){e.stopPropagation();e.preventDefault()}},true);
/* ---------- a right click on a slot (the owner, 2026-11-04: "right click for quick actions like equip"): a small menu by the
   pointer of what that thing can do there: a piece in the bag Equip (Swap), Off hand, Drop; a worn one Unequip; a letter Read;
   any other thing Drop where it may be dropped; and Sort the bag. Drop asks once more on the menu itself. Its choices are the
   inventory's own verbs (inventory.js invAct); greyed ones say why. Closed by a choice, a click elsewhere, Esc or a scroll */
const SlotMenu={
  el:null,arm:null,
  items(k){
    const eq=String(k).startsWith('eq:'),out=[];
    if(eq){const key=k.slice(3);if(P.gear[key])out.push(['inv-unequip',key,'Unequip',invFree()?'':'Your bag is full']);return out.concat([['inv-sort',null,'Sort bag','']])}
    const s=P.inv[+k];if(!s)return [['inv-sort',null,'Sort bag','']];const K=itemKind(s);
    if(s.k==='gear'){const why=K.verb('equip').why(+k);out.push(['inv-equip',k,P.gear[targetKey(s.id)]?'Swap':'Equip',why||'']);if(K.verb('off').shown(+k))out.push(['inv-off',k,P.gear.offhand?'Swap off hand':'Off hand',K.verb('off').why(+k)||''])}
    if(s.k==='letter')out.push(['ltr-open',s.id,'Read','']);
    if(K.verb('drop')&&K.verb('drop').shown(+k))out.push(['inv-drop',k,this.arm===String(k)?'Drop for good?':'Drop','']);
    return out.concat([['inv-sort',null,'Sort bag','']]);
  },
  open(k,x,y){
    this.close(true);GearCompare.hide();const el=document.createElement('div');el.className='slot-menu';el.setAttribute('role','menu');el.dataset.k=k;
    el.innerHTML=this.items(k).map(([a,arg,l,why])=>'<button type="button" role="menuitem" class="sm-i'+(a==='inv-drop'?' danger':'')+'" data-sm="'+a+'"'+(arg!=null?' data-arg="'+arg+'"':'')+(why?' disabled title="'+htmlText(why)+'"':'')+'>'+l+'</button>').join('');
    el.addEventListener('click',e=>{const b=e.target.closest('[data-sm]');if(!b||b.disabled)return;e.stopPropagation();this.choose(b.dataset.sm,b.dataset.arg)});
    document.body.appendChild(el);this.el=el;const w=el.offsetWidth,h=el.offsetHeight;el.style.left=Math.max(4,Math.min(x,innerWidth-w-4))+'px';el.style.top=Math.max(4,Math.min(y,innerHeight-h-4))+'px';
    const f=el.querySelector('button:not([disabled])');if(f)f.focus({preventScroll:true});
  },
  choose(a,arg){
    const k=this.el&&this.el.dataset.k;
    if(a==='inv-drop'&&this.arm!==String(k)){this.arm=String(k);const r=this.el.getBoundingClientRect();this.open(k,r.left,r.top);return}
    this.close();
    if(a==='inv-drop'){G.invArm=+k;invAct('inv-drop',String(k));return}
    if(a==='ltr-open'){act('ltr-open',arg);return}
    invAct(a,arg);
  },
  close(keep){if(this.el)this.el.remove();this.el=null;if(!keep)this.arm=null},
  esc(){return this.el?this.el:null},
};
panel.addEventListener('contextmenu',e=>{const b=e.target.closest&&e.target.closest('.fb-inv .slot[data-arg]');if(!b||G.mode!=='inv')return;e.preventDefault();SlotMenu.open(b.dataset.arg,e.clientX,e.clientY)});
addEventListener('mousedown',e=>{if(SlotMenu.el&&!SlotMenu.el.contains(e.target))SlotMenu.close()},true);
addEventListener('wheel',()=>SlotMenu.close(),{passive:true});
addEventListener('keydown',e=>{if(e.key==="Escape"&&SlotMenu.el){e.stopImmediatePropagation();e.preventDefault();SlotMenu.close()}},true);
