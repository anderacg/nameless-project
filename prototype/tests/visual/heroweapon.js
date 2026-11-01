'use strict';
window.ARENA=true;// (the battle screen's own field: tests/harness.js)
// Not a test (run by name: -Suites visual/heroweapon): the audit of your hero's weapon (the owner, 2026-11-01: "the hero battle
// unit should also draw a weapon from start to finish"). Your hero with each weapon (a sword, a spear, a bow, a crossbow, a
// greatsword, a staff, and bare hands), every pose and frame, both facings, as the battle draws him (render.js drawUnit), knocked
// down (drawDowned), on the march (march.js marchSprite, at its scale) and the march's leader; a lord riding (a lance) and on foot
// beside him. Each cell is drawn twice, with his weapon and with it taken off (figures.js FigureRig.gearOf less the hand's gear,
// weapons.js heldNow none): the pixels that differ are his weapon as seen. A cell with none, though he carries one, is ringed red
// and listed (MISS). Its picture is the IMG line, a PNG as a data URL
window.RUN=()=>{const o=[],t=T,P=t.P;
 const keep={};const stub=(n,f)=>{if(!(n in keep))keep[n]=window[n];window[n]=f};
 try{
  window.requestAnimationFrame=()=>0;Kit.begin('soldier',3);
  const G=t.G;G.mode='world';G.modal=false;t.hidePanel();P.troops={hum_foot:4};G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia','militia']};t.startBattle({enemies:G.enc.list,tournament:false});
  const B=t.B,h=B.hero,K=3,FX=t.STATE_FX.on;t.STATE_FX.on=false;B.terrain=null;
  const setCtx=(0,eval)('c=>{const k=ctx;ctx=c;return k}');
  const spr=t.spr,FIG=t.FIGURES,clear=()=>{for(const k in spr)delete spr[k];FIG.map.clear()};
  const gearOf=t.FigureRig.gearOf,held=window.heldNow;let off=false;
  t.FigureRig.gearOf=(L,map)=>{const g=gearOf(L,map);return off?g.filter(x=>x.slot!=='main'&&x.slot!=='shooter'):g};
  for(const n of ['heroAura','drawStuck','drawMorale'])stub(n,()=>{});stub('idleLife',()=>({pose:null,dx:0}));
  const W=48,H=48;
  // (a canvas's pixels; how many differ between two)
  const px=c=>c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height).data;
  const diff=(a,b)=>{const A=px(a),D=px(b);let n=0;for(let i=0;i<A.length;i+=4)if(A[i+3]!==D[i+3]||A[i]!==D[i]||A[i+1]!==D[i+1]||A[i+2]!==D[i+2])n++;return n};
  // (one cell: draw(c) into a fresh canvas, with the weapon and without; [picture, weapon pixels])
  const cell=draw=>{const pic=w=>{off=!w;clear();const c=document.createElement('canvas');c.width=W;c.height=H;draw(c);return c};
    const no=pic(false),yes=pic(true);off=false;return[yes,diff(yes,no)]};
  // (drawUnit for u in pose p facing f; dq: knocked down, how far)
  const unit=(u,p,f,dq)=>c=>{const k=setCtx(c.getContext('2d'));stub('procPose',()=>p);stub('physDownPose',()=>dq??null);stub('heldNow',off?()=>null:held);
    try{c.getContext('2d').setTransform(1,0,0,1,0,0);Object.assign(u,{x:W/2,y:H-6,plx:W/2,ply:H-6,face:f,hitAt:null,stun:0,spdNow:0,movF:0,z:0,wIdx:null,tgt:null,
      atkAt:p>=6&&p<=14?B.t-t.ATK_ANIM*((p-6)%3+.5)/3:null,atkStyle:p>=12?'overhead':p>=9?'thrust':'swing'});if(p>=2&&p<=5||p>=15)u.spdNow=u.s.spd*(p>=15?.9:.5);t.drawUnit(u)}finally{setCtx(k)}};
  // (a sprite as the march draws it: at its scale, facing f)
  const sprite=(mk,f)=>c=>{const s=mk(),k=t.WORLD_BATTLE.sprite/t.WORLD_BATTLE.scale*2,g=c.getContext('2d');g.save();g.translate(W/2,H-4);g.scale(f*k,k);g.drawImage(s,-(s.width>>1),-s.height+2);g.restore()};
  const POSES=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,41,42,43];
  const item=b=>'g_'+b+'_2',WEAPONS=[['sword','sword'],['spear','spear'],['bow','bow'],['crossbow','crossbow'],['greatsword','two-hander'],['staff','staff'],['warhammer','hammer'],[null,'bare hands']];
  const rows=[],miss=[];
  const row=(label,cells,armed)=>{const L=cells.map(([name,draw])=>{const [c,n]=cell(draw);if(armed&&n<4)miss.push(label+' '+name);return[c,n,name]});rows.push([label,L,armed])};
  const P0={...P.gear},inM=h.inMelee;
  for(const [b,name] of WEAPONS){P.gear.weapon=b&&item(b);P.gear.offhand=null;h.look=null;h.side=null;
    for(const f of [1,-1]){
      row(name+(f<0?' (left)':''),POSES.map(p=>['p'+p,unit(h,p,f)]),!!b);
      if(b==='bow'||b==='crossbow'){h.inMelee=true;row(name+' in melee'+(f<0?' (left)':''),[0,2,6,7,8,9,10,11].map(p=>['p'+p,unit(h,p,f)]),true);h.inMelee=inM}}
    row(name+' knocked down',[.2,.5,.8,1].map(q=>['q'+q,unit(h,0,1,q)]),!!b);
    row(name+' on the march',[0,1,2,3,4,5,41,42].map(p=>['p'+p,sprite(()=>t.unitSprite('hero',0,true,0,p,false,false,P.look?P.look().col:null),1)]).concat([2,3].map(p=>['L'+p,sprite(()=>t.unitSprite('hero',0,true,0,p,false,false,null),-1)])),!!b)}
  Object.assign(P.gear,P0);h.look=null;h.side=null;
  // (a lord riding: hum_knight, a lance; and the same man off his horse)
  {const lu=B.units.find(u=>!u.hero&&u.team===1)||B.units.find(u=>!u.hero),keepT=lu.type,keepS=lu.s;lu.type='hum_knight';lu.look=null;lu.s={...lu.s,mounted:true};
   row('a lord riding',POSES.filter(p=>p<19||p>26).map(p=>['p'+p,unit(lu,p,1)]),true);lu.afoot=true;lu.look=null;
   row('off his horse',POSES.map(p=>['p'+p,unit(lu,p,-1)]),true);lu.afoot=false;
   lu.type='hum_sergeant';lu.look=null;lu.s={...keepS,mounted:false};row('a lord, a sword',POSES.map(p=>['p'+p,unit(lu,p,1)]).concat([.5,1].map(q=>['q'+q,unit(lu,0,-1,q)])),true);lu.type=keepT;lu.s=keepS;lu.look=null}
  // the sheet
  const cw=W*K+4,lw=150,cols=Math.max(...rows.map(r=>r[1].length)),cv=document.createElement('canvas');cv.width=lw+cols*cw;cv.height=rows.length*(H*K+14)+20;
  const g=cv.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#6f8a5a';g.fillRect(0,0,cv.width,cv.height);g.font='11px Arial';
  rows.forEach(([label,L,armed],r)=>{const y=r*(H*K+14)+14;g.fillStyle='#fff';g.fillText(label,4,y+H*K/2);
    L.forEach(([c,n,name],i)=>{const x=lw+i*cw;g.drawImage(c,x,y,W*K,H*K);g.fillStyle=armed&&n<4?'#ff4040':'#e8e4d0';g.fillText(name+(armed?' '+n:''),x+2,y-2);if(armed&&n<4){g.strokeStyle='#ff2020';g.lineWidth=2;g.strokeRect(x+1,y+1,W*K-2,H*K-2)}})});
  o.push('IMG '+cv.toDataURL('image/png'));
  for(const m of miss)o.push('MISS '+m);
  for(const [label,L,armed] of rows)if(armed)o.push('INFO '+label+': '+L.map(([c,n,name])=>name+'='+n).join(' '));
  o.push('INFO '+rows.length+' rows, '+rows.reduce((a,r)=>a+r[1].length,0)+' cells, '+miss.length+' with no weapon seen');
  t.STATE_FX.on=FX;t.FigureRig.gearOf=gearOf;
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 finally{for(const n in keep)window[n]=keep[n]}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
