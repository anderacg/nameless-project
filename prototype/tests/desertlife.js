'use strict';
// The desert's life on the battlefield (engine/ground.js PX.battleGround (4b), PX.desertSprite; doc/TERRAIN_DESIGN.md "Desert life
// as built"): every desert field stands cacti, shrubs, rocks and now and then bones (props dk 4, sorted and faded as trees are) and
// paints clay pans, pebbles and flecks; sparse, in clusters, fewer in the deployment zones and the open lane, more by an oasis,
// counts by area; decoration only (no collision, the cells and routes as built, units walk through); seeded (same field, same
// decor; never Math.random); other climates unchanged (no decor). TERRAIN.on is turned on here.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
try{
 const t=T,G=t.G,L=t.BattleLab,ev=s=>(0,eval)(s),PX=t.PX;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;ev('TERRAIN.on=true');
 const fnv=d=>{let h=2166136261;for(let i=0;i<d.length;i++){h^=d[i];h=Math.imul(h,16777619)>>>0}return h};
 const paint=(rc,seed,W=1100,H=600,x={})=>{const T0=t.buildTerrain({recipe:rc,seed,W,H,top:40,bot:H-40,...x});return{T:T0,G:PX.battleGround({...T0,climate:x.climate||(rc==='swamp'?'swamp':rc==='desert'?'desert':'grass')})}};
 const dec=G0=>G0.props.filter(p=>p.dk===4),CACTI=['saguaro','young','barrel','pear'];
 // ---- every desert layout stands cacti and the rest; the flat details painted
 {const lay=['plain','dune','dunes','erg','spires'],res=[],kinds={};let bad=0,flat=0;
  for(const ly of lay)for(let s=1;s<=4;s++){const {G:G0}=paint('desert',s*7919+ly.length,1100,600,{layout:ly}),D=dec(G0),c=D.filter(p=>CACTI.includes(p.dc)).length;res.push(D.length);if(c<3||D.length<30)bad++;for(const p of D)kinds[p.dc]=(kinds[p.dc]||0)+1;
   const d=G0.getContext('2d', { willReadFrequently: true }).getImageData(0,0,G0.width,G0.height).data;let fl=0,pan=0;for(let i=0;i<d.length;i+=4){if(d[i]===0x7e&&d[i+1]===0x60&&d[i+2]===0x46)fl++;else if(d[i]===0xb0&&d[i+1]===0x8c&&d[i+2]===0x58)pan++}if(fl>40&&pan>10)flat++}
  ok(!bad,'every desert layout ('+lay.join(', ')+', 4 seeds each) stands its life: '+Math.min(...res)+'–'+Math.max(...res)+' pieces a 1100×600 field, 3 cacti at least ('+bad+' short)');
  ok(['saguaro','young','barrel','pear','dead','dry','rocks'].every(k=>kinds[k]>0)&&(kinds.skull||0)+(kinds.ribs||0)>0,'all kinds stand: '+Object.entries(kinds).map(([k,n])=>k+' '+n).join(', '));
  ok(flat===20,'the flat details are painted on every one: dark flecks and sun-cracked clay pans ('+flat+'/20)')}
 // ---- sparse and clustered: fewer in the deployment zones and the open lane; counts by area; more rocks on rocky fields
 {let zn=0,za=0,mn=0,ma=0,ln=0,la=0,rk=[0,0],rkn=[0,0];for(let s=1;s<=8;s++){const {T:T0,G:G0}=paint('desert',s*104729+3,1100,600,{layout:s%2?'plain':'dune'}),D=dec(G0),z=.3*1100,lane=T0.recipe.lane;
    for(const p of D){if(p.y<40||p.y>560)continue;if(p.x<z||p.x>1100-z)zn++;else mn++;if(lane&&p.y>lane.y0&&p.y<lane.y1&&p.x>=z&&p.x<=1100-z)ln++}za+=2*z*520;ma+=(1100-2*z)*520;if(lane){la+=(lane.y1-lane.y0)*(1100-2*z)}}
  const dz=zn/za*1e5,dm=mn/ma*1e5,dl=ln/Math.max(1,la)*1e5;ok(dz<dm*.75&&dl<dm,'lighter in the deployment zones ('+dz.toFixed(1)+' a 100k px² against '+dm.toFixed(1)+' between them) and the open lane ('+dl.toFixed(1)+')');
  for(const [i,ly] of [[0,'plain'],[1,'erg']])for(let s=1;s<=6;s++){const D=dec(paint('desert',s*31337+i,1100,600,{layout:ly}).G);rk[i]+=D.filter(p=>p.dc==='rocks'||p.dc==='dry').length;rkn[i]+=D.length}
  ok(rk[1]/rkn[1]>rk[0]/rkn[0]*1.2,'a rocky field (erg) has more rocks and dry shrubs: '+(rk[1]/rkn[1]*100).toFixed(0)+'% of its pieces against '+(rk[0]/rkn[0]*100).toFixed(0)+'% on the plain');
  const a=dec(paint('desert',77,1100,600,{layout:'plain'}).G).length,b=dec(paint('desert',77,3200,1800,{layout:'plain'}).G).length,r=b/a/(3200*1800/(1100*600));
  ok(r>.65&&r<1.4,'counts scale with the field\'s area: '+a+' on 1100×600, '+b+' on 3200×1800 ('+r.toFixed(2)+'× the area\'s share)');
  // (clusters: most pieces have another within 26 px; few stand closer than 6 px)
  const D=dec(paint('desert',99,1600,900,{layout:'plain'}).G);let nb=0,close=0;for(const p of D){let m=1e9;for(const q of D)if(q!==p)m=Math.min(m,Math.hypot(q.x-p.x,(q.y-p.y)*2));if(m<52)nb++;if(m<6)close++}
  ok(nb>=D.length*.6&&close<=D.length*.05,'in clusters: '+nb+' of '+D.length+' pieces have a neighbour close by, '+close+' crowd one')}
 // ---- an oasis: denser and greener round its pool
 {let ni=0,ai=0,no=0,ao=0,green=0;for(let s=1;s<=6;s++){const {T:T0,G:G0}=paint('desert',s*7907+11,1100,600,{layout:'plain',oasis:true}),D=dec(G0),M=T0.recipe.marsh[0];if(!M)continue;
    for(const p of D){if(p.y<40||p.y>560)continue;const d=Math.hypot(p.x-M.x,(p.y-M.y)*1.2)/M.r;if(d<2){ni++;if(p.dc==='grass'||p.dc==='green')green++}else no++}
    const ri=Math.PI*(2*M.r)*(2*M.r/1.2)-Math.PI*M.r*M.r/1.2;ai+=ri;ao+=1100*520-ri}
  const di=ni/ai*1e5,dO=no/ao*1e5;ok(di>dO*3&&green>=ni*.5,'an oasis: '+di.toFixed(0)+' pieces a 100k px² round its pool against '+dO.toFixed(1)+' on the open sand, '+green+' of its '+ni+' grass and green shrubs')}
 // ---- decoration only: no collision, nothing in the cells, the routes or B.obs; a soldier walks straight through a cactus
 {const sp={recipe:'desert',seed:4242,W:1100,H:600,top:40,bot:560,layout:'spires'},T1=t.buildTerrain(sp),k0=T1.kind.slice(),l0=T1.lvl.slice(),G1=PX.battleGround({...T1,climate:'desert'}),D=dec(G1);
  const same=T1.kind.every((v,i)=>v===k0[i])&&T1.lvl.every((v,i)=>v===l0[i])&&!('decor' in T1)&&!Object.keys(T1).some(k=>/decor|cact/.test(k));
  const g=T1.route.foot,pass=D.every(p=>{const i=t.tIx(T1,p.x,p.y);return T1.kind[i]!==t.TKIND.rock&&(p.y<40||p.y>=560||g.cost[i]>0)});
  ok(same&&pass&&D.length>0,'painting the decor leaves the terrain\'s cells and levels as built and adds nothing to them; every piece ('+D.length+') stands on a passable cell (off the field’s rows, open ground)');
  if(L.active)L.exit();G.mode='world';G.modal=false;
  L.start({leftGroups:[{type:'hum_foot',count:1}],rightGroups:[{type:'hum_foot',count:1}],climate:'desert',deploy:false,ai:false,paused:true,morale:true,seed:5,ground:{recipe:'desert',seed:9,layout:'plain'}});
  const B=t.B;B.cmdT=1e9;t.drawBattle();const P=dec(B.ground),ft=t.fieldTop()+40,fb=t.fieldBot()-40;
  const c=P.filter(p=>p.dc==='saguaro'&&p.y>ft&&p.y<fb&&p.x>200&&p.x<t.BW-200).sort((a,b)=>Math.abs(a.x-t.BW/2)-Math.abs(b.x-t.BW/2))[0];
  ok(B.obs.length===0&&!!c,'with terrain, no obstacles (B.obs empty): the desert\'s cacti are decor ('+P.length+' pieces, a saguaro at '+(c?Math.round(c.x)+','+Math.round(c.y):'none')+')');
  if(c){const g0=Object.values(B.groups).find(q=>!q.foe&&q.units.length),u=g0.units[0],foe=B.units.find(v=>v.team===1);foe.x=t.BW-30;foe.y=t.fieldBot()-20;
   g0.placeAt(c.x-60,c.y);t.layForm(g0.id);u.x=c.x-60;u.y=c.y;g0.moveTo(c.x+60,c.y);B.paused=false;let near=1e9,maxDy=0;
   for(let k=0;k<60*30&&Math.hypot(u.x-(c.x+60),u.y-c.y)>3;k++){t.updateBattle(1/60);near=Math.min(near,Math.hypot(u.x-c.x,u.y-c.y));maxDy=Math.max(maxDy,Math.abs(u.y-c.y))}
   ok(near<2.5&&maxDy<2.5&&Math.abs(u.x-(c.x+60))<4,'a soldier ordered across a saguaro walks straight through its foot (closest '+near.toFixed(1)+' px, off his line '+maxDy.toFixed(1)+' px at most, ends at '+Math.round(u.x-c.x)+' px past it)');
   // (the fade: over your man behind it, as a tree's)
   B.paused=true;u.x=c.x;u.y=c.y-5;foe.x=t.BW-30;for(const p of B.ground.props)p.al=null;ev('PFT=0');t.propsInView([],0,0,t.BW,t.BH);
   const L1=t.battleEnts();ok(c.al===t.PROPFADE.a&&L1.indexOf(u)>=0&&L1.indexOf(u)<L1.indexOf(c),'a cactus over your man behind it fades to '+t.PROPFADE.a+' and is drawn after him (sorted by feet)')}
  L.exit()}
 // ---- seeded: the same field, the same decor and pixels; another seed, another; never Math.random
 {let calls=0;const r0=Math.random;Math.random=()=>{calls++;return r0()};let a,b,c;
  try{const T0=t.buildTerrain({recipe:'desert',seed:555,W:1100,H:600,top:40,bot:560,layout:'erg',oasis:true}),h=G0=>[fnv(G0.getContext('2d', { willReadFrequently: true }).getImageData(0,0,G0.width,G0.height).data),dec(G0).map(p=>p.dc+p.x+','+p.y).join(';')];
   a=h(PX.battleGround({...T0,climate:'desert'}));b=h(PX.battleGround({...T0,climate:'desert'}));c=h(paint('desert',556,1100,600,{layout:'erg',oasis:true}).G)}finally{Math.random=r0}
  ok(a[0]===b[0]&&a[1]===b[1]&&a[1].length>0,'the same field paints the same ground and the same decor, piece for piece');
  ok(a[1]!==c[1],'another seed, another desert');ok(calls===0,'never Math.random ('+calls+' calls)')}
 // ---- other climates: no decor
 {let n=0,f=0;for(const [rc,cl] of [['open','grass'],['forest','grass'],['hills','frost'],['open','frost'],['swamp','swamp'],['hills','swamp']])for(let s=1;s<=2;s++){const {G:G0}=paint(rc,s*977+rc.length,1100,600,{climate:cl,frost:cl==='frost'});n++;if(dec(G0).length||G0.decor)f++}
  ok(!f,'grass, frost and swamp fields stand no desert life ('+n+' fields, '+f+' with any)')}
 // ---- the sprites: each kind and look stands on its foot inside its picture
 {let bad=[];for(const k of ['saguaro','young','barrel','pear','dead','dry','skull','ribs','rocks','grass','green'])for(let v=0;v<6;v++){const S=PX.desertSprite(k,v),b=S.box;if(!(b[2]>b[0]&&b[3]>=S.ay&&b[3]<=S.ay+2&&S.ax>=b[0]&&S.ax<=b[2]))bad.push(k+v)}
  ok(!bad.length,'every kind in its 6 looks stands on its foot (its box\'s bottom at its foot row)'+(bad.length?': '+bad.join(', '):''))}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{try{(0,eval)('TERRAIN.on=false;B=null')}catch(e){}}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
