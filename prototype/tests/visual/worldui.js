'use strict';
// Not a test: the world map's pointer UI (gfx/worldui.js) as frame strips and stills, at the screen's 3x (core.js VS) and at 1x,
// printed as "SHOT <name> <data URL>" lines (decode them into PNGs): a click's ripple and the arrow dropping; the dots of the way
// while you walk it, and the puff on arrival; the brackets gliding from tile to tile; the brackets over an enemy band, a friendly
// lord and a holding; the ring and arrow over a band you chase; a way round water. Each strip: 8 frames side by side, a crop
// round the action, from the clock held and stepped (performance.now)
window.RUN=()=>{const o=[],t=T,G=t.G,P=t.P,W=t.W,pn=performance.now,ev=s=>(0,eval)(s),shots=[];let now=1e7;
try{
 window.requestAnimationFrame=()=>0;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;G.encCool=1e9;performance.now=()=>now;
 const world=()=>{t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.chase=null;P.tx=null;G.mouse.in=false};world();
 const S=3;ev('VS='+S);G.clock=t.DAY*.3;
 const clear=()=>{t.bandits.length=0;W.lords.forEach(l=>{l.x=-9999;l.y=-9999});W.monsters=[];W.critters=[];W.caravans=[];W.refugees=[];W.folk=[];W.patrols=[];W.ships=[];W.fights=[]};
 let spot=null;for(let ty=12;ty<t.MH-12&&!spot;ty++)for(let tx=12;tx<t.MW-12&&!spot;tx++){const x=(tx+.5)*16,y=(ty+.5)*16;let n=0;for(let j=-4;j<=4;j++)for(let i=-7;i<=7;i++)if(t.tAt(tx+i,ty+j)===t.T_OPEN)n++;
  if(n===135&&t.TOWNS.every(z=>Math.hypot(z.x-x,z.y-y)>240)&&W.sites.every(z=>Math.hypot(z.x-x,z.y-y)>120))spot=[x,y]}
 const home=()=>{clear();P.x=spot[0]+.4;P.y=spot[1]+.2;P.stay=null;P.troops={hum_levy:12};t.reveal()};
 // a crop of the screen just drawn: w x h game px with its middle at the world's (wx, wy), at the canvas's own pixels
 const grab=(wx,wy,w,h)=>{const c=document.createElement('canvas'),k=t.CVS;c.width=w*k;c.height=h*k;c.getContext('2d', { willReadFrequently: true }).drawImage(t.cv,Math.round((wx-G.cam.x-w/2)*k),Math.round((wy-G.cam.y-h/2)*k),w*k,h*k,0,0,w*k,h*k);return c};
 const strip=(name,cs)=>{const c=document.createElement('canvas'),g=c.getContext('2d', { willReadFrequently: true }),w=cs[0].width,h=cs[0].height;c.width=(w+4)*cs.length-4;c.height=h;g.fillStyle='#000';g.fillRect(0,0,c.width,h);cs.forEach((f,i)=>g.drawImage(f,i*(w+4),0));shots.push('SHOT '+name+' '+c.toDataURL('image/png'))};
 const still=(name,c)=>shots.push('SHOT '+name+' '+(c||t.cv).toDataURL('image/png'));
 const at=ms=>{now+=ms;t.frame()},settle=()=>{for(let i=0;i<30;i++)at(16)};
 // ---- 1. a click: the ripple and the arrow's drop, then the bob
 home();{const gx=P.x+56,gy=P.y+18;t.frame();t.worldGo(gx,gy);const cs=[];for(const ms of [0,50,60,70,80,90,150,400]){at(ms);cs.push(grab(P.x+30,P.y+6,104,56))}strip('1_click_drop',cs)}
 // ---- 2. walking it: the dots marching and cut as you go; the puff as you arrive
 {const cs=[];for(let f=0;f<8;f++){for(let i=0;i<14;i++){t.updateWorld(.05);now+=16}t.frame();cs.push(grab(P.x+28,P.y+6,104,56))}strip('2_walk_trail',cs)}
 {const cs=[];let guard=0;while(P.tx!=null&&guard++<400){t.updateWorld(.05);now+=16;if(P.tx!=null&&Math.hypot(P.tx-P.x,P.ty-P.y)<8&&cs.length<2){t.frame();cs.push(grab(P.x,P.y-2,64,40))}}
  for(const ms of [16,60,60,60,60,60,80,120].slice(0,8-cs.length)){at(ms);cs.push(grab(P.x,P.y-2,64,40))}strip('3_arrive_poof',cs)}
 // ---- 3. the brackets: from tile to tile with the pointer, easing
 home();{G.mouse.type='mouse';G.mouse.in=true;const mx=t.VW/2+20,my=t.VH/2+4;G.mouse.x=mx;G.mouse.y=my;at(16);settle();const cs=[grab(P.x+28,P.y+4,80,44)];
  G.mouse.x=mx+34;G.mouse.y=my+18;for(const ms of [16,16,16,16,33,50,100]){at(ms);cs.push(grab(P.x+28,P.y+4,80,44))}strip('4_hover_glide',cs);
  const br=[];for(let i=0;i<8;i++){at(175);br.push(grab(P.x+48,P.y+20,40,32))}strip('5_hover_breathe',br)}
 // ---- 4. the brackets' colours: an enemy band, a friendly lord, your companions' party, a holding
 home();{const b=t.asParty({x:P.x+40,y:P.y+6,n:6,cool:5,t:0,a:0,kind:'bandits',idle:true});b.troops=t.makeEnemies(6,false,'bandits');t.bandits.push(b);
  const L=W.lords.find(l=>!l.dead);P.fac=L.fac;Object.assign(L,{x:P.x-44,y:P.y+8,inside:null,fight:null,dead:false,dir:1,state:'march'});
  const pt=(x,y)=>{G.mouse.x=x-G.cam.x;G.mouse.y=y-G.cam.y;G.mouse.in=true;G.mouse.type='mouse'};const cs=[];
  pt(b.x,b.y-6);settle();cs.push(grab(b.x,b.y-6,48,40));
  pt(L.x,L.y-6);settle();cs.push(grab(L.x,L.y-6,48,40));
  pt(P.x+10,P.y+30);settle();cs.push(grab(P.x+10,P.y+30,48,40));
  strip('6_hover_kinds',cs);P.fac=null;L.x=-9999}
 {world();const tw=t.townBy('Ashford');clear();P.x=tw.x+30;P.y=tw.y+40;t.reveal();t.frame();G.mouse.x=tw.x-G.cam.x;G.mouse.y=tw.y-4-G.cam.y;G.mouse.in=true;G.mouse.type='mouse';settle();o.push('INFO holding pick '+(t.pickAt(G.cam.x+G.mouse.x,G.cam.y+G.mouse.y)||{}).name+' hov '+JSON.stringify(t.WUI.hov&&t.WUI.hov.b)+' tw '+tw.x+','+tw.y);t.frame();still('7_hover_holding_x3',grab(tw.x,tw.y-10,200,120));G.mouse.in=false}
 // ---- 5. chasing a band: its ring pulsing, the arrow over it, the dots to it
 home();{const b=t.asParty({x:P.x+70,y:P.y+14,n:6,cool:5,t:0,a:0,kind:'bandits',idle:true});b.troops=t.makeEnemies(6,false,'bandits');t.bandits.push(b);t.frame();t.worldGo(b.x,b.y-4);
  const cs=[];for(const ms of [0,60,60,120,200,200,200,200]){at(ms);cs.push(grab(P.x+36,P.y,120,64))}strip('8_chase_band',cs);
  still('9_chase_x3');ev('VS=1');t.frame();still('9_chase_x1');ev('VS=3');G.chase=null;P.tx=null;t.bandits.length=0}
 // ---- 6. a way round water: the dots follow the walk round the shore
 {let best=null;for(let k=0;k<4000&&!best;k++){const tx=12+(k*37)%(t.MW-24),ty=12+((k*53)%(t.MH-24));if(t.tAt(tx,ty)!==t.T_OPEN)continue;const x=(tx+.5)*16,y=(ty+.5)*16;
   for(const [dx,dy] of [[1,0],[0,1],[1,1],[-1,1]]){const gx=x+dx*120,gy=y+dy*120;if(gx<16||gy<16||gx>t.MW*16-16||gy>t.MH*16-16||!t.passable(t.terrAt(gx,gy)))continue;
     if(!t.clearLine(x,y,gx,gy)&&t.Router.reach({x,y},{x:gx,y:gy})){const w=t.wuiWay(x,y,gx,gy,0);if(w.ok&&w.S[w.n-1]<260){best=[x,y,gx,gy];break}}}}
  if(best){world();clear();P.x=best[0];P.y=best[1];t.reveal();t.frame();t.worldGo(best[2],best[3]);at(16);at(800);still('10_shore_x3',grab((best[0]+best[2])/2,(best[1]+best[3])/2,200,130))}else o.push('INFO no shore found')}
 // ---- 7. the whole screen, 1x and 3x, walking to a goal with the pointer on the ground
 home();{t.frame();t.worldGo(P.x+90,P.y-50);G.mouse.x=t.VW/2-60;G.mouse.y=t.VH/2+40;G.mouse.in=true;G.mouse.type='mouse';for(let i=0;i<20;i++){t.updateWorld(.05);at(16)}at(500);still('11_screen_x3');ev('VS=1');t.frame();still('11_screen_x1')}
 // ---- 8. reduced motion: all still
 {ev('VS=3');const rm=t.reducedMotion;ev('reducedMotion=()=>true');try{home();t.frame();t.worldGo(P.x+56,P.y+18);G.mouse.x=t.VW/2-30;G.mouse.y=t.VH/2;G.mouse.in=true;const cs=[];for(let i=0;i<4;i++){at(120);cs.push(grab(P.x+14,P.y+6,104,56))}strip('12_reduced',cs)}finally{window.__rm=rm;ev('reducedMotion=window.__rm')}}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
finally{performance.now=pn;try{ev('VS=1')}catch(e){}}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(shots,ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
