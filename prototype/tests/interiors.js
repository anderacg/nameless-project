'use strict';
// Fights inside (battle/interior.js; the owner, 2026-11-06: "small fights in caves", hideouts "inside with more camp detail",
// up to 8 go in): a cave's beasts, a ruin's guardians and a hideout's bandits are fought on a ground of their own, rock all round
// (the battle terrain's rock: routes and sight obey it), the same each visit, every chamber reached from the mouth, the mouth
// the only way out; only those chosen go in (the page: Back, Enter, Esc; at most INTERIOR.men), on foot, in the dark (the fog
// always on, sight × B.sightK); the foes wait in their chambers till roused, the strongest deepest; auto-resolved, only those who
// went in can fall; a hideout's palisade (a gap to pass), its fires' light seen; off, the field as before.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,X=t.INTERIOR,on0=X.on,ex0=t.EXITS.on,B=()=>t.B;
 const units=(team)=>B().units.filter(u=>u.team===team);
 try{
  X.on=true;Kit.begin('soldier',5);Kit.clear();Kit.world();
  {const r=t.partyRoster(P);r.add('archer',4);r.add('horse',3)}
  const cave=W.sites.find(s=>s instanceof t.Cave&&!s.within&&!s.cleared);Kit.goTo(cave.x,cave.y+30);
  const band0=t.troopCount();
  // ---- the page: who goes in
  {cave.enter();t.act('site-ask');const p=Kit.panel(),n0=t.Interior.count(G.inside.k);
   ok(/Into the /.test(p)&&Kit.qa('.in-row').length>=2&&Kit.q('.nav [data-nav="back"]')&&Kit.q('.nav [data-nav="close"]').textContent==='Enter'&&n0===Math.min(X.men,band0),'its page: a row a group, Back and Enter; '+n0+' chosen at first (at most '+X.men+')');
   const g=t.partyRoster(P).groups.find(x=>x.count>0);for(let i=0;i<12;i++)t.act('in-g+',g.id);ok(t.Interior.count(G.inside.k)<=X.men,'+ never takes more than '+X.men+' in');
   for(let i=0;i<12;i++)t.act('in-g-',g.id);ok(!G.inside.k.g[g.id],'− down to none of a group');
   Kit.key('Escape','Escape');ok(!/Into the /.test(Kit.text())&&G.mode==='site'&&G.site===cave,'Esc follows the bar: Back to the cave');t.act('site-leave')}
  // ---- a cave fight: inside, only those chosen, on foot, dark, every chamber reached, the mouth the only way out
  {t.EXITS.on=true;Kit.world();const pick={g:{},comps:[]},r=t.partyRoster(P),gs=r.groups.filter(x=>x.count>0);pick.g[gs[0].id]=2;pick.g[gs[1].id]=1;
   t.caveFight(cave,2,pick);t.act('fight');const b=B();
   ok(b&&b.inside==='cave'&&b.terrain&&b.terrain.has.rock&&b.fsize==='cave'&&b.fog,'the fight is inside: its own ground of rock, the cave field, the fog on');
   ok(units(0).length===4&&units(0).filter(u=>!u.hero).length===3,'only those chosen go in: you and 3 ('+units(0).map(u=>u.type).join(', ')+')');
   ok(b.units.every(u=>!u.s.mounted),'no one rides inside');
   const L=b.interior;ok(L.joined(t.TERRAIN.cs)&&L.rooms.length>=X.cave.rooms[0],'every one of its '+L.rooms.length+' chambers reached from the mouth');
   ok(b.exits&&b.exits.length===1&&b.exits[0].side==='W','one way out: the mouth, on the west edge ('+JSON.stringify(b.exits)+')');
   const k=t.fogRange(b.hero),k0=t.FOG.char;ok(Math.abs(k-k0*X.sight)<1,'you see '+k+' px inside ('+X.sight+' of '+k0+')');
   const deep=L.rooms[L.deep],far=units(1).every(u=>Math.hypot(u.x-L.rooms[0].x,u.y-L.rooms[0].y)>L.rooms[0].rx*1.5);ok(far,'its beasts in their chambers, none in yours');
   const p0=units(1).map(u=>[u.x,u.y]);if(b.ready)t.beginFight();for(let i=0;i<120;i++)t.updateBattle(.05);
   ok(units(1).every((u,i)=>Math.hypot(u.x-p0[i][0],u.y-p0[i][1])<24)&&Object.values(b.groups).filter(g=>g.team===1).every(g=>!g.roused),'unroused, they wait in their chambers ('+b.t.toFixed(0)+' s)');
   const L2=t.InteriorLayout.make('cave',t.Interior.seedOf(G.enc),t.BW,b.ftop,b.fbot);ok(JSON.stringify(L2.rooms)===JSON.stringify(L.rooms),'the same cave each visit (its layout by its place)');
   const strong=Object.values(b.groups).filter(g=>g.team===1).sort((x,y)=>t.grpUnits(y.id).reduce((a,u)=>a+u.max,0)-t.grpUnits(x.id).reduce((a,u)=>a+u.max,0))[0],c=t.grpUnits(strong.id)[0];
   ok(Math.hypot(c.x-deep.x,c.y-deep.y)<deep.rx*1.2,'the strongest in the deepest chamber');
   // (withdrawn: out by the mouth; the band outside untouched)
   for(const g of Object.values(b.groups))if(g.team===0)g.withdraw();ok(Object.values(b.groups).filter(g=>g.team===0).every(g=>g.ax<=t.MORALE.edge+60),'withdrawing: back to the mouth');
   B().over=true;t.B=null;t.fieldDone();Kit.world();ok(t.troopCount()===band0,'the band outside as it was')}
  // ---- auto-resolved inside: only those who went in can fall
  {Kit.world();const r=t.partyRoster(P),gs=r.groups.filter(x=>x.count>0),pick={g:{[gs[0].id]:1},comps:[]},other=gs.slice(1).map(g=>[g.id,g.count]);
   t.caveFight(cave,9,pick);t.act('auto');Kit.done({cont:true,world:true});
   ok(other.length&&other.every(([id,c])=>(r.groups.find(x=>x.id===id)||{count:0}).count===c),'auto-resolved inside: none of those who waited outside fall ('+JSON.stringify(other)+')')}
  // ---- a ruin's guardians: its cellars
  {const ru=W.sites.find(s=>s instanceof t.Ruins);if(ru){Kit.world();Kit.goTo(ru.x,ru.y+30);ru.guardFight(ru.guardRoll?ru.guardRoll():{id:'wolf',n:3,lv:1});t.act('fight');const b=B();
    ok(b&&b.inside==='cellar'&&b.interior.X.box,'a ruin’s guardians: fought in its cellars, square-cut');t.B=null;t.fieldDone();Kit.world()}}
  // ---- two kinds of hideout (the owner, 2026-11-06): a camp of tents, fought on the map as before; a bandit lair (a cave's mouth
  // or a dug tunnel), fought inside
  {const H=W.sites.filter(s=>s instanceof t.Hideout&&!s.within),camp=H.find(s=>!s.tunnel),lairs=H.filter(s=>s.tunnel);
   ok(camp&&lairs.length&&lairs.length<H.length&&lairs.every(s=>/lair|tunnels|warren/i.test(s.name)&&s.T.n==='Bandit lair')&&!/lair/i.test(camp.name),'two kinds: '+(H.length-lairs.length)+' hideouts (tents), '+lairs.length+' bandit lairs ('+lairs.filter(s=>s.lairLook==='cave').length+' caves, '+lairs.filter(s=>s.lairLook==='tunnel').length+' tunnels)');
   const rec=JSON.parse(JSON.stringify(lairs[0]));const back=t.siteOf(rec);ok(back.tunnel&&back.name===lairs[0].name,'a lair kept by its place: the same after a save');
   Kit.world();Kit.goTo(camp.x,camp.y+30);camp.enter();t.act('site-ask');ok(!/Into the /.test(Kit.panel())&&/Attack the/.test(Kit.text()),'a hideout’s Attack: its confirm, the whole band');t.act('site-attack');
   ok(G.enc&&G.enc.kind==='camp'&&!t.Interior.on(G.enc),'fought as a camp, not inside');Kit.world();G.enc=null}
  // ---- a bandit lair: inside, its camp: squads, the palisade and its gap, the fires' light, the chieftain deepest
  {const h=W.sites.find(s=>s instanceof t.Hideout&&s.tunnel&&!s.cleared);Kit.world();Kit.goTo(h.x,h.y+30);h.enter();t.act('site-ask');
   ok(/Into the /.test(Kit.panel())&&/palisade/.test(Kit.text()),'a bandit lair’s Attack: who goes in with you');t.act('in-go');t.act('fight');const b=B(),L=b.interior;
   ok(b&&b.inside==='hideout'&&L.pal&&b.lights&&b.lights.length===L.rooms.length-1,'its fight inside: a palisade, a fire a chamber past the first ('+(b.lights||[]).length+')');
   const T2=b.terrain,p=L.pal,at=(x,y)=>T2.solid[t.tIx(T2,x,y)];ok(at(p.x-p.uy*(L.X.gap/2+12),p.y+p.ux*(L.X.gap/2+12))===1&&at(p.x,p.y)===0&&L.joined(t.TERRAIN.cs),'the palisade bars the way but for its gap');
   ok(Object.values(b.groups).filter(g=>g.team===1&&g.role!=='hero').every(g=>t.grpUnits(g.id).length<=X.squad),'its men in squads of '+X.squad+' or fewer');
   const chief=b.units.find(u=>u.leader),deep=L.rooms[L.deep];ok(chief&&Math.hypot(chief.x-deep.x,chief.y-deep.y)<deep.rx*1.2,'their chieftain in the deepest chamber');
   t.sightStep(true);const f=L.fires[0],fg=b.sight.fog,i=Math.floor(f.y/fg.cs)*fg.C+Math.floor(f.x/fg.cs);ok(fg.vis[0][i]===1,'a fire’s light: you see whoever stands by it');
   t.B=null;t.fieldDone();Kit.world()}
  // ---- off: the field as before
  {X.on=false;Kit.world();Kit.goTo(cave.x,cave.y+30);t.caveFight(cave,2);t.act('fight');const b=B();ok(b&&!b.inside,'off: the cave fought on the field as before');t.B=null;t.fieldDone();Kit.world()}
 }finally{X.on=on0;t.EXITS.on=ex0}
});
