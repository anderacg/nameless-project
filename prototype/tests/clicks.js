'use strict';
// Clicking a town, enemy, site or herd you already stand beside opens it at once, without walking away and back.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
 const done=()=>{while(G.mode==='perk')t.act('perk',G.perkOffer[0])};
 t.act('begin','soldier');W.critters=[];W.lords=[];
 const reset=()=>{t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.town=null;G.site=null;G.herd=null;P.tx=null};
 // a real click on the canvas, at a world position
 const click=(wx,wy)=>{t.drawWorld();const cv=document.querySelector('canvas'),r=cv.getBoundingClientRect(),x=r.left+(wx-G.cam.x)*r.width/t.VW,y=r.top+(wy-G.cam.y)*r.height/t.VH;
   cv.dispatchEvent(new PointerEvent('pointerdown',{clientX:x,clientY:y,pointerType:'mouse',bubbles:true}))};
 // town: leave it, stay close, click it again
 const ash=t.townBy('Ashford');reset();P.x=ash.x;P.y=ash.y+12;G.lastTown=ash;t.updateWorld(.01);ok(G.mode==='world','standing at a town you just left does not reopen it by itself');
 click(ash.x,ash.y);ok(G.mode==='town'&&G.town.ref===ash,'clicking it opens Ashford again');t.act('leave');done();
 // a click on a far town still just walks there
 reset();const far=t.TOWNS.find(x=>Math.hypot(x.x-P.x,x.y-P.y)>200);click(far.x,far.y);ok(G.mode==='world'&&P.tx!=null,'a far town is walked to, not opened');
 // bandits that you fled from
 reset();G.encCool=4;const b={x:P.x+12,y:P.y,n:3,cool:6,t:0,a:0,kind:'bandits'};t.bandits.length=0;t.bandits.push(b);t.bandPower(b);
 click(b.x,b.y-4);ok(G.mode==='dialog'&&G.enc&&G.enc.ref===b,'clicking bandits you just fled re-opens the encounter');t.act('flee');
 // a monster
 reset();t.bandits.length=0;const m={id:'boar',x:P.x+12,y:P.y,hx:P.x,hy:P.y,lv:1,n:2,t:0,a:0,cool:5};W.monsters=[m];click(m.x,m.y-6);ok(G.enc&&G.enc.kind==='monster','clicking a monster beside you starts the fight');t.act('flee');
 // a site you are standing on
 reset();W.monsters=[];const s=W.sites.find(x=>x.type==='shrine');s.seen=true;P.x=s.x+6;P.y=s.y;G.lastSite=s;t.updateWorld(.01);ok(G.mode==='world','standing on a site you left does not reopen it');
 click(s.x,s.y-4);ok(G.mode==='site'&&G.site===s,'clicking it opens the shrine again');t.act('site-leave');
 // a herd
 reset();const h={crit:true,id:'cow',x:P.x+10,y:P.y,hx:P.x,hy:P.y,n:3,home:'Ashford',t:0,a:0,dir:1,tire:0,cool:4,milked:0};W.critters=[h];click(h.x,h.y-4);ok(G.mode==='herd','clicking a herd beside you opens the herders');t.act('herd-leave');
 // a click on something far away walks you there; you meet it only on contact
 reset();W.critters=[];const far2=t.TOWNS.find(x=>x!==ash&&Math.hypot(x.x-ash.x,x.y-ash.y)<30*t.TILE)||t.TOWNS[1];P.x=far2.x+60;P.y=far2.y;G.lastTown=null;
 click(far2.x,far2.y);ok(G.mode==='world'&&G.chase===far2&&P.tx!=null,'clicking a holding 60 away does not open it, your band walks there');
 for(let i=0;i<400&&G.mode==='world';i++)t.updateWorld(.05);ok(G.mode==='town'||G.mode==='besiege','on arrival it opens ('+G.mode+')');t.hidePanel();G.mode='world';G.modal=false;G.town=null;
 reset();G.encCool=0;const b2={x:P.x+40,y:P.y,n:3,cool:0,t:0,a:0,kind:'bandits',idle:true};t.bandits.length=0;t.bandits.push(b2);t.bandPower(b2);
 ok(!t.clickAt(b2.x,b2.y-4)&&G.mode==='world'&&G.chase===b2,'clicking bandits 40 away starts a chase, not a fight');
 t.frame();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
