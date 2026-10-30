'use strict';
// Make camp (doc/SUPPLY_DESIGN.md §7, world/supply.js): Z, the dock's Camp (and the action ring: tests/ring.js). Your band stops
// and pitches its tents: stamina +8 an hour, the wounded mend faster, food and drink at the rest rate; any travel order breaks
// camp; going faster than 1x, anything hostile in sight brings the speed back to 1x; a band that finds you in camp catches you
// unready; there is no camping inside a holding; the camp is drawn in your place, and saved. Only on allowed ground (the owner,
// 2026-10-22, 2026-10-23): where you stand if it is; else within SUPPLY.camp.hop tiles your band steps there and pitches at once,
// farther (within SUPPLY.camp.r) it walks there and pitches; none near (a wood, a swamp): no camp. Never on a road, track, bridge,
// ford, water, pond, lot, holding's ring, site, field or brook. Drawn by its feet among the trees, none of them faded over it; your
// figure and host hidden while you camp, your banner on a pole in it.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),toast0=window.toast;
try{
 const t=T,G=t.G,P=t.P,S=t.SUPPLY,ev=s=>(0,eval)(s);
 Kit.begin('soldier',4242);Kit.clear();Kit.world();
 const spot=(()=>{for(let ty=8;ty<t.MH-8;ty++)for(let tx=8;tx<t.MW-8;tx++){const x=(tx+.5)*16,y=(ty+.5)*16;if(t.tAt(tx,ty)===t.T_OPEN&&t.climAt(x,y)==='grass'&&!t.TOWNS.some(h=>Math.hypot(h.x-x,h.y-y)<160)&&!t.nearWater(x,y,4)&&t.campGround(x,y))return [x,y]}})();// (clear ground: the camp pitched at once)
 const bag=g=>{for(const k of ['water','ale','liquor',...t.FOODS])t.goodTake(k,1e9);for(const k in g)t.playerInventory.add('good',k,g[k])};
 const reset=()=>{Kit.world();Kit.goTo(spot[0],spot[1]);P.troops={hum_levy:5};P.wounded={};P.woundedGroups=[];P.comps={};P.bsta=50;P.morale=60;ev('BAND=freshBand()');G.speed=1;G.encCool=99;G.clock=t.DAY*.3;bag({water:200,grain:60})};
 // (what is said: on screen, as the journal keeps no camp orders; every line logged is shown so too)
 const said=[],msgs=re=>said.filter(m=>re.test(m)).length;window.toast=(m,c)=>{said.push(m);toast0(m,c)};
 // ---- Z, and the dock
 reset();Kit.key('KeyZ','z');ok(!!P.camp&&P.tx==null&&msgs(/makes camp/)===1,'Z: your band makes camp');
 t.updateHUD(true);{const tags=[...document.querySelectorAll('#stats .pc-tags .tag')].map(x=>x.textContent);ok(tags.includes('In camp')&&document.getElementById('campBtn').classList.contains('on'),'the card says In camp, the dock’s Camp is lit')}
 {const L=t.supplyLand();ok(t.staminaRate(false,t.drinkNext(L),L).n===S.rest.camp,'in camp stamina comes back +'+S.rest.camp+' an hour');const b0=P.bsta;t.supplyHour();ok(Math.abs(P.bsta-b0-S.rest.camp)<1e-9,'and an hour passes so ('+Math.round(b0)+' → '+Math.round(P.bsta)+')')}
 Kit.key('KeyZ','z');ok(!P.camp&&msgs(/breaks camp/)===1,'Z again: it breaks camp');
 document.getElementById('campBtn').click();ok(!!P.camp,'the dock’s Camp makes camp');document.getElementById('campBtn').click();ok(!P.camp,'and breaks it');
 // ---- a travel order breaks it
 reset();t.makeCamp();P.tx=P.x+60;P.ty=P.y;t.updateWorld(.05);ok(!P.camp&&P.tx!=null,'a travel order breaks camp, and you march');
 // ---- not inside a holding
 reset();{const h=Kit.goHome();P.rep[h.name]=40;t.startStay(h);ok(!t.makeCamp()&&!P.camp&&/staying/.test(t.campWhy()),'no camp while you stay in a holding ('+t.campWhy()+')');t.leaveStay();Kit.world()}
 // ---- faster than 1x, anything hostile in sight brings it back
 reset();t.makeCamp();t.setSpeed(8);t.updateWorld(.02);ok(G.speed===8&&!!P.camp,'fast forward in camp, with nothing in sight: it stays 8x');
 {t.bandits.push(t.asParty({x:P.x+40,y:P.y,n:4,kind:'bandits',cool:99,t:0,a:0,idle:true}));t.updateWorld(.02);
  ok(G.speed===1&&!!P.camp&&msgs(/camp stirs/)>=1,'bandits come into sight: back to 1x, still in camp ('+t.dangerInSight()+')');t.bandits.length=0}
 // ---- the wounded mend faster in camp
 reset();{const heal=camp=>{P.camp=camp?{at:0}:null;P.wounded={hum_levy:10};P.woundedGroups=[];P.troops={};Kit.stub(0,()=>t.woundedDay());return 10-(P.wounded.hum_levy||0)};
  const a=heal(false),b=heal(true);ok(b>a&&b===Math.floor(10*.2*S.camp.heal),'the wounded mend ×'+S.camp.heal+' in camp ('+a+' a day out of it, '+b+' in it)');P.camp=null}
 // ---- caught in camp
 reset();t.makeCamp();P.morale=60;G.enc={kind:'party',ref:{cool:0,x:P.x+8,y:P.y},list:['militia']};t.startBattle({enemies:['militia'],tournament:false});
 ok(!P.camp&&P.morale===60-S.camp.caught&&msgs(/catch your band in camp/)===1,'a band that finds you in camp catches you unready: morale −'+S.camp.caught+', the camp struck');
 ev('B.over=true;B=null');t.fieldDone();Kit.world();
 // ---- drawn at your figure, and saved
 reset();t.makeCamp();{const e=t.bandCampEnt({x:Math.floor(P.x-t.VW/2),y:Math.floor(P.y-t.VH/2)});let err='';t.ctx.save();try{e.f()}catch(x){err=x.message}t.ctx.restore();ok(!err&&e.y<P.y,'the camp, two tents and a fire, is drawn behind your figure'+(err?' ('+err+')':''));
  const c=t.campAt(P.x,P.y);ok(e.y===c.box[3]&&e.nf&&!e.st,'in the depth order by its feet (y '+e.y+', its lowest pixel), as everyone is: the trees in front drawn over it, none faded for it')}
 // ---- only on clear ground: beside a wood your band walks to the nearest and pitches there
 {const wood=(()=>{for(let ty=8;ty<t.MH-8;ty++)for(let tx=8;tx<t.MW-8;tx++){const x=(tx+.5)*16,y=(ty+.5)*16;if(t.tAt(tx,ty)===t.T_OPEN&&t.tAt(tx,ty-1)===t.T_FOREST&&t.climAt(x,y)==='grass'&&!t.TOWNS.some(h=>Math.hypot(h.x-x,h.y-y)<160)&&!t.nearWater(x,y,4)&&t.campSpot&&(Kit.goTo(x,y),(s=>s&&Math.hypot(s.x-x,s.y-y)>S.camp.hop*16)(t.campSpot())))return [x,y]}})();
  reset();Kit.goTo(wood[0],wood[1]);ok(!t.campGround(P.x,P.y),'(by a wood: the camp would stand over its trees)');ok(t.makeCamp()&&!P.camp&&P.tx!=null&&!!G.pitch,'Make camp there: your band walks to clear ground first ('+Math.round(Math.hypot(P.tx-P.x,P.ty-P.y))+' px)');
  const goal=[P.tx,P.ty];Kit.frames(800,.05,null,()=>!!P.camp||P.tx==null);ok(!!P.camp&&Math.hypot(P.x-goal[0],P.y-goal[1])<3&&t.campGround(P.x,P.y),'and pitches there, on clear ground: no water, wood, swamp or lot under it, nothing standing on it'+(P.camp?'':' (camp '+!!P.camp+', '+Math.round(Math.hypot(P.x-goal[0],P.y-goal[1]))+' px off, going '+P.tx+')'));
  reset();Kit.goTo(wood[0],wood[1]);t.makeCamp();t.worldGo(P.x-60,P.y);const off=!G.pitch;Kit.frames(400,.05,null,()=>P.tx==null);ok(off&&!P.camp,'a travel order on the way calls it off')}
 {const r0=S.camp.r;S.camp.r=4;const R=S.camp.r+1,deep=k=>{for(let ty=R;ty<t.MH-R;ty++)for(let tx=R;tx<t.MW-R;tx++){let all=true;for(let j=-R;j<=R&&all;j++)for(let i=-R;i<=R&&all;i++)if(!k(tx+i,ty+j))all=false;if(all)return [(tx+.5)*16,(ty+.5)*16]}return null};
  const inWood=deep((x,y)=>t.tAt(x,y)===t.T_FOREST),inFen=deep((x,y)=>t.passable(t.tAt(x,y))&&t.CLIMS[t.climate[y*t.MW+x]]==='swamp');
  for(const [w,at] of [['deep in a wood',inWood],['in a swamp',inFen]]){if(!at){o.push('INFO no '+w+' on this map');continue}reset();Kit.goTo(at[0],at[1]);const n=msgs(/No clear ground to camp here/);
   ok(!t.makeCamp()&&!P.camp&&P.tx==null&&msgs(/No clear ground to camp here/)===n+1,w+': no clear ground near, no camp, said in the log (searching '+S.camp.r+' tiles: with the glades and the 12-tile search such places are rare)')}S.camp.r=r0}
 // ---- hidden while camped (the owner, 2026-10-23): no figure or host drawn, your banner on a pole in the camp; back when it breaks
 // (the stealth eye and the fatigue badge over your band only ask where your banner would stand, drawing none: not counted)
 {const draws=()=>{let hero=0,badge=0;const bn=[],ps=window.partySprite,ba=window.bannerAt,dt=window.drawTravelDetection,aside=f=>function(){badge++;try{return f.apply(this,arguments)}finally{badge--}};
    window.partySprite=function(c){if(c==='#e8b94a'&&!badge)hero++;return ps.apply(this,arguments)};window.bannerAt=function(o){if(!badge)bn.push(o);return ba.apply(this,arguments)};
    window.drawTravelDetection=aside(dt);
    try{t.drawWorld()}finally{window.partySprite=ps;window.bannerAt=ba;window.drawTravelDetection=dt}return{hero,bn}};
  reset();const a=draws();ok(a.hero>0&&a.bn.includes(P),'(out of camp your figure and its banner are drawn)');
  t.makeCamp();const b=draws(),pole=b.bn.find(o=>o!==P&&o.faction==='player'),c=t.campAt(P.x,P.y),px=pole&&pole.x-2,py=pole&&pole.headY()-t.BANNER_GAP;
  ok(!!P.camp&&!b.hero&&!b.bn.includes(P),'in camp your figure, host and the banner over you are not drawn');
  ok(pole&&px>=c.box[0]-4&&px<=c.box[2]+4&&py>=c.box[1]&&py<=c.box[3]+1,'your banner stands on a pole planted in the camp'+(pole?' ('+Math.round(px)+','+py+' in '+c.box.map(Math.round)+')':''));
  const at=[P.x,P.y];t.breakCamp();const d=draws();ok(d.hero>0&&d.bn.includes(P)&&P.x===at[0]&&P.y===at[1],'the camp broken, your figure is drawn again at its spot')}
 // ---- only on allowed ground (the owner, 2026-10-23): from many spots on the roads and round the holdings, the camp never stands
 // on a road or track (its tile or its band as painted), a crossing, a ford, water (a pond's too), a lot, a holding's ring, a site,
 // a field or a brook, nor on ground the art keeps clear
 {const MW=t.MW,plan=t.WorldArt.ensure(),SG=plan.segs,X=new Set(),BK=t.GEN_RIVER.brook,M=plan.clear;for(const c of t.WM.crossings)for(const i of [c.i,c.j,...c.tiles])X.add(i);
  const rings=t.TOWNS.map(h=>{const b=t.centreBox(h),r=[b.x,b.y,b.x+b.n-1,b.y+b.n-1];for(const l of h.lots||[])if(l.k==='centre'||l.k==='house'){r[0]=Math.min(r[0],l.x);r[1]=Math.min(r[1],l.y);r[2]=Math.max(r[2],l.x+l.n-1);r[3]=Math.max(r[3],l.y+l.n-1)}return r});
  const sites=t.W.sites.map(q=>{const sp=t.siteSprite(q),X0=Math.round(q.x)-sp.ax,Y0=Math.round(q.y)+8-sp.ay,a=t.opaqueBox(sp);return[X0+a[0],Y0+a[1],X0+a[2],Y0+a[3]]});
  const bad=(x,y)=>{const [x0,y0,x1,y1]=t.campAt(x,y).box,tx0=Math.floor(x0/16),ty0=Math.floor(y0/16),tx1=Math.floor(x1/16),ty1=Math.floor(y1/16);
   for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){const i=ty*MW+tx,k=t.tAt(tx,ty),id=t.occAt(tx,ty),l=id>0&&t.lotOf(tx,ty);
    if(k===t.T_ROAD&&(tx+.5)*16>=x0&&(tx+.5)*16<=x1&&(ty+.5)*16>=y0&&(ty+.5)*16<=y1)return 'a road tile';if(k===t.T_WATER)return 'water';if(k===t.T_FORD)return 'a ford';if(k===t.T_MOUNT)return 'a peak';if(k===t.T_FOREST)return 'a wood';
    if(X.has(i))return 'a crossing';if(!(t.WM.river[i]&3)&&(t.WM.flow[i]&31)>=BK)return 'a brook';if(l)return (l.plots||[]).some(([a,b])=>a===tx&&b===ty)?'a field':'a lot';if(id)return 'a bandits\' camp';
    if(rings.some(r=>tx>=r[0]&&tx<=r[2]&&ty>=r[1]&&ty<=r[3]))return 'a holding\'s ring'}
   if(sites.some(q=>x1>=q[0]&&x0<=q[2]&&y1>=q[1]&&y0<=q[3]))return 'a site';
   for(let k=0;k<SG.length;k+=5){const hw=Math.max(t.segW(SG[k+4],0),t.segW(SG[k+4],1)),a=SG[k],b=SG[k+1],c=SG[k+2],d=SG[k+3];
    if(Math.max(a,c)+hw<x0||Math.min(a,c)-hw>x1||Math.max(b,d)+hw<y0||Math.min(b,d)-hw>y1)continue;const n=Math.max(1,Math.ceil(Math.hypot(c-a,d-b)/2));
    for(let j=0;j<=n;j++){const px=a+(c-a)*j/n,py=b+(d-b)*j/n,dx=Math.max(x0-px,0,px-x1),dy=Math.max(y0-py,0,py-y1);if(Math.hypot(dx,dy)<=hw)return 'a road\'s painted band'}}
   for(let y=Math.floor(y0);y<=y1;y++)for(let x=Math.floor(x0);x<=x1;x++)if(M.at(x,y))return 'ground kept clear';
   return ''};
  let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647,roads=[];for(let i=0;i<t.MW*t.MH;i++)if(t.tiles[i]===t.T_ROAD)roads.push(i);
  const from=[];for(let k=0;k<40;k++){const i=roads[Math.floor(rnd()*roads.length)];from.push([(i%MW+.5)*16+rnd()*8-4,(Math.floor(i/MW)+.5)*16+rnd()*8-4])}
  for(let k=0;k<30;k++){const h=t.TOWNS[Math.floor(rnd()*t.TOWNS.length)];from.push([h.x+(rnd()*12-6)*16,h.y+(rnd()*12-6)*16])}
  const fails=[];let n=0,none=0;for(const [x,y] of from){P.x=x;P.y=y;P.tx=null;P.stay=null;const s=t.campSpot();if(!s){none++;continue}n++;const w=bad(s.x,s.y);if(w)fails.push(w+' at '+Math.round(s.x)+','+Math.round(s.y))}
  ok(!fails.length&&n>=from.length/2,'from '+from.length+' spots on the roads and round the holdings, '+n+' camps, none on a road, track, crossing, ford, water, lot, holding\'s ring, site, field or brook ('+none+' with none in reach)'+(fails.length?': '+fails.slice(0,5).join('; '):''));
  // ---- on a road: within a hop the band steps to the allowed ground beside it and pitches at once; farther it walks there
  const near=from.slice(0,40).find(([x,y])=>{P.x=x;P.y=y;const s=t.campSpot();return s&&!s.across&&Math.hypot(s.x-x,s.y-y)>2&&Math.hypot(s.x-x,s.y-y)<=S.camp.hop*16});
  if(!near)ok(false,'(a road with allowed ground within a hop)');else{reset();Kit.goTo(near[0],near[1]);const s=t.campSpot(),d=Math.hypot(s.x-P.x,s.y-P.y);
   ok(t.makeCamp()&&!!P.camp&&P.x===s.x&&P.y===s.y&&!G.pitch&&P.tx==null&&!bad(P.x,P.y),'on a road, Make camp pitches at once on the allowed ground beside it, the band stepped there ('+Math.round(d)+' px)')}
  const far=from.find(([x,y])=>{P.x=x;P.y=y;const s=t.campSpot();return s&&Math.hypot(s.x-x,s.y-y)>S.camp.hop*16});
  if(!far)o.push('INFO no spot with its allowed ground beyond a hop');else{reset();Kit.goTo(far[0],far[1]);const s=t.campSpot();
   ok(t.makeCamp()&&!P.camp&&!!G.pitch&&P.tx===s.x&&P.ty===s.y,'farther than '+S.camp.hop+' tiles the band walks there first ('+Math.round(Math.hypot(s.x-P.x,s.y-P.y))+' px)');
   Kit.frames(800,.05,null,()=>!!P.camp||P.tx==null);ok(!!P.camp&&Math.hypot(P.x-s.x,P.y-s.y)<3&&!bad(P.x,P.y),'and pitches there, on allowed ground')}}
 reset();t.makeCamp();G.mode='world';t.saveGame(true,'quick');ev('BAND=freshBand()');ok(!P.camp,'(a fresh record has no camp)');t.loadGame('quick');ok(!!P.camp,'saved and loaded in camp');
 // ---- glades in the woods (worldgen.js GEN_GLADE; the owner, 2026-10-30: "more open field in forest") and the farther search
 {Kit.begin('soldier',1);const K=t.WM.kind,W=t.MW,gl=t.WM.glades||[],X=t.GEN_GLADE;let open=0;for(const i of gl)if(K[i]===t.T_OPEN)open++;
  ok(gl.length>=10&&open>=gl.length*.8&&S.camp.r>=12,gl.length+' glades in the woods ('+open+' still open ground at their middle once the holdings and roads are placed); Make camp looks '+S.camp.r+' tiles round you');
  let s0=7,n=0,found=0;const rr=()=>(s0=(s0*1103515245+12345)%2147483648)/2147483648;
  for(let k=0;k<6000&&n<120;k++){const i=Math.floor(rr()*K.length);if(K[i]!==t.T_FOREST||!(t.WM.feat[i]&8))continue;n++;P.x=(i%W+.5)*t.TILE;P.y=(Math.floor(i/W)+.5)*t.TILE;if(t.campSpot())found++}
  ok(n>=60&&found>=n*.6,'deep in a wood your band finds ground to camp from '+found+' of '+n+' places (it was about 1 in 9)')}
 Kit.begin('soldier',4242);ok(!P.camp,'a new game: no camp');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{window.toast=toast0}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
