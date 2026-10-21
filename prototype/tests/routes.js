'use strict';
// Walking to a point: patrols on their beat, workers to their fields, companions' parties and bands to camp go straight when
// nothing is in the way, else by a route over land and bridges, and pick another point when there is no way at all. On an
// island village (Willowmere, ringed by water and bridges) nobody stands stuck at the shore.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}t.act('begin','soldier');G.quietEvents=true;W.monsters=[];W.critters=[];t.bandits.length=0;
 const v=t.townBy('Willowmere');ok(!!v,'Willowmere, the island village');
 // the map: short bridges only, no holding on an island, walkers kept to the deck
 {const MW=t.MW,MH=t.MH,runs=[],seen=new Uint8Array(MW*MH);for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const b=t.bridgeAt(x,y);if(!b||seen[y*MW+x])continue;let n=0,cx=x,cy=y;while(t.bridgeAt(cx,cy)===b){seen[cy*MW+cx]=1;n++;cx+=b===2?1:0;cy+=b===1?1:0}runs.push(n)}
  // (today's map: its road decks over water, 6 at most; a generated world: its bridges, WM.crossings, whose decks bridgeAt reads
  // like a road squeezed between two waters)
  const gen=t.WM.gen!=='classic-0',br=gen?t.WM.crossings.filter(c=>c.kind==='bridge').map(c=>c.tiles.length):runs;
  ok((gen||br.length<=6)&&br.every(n=>n<=3),'few bridges, none longer than 3 tiles ('+br.length+': '+br.join(', ')+')');
  const comp=new Int32Array(MW*MH).fill(-1),size=[];let c=0;for(let i=0;i<MW*MH;i++){if(comp[i]>=0||!t.passable(t.tiles[i]))continue;let k=0;const q=[i];comp[i]=c;while(q.length){const j=q.pop();k++;const x=j%MW,y=(j/MW)|0;for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const m=(y+b)*MW+x+a;if(comp[m]>=0||!t.passable(t.tiles[m]))continue;comp[m]=c;q.push(m)}}size.push(k);c++}
  const big=size.indexOf(Math.max(...size)),isl=t.TOWNS.filter(q=>comp[q.ty*MW+q.tx]!==big).map(q=>q.name);ok(!isl.length,'no holding stands cut off on an island (bridge decks count as land: an isle its bridges join is on the main land)'+(isl.length?': '+isl.join(', '):''));
  const bx=(()=>{for(let y=0;y<MH;y++)for(let x=0;x<MW;x++)if(t.bridgeAt(x,y))return[x,y,t.bridgeAt(x,y)]})();
  if(bx){const w={x:(bx[0]+.5)*16+(bx[2]===1?5:0),y:(bx[1]+.5)*16+(bx[2]===2?5:0)};t.walk(w,bx[2]===1?0:1,bx[2]===1?1:0,2);ok(Math.abs((bx[2]===1?w.x:w.y)-((bx[2]===1?bx[0]:bx[1])+.5)*16)<4,'on a bridge, walkers keep to the middle of the deck')}else ok(true,'(no bridges)')}
 // a route across the water
 {let pair=null;for(const l of v.lots||[]){const x=(l.x+l.n/2)*16,y=(l.y+l.n)*16+6;if(t.passable(t.terrAt(x,y))&&!t.clearLine(v.x,v.y+12,x,y)){pair=[x,y];break}}
  /* (every building in sight of the gate: then open ground nearby that the water hides from it) */for(let r=40;!pair&&r<=200;r+=16)for(let k=0;k<16&&!pair;k++){const x=v.x+Math.cos(k*Math.PI/8)*r,y=v.y+12+Math.sin(k*Math.PI/8)*r;if(t.passable(t.terrAt(x,y))&&!t.clearLine(v.x,v.y+12,x,y))pair=[x,y]}
  ok(!!pair,'(fixture: ground near the gate that the water hides from it)');
  if(pair){const path=t.findPath(v.x,v.y+12,pair[0],pair[1]);ok(path&&path.length&&path.every(k=>t.passable(t.tiles[k])),'where water lies between, a route goes round it ('+(path&&path.length)+' tiles)');
   const w={x:v.x,y:v.y+12};let i=0;for(;i<4000&&Math.hypot(w.x-pair[0],w.y-pair[1])>2;i++)t.routeTo(w,pair[0],pair[1],1.2);ok(Math.hypot(w.x-pair[0],w.y-pair[1])<=2,'and a walker gets there by it ('+i+' steps)')}}
 {const sea=(()=>{for(let ty=5;ty<t.MH-5;ty++)for(let tx=5;tx<t.MW-5;tx++)if(t.tAt(tx,ty)===t.T_WATER&&[[1,0],[-1,0],[0,1],[0,-1],[2,0],[-2,0],[0,2],[0,-2]].every(([a,b])=>t.tAt(tx+a,ty+b)===t.T_WATER))return[(tx+.5)*16,(ty+.5)*16]})();
  const w={x:v.x,y:v.y+12};ok(t.findPath(w.x,w.y,sea[0],sea[1])===null&&t.routeTo(w,sea[0],sea[1],2)===false,'a point in the water cannot be reached, and the walker is told so')}
 // every stop on the beat, and every estate's work, can be walked to from the gate (on any holding)
 {const go=(x0,y0,x,y)=>{const w={x:x0,y:y0};for(let i=0;i<6000&&Math.hypot(w.x-x,w.y-y)>3;i++)if(!t.routeTo(w,x,y,1.5))return null;return Math.hypot(w.x-x,w.y-y)<=3};
  const miss=[];for(const q of t.TOWNS){const sp=t.bldSpots(q);for(const k in sp){const s=sp[k];if(!t.passable(t.terrAt(s.x,s.y)))continue;const r=go(q.x,q.y+12,s.x,s.y);if(r===false)miss.push(q.name+' '+k)}
   for(const l of q.lots||[])for(let c=0;c<4;c++){const x=(l.x+(c&1?l.n:0))*16+(c&1?5:-5),y=(l.y+(c&2?l.n:0))*16+(c&2?7:-3);if(!t.passable(t.terrAt(x,y))||t.findPath(q.x,q.y+12,x,y)===null)continue;if(go(q.x,q.y+12,x,y)===false)miss.push(q.name+' lot '+l.id)}}
  ok(!miss.length,'from every holding’s gate, its guards and workers reach every stop and every estate they can get to'+(miss.length?': '+miss.slice(0,6).join('; '):''))}
 // the patrol on its beat
 {G.clock=t.DAY*.3;W.patrols=[];t.ensureEcon(v);v.gar=Math.max(v.gar,12);t.sendWatch(v);const p=W.patrols.find(q=>q.home===v.name);
  if(p){const seen=new Set(),x0=p.x,y0=p.y;let moved=0,lx=p.x,ly=p.y;for(let i=0;i<1600;i++){t.updatePatrols(.05);if(p.last!=null)seen.add(p.last);moved+=Math.hypot(p.x-lx,p.y-ly);lx=p.x;ly=p.y}
   ok(seen.size>=3&&moved>150,'Willowmere’s guards walk their beat from building to building ('+seen.size+' stops, '+Math.round(moved)+' px)')}
  else ok(false,'Willowmere sends no patrol')}
 // the workers
 {W.folk=[];G.clock=t.DAY*.5;P.x=v.x;P.y=v.y+30;let came=0;for(let i=0;i<2400;i++){G.clock=t.DAY*.6;t.updateFolk(.05);came=Math.max(came,W.folk.filter(f=>f.home===v.name&&(f.st==='town'||f.st==='back'||f.st==='in'&&f.done===G.day)).length)}
  const all=W.folk.filter(f=>f.home===v.name);ok(came>0,'its workers bring their loads to it and go back ('+came+' of '+all.length+')')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
