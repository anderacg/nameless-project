'use strict';
// Ships: fishing boats put out from their ports in the morning, sail only on water to a fishing ground, fish, and are home by
// night; trade ships carry a port's surplus over water to the friendly port on the same sea that needs it, and unload there.
// Under a bridge (stone or wood) a boat passes under the deck: the deck's own pixels over it, nothing else changed; away from the
// bridges drawn as before; the deck on whole pixels at 3x; what it costs.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,TILE=t.TILE,MW=t.MW;t.act('begin','soldier');G.quietEvents=true;
 const ports=t.TOWNS.filter(z=>t.dockOf(z));ok(ports.length>=2,ports.length+' ports have a dock on the water: '+ports.map(z=>z.name).join(', '));
 // (water a boat sails: open water, or a navigable river, under its bridges and over its fords too: ships.js isWater)
 const wet=s=>t.isWater(Math.floor(s.x/TILE),Math.floor(s.y/TILE));
 ok(!ports.some(z=>t.climAt(z.x,z.y)==='frost'&&t.dockOf(z)&&t.climAt((t.dockOf(z).tx+.5)*TILE,(t.dockOf(z).ty+.5)*TILE)==='frost'),'no boat puts out on the frozen lakes of the frost');
 // ---- fishing boats
 W.ships=[];G.clock=t.DAY*.3;for(let i=0;i<400&&!W.ships.length;i++)t.updateShips(.05);
 const b=W.ships.find(s=>s.k==='fish');ok(!!b,'in the morning a port sends out a fishing boat ('+(b&&b.home)+')');
 if(b){ok(b.path.every(j=>t.isWater(j%t.MW,(j-j%t.MW)/t.MW)&&t.climate[j]!==t.CLIM.frost),'its course lies over open water only (never the ice; a navigable river under its bridges too)');let dry=0;
  for(let i=0;i<3000&&b.state==='out';i++){G.clock=t.DAY*.3;t.updateShips(.05);if(!wet(b))dry++}ok(b.state==='fish'&&!dry,'it sails out over the water and fishes');
  const dp=t.DEPOSITS.find(d=>d.kind==='fish'&&d.tx===Math.floor(b.x/TILE)&&d.ty===Math.floor(b.y/TILE));o.push('INFO fishing at '+(dp?'its '+dp.g+' grounds':'open water'));
  G.clock=t.DAY*.7;for(let i=0;i<4000&&W.ships.includes(b);i++)t.updateShips(.05);ok(!W.ships.includes(b),'and in the evening it sails home')}
 // ---- trade ships
 W.ships=[];G.clock=t.DAY*.9;let pair=null;
 for(const a of ports)for(const z of ports){if(a===z||pair)continue;const da=t.dockOf(a),dz=t.dockOf(z);if(t.waterIds()[da.ty*MW+da.tx]===t.waterIds()[dz.ty*MW+dz.tx]&&t.shipPath(da,dz))pair=[a,z]}
 ok(!!pair,'some ports share a sea, so trade ships have routes');{const W_=t.waterIds(),by={};for(const z of ports){const d=t.dockOf(z),k=W_[d.ty*MW+d.tx];(by[k]=by[k]||[]).push(z.name)}o.push('INFO seas: '+Object.values(by).map(a=>a.join(' + ')).join(' | '))}
 if(pair){const [a,z]=pair;a.owner=z.owner;t.ensureEcon(a);t.ensureEcon(z);a.stock.cheese=400;z.stock.cheese=0;
  const s=t.sendShip(a);ok(s&&s.goods.cheese>0&&s.to===z.name,a.name+' ships its surplus cheese to '+(s&&s.to));const c0=z.stock.cheese,n=s.goods.cheese;
  let dry=0;for(let i=0;i<20000&&W.ships.includes(s);i++){t.updateShips(.05);if(!wet(s))dry++}
  ok(!W.ships.includes(s)&&z.stock.cheese>=c0+n&&!dry,'the ship sails over water and unloads it there (+'+(z.stock.cheese-c0)+' cheese)')}
 // ---- drawn on the map
 if(ports.length){const z=ports[0],d=t.dockOf(z);W.ships=[{k:'fish',home:z.name,x:(d.tx+.5)*TILE,y:(d.ty+.5)*TILE,path:[],i:0,seed:3,dir:-1,state:'fish',until:1e9,big:false}];P.x=W.ships[0].x;P.y=W.ships[0].y+40;G.mode='world';G.modal=false;t.hidePanel();t.drawWorld();ok(!ERR.length,'boats are drawn without error')}
 // ---- under a bridge (the owner's play-test, 2026-10-23: boats sailed over the decks): the deck put back over a boat under it
 {const ev=s=>(0,eval)(s),pn=performance.now,now=1e7,br=t.WM.crossings.filter(c=>c.kind==='bridge'),hor=c=>((c.i/MW)|0)===((c.j/MW)|0),c0=t.cv,g=t.ctx;performance.now=()=>now;
  const clear=()=>{t.bandits.length=0;W.lords.forEach(l=>{l.x=-9999;l.y=-9999});W.monsters=[];W.critters=[];W.caravans=[];W.refugees=[];W.folk=[];W.patrols=[];W.ships=[];W.fights=[]};
  const shot=()=>{Math.random=t.seeded(7);G.mode='world';G.modal=false;t.frame();return g.getImageData(0,0,c0.width,c0.height).data};
  const forced=f=>{ev('window.__do=decksOver;decksOver=()=>null');try{return f()}finally{ev('decksOver=window.__do')}};
  try{o.push('INFO '+br.length+' bridges ('+br.filter(c=>c.stone).length+' stone, '+br.filter(hor).length+' with a deck west to east)');
   const cases=[[true,false],[false,false],[true,true],[false,true]].map(([st,h])=>br.find(c=>!!c.stone===st&&hor(c)===h)).filter(Boolean);
   ok(cases.some(c=>c.stone)&&cases.some(c=>!c.stone),'a stone bridge and a wooden one to sail under ('+cases.length+' cases)');
   for(const c of cases){const d=t.WorldArt.deck(c),w=d.cv.width,h=d.cv.height,nm=(c.stone?'stone':'wooden')+(hor(c)?' (deck west to east)':' (deck north to south)');
    // (its picture: the chunks' own pixels there, a rect painted as a chunk is)
    {const pc=t.mkc(w,h,()=>{});t.runGen(t.paintSteps(t.WorldArt.ensure(),d.x,d.y,w,h,pc.getContext('2d'),0,0,{}));const A=d.cv.getContext('2d').getImageData(0,0,w,h).data,B=pc.getContext('2d').getImageData(0,0,w,h).data;let n=0,bad=0;
     for(let i=0;i<A.length;i+=4)if(A[i+3]){n++;if(A[i]!==B[i]||A[i+1]!==B[i+1]||A[i+2]!==B[i+2]||A[i+3]!==255)bad++}
     ok(n>60&&bad<=n*.01,'the '+nm+' bridge\'s picture is cut from the chunks\' own drawing: '+n+' px, '+bad+' otherwise (the rapids\' or ore\'s strokes over it)')}
    // (a fishing boat under its middle: its hull under the deck)
    const T=c.tiles[c.tiles.length>>1],tx=T%MW,ty=(T/MW)|0,mid=(hor(c)?ty:tx)*TILE+8,x=hor(c)?(tx+.5)*TILE:mid-3,y=hor(c)?mid-4:(ty+.5)*TILE-4;
    const s=t.asShip({k:'fish',home:t.TOWNS[0].name,x,y,path:[],i:0,seed:4,dir:1,state:'out',big:false});
    clear();P.x=x+30;P.y=y+60;P.stay=null;P.tx=null;t.reveal();W.ships=[s];const D=t.decksOver(s,t.shipSprite(s));
    ok(D&&D.list.includes(d)&&D.top===d.y,'a boat whose waterline lies above the '+nm+' bridge\'s last row and meets it is under it');
    const A=shot(),B=forced(shot);W.ships=[];const Z=shot();W.ships=[s];
    const cam={x:Math.floor(G.cam.x),y:Math.floor(G.cam.y)},sp=t.shipSprite(s),bx=t.shipBox(sp,Math.round(s.x-cam.x),Math.round(s.y+4-cam.y)+(Math.floor(now/450+s.seed)%2)),M=d.cv.getContext('2d').getImageData(0,0,w,h).data,W0=c0.width;
    let inM=0,same=0,was=0,out=0;
    for(let py=0;py<c0.height;py++)for(let px=0;px<W0;px++){const i=(py*W0+px)*4,u=px+cam.x-d.x,v=py+cam.y-d.y,m=u>=0&&v>=0&&u<w&&v<h&&M[(v*w+u)*4+3]&&px>=bx[0]&&px<bx[2]&&py>=bx[1]&&py<bx[3];
     const dz=A[i]!==Z[i]||A[i+1]!==Z[i+1]||A[i+2]!==Z[i+2],db=B[i]!==Z[i]||B[i+1]!==Z[i+1]||B[i+2]!==Z[i+2];
     if(m){inM++;if(!dz)same++;if(db)was++}else if(A[i]!==B[i]||A[i+1]!==B[i+1]||A[i+2]!==B[i+2])out++}
    ok(inM>20&&same===inM&&was>10,'over it the deck\'s own pixels: '+same+' of '+inM+' px of the deck in its box as the frame without it ('+was+' were the boat\'s, drawn over the deck before)');
    ok(!out,'and nothing else on the screen changed ('+out+' px)')}
   // ---- away from the bridges: as before
   {const z=ports[0],dk=z&&t.dockOf(z);if(dk){const s=t.asShip({k:'fish',home:z.name,x:(dk.tx+.5)*TILE,y:(dk.ty+.5)*TILE,path:[],i:0,seed:3,dir:-1,state:'fish',until:1e9,big:false}),far=!t.decksOver(s,t.shipSprite(s));
     clear();P.x=s.x;P.y=s.y+40;t.reveal();W.ships=[s];const A=shot(),B=forced(shot);let d=0;for(let i=0;i<A.length;i++)if(A[i]!==B[i])d++;
     ok(far&&!d,'a boat away from the bridges is under none, and drawn as before: pixel-identical ('+d+' bytes)')}}
   // ---- at the screen's 3x: the deck put back on the scene's whole pixels (a boat at a fraction of a pixel)
   {const c=cases[0],T=c.tiles[c.tiles.length>>1],tx=T%MW,ty=(T/MW)|0,mid=(hor(c)?ty:tx)*TILE+8,x=hor(c)?(tx+.5)*TILE+.37:mid-3.37,y=hor(c)?mid-4.29:(ty+.5)*TILE-4.29;
    const s=t.asShip({k:'trade',home:t.TOWNS[0].name,to:t.TOWNS[0].name,x,y,path:[],i:0,seed:4,dir:1,state:'out',big:true,goods:{}});clear();P.x=x+30.3;P.y=y+60.2;t.reveal();W.ships=[s];
    const bad=[];let n=0;const di0=g.drawImage;ev('VS=3');g.drawImage=function(img,...a){if(img===t.UNDER_CV){n++;const m=this.getTransform(),isI=v=>Math.abs(v-Math.round(v))<1e-3;if(!isI(m.e+m.a*a[4])||!isI(m.f+m.d*a[5])||!isI(m.a*a[6]))bad.push(a.slice(4).join(','))}return di0.apply(this,[img,...a])};
    try{shot()}finally{g.drawImage=di0;ev('VS=1')}ok(n>0&&!bad.length,'at 3x a trade ship\'s deck is put back on whole pixels ('+n+' drawn'+(bad.length?': '+bad.join('; '):'')+')')}
   // ---- what it costs: a frame with a ship under a bridge, and one with the deck left out (the same ship)
   {const c=cases[0],T=c.tiles[c.tiles.length>>1],tx=T%MW,ty=(T/MW)|0,mid=(hor(c)?ty:tx)*TILE+8,x=hor(c)?(tx+.5)*TILE:mid-3,y=hor(c)?mid-4:(ty+.5)*TILE-4;
    const ss=[0,1,2,3].map(k=>t.asShip({k:k?'fish':'trade',home:t.TOWNS[0].name,to:t.TOWNS[0].name,x:x+(hor(c)?k*5-8:0),y:y+(hor(c)?0:k*5-8),path:[],i:0,seed:4+k,dir:1,state:'out',big:!k,goods:{}}));clear();P.x=x+30;P.y=y+60;t.reveal();W.ships=ss;
    const time=f=>{const t0=pn.call(performance);for(let i=0;i<40;i++)f();return(pn.call(performance)-t0)/40},sc=()=>t.drawWorld();shot();
    const a=time(sc),b=forced(()=>time(sc));let u=0;{const t0=pn.call(performance);for(let i=0;i<2000;i++)for(const s of ss)t.decksOver(s,t.shipSprite(s));u=(pn.call(performance)-t0)/2000/ss.length*1000}
    ok(a-b<1.5,'its cost: a world frame with 4 ships under a bridge '+a.toFixed(2)+' ms, '+b.toFixed(2)+' ms with the decks left out; looking for the bridges over a ship '+u.toFixed(1)+' µs')}
  }finally{performance.now=pn;W.ships=[];clear()}}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
