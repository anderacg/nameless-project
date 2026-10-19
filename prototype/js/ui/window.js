'use strict';
/* ---------- rail windows: a menu of places down the left (the rail), the chosen place's window beside it. The one base of every
   such screen: a town's places and your holding's buildings (townui.js), an estate met on the map (estates.js, with its workers
   and herd: folk.js, critters.js) and a site (sites.js). Each screen gives only its data; the rail's markup, the header, the
   choice, the bottom bar, the number keys, the scroll and the slim rail of a small screen (style.css 8b) are all here.
   The window keeps the frame rule (ui.js nav): its header, its content (the game's choices), and its bottom bar, Back on the
   left and the way out on the right; Esc follows that bar (escDismiss), so it steps back a window at a time.
   railWindow(o) is the panel's HTML:
     head: the rail's header, a button sending home ([act, arg]: the overview; on: that is open): its banner (fac: a realm's
       flag in its colour, or ico: an icon), name, sub (a line under it: whose, what) and your gold; back: ‹ (a step back)
     label: a small heading over the entries
     items: the entries, each {act, arg, ico (icons.js), n (its name), short (on a slim rail), st (its status, a few words),
       tone ('good', 'bad', 'gold': the status's colour), on (the chosen one), dim (nothing there yet)}; the first ten get the
       number keys 1–9 and 0 (railKey)
     title, sub: the window's header: its name, and whose it is; gold: your gold beside it
     body: its content; back, close: its bottom bar (nav)
   showRail(o, key) shows it in the panel; drawn again with the same key, the content keeps its scroll (the rail keeps its own
   while it lists the same: the same label) ---------- */
const RAIL_KEYS='1234567890';
// a realm's flag: the banner icon in its colour (none: grey), on its pole
function facFlag(f,size){const I=ICONS.banner,p={p:'#d8c08a',f:FACS[f]?FACS[f].col:'#98a0ba'};let r='';I.px.forEach((row,y)=>[...row].forEach((c,x)=>{if(p[c])r+='<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+p[c]+'"/>'}));
  return '<svg class="gico" viewBox="0 0 9 9" width="'+size+'" height="'+size+'" shape-rendering="crispEdges" aria-hidden="true">'+r+'</svg>'}
function railWindow(o){
  const h=o.head,item=(x,i)=>'<button class="rail-i'+(x.on?' on':'')+(x.dim?' dim':'')+'" type="button" data-act="'+x.act+'" data-arg="'+x.arg+'"'+(i<RAIL_KEYS.length?' data-key="'+RAIL_KEYS[i]+'"':'')+
    ' title="'+htmlText(x.n+(x.st?' · '+x.st:''))+'"'+(x.on?' aria-current="page"':'')+'><span class="ri-ico">'+icon(x.ico,18)+'</span><span class="ri-t"><b><span class="ri-n">'+x.n+'</span><span class="ri-s">'+(x.short||x.n)+'</span></b>'+
    (x.st?'<small class="'+(x.tone||'')+'">'+x.st+'</small>':'')+'</span>'+(x.tone&&x.tone!=='good'?'<i class="ri-dot '+x.tone+'"></i>':'')+(i<RAIL_KEYS.length?'<kbd>'+RAIL_KEYS[i]+'</kbd>':'')+'</button>';
  return '<nav class="rail" aria-label="'+htmlText(o.label||'Places')+'"><button class="rail-head" type="button" data-act="'+h.act[0]+'" data-arg="'+h.act[1]+'"'+(h.on?' aria-current="page"':'')+'>'+
    '<span class="rh-flag">'+(h.ico?icon(h.ico,22):facFlag(h.fac,22))+'</span><span class="rh-t"><b>'+(h.back?'‹ ':'')+h.name+'</b><small>'+h.sub+'</small><small class="gold">'+P.gold+' gold</small></span></button>'+
    (o.label?'<div class="rail-lab">'+o.label+'</div>':'')+o.items.map(item).join('')+'</nav>'+
    '<section class="rwin"><div class="top"><div class="rw-h"><h2>'+o.title+'</h2>'+(o.sub?'<span class="muted">'+o.sub+'</span>':'')+'</div>'+(o.gold?'<span class="gold rw-gold">'+icon('gold',14)+' '+P.gold+' gold</span>':'')+'</div>'+
    '<div class="rwbody">'+o.body+'</div>'+nav(o.back,o.close)+'</section>';
}
function showRail(o,key){
  const old=panel.querySelector('.rwbody'),keep=old&&panel.dataset.rail===key?old.scrollTop:0,rk=panel.querySelector('.rail'),rkeep=rk&&panel.dataset.railLab===(o.label||'')?rk.scrollTop:0;
  showPanel(railWindow(o));panel.classList.add('wide','railed');panel.dataset.rail=key;panel.dataset.railLab=o.label||'';
  const b=panel.querySelector('.rwbody');if(b)b.scrollTop=keep;const r=panel.querySelector('.rail');if(r){r.scrollTop=rkeep;const on=r.querySelector('.rail-i.on');if(on&&!rkeep)on.scrollIntoView({block:'nearest'})}
}
// (every other window is a plain one: showPanel takes the rail's classes off with the rest)
// drawn again after an action: the focus back on the button pressed (else the chosen entry, else the header)
function railFocus(a,arg){if(!panel.classList.contains('railed'))return;const b=panel.querySelector('.rwbody [data-act="'+a+'"][data-arg="'+arg+'"]:not([disabled])')||panel.querySelector('.rail-i.on')||panel.querySelector('.rail-head');if(b)b.focus({preventScroll:true})}
// a number key picks the rail's entry with that key (the window in front has a rail): true if one was there
function railKey(k){if(ov.hidden||!panel.classList.contains('railed'))return false;const b=panel.querySelector('.rail-i[data-key="'+k+'"]');if(!b)return false;act(b.dataset.act,b.dataset.arg);return true}
