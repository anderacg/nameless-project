'use strict';
// Encounters on the road (world/encounters.js, world/road.js, doc/ENCOUNTERS_DESIGN.md phases 1 and 2): the pity timer (travel only, met resets it,
// passed by takes 25–50% off), at most 2 a day and no kind again within 5 days, placed past your sight on its own ground, each
// behaviour (approach, stay, flee, scene), their lifetimes and leaving when you are far, the traces, the highlights ("!", the
// glow, the call-out, the arrow at the screen's edge), a click opens the page, each of the 14 kinds' page, choices and outcomes
// (today's events'), the ambush hidden below Scouting 2 and springing as you pass, the save, the weather still instant, and
// nothing drawn leaking a shift into the ground's scene. Phase 2's eight new kinds: where and when each comes, its behaviour (the
// cart stays, the thief runs across your view and is chased on the map, the poacher runs if he sees you first, the processions
// walk the roads to their end, the horse bolts then grazes, the beggar and the messenger walk and ride up), every choice's outcome,
// a confirm before each robbery, their lifetimes and the abandoned cart. Phase 4: the pilgrims (walking the roads to a real
// shrine and ending there, or praying at one near you; no shrine of their own), the fake wounded (a lure: the wounded traveller
// to the eye, its Insight at Scouting 0, 3 and 5, each choice, left be) and the sealed letter (its contents, the witness, its
// page's verbs and their conditions, stale, saved and loaded). How they end: nothing ends while you can see it (each kind its way,
// gone once out of your sight; out of it, as ever; the caps; saved and loaded mid-leave and mid-prayer). Your stats on the road
// (ENC_STAT: stats only add): each check at 0 is today's, rising to its cap and never under today's; the horse's odds as they
// were; the Insight read; Tend his wounds always heals, its care rising with Medicine
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,TILE=t.TILE,ev=s=>(0,eval)(s);try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=false;
 const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)],panel=()=>document.getElementById('panel').innerHTML,txt=()=>(q('#panel')||{}).textContent||'';
 const world=()=>{t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.road=null;G.chase=null;P.tx=null;G.encCool=0;G.paused=false};
 const clear=()=>{t.bandits.length=0;W.lords.forEach(l=>{l.x=-9999;l.y=-9999});W.monsters=[];W.caravans=[];W.refugees=[];W.folk=[];W.patrols=[];W.fights=[];W.critters=[];W.road=null};
 const R=()=>t.roadSt(),D=k=>t.ROAD_ENC[k],r0=Math.random;
 // (the dice fixed while fn runs: the road's and the letter's streams (core/rng.js, S4) and Math.random for the rest, all
 // drawing from v, as Math.random alone did before the streams)
 const stub=(v,fn)=>Kit.stub(v,()=>Kit.stubStream('road',v,()=>Kit.stubStream('letters',v,fn)));
 // a place: open, walkable ground all round (12 tiles; a pond or an oasis, 1-4 tiles of water, is no barrier: worldgen.js
 // m.ponds, m.oases), a road through it, far from holdings and sites; no wood east of it as far as your sight and a third
 // more (the checks below set things there, P.x + 1.05 x your sight, and woods hide them: Encounter inView, spotted)
 const far=(tx,ty)=>t.TOWNS.every(z=>Math.hypot(z.tx-tx,z.ty-ty)>10);
 // (the test spot has a holding near enough for the kinds that want one, the lost child's home: within the law's reach less 2 tiles)
 const nearOne=(tx,ty)=>t.TOWNS.some(z=>Math.hypot(z.tx-tx,z.ty-ty)<t.WORLD_SCALE.law.eventNear-2);
 const around=(tx,ty,r,f)=>{for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)if(!f(t.tAt(tx+i,ty+j)))return false;return true};
 const pond=new Set([...(t.WM.ponds||[]),...(t.WM.oases||[])].flatMap(o=>o.tiles||[o.i])),around2=(tx,ty,r)=>{for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)if(!t.passable(t.tAt(tx+i,ty+j))&&!pond.has((ty+j)*t.MW+tx+i))return false;return true};
 const Vt=Math.ceil(t.vis()/t.visMulAt(t.P.x,t.P.y)*1.35/TILE),bare=(tx,ty)=>{for(let j=-1;j<=1;j++)for(let i=0;i<=Vt;i++)if(t.tAt(tx+i,ty+j)===t.T_FOREST)return false;return true};
 let home=null;for(let ty=16;ty<t.MH-16&&!home;ty++)for(let tx=16;tx<t.MW-16&&!home;tx++)if(t.tAt(tx,ty)===t.T_ROAD&&far(tx,ty)&&nearOne(tx,ty)&&around(tx,ty,4,x=>x===t.T_OPEN||x===t.T_ROAD)&&around2(tx,ty,11)&&bare(tx,ty)&&t.climAt((tx+.5)*TILE,(ty+.5)*TILE)==='grass')home={tx,ty,x:(tx+.5)*TILE,y:(ty+.5)*TILE};
 // (the sites near it taken away: they grow with the world's land (data/world.js DENSITY.grow), and where they fall changes each run)
 if(home)W.sites=W.sites.filter(s=>Math.hypot(s.tx-home.tx,s.ty-home.ty)>4);
 ok(!!home,'a test spot: a road over open grassland ('+(home&&home.tx+','+home.ty)+')');
 const at=(x,y)=>{world();clear();P.x=x;P.y=y;P.stay=null;t.reveal()};const goHome=()=>at(home.x,home.y);
 G.clock=t.DAY*.3;P.troops={hum_levy:6};P.gold=500;P.sk.scout.lv=0;goHome();const V=t.vis();
 const frames=(n,d=.05)=>{for(let i=0;i<n&&G.mode==='world';i++)t.updateRoad(d)};
 const findT2=f=>{for(let ty=12;ty<t.MH-12;ty++)for(let tx=12;tx<t.MW-12;tx++)if(f(tx,ty))return{tx,ty,x:(tx+.5)*TILE,y:(ty+.5)*TILE};return null};
 // (phase 2: a spot for the processions: a road from which both a funeral and a wedding find their way, to a shrine or ruins and
 // to another holding; spawnK: one of a kind 10 px from you, there for those)
 // (out of the desert, where the hours they take would leave the band thirsty. A generated world's few sites may lie off every road
 // a procession walks: then the first shrine or ruins is moved beside a holding, 5 tiles off its gate, until a spot is found)
 const WALKERS=['funeral','wedding'];let walkSpot=null;{const p0=[P.x,P.y],seek=()=>findT2((tx,ty)=>{if(t.tAt(tx,ty)!==t.T_ROAD||(tx+ty)%2||t.climAt((tx+.5)*TILE,(ty+.5)*TILE)==='desert')return false;P.x=(tx+.5)*TILE-10;P.y=(ty+.5)*TILE;W.road=null;
   const fits=WALKERS.every(k=>t.ROAD_ENC[k].ok()&&t.roadSpawn(k,P.x+10,P.y));W.road=null;return fits});walkSpot=seek();
  const S=W.sites.find(x=>x.type==='shrine'||x.type==='ruins');for(const z of t.TOWNS){if(walkSpot||!S)break;const c=[[5,5],[-5,5],[5,-5],[-5,-5]].map(([a,b])=>[z.tx+a,z.ty+b]).find(([x,y])=>t.tAt(x,y)===t.T_OPEN);
   if(c){S.tx=c[0];S.ty=c[1];S.x=(c[0]+.5)*TILE;S.y=(c[1]+.5)*TILE;walkSpot=seek()}}P.x=p0[0];P.y=p0[1]}
 ok(!!walkSpot,'a spot for the processions: a road with a shrine or ruins and another holding within their walk ('+(walkSpot&&walkSpot.tx+','+walkSpot.ty)+')');
 // (phase 4: the pilgrims' spots, by a real shrine: on a road from which the nearest one is past the spawn ring but within their
 // walk (they walk there: pilWalk), and one with a shrine just past your sight (they pray there: pilPray))
 let pilWalk=null,pilPray=null;{const p0=[P.x,P.y],SN=t.ENC_SPAWN.near;
  for(const s of W.sites.filter(s=>s.type==='shrine')){if(pilWalk&&pilPray)break;const stx=Math.floor(s.x/TILE),sty=Math.floor(s.y/TILE);
   for(let r=6;r<=26&&!(pilWalk&&pilPray);r++)for(let a=0;a<24&&!(pilWalk&&pilPray);a++){const tx=stx+Math.round(Math.cos(a*.2618)*r),ty=sty+Math.round(Math.sin(a*.2618)*r);if(t.tAt(tx,ty)!==t.T_ROAD)continue;
    P.x=(tx+.5)*TILE;P.y=(ty+.5)*TILE;W.road=null;const d=Math.hypot(s.x-P.x,s.y-P.y),V0=t.vis();
    if(!pilPray&&d>=V0+10&&d<=V0+SN[1]-10){const e=t.roadSpawn('pilgrims',P.x+10,P.y);if(e&&e.pray)pilPray={x:P.x,y:P.y,s:t.roadShrineOf(e)}}
    else if(!pilWalk&&d>V0+SN[1]+30&&t.climAt(P.x,P.y)!=='desert'){const e=t.roadSpawn('pilgrims',P.x+10,P.y);if(e&&!e.pray)pilWalk={x:P.x,y:P.y,s:t.roadShrineOf(e)}}}}
  W.road=null;P.x=p0[0];P.y=p0[1]}
 ok(!!pilWalk&&!!pilPray,'spots for the pilgrims: walking to the '+(pilWalk&&pilWalk.s.name)+' ('+(pilWalk&&Math.round(pilWalk.x/TILE)+','+Math.round(pilWalk.y/TILE))+'), praying at the '+(pilPray&&pilPray.s.name));
 const spawnK=(k,dx=10,dy=0)=>{if(WALKERS.includes(k))at(walkSpot.x-10,walkSpot.y);else if(k==='pilgrims')at(pilWalk.x,pilWalk.y);else goHome();R().on=[];return t.roadSpawn(k,P.x+dx,P.y+dy)};

 // ---- the pity timer: travel only
 {goHome();t.updateRoad(.05);ok(!W.road,'standing still: no timer kept, nothing saved');
  let want=0;stub(.999,()=>{for(let i=0;i<200;i++){P.x+=.6;t.updateRoad(.05);want+=.05/t.WORLD_PACE*24/t.DAY_SECONDS}});
  ok(W.road&&Math.abs(R().c-want)<1e-6&&R().c>0,'moving on the map, the timer counts the hours travelled ('+R().c.toFixed(3)+' h)');
  const c0=R().c;stub(.999,()=>{for(let i=0;i<50;i++)t.updateRoad(.05)});ok(R().c===c0,'standing still adds nothing');
  G.paused=true;P.tx=P.x+300;P.ty=P.y;stub(.999,()=>{for(let i=0;i<50;i++)t.updateWorld(.05)});ok(R().c===c0&&P.x<P.tx-290,'paused: nothing moves, nothing adds');G.paused=false;
  G.mode='town';stub(.999,()=>{for(let i=0;i<5;i++)t.updateRoad(.05)});ok(R().c===c0,'in a window or a town (no map time): nothing adds');world();
  G.quietEvents=true;stub(.999,()=>{for(let i=0;i<20;i++){P.x+=.6;t.updateRoad(.05)}});ok(R().c===c0,'quiet events (the tests’ switch): the timer holds, as the events do');G.quietEvents=false;
  // the chance: base + rate × hours, capped, by the land
  const S=t.ENC_SPAWN;goHome();R().c=10;const ch=t.roadChance();ok(Math.abs(ch-(S.base+S.rate*10)*S.land.road)<1e-9,'the hour’s chance: base + rate × hours, × the road ('+ch.toFixed(4)+')');R().c=1e6;ok(t.roadChance()===S.cap*S.land.road,'capped at '+S.cap+' (× '+S.land.road+' on a road)');
  // tuned: about one encounter in every one or two days of travel (a day = 24 hours on the road)
  {let sum=0,n=0;const s=t.seeded(42);for(let k=0;k<400;k++){let c=0,h=0;for(;;){h++;c++;const p=Math.min(S.cap,S.base+S.rate*c)*S.land.held;if(s()<p)break}sum+=h;n++}
   const avg=sum/n/24;ok(avg>=1&&avg<=2,'tuned: one comes after '+avg.toFixed(2)+' days of travel on average (on a holding’s land)')}
  // met: 0; passed by: −25–50%; never seen: kept
  R().c=20;R().on=[];const e=t.roadSpawn('traveller',P.x+30,P.y);t.roadMeet(e);ok(R().c===0&&G.mode==='road','met: the timer is back at 0');world();
  const cuts=[];for(let i=0;i<6;i++){goHome();R().c=20;const f=t.roadSpawn('traveller',P.x+30,P.y);f.seen=1;P.x+=V*1.6+80;t.updateRoad(.05);cuts.push(R().c)}
  ok(cuts.every(c=>c>=10-1e-9&&c<=15+1e-9)&&new Set(cuts.map(c=>c.toFixed(3))).size>1,'passed by (seen, left unmet): the timer falls by a quarter to a half ('+cuts.map(c=>c.toFixed(1)).join(', ')+' from 20)');
  goHome();R().c=20;t.roadSpawn('mine',P.x+30,P.y);P.x+=V*1.6+80;t.updateRoad(.05);ok(R().c===20,'one never seen leaves the timer as it was')}

 // ---- at most 2 a day; no kind again within 5 days; one at a time
 {goHome();const first0=s=>{let f=true;return()=>f?(f=false,0):s()};let n=0;const s=t.seeded(11);
  for(let i=0;i<6;i++){R().on=[];if(stub(first0(s),()=>t.roadRoll()))n++}
  ok(n===2&&R().n===2,'at most 2 a day ('+n+' of 6 sure rolls came)');
  G.day++;R().on=[];ok(!!stub(first0(s),()=>t.roadRoll()),'the next day, one comes again');
  // (one about: the one that came, its parts aside: a shepherd who came brings his strays)
  R().n=0;ok(R().on.filter(e=>!e.D.part).length===1&&!stub(first0(s),()=>t.roadRoll()),'none while one is about');
  const kinds=[],s1=t.seeded(100);for(let i=0;i<60;i++){R().on=[];R().n=0;R().cd={traveller:G.day-4};const e=stub(s1,()=>t.roadPick());if(e)kinds.push(e.k)}
  ok(kinds.length>40&&!kinds.includes('traveller'),'a kind not again within 5 days ('+kinds.length+' came, no wounded traveller 4 days after the last)');
  const k2=[],s2=t.seeded(300);for(let i=0;i<120;i++){R().on=[];R().n=0;R().cd={traveller:G.day-5};const e=stub(s2,()=>t.roadPick());if(e)k2.push(e.k)}
  ok(k2.includes('traveller'),'after 5 days it may come again ('+k2.filter(k=>k==='traveller').length+' of '+k2.length+')');R().on=[];R().cd={}}

 // ---- placement: past your sight by 40–120 px, ahead, on its own ground, never in a holding
 {const S=t.ENC_SPAWN,check=(on,m)=>{const ps=[],sd=t.seeded(500);for(let i=0;i<30;i++){const p=stub(sd,()=>t.roadSpot(on));if(p)ps.push(p)}
    const bad=ps.filter(([x,y])=>{const d=Math.hypot(x-P.x,y-P.y),tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);return d<t.vis()+S.near[0]-1e-6||d>t.vis()+S.near[1]+1e-6||!t.passable(t.tAt(tx,ty))||!t.ENC_ON[on](tx,ty)||t.occAt(tx,ty)||t.TOWNS.some(z=>Math.hypot(z.tx-tx,z.ty-ty)<S.hold)});
    ok(ps.length>0&&!bad.length,m+': '+ps.length+' of 30 placed, all '+S.near[0]+'–'+S.near[1]+' px past your sight on '+on+' ground'+(bad.length?' (bad: '+bad.length+')':''));return ps};
  goHome();check('road','by a road');
  // (a camp or a scene beside the road, never on it (the owner's play-test 2: the gamblers played on the road): off the road, no road
  // tile within 1, one within ENC_BY; the gamblers and the wounded traveller there, the walkers (the peddler, the messenger) on it)
  {const ps=check('byroad','beside a road'),nr=(x,y,r)=>t.nearTile(Math.floor(x/TILE),Math.floor(y/TILE),t.T_ROAD,r);
   ok(ps.every(([x,y])=>!nr(x,y,1)&&nr(x,y,t.ENC_BY)&&t.tAt(Math.floor(x/TILE),Math.floor(y/TILE))!==t.T_ROAD),'each 2-'+t.ENC_BY+' tiles off the road: none on it, none on a tile by it');
   ok(['gamblers','traveller'].every(k=>D(k).on==='byroad')&&['merchant','messenger','bard','beggar'].every(k=>D(k).on==='road'),'the gamblers and the wounded traveller beside the road; the peddler, the messenger, the bard and the beggar walk it')}
  P.tx=P.x+500;P.ty=P.y;const ps=check('wild','off the road');ok(ps.filter(([x])=>x>P.x).length>=ps.length*.7,'mostly ahead of the way you go ('+ps.filter(([x])=>x>P.x).length+' of '+ps.length+' east)');P.tx=null;
  const findT=f=>{for(let ty=12;ty<t.MH-12;ty++)for(let tx=12;tx<t.MW-12;tx++)if(f(tx,ty))return[(tx+.5)*TILE,(ty+.5)*TILE];return null};
  // (a spot whose ring, 40-120 px past your sight, is a twentieth or more ground of that kind you can walk to: the first spot that
  // fits otherwise moves with the world's sites (far), and a small hill or wood can leave its ring bare of that ground)
  const ringFit=(tx,ty,on)=>{const V=t.vis(),c={x:(tx+.5)*TILE,y:(ty+.5)*TILE},r0=(V+S.near[0])/TILE,r1=(V+S.near[1])/TILE,R1=Math.ceil(r1);let n=0,k=0;
    for(let j=-R1;j<=R1;j++)for(let i=-R1;i<=R1;i++){const d=Math.hypot(i,j),X=tx+i,Y=ty+j;if(d<r0||d>r1)continue;n++;
      if(X>=2&&Y>=2&&X<t.MW-2&&Y<t.MH-2&&t.passable(t.tAt(X,Y))&&!t.occAt(X,Y)&&t.ENC_ON[on](X,Y)&&t.Router.reach(c,{x:(X+.5)*TILE,y:(Y+.5)*TILE}))k++}
    return k>=n/20};
  {const w=findT((tx,ty)=>t.tAt(tx,ty)===t.T_FOREST&&around(tx,ty,2,x=>x===t.T_FOREST)&&far(tx,ty)&&t.climAt((tx+.5)*TILE,(ty+.5)*TILE)!=='frost'&&ringFit(tx,ty,'wood'));if(w){at(w[0],w[1]);check('wood','hunters by a wood')}else ok(false,'no forest to test')}
  {const h=findT((tx,ty)=>t.tAt(tx,ty)===t.T_HILL&&around(tx,ty,4,x=>x===t.T_HILL)&&far(tx,ty)&&ringFit(tx,ty,'hill'));if(h){at(h[0],h[1]);check('hill','the mine in the hills')}else ok(false,'no hills to test')}
  {const b=findT((tx,ty)=>t.climAt((tx+.5)*TILE,(ty+.5)*TILE)==='swamp'&&t.passable(t.tAt(tx,ty))&&far(tx,ty)&&around(tx,ty,9,x=>t.passable(x))&&ringFit(tx,ty,'bog'));if(b){at(b[0],b[1]);check('bog','the wisps in a bog')}else ok(false,'no bog to test')}
  {const A=t.townBy('Ashford');at(A.x,A.y+40);const ps=[],sd=t.seeded(900);for(let i=0;i<40;i++){const p=stub(sd,()=>t.roadSpot('road'));if(p)ps.push(p)}
   ok(ps.every(([x,y])=>t.TOWNS.every(z=>Math.hypot(z.tx-Math.floor(x/TILE),z.ty-Math.floor(y/TILE))>=S.hold)),'never inside a holding (beside Ashford: '+ps.length+' placed, none within '+S.hold+' tiles of one)')}}

 // ---- behaviours
 {goHome();const e=t.roadSpawn('merchant',P.x+150,P.y),d0=e.fromYou();frames(20);ok(e.fromYou()<d0-5,'approach: the peddler walks to you ('+Math.round(d0)+' → '+Math.round(e.fromYou())+' px)');
  frames(2000);ok(G.mode==='road'&&G.road===e&&q('.rwin h2').textContent===D('merchant').n,'reaching you, he is met: his page opens');t.act('enc-leave');ok(G.mode==='world'&&e.beh==='leave','Leave: he goes on his way');
  const x1=e.fromYou();frames(200);ok(e.fromYou()>x1+5,'walking off (along the road: '+Math.round(x1)+' → '+Math.round(e.fromYou())+' px)');}
 // (your way straight on over open ground: a way round water is the router's (world.js heroStep), which one walking up cannot foresee)
 {goHome();const S0=W.sites;W.sites=[];const a=[0,.4,-.4,.8,-.8,1.2,-1.2,1.6,-1.6,2.4,-2.4,Math.PI].find(a=>t.clearLine(P.x,P.y,P.x+Math.cos(a)*1200,P.y+Math.sin(a)*1200))||0;P.tx=P.x+Math.cos(a)*1200;P.ty=P.y+Math.sin(a)*1200;const d=V+80,e=t.roadSpawn('merchant',P.x+Math.cos(a+.3)*d,P.y+Math.sin(a+.3)*d);for(let i=0;i<1500&&G.mode==='world'&&!e.gone;i++)t.updateWorld(.05);W.sites=S0;
  ok(G.mode==='road'&&G.road===e,'while you travel, one walking up meets you on your way (it hurries to where your ways cross)');world()}
 {goHome();const e=t.roadSpawn('traveller',P.x+60,P.y),x=e.x,y=e.y;frames(200);ok(e.x===x&&e.y===y&&!e.gone,'stay: the wounded traveller stays where he lies')}
 {goHome();const e=t.roadSpawn('wisps',P.x+40,P.y),d0=e.fromYou();frames(30);ok(e.fromYou()>d0+3,'flee: the lights drift away as you come ('+Math.round(d0)+' → '+Math.round(e.fromYou())+' px)')}
 {goHome();const e=t.roadSpawn('caravan',P.x+60,P.y),L=t.ENC_LIFE.scene;ok(e.end-e.t0>=L[0]&&e.end-e.t0<=L[1],'scene: the caravan fight is under way, '+(e.end-e.t0).toFixed(1)+' h to run');
  G.clock+=(e.end-t.roadNow()+.1)*t.DAY/24;P.x=e.x-V*1.2;frames(1);ok(e.gone&&R().on.some(x=>x.trace&&x.k==='wreck'),'and ends by itself out of your sight: plundered, a burnt wagon left');G.clock=t.DAY*.3}
 // lifetimes by behaviour, and leaving when far
 {const bad=[];for(const k of Object.keys(t.ROAD_ENC)){goHome();for(let i=0;i<5;i++){R().on=[];const Dk=t.ROAD_ENC[k],e=WALKERS.includes(k)||k==='pilgrims'?spawnK(k):t.roadSpawn(k,P.x+30,P.y);if(!e){bad.push(k+' none at '+Math.round(P.x)+','+Math.round(P.y));continue}const L=t.ENC_LIFE[Dk.life||(e.beh==='flee'?'flee':Dk.beh)],h=e.end-e.t0;if(h<L[0]-1e-9||h>L[1]+1e-9)bad.push(k+' '+h.toFixed(2))}}
  const L=t.ENC_LIFE;ok(!bad.length,'lifetimes by behaviour: approach '+L.approach.join('–')+' h, stay '+L.stay.join('–')+' h, flee at most '+L.flee[1]+' h, scene '+L.scene.join('–')+' h; the thief running '+L.run.join('–')+' h, the horse as one that stays, a procession '+L.walk.join('–')+' h (as long as its walk)'+(bad.length?': '+bad.join(', '):''));
  goHome();const a=t.roadSpawn('bard',P.x+60,P.y);G.clock+=(a.end-t.roadNow()+.05)*t.DAY/24;frames(1);ok(a.beh==='leave'&&!a.gone,'an approach whose time is up walks off');frames(3000);ok(a.gone,'and is gone once out of your sight');G.clock=t.DAY*.3;
  goHome();const s=t.roadSpawn('hunters',P.x+50,P.y);P.x+=V*t.ENC_LIFE.leave+60;frames(1);ok(s.gone,'anything leaves once you are '+t.ENC_LIFE.leave+'× your sight away');
  goHome();const m=t.roadSpawn('merchant',P.x+V+100,P.y);P.x-=20;frames(1);ok(!m.gone,'(not one just come past your sight, you a little farther)');P.x-=200;frames(1);ok(m.gone,'outpaced: gone')}

 // ---- traces: ignored, the traveller dies (a body), fading after a day; tended, none
 {goHome();const e=t.roadSpawn('traveller',P.x+40,P.y);e.seen=1;G.clock+=(e.end-t.roadNow()+.1)*t.DAY/24;P.x=e.x-V*1.2;frames(1);const b=R().on.find(x=>x.trace&&x.k==='body');P.x=e.x-40;
  ok(e.gone&&b&&b.from<=t.roadNow()&&Math.abs(b.end-b.from-t.ENC_LIFE.trace)<1e-9&&b.x===e.x,'ignored, the wounded traveller dies (out of your sight): a body by the road, for a day');
  ok(b&&b.inView(V)&&!b.chaseable()&&!b.marked()&&t.objKind(b)==='road'&&t.pickAt(b.x,b.y-4)!==b,'drawn, never highlighted nor clicked');
  G.clock+=t.DAY*1.01;if(G.clock>=t.DAY){G.day+=Math.floor(G.clock/t.DAY);G.clock%=t.DAY}frames(1);ok(b.gone&&!b.inView(V),'gone after a day');G.clock=t.DAY*.3;
  goHome();const f=t.roadSpawn('traveller',P.x+40,P.y);P.gold=500;t.invAdd('good','grain',10);t.roadMeet(f);t.act('enc-do','0');world();P.x+=V*2+200;frames(1);ok(f.gone&&!R().on.some(x=>x.trace),'tended, he walks away: no body');
  goHome();const g=t.roadSpawn('traveller',P.x+40,P.y);P.x+=V*2+200;frames(1);ok(g.gone&&R().on.some(x=>x.trace&&x.k==='body'&&x.from>=g.end-1e-9),'ridden away from, he dies all the same, when his time is up (the body shows from then)')}

 // ---- the highlights: heard or seen, a log line and a sound; the "!", the glow, the call-out on the screen; the arrow off it
 {goHome();P.sk.scout.lv=0;const n0=G.msgs.length,e=t.roadSpawn('traveller',P.x+V+60,P.y+10);frames(1);
  ok(e.seen&&G.msgs.slice(n0).some(m=>/calls out from the road to the east/.test(m.m)),'heard: a log line ("'+(G.msgs[G.msgs.length-1]||{}).m+'")');
  const bang=t.wuiArrow('bang',t.WUI_K.col.enc);
  const spy=fn=>{const r={bang:0,arrow:0,glow:0,say:0};const di=CanvasRenderingContext2D.prototype.drawImage,wr=window.wuiRing,wa=window.wuiArc;
    CanvasRenderingContext2D.prototype.drawImage=function(s,...a){if(s===bang)r.bang++;return di.call(this,s,...a)};
    window.wuiRing=(...a)=>{r.glow++;return wr(...a)};window.wuiArc=(...a)=>{r.arrow++;return wa(...a)};// (its sound waves: the map's rings, worldui.js wuiRoadUnder; at the screen's edge, arcs)
    try{fn()}finally{CanvasRenderingContext2D.prototype.drawImage=di;window.wuiRing=wr;window.wuiArc=wa}return r};
  const on=spy(()=>t.frame());ok(on.bang>0&&on.arrow===0,'on the screen (not yet in sight): a "!" over it, no waves at the edge');
  e.x=P.x+40;e.y=P.y;t.ROAD_SAY.delete(e);const s1=spy(()=>t.frame());ok(s1.bang>0&&s1.glow>0&&t.ROAD_SAY.get(e)!=null,'in sight: the "!", sound waves round it, and its call-out ("'+t.ROAD_ENC.traveller.call+'")');
  e.x=P.x+t.VW/2+60;e.y=P.y;const off=spy(()=>t.frame());ok(off.arrow>0&&off.bang>0,'off the screen: its waves rolling in at the screen’s edge "((((", the "!" inside them');
  t.roadMeet(e);world();const met=spy(()=>t.frame());ok(met.bang===0&&met.arrow===0&&!e.marked(),'met: no more highlights');
}

 // ---- a click on one: you walk there and its page opens
 {goHome();const e=t.roadSpawn('hunters',P.x+50,P.y+8);e.seen=1;t.frame();const b=e.box(),hit=t.pickAt((b[0]+b[2])/2,(b[1]+b[3])/2);ok(hit===e,'a click anywhere on its scene picks it ('+b.join(',')+')');
  ok(/Hunters/.test(t.tipFor(e))&&t.wuiKind(e)==='neutral','its tooltip, its colour ('+t.wuiKind(e)+')');
  t.clickAt((b[0]+b[2])/2,(b[1]+b[3])/2);ok(G.chase===e,'a click sends you to it');for(let i=0;i<400&&G.mode==='world';i++)t.updateWorld(.05);
  ok(G.mode==='road'&&G.road===e&&q('#panel.paged')&&q('.pg-banner')&&q('.rwin h2').textContent==='Hunters’ camp','reached, its page: the banner from the map, its name');
  t.act('enc-leave');ok(G.mode==='world'&&e.met&&!e.gone,'Leave: back on the map')}

 // ---- each of the 14 kinds: its page (its picture, what you see, its choices as key actions, Leave) and today's outcomes
 const meet=(k,set)=>{const e=spawnK(k);if(set)set(e);t.roadMeet(e);return e};
 const acts=()=>qa('.rwbody .rkact').map(b=>b.querySelector('b').textContent),pickA=i=>t.act('enc-do',String(i)),sure=()=>q('.nav [data-nav="close"]').click();
 const ks=Object.keys(t.ROAD_ENC),NEW=['mud','thief','poacher','funeral','wedding','horse','beggar','messenger'];
 ok(ks.length===24&&['traveller','merchant','pilgrims','deserters','gamblers','mine','hunters','child','bard','wisps','caravan','ambush','refugees','warning'].concat(NEW,['lure','sheep']).every(k=>ks.includes(k)),'the 14 people events, now on the map, phase 2’s 8 new ones, phase 4’s lure and the strayed sheep: '+ks.join(', '));
 {const bad=[];ev('TERRAIN.on=true');for(const k of ks){const e=meet(k);const Dk=D(k),want=Dk.acts.filter(a=>!a.when||a.when(e)).map(a=>a.label).join('|'),got=acts().join('|'),leave=q('.nav [data-nav="close"]');
   if(!(q('#panel.paged')&&q('.pg-banner')&&q('.rwin h2').textContent===Dk.n&&got===want&&(t.roadForced(e)?!leave:leave&&leave.dataset.act==='enc-leave'&&leave.textContent===(Dk.leave||'Leave'))&&q('.rwbody>p').textContent.length>20))bad.push(k+' ['+got+']')}
  ev('TERRAIN.on=false');world();ok(!bad.length,'every kind has its page: its banner, its name, what you see, its choices as key actions and Leave (none for the ambush)'+(bad.length?': '+bad.join('; '):''))}
 {const pics=ks.map(k=>t.ENC_SCENE.pics(spawnK(k)).length);ok(pics.every(n=>n>0),'every kind is drawn from its pieces ('+pics.join(' ')+')')}
 world();P.morale=50;
 // the wounded traveller
 {P.gold=100;t.invAdd('good','grain',10);const f0=t.foodN(),r0=P.renown;const h=meet('traveller');pickA(0);ok(t.foodN()===f0-3&&P.renown===r0+1&&/gets to his feet/.test(panel())&&!qa('.rwbody .rkact').length,'Tend his wounds: −3 food, +1 renown; then only Leave');world();
  {const ps=t.roadPieces(h);ok(h.healed&&h.left&&h.beh==='leave'&&ps.length===1&&ps[0][0]==='walk'&&ps[0][1]==='healed'&&t.ENC_LOOK.healed('human',0).helm==='bandage'&&!W.road.on.some(o=>o.trace&&o.k==='body'),'tended: on his feet, bandaged (ENC_LOOK.healed), walking off along the road; no body left')}
  meet('traveller');const g0=P.gold;pickA(1);ok(q('#panel.confirm')&&P.gold===g0,'Take his purse asks first');t.onEscape();ok(G.mode==='road'&&q('#panel.paged'),'Back: his page again');pickA(1);sure();ok(P.gold===g0+20&&/You take 20 gold/.test(panel()),'confirmed: +20 gold');world();
  const e=meet('traveller');t.act('enc-leave');ok(G.msgs[G.msgs.length-1].m==='You leave him to his fate.','Leave: you leave him to his fate')}
 // the peddler
 {P.gold=2000;P.inv=Array(t.INV_SIZE).fill(null);const e=meet('merchant'),p=t.roadPrice(e);pickA(0);ok(P.inv.some(x=>x&&x.k==='gear'&&x.id===e.item)&&P.gold===2000-p,'the peddler sells his piece of gear ('+t.ITEMS[e.item].n+', '+p+' gold)');world();
  P.gold=1;meet('merchant');ok(q('.rkact').disabled&&/Not enough gold/.test(panel()),'unaffordable: disabled, with the reason');pickA(0);ok(G.mode==='road'&&P.gold===1,'and does nothing');world();P.gold=500}
 // the pilgrims (phase 4): only with a real shrine within their walk; walking the roads to the nearest and ending there, or, one
 // just past your sight, praying at it beside its own picture; never a shrine of their own
 {const TP=t.ENC_TUNE.pilgrims,SH=W.sites.filter(s=>s.type==='shrine');at(pilWalk.x,pilWalk.y);const S0=W.sites;W.sites=S0.filter(s=>s.type!=='shrine');R().on=[];
  ok(!D('pilgrims').ok()&&!t.roadSpawn('pilgrims',P.x+10,P.y),'no real shrine within reach: no pilgrims');W.sites=S0;ok(D('pilgrims').ok(),'a real shrine within their walk: they can come');
  const w=spawnK('pilgrims'),g=w.goal(),sh=t.roadShrineOf(w),far=t.roadWalkFar(),dd=s=>Math.hypot(s.x-w.x,s.y-w.y),near=SH.filter(s=>dd(s)>=t.ENC_WALK.min&&dd(s)<=far&&t.Router.reach(w,s)).sort((a,b)=>dd(a)-dd(b))[0],lay=t.ENC_SCENE.lay(w,true);
  ok(!w.pray&&w.beh==='walk'&&sh&&sh===near&&Math.hypot(g.x-sh.x,g.y-sh.y)<14&&w.n>=TP.n[0]&&w.n<=TP.n[1]&&lay.length===w.n&&lay.every(p=>p.k==='walk'),'walking: '+w.n+' pilgrims bound for the nearest real shrine they can reach, the '+w.site+' ('+Math.round(dd(sh))+' px off), no shrine of their own');
  w.seen=1;let last=null,i=0;for(;i<6000&&!w.gone&&w.beh==='walk';i++){last=[w.x,w.y];t.updateRoad(.25);P.x=w.x-30;P.y=w.y}
  ok(!w.gone&&w.beh==='stay'&&w.pray&&Math.hypot(g.x-last[0],g.y-last[1])<14&&!R().on.some(x=>x.trace),'they walk the roads to it ('+Math.round(Math.hypot(g.x-last[0],g.y-last[1]))+' px from it); reaching it in your sight, they stay there, leaving nothing');
  // (nothing ends while you can see it: they pray at it a while (ENC_LIFE.pray), then walk off and are gone once out of your sight;
  // saved and loaded mid-prayer)
  {const LP=t.ENC_LIFE.pray,h=w.end-t.roadNow(),ks=t.ENC_SCENE.lay(w,true).map(p=>p.k),x0=w.x,y0=w.y;
   ok(h>=LP[0]-1e-9&&h<=LP[1]+1e-9&&ks.includes('kneel')&&ks.every(k=>k==='kneel'||k==='stand'),'they kneel and pray at the '+w.site+' for '+h.toFixed(1)+' h ('+ks.join(', ')+')');
   frames(100);ok(w.x===x0&&w.y===y0&&!w.gone,'at their prayers while you watch');
   G.mode='world';G.modal=false;const snap=JSON.stringify(w);t.saveGame(true);W.road=null;t.loadGame();const w2=R().on.find(x=>x.i===w.i);
   ok(w2&&w2 instanceof t.RoadEncounter&&JSON.stringify(w2)===snap&&w2.pray&&w2.beh==='stay','saved and loaded mid-prayer, as they were');
   pilPray.s=W.sites.find(x=>x.tx===pilPray.s.tx&&x.ty===pilPray.s.ty);// (the load made the sites anew)
   t.roadMeet(w2);ok(acts()[0]==='Pray with them'&&/kneel at the/.test(panel()),'met at their prayers: Pray with them');world();
   G.clock+=(w2.end-t.roadNow()+.1)*t.DAY/24;frames(1);const k2=t.ENC_SCENE.lay(w2,true).map(p=>p.k);
   ok(!w2.gone&&w2.beh==='leave'&&w2.left&&k2.length===w2.n&&k2.every(k=>k==='walk'),'their prayers said, in your sight, they get up and walk off ('+k2.join(', ')+')');
   let pre=true,j=0;for(;j<8000&&!w2.gone;j++){pre=w2.inView(t.vis());t.updateRoad(.05)}
   ok(w2.gone&&!pre&&!R().on.some(x=>x.trace),'and are gone once out of your sight ('+j+' moments), leaving nothing');G.clock=t.DAY*.3}
  at(pilPray.x,pilPray.y);R().on=[];const p=t.roadSpawn('pilgrims',P.x+10,P.y),s=pilPray.s,pl=t.ENC_SCENE.lay(p,true),L=t.ENC_LIFE.stay;
  ok(p.pray&&p.beh==='stay'&&p.site===s.name&&Math.hypot(p.x-s.x,p.y-s.y)<16&&pl.length===p.n&&pl.some(x=>x.k==='kneel')&&pl.every(x=>x.k==='kneel'||x.k==='stand')&&p.end-p.t0>=L[0]&&p.end-p.t0<=L[1],
    'a real shrine just past your sight: '+p.n+' pilgrims kneel and stand before the '+s.name+', by its own picture ('+pl.map(x=>x.k).join(', ')+'), for '+(p.end-p.t0).toFixed(1)+' h');
  const x0=p.x,y0=p.y;s.seen=false;frames(100);ok(p.x===x0&&p.y===y0&&!p.gone,'and stay at their prayers');
  ok(p.seen&&s.seen&&s.inView(t.vis())&&p.view().ps.length===t.ENC_SCENE.pics(p).length+s.view().ps.length,'heard or seen, their shrine is known (drawn on the map), and on their page’s banner with them');
  ok(t.ROAD_ENC.pilgrims.scene(w).concat(t.ROAD_ENC.pilgrims.scene(p)).every(x=>x[0]!=='bld'),'no shrine of their own, walking or praying');
  // their choices, fitted to each
  world();P.morale=50;at(pilPray.x,pilPray.y);R().on=[];const q1=t.roadSpawn('pilgrims',P.x+10,P.y);t.roadMeet(q1);ok(acts().join('|')==='Pray with them|Give alms|Take the coins|Ask for news'&&/kneel at the/.test(panel()),'praying: Pray with them, Give alms, Take the coins, Ask for news (news.js), Leave');
  pickA(0);ok(P.morale===50+TP.morale,'Pray with them: morale +'+TP.morale);world();
  P.morale=50;t.invAdd('good','grain',10);const q2=meet('pilgrims'),h0=t.roadNow();// (fed: an hour passes, and a hungry band loses morale by the hour, world/supply.js)ok(acts().join('|')==='Walk and pray with them|Give alms|Take the coins|Ask for news'&&/walk the road to the/.test(panel()),'walking: Walk and pray with them, Give alms, Take the coins, Ask for news, Leave');
  pickA(1);ok(P.morale===50+TP.morale&&Math.abs(t.roadNow()-h0-TP.walk)<1e-6,'Walk and pray with them: morale +'+TP.morale+', '+TP.walk+' hour with them');world();
  const g0=P.gold,xp0=P.xp+P.level*1e5;P.morale=50;meet('pilgrims');pickA(2);ok(P.gold===g0-TP.alms&&P.morale===50+TP.almsMorale&&P.xp+P.level*1e5>xp0,'Give alms: '+TP.alms+' gold, morale +'+TP.almsMorale+', XP');world();
  P.morale=50;meet('pilgrims');pickA(3);ok(q('#panel.confirm')&&P.gold===g0-TP.alms,'Take the coins asks first');sure();ok(P.gold===g0-TP.alms+TP.coins&&P.morale===50-TP.coinsMorale,'confirmed: +'+TP.coins+' gold, morale −'+TP.coinsMorale);world();
  const A=t.townBy('Ashford'),e=meet('pilgrims',e=>{e.to=A.name}),r1=t.repAt(A.name);pickA(1);ok(t.repAt(A.name)>r1&&/good words about you in/.test(panel()),'from a holding near, they speak well of you there ('+A.name+')');world();G.clock=t.DAY*.3}
 // deserters
 {P.troops={hum_levy:2};P.gold=100;const e=meet('deserters',e=>{e.fac=e.fac||'kingdom'});const n0=t.troopCount();pickA(0);ok(t.troopCount()===n0+2&&P.troops[e.unit]>=2&&P.gold===85,'Take them in: two '+t.ST[e.unit].n+'s for 15 gold');world();
  const f=meet('deserters',e=>{e.fac=Object.keys(t.FACS).find(x=>x!=='player')}),h0=t.honorWith(f.fac),g1=P.gold;pickA(1);sure();ok(t.honorWith(f.fac)>h0&&P.gold===g1+10,'Turn them in (asks first): honour with the '+t.FACS[f.fac].n+', a 10-gold bounty');world();
  meet('deserters',e=>{e.fac=null});ok(qa('.rkact')[1].disabled&&/serve no realm/.test(panel()),'no realm to turn them in to: disabled');world();
  goHome();const fac=Object.keys(t.FACS).find(x=>x!=='player');P.fac=fac;const A=t.nearestOf(P,t.TOWNS),own=A.owner;A.owner=fac;const z=t.roadSpawn('deserters',P.x+30,P.y);A.owner=own;P.fac=null;ok(z.fac===fac&&z.beh==='flee','deserters of your own realm run from you');world()}
 // gamblers
 {P.gold=100;meet('gamblers');stub(0,()=>pickA(1));ok(P.gold===120&&/You win 20/.test(panel())&&qa('.rkact').length===3,'a hand for 20, won: +20 gold, and they deal again');stub(.99,()=>pickA(2));ok(P.gold===70&&/You lose 50/.test(panel()),'a hand for 50, lost: −50');world();
  {P.gold=500;const e=meet('gamblers');const G0=t.ENC_GAMBLE;for(let i=0;i<G0.hands;i++)stub(.99,()=>pickA(0));
   ok(e.hands===G0.hands&&e.done&&qa('.rkact').length===0&&/last hand/.test(panel()),'at most '+G0.hands+' hands: then they pack up the bones ('+e.hands+')');world();
   P.gold=500;const f=meet('gamblers');let n=0;while(!f.done&&n<9){stub(0,()=>pickA(2));n++}
   ok(f.done&&f.net>=G0.quit&&n===Math.ceil(G0.quit/50)&&/had enough of our coin/.test(panel()),'and they quit once '+G0.quit+' gold down to you ('+n+' hands won at 50)');world()}}
 // the mine
 {const i0=t.goodN('iron');meet('mine');stub(.5,()=>pickA(0));ok(t.goodN('iron')===i0+5&&/tunnels hold/.test(panel()),'Search it, lucky: 5 iron');world();
  P.troops={hum_levy:3};meet('mine');stub(.99,()=>pickA(0));ok(t.troopCount()===2&&/caves in/.test(panel()),'unlucky: a tunnel caves in on a soldier');world()}
 // hunters
 {P.gold=100;const f0=t.goodN('furs');meet('hunters');pickA(0);ok(t.goodN('furs')===f0+3&&P.gold===85,'Buy 3 furs for 15 gold');world();const m0=t.goodN('meat');meet('hunters');pickA(1);ok(t.goodN('meat')===m0+3,'Join the hunt: meat, XP and Scouting');world()}
 // the lost child (near a holding)
 // (an escort now, world/escort.js: she rides with you to her family's house, and they thank you there)
 {const A=t.townBy('Ashford');at(A.x+60,A.y+60);P.quests=[];const e=t.roadSpawn('child',P.x+10,P.y),r1=t.repAt(e.to);P.morale=50;t.roadMeet(e);pickA(0);const q=P.quests[0];
  ok(q&&q.type==='escort'&&q.who==='child'&&q.to.town===e.to&&q.to.k==='house'&&t.repAt(e.to)===r1&&P.morale===50&&e.gone&&e.fin==='done'&&new RegExp(e.to).test(panel()),'Take her home: she rides with you, bound for '+(q&&q.to.name)+'; nothing paid yet, the child gone from the road');
  world();if(q){P.x=q.to.x;P.y=q.to.y}t.updateRoad(.05);
  ok(q&&!P.quests.length&&q.fate==='arrived'&&t.repAt(e.to)===r1+6&&P.morale===55&&G.mode==='story'&&/Escort: The lost child/.test(panel()),'at her family’s door: reputation in '+e.to+' +6, morale +5, and her page');t.act('pas-close');ok(G.mode==='world'&&t.ov.hidden,'Ride on: back to the map');world()}
 // the bard
 {P.gold=100;const r1=P.renown;meet('bard');pickA(0);ok(P.gold===90&&P.renown===r1+2,'Hear his song: 10 gold, renown +2');world()}
 // the wisps
 {const g0=P.gold;const e=meet('wisps');stub(0,()=>pickA(0));ok(P.gold===g0+40&&e.gone,'Follow the lights, lucky: a drowned chest of 40 gold; they are gone');world()}
 // a caravan under attack
 {P.troops={hum_levy:6};const e=meet('caravan');pickA(0);ok(G.mode==='dialog'&&G.enc&&G.enc.kind==='party'&&G.enc.ref instanceof t.BandParty&&G.enc.list.length===e.n&&e.gone,'Join the fight: the raiders, a band of their own, '+e.n+' of them');t.act('flee');world()}
 // refugees
 {const g0=t.goodN('grain'),r1=P.renown;P.quests=[];const e=meet('refugees');pickA(0);const q=P.quests[0],to=q&&t.townBy(q.to.town);
  ok(q&&q.who==='refugees'&&q.to.k==='holding'&&!!to&&!t.hostileTo(to.owner)&&t.goodN('grain')===g0&&P.renown===r1&&e.gone,'Escort them: the family rides with you to '+(q&&q.to.name)+', '+(q&&Math.round(Math.hypot(q.to.x-e.x,q.to.y-e.y)/TILE))+' tiles off; nothing paid yet');
  world();if(to)t.enterTown(to);ok(q&&!P.quests.length&&q.fate==='arrived'&&t.goodN('grain')===g0+4&&P.renown===r1+1,'entering '+(q&&q.to.name)+': they leave you 4 grain, renown +1');G.town=null;world();
  const f0=t.foodN();meet('refugees');pickA(1);ok(t.foodN()===f0-3,'Give food: −3 food');world()}
 // the shepherd
 {const b0=t.bandits.length,s0=P.sk.scout.xp+P.sk.scout.lv*1e4;meet('warning');pickA(0);ok(t.bandits.length===b0+1&&P.sk.scout.xp+P.sk.scout.lv*1e4>s0&&/raiders on the move to the/.test(panel()),'Listen: he tells of a band and which way it is');world()}

 // ======== phase 2: the eight new kinds (their numbers: ENC_TUNE; the chase and the catch, shared: ENC_CATCH)
 const TU=t.ENC_TUNE,CA=t.ENC_CATCH,logsSince=n=>G.msgs.slice(n).map(m=>m.m).join(' | '),cleanBag=()=>{P.inv=Array(t.INV_SIZE).fill(null)};
 // ---- when and where they come
 {const A=t.townBy('Ashford');G.clock=t.DAY*.3;at(A.x+60,A.y+90);
  ok(['mud','thief','beggar','messenger','horse'].every(k=>D(k).ok()),'by day near a holding: a stuck cart, a thief, a beggar, a messenger, a runaway horse can come');
  G.clock=t.DAY*.8;ok(['mud','thief','funeral','wedding'].every(k=>!D(k).ok())&&['beggar','messenger','horse'].every(k=>D(k).ok()),'by night no stuck cart, thief, funeral or wedding (they keep to daylight); a beggar, a messenger, a horse still may');G.clock=t.DAY*.3;
  at(walkSpot.x-10,walkSpot.y);ok(D('funeral').ok()&&D('wedding').ok(),'near a shrine or ruins and two holdings, a funeral or a wedding can come');
  const bog=findT2((tx,ty)=>t.climAt((tx+.5)*TILE,(ty+.5)*TILE)==='swamp'&&t.passable(t.tAt(tx,ty)));if(bog){at(bog.x,bog.y);ok(!D('horse').ok(),'no runaway horse in a bog')}
  const wild=findT2((tx,ty)=>t.tAt(tx,ty)===t.T_FOREST&&!t.landHold((tx+.5)*TILE,(ty+.5)*TILE)),lw=findT2((tx,ty)=>t.ENC_ON.lordwood(tx,ty));
  if(wild){at(wild.x,wild.y);ok(!D('poacher').ok(),'no poacher in a wood no lord holds')}if(lw){at(lw.x,lw.y);ok(D('poacher').ok(),'a poacher in a lord’s wood ('+t.landHold(lw.x,lw.y).name+'’s)')}
  goHome();P.gear.mount=null;const w0=t.roadW('horse');P.gear.mount='m_horse';const w1=t.roadW('horse');P.gear.mount=null;P.gold=300;const b1=t.roadW('beggar');P.gold=50;const b0=t.roadW('beggar');P.gold=500;
  ok(w0>w1&&b1>b0,'weighted by your band: a runaway horse likelier with no mount ('+w0+' vs '+w1+'), a beggar likelier when your purse is fat ('+b1+' vs '+b0+')');
  // placed on their own ground, past your sight (the thief at its edge: he runs across it)
  const S=t.ENC_SPAWN,check2=(on,m,near)=>{const ps=[],sd=t.seeded(700),N=near||S.near;for(let i=0;i<20;i++){const p=stub(sd,()=>t.roadSpot(on,0,near));if(p)ps.push(p)}
    const bad=ps.filter(([x,y])=>{const d=Math.hypot(x-P.x,y-P.y),tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);return d<t.vis()+N[0]-1e-6||d>t.vis()+N[1]+1e-6||!t.ENC_ON[on](tx,ty)||!t.passable(t.tAt(tx,ty))||t.TOWNS.some(z=>Math.hypot(z.tx-tx,z.ty-ty)<S.hold)});
    ok(ps.length>0&&!bad.length,m+': '+ps.length+' of 20 placed, '+N.join('–')+' px past your sight, on its ground'+(bad.length?' (bad: '+bad.length+')':''));return ps};
  const placeFor=(on,m)=>{const V0=t.vis();let n=0;for(let ty=14;ty<t.MH-14&&n<40;ty+=2)for(let tx=14;tx<t.MW-14&&n<40;tx+=2){if(!t.ENC_ON[on](tx,ty)||t.TOWNS.some(z=>Math.hypot(z.tx-tx,z.ty-ty)<S.hold+1))continue;n++;
      for(let a=0;a<8;a++){const x=(tx+.5)*TILE+Math.cos(a*.785)*(V0+80),y=(ty+.5)*TILE+Math.sin(a*.785)*(V0+80);if(!t.passable(t.tAt(Math.floor(x/TILE),Math.floor(y/TILE))))continue;P.x=x;P.y=y;P.tx=null;
        const sd=t.seeded(11);let hit=0;for(let i=0;i<10&&!hit;i++)if(stub(sd,()=>t.roadSpot(on)))hit=1;if(hit){at(x,y);return check2(on,m)}}}
    ok(false,m+': no place found');return[]};
  goHome();check2('open','the runaway horse on open land');check2('road','the thief on a road, at the edge of your sight',D('thief').near);
  placeFor('mud','the stuck cart where a road runs by water, a ford or a bog');
  const pw=placeFor('lordwood','the poacher at the edge of a lord’s wood');ok(pw.length&&pw.every(([x,y])=>t.landHold(x,y)&&t.landHold(x,y).owner),'every poacher stands on land a lord holds');world()}

 // ---- the cart stuck in the mud: stays and calls out; Help push (stamina, or an hour), Rob (asks first; as robbing a worker); left be, an abandoned cart
 {goHome();const SP=t.vitals()[1];P.sp=SP;cleanBag();const n0=G.msgs.length,e=t.roadSpawn('mud',P.x+V+50,P.y);frames(1);ok(e.seen&&/help with a cart on the road to the east/.test(logsSince(n0)),'the stuck cart: heard calling out ("'+D('mud').call+'")');
  e.x=P.x+40;e.y=P.y;frames(200);ok(e.x===P.x+40&&!e.gone&&e.beh==='stay','it stays where it is stuck');
  const A0={...P.attr};P.attr.str=0;P.sk.athl.lv=0;// (Strength and Athletics 0: today's cost; more, below)
  t.roadMeet(e);const r0=t.repAt(e.home),g0=t.goodN('grain');pickA(0);ok(P.sp===SP-TU.mud.sp&&t.repAt(e.home)===r0+TU.mud.rep&&t.goodN('grain')===g0+e.got&&/lurches free/.test(panel()),'Help push: −'+TU.mud.sp+' stamina, reputation in '+e.home+' +'+TU.mud.rep+', '+e.got+' grain from the farmer (stamina '+P.sp+', reputation '+r0+' → '+t.repAt(e.home)+', grain '+g0+' → '+t.goodN('grain')+')');world();
  P.sp=0;const f=meet('mud'),h0=t.roadNow();ok(/1 hour/.test(qa('.rkact')[0].textContent),'tired out, it costs an hour of your time instead (“1 hour”)');pickA(0);ok(Math.abs(t.roadNow()-h0-TU.mud.hours)<1e-6&&P.sp===0,'and the hour passes');world();Object.assign(P.attr,A0);
  const m=meet('mud'),T0=t.townBy(m.home),r1=t.repAt(m.home),g1=P.gold,gr=t.goodN('grain');pickA(1);ok(q('#panel.confirm')&&P.gold===g1&&t.goodN('grain')===gr,'Rob asks first, and nothing is taken yet');sure();
  ok(P.gold===g1+m.coins&&t.goodN('grain')===gr+m.load&&t.repAt(m.home)===r1-t.CONDUCT.robWorker.rep&&(T0.owner==='player'||!!t.crimeAt(T0))&&/coins from his cart/.test(panel()),'confirmed: '+m.load+' grain and '+m.coins+' coins; it costs as robbing a worker does (reputation in '+m.home+' −'+t.CONDUCT.robWorker.rep+', its guards want you)');world();
  goHome();const c=t.roadSpawn('mud',P.x+40,P.y);c.seen=1;G.clock+=(c.end-t.roadNow()+.1)*t.DAY/24;P.x=c.x-V*1.2;frames(1);const tr=R().on.find(x=>x.trace&&x.k==='cart');
  ok(c.gone&&tr&&Math.abs(tr.end-tr.from-t.ENC_LIFE.trace)<1e-9&&tr.D.n==='An abandoned cart'&&t.ENC_SCENE.pics(tr).length===2&&!tr.chaseable(),'ignored: an abandoned cart left by the road for a day, never clicked');G.clock=t.DAY*.3;
  goHome();P.sp=SP;const hp=t.roadSpawn('mud',P.x+20,P.y);t.roadMeet(hp);pickA(0);world();P.x+=V*2+200;frames(1);ok(hp.gone&&!R().on.some(x=>x.trace),'helped out: no cart left behind')}

 // ---- the thief: runs across your view from his victim; a click opens his page from afar; Chase (on the map: Agility and Riding
 // help), caught: Return the purse or Keep it (asks first); he may get away
 {goHome();P.attr.agi=2;P.morale=60;const n0=G.msgs.length,e=t.roadSpawn('thief',P.x+V+10,P.y+20),vx=e.vx,vy=e.vy;frames(1);
  ok(e.hx!=null&&Math.hypot(e.x-vx,e.y-vy)>5&&/Stop, thief/.test(logsSince(n0))&&e.end-e.t0>=t.ENC_LIFE.run[0]&&e.end-e.t0<=t.ENC_LIFE.run[1],'the thief: heard ("Stop, thief!"), running off from his victim, for at most '+t.ENC_LIFE.run[1]+' hours');
  let md=1e9,seen=0;for(let i=0;i<4000&&!e.gone;i++){t.updateRoad(.05);md=Math.min(md,e.fromYou());if(e.inView(t.vis()))seen++}
  ok(e.vx===vx&&e.vy===vy&&md<V*.6&&seen>0&&e.gone&&!e.met,'he runs across your view ('+Math.round(md)+' px from you at his nearest, in sight for '+seen+' moments), his victim left where he was robbed; let be, he is gone once out of your sight');
  // a click on him, far off: his page at once
  goHome();const f=t.roadSpawn('thief',P.x+V+10,P.y);f.x=P.x+70;f.y=P.y+4;f.seen=1;t.frame();const b=f.box();t.clickAt((b[0]+b[2])/2,(b[1]+b[3])/2);ok(G.chase===f,'a click on him sends you after him');t.updateWorld(.05);
  ok(G.mode==='road'&&G.road===f&&acts().join('|')==='Chase'&&q('.nav [data-nav="close"]').textContent==='Let go'&&q('.pg-banner'),'and his page opens at once, though he is out of reach: Chase, or Let go');
  P.sk.scout.lv=5;t.showRoad();ok(/you would close on him in|cannot catch him/.test(panel()),'Insight (Scouting 5): whether you can run him down, in hours');P.sk.scout.lv=0;
  // Chase: you go after him on the map at a sprint; quick on your feet, you have him
  P.attr.agi=10;const g0=P.gold;pickA(0);ok(G.mode==='world'&&G.chase===f&&f.chase>t.roadNow()&&!G.modal,'Chase: off his page and after him on the map');
  let i=0;for(;i<3000&&G.mode==='world'&&!f.gone;i++)t.updateWorld(.05);
  ok(G.mode==='road'&&G.road===f&&f.nab&&acts().join('|')==='Return the purse|Keep it'&&!q('.nav [data-nav="close"]')&&/run the thief down/.test(panel()),'Agility 10: you catch him ('+i+' moments): Return the purse or Keep it, a choice you must make');
  const r0=t.repAt(f.home);pickA(1);ok(P.gold===g0+TU.thief.reward&&t.repAt(f.home)===r0+TU.thief.rep,'Return the purse: a '+TU.thief.reward+'-gold reward, reputation in '+f.home+' +'+TU.thief.rep);world();
  goHome();const k=t.roadSpawn('thief',P.x+40,P.y);k.fac=Object.keys(t.FACS).find(x=>x!=='player');k.nab=1;t.roadMeet(k);const h0=t.honorWith(k.fac),g1=P.gold;pickA(2);ok(q('#panel.confirm')&&P.gold===g1,'Keep it asks first');sure();
  ok(P.gold===g1+k.purse&&t.honorWith(k.fac)===h0-TU.thief.honor,'confirmed: his '+k.purse+' gold yours, honor with the '+t.FACS[k.fac].n+' −'+TU.thief.honor);world();
  // slow and clumsy, he gets away
  // (made certain: he runs far faster than any band, so the way you go that day cannot let you close on him)
  goHome();P.attr.agi=0;P.morale=10;const s=t.roadSpawn('thief',P.x+V+10,P.y);s.x=P.x+90;s.y=P.y;t.roadMeet(s);const n1=G.msgs.length,sr=t.ENC_SPD.run;t.ENC_SPD.run=200;
  try{pickA(0);for(i=0;i<3000&&G.mode==='world'&&!s.gone;i++)t.updateWorld(.05)}finally{t.ENC_SPD.run=sr}
  ok(s.gone&&G.mode==='world'&&!G.chase&&!s.nab&&/slips away/.test(logsSince(n1)),'Agility 0, your band weary, he runs faster than you: he gets away ('+i+' moments)');P.morale=60;
  // Agility and Riding: how soon you close on him (catchHours), how near you must come
  P.attr.agi=0;const h1=t.catchHours(80);P.attr.agi=8;const h2=t.catchHours(80),r2=t.catchReach();P.gear.mount='m_horse';const h3=t.catchHours(80);P.gear.mount=null;P.attr.agi=2;
  ok(h2<h1&&h3<h2&&r2>CA.reach,'Agility and Riding help: 80 px off, you close on him in '+h1.toFixed(2)+' h (Agility 0), '+h2.toFixed(2)+' h (Agility 8), '+h3.toFixed(2)+' h mounted; your reach '+r2+' px')}

 // ---- the poacher: in a lord's wood, he runs if he sees you first (Scouting); Turn him in, Buy the meat
 {goHome();P.sk.scout.lv=0;let V0=t.vis();const e=t.roadSpawn('poacher',P.x+V0*1.05,P.y);frames(1);ok(!e.seen&&e.beh==='flee'&&e.spooked,'Scouting 0: he sees you first (at '+(D('poacher').wary()).toFixed(2)+'× your sight) and runs');
  const d0=e.fromYou();frames(40);ok(e.fromYou()>d0+3,'away from you, into the trees');frames(3000);ok(e.gone&&!e.met,'and is gone');
  goHome();P.sk.scout.lv=3;V0=t.vis();const s=t.roadSpawn('poacher',P.x+V0*1.05,P.y);frames(1);ok(s.beh==='stay'&&!s.spooked,'Scouting 3 ('+(D('poacher').wary()).toFixed(2)+'× your sight): he has not seen you');
  P.x=s.x-V0*.95;frames(1);ok(s.seen&&s.beh==='stay','you see him first: he stays, caught red-handed');P.x=s.x-V0*.5;frames(5);ok(s.beh==='stay'&&!s.gone,'and does not run as you come');P.sk.scout.lv=0;
  ok(t.ENC_SCENE.pics(s).length===2,'a hunter with a deer lying dead');
  world();const p=meet('poacher'),r0=t.repAt(p.home),g0=P.gold;pickA(0);ok(t.repAt(p.home)===r0+TU.poacher.rep&&P.gold===g0+TU.poacher.bounty,'Turn him in: reputation in '+p.home+' +'+TU.poacher.rep+', a '+TU.poacher.bounty+'-gold bounty');world();
  cleanBag();const m0=t.goodN('meat'),g1=P.gold;meet('poacher');pickA(1);ok(t.goodN('meat')===m0+TU.poacher.meat&&P.gold===g1-TU.poacher.price,'Buy the meat: '+TU.poacher.meat+' meat for '+TU.poacher.price+' gold');world()}

 // ---- the processions: walk the roads to their goal and end there; Pay respects; Join, Give a gift
 {for(const k of WALKERS){const e=spawnK(k),g=e.goal(),d0=Math.hypot(g.x-e.x,g.y-e.y),L=t.ENC_LIFE.walk,h=e.end-e.t0;e.seen=1;let gx=g.x,gy=g.y,last=null;
    let i=0;for(;i<6000&&!e.gone&&e.beh==='walk';i++){last=[e.x,e.y];t.updateRoad(.25);P.x=e.x-30;P.y=e.y}
    const at2=Math.hypot(gx-last[0],gy-last[1]),say=D(k).n+': walks the roads to '+(k==='funeral'?'the '+e.site:e.tw)+' ('+Math.round(d0)+' px as the crow flies, '+h.toFixed(1)+' h to go)';
    if(k==='wedding')ok(e.gone&&at2<14&&h>=L[0]&&h<=L[1]&&!R().on.some(x=>x.trace),say+' and ends at its gate, though you see it: they went in ('+Math.round(at2)+' px from it)');
    else{const LP=t.ENC_LIFE.pray,hs=e.end-t.roadNow();ok(!e.gone&&e.beh==='stay'&&at2<14&&h>=L[0]&&h<=L[1]&&hs>=LP[0]-1e-9&&hs<=LP[1]+1e-9&&!R().on.some(x=>x.trace),say+'; there in your sight, they stand by their dead a while ('+hs.toFixed(1)+' h)');
      G.clock+=(e.end-t.roadNow()+.1)*t.DAY/24;frames(1);const ks=t.ENC_SCENE.lay(e,true).map(p=>p.k);
      ok(!e.gone&&e.beh==='leave'&&e.left&&ks.every(k=>k==='walk')&&/walk home from/.test(D(k).text(e)),'then walk home, their dead laid to rest ('+ks.join(', ')+')');
      let pre=true,j=0;for(;j<8000&&!e.gone;j++){pre=e.inView(t.vis());t.updateRoad(.05)}ok(e.gone&&!pre,'and are gone once out of your sight');G.clock=t.DAY*.3}}
  const A1={...P.attr};P.attr.cha=0;// (Charisma 0: today's; more, below)
  world();const f=meet('funeral',e=>{e.fac=Object.keys(t.FACS).find(x=>x!=='player')}),h0=t.honorWith(f.fac);P.morale=50;pickA(0);ok(t.honorWith(f.fac)===h0+TU.funeral.honor&&P.morale===50+TU.funeral.morale,'Pay respects: honor with the '+t.FACS[f.fac].n+' +'+TU.funeral.honor+', morale +'+TU.funeral.morale);world();
  ok(f.beh==='walk','and they walk on');
  P.morale=50;const w=meet('wedding'),c0=t.roadNow();pickA(0);ok(P.morale===50+TU.wedding.morale&&Math.abs(t.roadNow()-c0-TU.wedding.hours)<1e-6,'Join the wedding: morale +'+TU.wedding.morale+', '+TU.wedding.hours+' hours of your time');world();G.clock=t.DAY*.3;
  const w2=meet('wedding'),r0=t.repAt(w2.home),g0=P.gold;pickA(1);ok(P.gold===g0-TU.wedding.gift&&t.repAt(w2.home)===r0+TU.wedding.rep,'Give a gift: '+TU.wedding.gift+' gold, reputation in '+w2.home+' +'+TU.wedding.rep);world();
  P.gold=5;meet('wedding');ok(qa('.rkact')[1].disabled&&/Not enough gold/.test(panel()),'no gold for a gift: disabled');P.gold=500;world();Object.assign(P.attr,A1)}

 // ---- the runaway horse: bolts as you come, then stops to graze; Catch it (a Riding check, its odds read by Insight)
 {goHome();P.gear.mount=null;const e=t.roadSpawn('horse',P.x+V*.45,P.y),d0=e.fromYou();frames(1);ok(e.fled&&!e.calm,'the runaway horse bolts as you come');
  let i=0;for(;i<2000&&!e.calm;i++)t.updateRoad(.05);ok(e.calm&&e.ran>=e.stop&&e.fromYou()>d0+e.stop*.7,'runs '+Math.round(e.ran)+' px, then stops to graze');const x=e.x,y=e.y;frames(200);ok(e.x===x&&e.y===y&&!e.gone,'and grazes where it stopped, as you come');
  t.roadMeet(e);P.sk.scout.lv=5;t.showRoad();ok(new RegExp(Math.round(t.catchOdds()*100)+'% to catch it').test(panel()),'Insight (Scouting 5): the odds of a catch ('+Math.round(t.catchOdds()*100)+'%)');P.sk.scout.lv=0;
  stub(0,()=>pickA(0));ok(P.gear.mount==='m_'+e.mk&&e.gone&&/is yours/.test(panel()),'Catch it, the check made: the '+t.ITEMS['m_'+e.mk].n+' is yours');world();
  const g0=P.gold,h=meet('horse');stub(0,()=>pickA(0));ok(P.gold===g0+t.itemPrice('m_'+h.mk)&&P.gear.mount==='m_'+e.mk,'with a mount already (the '+t.ITEMS['m_'+e.mk].n+' caught, as the land there breeds): its worth in gold ('+t.itemPrice('m_'+h.mk)+')');world();P.gear.mount=null;
  const b=meet('horse');stub(.99,()=>pickA(0));ok(b.beh==='bolt'&&!b.gone&&/bolts/.test(panel()),'missed: it bolts');world();const bd=b.fromYou();frames(40);ok(b.fromYou()>bd+5,'at a run');frames(3000);ok(b.gone,'and is gone');
  P.attr.agi=2;P.sk.ride.lv=0;const o0=t.catchOdds();P.sk.ride.lv=5;const o1=t.catchOdds();P.sk.ride.lv=0;ok(o1>o0,'Riding makes a catch likelier ('+Math.round(o0*100)+'% → '+Math.round(o1*100)+'%)');
  const ds=findT2((tx,ty)=>t.climAt((tx+.5)*TILE,(ty+.5)*TILE)==='desert');ok(!ds||t.roadMount({x:ds.x,y:ds.y})==='camel','the mount of the region: a horse here, a camel in the desert')}

 // ---- the beggar: walks up to you; Give 5, 10 or 20 gold (honor), or Ignore
 {goHome();const e=t.roadSpawn('beggar',P.x+120,P.y),d0=e.fromYou();frames(20);ok(e.fromYou()<d0-3,'the beggar walks up to you');frames(3000);
  ok(G.mode==='road'&&G.road===e&&acts().join('|')==='Give 5 gold|Give 10 gold|Give 20 gold'&&q('.nav [data-nav="close"]').textContent==='Ignore','reaching you, his page: Give 5, 10 or 20 gold, or Ignore');
  e.fac=Object.keys(t.FACS).find(x=>x!=='player');t.showRoad();const h0=t.honorWith(e.fac),g0=P.gold;pickA(1);ok(P.gold===g0-10&&t.honorWith(e.fac)===h0+TU.beggar.honor[1],'Give 10 gold: honor with the '+t.FACS[e.fac].n+' +'+TU.beggar.honor[1]);world();
  meet('beggar');t.act('enc-leave');ok(/calls a blessing after you/.test(G.msgs[G.msgs.length-1].m),'Ignore: you ride on');world();
  P.gold=8;meet('beggar');ok(qa('.rkact')[2].disabled&&!qa('.rkact')[0].disabled,'what you cannot spare is disabled');P.gold=500;world()}

 // ---- the messenger: rides up to you (faster than one on foot); Read the news (a place, a lord, a war); Rob (asks first)
 {goHome();const m=t.roadSpawn('messenger',P.x+120,P.y),b=t.roadSpawn('beggar',P.x-120,P.y);frames(20);ok(120-m.fromYou()>120-b.fromYou()+1,'the messenger rides up to you, faster than one on foot ('+Math.round(120-m.fromYou())+' px to '+Math.round(120-b.fromYou())+')');world();
  const e=meet('messenger');ok(t.ENC_SCENE.pics(e).length===1&&e.fac&&t.FACS[e.fac],'a rider in the '+(t.FACS[e.fac]||{}).n+'’s colours');
  const un=W.sites.filter(s=>!s.seen&&s.scoutable).length;stub(0,()=>pickA(0));ok(W.sites.filter(s=>!s.seen&&s.scoutable).length===un-1&&/It is on your map now/.test(panel()),'Read the news: a place you have not found goes on your map');world();
  meet('messenger');stub(.99,()=>pickA(0));ok(/are at war|keep the peace/.test(panel()),'or the wars ("'+(q('.pg-msg')||{}).textContent+'")');world();
  const n=t.roadNews;W.lords.forEach((l,i)=>{l.x=P.x+40*i;l.y=P.y});const lw=stub(.5,()=>n());ok(/ of the .* rides near /.test(lw),'or where a lord rides ("'+lw+'")');clear();
  cleanBag();const r=meet('messenger'),T0=t.townBy(r.home),r0=t.repAt(r.home),h0=t.honorWith(r.fac),g0=P.gold;pickA(1);ok(q('#panel.confirm')&&P.gold===g0&&!P.inv.some(Boolean),'Rob asks first');sure();
  const sl=P.inv.find(x=>x&&x.k==='letter');
  ok(P.gold===g0+r.purse&&sl&&sl.id===r.letter.id&&sl.n===1&&sl.L.to===r.letter.to&&sl.L.kind===r.letter.kind&&(sl.L.seen===0||sl.L.seen===1)&&t.repAt(r.home)===r0-t.CONDUCT.robMessenger.rep&&t.honorWith(r.fac)===h0-t.CONDUCT.robMessenger.honor&&T0.owner===r.fac&&/sealed letter, addressed to/.test(panel()),
    'confirmed: his purse ('+r.purse+' gold, no letter’s price) and his sealed letter in your bag ('+(sl&&sl.L.kind)+', to '+(sl&&sl.L.to)+'); reputation in '+r.home+' −'+t.CONDUCT.robMessenger.rep+', honor with the '+t.FACS[r.fac].n+' −'+t.CONDUCT.robMessenger.honor);world();
  P.inv.fill(null).forEach((x,i)=>{P.inv[i]={k:'good',id:'grain',n:1}});for(let i=0;i<t.BAG.maxOver;i++)P.inv.push({k:'good',id:'grain',n:1});const r2=meet('messenger'),g2=P.gold;pickA(1);sure();ok(P.gold===g2+r2.purse&&P.inv.some(x=>x&&x.k==='letter')&&!/bag is full/.test(panel()),'your bag past its limit: the purse, and the letter still (a quest item, never left in the mud)');cleanBag();world()}
 // ---- strayed sheep: a shepherd and his strays (ROAD_PART); help, ride into each, his thanks for what came back
 // (the strays fall 40-80 px round him, only 14 apart: two can stand within your reach (catchReach), and riding into one would
 // drive both home; spread: each set 60 px out from him, evenly round, so riding into one drives only that one)
 const spread=h=>{if(!h)return;const S=t.sheepStrays(h);S.forEach((o,i)=>{const a=.3+i*2*Math.PI/S.length;o.x=h.x+Math.cos(a)*60;o.y=h.y+Math.sin(a)*60})};
 {goHome();R().on=[];const h=spawnK('sheep',40,0);spread(h);ok(h&&h.n>=2&&h.n<=4&&t.sheepStrays(h).length===h.n&&t.sheepStrays(h).every(o=>o.pk===h.i&&o.D.part&&!o.seen),'the shepherd comes with '+(h&&h.n)+' strays round him, unseen as his till you help');
  const S=t.sheepStrays(h),o0=S[0];P.x=o0.x+t.ENC_SHEEP.shy-4;P.y=o0.y;const x0=o0.x;frames(4);ok(Math.hypot(o0.x-x0,0)>0&&!o0.caught,'a stray trots off from you when you come near ('+Math.round(o0.x-x0)+' px), not caught before you help');
  const n0=G.msgs.length;o0.meet();ok(!o0.caught&&/shepherd must be near/.test(G.msgs.slice(n0).map(m=>m.m).join()),'met before you help: only a word that its shepherd is near');
  t.roadMeet(h);ok(acts().join('|')==='Round them up','his page: Round them up');pickA(0);ok(h.help&&S.every(o=>o.seen)&&!h.done&&acts().length===0,'help: the strays marked, he waits, nothing more to choose');world();
  // (his thanks go to the holding nearest where the last one comes home: the one to read, as it was before)
  const g=t.sheepGood(h),gd0=t.goodN(g),rep0={...P.rep};S.slice(0,-1).forEach(o=>{P.x=o.x+4;P.y=o.y;frames(2)});
  ok(S.slice(0,-1).every(o=>o.caught&&o.gone)&&h.got===h.n-1&&!h.ended,'ride into a stray: it is back with the flock ('+h.got+' of '+h.n+')');
  {const sv=JSON.parse(JSON.stringify(t.roadSave()));const left=sv.road.on.filter(e=>e.pk===h.i);ok(left.length===1&&left[0].k==='stray','saved: the stray still out, its shepherd known (pk)')}
  // (the last one brought home by the test spot, a holding near enough to thank you on any world)
  const last=S[S.length-1];last.x=home.x;last.y=home.y;P.x=last.x+4;P.y=last.y;frames(2);
  ok(h.ended&&h.done&&h.beh==='leave'&&t.goodN(g)-gd0===h.n*t.ENC_SHEEP.good&&t.repAt(t.nearHold().name)-(rep0[t.nearHold().name]||0)>=h.n*t.ENC_SHEEP.rep,'every one home: his '+t.GOODS[g].n.toLowerCase()+' a sheep, reputation, and he walks off with his flock');
  goHome();R().on=[];const h2=spawnK('sheep',40,0);spread(h2);h2.help=1;const S2=t.sheepStrays(h2);P.x=S2[0].x+4;P.y=S2[0].y;frames(2);const gd1=t.goodN(t.sheepGood(h2));S2.slice(1).forEach(o=>o.over());
  ok(h2.ended&&h2.got===1&&t.goodN(t.sheepGood(h2))-gd1===t.ENC_SHEEP.good,'the rest wander off: thanks for the one back, and he goes')}
 // ---- the ambush: unseen below Scouting 2, it springs as you pass; a forced choice
 {ev('TERRAIN.on=true');const findT=f=>{for(let ty=12;ty<t.MH-12;ty++)for(let tx=12;tx<t.MW-12;tx++)if(f(tx,ty))return[(tx+.5)*TILE,(ty+.5)*TILE];return null};
  const c=findT((tx,ty)=>t.tAt(tx,ty)===t.T_ROAD&&t.coverAt((tx+.5)*TILE,(ty+.5)*TILE)==='forest'&&far(tx,ty));ok(!!c,'a road through a wood');at(c[0],c[1]);P.troops={hum_levy:6};
  ok(t.ROAD_ENC.ambush.ok(),'the ambush can come where there is cover');ev('TERRAIN.on=false');ok(!t.ROAD_ENC.ambush.ok(),'never without battle terrain');ev('TERRAIN.on=true');
  // (25 px off: well inside your sight even should it stand among the trees, which hide one past 0.45 of it; still short of its spring)
  P.sk.scout.lv=1;const e=t.roadSpawn('ambush',P.x+25,P.y);frames(1);ok(!e.inView(t.vis())&&!e.seen&&!e.marked()&&t.pickAt(e.x,e.y-4)!==e,'Scouting 1: unseen, unmarked, nothing to click');
  P.sk.scout.lv=2;frames(1);ok(e.inView(t.vis())&&e.seen&&e.marked()&&G.msgs.slice(-3).some(m=>/movement in the trees/.test(m.m)),'Scouting 2: “movement in the trees”, marked ('+[e.inView(t.vis()),!!e.seen,e.marked(),G.mode,(G.msgs.slice(-1)[0]||{}).m].join(' · ')+')');P.sk.scout.lv=0;
  P.x=e.x-30;P.y=e.y;frames(1);ok(G.mode==='world','not yet sprung at 30 px');P.x=e.x-10;frames(1);ok(G.mode==='road'&&G.road===e&&!q('.nav [data-nav="close"]')&&!t.escDismiss(),'passing it, it springs: a forced choice, no Leave');
  pickA(0);ok(G.enc&&G.enc.btype&&G.enc.btype.kind==='ambush'&&G.enc.btype.hid===1&&/Ambush!/.test(panel()),'Close up and fight: the ambush battle');t.act('flee');world();
  at(c[0],c[1]);P.gold=100;t.invAdd('good','grain',10);const f0=t.foodN(),m0=P.morale=50,g=t.roadSpawn('ambush',P.x+10,P.y);t.roadMeet(g);pickA(1);ok(P.gold===85&&t.foodN()===f0-4&&P.morale===46&&g.gone&&q('.nav [data-nav="close"]'),'Cut the baggage loose: −4 food, −15 gold, morale −4; then Leave');world();ev('TERRAIN.on=false')}

 // ======== phase 4: the fake wounded (a lure; ENC_TUNE.lure)
 {const TU4=t.ENC_TUNE.lure;goHome();P.troops={hum_levy:6};P.sk.scout.lv=0;G.clock=t.DAY*.3;
  // where and how often: woods by a road; rarer than the real one, likelier at night, in the wild, near bands and camps
  const S0=W.sites;W.sites=S0.filter(s=>s.type!=='camp'&&s.type!=='hideout');// (only the bands put here count)
  const w0=t.roadW('lure');G.clock=t.DAY*.75;const wn=t.roadW('lure');G.clock=t.DAY*.3;
  const fake=[0,1,2].map(i=>({x:P.x+40+i*5,y:P.y}));t.bandits.push(...fake);const wb=t.roadW('lure');t.bandits.push(...fake,...fake);const wmax=t.roadW('lure');G.clock=t.DAY*.75;const wall=t.roadW('lure');G.clock=t.DAY*.3;t.bandits.length=0;
  ok(w0<t.roadW('traveller')&&wn>w0&&wb>w0&&wall<=TU4.cap+1e-9&&wall<t.roadW('traveller'),'the lure: rarer than the wounded traveller ('+w0.toFixed(2)+' vs '+t.roadW('traveller')+'), likelier at night ('+wn.toFixed(2)+') and near bands ('+wb.toFixed(2)+'), never past '+TU4.cap+' ('+wall.toFixed(2)+')');
  {const A=t.townBy('Ashford');at(A.x+60,A.y+60);const held=!!t.landHold(P.x,P.y),wh=t.roadW('lure');goHome();const wild=!t.landHold(P.x,P.y),ww=t.roadW('lure');ok(!held||!wild||ww>wh,'likelier in the wild than on a holding’s land ('+ww.toFixed(2)+' vs '+wh.toFixed(2)+')')}W.sites=S0;
  P.troops={hum_levy:2};ok(!D('lure').ok(),'not with fewer than 3 soldiers');P.troops={hum_levy:6};ok(D('lure').ok(),'with a band, anywhere');
  {const lw=findT2((tx,ty)=>t.ENC_ON.lure(tx,ty)&&t.TOWNS.every(z=>Math.hypot(z.tx-tx,z.ty-ty)>14));let ps=[];if(lw)for(let a=0;a<8&&!ps.length;a++){const V0=t.vis(),x=lw.x+Math.cos(a*.785)*(V0+80),y=lw.y+Math.sin(a*.785)*(V0+80);if(!t.passable(t.tAt(Math.floor(x/TILE),Math.floor(y/TILE))))continue;
    at(x,y);const sd=t.seeded(77);for(let i=0;i<40;i++){const p=stub(sd,()=>t.roadSpot('lure'));if(p)ps.push(p)}}
   ok(ps.length>0&&ps.every(([x,y])=>t.ENC_ON.lure(Math.floor(x/TILE),Math.floor(y/TILE))&&!t.nearTile(Math.floor(x/TILE),Math.floor(y/TILE),t.T_ROAD,1)&&t.nearTile(Math.floor(x/TILE),Math.floor(y/TILE),t.T_ROAD,t.ENC_BY)),'placed beside a road, as the wounded traveller lies, with woods or hills by it ('+ps.length+' of 40)')}
  // to the eye, the wounded traveller: its name, call, sound, tooltip, highlight, picture
  goHome();R().on=[];const tr=t.roadSpawn('traveller',P.x+30,P.y),lu=t.roadSpawn('lure',P.x+30,P.y+20);lu.end=tr.end;lu.dir=tr.dir;lu.race=tr.race;// (the same people, facing the same way: each draws its own where it lies)
  const pt=t.ENC_SCENE.pics(tr),pl=t.ENC_SCENE.pics(lu);
  ok(['n','call','hear','tip','ico','beh'].every(k=>lu.D[k]===tr.D[k])&&!lu.D.hidden&&!lu.D.foe&&t.wuiKind(lu)===t.wuiKind(tr)&&pl.length===1&&pl[0][0]===pt[0][0]&&t.tipFor(lu)===t.tipFor(tr),'on the map it is the wounded traveller: the same name, call-out ("'+lu.D.call+'"), log line, tooltip, highlight and picture');
  ok(lu.foes.length>=5&&lu.foes.length<=7+Math.floor(G.day/15)&&['bandits','raiders','bog'].includes(lu.band),'bandits hide near: a band the size of an ambush’s ('+lu.foes.length+' '+lu.band+')');
  // Insight: below 3, his page is the real one's; at 3 the brush moves; at 5 how many and the odds
  const pg=e=>{t.roadMeet(e);const h=[q('.rwin h2').textContent,q('.rwbody>p').textContent,(q('.pg-facts')||{}).innerHTML,acts().join('|'),(q('.nav [data-nav="close"]')||{}).textContent].join(' ¦ ');world();return h};
  for(const lv of [0,2]){P.sk.scout.lv=lv;const a=pg(lu),b=pg(tr);ok(a===b,'Scouting '+lv+': his page reads exactly as the real one’s ('+a.replace(/<[^>]+>/g,'').slice(0,140)+'…)')}
  P.sk.scout.lv=3;{const a=pg(lu);ok(/something moves in the brush behind him/.test(a)&&!/lie in wait/.test(a)&&/Approach ready\|Call them out ¦/.test(a),'Scouting 3: “something moves in the brush behind him”; Approach ready, Call them out, Leave')}
  P.sk.scout.lv=5;{const a=pg(lu);ok(new RegExp(lu.foes.length+' bandits lie in wait: .*odds').test(a),'Scouting 5: how many and the odds ('+(a.match(/\d+ bandits lie in wait[^<]*<span[^>]*>[^<]*<\/span>[^<]*/)||[''])[0].replace(/<[^>]+>/g,'')+')')}
  P.sk.scout.lv=0;
  // its choices
  const lure=(set)=>{goHome();P.troops={hum_levy:6};R().on=[];const e=t.roadSpawn('lure',P.x+10,P.y);if(set)set(e);t.roadMeet(e);return e};
  t.invAdd('good','grain',10);{const e=lure(),n=e.foes.length,f0=t.foodN();pickA(0);
   ok(G.enc&&G.enc.btype&&G.enc.btype.kind==='ambush'&&G.enc.btype.hid===1&&G.enc.list.length===n&&[...G.enc.list].sort().join()===[...e.foes].sort().join()&&e.gone&&t.foodN()===f0&&/Ambush!/.test(panel()),'Scouting 0, Tend his wounds: the ambush springs, their '+n+' with the ambush’s edge');t.act('flee');world()}
  {const e=lure(),g0=P.gold;pickA(1);ok(q('#panel.confirm')&&P.gold===g0,'Take his purse asks first, as the real one’s');sure();ok(G.enc&&G.enc.btype&&G.enc.btype.kind==='ambush'&&P.gold===g0,'and springs the ambush');t.act('flee');world()}
  P.sk.scout.lv=3;
  {const e=lure();pickA(2);ok(G.enc&&!G.enc.btype&&G.enc.list.length===e.foes.length&&e.gone,'warned, Approach ready: the fight, without their ambush edge');t.act('flee');world()}
  {const e=lure(e=>{e.foes=e.foes.concat(['militia','militia'])});stub(0,()=>pickA(3));ok(e.out&&!e.gone&&!G.enc&&G.mode==='road'&&acts().join('|')==='Fight them'&&q('.nav [data-nav="close"]')&&new RegExp(e.foes.length+' bandits rise from the brush').test(panel()),'Call them out ('+e.foes.length+', too many to scare): they show themselves; Fight them, or Leave');
   ok(t.ENC_SCENE.lay(e,true).filter(p=>p.k==='soldier').length===3&&t.ENC_SCENE.lay(e,true).some(p=>p.k==='stand'),'on the map, the “wounded man” on his feet and the bandits round him');
   pickA(4);ok(G.enc&&!G.enc.btype&&G.enc.list.length===e.foes.length,'Fight them: no ambush edge');t.act('flee');world()}
  {const e=lure();stub(.999,()=>pickA(3));t.act('enc-leave');ok(G.mode==='world'&&e.out&&!e.gone&&/You ride on/.test(G.msgs[G.msgs.length-1].m),'called out, Leave: you ride on, they watch you go');world()}
  {P.sk.lead.lv=5;P.attr.cha=6;const e=lure(e=>{e.foes=e.foes.slice(0,5)}),c=t.roadScare();stub(0,()=>pickA(3));ok(e.gone&&e.done&&!G.enc&&!qa('.rwbody .rkact').length&&/melt back into the woods/.test(panel()),'a small band ('+e.foes.length+') may be scared off by your Leadership and Charisma ('+Math.round(c*100)+'%): they melt back into the woods');world();P.sk.lead.lv=0;P.attr.cha=2}
  {const e=lure();t.act('enc-leave');ok(G.mode==='world'&&G.msgs[G.msgs.length-1].m==='You leave him to his fate.','Leave: you leave him to his fate')}
  P.sk.scout.lv=0;
  // left be: the bandits move on, no body; the word on the road
  {goHome();R().on=[];const e=t.roadSpawn('lure',P.x+40,P.y);e.seen=1;const n0=G.msgs.length;G.clock+=(e.end-t.roadNow()+.1)*t.DAY/24;P.x=e.x-V*1.2;frames(1);
   ok(e.gone&&!R().on.some(x=>x.trace)&&/Word on the road: a “wounded man”/.test(logsSince(n0)),'left be: the bandits move on (no body), and word gets round');G.clock=t.DAY*.3}
  world()}

 // ======== phase 4: the sealed letter (world/letters.js; ENC_TUNE.letter)
 {const TL=t.ENC_TUNE.letter,FS=Object.keys(t.FACS).filter(x=>x!=='player'),rk=t.rk,setRel=(a,b,s)=>{W.rel[rk(a,b)]={s,since:1}};
  // (f: a realm of two holdings or more with a lord alive: the lords parked off the map (clear) stand together, and those at war
  // fight there while the map runs; a realm can come out of it with every lord beaten)
  const f=FS.find(x=>t.fiefsOf(x).length>1&&W.lords.some(o=>o.fac===x&&!o.dead)),g=FS.find(x=>x!==f&&t.fiefsOf(x).length),g2=FS.find(x=>x!==f&&x!==g&&t.fiefsOf(x).length),h=t.fiefsOf(f)[0],rel0=JSON.stringify(W.rel);
  for(const a of FS)for(const b of FS)if(a<b)setRel(a,b,'peace');setRel(f,g,'war');if(g2)setRel(g,g2,'war');
  let mkN=0;const only=(k,fn)=>{const w0={...TL.w};for(const q in TL.w)TL.w[q]=q===k?1:0;try{return fn()}finally{Object.assign(TL.w,w0)}},mk=k=>only(k,()=>t.letterMake({i:900+(++mkN),fac:f,home:h.name,x:h.x,y:h.y+40}));
  const l=W.lords.find(o=>o.fac===f&&!o.dead),gt=t.fiefsOf(g)[0];const ls0={state:l.state,tgt:l.tgt,inside:l.inside};l.inside=null;l.state='march';l.tgt=gt.name;
  const rest0=W.lords.filter(o=>o.fac===f&&o!==l).map(o=>[o.id,o.state]);W.lords.forEach(o=>{if(o.fac===f&&o!==l)o.state='rest'});// (his realm's other lords at rest: his is the one army)
  // its contents, chosen when he comes, from the world as it stands
  const A=mk('army'),K=mk('attack'),Dl=mk('deal'),N=mk('news'),base=L=>L.fac===f&&L.from&&t.townBy(L.from).owner===f&&L.stale-L.day>=TL.stale[0]&&L.stale-L.day<=TL.stale[1]&&L.seal===1&&L.seen===0&&/^L\d+$/.test(L.id);
  ok(base(A)&&A.kind==='army'&&A.lord===l.id&&A.ln===l.name&&A.tgt===gt.name&&A.n===l.troops.length&&A.to===h.name&&A.toFac===f&&A.from!==A.to,'a lord’s army: '+l.name+' marching on '+A.tgt+' with '+A.n+' ('+A.from+' to '+A.to+', stale on day '+A.stale+')');
  ok(base(K)&&K.kind==='attack'&&K.vs===g&&t.townBy(K.tgt).owner===g&&K.to===h.name,'a holding his realm means to attack: '+K.tgt+' of the '+t.FACS[g].n);
  ok(base(Dl)&&Dl.kind==='deal'&&Dl.with!==f&&!t.atWar(f,Dl.with)&&t.townBy(Dl.to).owner===Dl.with&&Dl.toFac===Dl.with&&Dl.rel===t.relOf(f,Dl.with).s&&(Dl.vs===null||t.atWar(f,Dl.vs)),'a deal between two realms: the '+t.FACS[f].n+' to the '+t.FACS[Dl.with].n+' at '+Dl.to+(Dl.vs?', against the '+t.FACS[Dl.vs].n:''));
  ok(base(N)&&N.kind==='news'&&N.to===h.name&&(N.site===null||W.sites.some(s=>s.tx===N.site[0]&&s.ty===N.site[1]&&!s.seen)),'plain news'+(N.site?', of a place you have not found':''));
  ok(A.worth>K.worth*.5&&N.worth<A.worth&&[A,K,Dl,N].every(L=>L.worth>=Math.round(TL.worth[0]*TL.kind[L.kind])&&L.worth<=Math.round(TL.worth[1]*TL.kind[L.kind])),'worth by its kind: army '+A.worth+', attack '+K.worth+', deal '+Dl.worth+', news '+N.worth+' gold');
  ok(/marches with/.test(t.letterText(A))&&/will fall on/.test(t.letterText(K))&&/offers the/.test(t.letterText(Dl))&&/All is well at/.test(t.letterText(N)),'and what it says, in the sender’s words');
  // with no lord marching and no war: no army, no attack
  {const st=l.state;l.state='rest';setRel(f,g,'peace');const ks=new Set();const s=t.seeded(5);for(let i=0;i<40;i++)ks.add(stub(s,()=>t.letterMake({i:950+i,fac:f,home:h.name,x:h.x,y:h.y})).kind);l.state=st;setRel(f,g,'war');
   ok(!ks.has('army')&&!ks.has('attack')&&ks.has('news'),'no lord marching and no war: only deals and news ('+[...ks].join(', ')+')')}
  // the witness, when you rob him: who was near, less by Scouting and the night
  {goHome();R().on=[];const m=t.roadSpawn('messenger',P.x+20,P.y),W0=TL.witness,farT=(x,y)=>Math.min(...t.TOWNS.filter(z=>!z.gone).map(z=>Math.hypot(z.x-x,z.y-y)));
   {let bx=P.x,by=P.y;for(const r of [20,40])for(let a=0;a<16;a++){const x=P.x+Math.cos(a*Math.PI/8)*r,y=P.y+Math.sin(a*Math.PI/8)*r;if(farT(x,y)>farT(bx,by)){bx=x;by=y}}m.x=bx;m.y=by}P.sk.scout.lv=0;G.clock=t.DAY*.3;const p0=t.letterWitness(m);
   W.caravans.push({x:m.x+30,y:m.y});const p1=t.letterWitness(m);W.caravans.length=0;G.clock=t.DAY*.75;const pn=t.letterWitness(m);G.clock=t.DAY*.3;P.sk.scout.lv=5;const ps=t.letterWitness(m);P.sk.scout.lv=0;
   const A2=t.townBy('Ashford');at(A2.x+60,A2.y+60);R().on=[];const mh=t.roadSpawn('messenger',P.x+20,P.y),ph=t.letterWitness(mh);
   ok(Math.abs(p0-W0.base)<1e-9&&Math.abs(p1-(W0.base+W0.per))<1e-9&&Math.abs(pn-W0.base*W0.night)<1e-9&&Math.abs(ps-W0.base*(1-5*W0.scout))<1e-9&&ph>=W0.base+W0.hold-1e-9,
     'the witness roll: '+Math.round(p0*100)+'% alone on the road, '+Math.round(p1*100)+'% with a caravan near, '+Math.round(pn*100)+'% by night, '+Math.round(ps*100)+'% at Scouting 5, '+Math.round(ph*100)+'% by a holding');
   cleanBag();t.roadMeet(mh);pickA(1);stub(0,()=>sure());const s1=P.inv.find(x=>x&&x.k==='letter');ok(s1&&s1.L.seen===1&&/saw it all/.test(panel()),'seen: stored on the letter (“someone on the road saw it all”)');world();
   cleanBag();goHome();R().on=[];const mu=t.roadSpawn('messenger',P.x+20,P.y);t.roadMeet(mu);pickA(1);stub(.999,()=>sure());const s2=P.inv.find(x=>x&&x.k==='letter');ok(s2&&s2.L.seen===0&&/Nobody saw you/.test(panel()),'unseen: “nobody saw you”');world();cleanBag()}
  // its page from the bag: its verbs (Back to the bag, the way out to the map)
  const put=L=>{cleanBag();P.inv[3]={k:'letter',id:L.id,n:1,L};return P.inv[3]};
  {world();const L=mk('army');put(L);t.openInv();t.act('inv-sel','3');ok(/Sealed letter/.test(panel())&&q('[data-act="ltr-open"]')&&q('.invgrid canvas'),'in the bag: a sealed letter (its icon), and Look it over');
   t.act('ltr-open',L.id);ok(G.mode==='letter'&&q('#panel.paged')&&q('.rwin h2').textContent==='Sealed letter'&&acts().join('|')==='Break the seal|Sell it to a rival|Deliver it|Burn it'&&q('.nav [data-nav="back"]').textContent==='Back to the bag'&&q('.nav [data-nav="close"]').textContent==='Back to map','its page: Break the seal, Sell it to a rival, Deliver it, Burn it; Back to the bag, Back to map');
   ok(qa('.rkact')[1].disabled&&qa('.rkact')[2].disabled&&/Only in a holding of a realm at war with/.test(panel())&&new RegExp('Only at '+L.to).test(panel())&&!/ltr-text/.test(panel()),'on the map: no selling, no delivering, and why; its words unread');
   const n0=G.msgs.length;t.act('ltr-do','0');const at=t.townBy(L.tgt);
   ok(L.seal===0&&q('.rwin h2').textContent==='Opened letter'&&/marches with/.test(q('.ltr-text').textContent)&&/A letter of the .*marches with/.test(logsSince(n0))&&t.seenTile(Math.floor(at.x/TILE),Math.floor(at.y/TILE))&&acts().join('|')==='Sell it to a rival|Deliver it|Burn it'&&P.inv[3]&&P.inv[3].L===L,'Break the seal: you read it (“'+t.letterText(L).slice(1,40)+'…”), in your log, '+L.tgt+' on your map; it stays in the bag, opened');
   t.act('ltr-back');ok(G.mode==='inv'&&G.invSel===3&&/Opened letter/.test(panel()),'Back: the bag, the letter chosen');t.act('ltr-open',L.id);t.act('ltr-close');ok(G.mode==='world'&&t.ov.hidden,'Back to map')}
  {world();const L=mk('news'),s=t.letterSite(L);put(L);if(s){t.openInv();t.act('ltr-open',L.id);t.act('ltr-do','0');ok(s.seen&&/is on your map now/.test(panel()),'news of a place: the '+s.label+' goes on your map');world()}}
  // sell it to a rival: only in a holding of a realm at war with the sender; more while sealed
  const town=(T,L)=>{world();t.enterTown(T);t.act('ltr-open',L.id+':town')};
  {const L=put(mk('army')).L,g0=P.gold,r0=t.repAt(gt.name);world();t.enterTown(gt);ok(/Your letters/.test(panel())&&/they would buy it/.test(panel())&&q('[data-act="ltr-open"]'),'in a rival’s holding, its overview shows your letter');
   t.act('ltr-open',L.id+':town');ok(G.mode==='letter'&&!qa('.rkact')[1].disabled&&qa('.rkact')[2].disabled&&q('.nav [data-nav="back"]').textContent==='Back'&&new RegExp('Leave ').test(q('.nav [data-nav="close"]').textContent),'its page there: sell it, not deliver it; Back to the holding, Leave');
   const want=Math.round(L.worth*TL.sell);t.act('ltr-do','1');ok(P.gold===g0+want&&t.repAt(gt.name)===r0+TL.rep.sell&&!P.inv.some(x=>x&&x.k==='letter')&&/pays/.test(panel())&&!qa('.rwbody .rkact').length,'Sell it, sealed, in '+gt.name+' (the '+t.FACS[g].n+', at war with its sender): +'+want+' gold, reputation +'+TL.rep.sell+'; gone from the bag');
   t.act('ltr-back');ok(G.mode==='town'&&!/Your letters/.test(panel()),'Back: the holding')}
  {const L=put({...mk('army'),seal:0}).L,g0=P.gold;town(gt,L);const want=Math.max(1,Math.round(L.worth*TL.sell*TL.opened));t.act('ltr-do','1');ok(P.gold===g0+want,'opened, it sells for less: '+want+' gold');}
  {const L=put(mk('army')).L,peace=t.fiefsOf(f).find(x=>x!==h)||h;town(peace,L);ok(qa('.rkact')[1].disabled&&/is not at war with/.test(panel()),'in a holding not at war with its sender ('+peace.name+'): no selling')}
  // deliver it: at the holding it is addressed to; a reward, less opened; seen, it costs you
  {const L=put(mk('army')).L,g0=P.gold,r0=t.repAt(h.name);town(h,L);ok(!qa('.rkact')[2].disabled&&qa('.rkact')[1].disabled,'at '+h.name+', where it is addressed: deliver it (its own realm will not buy it)');
   const want=Math.round(L.worth*TL.deliver);t.act('ltr-do','2');ok(P.gold===g0+want&&t.repAt(h.name)===r0+TL.rep.deliver&&!P.inv.some(x=>x&&x.k==='letter')&&/thanks you/.test(panel()),'Deliver it, sealed, unseen: +'+want+' gold, reputation +'+TL.rep.deliver)}
  {const L=put({...mk('army'),seal:0}).L,g0=P.gold,r0=t.repAt(h.name);town(h,L);t.act('ltr-do','2');const want=Math.round(L.worth*TL.deliver*TL.opened);ok(P.gold===g0+want&&t.repAt(h.name)===r0+Math.ceil(TL.rep.deliver/2)&&/frowns at the broken seal/.test(panel()),'opened: +'+want+' gold and half the reputation, a frown at the broken seal')}
  {const L=put({...mk('army'),seen:1}).L,g0=P.gold,r0=t.repAt(h.name);town(h,L);t.act('ltr-do','2');ok(q('#panel.confirm')&&P.gold===g0,'the robbery seen: delivering asks first');q('.nav [data-nav="close"]').click();
   ok(P.gold===g0&&t.repAt(h.name)===r0-TL.rep.seen&&/eyes narrow/.test(panel()),'and costs reputation −'+TL.rep.seen+' instead of a reward')}
  {const L=put(mk('army')).L;town(gt,L);ok(new RegExp('Only at '+h.name).test(panel())&&qa('.rkact')[2].disabled,'elsewhere: no delivering');world()}
  // stale: its news has happened (its lord arrived, the attack came, the deal settled) or it is old: worth little, and it says so
  {const L=mk('army');ok(!t.letterStale(L),'fresh while its lord still marches');l.state='siege';ok(/reached/.test(t.letterStale(L)),'stale once he lays siege ('+t.letterStale(L)+')');l.state='march';l.tgt=h.name;ok(/elsewhere/.test(t.letterStale(L)),'or rides elsewhere');l.tgt=gt.name;
   const K2=mk('attack'),T2=t.townBy(K2.tgt),o2=T2.owner;ok(!t.letterStale(K2),'an attack: fresh');T2.owner=f;ok(/changed hands/.test(t.letterStale(K2)),'stale once '+K2.tgt+' falls');T2.owner=o2;
   const D2=mk('deal');setRel(f,D2.with,D2.rel==='ally'?'peace':'ally');ok(/settled/.test(t.letterStale(D2)),'a deal: stale once the realms settle it');setRel(f,D2.with,D2.rel);
   const day0=G.day;G.day=L.stale;ok(/days old/.test(t.letterStale(L)),'any: stale after its days ('+(L.stale-L.day)+')');
   put(L);const g0=P.gold;town(gt,L);ok(/stale: whatever it says has surely happened by now; worth little/.test(panel()),'its page says so');const want=Math.max(1,Math.round(L.worth*TL.sell*TL.old));t.act('ltr-do','1');ok(P.gold===g0+want,'and it sells for little: '+want+' gold');G.day=day0;world()}
  // burn it
  {const L=put(mk('news')).L;t.openInv();t.act('ltr-open',L.id);t.act('ltr-do','3');ok(q('#panel.confirm')&&P.inv[3],'Burn it asks first');q('.nav [data-nav="close"]').click();ok(!P.inv.some(x=>x&&x.k==='letter')&&/curls up in the fire/.test(panel()),'burnt: gone');world()}
  // saved and loaded: the messenger's letter is made when he comes, and saved with him
  {goHome();R().on=[];const m=t.roadSpawn('messenger',P.x+90,P.y);const snap=JSON.stringify(m.letter);G.mode='world';G.modal=false;t.saveGame(true);W.road=null;t.loadGame();
   const m2=W.road.on.find(x=>x.k==='messenger');ok(m2&&JSON.stringify(m2.letter)===snap&&m2.letter.id==='L'+m2.i,'the messenger’s letter, chosen when he comes ('+m2.letter.kind+', to '+m2.letter.to+'), is saved and loaded with him');world()}
  // and with the bag
  {const L={...mk('deal'),seal:0,seen:1};put(L);world();const snap=JSON.stringify(P.inv[3]);t.saveGame(true);P.inv[3]=null;t.loadGame();
   ok(JSON.stringify(P.inv[3])===snap&&P.inv[3].L.kind==='deal'&&P.inv[3].L.seal===0&&P.inv[3].L.seen===1&&t.itemDef(P.inv[3]).n==='Opened letter','a letter in the bag is saved and loaded as it was (opened, seen, its contents)');cleanBag()}
  const ls1=W.lords.find(o=>o.id===l.id);if(ls1)Object.assign(ls1,ls0);for(const [id,st] of rest0){const o=W.lords.find(x=>x.id===id);if(o)o.state=st}W.rel=JSON.parse(rel0);world()}

 // ======== how they end: nothing ends while you can see it (owner, 2026-10-19; ENC_END). Its time up in your sight, each ends its
 // kind's way and is gone once out of it; out of your sight, it ends there as ever. (The processions and the pilgrims: above)
 {const LF=t.ENC_LIFE,past=(e,h=.1)=>{G.clock+=(e.end-t.roadNow()+h)*t.DAY/24},away=e=>{P.x=e.x-t.vis()*1.2;P.y=e.y},ks=e=>t.ENC_SCENE.lay(e,true).map(p=>p.k);
  const nTr=k=>R().on.filter(x=>x.trace&&x.k===k&&!x.gone).length;
  // (walking off, you standing still: how many moments, whether it was in your sight the moment before it went, how much of its way
  // along the road was on road tiles)
  const walkOff=e=>{let pre=true,i=0,n=0,on=0;for(;i<12000&&!e.gone;i++){const r=t.ROAD_OFF.get(e);if(r&&r.i<r.path.length){n++;if(t.tAt(Math.floor(e.x/TILE),Math.floor(e.y/TILE))===t.T_ROAD)on++}pre=e.inView(t.vis());t.updateRoad(.05)}return{i,pre,n,on}};
  // (a road tile a few tiles along the road from you: the farthest whose way off along the road (roadOffGoal) leads away from
  // you all the way, else the farthest. Where the road's far end lies past you, one walking off cuts across beside the road
  // round you, joining it ahead (never back past you): off the road by design, as the test spot (home) moves with the sites)
  const awayAll=(x,y)=>{const g=t.roadOffGoal({x,y}),st=t.roadTileBy(x,y);if(!g||st<0)return false;const goal=g[1]*t.MW+g[0],fr=t.roadAlong(st,t.ENC_OFF.steps*2,goal),d0=Math.hypot(x-P.x,y-P.y);
    if(!fr.has(goal))return false;for(let k=fr.get(goal);k!==st&&k!==-1;k=fr.get(k))if(Math.hypot((k%t.MW+.5)*TILE-P.x,(Math.floor(k/t.MW)+.5)*TILE-P.y)<=d0)return false;return true};
  const roadBy=n=>{const s=t.roadTileBy(P.x,P.y),c=[];for(const k of t.roadAlong(s,n).keys()){const x=(k%t.MW+.5)*TILE,y=(Math.floor(k/t.MW)+.5)*TILE;c.push([x,y,Math.hypot(x-P.x,y-P.y)])}
    c.sort((a,b)=>b[2]-a[2]);const w=c.find(([x,y])=>awayAll(x,y))||c[0];return w&&w[2]>0?[w[0],w[1]]:null};
  // ---- the ones that stay and move on (gamblers, hunters, deserters, the poacher): pack up and walk off, along the road where there is one
  {goHome();R().on=[];const p=roadBy(3),e=t.roadSpawn('gamblers',p[0],p[1]);e.seen=1;const d0=e.fromYou();past(e);frames(1);
   ok(!e.gone&&e.beh==='leave'&&e.left&&e.inView(t.vis())&&e.chaseable(),'gamblers, their time up in your sight: they do not vanish, they pack up and walk off');
   ok(ks(e).length===3&&ks(e).every(k=>k==='soldier'),'only the people go: no cloth, no fire ('+ks(e).join(', ')+')');
   ok(Array.isArray(e.lg)&&t.tAt(e.lg[0],e.lg[1])===t.T_ROAD,'a road by them: they take it, away from you (to '+e.lg.join(',')+')');
   // saved and loaded mid-leave
   G.mode='world';G.modal=false;const snap=JSON.stringify(e);t.saveGame(true);W.road=null;t.loadGame();const e2=R().on.find(x=>x.i===e.i);
   ok(e2&&JSON.stringify(e2)===snap&&e2.left&&e2.beh==='leave','saved and loaded mid-leave, as they were');
   const w=walkOff(e2);ok(e2.gone&&!w.pre&&w.n>10&&w.on>=w.n*.9,'they walk off along the road ('+w.on+' of '+w.n+' moments on its tiles) and are gone once out of your sight ('+w.i+' moments)');
   goHome();R().on=[];const f=t.roadSpawn('gamblers',P.x+40,P.y);f.seen=1;past(f);away(f);frames(1);ok(f.gone,'out of your sight at their time: gone, as ever')}
  {goHome();R().on=[];const e=t.roadSpawn('hunters',P.x+40,P.y);e.seen=1;past(e);frames(1);const k=ks(e);
   ok(!e.gone&&e.left&&k.length===2&&k.every(x=>x==='walk'),'the hunters walk off, the camp with them: only the hunters drawn ('+k.join(', ')+')');const w=walkOff(e);ok(e.gone&&!w.pre,'gone once out of your sight')}
  {goHome();R().on=[];const e=t.roadSpawn('poacher',P.x+40,P.y);e.seen=1;past(e);frames(1);ok(!e.gone&&e.left&&ks(e).join()==='carcass,walk','the poacher drags his deer off');walkOff(e);ok(e.gone,'and is gone once out of your sight')}
  // ---- the cart stuck in the mud: the farmer walks off, the abandoned cart left now, in place
  {goHome();R().on=[];const p=roadBy(3),e=t.roadSpawn('mud',p[0],p[1]);e.seen=1;const x0=e.x,y0=e.y;past(e);frames(1);const tr=R().on.find(x=>x.trace&&x.k==='cart');
   ok(!e.gone&&e.left&&e.done&&ks(e).join()==='worker'&&tr&&tr.x===x0&&tr.y===y0&&tr.inView(t.vis())&&tr.from<=t.roadNow(),'the cart stuck in the mud, its time up in your sight: the farmer walks off, the abandoned cart left at once where it stuck');
   ok(!e.marked()&&!e.chaseable(),'(him done with: no highlight, nothing to click)');
   const w=walkOff(e);ok(e.gone&&!w.pre&&nTr('cart')===1&&!tr.gone,'he is gone once out of your sight; the cart stays, one cart')}
  // ---- the wounded traveller: dies only while you are not looking (or, watched long past his time, before your eyes)
  {goHome();R().on=[];const e=t.roadSpawn('traveller',P.x+40,P.y);e.seen=1;past(e);frames(50);
   ok(!e.gone&&e.beh==='stay'&&e.chaseable()&&!nTr('body')&&ks(e).join()==='down','the wounded traveller, his time up in your sight: he holds on, still there to help');
   t.roadMeet(e);ok(/Tend his wounds/.test(acts().join('|')),'and can still be met');world();
   away(e);frames(1);const b=R().on.find(x=>x.trace&&x.k==='body');ok(e.gone&&b&&b.x===e.x,'out of your sight, he dies: his body where he lay');
   goHome();R().on=[];const f=t.roadSpawn('traveller',P.x+40,P.y);f.seen=1;past(f,LF.dying-.2);frames(1);ok(!f.gone,'watched, he lasts '+LF.dying+' h past his time');
   past(f,LF.dying+.1);frames(1);ok(f.gone&&nTr('body')===1&&R().on.find(x=>x.trace).inView(t.vis()),'then dies before your eyes: the body in his place')}
  // ---- places and the hidden: the collapsed mine, the lure, the ambush end only out of your sight
  {goHome();R().on=[];const e=t.roadSpawn('mine',P.x+40,P.y);e.seen=1;past(e,30);frames(50);ok(!e.gone&&!e.left,'the collapsed mine: never gone while you see it');away(e);frames(1);ok(e.gone,'gone once out of your sight')}
  {goHome();R().on=[];P.troops={hum_levy:6};const e=t.roadSpawn('lure',P.x+40,P.y);e.seen=1;const n0=G.msgs.length;past(e,30);frames(50);ok(!e.gone&&!/Word on the road/.test(logsSince(n0)),'the lure: the “wounded man” stays while you see him');
   away(e);frames(1);ok(e.gone&&!nTr('body')&&/Word on the road/.test(logsSince(n0)),'out of your sight, the bandits move on (no body), word gets round')}
  {ev('TERRAIN.on=true');goHome();R().on=[];P.sk.scout.lv=2;const e=t.roadSpawn('ambush',P.x+40,P.y);frames(1);past(e,30);frames(50);ok(e.inView(t.vis())&&!e.gone,'the ambush, seen (Scouting 2): still there past its time');away(e);frames(1);ok(e.gone,'gone once out of your sight');
   P.sk.scout.lv=0;goHome();R().on=[];const f=t.roadSpawn('ambush',P.x+40,P.y);past(f);frames(1);ok(f.gone,'unseen (Scouting 0): it moves on at its time');ev('TERRAIN.on=false')}
  // ---- the caravan under attack: plays out before you: the raiders ride off, the burnt wagon left
  {goHome();R().on=[];const e=t.roadSpawn('caravan',P.x+60,P.y);e.seen=1;const x0=e.x;past(e);frames(1);const wr=R().on.find(x=>x.trace&&x.k==='wreck');
   ok(!e.gone&&e.left&&e.done&&e.beh==='leave'&&wr&&wr.x===x0&&wr.inView(t.vis())&&ks(e).length===3&&t.ENC_SCENE.lay(e,true).every(p=>p.k==='soldier'&&p.o.band),'the caravan fight, its time up in your sight: it plays out, the raiders ride off and the burnt wagon is left; no caravan folk remain ('+ks(e).join(', ')+')');
   t.frame();const bx=e.box();ok(t.pickAt((bx[0]+bx[2])/2,(bx[1]+bx[3])/2)!==e,'(the raiders not to be met)');const w=walkOff(e);ok(e.gone&&!w.pre&&nTr('wreck')===1,'the raiders gone once out of your sight; the wagon stays')}
  // ---- the ones that run: gone once out of your sight, as ever; the grazing horse wanders off
  {goHome();R().on=[];const e=t.roadSpawn('wisps',P.x+t.vis()*.8,P.y);past(e);frames(1);ok(!e.gone&&e.inView(t.vis()),'the wisps, seen past their time: still there');P.x=e.x-t.vis()*1.4;frames(1);ok(e.gone,'gone once out of your sight')}
  {goHome();R().on=[];const e=t.roadSpawn('horse',P.x+t.vis()*.8,P.y);past(e);frames(1);ok(!e.gone&&e.beh==='leave'&&e.left&&ks(e).join()==='horse','the grazing horse, its time up in your sight, wanders off');const q0=[e.x,e.y];frames(60);const mv=Math.hypot(e.x-q0[0],e.y-q0[1]);ok(mv>0&&mv<=t.moveStep(t.ENC_SPD.leave,.05)*60+1e-6,'slowly, at a walk ('+mv.toFixed(1)+' px in 60 moments)');walkOff(e);ok(e.gone,'gone once out of your sight')}
  // ---- one walking off: never forced away in sight; past its time, a cap so nothing lingers
  {goHome();R().on=[];const e=t.roadSpawn('bard',P.x+40,P.y);past(e,LF.linger-.5);const fol=()=>{P.x=e.x-40;P.y=e.y;frames(1)};fol();ok(e.beh==='leave'&&!e.gone,'one walking off, '+(LF.linger-.5)+' h past its time, followed: still there');
   past(e,LF.linger+.1);fol();ok(!e.gone,'past '+LF.linger+' h, near you: still there');P.x=e.x-t.vis()*.9;P.y=e.y;frames(1);ok(e.gone,'and gone once past 0.8 × your sight ('+LF.linger+' h past its time: the cap)')}
  G.clock=t.DAY*.3;world()}

 // ---- your stats on the road (owner, 2026-10-19: stats only add; ENC_STAT, statOdds): a stat of 0 is today's odds or outcome;
 // more raises it, up to its cap, never past it and never under today's; the horse's odds as they were; the Insight read (Scouting
 // 0, 3, 5); each check's outcome; Tend his wounds always heals, its care (e.care) rising with Medicine
 {const S=t.ENC_STAT,Z={str:0,agi:0,int:0,cha:0,med:0,surv:0,hunt:0,archery:0,athl:0,ride:0},HI={str:30,agi:30,int:30,cha:30,med:20,surv:20,hunt:20,archery:20,athl:20,ride:20};
  const stats=(o,fn)=>{const a0={...P.attr},s0={};for(const k in o)if(k in P.attr)P.attr[k]=o[k];else{s0[k]=P.sk[k].lv;P.sk[k].lv=o[k]}try{return fn()}finally{Object.assign(P.attr,a0);for(const k in s0)P.sk[k].lv=s0[k]}};
  const TODAY={horse:.25,dice:.48,mine:.6,mineGear:.4,wisps:.5,care:0,push:0,hunt:0,respect:0},ks=Object.keys(S),odds=o=>stats(o,()=>ks.map(k=>t.statOdds(k)));
  const z=odds(Z),hi=odds(HI);ok(ks.length===Object.keys(TODAY).length&&ks.every((k,i)=>z[i]===TODAY[k]),'every stat at 0: today’s odds or outcome ('+ks.map((k,i)=>k+' '+z[i]).join(', ')+')');
  ok(ks.every((k,i)=>hi[i]===S[k].cap&&S[k].cap>TODAY[k]),'high stats: up to each cap, never past it ('+ks.map((k,i)=>k+' '+hi[i]).join(', ')+')');
  {const bad=[];for(const k of ks)for(const [s] of S[k].parts)for(const one of [].concat(s)){let last=-1;for(let v=0;v<=40;v+=2){const p=stats({...Z,[one]:v},()=>t.statOdds(k));if(p<TODAY[k]||p>S[k].cap||p<last)bad.push(k+' '+one+' '+v+': '+p);last=p}
     if(stats({...Z,[one]:4},()=>t.statOdds(k))<=TODAY[k])bad.push(k+': '+one+' does not help')}
   const mix=[];for(let i=0;i<60;i++){const o={};for(const k in HI)o[k]=(i*7+k.length*13)%(HI[k]+1);mix.push(odds(o))}
   ok(!bad.length&&mix.every(r=>r.every((p,i)=>p>=TODAY[ks[i]]&&p<=S[ks[i]].cap)),'each stat that helps, 0 to 40: rising, never under today’s, never past the cap; and any mix of them'+(bad.length?': '+bad.slice(0,4).join('; '):''))}
  {let same=true;for(let r=0;r<=12;r++)for(let a=0;a<=14;a++)stats({ride:r,agi:a},()=>{if(t.catchOdds()!==Math.min(Math.max(.25+.08*r+.04*a,.1),.9))same=false});
   ok(same&&/statOdds\('horse'\)/.test(String(t.catchOdds)),'the runaway horse on the helper: its odds as they were (25% + 8% a Riding level + 4% a point of Agility, 10–90%), for every Riding 0–12 and Agility 0–14')}
  ok(t.statHelps('mine')==='Survival and Intellect help'&&t.statHelps('dice')==='Intellect or Charisma (the higher) helps'&&t.statHelps('hunt')==='Survival, Hunting and Archery help'&&t.statHelps('respect')==='Charisma helps','the stats that help, by name ('+['mine','dice','hunt','respect'].map(k=>t.statHelps(k)).join('; ')+')');
  // the Insight read: vague at Scouting 0, rough at 3, the chance at 5; and on each page, the stats that help
  const page=(k,o)=>stats(o,()=>{meet(k);const h=(q('.pg-facts')||{}).textContent||'';world();return h});
  {const r0=page('mine',{...Z,scout:0}),r3=page('mine',{...Z,scout:3}),r5=page('mine',{...Z,scout:5}),h3=page('mine',{...HI,scout:3}),h5=page('mine',{...HI,scout:5});
   ok(/the timbers creak/.test(r0)&&!/%/.test(r0)&&/Survival and Intellect help/.test(r0),'the mine, Scouting 0: vague ("'+r0+'")');
   ok(/the tunnels look unsafe/.test(r3)&&!/%/.test(r3)&&/you can tell which tunnels will hold/.test(h3),'Scouting 3: a rough read, better with Survival ("'+r3+'" / "'+h3+'")');
   ok(/60% the tunnels hold.*40% chance of gear/.test(r5)&&/85% the tunnels hold.*55% chance of gear/.test(h5),'Scouting 5: the chance itself ("'+r5+'" / "'+h5+'")')}
  {const d0=page('gamblers',{...Z,scout:5}),d1=page('gamblers',{...Z,cha:10,scout:5}),w0=page('wisps',{...Z,scout:0}),w3=page('wisps',{...Z,int:10,scout:3}),w5=page('wisps',{...Z,int:10,scout:5}),h5=page('horse',{...Z,ride:3,agi:2,scout:5});
   ok(/48% to win a hand/.test(d0)&&/63% to win a hand/.test(d1)&&/Intellect or Charisma/.test(d0),'the gamblers: 48% to win a hand at Charisma 0, 63% at 10 ("'+d1+'")');
   ok(/who knows where they lead/.test(w0)&&/most end in treasure/.test(w3)&&/75%: 40 gold/.test(w5)&&/Intellect helps/.test(w0),'the wisps: vague, rough, and 75% at Intellect 10 ("'+w5+'")');
   ok(/57% to catch it/.test(h5)&&/Riding and Agility help/.test(h5),'the horse: 57% at Riding 3, Agility 2 ("'+h5+'")')}
  // each check's outcome: today's at 0, better with the stat
  world();P.troops={hum_levy:6};P.morale=50;
  {const i0=t.goodN('iron');stats({...Z,surv:20,int:30},()=>{meet('mine');stub(.8,()=>pickA(0))});ok(t.goodN('iron')===i0+5&&/tunnels hold/.test(panel()),'the mine at Survival 20: a roll of 0.8 still holds (85%)');world();
   const n0=t.troopCount();stats(Z,()=>{meet('mine');stub(.61,()=>pickA(0))});ok(t.troopCount()===n0-1&&/caves in/.test(panel()),'at 0: a roll of 0.61 caves in, as today (60%)');world()}
  {P.gold=200;stats({...Z,int:10},()=>{meet('gamblers');stub(.6,()=>pickA(0))});ok(P.gold===210,'dice at Intellect 10: a roll of 0.6 wins (63%)');world();stats(Z,()=>{meet('gamblers');stub(.49,()=>pickA(0))});ok(P.gold===200,'at 0: 0.49 loses, as today (48%)');world()}
  {const g0=P.gold;stats({...Z,int:10},()=>{meet('wisps');stub(.7,()=>pickA(0))});ok(P.gold===g0+40,'the wisps at Intellect 10: a roll of 0.7 finds the chest (75%)');world();P.morale=50;stats(Z,()=>{meet('wisps');stub(.51,()=>pickA(0))});ok(P.gold===g0+40&&P.morale===44,'at 0: 0.51 leads you in circles, as today (50%)');world()}
  {const m0=t.goodN('meat'),f0=t.goodN('furs');stats(Z,()=>{meet('hunters');ok(/3 meat · Survival, Hunting and Archery help/.test(panel())&&!/furs ·/.test(qa('.rkact')[1].textContent),'the hunt at 0: 3 meat, as today');pickA(1)});
   ok(t.goodN('meat')===m0+3&&t.goodN('furs')===f0,'and brings 3 meat, no furs');world();
   stats({...Z,surv:5,hunt:4},()=>{meet('hunters');pickA(1)});ok(t.goodN('meat')===m0+3+5&&t.goodN('furs')===f0+1,'at Survival 5, Hunting 4: 5 meat and a fur ('+(t.goodN('meat')-m0-3)+' meat, '+(t.goodN('furs')-f0)+' furs)');world();
   stats(HI,()=>{meet('hunters');pickA(1)});ok(t.goodN('meat')===m0+3+5+6&&t.goodN('furs')===f0+1+2,'at the most: twice the meat (6) and 2 furs');world()}
  {const SP=t.vitals()[1];stats({...Z,str:6,athl:6},()=>{P.sp=SP;meet('mud');ok(/−8 stamina/.test(qa('.rkact')[0].textContent)&&/Strength and Athletics help/.test(panel()),'the cart at Strength 6, Athletics 6: −8 stamina (of 20)');pickA(0);ok(P.sp===SP-8,'and it takes 8');world();
    P.sp=0;meet('mud');const h0=t.roadNow();ok(/24 minutes/.test(qa('.rkact')[0].textContent),'tired out: 24 minutes, not an hour');pickA(0);ok(Math.abs(t.roadNow()-h0-.4)<1e-6,'and 0.4 hours pass');world()});
   const pz=stats({...Z,str:40,athl:40},()=>t.roadPushSp());ok(pz===Math.round(TU.mud.sp*(1-S.push.cap))&&pz>0,'never under '+Math.round((1-S.push.cap)*100)+'% of it ('+pz+' stamina)')}
  {const fac=Object.keys(t.FACS).find(x=>x!=='player');stats({...Z,cha:10},()=>{const f=meet('funeral',e=>{e.fac=fac}),h0=t.honorWith(fac);P.morale=50;pickA(0);ok(t.honorWith(fac)===h0+4&&P.morale===57,'Pay respects at Charisma 10: honor +4, morale +7 (of 2 and 4)');world();
    P.morale=50;meet('wedding');pickA(0);ok(P.morale===68,'Join the wedding: morale +18 (of 10)');world();G.clock=t.DAY*.3;
    const w=meet('wedding'),r0=t.repAt(w.home);pickA(1);ok(t.repAt(w.home)===r0+9,'Give a gift: reputation +9 (of 5)');world();G.clock=t.DAY*.3})}
  // Tend his wounds: always heals, whatever your Medicine; the better, the more he owes you
  {const tend=(o,rnd)=>stats(o,()=>{t.invAdd('good','grain',10);const f0=t.foodN(),r0=P.renown,g0=P.gold,e=meet('traveller'),b=qa('.rkact')[0].textContent;stub(rnd,()=>pickA(0));const r={e,b,food:f0-t.foodN(),ren:P.renown-r0,gold:P.gold-g0,txt:panel()};world();return r});
   const rs=[0,1,2,3,4,5,6,8].map(m=>[m,tend({...Z,med:m},.999),tend({...Z,med:m},0)]);
   ok(rs.every(([m,a,b])=>[a,b].every(r=>r.e.healed&&r.e.done&&r.food===3&&/gets to his feet/.test(r.txt))),'Tend his wounds always heals, at any Medicine (0–8), lucky or not');
   const z0=rs[0][1],z1=rs[0][2];ok(z0.e.care===0&&z0.ren===1&&z0.gold===0&&z1.gold===0&&/Medicine: he will live/.test(z0.b)&&!/gift/.test(z0.b),'at 0: today’s (renown +1, no gift; care 0; "'+z0.b+'")');
   const cs=rs.map(([m,a])=>a.e.care);ok(cs.every((c,i)=>!i||c>cs[i-1]||c===1)&&cs[cs.length-1]===1,'its care (e.care) rises with Medicine ('+cs.join(', ')+')');
   const top=rs[rs.length-1];ok(top[1].ren===2&&top[2].gold>=TU.traveller.gold[0]&&top[2].gold<=TU.traveller.gold[1]&&top[1].gold===0&&/on his feet in days/.test(top[1].b)&&/walks off/.test(top[1].txt),'at Medicine 8: renown +2, and maybe a gift from his purse ('+top[2].gold+' gold, lucky)');
   ok(/Medicine: he will recover well/.test(rs[4][1].b),'Medicine 4: “he will recover well” on the button');
   {const A=t.townBy('Ashford');at(A.x+60,A.y+60);const near=t.nearHold();R().on=[];const e=t.roadSpawn('traveller',P.x+10,P.y);t.invAdd('good','grain',10);if(near)P.rep[near.name]=0;const r0=near&&t.repAt(near.name);stats({...Z,med:4},()=>{t.roadMeet(e);pickA(0)});
    ok(!near||t.repAt(near.name)===r0+Math.round(TU.traveller.rep*1.6),'near '+(near&&near.name)+', reputation × (1 + care): +'+Math.round(TU.traveller.rep*1.6)+' at Medicine 4 ('+r0+' → '+(near&&t.repAt(near.name))+')');world()}
   // the lure: the same button as the real one's (no check of its own; it springs the ambush)
   {const pg=e=>{t.roadMeet(e);const b=(qa('.rkact')[0]||{}).textContent;world();return b};stats({...Z,med:6,scout:0},()=>{goHome();R().on=[];const tr=t.roadSpawn('traveller',P.x+30,P.y),lu=t.roadSpawn('lure',P.x+30,P.y+20);const a=pg(tr),b=pg(lu);
     ok(a===b&&/on his feet in days/.test(b),'the lure’s Tend his wounds reads as the real one’s, at Medicine 6 too ("'+b+'")')})}}
  world();P.morale=50}
 // ---- the save: the encounters, the timer, the day's count and the cooldowns
 {goHome();R().c=7.5;R().cd={bard:G.day};const e=t.roadSpawn('merchant',P.x+90,P.y);e.seen=1;const b=t.roadSpawn('traveller',P.x+50,P.y+30),th=t.roadSpawn('thief',P.x+70,P.y-20);G.mode='world';G.modal=false;
  const snap=JSON.stringify(W.road);t.saveGame(true);W.road=null;t.loadGame();ok(JSON.stringify(W.road)===snap&&W.road.on.every(x=>x instanceof t.RoadEncounter),'saved and loaded as they were ('+W.road.on.length+' encounters (a thief on the run with them), the timer '+W.road.c+' h, cooldowns)');
  ok(W.road.on[0].D===t.ROAD_ENC.merchant&&W.road.on[0].marked(),'and as they were to you (the peddler still marked)');
  world();clear();t.saveGame(true);t.loadGame();ok(W.road===null&&!('road' in JSON.parse(localStorage.getItem(t.slotKey('auto'))).world),'none: nothing saved, none loaded')}

 // ---- the weather and sickness: still instant events, as ever
 {ok(t.INCIDENTS.map(e=>e.id).join()==='wagon,fever,storm,blizzard,sandstorm,mirage'&&t.INCIDENTS.every(e=>e.run&&!e.choices),'the road events left are instant: the weather, the sickness, the finds ('+t.INCIDENTS.map(e=>e.id).join(', ')+')');
  goHome();G.quietEvents=false;const keep=t.INCIDENTS.slice();t.INCIDENTS.length=0;t.INCIDENTS.push(keep.find(e=>e.id==='storm'));const n0=G.msgs.length;t.Incident.roll();t.INCIDENTS.length=0;keep.forEach(e=>t.INCIDENTS.push(e));
  ok(G.mode==='world'&&G.msgs.length===n0+1&&/storm/.test(G.msgs[n0].m),'a storm comes at once, a line in the log, no window')}

 // ---- drawn as a mover: nothing leaks a shift into the ground's scene (gfx/render.js memCv), at the screen's finer scale
 {ev('VS=3');goHome();const e=t.roadSpawn('merchant',P.x+60.37,P.y+.41),c=t.roadSpawn('caravan',P.x-40.2,P.y+20.6),h=t.roadSpawn('thief',P.x+20.3,P.y-30.7);e.seen=1;c.seen=1;h.seen=1;const pn=performance.now;let now=1e7;performance.now=()=>now;
  let tf=0,leak=0;const C=t.ctx,m0=C.getTransform();for(let i=0;i<30;i++){now+=16.7;t.updateRoad(.05);t.frame();const T2=t.MEM.getContext('2d').getTransform();if(T2.e||T2.f)tf++;const M=C.getTransform();if(M.a!==m0.a||M.e!==m0.e||M.f!==m0.f)leak++}
  performance.now=pn;ev('VS=1');ok(tf===0&&leak===0,'30 frames with a moving peddler, a caravan fight and a thief running from his victim at scale 3: the ground’s scene unshifted, the screen’s transform as it was ('+tf+', '+leak+')')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
