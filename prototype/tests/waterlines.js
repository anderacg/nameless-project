'use strict';
// The water's moving lines (the owner, 2026-11-18: "The water lines sometimes float on the land", "can you expand the line or more line
// on the big river/stream?"; gfx/worldterrain.js terrainChunk's flow and shore records, terrainEnts' overlay; WORLD_WAYS.river.flow.wide):
// a streak or the shore's foam kept only where its px still shows the water it was found on (a south bank lifted over it later, or a
// face, drew land there: let go), so none sits on the land; a big river's streaks longer and in more lanes than a stream's, longer in
// its middle; what the overlay costs a frame.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,WA=t.WorldArt,FW=t.WORLD_WAYS.river.flow,ST=FW.stride||4;Kit.begin('soldier',1);Kit.clear(['critters']);Kit.world();
 const r=t.sceneRes();if(r<=1){info('scene '+r+': no fine water, lines not checked');ok(true,'nothing to check');return}
 // ---- chunks with rivers in them, painted afresh
 const recs=[];for(let cy=0;cy<WA.rows&&recs.length<14;cy++)for(let cx=(cy*3)%2;cx<WA.cols&&recs.length<14;cx+=2){const j=WA.start(cx,cy);while(!j.gen.next().done);WA.done(j);const c=j.rec;if(c.flow&&c.flow.length>ST*400)recs.push(c)}
 let kept=0,cut=0,sk=0,sc=0,bad=0,seen=0;const lw=[],ls=[];
 for(const c of recs){kept+=c.flow.length/ST;cut+=c.flowCut||0;sk+=c.shore.length/3;sc+=c.shoreCut||0;const w=c.cv.width,h=c.cv.height,Y=c.cy*t.CHUNK,X=c.cx*t.CHUNK;
  for(let k=0;k<c.flow.length;k+=ST){const fx=c.flow[k],sy=c.flow[k+1];if(c.flow[k+2]<0)continue;
   // (the ground the picture shows at that game px (rec.dep: its row) is water there (rec.wet), away from a bank's own px)
   const x=(fx/r)|0,y=(sy/r)|0;if(x<1||y<1||x>=w-1||y>=h-1)continue;const gy=c.dep[y*w+x];if(gy<Y||gy>=Y+h)continue;seen++;if(!c.wet[(gy-Y)*w+x])bad++;
   const v=c.flow[k+4]||0,len=(v&255)/10,sp=(v>>8)/20;if(len)(sp<1?lw:ls).push(len)}}
 info(recs.length+' river chunks: '+kept+' streak px kept, '+cut+' let go ('+(cut/(kept+cut)*100).toFixed(1)+'%: their px showed land); shore foam '+sk+' kept, '+sc+' let go ('+(sc/(sk+sc)*100).toFixed(1)+'%)');
 ok(recs.length>=4&&(cut>0||sc>0),'the streaks and foam a land in front drew over are let go ('+cut+' streak px, '+sc+' foam px)');
 ok(seen>500&&bad/seen<.03,'every streak kept on the water the picture shows: '+bad+' of '+seen+' read land at its game px ('+(bad/seen*100).toFixed(2)+'%, a bank\'s own px)');
 const mean=a=>a.reduce((s,v)=>s+v,0)/Math.max(1,a.length),mx=a=>a.reduce((s,v)=>Math.max(s,v),0);
 ok(lw.length>100&&ls.length>100&&mean(lw)>mean(ls)*1.4,'a big river\'s streaks longer than a stream\'s: '+mean(lw).toFixed(1)+' px against '+mean(ls).toFixed(1)+' ('+lw.length+' and '+ls.length+' px)');
 ok(mx(lw)>=FW.wide.len[1]*.9&&mx(lw)>mean(lw)+1,'longer in its middle: up to '+mx(lw).toFixed(1)+' px, '+mean(lw).toFixed(1)+' on average');
 // ---- what the overlay costs a frame, by a river
 {const c=recs.reduce((a,b)=>b.flow.length>a.flow.length?b:a);Kit.goTo(c.cx*t.CHUNK+t.CHUNK/2,c.cy*t.CHUNK+t.CHUNK/2);G.mode='world';G.modal=false;for(let i=0;i<40;i++){t.drawWorld();WA.step(60)}
  const cam={x:Math.floor(G.cam.x),y:Math.floor(G.cam.y)},ms=[];for(let i=0;i<40;i++){const a=performance.now();t.terrainEnts([],cam);ms.push(performance.now()-a)}ms.sort((a,b)=>a-b);
  info('the ground\'s overlay (grass, prints, water lines) by a big river: '+ms[20].toFixed(2)+' ms a frame, '+ms[36].toFixed(2)+' at p90');ok(ms[20]<12,'its cost a frame within budget ('+ms[20].toFixed(2)+' ms)')}
});
