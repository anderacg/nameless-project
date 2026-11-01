'use strict';
// Not a test (run by name: -Suites visual/marchgear): the sheet of what marching men carry on the map (gfx/marchgear.js): a
// lord's army of riders, spearmen, pikemen and bowmen by day and by night, at the map's own scale (1×: march.js drawMarcher), twice
// and four times larger; each flag man, each torch man and a plain man, facing right and left. Its picture is the IMG line, a PNG as
// a data URL. (march.js drawMarcher's hook is a line request: until it is in, the stand-in of tests/marchgear.js)
window.RUN=()=>{const o=[],t=T,P=t.P,G=t.G,W=t.W,clock=G.clock,draw0=window.drawMarcher,sprite0=window.marchSprite,life0=window.idleLife;
 const setCtx=(0,eval)('c=>{const k=ctx;ctx=c;return k}');
 try{
  Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;window.idleLife=()=>({pose:null,dx:0});
  if(!/marchGear/.test(String(draw0))){
   window.marchSprite=function(u,o,pose,bare){const type=u.character?u.type.replace(/^comp_/,''):u.type,hero=type==='hero',lead=hero||u.row==='leader';
    return t.unitSprite(type,o.mapKind==='monster'?1:0,hero,lead?0:u.id%6,pose??(u.walking?2+(Math.floor((u.stepT||0)*t.MARCH_MOVE.cadence)+u.id)%4:0),!!bare,false,o.look().col)};
   window.drawMarcher=function(u,o,cam){const k=t.WORLD_BATTLE.sprite/t.WORLD_BATTLE.scale,x=Math.round(u.x-cam.x),y=Math.round(u.y-cam.y),sx=Math.cos(u.dir??t.marchFacing(o))<0?-k:k,Gr=t.marchGear(u,o,x,y,sx),s=window.marchSprite(u,o,undefined,Gr.bare),bx=-Math.floor(s.width/2),by=-s.height+2;
    const c=t.ctx;c.save();c.translate(x,y);c.scale(sx,k);Gr.back(s,bx,by);c.drawImage(s,bx,by);Gr.front(s,bx,by);c.restore()}}
  const kind=c=>Object.keys(t.ST).find(k=>t.ST[k].race==='human'&&!t.ST[k].beast&&!t.ST[k].big&&t.unitClass(t.ST[k])===c&&t.unitSize(k)>=6);
  const lord=W.lords.find(l=>t.FACS[l.fac].races[0]==='human')||W.lords[0];Object.assign(lord,{inside:null,x:P.x+60,y:P.y,state:'march'});
  lord.army={nextId:1,groups:[]};lord.tc={[kind('cav')]:6,[kind('spear')]:15,hum_pike:15,[kind('ranged')]:10};lord.changed();t.MARCH_ARMIES.delete(lord);
  const A=t.MarchArmy.of(lord);A.sync();const R=t.marchRoles(A);
  const Wd=560,H=610,cv=document.createElement('canvas');cv.width=Wd;cv.height=H;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;
  const put=(u,x,y,dir)=>{const was={x:u.x,y:u.y,dir:u.dir,walking:u.walking};Object.assign(u,{x,y,dir,walking:false});try{window.drawMarcher(u,lord,{x:0,y:0})}finally{Object.assign(u,was)}};
  const lights=(z)=>{for(const L of t.LIGHTQ){const r=L.r*z,q=g.createRadialGradient(L.x*z,L.y*z,1,L.x*z,L.y*z,r);q.addColorStop(0,'rgba(255,190,90,.4)');q.addColorStop(1,'rgba(255,150,60,0)');
    g.save();g.globalCompositeOperation='lighter';g.fillStyle=q;g.fillRect(L.x*z-r,L.y*z-r,2*r,2*r);g.restore()}};
  // (a panel: the men, z times larger, on the ground by day or night)
  const panel=(x0,y0,w,h,night,z,men)=>{g.fillStyle=night?'#2a3226':'#7d9a5a';g.fillRect(x0,y0,w,h);G.clock=night?t.DAY*.75:t.DAY*.3;window.eval('LIGHTQ=[]');
    g.save();g.beginPath();g.rect(x0,y0,w,h);g.clip();g.translate(x0,y0);g.scale(z,z);const k=setCtx(g);try{for(const [u,x,y,d] of men)put(u,x,y,d)}finally{setCtx(k)}g.restore();
    if(night){g.fillStyle='rgba(10,14,50,.34)';g.fillRect(x0,y0,w,h);g.save();g.translate(x0,y0);lights(z);g.restore()}};
  // the whole army, 1×, in ranks (its men by group, as it marches)
  const rows=new Map();for(const u of A.units){const r=rows.get(u.row)||[];r.push(u);rows.set(u.row,r)}
  const ranks=dir=>{const out=[];let y=16;for(const men of rows.values()){men.forEach((u,i)=>out.push([u,12+(i%15)*9,y+Math.floor(i/15)*8,dir]));y+=men.length>15?24:16}return out};
  panel(0,0,180,110,false,1,ranks(0));panel(185,0,180,110,true,1,ranks(0));panel(370,0,190,110,true,1,ranks(Math.PI));
  // (and twice its size: the map on a screen of twice its pixels, render.js VS 2)
  panel(0,115,278,195,false,2,ranks(0));panel(282,115,278,195,true,2,ranks(Math.PI));
  // each of its kinds of men with gear, 4× larger: by day, then at night
  const pick=(f)=>A.units.find(u=>f(R.get(u),u));const types=[...rows.values()].map(m=>m[0].type);
  const cast=[...types.map(ty=>pick((r,u)=>u.type===ty&&r.flag)),...types.map(ty=>pick((r,u)=>u.type===ty&&r.torch)),pick((r,u)=>!r.flag&&!r.torch&&!u.character)].filter(Boolean);
  const big=dir=>cast.map((u,i)=>[u,10+i*11,30,dir]);
  panel(0,315,560,145,false,4,big(0));panel(0,465,560,145,true,4,big(Math.PI));
  o.push('INFO '+cast.map(u=>u.type+(R.get(u).flag?(R.get(u).pole?' pole flag':' back flag'):'')+(R.get(u).torch?' torch':'')).join(', '));
  o.push('IMG '+cv.toDataURL('image/png'));
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 finally{window.drawMarcher=draw0;window.marchSprite=sprite0;window.idleLife=life0;G.clock=clock}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
