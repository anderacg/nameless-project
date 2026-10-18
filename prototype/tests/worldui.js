'use strict';
// The world map's pointer UI (gfx/worldui.js): a click on the ground sets the arrow, its ripple and the way's dots; the way
// shortens as you walk it and arriving puffs and clears it; the brackets take the colour of what the pointer is on and ease
// from tile to tile; under reducedMotion all stands still; a tap on a phone gives the same feedback and no brackets; a chased
// band gets its ring and arrow, gone when you give up; nothing on land you have never seen; crisp at the screen's 3x; nothing
// drawn (the frame as before) while there is no goal and no pointer; and none of it touches the game.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
const t=T,G=t.G,P=t.P,W=t.W,WUI=t.WUI,pn=performance.now,r0=Math.random,rm0=t.reducedMotion,ev=s=>(0,eval)(s);let now=1e7;
try{
 try{localStorage.clear()}catch(e){}
 window.requestAnimationFrame=()=>0;t.act('begin','soldier');G.quietEvents=true;G.encCool=1e9;performance.now=()=>now;
 const cv=document.querySelector('canvas'),c=t.ctx;
 const world=()=>{t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.chase=null;P.tx=null;G.mouse.in=false;G.mouse.type='mouse'};world();
 const clear=()=>{t.bandits.length=0;W.lords.forEach(l=>{l.x=-9999;l.y=-9999});W.monsters=[];W.critters=[];W.caravans=[];W.refugees=[];W.folk=[];W.patrols=[];W.ships=[];W.fights=[]};
 let spot=null;for(let ty=12;ty<t.MH-12&&!spot;ty++)for(let tx=12;tx<t.MW-12&&!spot;tx++){const x=(tx+.5)*16,y=(ty+.5)*16;let n=0;for(let j=-4;j<=4;j++)for(let i=-7;i<=7;i++)if(t.tAt(tx+i,ty+j)===t.T_OPEN)n++;
  if(n===135&&t.TOWNS.every(z=>Math.hypot(z.x-x,z.y-y)>240)&&W.sites.every(z=>Math.hypot(z.x-x,z.y-y)>120))spot=[x,y]}
 const home=()=>{world();clear();P.x=spot[0]+.4;P.y=spot[1]+.2;P.stay=null;P.troops={hum_levy:12};t.reveal();WUI.fx.length=0;now+=5000;t.frame()};
 const at=ms=>{now+=ms;t.frame()};
 // (the drawImage calls of a frame: the picture, where, the transform)
 const calls=[];let rec=false;const di0=c.drawImage;c.drawImage=function(img,...a){if(rec)calls.push([img,a,this.getTransform()]);return di0.apply(this,[img,...a])};
 const frame=ms=>{now+=ms||0;calls.length=0;rec=true;try{t.frame()}finally{rec=false}};
 const pics=()=>new Set(t.WUIP.values()),mine=()=>{const s=pics();return calls.filter(([img])=>s.has(img))};
 const arrows=()=>{const s=new Set([...t.WUIP.entries()].filter(([k])=>k[0]==='a').map(([,v])=>v));return calls.filter(([img])=>s.has(img))};
 const rings=()=>{const s=new Set([...t.WUIP.entries()].filter(([k])=>k[0]==='r').map(([,v])=>v));return calls.filter(([img])=>s.has(img))};
 const hashView=()=>{const d=c.getImageData(0,0,t.cv.width,t.cv.height).data;let h=0;for(let i=0;i<d.length;i+=3)h=(h*31+d[i])|0;return h};
 const click=(wx,wy,kind='mouse')=>{const r=cv.getBoundingClientRect(),e={clientX:r.left+(wx-G.cam.x)*r.width/t.VW,clientY:r.top+(wy-G.cam.y)*r.height/t.VH,pointerType:kind,pointerId:kind==='touch'?7:1,isPrimary:true,button:0,bubbles:true,cancelable:true};
   cv.dispatchEvent(new PointerEvent('pointerdown',e));window.dispatchEvent(new PointerEvent('pointerup',e))};
 const pointAt=(wx,wy)=>{G.mouse.x=wx-G.cam.x;G.mouse.y=wy-G.cam.y;G.mouse.in=true;G.mouse.type='mouse'};
 // (the brackets drawn in a frame: their arguments, wuiBrackets watched)
 const brk=()=>{const R={last:null};window.__wb=t.wuiBrackets;window.__wbR=R;ev('wuiBrackets=(...a)=>{window.__wbR.last=a.map(v=>+(+v).toFixed(3)).join();return window.__wb(...a)}');R.at=()=>R.last;R.off=()=>ev('wuiBrackets=window.__wb');return R};
 const left=()=>{const w=WUI.way;return w?w.S[w.n-1]-WUI.s:null};
 try{
  // ---- nothing set: the frame is the frame without the UI (W6's frames are as before)
  home();{const h1=(frame(16),hashView());window.__wu=[t.wuiUnder,t.wuiOver];ev('wuiUnder=()=>{};wuiOver=()=>{}');let h0;try{frame();h0=hashView()}finally{ev('wuiUnder=window.__wu[0];wuiOver=window.__wu[1]')}
   ok(h1===h0&&!WUI.dest&&!WUI.tgt&&!WUI.hov&&!WUI.fx.length,'with no goal, no chase and no pointer the UI draws nothing: the map as it was')}
  // ---- a click on the ground: the goal's arrow, the ripple, the way
  home();{const gx=P.x+60,gy=P.y+20;
   click(gx,gy);ok(P.tx===gx&&P.ty===gy&&WUI.fx.some(f=>f.k==='ripple'&&f.x===Math.round(gx)),'a click on open ground sends you there and starts a ripple from the point');
   frame(16);ok(WUI.dest&&WUI.dest.x===gx&&WUI.way&&WUI.way.ok&&WUI.way.n>5&&Math.abs(left()-Math.hypot(gx-P.x,gy-P.y))<3,'the goal is marked and its way laid, '+(left()||0).toFixed(1)+' px to walk');
   ok(rings().length>=1&&arrows().length===1,'the frame draws the ripple ('+rings().length+' rings) and the arrow');
   const ys=[];for(const ms of [60,60,60,60,60,200,300,300,300]){frame(ms);const a=arrows()[0];ys.push(a?a[1][1]:null)}
   ok(ys.every(y=>y!=null)&&ys[0]<ys[4]&&new Set(ys.slice(5)).size>1,'the arrow drops onto the goal, then bobs ('+ys.map(y=>Math.round(y)).join(' ')+')');
   ok(!WUI.fx.length,'the ripple is gone after '+t.WUI_K.ripple+' s');
   const dots0=WUI.dots.length/3;ok(dots0>=6,'dots mark the way ('+dots0+')');
   // (they march: the same way a moment later has its dots elsewhere)
   const d0=WUI.dots.slice(0,6).join();frame(100);ok(WUI.dots.slice(0,6).join()!==d0,'the dots march along it');
   const l0=left();for(let i=0;i<30;i++)t.updateWorld(.05);frame(16);const l1=left();ok(l1<l0-5&&WUI.way.i>0,'walking it cuts the way short ('+l0.toFixed(1)+' to '+l1.toFixed(1)+' px)');
   let n=0;while(P.tx!=null&&n++<600)t.updateWorld(.05);frame(16);
   ok(!WUI.dest&&!WUI.way&&WUI.fx.some(f=>f.k==='poof'),'arriving: the arrow and the way are gone, a puff where it stood');
   frame(16);const pf=rings().length;frame(600);ok(pf>0&&!WUI.fx.length&&!mine().length,'the puff fades and nothing is left ('+pf+' rings, then '+WUI.fx.length+' effects, '+mine().length+' pictures)')}
  {const x=new XMLHttpRequest();x.open('GET','js/gfx/worldui.js',false);x.send();const src=x.responseText.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm,'');ok(src.length>1000&&!/Math\.random|(?<![\w$.])(?:rnd|rint|pick)\s*\(/.test(src),'the UI draws no random number (worldui.js calls neither Math.random nor rnd, rint, pick)')}
  // ---- the brackets: by what the pointer is on, easing from tile to tile
  home();{const b=t.asParty({x:P.x+40,y:P.y+6,n:6,cool:5,t:0,a:0,kind:'bandits',idle:true});b.troops=t.makeEnemies(6,false,'bandits');t.bandits.push(b);
   const L=W.lords.find(l=>!l.dead);Object.assign(L,{x:P.x-44,y:P.y+8,inside:null,fight:null,dead:false,dir:1,state:'march'});const fac0=P.fac,h0=Object.assign({},P.hostile);
   const kind=(x,y)=>{pointAt(x,y);for(let i=0;i<40;i++)frame(16);return WUI.hov&&WUI.hov.kind};
   const kb=kind(b.x,b.y-6),bx=WUI.hov&&WUI.hov.b.slice(),wb=t.wuiBox(b);
   ok(kb==='foe'&&t.WUI_K.col.foe==='#ff5a48','over a bandit band the brackets are red');
   ok(bx&&wb&&bx.every((v,i)=>Math.abs(v-wb[i])<.05)&&wb[2]-wb[0]>12&&wb[3]-wb[1]>14,'and wrap its leader and host ('+(wb||[]).map(v=>Math.round(v)).join(',')+')');
   P.fac=L.fac;ok(kind(L.x,L.y-6)==='friend','over a lord of your realm green');
   P.fac=null;P.hostile={};ok(kind(L.x,L.y-6)==='neutral','over a lord you are not at war with white');
   P.hostile[L.fac]=G.day+20;ok(kind(L.x,L.y-6)==='foe','over a lord whose realm is hostile to you red');P.fac=fac0;P.hostile=h0;
   ok(t.wuiKind(t.TOWNS[0])==='hold'&&t.WUI_K.col.hold==='#e8b94a'&&t.wuiKind({x:0,y:0})==='ground','a holding gold, open ground its own soft white');
   L.x=-9999;t.bandits.length=0;
   // (a tile, then another: the brackets glide between them)
   const tx=Math.floor((P.x+24)/16)*16,ty=Math.floor((P.y+30)/16)*16;ok(kind(tx+8,ty+8)==='ground'&&WUI.hov.b.join()===[tx,ty,tx+16,ty+16].join(),'over open ground the brackets frame its tile');
   pointAt(tx+8+48,ty+8+16);frame(16);const m1=WUI.hov.b.slice();frame(16);const m2=WUI.hov.b.slice();for(let i=0;i<30;i++)frame(16);const m3=WUI.hov.b.slice();
   ok(m1[0]>tx&&m1[0]<tx+48&&m2[0]>m1[0]&&m2[0]<tx+48&&m3.join()===[tx+48,ty+16,tx+64,ty+32].join(),'to the next tile they ease, not jump ('+[m1[0]-tx,m2[0]-tx,m3[0]-tx].map(v=>v.toFixed(1)).join(' → ')+' px)');
   // (they breathe: the same spot a moment later is drawn otherwise)
   const BR=brk();frame(16);const a1=BR.at();frame(700);const a2=BR.at();BR.off();ok(a1&&a2&&a1!==a2,'and pulse softly where they rest ('+a1+' / '+a2+')');
   // (land never seen: no brackets)
   let dark=null;for(let r=8;r<200&&!dark;r++)for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){const x=P.x+dx*r*16,y=P.y+dy*r*16;if(x>0&&y>0&&x<t.MW*16&&y<t.MH*16&&!t.seenAt(x,y)){dark=[x,y];break}}
   if(dark){G.mouse.x=dark[0]-G.cam.x;G.mouse.y=dark[1]-G.cam.y;frame(16);ok(!WUI.hov,'over land you have never seen: no brackets')}
   G.mouse.in=false;frame(16);ok(!WUI.hov,'the pointer off the map: none')}
  // ---- the dots: none on land you have never seen
  home();{let far=null;for(let r=10;r<120&&!far;r++){const x=P.x+r*16,y=P.y;if(x<t.MW*16-16&&!t.seenAt(x,y)&&t.passable(t.terrAt(x,y)))far=[x,y]}
   if(far){P.tx=far[0];P.ty=far[1];frame(16);frame(800);const D=WUI.dots,cam={x:Math.floor(G.cam.x),y:Math.floor(G.cam.y)};let bad=0,n=0;for(let i=0;i<D.length;i+=3){n++;if(!t.seenAt(D[i]+cam.x,D[i+1]+cam.y))bad++}
    ok(n>3&&!bad&&WUI.way.S[WUI.way.n-1]>16*10,'a way into land never seen: dots only where you have seen ('+n+' drawn, '+bad+' in the dark)')}else o.push('INFO no unseen land in reach');P.tx=null}
  // ---- chasing a band: a ring round it, an arrow over it; giving up clears them
  home();{const b=t.asParty({x:P.x+60,y:P.y+10,n:6,cool:5,t:0,a:0,kind:'bandits',idle:true});b.troops=t.makeEnemies(6,false,'bandits');t.bandits.push(b);frame(16);
   click(b.x,b.y-4);frame(16);frame(400);ok(G.chase===b&&WUI.tgt&&WUI.tgt.o===b&&!WUI.dest,'a click on a band 60 px off chases it, and it is the UI\'s target');
   const T=t.wuiTargetAt(b,{x:Math.floor(G.cam.x),y:Math.floor(G.cam.y)}),rs=rings(),as=arrows();
   ok(rs.length>=1&&as.length===1&&as[0][1][1]<T.y-14,'a ring pulses round it ('+rs.length+' drawn) and an arrow stands over it');
   ok(WUI.way&&Math.hypot(WUI.way.gx-b.x,WUI.way.gy-b.y)<1&&WUI.dots.length>0,'the dots lead to it');
   b.x+=12;for(let i=0;i<20;i++)frame(30);ok(Math.hypot(WUI.way.gx-b.x,WUI.way.gy-b.y)<1,'it moves on: the way follows it');
   click(P.x-30,P.y+30);frame(16);ok(G.chase===null&&!WUI.tgt&&WUI.dest,'a click elsewhere: the chase and its ring are gone, a new goal marked');t.bandits.length=0;P.tx=null}
  // ---- a tap on a phone: the ripple, the arrow and the way; no brackets
  home();{click(P.x+50,P.y-20,'touch');frame(16);ok(P.tx!=null&&WUI.dest&&WUI.fx.some(f=>f.k==='ripple')&&arrows().length===1&&WUI.way,'a tap sends you, with the ripple, the arrow and the way');
   ok(G.mouse.type==='touch'&&!WUI.hov,'a finger shows no brackets');P.tx=null;G.mouse.type='mouse'}
  // ---- reducedMotion: all still
  home();ev('reducedMotion=()=>true');try{click(P.x+50,P.y+24);frame(16);ok(P.tx!=null&&!WUI.fx.length,'reduced motion: no ripple');
   const ys=[];for(let i=0;i<6;i++){frame(170);ys.push(arrows()[0][1][1])}ok(new Set(ys).size===1,'the arrow stands still on its goal');
   const d0=WUI.dots.join();frame(300);ok(WUI.dots.join()===d0&&WUI.dots.length>0,'the dots do not march');
   const tx=Math.floor((P.x-40)/16)*16,ty=Math.floor((P.y+40)/16)*16;pointAt(tx+8,ty+8);frame(16);ok(WUI.hov&&WUI.hov.b.join()===[tx,ty,tx+16,ty+16].join(),'the brackets come straight to the tile');
   pointAt(tx+40,ty+8);frame(16);ok(WUI.hov.b.join()===[tx+32,ty,tx+48,ty+16].join(),'and go straight to the next');
   const BR=brk();frame(16);const h1=BR.at()+mine().map(q=>q[1].join()).join();frame(500);frame(450);const h2=BR.at()+mine().map(q=>q[1].join()).join();BR.off();ok(h1===h2&&!!BR.last,'nothing pulses: the arrow and brackets hold');
   P.tx=null;G.mouse.in=false;let n=0;frame(16);ok(!WUI.fx.length&&!WUI.dest,'and no puff')}finally{window.__rm0=rm0;ev('reducedMotion=window.__rm0')}
  // ---- crisp at the screen's 3x: every picture of it at its own size, on whole device pixels
  home();ev('VS=3');try{const b=t.asParty({x:P.x+60,y:P.y+10,n:6,cool:5,t:0,a:0,kind:'bandits',idle:true});b.troops=t.makeEnemies(6,false,'bandits');t.bandits.push(b);
   P.x+=.37;frame(16);click(b.x,b.y-4);pointAt(P.x-30.3,P.y+20);const bad=[];let n=0,fills=0;const fr0=c.fillRect;c.fillRect=function(x,y,w,h){if(rec){const m=this.getTransform();fills++;const isI=v=>Math.abs(v-Math.round(v))<1e-3;if(!isI(m.e+m.a*x)||!isI(m.f+m.d*y)||!isI(m.a*w)||!isI(m.d*h))bad.push('rect '+[x,y,w,h].map(v=>+v.toFixed(3)).join(','))}return fr0.call(this,x,y,w,h)};
   try{for(let i=0;i<12;i++){frame(37);for(const [img,a,m] of mine()){n++;const isI=v=>Math.abs(v-Math.round(v))<1e-3;if(a.length!==2||Math.abs(m.a-3)>1e-3||Math.abs(m.d-3)>1e-3||!isI(m.e+m.a*a[0])||!isI(m.f+m.d*a[1]))bad.push(img.width+'x'+img.height+' @'+a.map(v=>+(+v).toFixed(3)).join(','))}}}finally{c.fillRect=fr0}
   ok(n>12&&!bad.length,'at 3x its pictures ('+n+') and fills are on whole device pixels at their own size: crisp'+(bad.length?': '+bad.slice(0,4).join('; '):''));t.bandits.length=0;G.chase=null;P.tx=null;G.mouse.in=false}finally{ev('VS=1')}
 }finally{c.drawImage=di0}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
finally{performance.now=pn;Math.random=r0}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
