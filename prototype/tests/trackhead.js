'use strict';
// Tracks laid at an army's head (world/tracks.js trackHead, TRACKS.head; the owner, 2026-11-01: "please also change the tracks to the
// head as well"): a marched army's prints where its foremost man walks the way it goes, not its middle; off, its middle, as before.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,K=t.Tracks;Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:1e9});t.WORLD_BATTLE.on=true;t.GUIDE.on=false;G.mode='world';G.paused=false;G.speed=1;
 const h=t.townBy('Ashford');Kit.goTo(h.x+240,h.y+200);P.troops={hum_foot:24};P.comps={};P.bsta=100;t.MARCH_ARMIES.delete(P);
 const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE),keep=new Map();for(let y=ty-20;y<=ty+20;y++)for(let x=tx-10;x<=tx+40;x++)if(t.WM.has(x,y)){const i=y*t.MW+x;keep.set(i,t.tiles[i]);t.tiles[i]=t.T_OPEN}
 try{
  const walk=()=>{K.reset();t.MARCH_ARMIES.delete(P);for(let i=0;i<40;i++)t.updateWorld(1/30);const x0=P.x;P.tx=P.x+300;P.ty=P.y;for(let i=0;i<30*8&&P.x<x0+150;i++)t.updateWorld(1/30);
   // (the moment a new point is laid: compared with the army as it stands then)
   const tr=t.W.tracks.find(r=>r.k==='you'),n0=tr?tr.p.length:0;for(let i=0;i<120&&tr&&tr.p.length===n0;i++)t.updateWorld(1/30);const a=t.MARCH_ARMIES.get(P),head=Math.max(...a.units.filter(u=>!u.dead).map(u=>u.x));return{tr,lastX:tr?tr.p[tr.p.length-3]:null,head,mid:P.x}};
  const r=walk();ok(r.tr&&r.tr.p.length>=9,'(your army marches and leaves a trail: '+(r.tr?r.tr.p.length/3:0)+' points)');
  ok(r.tr&&r.lastX>r.mid+4&&Math.abs(r.lastX-r.head)<12,'its newest print at its head ('+Math.round(r.lastX-r.mid)+' px ahead of its middle; its head '+Math.round(r.head-r.mid)+')');
  t.TRACKS.head=false;let o;try{o=walk()}finally{t.TRACKS.head=true}
  ok(o.tr&&Math.abs(o.lastX-o.mid)<12,'head off: at its middle, as before ('+Math.round(o.lastX-o.mid)+' px off it)');
 }finally{for(const [i,k] of keep)t.tiles[i]=k;P.tx=null}
});
