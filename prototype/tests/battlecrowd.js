'use strict';
// A crowded battle (the owner, 2026-10-27: phones): the spatial grid on a world battle's wide, sparse field gives the same pick
// as the full scan (spatial.js: its buckets emptied as used, nearest man by man where cells outnumber men), and refiled holds just
// the living; in a press the banners keep their first badges only (moraleicons.js UICON.crowd); and the time a step of a crowded
// world battle takes (INFO only: machines differ).
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,L=t.BattleLab;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;
 // (every living man's nearest foe, by the grid and by the full scan; the grid's every bucket against the living)
 const same=()=>{const b=t.B,live=b.units.filter(u=>u.hp>0);const g=t.spatialOpen(),grid=live.map(u=>t.nearest(u)),sparse=g.n*t.SPATIAL.sparse<g.C*g.R;
   let filed=0;for(const tm of g.teams)for(const k of g.by[tm])filed+=k.length;const placed=live.every(u=>g.by[u.team][g.at[b.units.indexOf(u)]].includes(b.units.indexOf(u)));t.spatialClose();const full=live.map(u=>t.nearest(u));
   return{sparse,cells:g.C*g.R,n:g.n,match:grid.every((e,i)=>e===full[i]),filed,live:live.length,placed,used:g.used.length}};
 // ---- a world battle: four armies on a wide field
 t.WORLD_BATTLE.on=true;t.TERRAIN.on=true;t.PHYSICS.on=true;t.EXITS.on=true;G.paused=false;G.speed=1;P.fac='vale';P.hostile={};P.troops={hum_foot:24,hum_bow:16,hum_knight:8,hum_spear:12};
 const home=Kit.goHome('Ashford');Kit.goTo(home.x+400,home.y+350);const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE);for(let y=ty-30;y<=ty+30;y++)for(let x=tx-30;x<=tx+30;x++){const i=y*t.MW+x;t.tiles[i]=t.T_OPEN;t.WM.edge[i]=0}
 const A=t.asParty({kind:'bandits',troops:Array(30).fill('militia'),x:P.x+25,y:P.y,cool:0}),R=t.asParty({kind:'raiders',troops:Array(24).fill('militia'),x:P.x+18,y:P.y-18,cool:0});t.bandits.push(A,R);W.monsters=[t.asMonster({id:'wolf',n:10,lv:1,x:P.x+10,y:P.y+22,hx:P.x+10,hy:P.y+22,t:0,a:0,cool:0})];
 G.enc={kind:'party',ref:A,list:A.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,surprise:true});const b=t.B;t.setAuto(true,true);
 let ms=0,n=0;for(let i=0;i<240&&t.B===b&&!b.over;i++){const a=performance.now();t.updateBattle(1/30);ms+=performance.now()-a;n++;if(i===120){const s=same();info('world field: '+s.n+' men, '+s.cells+' cells a team'+(s.sparse?' (sparse)':''));
   ok(s.sparse&&s.match,'on a world battle’s wide field the grid picks the same nearest foe as the full scan, man by man');ok(s.placed&&s.filed===s.live&&s.used<=s.live,'refiled, the grid holds just the living, in their own buckets ('+s.used+' buckets used)')}}
 info('MEASURE a step of a world battle of '+b.sides.records.length+' armies, '+b.units.filter(u=>u.hp>0&&!u.left).length+' still fighting: '+(ms/Math.max(1,n)).toFixed(1)+' ms');t.finishBattle();t.act('lt-leave');Kit.done({world:true});Kit.clear();t.WORLD_BATTLE.on=false;
 // ---- a crowded lab battle: a dense field, and the banners in the press
 const Gp=(type,count,form)=>({type,count,...(form?{form}:{})});
 L.start({leftGroups:[Gp('hum_foot',20),Gp('hum_foot',20),Gp('hum_spear',16),Gp('hum_bow',14),Gp('hum_knight',8,'wedge'),Gp('hum_squire',8)],rightGroups:[Gp('orc_grunt',24),Gp('orc_grunt',24),Gp('orc_thrower',14),Gp('orc_wolf',10),Gp('orc_brute',10)],deploy:false,ai:true,paused:false,morale:true,ground:{recipe:'open',seed:7},seed:7});
 for(let i=0;i<240;i++)t.updateBattle(1/30);const s=same();ok(!s.sparse&&s.match,'on a crowded lab field (rings of cells) the grid still picks as the full scan');
 t.frame();const K=t.unitIconScale(),S=t.UICON.s,I=t.B.icons,hit=(a,b)=>a.x<b.x+b.bw&&b.x<a.x+a.bw&&a.y<b.y+b.h&&b.y<a.y+a.h,pressed=I.filter(a=>I.some(b=>b!==a&&hit(a,b)));
 info(I.length+' banners, '+pressed.length+' in a press');ok(pressed.every(a=>a.bw<=(S+11)*K),'banners in a press keep one column of badges');ok(I.some(a=>a.bw>S*K),'banners still show their badges');L.exit();
 ok(!ERR.length,'a crowded battle has no runtime errors');
});
