'use strict';
// Clicking a town, enemy, site or wild game you already stand beside opens it at once, without walking away and back (a party:
// a click opens its ring, Approach, Follow, Look; a double click meets it at once, ui/input.js partyRing).
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
 const done=()=>{while(G.mode==='perk')t.act('perk',G.perkOffer[0])};
 t.act('begin','soldier');W.critters=[];W.lords=[];
 // (nobody else wanders by: workers, patrols, caravans and refugees come and go at random and would take the click)
 const reset=()=>{t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.town=null;G.site=null;P.tx=null;W.folk=[];W.patrols=[];W.caravans=[];W.refugees=[]};
 // a real click on the canvas, at a world position: pressed, then let go (it acts as it is let go: ui/ring.js)
 const click=(wx,wy)=>{t.drawWorld();const cv=document.querySelector('canvas'),r=cv.getBoundingClientRect(),x=r.left+(wx-G.cam.x)*r.width/t.VW,y=r.top+(wy-G.cam.y)*r.height/t.VH;
   cv.dispatchEvent(new PointerEvent('pointerdown',{clientX:x,clientY:y,pointerType:'mouse',bubbles:true}));cv.dispatchEvent(new PointerEvent('pointerup',{clientX:x,clientY:y,pointerType:'mouse',bubbles:true}))};
 // town: leave it, stay close, click it again
 const ash=t.townBy('Ashford');reset();P.x=ash.x;P.y=ash.y+12;G.lastTown=ash;t.updateWorld(.01);ok(G.mode==='world','standing at a town you just left does not reopen it by itself');
 {reset();G.lastTown=null;P.x=ash.x-8;P.y=ash.y+3;P.tx=ash.x+80;P.ty=ash.y+3;G.chase=null;t.updateWorld(.01);ok(G.mode==='world'&&P.tx!=null,'riding past a holding on your way elsewhere does not open it');
  P.tx=null;t.updateWorld(.01);ok(G.mode==='town'||G.mode==='besiege'||G.mode==='dialog','stopping at it does ('+G.mode+')');t.hidePanel();G.mode='world';G.modal=false}
 click(ash.x,ash.y);ok(G.mode==='town'&&G.town.ref===ash,'clicking it opens Ashford again');t.act('leave');done();
 // a click on a far town still just walks there
 reset();const far=t.TOWNS.find(x=>Math.hypot(x.x-P.x,x.y-P.y)>200);click(far.x,far.y);ok(G.mode==='world'&&P.tx!=null,'a far town is walked to, not opened');
 // bandits that you fled from
 reset();W.critters=[];W.monsters=[];G.encCool=4;const b={x:P.x+12,y:P.y,n:3,cool:6,t:0,a:0,kind:'bandits'};t.bandits.length=0;t.bandits.push(t.asParty(b));
 click(b.x,b.y-4);const rl=t.ActionRing.now?t.ActionRing.now.items.map(i=>i.label).join():'none',m1=G.mode;click(b.x,b.y-4);
 ok(rl==='Attack,Follow,Look'&&m1==='world'&&!t.ActionRing.now&&G.mode==='dialog'&&(G.enc&&G.enc.ref===b||G.par&&G.par.o===b),'clicking bandits you just fled opens their ring ('+rl+'), a double click re-opens the encounter (or, cornered, their offer to talk) ('+G.mode+' '+(G.enc&&G.enc.kind)+' P.tx '+P.tx+' ptr '+JSON.stringify(G.mouse)+')');t.act('flee');
 // a monster
 reset();t.bandits.length=0;const m={id:'boar',x:P.x+12,y:P.y,hx:P.x,hy:P.y,lv:1,n:2,t:0,a:0,cool:5};W.monsters=[m];click(m.x,m.y-6);ok(G.enc&&G.enc.kind==='monster','clicking a monster beside you starts the fight');t.act('flee');
 // a site you are standing on
 reset();W.monsters=[];const s=W.sites.find(x=>x.type==='shrine');s.seen=true;P.x=s.x+6;P.y=s.y;G.lastSite=s;t.updateWorld(.01);ok(G.mode==='world','standing on a site you left does not reopen it');
 click(s.x,s.y-4);ok(G.mode==='site'&&G.site===s,'clicking it opens the shrine again');t.act('site-leave');
 // a herd
 reset();const h={crit:true,id:'deer',x:P.x+10,y:P.y,hx:P.x,hy:P.y,n:3,t:0,a:0,dir:1,tire:0,cool:4};W.critters=[h];click(h.x,h.y-4);{const go=document.querySelector('#panel [data-act="hunt-start"]');// (a hunt is a world battle of your whole army, from its Hunting area window: 4b309d5)
  ok(G.mode==='dialog'&&t.WildHunt.choice&&go&&!go.disabled,'clicking wild game beside you opens its hunt at once (the Hunting area, Begin hunt ready)');t.act('hunt-back')}
 // (livestock is never clicked: it lives in its pasture, drawn with it; a click there finds what stands behind it)
 reset();const cw={crit:true,id:'cow',x:P.x+10,y:P.y,hx:P.x,hy:P.y,n:3,home:'Ashford',t:0,a:0,dir:1,tire:0,cool:4,milked:0};W.critters=[cw];click(cw.x,cw.y-4);ok(G.mode!=='herd'&&t.pickAt(cw.x,cw.y-4)!==cw,'a herd of livestock is not clicked: nothing to buy');
 // a click on something far away walks you there; you meet it only on contact
 reset();W.critters=[];const far2=t.TOWNS.find(x=>x!==ash&&Math.hypot(x.x-ash.x,x.y-ash.y)<30*t.TILE)||t.TOWNS[1];P.x=far2.x+60;P.y=far2.y;G.lastTown=null;
 // (60 px off it on open ground in plain line of it: east first, else the first way round that is)
 for(const [dx,dy] of [[60,0],[-60,0],[0,60],[0,-60],[42,42],[-42,42],[42,-42],[-42,-42]]){const x=far2.x+dx,y=far2.y+dy;if(t.tAt(Math.floor(x/t.TILE),Math.floor(y/t.TILE))===t.T_OPEN&&t.clearLine(x,y,far2.x,far2.y)){P.x=x;P.y=y;break}}
 W.patrols=[];W.caravans=[];W.refugees=[];W.folk=[];t.bandits.length=0;W.monsters=[];G.encCool=1e9;// nobody on the road to meet on the way
 click(far2.x,far2.y);ok(G.mode==='world'&&G.chase===far2&&P.tx!=null,'clicking a holding 60 away does not open it, your band walks there');
 for(let i=0;i<400&&G.mode==='world';i++)t.updateWorld(.05);ok(G.mode==='town'||G.mode==='besiege','on arrival it opens ('+G.mode+' '+(G.mode==='dialog'?document.getElementById('panel').textContent.slice(0,160):'')+')');t.hidePanel();G.mode='world';G.modal=false;G.town=null;
 reset();G.encCool=0;const b2={x:P.x+40,y:P.y,n:3,cool:0,t:0,a:0,kind:'bandits',idle:true};t.bandits.length=0;t.bandits.push(t.asParty(b2));
 // (beyond where the armies would meet: their rings touching, march.js worldBattleReach)
 b2.x=P.x+Math.max(40,t.worldBattleReach(t.asParty(b2))+15);ok(!t.clickAt(b2.x,b2.y-4)&&G.mode==='world'&&G.chase===b2,'clicking bandits out of reach ('+Math.round(b2.x-P.x)+' px) starts a chase, not a fight');
 t.frame();
 // structures answer wherever they are drawn: the centre's far corner, a house, a wall piece, but not the open ground beside
 reset();P.troops={};{const tw=t.townBy('Ashford'),c=t.lotCentre(tw),h=tw.lots.find(l=>l.k==='house'),w=tw.lots.find(l=>l.k==='wall');P.x=tw.x;P.y=tw.y+20;
  const spots=[[c.x*16+3,c.y*16+3,'the centre\u2019s back corner'],[h.x*16+8,h.y*16+8,'a house'],...(w?[[w.x*16+8,w.y*16+8,'a wall']]:[])];
  ok(spots.every(([x,y])=>t.pickAt(x,y)===tw),'clicking any of a holding\u2019s buildings picks it: '+spots.map(q=>q[2]).join(', '));
  let free=null;for(let r=1;r<12&&!free;r++)for(let i=-r;i<=r&&!free;i++){const x=tw.tx+i,y=tw.ty+r;if(!t.occAt(x,y)&&t.tAt(x,y)===t.T_OPEN)free=[x,y]}
  ok(!free||t.pickAt(free[0]*16+8,free[1]*16+8)!==tw,'but not the open ground beside them')}
 {const c=t.camps().find(k=>!k.cleared);P.x=c.x;P.y=c.y+30;t.reveal();ok(t.pickAt(c.x,c.y-12)===c&&t.pickAt(c.x+16,c.y-12)===c&&t.pickAt(c.x+16,c.y+4)===c&&t.pickAt(c.x-14,c.y-12)!==c,'clicking anywhere on a bandit camp picks it, and not beside it')}
 {const tw=t.TOWNS.find(z=>t.bldLv(z,'farm')>=2&&t.plotsAt(z,'farm',t.bldLv(z,'farm')).length>=3);if(tw){const pl=t.plotsAt(tw,'farm',t.bldLv(tw,'farm')),q=pl[pl.length-1],sp=t.bldSpots(tw).farm;P.x=sp.x;P.y=sp.y+20;
   const o=t.pickAt(q[0]*16+8,q[1]*16+8);ok(o&&o.est&&o.k==='farm'&&o.town===tw.name,'clicking the furthest field of '+tw.name+'’s farmland picks the estate')}}
 // map movers face the way they go, not toward you: a lord walking away from you shows its back, and keeps facing that way when it stops
 {const l={x:P.x+40,y:P.y};t.faceDir(l);l.x+=3;ok(t.faceDir(l)===1,'a lord walking away from you (east of you, going east) faces east');l.x-=6;ok(t.faceDir(l)===-1,'and turns when it turns back');ok(t.faceDir(l)===-1,'and keeps that way standing still');
  l.fight=true;l.dir=1;ok(t.faceDir(l)===1,'in a fight it faces its foe')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
