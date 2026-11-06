'use strict';
// A holding's walls on the map (world/townwalls.js; the owner, 2026-11-06: walls for holdings, drawn and blocking, the estates
// inside the town wall): every holding with walls is ringed a tile out round its centre, houses, estates and their fields; gates
// where roads cross it; its walls shut to every way and walker (router.js SHUT bit 4, world.js walk), so the way in is by a gate;
// raised and razed with the walls; drawn where you have seen them; the world runs on with no one standing in a wall. Off: none.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,X=t.TOWN_WALL,on0=X.on,TL=t.TILE;
 try{
  X.on=true;Kit.begin('soldier',3);Kit.world();t.Router.holdings();
  const walled=t.TOWNS.filter(z=>t.wallOf(z)>0),open=t.TOWNS.filter(z=>t.wallOf(z)===0);
  ok(walled.length&&walled.every(z=>t.TownWall.of(z))&&open.every(z=>!t.TownWall.of(z)),'a ring round every holding with walls ('+walled.length+'), none round the '+open.length+' without');
  const h=t.townBy('Ashford'),r=t.TownWall.of(h),inside=(x,y)=>x>r.x0&&x<r.x1&&y>r.y0&&y<r.y1;
  const near=h.lots.filter(l=>l.st!=='ruined'&&Math.abs(l.x+l.n/2-h.tx)<=X.reach&&Math.abs(l.y+l.n/2-h.ty)<=X.reach);
  ok(near.every(l=>inside(l.x,l.y)&&inside(l.x+l.n-1,l.y+l.n-1)),h.name+'’s ring ('+(r.x1-r.x0)+' × '+(r.y1-r.y0)+' tiles) holds its centre, houses and estates ('+near.length+' buildings)');
  ok(near.filter(l=>t.ESTATES[l.k]).length>0,'its estates among them, inside the town wall');
  ok(r.shut.every(i=>t.SHUT[i]&4)&&r.gates.every(i=>!(t.SHUT[i]&4)),'its walls shut ('+r.shut.length+' tiles), its gates open ('+r.gates.length+')');
  const roadsIn=r.gates.filter(i=>t.tiles[i]===t.T_ROAD||t.tiles[i]===t.T_FORD);ok(roadsIn.length>0,'a gate where a road crosses it');
  // (the way in: by a gate, never over a wall; a straight walk into the wall stops at it)
  {const out={x:(r.x0-6)*TL,y:(r.y0+r.y1)/2*TL},p=t.findPath(out.x,out.y,h.x,h.y+12,30);ok(p&&p.some(i=>r.gates.includes(i))&&!p.some(i=>r.shut.includes(i)),'the way in from outside ('+(p&&p.length)+' tiles): by a gate, over no wall');
   const w=r.parts.find(q=>q.k==='h'&&q.y===r.y1),o={x:(w.x+.5)*TL,y:(w.y+2.5)*TL};for(let k=0;k<80;k++)t.walk(o,0,-1,1);ok(Math.floor(o.y/TL)>w.y,'walking straight at the wall: stopped before it ('+Math.floor(o.y/TL)+' vs the wall’s row '+w.y+')')}
  // (you ride in from outside: round to a gate and up to the holding)
  {Kit.world();Kit.goTo((r.x0-5)*TL,(r.y0+r.y1)/2*TL);t.Router.holdings();const n=Kit.travel(h.x,h.y+10,6000),d=Math.hypot(P.x-h.x,P.y-h.y-10);
   ok(d<40||G.mode!=='world','riding to '+h.name+' from outside its walls: there in '+n+' steps ('+Math.round(d)+' px off, '+G.mode+')');Kit.world()}
  // (raised and razed with the walls)
  {const v=open.find(z=>z.kind==='village'&&z.lots);v.wall=1;t.Router.holdings();const rv=t.TownWall.of(v);ok(rv&&rv.shut.every(i=>t.SHUT[i]&4),'a village fortified (palisade): its ring raised and shut');
   v.wall=0;t.Router.holdings();ok(!t.TownWall.of(v)&&rv.shut.every(i=>!(t.SHUT[i]&4)||t.TOWNS.some(z=>z!==v&&t.TownWall.of(z)&&t.TownWall.of(z).shut.includes(i))),'its walls razed: the ring gone, its tiles open')}
  // (drawn: its pieces among the buildings, only where you have seen their ground)
  {Kit.goTo((r.x0+r.x1)/2*TL,(r.y1+3)*TL);t.reveal();const ents=[];t.TownWall.ents(h,ents,{x:P.x-t.VW/2,y:P.y-t.VH/2});let err=null;try{t.drawWorld()}catch(e){err=e}
   ok(ents.length>0&&!err,'drawn among the buildings ('+ents.length+' pieces in view)');const far=t.TOWNS.find(z=>t.TownWall.of(z)&&!t.TownWall.of(z).parts.some(q=>t.seenTile(q.x,q.y)));if(far){const e2=[];t.TownWall.ents(far,e2,{x:far.x-t.VW/2,y:far.y-t.VH/2});ok(!e2.length,'not where you have never seen ('+far.name+')')}}
  // (the world runs on: after two days no one stands in a wall)
  {Kit.world();const n=Kit.frames(900,.2),movers=[...t.W.lords.filter(l=>!l.dead&&!l.inside),...t.W.caravans||[],...t.bandits,...(t.W.refugees||[])];
   const stuck=movers.filter(o=>t.TownWall.at(Math.floor(o.x/TL),Math.floor(o.y/TL)));ok(!stuck.length,'after '+n+' frames of the world, none of '+movers.length+' parties stands in a wall'+(stuck.length?': '+stuck.slice(0,3).map(o=>o.name||o.kind).join(', '):''))}
  // ---- shut to its foes (the owner, 2026-11-06): besieged, its gates shut too, no way in; its besiegers camp outside a gate;
  // you, its foe, met at that gate; lifted, open again
  {Kit.world();const L=t.W.lords.find(l=>!l.dead&&l.fac!==h.owner),s0={st:L.state,tgt:L.tgt,x:L.x,y:L.y};t.Router.holdings();ok(!t.TownWall.shutTo(h),'at peace: its gates open');
   L.state='siege';L.tgt=h.name;t.Router.holdings();const cp=t.TownWall.camp(h,{x:(r.x0-8)*TL,y:h.y}),cx=Math.floor(cp.x/TL),cy=Math.floor(cp.y/TL);
   ok(t.TownWall.shutTo(h)&&r.gates.every(i=>t.SHUT[i]&4),'besieged: every gate shut ('+r.gates.length+' tiles)');
   ok(!t.findPath((r.x0-6)*TL,(r.y0+r.y1)/2*TL,h.x,h.y+12,40),'no way in while it is shut');
   ok(!(cx>=r.x0&&cx<=r.x1&&cy>=r.y0&&cy<=r.y1)&&t.findPath((r.x0-6)*TL,(r.y0+r.y1)/2*TL,cp.x,cp.y,40),'its besiegers’ camp outside a gate, reached from outside');
   const e=[];Kit.goTo(cp.x,cp.y);t.reveal();t.TownWall.ents(h,e,{x:P.x-t.VW/2,y:P.y-t.VH/2});const e0=e.length;t.HOLD_SHUT.ring.get(h).closed=false;const e1=[];t.TownWall.ents(h,e1,{x:P.x-t.VW/2,y:P.y-t.VH/2});t.HOLD_SHUT.ring.get(h).closed=true;
   ok(e0>e1.length,'its gates drawn shut, their doors across them ('+(e0-e1.length)+' in view)');
   const mp=h.meetPoint();ok(mp&&!(Math.floor(mp.x/TL)>r.x0&&Math.floor(mp.x/TL)<r.x1&&Math.floor(mp.y/TL)>r.y0&&Math.floor(mp.y/TL)<r.y1),'riding at it now: you are met before a gate, outside its walls');
   Object.assign(L,{state:s0.st,tgt:s0.tgt});t.Router.holdings();ok(!t.TownWall.shutTo(h)&&r.gates.every(i=>!(t.SHUT[i]&4)),'the siege lifted: its gates open again');
   t.Timed.of(P,'hostile').extend(h.owner,60);Kit.goTo((r.x0-4)*TL,(r.y0+r.y1)/2*TL);t.Router.holdings();ok(t.TownWall.shutTo(h),'you its foe at its walls: shut to you');
   Kit.goTo(h.x,h.y+20);t.Router.holdings();ok(!t.TownWall.shutTo(h),'but not on one already inside them (you may still get out)');t.Timed.of(P,'hostile').clear?.(h.owner);Kit.world()}
  // ---- off
  {X.on=false;t.Router.holdings();ok(!t.TownWall.of(h)&&r.shut.every(i=>!(t.SHUT[i]&4)),'off: no walls, none shut')}
 }finally{X.on=on0;t.Router.holdings()}
});
