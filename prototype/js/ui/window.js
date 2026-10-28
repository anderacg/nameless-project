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
     items: the entries, each an area of the place, as the rooms of a house: {act, arg, ico (icons.js), n (its name), short (on a
       slim rail), on (the chosen one), dim (nothing there yet), dot (something there needs you: a quest to report)}; only its
       icon and name (what is there, how many, at what price: in its window); the first ten get the number keys 1–9 and 0 (railKey)
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
    ' title="'+htmlText(x.n)+'"'+(x.on?' aria-current="page"':'')+'><span class="ri-ico">'+icon(x.ico,18)+'</span><span class="ri-t"><b><span class="ri-n">'+x.n+'</span><span class="ri-s">'+(x.short||x.n)+'</span></b></span>'+
    (x.dot?'<i class="ri-dot" aria-hidden="true"></i>':'')+(i<RAIL_KEYS.length?'<kbd>'+RAIL_KEYS[i]+'</kbd>':'')+'</button>';
  return '<nav class="rail" aria-label="'+htmlText(o.label||'Places')+'"><button class="rail-head" type="button" data-act="'+h.act[0]+'" data-arg="'+h.act[1]+'"'+(h.on?' aria-current="page"':'')+'>'+
    '<span class="rh-flag">'+(h.ico?icon(h.ico,22):facFlag(h.fac,22))+'</span><span class="rh-t"><b>'+(h.back?'‹ ':'')+h.name+'</b><small>'+h.sub+'</small><small class="gold">'+P.gold+' gold</small></span></button>'+
    (o.label?'<div class="rail-lab">'+o.label+'</div>':'')+o.items.map(item).join('')+'</nav>'+
    '<section class="rwin"><div class="top"><div class="rw-h"><h2>'+o.title+'</h2>'+(o.sub?'<span class="muted">'+o.sub+'</span>':'')+'</div>'+(o.gold?'<span class="gold rw-gold">'+icon('gold',14)+' '+P.gold+' gold</span>':'')+'</div>'+
    '<div class="rwbody">'+o.body+'</div>'+nav(o.back,o.close)+'</section>';
}
/* inside an area: its people as cards, its things (goods, buildings, fields) as rows, the same in every rail screen.
   railCard(o): one person, or a group of one kind (its count): pic (its picture: portrait(), workerPic(), personPic():
     battlehud.js) or fac (a realm's flag, for a lord), name, role (a line under it), n (how many: ×n), facts (a few words each:
     tier, cost, relation, how many; [words, tone] in the tone's colour), note (a sentence more), acts (its buttons: [act, arg,
     label, why (disabled, and why)] or ready markup), pick ([act, arg]: a click on the card itself, sel: the one picked)
   railCards(cards): them in a grid that wraps (two or three a row, one or two on a phone); railRow(title, sub, acts, own): a row;
   railBtn(act, arg, label, why): a small button */
const railBtn=(a,arg,label,why)=>'<button class="btn sm" type="button" data-act="'+a+'"'+(arg!=null?' data-arg="'+arg+'"':'')+(why?' disabled title="'+why+'"':'')+'>'+label+'</button>';
const railRow=(title,sub,acts,own)=>'<div class="row"><div class="info"><strong>'+title+'</strong>'+(sub?'<small>'+sub+'</small>':'')+'</div>'+(own!=null?'<span class="own">'+own+'</span>':'')+(acts?'<div class="acts">'+acts+'</div>':'')+'</div>';
function railCard(o){const fact=x=>Array.isArray(x)?'<span class="'+(x[1]||'')+'">'+x[0]+'</span>':'<span>'+x+'</span>',fs=(o.facts||[]).filter(Boolean),as=(o.acts||[]).filter(Boolean);
  return '<div class="rcard'+(o.sel?' sel':'')+'"'+(o.pick?' data-act="'+o.pick[0]+'" data-arg="'+o.pick[1]+'"':'')+'><div class="rc-head">'+(o.fac!==undefined?'<span class="rc-pic rc-em">'+facFlag(o.fac,24)+'</span>':'<img class="rc-pic" src="'+(o.pic||'')+'" alt="">')+
    '<div class="rc-id"><strong>'+o.name+'</strong>'+(o.role?'<small>'+o.role+'</small>':'')+'</div>'+(o.n!=null?'<b class="rc-n">×'+o.n+'</b>':'')+'</div>'+
    (fs.length?'<div class="rc-facts">'+fs.map(fact).join('')+'</div>':'')+(o.note?'<p class="rc-note">'+o.note+'</p>':'')+
    (as.length?'<div class="rc-acts">'+as.map(a=>Array.isArray(a)?railBtn(...a):a).join('')+'</div>':'')+'</div>'}
const railCards=cs=>'<div class="rcards">'+cs.filter(Boolean).map(railCard).join('')+'</div>';
/* the key actions of the whole place, on its overview (an estate's build or raid, an attack on a holding): one big button each,
   in a bar. railKeyActions(acts, note): acts, each {icon, label, facts (its cost, chance, time: a few words each), act, arg,
   why (disabled, and why: its tooltip and a small line), tip (its rules, in its tooltip)}; the first four get the letter keys
   Q, W, E, R (railActKey; the digits stay the rail's); note: a short muted line under the bar */
const RAIL_ACT_KEYS='qwer';
function railKeyActions(as,note){as=as.filter(Boolean);if(!as.length)return '';
  return '<div class="rkacts">'+as.map((a,i)=>{const k=RAIL_ACT_KEYS[i],fs=(a.facts||[]).filter(Boolean);
    return '<button class="rkact" type="button" data-act="'+a.act+'"'+(a.arg!=null?' data-arg="'+a.arg+'"':'')+(k?' data-rk="'+k+'"':'')+(a.why?' disabled':'')+' title="'+htmlText((a.tip||a.label)+(a.why?' ('+a.why+')':''))+'">'+
      '<span class="rka-ico">'+icon(a.icon,22)+'</span><span class="rka-t"><b>'+a.label+'</b>'+(fs.length?'<small>'+fs.join(' · ')+'</small>':'')+(a.why?'<small class="rka-why">'+a.why+'</small>':'')+'</span>'+(k?'<kbd>'+k.toUpperCase()+'</kbd>':'')+'</button>'}).join('')+'</div>'+
    (note?'<p class="rka-note">'+note+'</p>':'')}
/* a picker: an action that needs a choice opens a window of its own (the frame rule: its header, the list to choose from, Back
   on the left and Confirm on the right), the same in every screen. railPicker(o): title, sub, items [{id, name, sub, pic, max
   (as many as can be chosen; 1: a tick box), unit (what one is worth, for the total)}], total (the words before it: 'You get'),
   unit ('g'), sel ({id: n} to start with; none: everything), confirm [act, label]: Confirm sends act with the choice ('id:n,id:n',
   or encode(sel)), back [act, arg, label], note. railConfirm(o): the same window with nothing to choose, for what cannot be undone:
   title, sub, text, facts, confirm [act, arg, label], back. railQty(n, act): a window's ×1 / ×5 quantity toggle */
let PICK=null;
function railPicker(o){PICK={o,sel:o.sel?{...o.sel}:Object.fromEntries(o.items.map(x=>[x.id,x.max]))};pickShow()}
function pickShow(focus){
  const {o,sel}=PICK,n=x=>Math.min(x.max,Math.max(0,sel[x.id]||0)),tot=o.items.reduce((a,x)=>a+n(x)*(x.unit||0),0),cnt=o.items.reduce((a,x)=>a+n(x),0);
  const arg=o.encode?o.encode(sel):o.items.filter(x=>n(x)).map(x=>x.id+':'+n(x)).join(',');
  const row=x=>{const v=n(x);return '<div class="row pk-row'+(v?' on':'')+'">'+(x.pic?'<img class="rec-pic" src="'+x.pic+'" alt="">':'')+'<div class="info"><strong>'+x.name+'</strong>'+(x.sub?'<small>'+x.sub+'</small>':'')+'</div><div class="acts">'+
    (x.max===1?'<button class="btn sm pk-tick'+(v?' on':'')+'" type="button" data-act="pk-set" data-arg="'+x.id+':'+(v?0:1)+'" aria-pressed="'+!!v+'">'+(v?'✓ Chosen':'Choose')+'</button>':
      railBtn('pk-set',x.id+':'+(v-1),'−',v?'':'None chosen')+'<span class="pk-n" aria-live="polite">'+v+' / '+x.max+'</span>'+railBtn('pk-set',x.id+':'+(v+1),'+',v<x.max?'':'No more')+railBtn('pk-set',x.id+':'+(v<x.max?x.max:0),v<x.max?'All':'None'))+'</div></div>'};
  showPanel('<div class="top"><h2>'+o.title+'</h2>'+(o.sub?'<span class="muted">'+o.sub+'</span>':'')+'</div><div class="pk-list">'+o.items.map(row).join('')+'</div>'+
    (o.total?'<p class="pk-total">'+o.total+' <b>'+tot+(o.unit||'')+'</b> · '+cnt+' chosen</p>':'')+(o.note?'<p class="muted pk-note">'+o.note+'</p>':'')+
    nav(o.back,[o.confirm[0],arg,o.confirm[1],cnt?'':'Choose something first']));panel.classList.add('picker');
  if(focus){const b=panel.querySelector('[data-act="pk-set"][data-arg^="'+focus+':"]:not([disabled])');if(b)b.focus({preventScroll:true})}
}
onAct('pk-',(a,arg)=>{if(a!=='pk-set'||!PICK||!panel.classList.contains('picker'))return;const i=String(arg).lastIndexOf(':'),id=arg.slice(0,i),x=PICK.o.items.find(y=>String(y.id)===id);if(!x)return;
  PICK.sel[x.id]=Math.min(x.max,Math.max(0,+arg.slice(i+1)));pickShow(id)});
function railConfirm(o){PICK=null;showPanel('<div class="top"><h2>'+o.title+'</h2>'+(o.sub?'<span class="muted">'+o.sub+'</span>':'')+'</div>'+(o.text?'<p>'+o.text+'</p>':'')+
  (o.facts&&o.facts.length?'<ul class="tnotes">'+o.facts.map(f=>'<li>'+f+'</li>').join('')+'</ul>':'')+nav(o.back,o.confirm));panel.classList.add('picker','confirm')}
const railQty=(n,a)=>'<div class="qty" role="group" aria-label="How many">'+[1,5].map(k=>'<button class="btn sm'+(n===k?' on':'')+'" type="button" data-act="'+a+'" data-arg="'+k+'" aria-pressed="'+(n===k)+'">×'+k+'</button>').join('')+'</div>';
/* a rail screen's first page (its overview), past its own description and key actions: what is in each area, as a short list.
   RailScreen is the base (towns, holdings, estates, the travellers); areas: [{n (its name), note (a few words)}] */
class RailScreen{
  overview(areas){return areas.length?'<ul class="tnotes">'+areas.map(x=>'<li>'+x.n+(x.note?': '+x.note:'')+'.</li>').join('')+'</ul><p class="muted" style="font-size:13px">Choose on the left'+(G.mouse&&G.mouse.type==='touch'?'':' (or its number key)')+'.</p>':''}
}
const RAIL_SCREEN=new RailScreen();
/* a page: a place with nothing to walk between (sites.js: a shrine, ruins, a cave, a bandit camp or hideout), all of it on one
   page, no rail: its header (its icon, its name, what and where, your gold), its banner (a picture of the place only: banner()),
   the last result, what it is and what you know of it, its key actions (railKeyActions: Q W E R), and its bottom bar (Back on the
   left from a step inside it, the way out on the right). show(o, key): o {ico, title, sub, banner (its picture: pageBanner's
   spec), msg, body, acts, note (railKeyActions), back, close}; drawn again with the same key, it keeps its scroll.
   banner(b): the place as it stands on the map, its ground and what grows round it cropped from the painted world round its
   point, its own pictures stamped on (pageBanner), the width of the window at a whole scale (×4; ×2 on a small screen: style.css),
   never smoothed; no frame, no words */
class PageScreen extends RailScreen{
  banner(b){const k=pageBanner(b);return '<div class="pg-banner" role="img" aria-label="'+htmlText(b.alt||'')+'" data-pk="'+htmlText(k)+'" style="--bw:'+PAGE_BANNER.w+';--bh:'+PAGE_BANNER.h+';background-image:url('+BANNERS[k]+')"></div>'}
  show(o,key){const old=panel.querySelector('.rwbody'),keep=old&&panel.dataset.page===key?old.scrollTop:0;
    showPanel('<section class="rwin"><div class="top"><span class="rh-flag">'+icon(o.ico,22)+'</span><div class="rw-h"><h2>'+o.title+'</h2>'+(o.sub?'<span class="muted">'+o.sub+'</span>':'')+'</div><span class="gold rw-gold">'+icon('gold',14)+' '+P.gold+' gold</span></div>'+
      '<div class="rwbody">'+(o.banner?this.banner(o.banner):'')+(o.msg?'<p class="gold pg-msg">'+o.msg+'</p>':'')+(o.body||'')+railKeyActions(o.acts||[],o.note)+'</div>'+nav(o.back,o.close)+'</section>');
    panel.classList.add('wide','paged');panel.dataset.page=key;const b=panel.querySelector('.rwbody');if(b)b.scrollTop=keep}
}
const PAGE_SCREEN=new PageScreen();
// a page's line of what you know at a glance: its parts (words, or markup) side by side
const pageFacts=ps=>'<p class="pg-facts">'+ps.filter(Boolean).join(' · ')+'</p>';
/* Insight (doc/CONDUCT_RUINS_DESIGN.md §1): how much you can tell before you act, by Scouting, the same everywhere (robbing
   villagers, a camp's or a cave's page before your scouts look, a parley's odds, the ruins' checks). INSIGHT: the levels of a
   rough read and of the full picture. It decides only what is shown: the rolls are made as ever. insight(reads, more): reads
   [vague (what anyone sees), rough (a rough read), exact (numbers, kinds, power, the chance in %)], the one your Scouting
   reveals; a vague or rough one names in its tooltip the level that would tell more ('Scouting 5: know their odds');
   oddsWord(p): a chance in rough words */
const INSIGHT={rough:2,exact:5};
const insightLv=()=>{const s=skill('scout');return s>=INSIGHT.exact?2:s>=INSIGHT.rough?1:0};
function insight(reads,more){const l=insightLv();if(l===2)return reads[2];return '<span class="ins" title="Scouting '+(l?INSIGHT.exact:INSIGHT.rough)+': '+htmlText(more||'know more')+'">'+reads[l]+'</span>'}
const oddsWord=p=>p<.2?'little chance':p<.45?'some chance':p<.7?'a fair chance':'a good chance';
/* a page's banner picture: PAGE_BANNER w × h map pixels round the place's point (b.x, b.y: its foot, foot pixels from the top),
   the painted world there (WorldArt's chunks: the ground, the woods, rock and roads), then its pictures (b.ps: [canvas, x, y,
   alpha] at map pixels: its shadow, its sprite, a fire, a flag); cached by b.key (BANNERS: its picture as a data URL; BANNER_CV:
   the canvas). Off the map's edge, the night's dark */
const PAGE_BANNER={w:420,h:40,foot:35},BANNERS={},BANNER_CV={};
function pageBanner(b){const k=b.key;if(BANNERS[k]!=null)return k;let url='';
  try{const B=PAGE_BANNER,x0=Math.round(b.x-B.w/2),y0=Math.round(b.y-B.foot),W=MW*TILE,H=MH*TILE,cv=mkc(B.w,B.h,g=>{g.imageSmoothingEnabled=false;g.fillStyle='#10131c';g.fillRect(0,0,B.w,B.h);
      for(let cy=Math.max(0,Math.floor(y0/CHUNK));cy<=Math.min(WorldArt.rows-1,Math.floor((y0+B.h-1)/CHUNK));cy++)for(let cx=Math.max(0,Math.floor(x0/CHUNK));cx<=Math.min(WorldArt.cols-1,Math.floor((x0+B.w-1)/CHUNK));cx++)
        g.drawImage(WorldArt.chunk(cx,cy),cx*CHUNK-x0,cy*CHUNK-y0);
      if(x0<0||y0<0||x0+B.w>W||y0+B.h>H){g.fillStyle='#10131c';g.fillRect(0,0,-x0,B.h);g.fillRect(W-x0,0,B.w,B.h);g.fillRect(0,0,B.w,-y0);g.fillRect(0,H-y0,B.w,B.h)}
      for(const [c,px,py,al] of b.ps||[]){if(!c)continue;g.globalAlpha=al??1;g.drawImage(c,Math.round(px-x0),Math.round(py-y0))}g.globalAlpha=1});
    url=cv.toDataURL();BANNER_CV[k]=cv}catch(e){url=''}
  BANNERS[k]=url;return k}
// (the same window drawn again: changed in place, node by node (its text, attributes, rows added or gone), so what is the same is
// kept: the button under a finger, its focus, the scroll, an image not loaded again; a field you are typing in keeps its value)
function morph(a,b){
  for(const at of [...a.attributes])if(!b.hasAttribute(at.name))a.removeAttribute(at.name);
  for(const at of [...b.attributes])if(a.getAttribute(at.name)!==at.value)a.setAttribute(at.name,at.value);
  if(/^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)&&document.activeElement!==a&&a.value!==b.value)a.value=b.value;
  morphKids(a,b);
}
function morphKids(a,b){
  const ac=[...a.childNodes],bc=[...b.childNodes];
  bc.forEach((y,i)=>{const x=ac[i];if(!x)return a.appendChild(y);if(x.nodeType!==y.nodeType||x.nodeName!==y.nodeName||x.namespaceURI!==y.namespaceURI||x.nodeName==='svg'&&x.outerHTML!==y.outerHTML)return a.replaceChild(y,x);
    if(x.nodeType===1)morph(x,y);else if(x.nodeValue!==y.nodeValue)x.nodeValue=y.nodeValue});
  for(let i=ac.length-1;i>=bc.length;i--)a.removeChild(ac[i]);
}
function showRail(o,key){
  const old=panel.querySelector('.rwbody'),same=old&&!ov.hidden&&panel.classList.contains('railed')&&panel.dataset.rail===key,keep=old&&panel.dataset.rail===key?old.scrollTop:0,rk=panel.querySelector('.rail'),rkeep=rk&&panel.dataset.railLab===(o.label||'')?rk.scrollTop:0;
  if(same){const t=document.createElement('div');t.innerHTML=railWindow(o);morphKids(panel,t)}
  else showPanel(railWindow(o));panel.classList.add('wide','railed');panel.dataset.rail=key;panel.dataset.railLab=o.label||'';
  const b=panel.querySelector('.rwbody');if(b)b.scrollTop=keep;const r=panel.querySelector('.rail');if(r){r.scrollTop=rkeep;const on=r.querySelector('.rail-i.on');if(on&&!rkeep)on.scrollIntoView({block:'nearest'})}
}
// (every other window is a plain one: showPanel takes the rail's classes off with the rest)
// drawn again after an action: the focus back on the button pressed (else the chosen entry, else the header)
const railShown=()=>!ov.hidden&&(panel.classList.contains('railed')||panel.classList.contains('paged'));
function railFocus(a,arg){if(!railShown())return;const b=panel.querySelector('.rwbody [data-act="'+a+'"][data-arg="'+arg+'"]:not([disabled])')||panel.querySelector('.rail-i.on')||panel.querySelector('.rail-head');if(b)b.focus({preventScroll:true})}
// a number key picks the rail's entry with that key (the window in front has a rail): true if one was there
function railKey(k){if(ov.hidden||!panel.classList.contains('railed'))return false;const b=panel.querySelector('.rail-i[data-key="'+k+'"]');if(!b)return false;act(b.dataset.act,b.dataset.arg);return true}
// a letter key (Q, W, E, R) presses the key action with that letter on the window in front: true if one was there (pressed, or
// disabled: the key is taken either way)
function railActKey(k){if(!railShown())return false;const b=panel.querySelector('.rkact[data-rk="'+k+'"]');if(!b)return false;if(!b.disabled)act(b.dataset.act,b.dataset.arg);return true}
