'use strict';
// Frightened bands (the owner, 2026-11-01: bands that joined a fight and fled walked back into his army to reach their camp, the
// army standing on it). One afraid of your army keeps away from it while it remembers it (engage.js fearOf: TravelAwareness's
// memory of your groups), out of its sight too, straight away from your army's middle; it shelters only in a camp your army is
// neither at nor across the way to (safeRefuge, world.js campNear), else flees and comes back once you are gone. A band that fought
// in your battle leaves the field afraid of you (brains.js, battle:ended). Beasts and the watch the same (monsters.js, brains.js).
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,A=t.TravelAwareness;Kit.begin('soldier',1);Kit.world({encCool:99});G.paused=false;G.speed=1;P.stay=null;P.tx=null;
 const patrol=W.patrols.find(p=>t.townBy(p.home)&&p.watch!=='night')||W.patrols[0];Kit.clear();t.WORLD_LOD.on=false;// (every one thinks every frame here)
 const strong=()=>{P.troops={hum_knight:12,hum_guard:12,hum_long:10};P.comps={}};
 // (you, your army formed round you, at x, y)
 const at=(x,y)=>{P.x=x;P.y=y;P.tx=null;t.MarchArmy.of(P).sync()};
 // (it has seen every group of yours, as fear.js; lapse: its eye lost you since, the memory of you kept)
 const seen=o=>{t.MarchArmy.of(P).sync();A.snapshot=null;for(const g of t.TravelGroups.groups())A.notice(o,g.id);return o};
 const lapse=o=>{for(const r of A.records.get(o).values())r.q=.5;return o};
 const gap=o=>Math.hypot(o.x-P.x,o.y-P.y);
 // (an open spot r px from x, y with a clear line to it)
 const spot=(x,y,r)=>{for(let k=0;k<16;k++){const a=k*Math.PI/8,sx=x+r*Math.cos(a),sy=y+r*Math.sin(a);if(t.passable(t.terrAt(sx,sy))&&t.clearLine(sx,sy,x,y))return{x:sx,y:sy}}return{x:x+r,y}};
 const band=(n,x,y,kind='militia')=>{const b=t.asParty({kind:'bandits',troops:Array(n).fill(kind),x,y,cool:0,t:9,a:0,idle:true});t.bandits.length=0;t.bandits.push(b);return b};
 // (the first camp on open ground, 5 tiles round: a camp in the woods slows the flight these measure, 2026-11-05)
 const openAt=s=>{const tx=s.x/16|0,ty=s.y/16|0;for(let j=-5;j<=5;j++)for(let i=-5;i<=5;i++)if(t.tAt(tx+i,ty+j)!==t.T_OPEN&&t.tAt(tx+i,ty+j)!==t.T_ROAD)return false;return true};
 const all=t.camps(),c=all.find(s=>!s.cleared&&openAt(s))||all.find(s=>!s.cleared)||all[0],c2=all.find(s=>s!==c),keep=all.map(s=>[s,s.cleared,s.x,s.y,s.bands]);
 try{
  for(const s of all){s.cleared=s!==c;s.bands=[]}strong();
  const night=()=>{G.clock=t.DAY*.6},day=()=>{G.clock=t.DAY*.3};
  // the owner's case: a weak band whose camp your strong army stands on, at night, its eye lost you
  night();at(c.x,c.y);let s=spot(c.x,c.y,70),b=lapse(seen(band(4,s.x,s.y)));
  const fear=t.fearOf(b,t.stance(b.power(),b));
  ok(t.stance(b.power(),b)==='afraid'&&!A.sees(b)&&!!fear,'the case: a weak band, afraid of your army, out of its sight but remembering it');
  ok(t.campNear(b)===c&&!t.campNear(b,fear),'its camp is the nearest (as before), but not safe: your army stands on it');
  {const d0=gap(b);let near=d0,inside=false;for(let k=0;k<40;k++){t.updateBands(.05);near=Math.min(near,gap(b));inside=inside||!!b.gone||(c.bands||[]).includes(b)}
   ok(!inside&&!b.gone&&t.bandits.includes(b),'it does not go into its camp');
   ok(gap(b)>d0+8&&near>=d0-.5,'it keeps away from your army, never a step nearer ('+Math.round(d0)+' → '+Math.round(gap(b))+' px, nearest '+Math.round(near)+')')}
  // and over half a minute of the world (its eye and memory of you come and go: it comes back to look, sees you, runs again)
  {s=spot(c.x,c.y,70);b=lapse(seen(band(4,s.x,s.y)));const d0=gap(b);let near=d0,far=d0,inside=false;
   for(let k=0;k<600;k++){G.encCool=99;W.patrols=[];G.clock=Math.min(G.clock,t.DAY*.9);t.updateWorld(.05);if(!t.bandits.includes(b)&&!b.gone)break;near=Math.min(near,gap(b));far=Math.max(far,gap(b));inside=inside||!!b.gone}
   ok(!inside&&near>=d0-2,'over 30 s of the world it never goes in nor comes nearer your army ('+Math.round(near)+' to '+Math.round(far)+' px from it; '+Math.round(d0)+' at first)')}
  // a refuge as the band knows it
  {s=spot(c.x,c.y,70);b=lapse(seen(band(4,s.x,s.y)));const f=t.fearOf(b,'afraid'),ux=(b.x-P.x)/gap(b),uy=(b.y-P.y)/gap(b);
   ok(!t.safeRefuge(b,c,f),'not safe: your army at it');
   ok(!t.safeRefuge(b,{x:P.x-ux*80,y:P.y-uy*80},f),'not safe: your army across the way to it');
   ok(t.safeRefuge(b,{x:b.x+ux*150,y:b.y+uy*150},f),'safe: away beyond it, your army behind it');
   ok(t.safeRefuge(b,c,null),'safe: anywhere, while it fears no one')}
  // another camp in reach, away from you: it shelters there
  if(c2){night();s=spot(c.x,c.y,70);b=lapse(seen(band(4,s.x,s.y)));const ux=(b.x-P.x)/gap(b),uy=(b.y-P.y)/gap(b);let to=null;
   for(const r of [150,130,170,120,190]){const x=b.x+ux*r,y=b.y+uy*r;if(t.passable(t.terrAt(x,y))){to={x,y};break}}
   if(to){c2.x=to.x;c2.y=to.y;c2.cleared=false;c2.bands=[];
    ok(t.campNear(b,t.fearOf(b,'afraid'))===c2,'another camp in reach, your army not at it nor on the way: that is its refuge');
    for(let k=0;k<800&&!b.gone;k++)t.updateBands(.05);
    ok(b.gone&&c2.bands.includes(b)&&!(c.bands||[]).includes(b),'it shelters there tonight');c2.cleared=true}
   else info('(no open ground for a second camp beyond the band: that case skipped)')}
  // you gone, its memory of you gone: it comes home
  {night();at(c.x,c.y);s=spot(c.x,c.y,70);b=lapse(seen(band(4,s.x,s.y)));c.bands=[];at(c.x+3000,c.y);A.time+=t.TRAVEL_GROUPS.memory+1;
   ok(!t.fearOf(b,'afraid'),'you have gone and it no longer remembers you');
   for(let k=0;k<800&&!b.gone;k++)t.updateBands(.05);ok(b.gone&&c.bands.includes(b),'it comes home to its camp');c.bands=[]}
  // a band that fought in your battle and routed: back on the map (battle/sides.js: cooling down, cool 4), afraid of you, away
  {day();A.reset();at(c.x,c.y);s=spot(P.x,P.y,40);b=band(3,s.x,s.y);b.cool=4;const hard=t.asParty({kind:'bandits',troops:Array(40).fill('hum_knight'),x:P.x-40,y:P.y,cool:4,t:9,a:0,idle:true});t.bandits.push(hard);
   t.worldEmit('battle:ended',{enc:{kind:'field',ref:null,foes:[t.forceOf(b),t.forceOf(hard)],allies:[]},how:'withdrawn'});
   ok(t.fearSeen(b)&&t.stance(b.power(),b)==='afraid','a routed band leaves your battle remembering your army, afraid of it');
   ok(!t.fearSeen(hard),'one stronger than you is not made afraid');t.bandits.length=0;t.bandits.push(b);lapse(b);
   const d0=gap(b);for(let k=0;k<40;k++)t.updateBands(.05);ok(gap(b)>d0+8,'it flees away from you, cooling down and out of sight or not ('+Math.round(d0)+' → '+Math.round(gap(b))+' px)')}
  // not afraid of you: as before
  {night();A.reset();at(c.x+3000,c.y);s=spot(c.x,c.y,70);b=band(4,s.x,s.y);c.bands=[];for(let k=0;k<800&&!b.gone;k++)t.updateBands(.05);
   ok(b.gone&&c.bands.includes(b),'a band that has not seen you shelters in its camp by night as before');c.bands=[];
   at(c.x,c.y);P.troops={militia:1};b=lapse(seen(band(14,s.x,s.y,'hum_knight')));const st=t.stance(b.power(),b);
   ok(st!=='afraid'&&!t.fearOf(b,st)&&t.campNear(b,t.fearOf(b,st))===c,'one stronger than you fears nothing: its camp is its camp, you at it or not');strong();t.bandits.length=0}
  // the other brains with a home: a beast near its lair, the watch near its gate
  {day();at(c.x,c.y);s=spot(P.x,P.y,50);const m=t.asMonster({id:'wolf',x:s.x,y:s.y,hx:P.x,hy:P.y,lv:1,n:3,t:9,a:0,cool:6});W.monsters=[m];lapse(seen(m));
   const d0=gap(m);for(let k=0;k<30;k++)t.updateMonsters(.05);ok(gap(m)>d0+5,'a frightened pack just after a fight keeps away from you, not back to its lair you stand on ('+Math.round(d0)+' → '+Math.round(gap(m))+' px)');W.monsters=[]}
  if(patrol){const h=t.townBy(patrol.home),g=t.gateGoal(h);t.Timed.of(P,'hostile').set(patrol.fac,20);G.clock=t.DAY*.3;W.lords.forEach(l=>{l.x=-9999;l.y=-9999});
   try{at(g.x,g.y);s=spot(g.x,g.y,60);Object.assign(patrol,{x:s.x,y:s.y,cool:0,fight:null,gone:false,wx:null,back:G.day+5});W.patrols=[patrol];lapse(seen(patrol));
    ok(t.hostileTo(patrol.fac)&&t.stance(patrol.power(),patrol)==='afraid'&&!!t.fearOf(patrol,'afraid'),'the watch: afraid of your army, out of its sight but remembering it');
    let d0=gap(patrol);for(let k=0;k<30;k++)t.BRAINS.patrol.think(patrol,.05);ok(gap(patrol)>d0+5,'your army at its gate: it runs away from you, not home through you ('+Math.round(d0)+' → '+Math.round(gap(patrol))+' px)');
    s=spot(g.x,g.y,40);Object.assign(patrol,{x:s.x,y:s.y});at(g.x+(s.x-g.x)*4,g.y+(s.y-g.y)*4);lapse(seen(patrol));const h0=Math.hypot(patrol.x-g.x,patrol.y-g.y);
    for(let k=0;k<20;k++)t.BRAINS.patrol.think(patrol,.05);ok(Math.hypot(patrol.x-g.x,patrol.y-g.y)<h0,'you beyond it, its gate clear: it runs home')}
   finally{t.Timed.of(P,'hostile').clear(patrol.fac);W.patrols=[]}}
  else info('(no watch out on this world: its case skipped)');
  // (the owner, 2026-11-01: "yes same goes for all entity") a lord afraid of you, just after a fight (his cool-down: no stanceMove),
  // riding home to a fief your army stands at: never home through you, another safe fief of his, else away (brains.js LordBrain)
  {const l=W.lords.find(o=>!o.dead&&t.fiefsOf(o.fac).length>=2);
   if(l){const fs=t.fiefsOf(l.fac),h=fs[0],g={x:h.x,y:h.y+12};t.Timed.of(P,'hostile').set(l.fac,20);G.clock=t.DAY*.3;
    try{at(g.x,g.y);s=spot(g.x,g.y,80);Object.assign(l,{x:s.x,y:s.y,troops:['militia'],cool:6,fight:null,inside:null,follow:null,with:null,defend:null,waylay:null,state:'home',tgt:h.name});lapse(seen(l));
     const st=t.stance(l.power(),l);ok(t.hostileTo(l.fac)&&st==='afraid'&&!!t.fearOf(l,st),'a lord: afraid of your army, out of its sight but remembering it');
     const d0=gap(l);let near=d0;for(let k=0;k<30;k++){t.BRAINS.lord.think(l,.05);near=Math.min(near,gap(l))}
     ok(l.tgt!==h.name||gap(l)>d0+5,'your army at his fief: he makes for another of his (now '+l.tgt+') or away, not home through you');
     ok(near>=d0-.5,'and never a step nearer your army ('+Math.round(d0)+' → '+Math.round(gap(l))+' px, nearest '+Math.round(near)+')');
     at(g.x+(s.x-g.x)*5,g.y+(s.y-g.y)*5);Object.assign(l,{x:s.x,y:s.y,tgt:h.name,state:'home'});lapse(seen(l));const h0=Math.hypot(l.x-g.x,l.y-g.y);
     for(let k=0;k<20;k++)t.BRAINS.lord.think(l,.05);ok(l.tgt===h.name&&Math.hypot(l.x-g.x,l.y-g.y)<h0,'you beyond him, his fief clear: he rides home')}
    finally{t.Timed.of(P,'hostile').clear(l.fac)}}
   else info('(no lord with two fiefs: his case skipped)')}
  // refugees afraid of you (fear: they have reason to), their eye lost you: not on to their refuge through you, on once you are behind
  {const h=t.TOWNS.find(x=>!x.gone),g=t.gateGoal(h);at(g.x,g.y);s=spot(g.x,g.y,70);
   const r=t.asRefugees({x:s.x,y:s.y,n:4,from:h.name,to:h.name,goods:{},purse:5,fear:true,cool:0,dir:1});W.refugees=[r];lapse(seen(r));
   const d0=gap(r);for(let k=0;k<30;k++)t.updateRefugees(.05);ok(!r.gone&&gap(r)>d0+3,'refugees afraid of you, you at their refuge: they keep away, not on through you ('+Math.round(d0)+' → '+Math.round(gap(r))+' px)');
   at(g.x+(s.x-g.x)*5,g.y+(s.y-g.y)*5);Object.assign(r,{x:s.x,y:s.y});lapse(seen(r));const h0=Math.hypot(r.x-g.x,r.y-g.y);for(let k=0;k<20;k++)t.updateRefugees(.05);
   ok(r.gone||Math.hypot(r.x-g.x,r.y-g.y)<h0,'you beyond them, their way clear: on to their refuge');W.refugees=[]}
 }finally{for(const [s,cl,x,y,bs] of keep){s.cleared=cl;s.x=x;s.y=y;s.bands=bs}A.reset()}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
