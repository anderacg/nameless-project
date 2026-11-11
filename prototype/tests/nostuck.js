'use strict';
// No one stuck for good (a review of the rules, 2026-11-11). A fight on the map sets no party down on water (fights.js fightPlace:
// none could step off it again); your band left on ground it cannot stand on makes for the nearest bank (world.js heroAshore: a
// ferry's crossing given up mid-water); dead in hours passed off the map, the death's page comes up, not a map that never moves
// (updateWorld); your place in a lord's host is kept till he can be followed again (hosts.js watch); an heir is one still with
// you (legacy.js heirOf); a free holding's anger at you and a sabotage's days are saved (holding.js saveRec).
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,TILE=t.TILE;Kit.begin('soldier',23);Kit.world();Kit.clear();t.GUIDE.on=false;
 const land=(x,y)=>t.passable(t.terrAt(x,y)),wet=(tx,ty)=>t.tAt(tx,ty)===t.T_WATER;
 // (a water tile with water three tiles each way: a fight's lines, 14 px either side of it, both in the water)
 // (and ground within 8 tiles: a lake or a broad river, not the open sea)
 let spot=null;for(let ty=12;ty<t.MH-12&&!spot;ty++)for(let tx=12;tx<t.MW-12&&!spot;tx++){let all=true;for(let j=-3;j<=3&&all;j++)for(let i=-3;i<=3&&all;i++)if(!wet(tx+i,ty+j))all=false;
  if(all){let near=false;for(let j=-8;j<=8&&!near;j++)for(let i=-8;i<=8&&!near;i++)if(t.passable(t.tAt(tx+i,ty+j)))near=true;if(near)spot={x:(tx+.5)*TILE,y:(ty+.5)*TILE}}}
 try{
  if(!spot)info('no wide water in this world: the water checks not tried');else{
   // ---- a fight on the water
   {const bs=t.bandits.slice(),mk=k=>t.asParty({kind:k,x:spot.x,y:spot.y,troops:Array(5).fill('militia')}),a=mk('bandits'),b=mk('goblins');t.bandits.push(a,b);
    ok(!land(spot.x-14,spot.y-4)&&!land(spot.x+14,spot.y-4),'the place: water where a fight\'s two lines would stand');t.startFight([a],[b]);
    ok(land(a.x,a.y)&&land(b.x,b.y),'a fight begun there: both parties set down on ground they may stand on');
    W.fights=W.fights.filter(f=>![a,b].some(o=>o.fight===f.id));t.bandits.length=0;t.bandits.push(...bs)}
   // ---- your band on the water, a way given
   {const x0=P.x,y0=P.y,ec=G.encCool;P.x=spot.x;P.y=spot.y;const a=t.MARCH_ARMIES.get(P);if(a)a.relocate(P.x,P.y);P.tx=x0;P.ty=y0;P.stuck=0;G.mode='world';G.paused=false;G.speed=1;
    for(let i=0;i<240&&!land(P.x,P.y);i++){G.encCool=1e9;t.updateWorld(1/60)}ok(land(P.x,P.y),'your band left mid-water with a way to go: on the nearest bank ('+Math.round(Math.hypot(P.x-spot.x,P.y-spot.y)/TILE)+' tiles off)');
    P.x=x0;P.y=y0;if(a)a.relocate(x0,y0);P.tx=P.ty=null;G.encCool=ec}}
  // ---- dead off the map
  {G.mode='world';t.hidePanel();G.dead={why:'cold',day:G.day};t.updateWorld(1/60);ok(G.mode==='dead','dead in hours passed off the map: back on it, the death\'s page');G.dead=null;G.mode='world';t.hidePanel()}
  // ---- a host's place kept
  {const l=W.lords.find(x=>!x.dead&&!x.gone&&!x.inside&&x.troops.length),H=t.Host;if(l){const keep={under:H.under,paused:H.paused,follow:G.follow,fight:l.fight,x:l.x,y:l.y};
    l.x=P.x+30;l.y=P.y;H.under={id:l.id,since:G.day,until:G.day+5};H.paused=true;G.follow=null;G.mode='world';G.modal=false;l.fight='none';H.asked='none';H.watch();
    ok(H.paused&&!G.follow,'he still fights as his battle\'s page shuts: your place is kept, not dropped');l.fight=keep.fight||null;const ins=l.inside;l.inside=t.TOWNS[0].name;H.watch();l.inside=ins;ok(!H.paused&&G.follow&&G.follow.o===l,'he to be followed again (at a holding\'s gate): you fall in behind him');
    H.under=keep.under;H.paused=keep.paused;G.follow=keep.follow;l.x=keep.x;l.y=keep.y}}
  // ---- an heir still with you
  ok(t.Legacy.heirOf({a:{ap:9,lv:5,lost:true},b:{ap:6,lv:2}})==='b'&&t.Legacy.heirOf({a:{ap:9,lost:true}})===null,'the heir: the most loyal companion still with you, not one who left');
  // ---- saved with the holding
  {const h=t.TOWNS.find(x=>!x.gone),a0=h.angry,s0=h.sab;h.angry=G.day+10;h.sab={farm:G.day+3,mine:G.day-1};const rec=JSON.parse(JSON.stringify(h.saveRec())),d=Object.create(h);d.loadRec(rec);
   ok(d.angry===G.day+10&&d.sab&&d.sab.farm===G.day+3&&!('mine' in d.sab),'a holding\'s anger at you and a sabotage\'s days to come: in its record, and back from it');
   h.angry=G.day-1;h.sab=undefined;const d2=Object.create(h);d2.angry=5;d2.loadRec(JSON.parse(JSON.stringify(h.saveRec())));ok(!('an' in h.saveRec()[3])&&!Object.prototype.hasOwnProperty.call(d2,'angry'),'anger past and none wrecked: nothing kept');h.angry=a0;h.sab=s0}
  // ---- the world's lords keep their own rules (the same review)
  {const H=t.Host,h=t.TOWNS.find(x=>x.owner&&x.owner!=='player'&&!x.gone),l=W.lords.find(x=>x.fac===h.owner&&!x.dead&&!x.gone),bes=h.besieged;
   if(l){const keep={inside:l.inside,state:l.state,tgt:l.tgt};h.besieged=()=>true;l.inside=h.name;
    ok(H.defending(l),'a lord inside a besieged holding of his realm: defending it, so no campaign calls him out');
    l.inside=null;ok(!H.defending(l),'outside it: free to ride with a campaign');
    l.state='siege';l.tgt='x';l.with='y';H.part(l);ok(l.state==='siege'&&l.tgt==='x'&&l.with===null,'a member laying siege, his campaign over: his siege goes on, not begun again');
    h.besieged=bes;Object.assign(l,keep)}}
  {const l=W.lords.find(x=>!x.dead&&!x.gone&&!t.lordSpares(x));if(l){const keep={troops:l.troops,cool:l.cool},WB=t.WORLD_BATTLE.on,px=P.x,py=P.y,ec=G.encCool,st=P.stay,md=G.modal,tr=P.troops;
    t.Timed.of(P,'hostile').extend(l.fac,5);t.WORLD_BATTLE.on=false;l.cool=0;P.x=l.x+5;P.y=l.y;G.encCool=0;P.stay=null;G.modal=false;
    l.troops=['militia'];P.troops={hum_foot:40};const weak=t.Waylay.springs(l);l.troops=Array(80).fill('hum_foot');P.troops={hum_foot:3};const strong=t.Waylay.springs(l);
    t.WORLD_BATTLE.on=WB;Object.assign(l,keep);P.x=px;P.y=py;G.encCool=ec;P.stay=st;G.modal=md;P.troops=tr;
    ok(!weak&&strong,'a lord lying in wait springs only on an army he can beat (weak one: '+weak+', strong one: '+strong+')')}}
  // ---- a beast's meat: every one slain, whatever hides the field gave
  {const M=t.MONSTERS.boar||Object.values(t.MONSTERS).find(m=>m.meat&&m.mat);if(M&&M.meat){const id=Object.keys(t.MONSTERS).find(k=>t.MONSTERS[k]===M),meat=()=>t.goodN('meat');P.inv=P.inv.map(()=>null);
    G.enc={kind:'monster',field:{gold:0,gear:0,mats:{[M.mat]:2},names:[]}};const a=meat();t.monsterLoot({id,lv:1},[M.unit,M.unit,M.unit]);ok(meat()-a===3*M.meat,'three slain, two hides taken on the field: the meat of all three ('+(meat()-a)+')');G.enc=null;P.inv=P.inv.map(()=>null)}}
  // ---- a job done and never to be reported: closed, not kept for ever
  {const q=Object.create(t.JobQuest.prototype);Object.assign(q,{lord:true,fac:Object.keys(t.FACS).find(f=>f!=='player'),done:true,home:null});const d0=W.dead[q.fac];W.dead[q.fac]=true;
   ok(q.lost(),'done for a lord whose realm has fallen: lost, so it closes');W.dead[q.fac]=d0;ok(!q.lost(),'his realm standing (even hostile a while): kept to report')}
 }finally{G.dead=null}
});
