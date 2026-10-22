'use strict';
// A site opens only when you click or tap it (the owner, 2026-10-22), every kind alike (a bandit camp, a cave, travellers, a
// hideout, ruins, a shrine): walking past one, or stopping beside one you did not click, opens nothing; a click (or a tap) on
// one beside you opens it at once; on one further off walks your band there and opens it on arrival. Your scouts still spot
// sites as you pass, and none of them falls on you as you come: a cave's beasts or a camp's raiders fight only from its page.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;W.lords=[];
 // (nobody else about: those who come and go at random would meet you first, or take the click)
 const reset=()=>{t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.town=null;G.site=null;G.siteSpy=null;G.road=null;G.chase=null;G.lastSite=null;G.lastTown=null;G.encCool=0;P.tx=P.ty=null;P.stuck=0;
   t.bandits.length=0;W.monsters=[];W.critters=[];W.folk=[];W.patrols=[];W.caravans=[];W.refugees=[];if(W.road)W.road.on=[]};
 // a real press and let-go on the canvas at a world point: the mouse's (acts as it is let go: ui/ring.js), or a finger's
 const press=(wx,wy,kind)=>{t.drawWorld();const cv=document.querySelector('canvas'),r=cv.getBoundingClientRect(),x=r.left+(wx-G.cam.x)*r.width/t.VW,y=r.top+(wy-G.cam.y)*r.height/t.VH;
   for(const ty of ['pointerdown','pointerup'])cv.dispatchEvent(new PointerEvent(ty,{clientX:x,clientY:y,pointerId:kind==='touch'?7:1,isPrimary:true,pointerType:kind,button:0,bubbles:true,cancelable:true}))};
 const walk=n=>{for(let i=0;i<n&&G.mode==='world';i++)t.updateWorld(.05)};
 // (open ground some way off a site, in a plain line of it)
 const offAt=(s,r)=>{for(let a=0;a<16;a++){const x=s.x+Math.cos(a*Math.PI/8)*r,y=s.y+Math.sin(a*Math.PI/8)*r;if(t.tAt(Math.floor(x/t.TILE),Math.floor(y/t.TILE))===t.T_OPEN&&t.clearLine(x,y,s.x,s.y))return[x,y]}return null};
 const kinds=Object.keys(t.SITE_TYPES),one=k=>W.sites.find(s=>s.type===k&&offAt(s,50)&&offAt(s,8))||W.sites.find(s=>s.type===k);
 const ready=s=>{s.seen=true;s.cleared=false;if(s.type==='camp')s.bands=[];if(s.type==='shrine')s.back=0};
 const leave=()=>{if(G.mode==='site')t.act('site-leave');if(G.enc)t.act('flee');t.hidePanel();G.mode='world';G.modal=false};
 for(const k of kinds){const s=one(k);if(!s){o.push('INFO no '+k+' on this world');continue}ready(s);const near=offAt(s,8)||[s.x+6,s.y],far=offAt(s,50);
  // walking past it, within a few pixels, on your way elsewhere: nothing opens
  reset();P.x=near[0];P.y=near[1];P.tx=s.x+(s.x-near[0])*20;P.ty=s.y+(s.y-near[1])*20;let hit=false;for(let i=0;i<6;i++){t.updateWorld(.05);if(Math.hypot(P.x-s.x,P.y-s.y)<12)hit=true}
  ok(G.mode==='world'&&!G.site&&!G.enc,s.T.n+': walking past it'+(hit?' (within 12 px)':'')+' opens nothing');
  // stopped beside it, unclicked: nothing either
  reset();P.x=near[0];P.y=near[1];walk(10);ok(G.mode==='world'&&!G.site&&!G.enc&&!t.updateSites(),s.T.n+': stopping beside it, unclicked, opens nothing');
  // a click on it beside you: open at once
  reset();P.x=near[0];P.y=near[1];press(s.x,s.y,'mouse');ok(G.mode==='site'&&G.site===s&&!G.enc&&G.lastSite===s,s.T.n+': a click on it beside you opens it at once');leave();
  // and the one you just left stays shut as you stand by it, until you click it again
  walk(10);ok(G.mode==='world'&&G.lastSite===s,s.T.n+': the one you just left stays shut');
  if(!far){o.push('INFO '+s.T.n+': no open ground 50 px off it in a plain line, skipped the far clicks');continue}
  // a click on it from further off: your band walks there, and it opens on arrival
  reset();P.x=far[0];P.y=far[1];press(s.x,s.y,'mouse');ok(G.mode==='world'&&G.chase===s&&P.tx!=null,s.T.n+': a click on it 50 px off walks your band there');
  walk(400);ok(G.mode==='site'&&G.site===s&&!G.enc&&Math.hypot(P.x-s.x,P.y-s.y)<=t.REACH+1,s.T.n+': and it opens on arrival, its page, no fight ('+G.mode+')');leave();
  // a tap: the same
  reset();P.x=far[0];P.y=far[1];press(s.x,s.y,'touch');ok(G.mode==='world'&&G.chase===s,s.T.n+': a tap on it walks your band there');
  walk(400);ok(G.mode==='site'&&G.site===s&&!G.enc,s.T.n+': and opens it on arrival');leave();
  reset();P.x=near[0];P.y=near[1];press(s.x,s.y,'touch');ok(G.mode==='site'&&G.site===s,s.T.n+': a tap on it beside you opens it at once');leave();
  // well away, it is forgotten (G.lastSite)
  reset();G.lastSite=s;P.x=far[0];P.y=far[1];t.updateSites();ok(G.lastSite===null,s.T.n+': well away from it, the one you left is forgotten')}
 // your scouts still spot a site as you pass, and it does not open
 {const s=W.sites.find(x=>x.scoutable&&x.type!=='camp'&&offAt(x,8));if(s){reset();s.seen=false;const n=offAt(s,8);P.x=n[0];P.y=n[1];t.updateSites();
   ok(s.seen&&G.mode==='world'&&!G.site&&G.msgs.some(m=>/Your scouts spot/.test(m.t||m.m||m)),'passing it, your scouts spot the '+s.name+' (and it stays shut)')}}
 // a site you clicked opens even in the grace after a fight (G.encCool): it never fights you unasked
 {const s=one('cave');ready(s);reset();const n=offAt(s,8)||[s.x+6,s.y];P.x=n[0];P.y=n[1];G.encCool=5;t.clickAt(s.x,s.y);ok(G.mode==='site'&&G.site===s&&!G.enc,'a cave clicked in the grace after a fight opens its page; its beasts fight only from it');leave()}
}catch(e){o.push('EXC '+e.message+' '+(e.stack||''))}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
