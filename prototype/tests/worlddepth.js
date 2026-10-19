'use strict';
// World depth (doc/WORLD_DESIGN.md §12.5, gfx/depth.js): what stands in front of a figure on the map is drawn again over it. The
// chunks' standing index (engine/worldnature.js standIndex, WorldArt.standing) and the structures' pictures give what stands; each
// figure, once drawn, has the kept scene's pixels put back over it where something whose foot is lower stands. A party behind a
// tree is under its crown; every figure in your sight shows through at WDEPTH.fade, fading there smoothly (yours,
// an enemy's, a beast's alike); one in front has nothing over it; banners and labels stay on top; nothing outside your sight changes (the fog);
// the index is the same after the map is painted afresh. The structures' shadows are their own pictures, laid in one pass as
// one mask (two never darken each other). Each case compares the frame with the depth on, off (WDEPTH.on: figures over all, as
// before) and without the figure (the scene), at one held clock (performance.now), so only the depth differs.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),t=T,G=t.G,P=t.P,W=t.W,pn=performance.now,r0=Math.random;let now=1e7;
try{
 try{localStorage.clear()}catch(e){}
 Math.random=t.seeded(11);t.act('begin','soldier');G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();G.encCool=1e9;G.clock=t.DAY*.3;P.troops={hum_spear:14,hum_bow:6};
 performance.now=()=>now;
 const D=t.WDEPTH,WA=t.WorldArt,TILE=t.TILE,MW=t.MW,MH=t.MH,VW=t.VW,VH=t.VH,tAt=(x,y)=>t.tiles[y*MW+x];
 const park=()=>{for(const q of [...W.lords,...t.bandits,...W.monsters,...W.critters,...(W.patrols||[])]){q.x=-999;q.y=-999}W.folk=[];W.caravans=[];W.refugees=[];W.ships=[];W.fights=[];P.stay=null;P.tx=P.ty=null;G.chase=null};
 // (the fades settled: frames 50 ms apart; then frames at one clock: no fade moves, nothing animates)
 const settle=()=>{D.on=true;D.al.clear();D.cov.clear();D.t=0;for(let i=0;i<12;i++){now+=50;t.drawWorld()}};
 const grab=on=>{D.on=on;t.drawWorld();D.on=true;return t.ctx.getImageData(0,0,VW,VH).data};
 const same=(a,b,i)=>a[i]===b[i]&&a[i+1]===b[i+1]&&a[i+2]===b[i+2];
 // (what stands in front of feet fy within a canvas box, from the index: a set of canvas pixels)
 const front=(box,fy)=>{const c=G.cam,m=new Set(),[x0,y0,x1,y1]=box;for(const e of WA.standing(x0+c.x,y0+c.y,x1+c.x,y1+c.y)){if(e.y<=fy)continue;const b=e.box;
   for(let y=Math.max(b[1],y0+c.y);y<=Math.min(b[3],y1+c.y);y++)for(let x=Math.max(b[0],x0+c.x);x<=Math.min(b[2],x1+c.x);x++){if(e.s&&!e.s.a[(y-e.dy)*e.s.width+x-e.dx])continue;m.add((y-c.y)*VW+x-c.x)}}return m};
 const behind=(box,fy)=>WA.standing(box[0]+G.cam.x,box[1]+G.cam.y,box[2]+G.cam.x,box[3]+G.cam.y).filter(e=>e.y<=fy).length;
 // a figure's pixels: on, off, the scene without it (hide/show it); in its box, those it drew (off differs from the scene)
 // (less its banner's pixels, drawn over all after: checked on their own)
 const flag=q=>{const B=t.bannerAt(q,Math.floor(now/420+q.x*.13)%2),m=new Set();if(!B)return m;const d=B.s.getContext('2d').getImageData(0,0,B.s.width,B.s.height).data;
   for(let j=0;j<B.s.height;j++)for(let k=0;k<B.s.width;k++)if(d[(j*B.s.width+k)*4+3])m.add((B.y-G.cam.y+j)*VW+B.x-G.cam.x+k);return m};
 const look=(q,fy,hide,show)=>{settle();const on=grab(true),box=D.boxes.find(b=>b[4]===fy),off=grab(false),fl=flag(q);hide();const z=grab(true);show();if(!box)return null;
   const px=[];for(let y=box[1];y<=box[3];y++)for(let x=box[0];x<=box[2];x++){const i=(y*VW+x)*4;if(!same(off,z,i)&&!fl.has(y*VW+x))px.push(y*VW+x)}return{on,off,z,box,px}};
 const F=D.fade,near=(a,b,c,i)=>{for(let k=0;k<3;k++)if(Math.abs(a[i+k]-Math.round(F*c[i+k]+(1-F)*b[i+k]))>3)return false;return true};// (on ≈ fade × scene + the rest figure)
 const deep=[];for(let y=4;y<MH-4;y++)for(let x=4;x<MW-4;x++){let f=true;for(let b=-2;b<=2&&f;b++)for(let a=-3;a<=3;a++)if(tAt(x+a,y+b)!==t.T_FOREST){f=false;break}if(f)deep.push([x,y])}
 let edge=null;for(let y=6;y<MH-6&&!edge;y++)for(let x=6;x<MW-6;x++)if([[0,0],[0,-1],[-1,0],[1,0],[-1,-1],[1,-1]].every(([a,b])=>tAt(x+a,y+b)===t.T_FOREST)&&[[0,1],[0,2],[-1,1],[1,1],[2,1],[3,1],[3,2],[2,2]].every(([a,b])=>tAt(x+a,y+b)===t.T_OPEN)){edge=[x,y];break}
 ok(deep.length>20&&edge,'a deep wood ('+deep.length+' tiles 7 x 5 deep) and a wood\'s south edge onto open ground ('+edge+') to stand in');
 // ---- the index: the same after the map is painted afresh; sorted by foot; small
 {const cap0=WA.cap;WA.cap=WA.cols*WA.rows;const sum=()=>{let n=0,spr=0,rock=0,h=2166136261,sorted=true,bytes=0;for(let cy=0;cy<WA.rows;cy++)for(let cx=0;cx<WA.cols;cx++){WA.standing(cx*512,cy*512,cx*512,cy*512,()=>{});const S=WA.chunks.get(cy*WA.cols+cx).n.stand;
     n+=S.n;bytes+=S.bytes;for(let k=0;k<S.n;k++){if(S.E[k*4+2]>=0)spr++;else rock++;if(k&&S.E[k*4+3]<S.E[k*4-1])sorted=false}for(let i=0;i<S.E.length;i++)h=Math.imul(h^(S.E[i]&65535),16777619)>>>0}return{n,spr,rock,h,sorted,bytes}};
  const a=sum();WA.invalidate();const b=sum();WA.cap=cap0;
  ok(a.n===b.n&&a.h===b.h&&a.sorted&&a.spr>30000&&a.rock>1000,'the standing index: '+a.spr+' sprites (trees, small things standing; crossing a chunk\'s edge, in each) and '+a.rock+' column runs of rock, sorted by foot; the same after the map is painted afresh ('+b.n+', '+(a.h===b.h?'same':'differs')+')');
  ok(a.bytes/a.n<16,'it costs '+(a.bytes/a.n).toFixed(1)+' bytes an entry, '+(a.bytes/1048576).toFixed(2)+' MB over the whole classic map ('+WA.cols*WA.rows+' chunks)');
  info('index: '+a.n+' entries, '+(a.bytes/1024).toFixed(0)+' KB')}
 // ---- an enemy band behind the wood's edge: the crowns before it fade as over yours (WDEPTH.fade); its banner over all
 {park();const [x,y]=edge;P.x=x*TILE+8+30;P.y=(y+1)*TILE+12;P.dir=-1;const b=t.bandits[0];b.n=12;b.fight=null;b.x=x*TILE+8;b.y=y*TILE+7;const by=b.y;
  const L=look(b,by,()=>{b.x=-999},()=>{b.x=x*TILE+8});
  if(!L)ok(false,'the band behind the trees is drawn');else{const m=front(L.box,by);let inM=0,cov=0,bad=0,free=0;for(const p of L.px){const i=p*4;if(m.has(p)){inM++;if(near(L.on,L.off,L.z,i))cov++;else bad++}else if(!same(L.on,L.off,i))free++}
   ok(inM>15&&cov===inM&&!bad&&!free,'an enemy band behind trees: the crowns in front of it ('+inM+' of its '+L.px.length+' px) fade to '+F+' over it ('+cov+'; '+bad+' not), the rest of it untouched ('+free+' changed)');
   const B=t.bannerAt(b,Math.floor(now/420+b.x*.13)%2),bd=B.s.getContext('2d').getImageData(0,0,B.s.width,B.s.height).data;let n=0,diff=0;
   for(let j=0;j<B.s.height;j++)for(let k=0;k<B.s.width;k++){if(bd[(j*B.s.width+k)*4+3]<255)continue;const X=B.x-G.cam.x+k,Y=B.y-G.cam.y+j;if(X<0||Y<0||X>=VW||Y>=VH)continue;n++;if(!same(L.on,L.off,(Y*VW+X)*4))diff++}
   ok(n>20&&!diff,'its banner stays on top: '+n+' banner px the same with the depth on and off ('+diff+' differ)');
   const V=t.vis(),px0=P.x-G.cam.x,py0=P.y-G.cam.y;let inS=0,outS=0;for(let i=0;i<VW*VH;i++){if(same(L.on,L.off,i*4))continue;if(Math.hypot(i%VW-px0,(i/VW|0)-py0)<=V)inS++;else outS++}
   ok(inS>0&&!outS,'outside your sight nothing changes: the depth changed '+inS+' px within your sight, '+outS+' beyond it')}}
 // ---- hidden by the fog: a band in the wood out of your sight is not drawn, so nothing of it shows
 {park();const [x,y]=deep[0];P.x=x*TILE+8;P.y=y*TILE+8;const b=t.bandits[0];b.x=P.x+t.vis();b.y=P.y-2;settle();const on=grab(true),off=grab(false);let d=0;for(let i=0;i<VW*VH*4;i+=4)if(!same(on,off,i)&&Math.hypot((i/4)%VW-(P.x-G.cam.x),(i/4/VW|0)-(P.y-G.cam.y))>t.vis())d++;
  ok(!D.boxes.some(q=>q[4]===b.y)&&!d,'a band hidden in the wood beyond your sight is not drawn, and the depth reveals nothing there ('+d+' px)')}
 // ---- your band in a deep wood: the crowns before it fade to WDEPTH.fade, smoothly, and it shows through
 {park();const [x,y]=deep[Math.floor(deep.length/2)];P.x=x*TILE+8;P.y=y*TILE+8;const fy=P.y;
  const L=look(P,fy,()=>{P.stay={}},()=>{P.stay=null});
  if(!L)ok(false,'your band is drawn');else{const m=front(L.box,fy);let inM=0,good=0,free=0;for(const p of L.px){const i=p*4;if(m.has(p)){inM++;if(near(L.on,L.off,L.z,i))good++}else if(!same(L.on,L.off,i))free++}
   grab(true);const al=[...D.cov].map(k=>D.al.get(k));
   if(good<inM)for(const p of L.px){const i=p*4;if(m.has(p)&&!near(L.on,L.off,L.z,i))info('off '+(p%VW)+','+(p/VW|0)+' on '+[...L.on.slice(i,i+3)]+' fig '+[...L.off.slice(i,i+3)]+' scene '+[...L.z.slice(i,i+3)])}
   ok(inM>15&&good===inM&&!free&&al.length&&al.every(a=>Math.abs(a-F)<1e-9),'your band in a deep wood: the '+al.length+' crowns before it fade to '+F+'; its '+inM+' px under them show through ('+good+' at '+F+' scene + '+(1-F)+' band), the rest untouched ('+free+')');
   D.al.clear();D.cov.clear();D.t=0;t.drawWorld();now+=50;t.drawWorld();const a1=[...D.cov].map(k=>D.al.get(k));now+=50;t.drawWorld();const a2=[...D.cov].map(k=>D.al.get(k));
   ok(a1.length&&a1.every(a=>Math.abs(a-.8)<1e-9)&&a2.every(a=>Math.abs(a-.6)<1e-9),'smoothly, as in battle: '+t.PROPFADE.rate+' a second (a frame of 50 ms: 1 to '+a1[0].toFixed(1)+', then '+a2[0].toFixed(1)+')')}}
 // ---- your band behind a house in Ashford: the house fades the same way
 {park();const tw=t.townBy('Ashford'),l=tw.lots.find(l=>l.k==='house'&&l.st==='built'&&l.n===1);P.x=(l.x+.5)*TILE;P.y=l.y*TILE+9;const fy=P.y;
  const L=look(P,fy,()=>{P.stay={}},()=>{P.stay=null});
  if(!L)ok(false,'your band in Ashford is drawn');else{let ch=0,good=0;for(const p of L.px){const i=p*4;if(same(L.on,L.off,i))continue;ch++;if(near(L.on,L.off,L.z,i))good++}
   ok(ch>10&&good===ch,'your band behind a house in Ashford: the house shows over it at '+F+' ('+ch+' px, '+good+' as '+F+' house + '+(1-F)+' band)')}}
 // ---- a lord in front of the trees: nothing over him
 {park();const [x,y]=edge;const l=W.lords.find(q=>!q.dead);Object.assign(l,{inside:null,fight:null,x:x*TILE+8,y:(y+1)*TILE+7,troops:Array(16).fill('hum_spear')});P.x=l.x+56;P.y=l.y+16;const fy=l.y;
  const L=look(l,fy,()=>{l.x=-999},()=>{l.x=x*TILE+8});
  if(!L)ok(false,'the lord in front of the trees is drawn');else{let ch=0;for(const p of L.px)if(!same(L.on,L.off,p*4))ch++;const bh=behind(L.box,fy);
   ok(bh>3&&L.px.length>40&&!ch,'a lord in front of the trees ('+bh+' of them behind him in his box): nothing drawn over his '+L.px.length+' px ('+ch+' changed)')}}
 // ---- shadows: their own pictures, one pass, never darker where two meet
 {const tw=t.townBy('Ashford'),l=tw.lots.find(l=>l.k==='house'&&l.st==='built'),s=t.lotSprite(tw,l),d=s.getContext('2d').getImageData(0,0,s.width,s.height).data;let half=0;for(let i=3;i<d.length;i+=4)if(d[i]&&d[i]<255)half++;
  const g=t.ctx;g.save();g.setTransform(1,0,0,1,0,0);g.fillStyle='#ffffff';g.fillRect(0,0,80,40);t.drawShadows([{sh:[s.sh,4,4]}]);const one=g.getImageData(0,0,80,40).data;g.fillRect(0,0,80,40);t.drawShadows([{sh:[s.sh,4,4]},{sh:[s.sh,6,5]}]);const two=g.getImageData(0,0,80,40).data;g.restore();
  let m1=255,m2=255;for(let i=0;i<one.length;i+=4){m1=Math.min(m1,one[i]);m2=Math.min(m2,two[i])}
  ok(!half&&s.sh&&l._sh===s.sh&&m1<255&&m1===m2,'a building\'s picture is its body only ('+half+' half-clear px), its shadow its own (the lot\'s _sh); two shadows laid together are no darker than one ('+m1+', '+m2+')')}
 // ---- what it costs: a busy view (Ashford, everyone about) and a wood full of parties
 {performance.now=pn;const time=(n,f)=>{f();const a=pn.call(performance);for(let i=0;i<n;i++){f();t.ctx.getImageData(0,0,1,1)}return(pn.call(performance)-a)/n};
  // (warmed up, then on and off in turn, five rounds of 30 frames: the least of each)
  const run=name=>{D.on=false;time(30,()=>t.drawWorld());D.on=true;time(30,()=>t.drawWorld());const nf=D.boxes.length;let on=1e9,off=1e9;
   for(let k=0;k<5;k++){D.on=true;on=Math.min(on,time(30,()=>t.drawWorld()));D.on=false;off=Math.min(off,time(30,()=>t.drawWorld()))}D.on=true;info(name+': drawWorld '+on.toFixed(2)+' ms a frame with the depth, '+off.toFixed(2)+' without ('+nf+' figures)');return on-off};
  Math.random=t.seeded(12);t.act('begin','soldier');G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();G.encCool=1e9;G.clock=t.DAY*.25;const tw=t.townBy('Ashford');P.x=tw.x+40;P.y=tw.y+30;for(let i=0;i<200;i++)t.updateWorld(.016);G.encCool=1e9;
  const d1=run('Ashford');
  const [x,y]=deep[Math.floor(deep.length/3)];park();P.x=x*TILE+8;P.y=y*TILE+8;const ps=[...W.lords.filter(q=>!q.dead).slice(0,8),...t.bandits.slice(0,6)];ps.forEach((q,i)=>{Object.assign(q,{inside:null,fight:null,x:P.x-40+(i%5)*20,y:P.y-30+Math.floor(i/5)*22})});
  const d2=run('a wood with '+ps.length+' parties about you');
  ok(d1<2&&d2<2,'the depth adds '+d1.toFixed(2)+' ms a frame at Ashford and '+d2.toFixed(2)+' ms in a crowded wood (under 2)')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
finally{performance.now=pn;Math.random=r0;try{T.WDEPTH.on=true}catch(e){}}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
