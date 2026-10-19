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
/* a rail screen's first page (its overview), past its own description and key actions: what is in each area. RailScreen is
   the base: the areas as a short list (towns, holdings, estates). A screen type that wants a richer first page extends it and
   picks tiles(): one big tile per area, a picture over two or three lines, the whole tile opening the area (its digit in a
   corner), and the area's one action on it when it has one (sites.js SiteScreen). areas: [{act, arg, n (its name), note (a few
   words, for the list), pic (tilePic), lines (for a tile), btn ([act, arg, label, why]: its one action)}] */
class RailScreen{
  overview(areas){return areas.length?'<ul class="tnotes">'+areas.map(x=>'<li>'+x.n+(x.note?': '+x.note:'')+'.</li>').join('')+'</ul><p class="muted" style="font-size:13px">Choose on the left'+(G.mouse&&G.mouse.type==='touch'?'':' (or its number key)')+'.</p>':''}
  tiles(areas){return '<div class="rtiles'+(areas.length>4?' many':'')+'">'+areas.map((x,i)=>'<div class="rtile"><button class="rt-open" type="button" data-act="'+x.act+'" data-arg="'+x.arg+'" title="'+htmlText(x.n)+'">'+
    '<span class="rt-pic" style="background:'+(TILE_BG[x.pic]||'')+'"><img src="'+(TILE_PICS[x.pic]||'')+'" data-pk="'+htmlText(x.pic||'')+'" alt=""></span><span class="rt-t"><b>'+x.n+'</b>'+(x.lines||[]).filter(Boolean).map(l=>'<small>'+l+'</small>').join('')+'</span>'+(i<RAIL_KEYS.length?'<kbd>'+RAIL_KEYS[i]+'</kbd>':'')+'</button>'+
    (x.btn?'<div class="rt-act">'+railBtn(...x.btn)+'</div>':'')+'</div>').join('')+'</div>'}
}
const RAIL_SCREEN=new RailScreen();
/* a tile's picture: sprites (a canvas, or several side by side: a building, a site, a few people) standing on a little patch of
   their ground (env: the climate; the frame round it the same sky and ground, under a soft vignette), scaled up by a whole number, never smoothed; an icon (ico: icons.js)
   at ×4 where no sprite fits. 128 × 56 pixels, shown at ×2; cached by key (tilePic gives the key, a tile's pic) */
const TILE_PICS={},TILE_CV={},TILE_BG={},TILE_GROUND={grass:'#4a6a34',forest:'#365a2e',frost:'#aab8c4',desert:'#b8995a',swamp:'#46553a'};
function tilePic(key,mk,env){if(TILE_PICS[key]!=null)return key;let url='';
  try{const W=128,H=56,g0=TILE_GROUND[env]||TILE_GROUND.grass,cv=mkc(W,H,g=>{g.imageSmoothingEnabled=false;
      const sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#1b2133');sky.addColorStop(.62,'#2a3146');sky.addColorStop(.63,g0);sky.addColorStop(1,g0);g.fillStyle=sky;g.fillRect(0,0,W,H);
      let ss=mk();if(ss&&ss.ico){const I=ICONS[ss.ico],c=mkc(9,9,h=>I.px.forEach((row,y)=>[...row].forEach((ch,x)=>{if(I.p[ch]){h.fillStyle=I.p[ch];h.fillRect(x,y,1,1)}})));ss=[c];ss.k=4}
      ss=[].concat(ss||[]).filter(Boolean);const crop=c=>{const w=c.cw||c.width,h=c.ch||c.height;return [c,(c.width-w)>>1,c.height-h,w,h]};const cs=ss.map(c=>c.cw?crop(c):[c,0,0,c.width,c.height]);
      const tw=cs.reduce((a,c)=>a+c[3],0)+2*(cs.length-1),th=Math.max(...cs.map(c=>c[4])),k=ss.k||Math.max(1,Math.min(4,Math.floor(Math.min((H-6)/th,(W-8)/tw))));
      let x=(W-tw*k)>>1;const base=H-4;for(const [c,sx,sy,w,h] of cs){g.drawImage(c,sx,sy,w,h,x,base-h*k,w*k,h*k);x+=(w+2)*k}
      });TILE_BG[key]='linear-gradient(#1b2133,#2a3146 62%,'+g0+' 62%,'+g0+')';
    url=cv.toDataURL();TILE_CV[key]=cv}catch(e){url=''}
  TILE_PICS[key]=url;return key}
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
// a letter key (Q, W, E, R) presses the key action with that letter on the window in front: true if one was there (pressed, or
// disabled: the key is taken either way)
function railActKey(k){if(ov.hidden||!panel.classList.contains('railed'))return false;const b=panel.querySelector('.rkact[data-rk="'+k+'"]');if(!b)return false;if(!b.disabled)act(b.dataset.act,b.dataset.arg);return true}
