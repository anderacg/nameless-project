'use strict';
// Ambient life (gfx/ambient.js, owner 2026-10-19): each kind is born in its place, at its hours and in its weather, and not
// elsewhere (no butterflies at night or in the snow, fireflies only at night and in a wood only near you, gulls by water, crows
// by a fight, a trace or ruins); none in the fog; birds on the ground scatter and a hare bolts from anyone who comes near;
// drawing them never draws Math.random and writes nothing the save keeps; a battle's birds burst from its trees as it begins and
// crows circle once it is over; the cost of a frame full of them stays small.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),ev=x=>(0,eval)(x),pn=performance.now;let now=1e7;
try{
 const t=T,G=t.G,P=t.P,W=t.W,TILE=t.TILE,MW=t.MW,MH=t.MH,A=t.AMBIENT,AV=t.AMBV;try{localStorage.clear()}catch(e){}
 // (the hours and the tame land, owner 2026-10-19: checked on their own below; the rest read with them set aside)
 const H0=A.hours,T0=A.tame,DAYF=f=>{G.clock=t.DAY*f};
 {const c0=G.clock;DAYF(.03);const dawn=t.ambMul('flock');DAYF(.3);const mid=t.ambMul('flock');DAYF(.15);const morn=t.ambMul('flock');G.clock=c0;
  ok(Math.abs(dawn/morn-H0.Dawn)<1e-9&&Math.abs(mid/morn-H0.Midday)<1e-9,'the hours: dawn ×'+H0.Dawn+', midday ×'+H0.Midday+', the rest as they are ('+[dawn,mid,morn].map(v=>v.toFixed(2)).join(', ')+')')}
 A.hours={};
 t.act('begin','soldier');G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();G.encCool=1e9;
 // (a quiet map: no one about but you)
 const park=()=>{for(const l of W.parties){l.x=-9999;l.y=-9999}W.monsters=[];W.critters=[];W.caravans=[];W.folk=[];W.refugees=[];W.fights=[];if(W.road)W.road.on=[]};park();
 performance.now=()=>now;A.on=true;AV.q=4242;
 const DAY=t.DAY,day=()=>{G.clock=DAY*.3},night=()=>{G.clock=DAY*.75};day();
 const frames=n=>{for(let i=0;i<n;i++){now+=50;t.drawWorld()}};
 const at=(x,y)=>{P.x=x;P.y=y;P.tx=P.ty=null;G.chase=null;AV.list.length=0;AV.t=0;frames(1)};
 // (every birth: wrapped, as the map calls it)
 window.__amb=[];ev('ambSpawn=(f=>(k,x,y)=>{__amb.push([k,x,y,inSight(x,y),Math.hypot(x-P.x,y-P.y),terrAt(x,y)]);return f(k,x,y)})(ambSpawn)');
 const EV={};for(const k of t.AMB_KINDS)EV[k]=A[k].every;const fast=()=>{for(const k of t.AMB_KINDS)A[k].every=.05},slow=()=>{for(const k of t.AMB_KINDS)A[k].every=EV[k]};
 const births=n=>{__amb.length=0;fast();frames(n);slow();const by={};for(const b of __amb)by[b[0]]=(by[b[0]]||0)+1;return by};
 const show=by=>Object.entries(by).map(([k,n])=>k+' '+n).join(', ')||'none';
 const tAt=(x,y)=>t.tAt(x,y),cl=(x,y)=>t.CLIMS[t.climate[y*MW+x]];
 // (a tile whose square of r round it all passes f)
 const find=(f,r=0,from=null)=>{let best=null,bd=1e9;for(let y=r+3;y<MH-r-3;y+=1)for(let x=r+3;x<MW-r-3;x+=1){if(!f(x,y))continue;let all=true;for(let j=-r;j<=r&&all;j++)for(let i=-r;i<=r;i++)if(!f(x+i,y+j)){all=false;break}
   if(!all)continue;const d=from?Math.hypot(x-from[0],y-from[1]):0;if(d<bd){bd=d;best=[x,y];if(!from)return best}}return best};
 const mid=p=>[(p[0]+.5)*TILE,(p[1]+.5)*TILE];
 // ---- the switch, as the other drawn-only switches
 ok(Object.getOwnPropertyDescriptor(A,'on').get&&t.PREFS.ambient.def===true,'Ambient life is a setting (PREFS ambient), on by default; AMBIENT.on its view');
 // ---- by day, in the fields by a holding
 const H=t.townBy('Ashford'),hx=Math.floor(H.x/TILE),hy=Math.floor(H.y/TILE);
 const field=find((x,y)=>tAt(x,y)===t.T_OPEN&&cl(x,y)==='grass'&&!t.ambLot(x,y)&&Math.hypot(x-hx,y-hy)>=4,2,[hx,hy]);
 {const [x,y]=mid(field);at(x,y);const by=births(200),out=__amb.filter(b=>!b[3]);
  ok(by.fly>0&&!by.glow,'by day in the fields by '+H.name+': butterflies, no fireflies; birds depend on the resident patches ('+show(by)+')');
  ok(!out.length,'every one is born in your sight ('+__amb.length+' births, '+out.length+' out of it)');
  ok(t.AMB_KINDS.every(k=>!t.ambientCan(k,x+t.vis()*1.2,y)&&!t.ambientCan(k,x,y-t.vis()*1.5)),'and none may be born in the fog (beyond your sight), whatever its kind');
  ok(t.ambientCan('fly',x,y)&&(night(),!t.ambientCan('fly',x,y))&&(day(),true),'butterflies by day, none at night');
  window.__w0=t.ambWeather;for(const w of ['rain','storm','snow']){ev('ambWeather=()=>"'+w+'"');ok(!t.ambientCan('fly',x,y)&&t.ambMul('flock')<1&&t.ambMul('peck')<1&&t.ambMul('fly')===1,'in the '+w+': no butterflies, fewer birds ('+t.ambMul('flock')+'×)')}
  ev('ambWeather=__w0');
  window.__rm=t.reducedMotion;ev('reducedMotion=()=>true');const calm=t.ambMul('fly'),fs=t.ambSpawn('flock',x,y),sp=Math.hypot(fs.vx,fs.vy);ev('reducedMotion=__rm');const fs2=t.ambSpawn('flock',x,y);
  ok(calm===A.calm&&sp<=A.flock.speed[1]*A.slow+1e-9&&Math.hypot(fs2.vx,fs2.vy)>=A.flock.speed[0]-1e-9,'reduced motion: fewer ('+calm+'×) and calmer (a flock at '+sp.toFixed(1)+' px/s, else '+Math.hypot(fs2.vx,fs2.vy).toFixed(1)+')')}
 // ---- the flock's shadow, and the birds over the figures (drawn: its shadow on the ground offset from under it)
 {const [x,y]=mid(field);at(x,y);const e=t.ambSpawn('flock',x,y);AV.list.push(e);e.t=e.life/2;e.x=x+30;e.y=y-10;e.vx=e.vy=0;e.m.length=1;e.m[0].dx=e.m[0].dy=0;e.m[0].da=0;e.alt=50;
  // (k: the canvas's pixels to a game pixel; VS only in the map's own frame: render.js setRes)
  const k=t.cv.width/t.VW,w=64,pic=()=>{t.ctx.save();t.ctx.fillStyle='#b0b090';t.ctx.fillRect(0,0,t.VW,t.VH);const c=G.cam,X=Math.round(e.x-c.x),Y=Math.round(e.y-c.y);t.ambientFlat(c);t.ambientAir(c);t.ctx.restore();return t.ctx.getImageData((X-32)*k,(Y-e.alt-6)*k,w*k,(e.alt+24)*k).data};
  A.on=true;const on=pic();AV.list.length=0;const off=pic();let up=0,dn=0;for(let i=0;i<on.length;i+=4){if(Math.abs(on[i]-off[i])+Math.abs(on[i+1]-off[i+1])>12){const r=(i/4/(w*k)/k)|0;if(r<12)up++;else if(r>=e.alt)dn++}}
  ok(up>0&&dn>0,'a flock overhead is drawn in the air ('+up+' px) with its shadow on the ground below ('+dn+' px)')}
 // ---- birds scatter, a hare bolts, from anyone who comes near
 {const plain=find((x,y)=>tAt(x,y)===t.T_OPEN&&cl(x,y)==='grass'&&!t.ambLot(x,y),4,[hx,hy]);const [x,y]=mid(plain);at(x,y);const fx=x+40,fy=y;
  const e=t.ambSpawn('peck',fx,fy);e.life=1e9;AV.list.push(e);frames(3);const still=e.st==='peck';
  const L=W.parties.find(q=>!q.dead);const keep=[L.x,L.y,L.inside];L.inside=null;L.x=fx+12;L.y=fy;frames(1);const st=e.st;frames(10);
  const away=e.m.every(m=>Math.hypot(m.x-L.x,m.y-L.y)>12)&&e.m.every(m=>m.alt>0);
  ok(still&&st==='fly'&&away,'birds pecking stay while no one is near, and burst up and away when a party comes close ('+st+')');
  L.x=-9999;L.y=-9999;const h=t.ambSpawn('hare',fx,fy+30);h.life=1e9;AV.list.push(h);frames(3);const sat=h.st==='sit';const d0=Math.hypot(h.x-P.x,h.y-P.y);
  P.x=fx-10;P.y=fy+30;frames(1);const bolt=h.st;frames(6);
  ok(sat&&bolt==='bolt'&&Math.hypot(h.x-P.x,h.y-P.y)>10+5,'a hare sits, and bolts from your band as it comes near ('+bolt+', '+Math.round(d0)+' px off before)');[L.x,L.y,L.inside]=keep;park()}
 // ---- fireflies: at night, in a wood only near you, never by day
 {const wood=find((x,y)=>tAt(x,y)===t.T_FOREST&&cl(x,y)==='grass',3);
  if(!wood)ok(true,'(no wood on this map)');else{const [x,y]=mid(wood);night();at(x,y);const by=births(200),V=t.vis(),far=__amb.filter(b=>b[0]==='glow'&&b[5]===t.T_FOREST&&b[4]>=V*A.glow.near);
   ok(by.glow>0&&!by.fly&&!by.peck&&!by.flock&&!by.gull&&!by.squirrel,'at night in a wood: fireflies, no butterflies, no birds, no squirrels ('+show(by)+')');
   ok(!far.length,'the wood’s fireflies only near you (within '+A.glow.near+' of your sight: '+far.length+' farther)');
   day();const by2=births(150);ok(!by2.glow,'by day in the wood: no fireflies ('+show(by2)+')');
   ok(__amb.filter(b=>b[0]==='squirrel').every(b=>b[4]<V*A.squirrel.near+1),'a squirrel only near you in the wood')}}
 // ---- the snow: no butterflies, fewer birds
 {const fr=find((x,y)=>tAt(x,y)===t.T_OPEN&&cl(x,y)==='frost',2);
  if(!fr)ok(true,'(no frost on this map)');else{const [x,y]=mid(fr);day();at(x,y);const by=births(200);
   ok(!by.fly&&t.ambWeather()==='snow'&&t.ambMul('flock')===A.snow,'in the frost, the snow falling: no butterflies, birds '+A.snow+'× ('+show(by)+')')}}
 // ---- gulls and fish by the water; none inland
 {const shore=find((x,y)=>tAt(x,y)!==t.T_WATER&&tAt(x,y)!==t.T_MOUNT&&cl(x,y)==='grass'&&tAt(x+2,y)===t.T_WATER&&tAt(x+3,y)===t.T_WATER&&tAt(x+4,y)===t.T_WATER,0);
  if(!shore)ok(true,'(no shore on this map)');else{const [x,y]=mid(shore);day();at(x,y);const by=births(250),bad=__amb.filter(b=>(b[0]==='gull'||b[0]==='fish')&&b[5]!==t.T_WATER);
   ok(by.gull>0&&by.fish>0&&!bad.length,'by the shore: gulls and fish jumping, all over the water ('+show(by)+')')}
  // (fields with no water within sight: since stage 3's bigger lots the nearest fields to Ashford's gate lie by its river)
  const dry=(x,y)=>{for(let b=-9;b<=9;b++)for(let a=-9;a<=9;a++)if(tAt(x+a,y+b)===t.T_WATER)return false;return true},inl=find((x,y)=>tAt(x,y)===t.T_OPEN&&cl(x,y)==='grass'&&!t.ambLot(x,y)&&dry(x,y),0,[hx,hy])||field;
  const [x,y]=mid(inl);at(x,y);const by=births(200);ok(!by.gull&&!by.fish,'inland in the fields: no gulls, no fish ('+show(by)+')')}
 // ---- crows: by ruins, a trace on the road, a fight; none without
 {const R=W.sites.find(s=>s.type==='ruins');
  if(!R)ok(true,'(no ruins on this map)');else{R.seen=true;day();at(R.x+20,R.y+20);const by=births(120),cr=AV.list.filter(e=>e.k==='crow');
   ok(by.crow>0&&cr.length&&cr.every(e=>e.ak==='s'+R.i&&Math.hypot(e.x-R.x,e.y-R.y)<1),'crows circle the ruins you see ('+cr.length+' flock of '+(cr[0]?cr[0].m.length:0)+')')}
  const [x,y]=mid(field);at(x,y);const by=births(120);ok(!by.crow,'and none over open fields with no fight, trace or ruins ('+show(by)+')');
  W.fights=[{id:'zz',x:x+30,y:y+10,sides:[[],[]]}];const by2=births(80);const cr=AV.list.filter(e=>e.k==='crow');
  ok(by2.crow>0&&cr.some(e=>e.ak==='fzz'),'a fight in your sight draws crows over it');W.fights=[];frames(30);
  ok(!AV.list.some(e=>e.k==='crow'),'and they are gone soon after it ends')}
 // ---- Math.random: never drawn by it
 {const [x,y]=mid(field);at(x,y);fast();const R0=Math.random;let n=0;Math.random=()=>{n++;return R0()};
  const run=on=>{A.on=on;AV.list.length=0;AV.t=0;n=0;Math.random=t.seeded(77);const s=Math.random;Math.random=()=>{n++;return s()};const t0=now;frames(80);now=t0;const k=n,next=[Math.random(),Math.random(),Math.random()];return [k,next.join(),AV.list.length]};
  const a=run(true),b=run(false),c=run(true);Math.random=R0;slow();A.on=true;
  ok(a[2]>0&&a[0]===b[0]&&a[1]===b[1]&&a[1]===c[1],'drawing them leaves Math.random as it was: '+a[0]+' draws in 80 frames with them ('+a[2]+' about) and without, the next draws the same')}
 // ---- nothing saved, nothing in the world
 {const [x,y]=mid(field);at(x,y);frames(5);const snap=()=>JSON.stringify(t.worldSave())+'|'+Object.keys(W).sort().join()+'|'+Object.keys(G).sort().join()+'|'+Object.keys(P).sort().join();
  const s0=snap();fast();frames(120);slow();const s1=snap();
  ok(AV.list.length>0&&s0===s1&&!/flock|"peck"|squirrel|firefl/.test(s1),'nothing of them is in the world, the game or the save ('+AV.list.length+' about)')}
 // ---- the cost of a frame full of them
 {const [x,y]=mid(field);at(x,y);const V=t.vis();for(const k of ['flock','flock','gull','gull','gull','crow','crow'])AV.list.push(Object.assign(t.ambSpawn(k,x+30,y-20),{ak:'zz'}));
  for(let i=0;i<40;i++){const a=i*2.4,r=V*.7*Math.sqrt((i+.5)/40),k=['peck','hare','fly','fish','glow'][i%5];AV.list.push(Object.assign(t.ambSpawn(k,x+Math.cos(a)*r,y+Math.sin(a)*r),{life:1e9,wait:1e9}))}
  const n=AV.list.length,fns=['ambientWorld','ambientFlat','ambientAir','ambientGlow'],keep={};let own=0;
  for(const f of fns){keep[f]=t[f];window['__'+f]=t[f];ev(f+'=function(){const a=pn.call(performance);try{return __'+f+'.apply(this,arguments)}finally{__own+=pn.call(performance)-a}}')}
  window.pn=pn;window.__own=0;const time=(on,k)=>{A.on=on;const a=pn.call(performance);for(let i=0;i<k;i++){now+=16;t.drawWorld()}return (pn.call(performance)-a)/k};
  const A0=AV.list.slice();time(true,5);AV.list.length=0;AV.list.push(...A0);window.__own=0;const on=time(true,40),mine=__own/40,cnt=AV.list.length;const off=time(false,40);A.on=true;
  for(const f of fns)ev(f+'=__'+f);
  o.push('INFO a frame with '+cnt+' about ('+n+' made): '+on.toFixed(2)+' ms, without them '+off.toFixed(2)+' ms; their own steps and drawing '+mine.toFixed(3)+' ms a frame');
  ok(mine<3,'their own cost stays small with many on screen ('+mine.toFixed(3)+' ms a frame)')}
 // ---- in battle: birds out of the trees as it begins, crows once it is over
 {const [x,y]=mid(field);at(x,y);t.BDEPLOY.on=false;G.enc={kind:'party',ref:{x:P.x,y:P.y,cool:0},list:['militia','militia','militia'],allies:[],foes:[]};
  t.startBattle({enemies:G.enc.list,deploy:false});const Bt=t.B,c=Bt.cam,z=c?c.z:1,vx=c?c.x:0,vy=c?c.y:0;const g0=Bt.ground;
  const trees=[0,1,2,3].map(i=>{const tx=vx+80+i*90,ty=vy+120+i*20;return{dk:1,x:tx,y:ty,box:[tx-12,ty-30,tx+12,ty]}});Bt.ground={props:trees};
  const R0=Math.random;let n=0;Math.random=()=>{n++;return R0()};
  A.on=false;t.ambientBattle();const none=!AV.bt||AV.bt.b!==Bt||!AV.bt.list.length;A.on=true;AV.bt=null;
  Bt.deploy=true;t.ambientBattle();const wait=!AV.bt.list.length;Bt.deploy=false;t.ambientBattle();const L=AV.bt.list.slice(),fromTree=L.every(b=>b.k==='bird'&&trees.some(p=>Math.abs(p.x-b.x)<=4&&p.y===b.y));
  now+=1500;t.ambientBattle();const up=AV.bt.list.every(b=>b.alt>L.find(q=>q===b).alt-1e-9);
  ok(none&&wait&&L.length>=2&&L.length<=A.battle.trees[1]*A.battle.n[1]&&fromTree&&up,'a battle begins (its deployment over): '+L.length+' birds burst out of its trees and fly up (none while deploying, none with the switch off)');
  Bt.over=true;t.ambientBattle();const cr=AV.bt.list.filter(b=>b.k==='crow');
  ok(cr.length>=2&&cr.length<=A.battle.crows[1],'once it is over, '+cr.length+' crows circle the field');
  Math.random=R0;ok(n===0,'the battle’s birds draw no Math.random ('+n+')');Bt.ground=g0;Bt.over=false}
 // the tame land: on a holding's land or by a road a spot is kept only A.tame of the time; in the wilds always
 {const A0=t.TOWNS[0],wild=(()=>{for(let ty=8;ty<MH-8;ty++)for(let tx=8;tx<MW-8;tx++){const x=(tx+.5)*TILE,y=(ty+.5)*TILE;if(t.tAt(tx,ty)===t.T_OPEN&&!t.landHold(x,y)&&!t.nearTile(tx,ty,t.T_ROAD,1))return[x,y]}})();
  A.tame=0;const onLand=t.ambWild(A0.x+30,A0.y+30),inWild=wild&&t.ambWild(wild[0],wild[1]);A.tame=1;const kept=t.ambWild(A0.x+30,A0.y+30);A.tame=T0;
  A.hours=H0;ok(!onLand&&inWild&&kept,'life keeps to the wilds: a spot on a holding’s land kept only '+T0+' of the time, in the wilds always')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
performance.now=pn;
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
