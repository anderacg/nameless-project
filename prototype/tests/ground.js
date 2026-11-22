'use strict';
// One surface answer preserves fine-height units, under-deck water and inverse projection.
Kit.suite(({ok})=>{
 const t=T,A=t.WorldArt,Q=t.WorldGround,old={chunks:A.chunks,bridge:window.bridgeShift};
 try{
  const width=16,wet=new Uint8Array(width*width),lift=new Uint8Array(width*width),dep=new Int32Array(width*width),shd=new Uint8Array(width*width),i=3*width+2;
  wet[i]=1;lift[i]=8;dep[i]=11;shd[i]=1;A.chunks=new Map([[0,{cv:{width},wet,lift,dep,shd,fr:2}]]);
  window.bridgeShift=()=>[1,-2,true];
  const s=Q.at(2.25,3.5);
  ok(s.height===4&&s.wet&&s.onDeck,'fine cached height is in map pixels; water and deck remain separate');
  ok(s.drawX===3.25&&s.drawY===-2.5,'projected position includes terrain height and bridge displacement exactly once');
  const D=t.waterDepths(t.WM)[0],depth=(D<0?t.WATER.open:D)*Math.min(1,1.5/t.WATER.draw.ramp);
  ok(s.depth===depth,'depth uses the painted shoreline ramp');
  const p=t.liftGround(2.25,3.5);ok(p.x===2.25&&p.y===11.5,'inverse projection preserves the subpixel fraction');
  const out={};ok(Q.at(2.25,3.5,out)===out&&out.drawY===s.drawY,'callers can reuse a surface record');
  window.bridgeShift=()=>null;ok(!Q.at(2.25,3.5).onDeck&&Q.at(2.25,3.5).wet,'removing a bridge retains underlying water');
  ok(t.liftAt(2.25,3.5)===s.height&&t.drawnWet(2.25,3.5)===s.wet&&t.drawnDepth(2.25,3.5)===s.depth,'legacy callers share the same ground implementation');
  ok(!Q.wet(-1,3)&&Q.height(-1,3)===0&&Q.height(NaN,3)===0,'out-of-map and invalid heights retain their existing safe fallbacks');
 }finally{A.chunks=old.chunks;window.bridgeShift=old.bridge}
});
