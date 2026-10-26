'use strict';
/* ---------- the action ring (doc/SUPPLY_DESIGN.md §7a): hold the left button, or a finger, still on the map for RING.hold ms and
   a ring of round buttons opens round the point, each an icon with its name under it, only the actions that apply (the map's:
   world/supply.js mapRingItems), in the battle's order buttons' style, with a short grow and a soft click. Pick one by letting go
   over it, or let go first and tap one; Esc, a right-click or a tap outside closes it. A press does nothing until it is let go or
   held: a short click travels (or meets what was clicked) as it is let go (the owner, 2026-10-22, mouse and touch alike).
   ActionRing takes a point (client px) and a list of {icon, label, run(), active}: the map hands it its own; the battle can hand it
   another later. active: a mode that is on now (camped, by road, hurrying), lit in the UI's gold with a soft glow (style.css
   .ar-btn.on; the owner, 2026-10-23: "active and inactive actions should look different"). The one open is ActionRing.now ---------- */
// hold: ms a press must stay still; slop: client px it may wander meanwhile; r: the ring's radius (CSS px); press: the press under way
const RING={hold:350,slop:8,r:80,progress:{delay:90,r:18,line:3},press:null};
class ActionRing{
  constructor(cx,cy,items){this.cx=cx;this.cy=cy;this.items=items;this.el=null}
  // shown over the canvas at the point (kept on the screen), the first button at the top and the rest round the clock
  open(){
    ActionRing.close();const scr=$('#screen'),r=scr.getBoundingClientRect(),n=this.items.length,R=RING.r,el=document.createElement('div');
    el.className='aring';el.setAttribute('role','menu');
    el.style.left=clamp(this.cx-r.left,R+36,Math.max(R+36,r.width-R-36))+'px';el.style.top=clamp(this.cy-r.top,R+30,Math.max(R+30,r.height-R-40))+'px';
    el.innerHTML='<i class="ar-dot"></i>'+this.items.map((it,i)=>{const a=-Math.PI/2+i*2*Math.PI/n;
      return '<button class="ar-btn'+(it.active?' on" role="menuitemcheckbox" aria-checked="true':'" role="menuitem')+'" type="button" data-ring="'+i+'" title="'+it.label+(it.active?' (on)':'')+'" style="--x:'+Math.round(Math.cos(a)*R)+'px;--y:'+Math.round(Math.sin(a)*R)+'px">'+icon(it.icon,22)+'<span>'+it.label+'</span></button>'}).join('');
    el.addEventListener('click',e=>{const b=e.target.closest('[data-ring]');if(b)this.pick(+b.dataset.ring)});
    scr.appendChild(el);this.el=el;ActionRing.now=this;uiSfx('click');return this}
  close(){if(this.el)this.el.remove();this.el=null;if(ActionRing.now===this)ActionRing.now=null}
  // one picked: the ring closes, then it is done (on the map only while the map is yours: no window opened meanwhile)
  pick(i){const it=this.items[i];this.close();if(it&&G.mode==='world'&&!G.modal)it.run()}
  // the button under a point (client px), or -1
  at(cx,cy){const b=document.elementFromPoint(cx,cy),r=b&&b.closest&&b.closest('[data-ring]');return r&&this.el&&this.el.contains(r)?+r.dataset.ring:-1}
  // the one open closed (true if there was one)
  static close(){if(!ActionRing.now)return false;ActionRing.now.close();return true}
}
ActionRing.now=null;
/* the map's press (ui/input.js): the mouse's left button; nothing happens yet. Let go before RING.hold ms, it was a click: you
   travel there or meet what is there (input.js worldGo, at the point pressed); held still RING.hold ms, the ring opens there with
   the map's actions and waits for a choice. A move beyond RING.slop first (off) means no ring, and letting go still travels. A
   finger's press goes the same way (input.js touchDown, touchTick, touchUp) */
function ringPress(e,wx,wy){ringDrop();if(G.mode!=='world'||G.modal)return;
  RING.press={id:e.pointerId,cx:e.clientX,cy:e.clientY,wx,wy,t0:performance.now(),off:false,timer:setTimeout(ringHeld,RING.hold)}}
function ringDrop(){const p=RING.press;if(p)clearTimeout(p.timer);RING.press=null}
// (held: the ring opens and the press is spent; nothing to do there, or the map not yours now, the press waits to be let go)
function ringHeld(){const p=RING.press;if(!p||p.off)return false;p.off=true;if(G.mode!=='world'||G.modal||!ringOpen(p.cx,p.cy,p.wx,p.wy))return false;RING.press=null;return true}
// the ring at a point (client px) over the map point (wx, wy), with what applies there (on whatever is there, or the ground)
function ringOpen(cx,cy,wx,wy){if(WildHunt.armed)return WildHunt.preview(wx,wy);const items=mapRingItems(wx,wy,pickAt(wx,wy),cx,cy);if(!items.length)return false;new ActionRing(cx,cy,items).open();return true}
function ringMove(e){const p=RING.press;if(p&&!p.off&&e.pointerId===p.id&&Math.hypot(e.clientX-p.cx,e.clientY-p.cy)>RING.slop){p.off=true;clearTimeout(p.timer)}}
// let go: a press still waiting was a click, and you travel (true); else over a button of the open ring, it is picked (true)
function ringUp(e){const p=RING.press;ringDrop();if(p){if(G.mode==='world'&&!G.modal)worldGo(p.wx,p.wy);return true}const R=ActionRing.now;if(!R)return false;const i=R.at(e.clientX,e.clientY);if(i<0)return false;R.pick(i);return true}
// a press on the canvas with the ring open (a tap outside it, a right-click) closes it, and does nothing else (true)
function ringTapOut(){return ActionRing.close()}

// A map hold fills clockwise in CSS pixels, over the finished frame: mouse, pen and touch use their real hold timer.
// Quick clicks stay quiet; release, movement, an opened ring or another window leaves nothing to draw.
function drawMapHold(now=performance.now()){
  if(G.mode!=='world'||G.modal)return false;
  const p=RING.press||(typeof TOUCH!=='undefined'&&TOUCH.lp?.mode==='world'?TOUCH.lp:null),H=RING.progress;
  if(!p||p.off||p.armed||now-p.t0<H.delay)return false;
  const r=cv.getBoundingClientRect();if(!r.width||!r.height)return false;
  const x=p.cx-r.left,y=p.cy-r.top,R=p.mode==='world'?TOUCH.ring:H.r,f=clamp((now-p.t0)/RING.hold,0,1),a=-Math.PI/2;
  ctx.save();try{ctx.setTransform(cv.width/r.width,0,0,cv.height/r.height,0,0);ctx.lineCap='round';
    ctx.lineWidth=H.line+3;ctx.strokeStyle='rgba(12,9,7,.75)';ctx.beginPath();ctx.arc(x,y,R,0,Math.PI*2);ctx.stroke();
    ctx.lineWidth=H.line;ctx.strokeStyle='rgba(232,185,74,.25)';ctx.stroke();
    ctx.strokeStyle='#e8b94a';ctx.beginPath();ctx.arc(x,y,R,a,a+f*Math.PI*2);ctx.stroke();
  }finally{ctx.restore()}return true;
}
