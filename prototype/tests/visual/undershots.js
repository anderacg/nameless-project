'use strict';
// Not a test: boats under the bridges (world/ships.js shipUnder) and the crossed swords over a band you go to attack (gfx/worldui.js
// wuiSwords), printed as "SHOT <name> <data URL>" lines (decode them into PNGs). For a stone bridge and a wooden one: a fishing boat
// and a trade ship half under its deck, as drawn today and as drawn before (the deck left out: decksOver null), at the screen's
// 3x; a strip of a fishing boat sailing under. The swords: over a band you chase, on a desktop (640 x 360 game px at 3x), on a
// phone on its side (844 x 390 CSS px, 2 a game px: its own zoom) and a phone at its farthest zoom (2 device px a game px at a
// devicePixelRatio of 3: drawn twice the size), and the ring's Attack icon
window.RUN=()=>{const o=[],t=T,G=t.G,P=t.P,W=t.W,pn=performance.now,ev=s=>(0,eval)(s),shots=[],TILE=t.TILE,MW=t.MW;let now=1e7;
const dpr0=Object.getOwnPropertyDescriptor(window,'devicePixelRatio');
try{
 window.requestAnimationFrame=()=>0;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;G.encCool=1e9;performance.now=()=>now;G.clock=t.DAY*.4;
 const world=()=>{t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.chase=null;P.tx=null;G.mouse.in=false};world();
 const clear=()=>{t.bandits.length=0;W.lords.forEach(l=>{l.x=-9999;l.y=-9999});W.monsters=[];W.critters=[];W.caravans=[];W.refugees=[];W.folk=[];W.patrols=[];W.ships=[];W.fights=[]};
 const grab=(wx,wy,w,h)=>{const c=document.createElement('canvas'),k=t.VS;c.width=w*k;c.height=h*k;c.getContext('2d', { willReadFrequently: true }).drawImage(t.cv,Math.round((wx-G.cam.x-w/2)*k),Math.round((wy-G.cam.y-h/2)*k),w*k,h*k,0,0,w*k,h*k);return c};
 const strip=(name,cs)=>{const c=document.createElement('canvas'),g=c.getContext('2d', { willReadFrequently: true }),w=cs[0].width,h=cs[0].height;c.width=(w+4)*cs.length-4;c.height=h;g.fillStyle='#000';g.fillRect(0,0,c.width,h);cs.forEach((f,i)=>g.drawImage(f,i*(w+4),0));shots.push('SHOT '+name+' '+c.toDataURL('image/png'))};
 const still=(name,c)=>shots.push('SHOT '+name+' '+(c||t.cv).toDataURL('image/png'));
 const draw=()=>{Math.random=t.seeded(7);t.frame()};
 ev('VS=3');
 // ---- 1. the bridges: a stone one and a wooden one, one over a river running east and west first (a boat sails under it side on)
 const br=t.WM.crossings.filter(c=>c.kind==='bridge'),hor=c=>((c.i/MW)|0)===((c.j/MW)|0);
 o.push('INFO bridges '+br.length+': '+br.filter(c=>c.stone).length+' stone, '+br.filter(hor).length+' across a river running north and south, '+br.filter(c=>c.tiles.some(i=>t.WM.river[i]&4)).length+' over a navigable reach');
 const pick=st=>br.filter(c=>!!c.stone===st).sort((a,b)=>hor(a)-hor(b)||b.tiles.length-a.tiles.length)[0];
 for(const [name,c] of [['stone',pick(true)],['wood',pick(false)],['across',br.filter(hor).sort((a,b)=>b.tiles.length-a.tiles.length)[0]]]){if(!c){o.push('INFO no '+name+' bridge');continue}
  const d=t.WorldArt.deck(c),H=hor(c),T=c.tiles[c.tiles.length>>1],tx=T%MW,ty=(T/MW)|0,hw=t.GENART.deck[c.stone?1:0],mid=(H?ty:tx)*TILE+8;
  // (half under: side on, its bow under the deck; else its hull under it, its top over the deck)
  const at=(k,big)=>H?{x:(tx+.5)*TILE+(big?6:0),y:mid+(big?2:hw-3)-4,dir:1}:{x:mid-hw-(big?4:2),y:(ty+.5)*TILE-4,dir:1};
  for(const big of [false,true]){world();clear();const a=at(0,big);W.ships=[t.asShip({k:big?'trade':'fish',home:t.TOWNS[0].name,to:t.TOWNS[0].name,x:a.x,y:a.y,path:[],i:0,seed:5,dir:a.dir,state:'out',big,fac:t.TOWNS[0].owner,col:big?'#3d74d6':null,goods:{}})];
   P.x=a.x+30;P.y=a.y+60;P.stay=null;t.reveal();G.mouse.in=false;draw();const now1=grab(a.x,a.y-6,96,64);ev('window.__do=decksOver;decksOver=()=>null');try{draw()}finally{ev('decksOver=window.__do')}const was=grab(a.x,a.y-6,96,64);
   strip('1_'+name+'_'+(big?'ship':'boat')+'_now_then',[now1,was]);o.push('INFO '+name+' bridge at '+tx+','+ty+(H?' (deck west-east)':' (deck north-south)')+', deck '+d.cv.width+'x'+d.cv.height+' at '+d.x+','+d.y+'; '+(big?'trade ship':'fishing boat')+' at '+a.x.toFixed(0)+','+a.y.toFixed(0))}
  // (a strip: a fishing boat sailing under it, 8 frames)
  {world();clear();const a=at(0,false),s=t.asShip({k:'fish',home:t.TOWNS[0].name,x:a.x,y:a.y,path:[],i:0,seed:5,dir:1,state:'out',big:false});W.ships=[s];P.x=a.x+30;P.y=a.y+60;t.reveal();const cs=[];
   for(let i=0;i<8;i++){if(H)s.y=mid-hw-10+i*3.5-4;else s.x=mid-hw-14+i*4;now+=90;draw();cs.push(grab(H?a.x:mid,H?mid-4:a.y-6,64,56))}strip('2_'+name+'_sail_under',cs)}}
 // ---- 2. the crossed swords over a band you go to attack: desktop, phone, phone at its farthest; a lord you meet as before
 let spot=null;for(let ty=12;ty<t.MH-12&&!spot;ty++)for(let tx=12;tx<t.MW-12&&!spot;tx++){const x=(tx+.5)*16,y=(ty+.5)*16;let n=0;for(let j=-4;j<=4;j++)for(let i=-7;i<=7;i++)if(t.tAt(tx+i,ty+j)===t.T_OPEN)n++;
  if(n===135&&t.TOWNS.every(z=>Math.hypot(z.x-x,z.y-y)>240)&&W.sites.every(z=>Math.hypot(z.x-x,z.y-y)>120))spot=[x,y]}
 const chase=()=>{world();clear();P.x=spot[0]+.4;P.y=spot[1]+.2;P.stay=null;P.troops={hum_levy:12};t.reveal();const b=t.asParty({x:P.x+70,y:P.y+14,n:6,cool:5,t:0,a:0,kind:'bandits',idle:true});b.troops=t.makeEnemies(6,false,'bandits');t.bandits.push(b);
  t.frame();t.approach(b);for(const ms of [0,100,300,400])(now+=ms,t.frame());return b};
 {const b=chase();const cs=[];for(const ms of [0,60,60,120,200,300,300,300]){now+=ms;t.frame();cs.push(grab(P.x+36,P.y-4,120,64))}strip('3_swords_drop_x3',cs)}
 const view=(vs,vw,vh,k)=>{ev('VS='+vs+';VW='+vw+';VH='+vh);if(k)Object.defineProperty(window,'devicePixelRatio',{value:k,configurable:true})};
 try{view(3,640,360);chase();now+=500;t.frame();still('4_swords_desktop_1920x1080');
  view(2,422,195);chase();now+=500;t.frame();still('5_swords_phone_844x390');
  view(2,1266,585,3);chase();now+=500;t.frame();{const c=document.createElement('canvas');c.width=844;c.height=390;c.getContext('2d', { willReadFrequently: true }).drawImage(t.cv,0,0,844,390);still('6_swords_phone_farthest_as_seen',c)}
 }finally{if(dpr0)Object.defineProperty(window,'devicePixelRatio',dpr0);else delete window.devicePixelRatio;view(3,576,360)}
 {const L=W.lords.find(l=>!l.dead);world();clear();P.x=spot[0]+.4;P.y=spot[1]+.2;t.reveal();P.fac=L.fac;Object.assign(L,{x:P.x+70,y:P.y+14,inside:null,fight:null,dead:false,dir:1,state:'march'});t.frame();G.chase=L;P.tx=L.x;P.ty=L.y;for(const ms of [0,600])(now+=ms,t.frame());
  still('7_meet_friend_arrow',grab(P.x+36,P.y-4,120,64));P.fac=null;L.x=-9999;G.chase=null;P.tx=null}
 {const d=document.createElement('div');d.innerHTML=t.icon('attack',66)+t.icon('sword',66)+t.icon('people',66);document.body.appendChild(d);o.push('INFO ring icons: '+d.querySelectorAll('svg').length)}
 {const c=t.wuiSwords(),z=document.createElement('canvas');z.width=c.width*8;z.height=c.height*8;const g=z.getContext('2d', { willReadFrequently: true });g.imageSmoothingEnabled=false;g.fillStyle='#4a6a3a';g.fillRect(0,0,z.width,z.height);g.drawImage(c,0,0,z.width,z.height);still('8_swords_picture_x8',z)}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
finally{performance.now=pn;try{ev('VS=1')}catch(e){}}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(shots,ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
