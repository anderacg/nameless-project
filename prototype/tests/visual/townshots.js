'use strict';
// Not a test: the world map's towns of models (stage 3 of the building redesign), seen in the game at its zoom with its figures: a
// town of each culture at each tier it has, a castle, a frost town, a desert town, a port, estates, a bandit camp, a cave, a
// shrine. Each drawn by drawWorld (the fog lifted, by day, its townsfolk about) with a x3 crop of its middle, printed as
// "SHOT <name> <data URL>" lines (decode them into PNGs). ?only=name,name (names as printed); ?town=Name (just that holding)
window.RUN=()=>{const o=[],t=T,G=t.G,P=t.P,W=t.W,TL=16;
try{
 window.requestAnimationFrame=()=>0;Math.random=t.seeded(4242);t.act('begin','soldier');G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();
 (0,eval)('drawWorldFog=function(){}');W.seen&&W.seen.fill&&W.seen.fill(1);W.sites.forEach(s=>s.seen=true);
 const q=new URLSearchParams(location.search),only=(q.get('only')||'').split(',').filter(Boolean),one=q.get('town'),shots=[];
 const cult=z=>typeof t.holdingCulture==='function'?t.holdingCulture(z):({vale:'vale',karn:'karn',sylvan:'sylvan',horde:'ashgor',salt:'league'})[t.HOME[z.name]];
 const snap=(name,x,y,dy)=>{if(only.length&&!only.includes(name))return;P.x=x;P.y=y+(dy||0);P.tx=null;G.clock=t.DAY*.3;W.folk=[];for(let i=0;i<240;i++)t.updateFolk(.05);
  t.drawWorld();t.drawWorld();const cv=t.cv;shots.push(['SHOT '+name,cv.toDataURL('image/png')]);
  const c=document.createElement('canvas');c.width=cv.width;c.height=cv.height;const g=c.getContext('2d');g.imageSmoothingEnabled=false;const w=Math.round(cv.width/3),h=Math.round(cv.height/3);
  g.drawImage(cv,Math.round((cv.width-w)/2),Math.round((cv.height-h)/2),w,h,0,0,w*3,h*3);shots.push(['SHOT '+name+'_x3',c.toDataURL('image/png')]);o.push('INFO '+name+' at '+Math.round(x/TL)+','+Math.round(y/TL))};
 // (a holding: the middle of its buildings near its centre)
 const at=z=>{const c=z.lots.find(l=>l.k==='centre');return[(c.x+c.n/2)*TL,(c.y+c.n/2)*TL]};
 if(one){const z=t.townBy(one);snap(one.replace(/\W/g,'')+'_'+z.kind,...at(z),24)}
 else{
  const seen=new Set();for(const z of t.TOWNS){const k=cult(z)+'_'+z.kind;if(seen.has(k)||z.kind==='castle')continue;seen.add(k);snap(k+'_'+z.name.replace(/\W/g,''),...at(z),24)}
  {const z=t.TOWNS.find(q=>q.kind==='castle');snap('castle_'+cult(z)+'_'+z.name.replace(/\W/g,''),...at(z),24)}
  for(const c of ['frost','desert','swamp']){const z=t.TOWNS.find(q=>t.climAt(q.x,q.y-8)===c);if(z)snap(c+'_'+z.kind+'_'+z.name.replace(/\W/g,''),...at(z),24)}
  {const z=t.TOWNS.find(q=>q.style==='port'&&t.lotAt(q,'port'));if(z){const l=t.lotAt(z,'port');snap('port_'+z.name.replace(/\W/g,''),(l.x+1)*TL,(l.y+1)*TL)}}
  for(const k of ['farm','market','brewery','mine','lumber']){const z=t.TOWNS.find(q=>q.lots&&t.lotAt(q,k)&&t.bldLv(q,k));if(!z)continue;const l=t.lotAt(z,k);snap('estate_'+k+'_'+l.type+'_'+z.name.replace(/\W/g,''),(l.x+l.n/2)*TL,(l.y+l.n/2)*TL)}
  {const c=t.camps()[0];if(c)snap('bandit_camp',c.x,c.y)}
  for(const ty of ['cave','shrine','ruins','hideout','travelers']){const s=W.sites.find(x=>x.type===ty);if(s)snap('site_'+ty,s.x,s.y)}}
 for(const [k,v] of shots)o.push(k+' '+v);
 o.push('PASS townshots: '+shots.length+' pictures');
}catch(e){o.push('EXC '+e.message+'\n'+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.join('\n');document.body.appendChild(d)};
