'use strict';
// March styles (world/marchstyles.js; the owner, 2026-10-31: AI armies "bunch too close" round their leader; room between groups,
// styles like a real battle setup): a lord to war offensive (riders forward in wedges, infantry behind the centre, shooters at the
// rear), at home defensive (a spear line in front, shooters behind, riders in columns on the flanks), a band a loose screen with its
// archers out on the sides, beasts a pack, a caravan its guards round the wagon facing out; orcs come on, dwarves hold. Chosen with
// no Math.random, made again only when the rows change. No two groups overlap; every army's ring (yours too) holds its whole layout,
// its farthest man a margin inside; a bigger army a bigger ring and reach. Yours in battle lanes (the owner, 2026-11-01), turning
// with the march. A night watch's torches in its men's hands after dark (gfx/marchgear.js; tests/marchgear.js).
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,S=t.MARCH_STYLES;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;
 const home=Kit.goHome('Ashford');Kit.goTo(home.x+240,home.y+200);const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE);
 for(let y=ty-30;y<=ty+30;y++)for(let x=tx-30;x<=tx+30;x++)if(t.WM.has(x,y)){const i=y*t.MW+x;t.WM.kind[i]=t.T_OPEN;t.WM.edge[i]=0;t.WM.elev[i]=64}
 // (a kind of each class, of a race: data/matchups.js unitClass)
 const kind=(race,c)=>Object.keys(t.ST).find(k=>t.ST[k].race===race&&!t.ST[k].beast&&!t.ST[k].big&&t.unitClass(t.ST[k])===c&&t.unitSize(k)>=6);
 const H={cav:kind('human','cav'),spear:kind('human','spear'),foot:kind('human','foot'),ranged:kind('human','ranged')};info('human kinds: '+JSON.stringify(H));
 const lord=W.lords.find(l=>t.FACS[l.fac].races[0]==='human')||W.lords[0];lord.x=P.x+60;lord.y=P.y;
 const set=(o,tc)=>{o.army={nextId:1,groups:[]};o.tc={...tc};o.changed()};
 set(lord,{[H.cav]:6,[H.spear]:15,[H.foot]:15,[H.ranged]:10});
 const L=o=>t.marchLayout(o),row=(o,c)=>t.marchRows(o).filter(r=>!r.character&&t.unitClass(t.ST[r.type])===c),lead=o=>t.marchRows(o).find(r=>r.id==='leader');
 const xs=rs=>rs.map(r=>r.x),ys=rs=>rs.map(r=>Math.abs(r.y));
 // ---- offensive: a lord to war
 lord.state='march';{const cav=row(lord,'cav'),inf=[...row(lord,'spear'),...row(lord,'foot')],rng=row(lord,'ranged'),l=lead(lord);
  ok(L(lord).style==='offensive'&&cav.length&&inf.length===2&&rng.length&&Math.min(...xs(cav))>Math.max(...xs(inf))&&Math.min(...xs(inf))>Math.max(...xs(rng))&&cav.every(r=>r.form==='wedge'),
   'a lord to war is offensive: his riders in front in a wedge ('+xs(cav).map(Math.round)+'), the infantry behind ('+xs(inf).map(Math.round)+'), the shooters at the rear ('+xs(rng).map(Math.round)+')');
  ok(l&&Math.abs(l.y)<Math.min(...ys(inf))+1e-6&&Math.abs(l.x-inf[0].x)<12&&t.marchRows(lord).every(r=>r.face===0),'he rides in the middle of the infantry, behind the van ('+Math.round(l.x)+', '+Math.round(l.y)+'); every group faces the way it marches')}
 // ---- defensive: home
 lord.state='rest';{const cav=row(lord,'cav'),front=[...row(lord,'spear'),...row(lord,'foot')],rng=row(lord,'ranged'),width=Math.max(...[...front,...rng].map(r=>Math.abs(r.y)));
  ok(L(lord).style==='defensive'&&cav.length&&front.length&&rng.length&&Math.min(...xs(front))>Math.max(...xs(rng))&&cav.every(r=>r.form==='column'&&Math.abs(r.y)>width),
   'at rest he is defensive: the spear and shield line in front ('+xs(front).map(Math.round)+'), the shooters behind it ('+xs(rng).map(Math.round)+'), the riders in columns on a flank (|y| '+ys(cav).map(Math.round)+' past '+Math.round(width)+')')}
 {const s0=L(lord);lord.defend=true;const s1=L(lord).style;delete lord.defend;lord.with={};const s2=L(lord).style;delete lord.with;lord.state='siege';const s3=L(lord).style;lord.state='patrol';
  ok(s0.style==='defensive'&&s1==='offensive'&&s2==='offensive'&&s3==='offensive'&&L(lord).style==='defensive','riding out to defend, in a marshal\'s host, at a siege: offensive; on patrol: defensive')}
 // ---- the race leans as the battle's temperament does: orcs come on, dwarves hold
 {const orc=kind('orc','foot'),dw=kind('dwarf','foot');const o=t.asParty({kind:'bandits',troops:['militia'],x:P.x-60,y:P.y}),pat=t.asParty({pt:true,home:'Ashford',fac:lord.fac,x:P.x,y:P.y+60,troops:[orc]});
  set(pat,{[orc]:15});const a=L(pat).style;set(pat,{[dw]:15});const b=L(pat).style;set(pat,{[H.foot]:15});const c=L(pat).style;
  ok(orc&&dw&&a==='offensive'&&b==='defensive'&&c==='defensive'&&L(o).style==='screen','an orc watch is offensive, a dwarf one defensive, a human one by its errand (defensive); a band stays a screen ('+[a,b,c].join(', ')+')')}
 // ---- a band: a loose screen, archers to the sides
 const band=t.asParty({kind:'bandits',ld:t.newChief('bandits',1),troops:[...Array(15).fill('militia'),...Array(10).fill('archer')],x:P.x-60,y:P.y,cool:0});
 {const rs=t.marchRows(band),foot=rs.filter(r=>r.type==='militia'),arch=rs.filter(r=>r.type==='archer'),l=rs.find(r=>r.id==='leader');
  ok(L(band).style==='screen'&&foot.every(r=>r.form==='loose')&&arch.length&&Math.min(...ys(arch))>Math.max(...ys(foot))&&l&&l.x<Math.min(...xs(foot)),
   'a band: its foot a loose screen in front ('+foot.map(r=>r.form)+'), its archers out on the sides (|y| '+ys(arch).map(Math.round)+'), its chief behind ('+Math.round(l?.x)+')')}
 // ---- beasts: a loose pack; a caravan: its guards round the wagon, facing out
 const pack=t.asMonster({id:'wolf',n:20,lv:1,x:P.x,y:P.y-60,hx:P.x,hy:P.y-60,cool:0});
 ok(L(pack).style==='pack'&&t.marchRows(pack).length>1&&t.marchRows(pack).every(r=>r.form==='pack'),'beasts: a loose pack ('+t.marchRows(pack).map(r=>r.form)+')');
 const tw=t.TOWNS.filter(x=>x.owner&&x.owner!=='player'),car=t.asParty({cv:true,fac:tw[0].owner,from:tw[0].name,to:tw[1].name,x:P.x+40,y:P.y+40,goods:{grain:5},guards:8,cool:0,dir:1});
 {const rs=t.marchRows(car),wagon=t.marchBodyOf('militia')*t.WORLD_BATTLE.sprite/t.WORLD_BATTLE.scale/2;
  ok(L(car).style==='convoy'&&rs.length&&rs.every(r=>Math.cos(Math.atan2(r.y,r.x)-r.face)>1-1e-9)&&rs.every(r=>Math.hypot(r.x,r.y)-t.marchExtent(r)>=wagon),
   'a caravan: its guards round the wagon, clear of it, each facing out ('+rs.map(r=>Math.round(Math.hypot(r.x,r.y))+'px')+')')}
 // ---- no two groups overlap; every man inside the ring, a margin in; yours too
 const men=o=>t.marchRows(o).flatMap(r=>t.marchSlots(r,r.face||0).map(([a,b])=>({row:r.id,x:r.x+a/t.WORLD_BATTLE.scale,y:r.y+b/t.WORLD_BATTLE.scale,pad:t.marchPad(r)})));
 const apart=o=>{const m=men(o);let worst=Infinity;for(let i=0;i<m.length;i++)for(let j=i+1;j<m.length;j++)if(m[i].row!==m[j].row)worst=Math.min(worst,Math.hypot(m[i].x-m[j].x,m[i].y-m[j].y)-m[i].pad-m[j].pad);return worst};
 const inside=o=>Math.max(...men(o).map(p=>Math.hypot(p.x,p.y)+p.pad))+S.margin<=t.marchOuter(o)+1e-6;
 P.troops={[H.foot]:15,[H.ranged]:10,[H.cav]:6};
 const armies=[['offensive',()=>{lord.state='march';return lord}],['defensive',()=>{lord.state='rest';return lord}],['a band',()=>band],['a pack',()=>pack],['a caravan',()=>car],['yours',()=>P]];
 for(const [n,f] of armies){const o=f(),gap=apart(o);ok(gap>=S.gap-1e-6&&inside(o),n+': no two groups overlap (at least '+gap.toFixed(1)+' px between men of two groups), every man inside the ring, '+S.margin+' px in ('+t.marchOuter(o).toFixed(1)+')')}
 {const id=t.marchRows(P).find(r=>!r.character&&t.unitClass(t.ST[r.type])==='cav').id;P.army.march={[id]:{x:999,y:-999,face:1}};const r=t.marchRows(P).find(r=>r.id===id);
  ok(inside(P)&&t.marchFoot(r,r.x,r.y)<=t.marchRoom(P)+1e-6,'yours with a group placed at the edge: still inside its ring, within the room you have to place it ('+t.marchRoom(P).toFixed(1)+')');delete P.army.march}
 // ---- a bigger army: a bigger ring and reach (one rule for all)
 {const grow=n=>{const b=t.asParty({kind:'bandits',troops:Array(n).fill('militia'),x:P.x-60,y:P.y});return t.marchInteractRadius(b)},r=[3,15,45,90].map(grow);
  P.troops={[H.foot]:5};const y0=t.marchInteractRadius(P);P.troops={[H.foot]:45,[H.ranged]:20};const y1=t.marchInteractRadius(P);
  ok(r.every((v,i)=>!i||v>r[i-1])&&y1>y0&&t.worldBattleReach(band)===t.marchInteractRadius(P)+t.marchInteractRadius(band),'a bigger army, a bigger reach: a band of 3, 15, 45, 90 ('+r.map(Math.round)+' px), yours of 5 and 65 ('+Math.round(y0)+', '+Math.round(y1)+'); the meeting distance their two reaches')}
 // ---- yours (the owner, 2026-11-01: battle lanes, as a battle opens from it): with no layout saved, the infantry in front, the mages
 // a step behind it beside your hero, the archers and crossbows behind them, the riders on the flanks a little back; several of a
 // kind abreast, a rank no wider than its span of its widest groups; each group in its own formation; one you placed where you placed it
 P.troops={[H.spear]:30,[H.foot]:15,hum_mage:10,[H.ranged]:20,hum_xbow:10,[H.cav]:12};delete P.army.march;
 {const rs=t.marchRows(P),of=c=>rs.filter(r=>!r.character&&t.unitClass(t.ST[r.type])===c),inf=[...of('spear'),...of('foot')],mag=of('magic'),rng=of('ranged'),cav=of('cav'),h=rs.find(r=>r.id==='hero'),X=a=>xs(a).map(Math.round);
  info('yours: '+rs.map(r=>r.id+' '+r.type+' '+r.form+' @'+Math.round(r.x)+','+Math.round(r.y)).join('; ')+'; room '+t.marchRoom(P).toFixed(1)+' (space '+t.marchSpace(P).toFixed(1)+')');
  ok(L(P).style==='lanes'&&inf.length===3&&mag.length===1&&rng.length===3&&rng.some(r=>r.type==='hum_xbow')&&Math.min(...xs(inf))>Math.max(...xs(mag))&&Math.min(...xs(mag))>Math.max(...xs(rng))&&h.x===0&&h.y===0&&Math.abs(mag[0].x)<1e-6,
   'yours in battle lanes: the infantry in front ('+X(inf)+'), the mages a step behind it beside your hero ('+X(mag)+'; he at the middle), the archers and crossbows behind them ('+X(rng)+')');
  const ranks=a=>[...new Set(a.map(r=>Math.round(r.x*1e3)))].map(x=>a.filter(r=>Math.round(r.x*1e3)===x)),wide=k=>{const y=k.flatMap(r=>{const h=t.marchHalf(r);return[r.y-h.hy,r.y+h.hy]});return Math.max(...y)-Math.min(...y)};
  const widest=Math.max(...[...inf,...mag,...rng].map(r=>wide([r])));
  ok(ranks(inf).some(k=>k.length>1)&&ranks(rng).some(k=>k.length>1)&&[...ranks(inf),...ranks(rng)].every(k=>k.length===1||wide(k)<=S.styles.lanes.span*(widest+S.gap)-S.gap+1e-6),
   'several of a kind abreast, a rank no wider than '+S.styles.lanes.span+' of its widest groups ('+ranks(inf).map(k=>k.length)+' infantry, '+ranks(rng).map(k=>k.length)+' shooters a rank)');
  const ids=new Set(cav.map(r=>r.id)),m=men(P),outside=c=>{const s=Math.sign(c.y),cm=m.filter(p=>p.row===c.id),inner=Math.min(...cm.map(p=>s*p.y));return m.filter(p=>!ids.has(p.row)&&cm.some(q=>Math.abs(q.x-p.x)<6)).every(p=>s*p.y<inner)};
  ok(cav.length===2&&cav.every(c=>outside(c)&&c.x<Math.min(...xs(inf))&&c.x>Math.min(...xs(rng))),'the riders on the flanks, a little back: beside the lanes at their depth, behind the infantry ('+cav.map(r=>Math.round(r.x)+','+Math.round(r.y)).join('; ')+')');
  ok(rs.every(r=>t.marchFoot(r,r.x,r.y)<=t.marchRoom(P)+1e-6)&&t.marchRoom(P)>=t.marchSpace(P),'the room you have to place them in holds the lanes ('+t.marchRoom(P).toFixed(1)+')');
  {const g=t.partyRoster(P).groups.find(g=>g.id===cav[0].id),f0=g.form,w0=g.files;g.form='column';g.files=1;const r=t.marchRows(P).find(r=>r.id===g.id),gap=apart(P);g.form=f0;g.files=w0;
   ok(r.form==='column'&&r.files===1&&gap>=S.gap-1e-6,'each group in its own formation (riders you set in a column: '+r.form+'), the lanes making room for it ('+gap.toFixed(1)+' px apart)')}
  {const id=inf[0].id;P.army.march={[id]:{x:-10,y:20,face:0}};const r=t.marchRows(P).find(r=>r.id===id),q=t.marchRows(P).find(r=>r.id===rng[0].id);delete P.army.march;const back=t.marchRows(P).find(r=>r.id===id);
   ok(Math.abs(r.x+10)<1e-6&&Math.abs(r.y-20)<1e-6&&q.x===rng[0].x&&q.y===rng[0].y&&back.x===inf[0].x&&back.y===inf[0].y,'a group you placed stands where you placed it, the rest in their lanes; unplaced, back in its lane')}
  // (on the march its lanes turn with it: marching north, the infantry leads)
  {const at={x:P.x,y:P.y};t.MARCH_ARMIES.delete(P);const A=t.MarchArmy.of(P);for(let i=0;i<200;i++)A.step(.05);for(let i=0;i<240;i++){P.y-=.5;A.step(.05)}for(let i=0;i<300;i++)A.step(.05);
   const my=list=>{const u=A.units.filter(u=>list.some(r=>r.id===u.row));return u.reduce((s,u)=>s+u.y,0)/u.length},f=[inf,[h],rng].map(my);Object.assign(P,at);t.MARCH_ARMIES.delete(P);
   ok(Math.abs(A.face+Math.PI/2)<.05&&f[0]<f[1]&&f[1]<f[2],'marching north, its lanes turn with it: the infantry ahead, your hero behind it, the shooters at the back ('+f.map(v=>Math.round(v-at.y))+' px)')}}
 // ---- chosen without chance, once while nothing changes
 {const r0=Math.random;let calls=0;Math.random=()=>{calls++;return r0()};let a,b;try{lord.state='march';t.MARCH_LAYOUTS.delete(lord);a=JSON.stringify(t.marchRows(lord));t.MARCH_LAYOUTS.delete(lord);b=JSON.stringify(t.marchRows(lord))}finally{Math.random=r0}
  const k=t.marchRows(lord);ok(!calls&&a===b&&t.marchRows(lord)===k&&t.marchOuter(lord)===t.marchLayout(lord).outer,'the same army lays out the same, without Math.random, and only once while nothing changes');
  lord.state='rest';ok(t.marchRows(lord)!==k,'its errand changed, it lays out again')}
 // ---- a battle on the map starts from it: the groups' forms
 {lord.state='march';const A=t.MarchArmy.of(lord);A.sync();ok(A.rows===t.marchRows(lord)&&A.units.filter(u=>u.row!=='leader').length===46,'its marchers take their places in it ('+A.units.length+')')}
 // ---- the torches: in its men's hands after dark, going with them (gfx/marchgear.js)
 {const night=t.asParty({pt:true,watch:'night',home:'Ashford',fac:lord.fac,x:P.x+30,y:P.y-30,troops:Array(8).fill(H.spear),cool:0});W.patrols.push(night);const A=t.MarchArmy.of(night),cam={x:P.x-150,y:P.y-100},clock=G.clock;G.clock=t.DAY*.75;
  const lit=()=>{window.eval('LIGHTQ=[];BANNERQ=[]');const ents=[];night.draw(ents,cam,t.vis());ents.sort((a,b)=>a.y-b.y).forEach(e=>e.f());return t.LIGHTQ.slice()};
  try{for(let i=0;i<200;i++)A.step(.05);const R=t.marchRoles(A),u=A.units.find(u=>R.get(u)?.torch),a=lit(),near=(L,u)=>Math.abs(L.x-Math.round(u.x-cam.x))<=8&&L.y<u.y-cam.y-3&&L.y>u.y-cam.y-20;
   ok(night.look().torch&&u&&a.length===A.units.filter(u=>R.get(u)?.torch).length&&a.some(L=>near(L,u)),'a night watch\'s torches are in its men\'s hands, over their feet, lit there ('+a.length+')');
   const was={x:u.x,y:u.y};for(let i=0;i<60;i++){night.x+=.5;A.step(.05)}const b=lit();ok(u.x-was.x>5&&b.some(L=>near(L,u)),'they move with them (his went '+(u.x-was.x).toFixed(1)+' px)')}
  finally{G.clock=clock;W.patrols.splice(W.patrols.indexOf(night),1)}}
});
