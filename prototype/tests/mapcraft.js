'use strict';
// The map's craft of 2026-11-16 and 17 (doc/OPEN_WORLD_DESIGN.md, the owner's phone play-tests): footprints shaped as feet, the way's
// rings by the fine px, pasture animals that walk inside their fence, lots picked by their pictures' px, a site's ring at its
// picture's foot, rocky ground round caves, field things and crops by the fine px, camp fires in the open, slopes quicker down than
// up, climbing drawn, marchers leaping ledges and crawling out of the water, a map fight's water by its drawn depth and its banners
// raised with the land, loot outlined whole.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,TILE=t.TILE;
 Kit.begin('soldier',1);Kit.clear(['critters']);Kit.world();
 // ---- footprints (worldterrain.js printFoot): a sole and a heel, pointing the way walked, a left foot the right one mirrored
 {const D=t.PRINT_FOOT.dirs;let toes=0,mir=0;
  for(let d=0;d<D;d++){const R=t.printFoot(d,false),L=t.printFoot(d,true);if(R.reduce((a,q)=>a+q[3],0)/R.length>.2)toes++;if(d%2)continue;// (mirrored exactly where the px grid allows it: straight and diagonal ways)
   const a=d/D*6.2832,ux=Math.cos(a),uy=Math.sin(a),key=q=>{const u=q[0]*ux+q[1]*uy,v=q[1]*ux-q[0]*uy;return Math.round(u*2)+','+Math.round(v*2)},rs=new Set(R.map(key)),ls=L.map(q=>{const u=q[0]*ux+q[1]*uy,v=q[1]*ux-q[0]*uy;return Math.round(u*2)+','+Math.round(-v*2)});
   if(ls.filter(k=>rs.has(k)).length>=ls.length*.8)mir++}
  ok(toes===D,'every way of '+D+': a footprint\'s px lie toward its toe, the way walked ('+toes+')');
  ok(mir===D/2,'a left foot is the right one mirrored along its length ('+mir+' of '+D/2+' straight and diagonal ways)');
  ok(t.printFoot(0,false)!==t.printFoot(0,true)&&t.printFoot(0,false)===t.printFoot(0,false),'each foot\'s px kept, the left and right apart')}
 // ---- the way's rings and prints by the fine px, the neutral mark warm, not white (worldui.js)
 {const z=t.wuiZ(),c=t.wuiRing(10,5,'#e8b94a'),f=t.wuiFoot(3,false,'#e8b94a'),n=t.WUI_K.col.neutral,ch=[1,3,5].map(i=>parseInt(n.slice(i,i+2),16));
  ok(c.k===1/z&&c.width===(2*10+3)*z&&c.cx===11,'a ring drawn by the fine px ('+z+' a game px), back to its own size by wuiPut');
  ok(f.k===1/z&&f.cx>0&&f.cy>0,'a footprint of the way by the fine px too');
  ok(Math.min(...ch)<200&&ch[0]-ch[2]>40,'the neutral mark a warm parchment, not near white ('+n+')')}
 // ---- pasture animals (critters.js penSpots): inside their pen's tiles, walking at most so fast, legs moving only as they walk
 {const tn=t.TOWNS.find(x=>t.penSpots(x,0).length);if(!tn)info('no pasture with a herd');else{
  const T0=t.fieldsOf(tn,'pasture').tiles,inPen=(x,y)=>T0.some(q=>q[0]===Math.floor(x/TILE)&&q[1]===Math.floor(y/TILE));let out=0,fast=0,still=0,prev=null,n=0;
  for(let ms=0;ms<300000;ms+=100){const S=t.penSpots(tn,ms);S.forEach((s,j)=>{if(!inPen(s.x,s.y-1.5))out++;if(prev){const p=prev[j],d=Math.hypot(s.x-p.x,s.y-p.y);if(d>.7)fast++;if(d<1e-6&&s.a!==p.a&&s.a!==S[j].a)still++}});prev=S;n++}
  ok(!out,tn.name+'\'s '+t.penSpots(tn,0).length+' animals stay on their pen\'s tiles over 300 s ('+out+' out)');
  ok(!fast,'they walk, never jump: under .7 px a tenth of a second ('+fast+' faster)');
  const S1=t.penSpots(tn,0),S2=t.penSpots(tn,40000);ok(S1.some((s,j)=>Math.hypot(s.x-S2[j].x,s.y-S2[j].y)>1),'and they do move about the pen')}}
 // ---- a lot picked by its picture's px (structures.js lotPicHit; world.js pickAt): a cluster's gap is ground to walk to
 {let done=0;for(const tn of t.TOWNS){if(done>=2)break;for(const l of tn.lots||[]){if(done>=2||l.n<2)continue;const s=t.lotSprite(tn,l),A=t.lotAlpha(s),fr=A.reduce((a,v)=>a+v,0)/A.length;if(fr>.55||fr<.1)continue;
   const N=l.n*TILE,[bx,by,bn]=t.lotDrawBox(l,l.x*TILE,(l.y+l.n)*TILE,N);let gap=null,solid=null;
   for(let y=by+2;y<by+bn-2&&!gap;y+=2)for(let x=bx+2;x<bx+bn-2;x+=2)if(!t.lotPicHit(tn,l,x,y)){gap=[x,y];break}
   for(let y=by+bn-3;y>by&&!solid;y--)for(let x=bx+2;x<bx+bn-2;x++)if([[0,0],[3,0],[-3,0],[0,-3]].every(([a,b])=>t.lotPicHit(tn,l,x+a,y+b))){solid=[x,y];break}
   if(!gap||!solid)continue;Kit.goTo(gap[0]+30,gap[1]);t.reveal();const g=t.pickAt(gap[0],gap[1]),h=t.pickAt(solid[0],solid[1]);
   ok(!g||g.mapKind!=='town'&&g!==tn&&!(g.town===tn.name),tn.name+' '+l.k+': a click in its cluster\'s gap picks nothing of it (walk there)');
   ok(!!h,tn.name+' '+l.k+': a click on its picture picks it ('+(h&&(h.mapKind||h.name))+')');done++}}
  ok(done>=1,'clusters tried: '+done)}
 // ---- a site's picture as drawn, and the ring round it at its foot (structures.js sitePicBox; worldui.js wuiTargetAt)
 {const s=W.sites.find(q=>q.type==='camp');if(s){const sp=t.siteSprite(s),b=t.sitePicBox(s,sp),ob=t.opaqueBox(sp),k=t.WORLD_VIEW.house*((t.WORLD_VIEW.sites||{})[s.type]||1);
  ok(Math.abs((b[2]-b[0])-(ob[2]-ob[0]+1)*k)<.01&&b[3]>s.y,'a camp\'s box is its picture\'s opaque px as drawn, its foot below its point');
  t.revealDisk(s.x,s.y,60);const T1=t.wuiTargetAt(s,{x:0,y:0}),L=Math.round(t.wuiL(s.x,s.y));ok(Math.abs(T1.y+L-(b[3]-2))<=2&&Math.abs(T1.x-t.snapV((b[0]+b[2])/2))<=1,'its ring stands at that foot, under its middle ('+T1.x+','+T1.y+')')}}
 // ---- rocky ground round a cave (worldterrain.js caveRocks, caveShare)
 {const c=W.sites.find(q=>q.type==='cave');if(c){const R=t.CAVE_ROCK,CV=t.caveRocks(c.x-60,c.y-60,120,120),far=R.r+R.warp+R.grain+2;
  ok(CV.length>=1&&t.caveShare(CV,c.x,c.y-R.up)>.95,'at a cave\'s mouth the ground is rock');
  ok([0,1,2,3].every(i=>t.caveShare(CV,c.x+Math.cos(i*1.57)*far,c.y-R.up+Math.sin(i*1.57)*far/R.flat)===0),'past its reach the land as it was');
  ok(t.caveRocks(c.x+2000,c.y+2000,40,40).every(q=>Math.hypot(q[0]-c.x,q[1]-c.y)>200),'a chunk far from it reads none of its rock')}}
 // ---- field things and crops by the fine px (engine/worldnature.js)
 {const th=['haystack','stook','fruit'].map(k=>t.PX.worldCropThingFine(k,1)),cr=t.PX.worldCrop('wheat','grass',0,{fine:2}),c1=t.PX.worldCrop('wheat','grass',0);
  ok(th.every(s=>s.width===16&&s.ax===8&&s.ay===15),'a haystack, a stook and a fruit tree each its own 16 fine px picture, its foot at (8, 15)');
  ok(cr.width===32&&c1.width===16&&cr.tr.length===32*32,'a crop laid by the fine px: 32 to a tile\'s 16')}
 // ---- crops you can tell apart (engine/worldnature.js PX.worldCropFine, PX.CROP_PLANTS; gfx/worldart.js FARM.grow; the owner,
 //      2026-11-17: "make it more like other game where i can tell whether this is a wheat"): each row crop its own plants (its own
 //      colours, more than a few of them over the soil), standing in rows (the soil's furrows between rows), whole steps of a tile so
 //      a field's plots meet; by the season: young green in spring, the grain golden in summer, stubble and stooks in autumn, bare in
 //      winter; a farm's ground painted again when the season turns
 {const PX=t.PX,K=Object.keys(PX.CROP_PLANTS),pics={},bad=[],key=sp=>{const n=sp.rgb.length/3,S=new Map();for(let i=0;i<n;i++)if(!sp.tr[i]){const c=sp.rgb[i*3]+','+sp.rgb[i*3+1]+','+sp.rgb[i*3+2];S.set(c,(S.get(c)||0)+1)}return S};
  for(const k of K){const st=t.FARM.grow[k].summer,sp=PX.worldCrop(k,'grass',0,{fine:2,stage:st}),S=key(sp),P=PX.CROP_PLANTS[k];pics[k]=[...S.keys()].sort().join('|');
   let rows=0;for(let y=0;y<32;y++){let soil=0;for(let x=0;x<32;x++)soil+=sp.tr[y*32+x];if(soil>=24)rows++}
   if(S.size<4||32%P.row||32%P.step||!rows)bad.push(k+' ('+S.size+' colours, '+rows+' soil lines, row '+P.row+', step '+P.step+')')}
  const same=K.filter((a,i)=>K.some((b,j)=>j<i&&pics[a]===pics[b]));
  ok(!bad.length&&!same.length,'each of '+K.length+' row crops its own plants in rows on furrowed soil ('+K.join(', ')+')'+(bad.length?'; not: '+bad.join('; '):'')+(same.length?'; alike: '+same.join(', '):''));
  const gold=sp=>{let n=0;for(let i=0;i<sp.tr.length;i++)if(!sp.tr[i]&&sp.rgb[i*3]>200&&sp.rgb[i*3+1]>150&&sp.rgb[i*3+2]<140)n++;return n},green=sp=>{let n=0;for(let i=0;i<sp.tr.length;i++)if(!sp.tr[i]&&sp.rgb[i*3+1]>sp.rgb[i*3]+20)n++;return n};
  const W=s=>PX.worldCrop('wheat','grass',0,{fine:2,stage:t.FARM.grow.wheat[s]}),sp=W('spring'),su=W('summer'),au=W('autumn'),wi=W('winter'),plants=x=>x.tr.length-x.tr.reduce((a,b)=>a+b,0);
  ok(green(sp)>100&&gold(sp)<10&&gold(su)>150&&plants(au)<plants(su)/2&&plants(wi)===0,'wheat by the season: young and green in spring ('+green(sp)+' green px), golden in summer ('+gold(su)+'), cut to stubble in autumn ('+plants(au)+' px of plant, summer '+plants(su)+'), the bare furrows in winter ('+plants(wi)+')');
  const tw=t.TOWNS.find(x=>x.lots&&t.bldLv(x,'farm')),l=tw&&t.lotAt(tw,'farm');if(!l)info('no farm');else{const se0=t.FARM.season;try{t.FARM.season='spring';const a=t.estateGround(tw,'farm',t.bldLv(tw,'farm'));t.FARM.season='summer';const b=t.estateGround(tw,'farm',t.bldLv(tw,'farm'));t.FARM.season='summer';const c=t.estateGround(tw,'farm',t.bldLv(tw,'farm'));
   ok(a&&b&&a!==b&&b===c,tw.name+'\'s farm ground painted again when the season turns, kept within one')}finally{t.FARM.season=se0;l._eg=undefined}}
  // (no grass over a field's crops: worldterrain.js terrainProps)
  {const P0=tw&&t.plotsAt(tw,'farm',t.bldLv(tw,'farm'));if(P0&&P0.length){const [px,py]=P0[0];ok(!!t.lotOf(px,py),'a field\'s plot is its farm\'s (lotOf), so the grass keeps off it')}}}
 // ---- a camp's fire in the open, its flame on its pit at both scales (engine/buildmodels.js)
 {let bad=[];for(const kind of ['camp','hideout','travelers'])for(let i=1;i<4;i++){const m1=t.PX.clusterModel({kind,seed:i*131+7,env:'grass',snow:0,detail:1}),m2=t.PX.clusterModel({kind,seed:i*131+7,env:'grass',snow:0,detail:2});
   const f1=m1.marks.fire,f2=m2.marks.fire;if(!f1||!f2||Math.abs(f2[0]/2-f1[0])>1||Math.abs(f2[1]/2-f1[1])>1)bad.push(kind+i)}
  ok(!bad.length,'a camp\'s fire mark the same at either detail (the flame drawn where its pit is)'+(bad.length?': '+bad.join(' '):''))}
 // ---- slopes and cliffs quicker down than up (map.js headingUp, headingMul; world.js heroGround)
 {const S=t.WM.slope,hf=t.landHeight(t.WM);let found=null;
  for(let i=0;i<S.length&&!found;i++){if(S[i]!==2)continue;const x=(i%t.MW+.5)*TILE,y=(Math.floor(i/t.MW)+.5)*TILE;for(let k=0;k<8&&!found;k++){const a=k*.785,tx=x+Math.cos(a)*20,ty=y+Math.sin(a)*20;
   if(t.headingUp(x,y,tx,ty)===true&&t.headingUp(x,y,x-(tx-x),y-(ty-y))===false)found={x,y,tx,ty,bx:x-(tx-x),by:y-(ty-y)}}}
  if(!found)info('no steep tile found');else{const up=t.headingMul(found.x,found.y,found.tx,found.ty),dn=t.headingMul(found.x,found.y,found.bx,found.by);
   ok(Math.abs(up*t.SLOPE.mul[2]-t.LAB_WALK.steep)<1e-9&&Math.abs(dn*t.SLOPE.mul[2]-t.LAB_WALK.steepDown)<1e-9&&dn>up,'steep ground: up at '+t.LAB_WALK.steep+', down at '+t.LAB_WALK.steepDown)}
  ok(t.LAB_WALK.cliffDown>t.LAB_WALK.cliff&&t.LAB_WALK.steepDown>t.LAB_WALK.steep&&t.LAB_WALK.down>t.LAB_WALK.up,'down is quicker than up on a slope, steep ground and a cliff')}
 // ---- climbing drawn (gfx/dollfigs.js DOLL_CLIMB; people.js): up, down, a cliff, a leap and a crawl each their own frames
 {const px=p=>t.unitSprite('spearman',0,false,0,p,false,false).toDataURL(),walk=px(2),sets={up:19,down:23,cliff:t.CLIFF_POSE,leap:t.JUMP_POSE,crawl:t.CRAWL_POSE},same=[];
  for(const k in sets)if(px(sets[k])===walk)same.push(k);
  ok(!same.length,'a man going up, going down, scrambling up a cliff, leaping and crawling is drawn apart from his walk'+(same.length?' (as his walk: '+same.join(', ')+')':''));
  ok(new Set([0,1,2,3].map(i=>px(t.CRAWL_POSE+i))).size>=2&&new Set([0,1,2,3].map(i=>px(t.CLIFF_POSE+i))).size>=2,'crawling and scrambling step through their frames')}
 // ---- a marcher on a slope picks its poses by the land ahead (march.js marchSlope)
 {const S=t.WM.slope;let got=null;
  for(let i=0;i<S.length&&!got;i++){if(S[i]!==1||t.WM.kind[i]===t.T_MOUNT)continue;const x=(i%t.MW+.5)*TILE,y=(Math.floor(i/t.MW)+.5)*TILE;for(let k=0;k<8;k++){const a=k*.785;if(t.headingUp(x,y,x+Math.cos(a)*8,y+Math.sin(a)*8)===true&&t.headingUp(x,y,x-Math.cos(a)*8,y-Math.sin(a)*8)===false){got={x,y,a};break}}}
  if(got){const u={x:got.x,y:got.y,dir:got.a,type:'spearman',id:3},o={x:got.x,y:got.y};ok(t.marchSlope(u,o)==='up'&&t.marchSlope({...u,dir:got.a+Math.PI},o)==='down','facing uphill he climbs; turned round, he goes down')}}
 // ---- a marcher's leap off a ledge, his pull up one, his crawl out of the water (march.js marchAct; drawn only)
 {const lift0=window.liftAt,dep0=window.drawnDepth;let L=10,D=0;window.liftAt=()=>L;window.drawnDepth=()=>D;
  try{const u={type:'spearman',x:100,y:100,id:2,walking:true},J=t.MARCH_ACT;
   t.marchAct(u);u.x+=1;L=10-J.drop-1;const a=t.marchAct(u);ok(a.pose===t.JUMP_POSE&&a.dy>J.drop,'the ground dropping '+(J.drop+1)+' px under his step: he leaps, drawn from the height he left');
   u._act=null;u.x+=1;L+=J.drop+1;const b=t.marchAct(u);ok(b.pose>=t.CLIFF_POSE&&b.pose<t.CLIFF_POSE+4&&b.dy<0,'rising so: he pulls himself up, drawn from below');
   u._act=null;u.x+=1;L+=.5;const c=t.marchAct(u);ok(c.pose===undefined&&c.dy===0,'half a px on a step: he walks on');
   D=.6;u.x+=1;t.marchAct(u);D=0;u.x+=1;const d=t.marchAct(u);ok(d.pose>=t.CRAWL_POSE&&d.pose<t.CRAWL_POSE+4,'out of waist-deep water onto the bank: he crawls');
   const w={type:'spearman',x:100,y:100,id:4,walking:false};t.marchAct(w);w.x+=1;L-=9;ok(t.marchAct(w).pose===undefined,'standing, nothing')}
  finally{window.liftAt=lift0;window.drawnDepth=dep0}}
 // ---- loot outlined whole, seen or hid (data/drops.js LOOT_GLOW.outline.all; depth.js ghostOver)
 ok(t.LOOT_GLOW.outline.all===true,'what is still to be looted is outlined whether something hides it or not');
 // ---- a fight on the map by a river: its water by the drawn depth (worldbattle.js terrain), its banners up with its men (ui/moraleicons.js iconLift)
 {const K=t.WM.kind,home=t.townBy('Ashford');let spot=null,best=Infinity;
  for(let i=0;i<K.length;i++){if(K[i]!==t.T_WATER)continue;const b=t.waterBand(i);if(b<1||b>3)continue;const x=i%t.MW,y=Math.floor(i/t.MW);
   const land=[[1,0],[-1,0],[0,1],[0,-1]].find(([a,c])=>K[(y+c)*t.MW+x+a]===t.T_OPEN);if(!land)continue;const px=(x+.5)*TILE,py=(y+.5)*TILE,d=Math.hypot(px-home.x,py-home.y);if(d>150&&d<best){best=d;spot={i,px,py,lx:(x+land[0]+.5)*TILE,ly:(y+land[1]+.5)*TILE}}}
  if(!spot)info('no shallow water by open land');else{
   t.WORLD_BATTLE.on=true;Kit.goTo(spot.lx,spot.ly);P.troops={hum_foot:4};t.frame();
   const e=t.asParty({kind:'bandits',troops:['militia','militia'],x:spot.lx+(spot.px-spot.lx)*3,y:spot.ly+(spot.py-spot.ly)*3,cool:0,n:2});t.bandits.push(e);
   G.enc={kind:'party',ref:e,list:e.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});
   const B=t.B,Wb=B&&B.world;ok(!!Wb,'a fight by the water is fought on the map');
   if(Wb){const f=Wb.field({x:spot.px,y:spot.py}),k=t.groundAt(f.x,f.y),dd=t.drawnDepth(spot.px,spot.py),want=dd>0?(t.depthBand(dd)>=4?t.TKIND.deep:t.TKIND.ford):-1;
    ok(want<0?k!==t.TKIND.deep&&k!==t.TKIND.ford:k===want,'its water there as the map draws it ('+dd.toFixed(2)+' deep: '+Object.keys(t.TKIND).find(n=>t.TKIND[n]===k)+'), not a whole tile of deep water');
    const lf=t.iconLift(f),q=Wb.world(f);ok(Math.abs(lf-t.liftAt(q.x,q.y)*Wb.scale)<1e-6,'a group\'s banner raised by the land\'s lift there, as its men are ('+lf.toFixed(1)+' field px)')}}}
});
