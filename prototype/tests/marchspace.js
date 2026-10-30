'use strict';
// No two marchers on each other (world/march.js marchBody, marchRoomK, the parting pass in MarchArmy#step; the owner, 2026-10-30:
// "army marching formation makes units overlap, please make sure that units cannot overlap"): an army of foot and riders, standing,
// marching, turning and halting, never has two of its men closer than their bodies (foot 5.5 px on the map, riders 8), the riders'
// rows marching wider to fit.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:1e9});
 let at=null;const okT=q=>q===t.T_OPEN||q===t.T_ROAD;
 for(let ty=10;ty<t.MH-10&&!at;ty+=3)for(let tx=12;tx<t.MW-12&&!at;tx+=3){let open=true;for(let j=-4;j<=4&&open;j++)for(let i=-8;i<=8&&open;i++)if(!okT(t.tAt(tx+i,ty+j)))open=false;
  if(open&&t.TOWNS.every(z=>Math.hypot(z.x-(tx+.5)*16,z.y-(ty+.5)*16)>200))at=[(tx-4.5)*16,(ty+.5)*16]}
 ok(!!at,'(open ground for the march)');if(!at)return;Kit.goTo(at[0],at[1]);P.troops={hum_foot:24,hum_spear:12,hum_knight:8};
 const A=t.MarchArmy.of(P);A.sync();ok(A.units.length>=40,'(an army of '+A.units.length+' marching)');
 const worst=()=>{let w=Infinity,pair=null;const u=A.units;for(let i=0;i<u.length;i++)for(let j=i+1;j<u.length;j++){const d=Math.hypot(u[i].x-u[j].x,u[i].y-u[j].y),need=(t.marchBody(u[i])+t.marchBody(u[j]))/2,s=d-need;if(s<w){w=s;pair=[u[i].type,u[j].type,d.toFixed(2),need.toFixed(2)]}}return{w,pair}};
 const run=(sec,dx,dy)=>{let lo=Infinity,pr=null;for(let i=0;i<sec/.05;i++){P.x+=dx*.05;P.y+=dy*.05;A.step(.05);const r=worst();if(r.w<lo){lo=r.w;pr=r.pair}}return{lo,pr}};
 const TOL=.35;
 {const r=run(6,0,0);info('standing: closest '+r.lo.toFixed(2)+' '+JSON.stringify(r.pr));ok(r.lo>-TOL,'formed up, standing: no two closer than their bodies (closest '+r.lo.toFixed(2)+' px past it)')}
 {const r=run(5,18,0);info('marching: '+r.lo.toFixed(2)+' '+JSON.stringify(r.pr));ok(r.lo>-TOL*2,'marching east: none on each other (closest '+r.lo.toFixed(2)+')')}
 {const r=run(3,0,18);info('turning: '+r.lo.toFixed(2)+' '+JSON.stringify(r.pr));ok(r.lo>-TOL*2,'turning south: none on each other (closest '+r.lo.toFixed(2)+')')}
 {const r=run(6,0,0);ok(r.lo>-TOL,'halted: they settle apart (closest '+r.lo.toFixed(2)+')')}
 {const K=A.units.filter(u=>u.type==='hum_knight');ok(t.marchRoomK({form:'line',type:'hum_knight'})>1&&t.marchRoomK({form:'line',type:'hum_foot'})===1,'riders\' rows march wider ('+t.marchRoomK({form:'line',type:'hum_knight'}).toFixed(2)+'×), foot as before')}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
