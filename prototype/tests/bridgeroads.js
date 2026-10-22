'use strict';
// Every bridge on the roads (the owner's, after play-test 3: "make sure the roads are always connected to the main bridges"): on the
// classic seed, Normal s1-s3, Large s1 and the owner's saltwell world (worldplace.js genRoads: a track from each end of a bridge no road
// takes to the nearest road on its bank, else that end a road itself, the bridge's way off it; a bridge neither end of which reaches a
// road taken up), each bridge's two ends road tiles joined over roads, bridges and fords to a holding's gate; and on the world in use
// every bridge tile (a road over water) so joined. INFO: per world, the bridges, the tracks laid to them, the ends left a stub (the
// way off a bridge onto land no road reaches: a holding's own bridge to its fields, say) and the bridges taken up.
Kit.suite(({ok,info})=>{
 const t=T,road=k=>k===t.T_ROAD||k===t.T_FORD;
 // (the tiles joined to a holding's gate over roads, bridges and fords, 4 ways and 8 (a road's diagonal step))
 const joined=(m,Hd)=>{const W=m.w,N=W*m.h,K=m.kind,R=new Uint8Array(N),q=[];for(const h of Hd)for(const i of [(h.ty+1)*W+h.tx,h.ty*W+h.tx])if(!R[i]){R[i]=1;q.push(i)}
  for(let a=0;a<q.length;a++){const i=q[a],x=i%W,y=(i-x)/W;for(let b=-1;b<=1;b++)for(let c=-1;c<=1;c++){const j=i+c+b*W;if((b||c)&&m.has(x+c,y+b)&&!R[j]&&road(K[j])){R[j]=1;q.push(j)}}}return R};
 const worlds=[['classic',t.classicSettings()],...[1,2,3].map(k=>['Normal s'+k,{preset:'normal',seed:'s'+k}]),['Large s1',{preset:'large',seed:'s1'}],['saltwell',t.parseWorldCode('ASH1-X-2V40O9HH-saltwell')]];
 for(const [name,S] of worlds){const r=t.genWorld(S),m=r.map,W=m.w,K=m.kind,st={...t.PLACE_STATS},R=joined(m,r.holdings),B=m.crossings.filter(c=>c.kind==='bridge'),bad=[],spurs=m.roads.filter(x=>!x.a).length;
  for(const c of B)for(const e of [c.i,c.j])if(!road(K[e])||!R[e])bad.push((e%W)+','+Math.floor(e/W));
  info(name+': '+B.length+' bridges, '+spurs+' tracks laid to them; ends left a stub: '+(st.stubs.join(' ')||'none')+'; bridges taken up: '+(st.dropped.join(' ')||'none'));
  ok(B.length&&!bad.length,name+': both ends of every bridge ('+B.length+') on a road joined to the holdings'+(bad.length?': not '+bad.slice(0,6).join(' '):''))}
 {const m=t.WM,W=m.w,K=m.kind,R=joined(m,t.TOWNS),bad=[];let n=0;
  for(let y=1;y<m.h-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(K[i]!==t.T_ROAD||!(K[i-1]===t.T_WATER&&K[i+1]===t.T_WATER||K[i-W]===t.T_WATER&&K[i+W]===t.T_WATER))continue;n++;if(!R[i])bad.push(x+','+y)}
  ok(n&&!bad.length,'the world in use ('+m.gen+'): every bridge tile ('+n+') joined over the roads to a holding'+(bad.length?': not '+bad.slice(0,6).join(' '):''))}
});
