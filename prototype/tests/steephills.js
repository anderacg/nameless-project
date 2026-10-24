'use strict';
// The steep hill (D41; doc/WORLD_DESIGN.md §13, §15.2 wave 2, agent E; battle/terrain.js STEEP): B.terrain.steep's contract (its
// bits, the band, the shoulder, scree); climbed anywhere but slowly and tiringly (foot, riders crawling, dwarves), slower and more
// tiring than a rise, walking and running; ranks broken on the climb and a while after; no momentum built or kept going up, none
// for riders on scree; a charge down it hits harder than off a rise; a strong height bonus (range, melee; scree: range); routes
// price its banks, so a way goes by the shoulder when it is near, and a group sent up takes it; the AI holds a steep crest before a
// rise and never runs up at one; its words and its look (a darker stony bank); the same tile the same field. TERRAIN.on is turned
// on here (tests/harness.js turns it off).
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),ev=s=>(0,eval)(s);try{
 const K=t.TKIND,ST=t.STEEP,HL=t.HILL,TA=t.TERRAIN_AI,BH=t.BH,W=()=>t.BW,PI=Math.PI;t.act('begin','soldier');t.G.quietEvents=true;t.GUIDE.on=false;ev('TERRAIN.on=true');
 const G=(type,count,form)=>({type,count,...(form?{form}:{})});
 // (a lab battle on this ground, the captains silent unless ai; groups laid out at [x,y] each, left first)
 const army=(left,right,at,ground,extra={})=>{if(L.active)L.exit();t.G.mode='world';t.G.modal=false;L.start({leftGroups:left,rightGroups:right,morale:true,deploy:false,paused:true,ai:false,seed:42,...(ground?{ground}:{}),...extra});const b=t.B;b.obs=[];
  const mine=t.playerGroups().map(id=>b.groups[id]),foe=Object.values(b.groups).filter(g=>g.foe);
  if(at)[...mine,...foe].forEach((g,i)=>{g.placeAt(at[i][0],at[i][1]);t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+(u.sx||0);u.y=g.ay+(u.sy||0)})});if(extra.quiet)b.cmdT=1e9;return {b,mine,foe}};
 const hill=(x,y,r,top,more={})=>({hills:[{x:x/W(),y:y/BH,r,top,...more}],woods:[],seed:3});
 const still=g=>g.units.forEach(u=>{u.s={...u.s,spd:0};u.cd=999});
 // (the cells of T with bit b; a bank cell of T whose uphill way is d)
 const cells=(T,b)=>{const out=[];for(let i=0;i<T.kind.length;i++)if(T.steep&&T.steep[i]&b)out.push(i);return out},mid=(T,i)=>({x:(i%T.C+.5)*T.cs,y:(Math.floor(i/T.C)+.5)*T.cs});
 const bankAt=(T,d,b=2)=>{let best=null;for(let i=0;i<T.kind.length;i++)if(T.up[i]===d&&(!b||T.steep&&T.steep[i]&b)&&(!best||Math.abs(mid(T,i).y-300)<Math.abs(mid(T,best).y-300)))best=i;return best};

 // ======== the contract: B.terrain.steep's bits
 let w=army([G('hum_foot',4)],[G('hum_foot',4)],[[100,300],[W()-100,300]],hill(W()/2,300,120,2,{steep:true,scree:true,shoulder:90}));
 {const T=w.b.terrain,S=T.steep,N=T.C*T.R;let bad=0,bank=0,shoulder=0,scree=0;
  for(let i=0;i<N;i++){const v=S[i];if(v&2&&!(T.up[i]>=0&&v&1))bad++;if(v&4&&!(v&2))bad++;if(v&8&&!(v&1))bad++;if(!!(v&1)!==(T.lvl[i]>0))bad++;if(v&2)bank++;if(v&4)scree++;if(T.up[i]>=0&&v&1&&!(v&2))shoulder++}
  ok(S instanceof Uint8Array&&S.length===N&&!bad&&bank>0&&scree===bank&&shoulder>0,'B.terrain.steep: a Uint8Array(C×R); bit 1 the hill\'s ground, 2 its steep banks ('+bank+' cells), 4 scree on them ('+scree+'), 8 a scree hill\'s ground; its shoulder\'s bank cells a rise ('+shoulder+')');
  const sh=cells(T,1).filter(i=>T.up[i]>=0&&!(S[i]&2)).map(i=>mid(T,i));ok(sh.every(p=>p.y>300),'the shoulder lies on its side (90°: south): '+sh.length+' bank cells, all below the top');
  ok(T.has.steep&&T.blocky&&T.recipe.hills[0].steep&&T.recipe.hills[0].scree&&Math.abs(T.recipe.hills[0].shoulder-PI/2)<1e-9&&T.ai.tops[0].steep&&!T.wall,'has.steep, routing on (blocky), recipe.hills and ai.tops carry steep, scree and the shoulder; no cliffs');
  const R0=army([G('hum_foot',4)],[G('hum_foot',4)],[[100,300],[W()-100,300]],hill(W()/2,300,120,2)).b.terrain,bandR=R0.up.filter(v=>v>=0).length,bandS=T.up.filter(v=>v>=0).length;
  ok(!R0.steep&&!R0.has.steep&&!R0.blocky&&bandS>bandR*1.5,'a rise of the same size: no steep grid, no routing; its slope band '+bandR+' cells, the steep hill\'s '+bandS+' (STEEP.band '+ST.band+' cells a level)')}

 // ======== the climb: slower and more tiring than a rise, riders crawl, dwarves as up a rise
 {const mk=(steep,type='hum_foot')=>{const g=army([G(type,1)],[G('hum_foot',1)],[[100,300],[W()-100,300]],hill(W()/2,300,120,2,steep?{steep:true}:{}));const T=g.b.terrain,u=g.mine[0].units[0],i=bankAt(T,4,steep?2:0),p=mid(T,i);u.x=p.x;u.y=p.y;u.dir=PI;u.spdNow=20;return{T,u}};
  let s=mk(true),r=mk(false);const sp=[s.T.speedFor(s.u,-1,0),r.T.speedFor(r.u,-1,0)],sta=[s.T.staminaFor(s.u),r.T.staminaFor(r.u)],wd=[s.T.wadeFor(s.u),r.T.wadeFor(r.u)],dn=[s.T.speedFor(s.u,1,0),r.T.speedFor(r.u,1,0)];
  ok(sp[0]===ST.climb.foot&&sp[1]===HL.climb.foot&&sp[0]<sp[1],'foot climb a steep bank at ×'+sp[0]+' (a rise ×'+sp[1]+'), and come down it at ×'+dn[0]+' (a rise ×'+dn[1]+')');
  ok(sta[0]===ST.sta&&sta[1]===HL.climbSta&&wd[0]===ST.walk&&wd[1]===0,'running up it tires ×'+sta[0]+' (a rise ×'+sta[1]+'); walking up it tires too ('+wd[0]+' of FATIGUE.run a second; a rise none)');
  s=mk(true,'hum_knight');r=mk(false,'hum_knight');const cv=[s.T.speedFor(s.u,-1,0),r.T.speedFor(r.u,-1,0)];
  ok(cv[0]===t.TERRAIN.floor&&cv[0]<cv[1],'riders crawl up it: ×'+cv[0]+' (the floor; a rise ×'+cv[1]+')');
  s=mk(true,'dw_axe');const dw=[s.T.speedFor(s.u,-1,0),s.T.staminaFor(s.u),s.T.wadeFor(s.u)];ok(dw[0]===HL.climb.foot&&dw[1]===HL.climbSta&&dw[2]===0,'dwarves climb it as others climb a rise (×'+dw[0]+', stamina ×'+dw[1]+')');
  // (a soldier sent from the foot to the top, walking: the time it takes and the stamina it costs)
  const go=steep=>{const g=army([G('hum_foot',1)],[G('hum_foot',1)],[[W()/2+190,300],[W()-60,500]],hill(W()/2,300,120,2,steep?{steep:true}:{}),{quiet:true});const u=g.mine[0].units[0];u.sta=100;
   g.mine[0].standAt(W()/2,300);g.b.paused=false;const t0=g.b.t;let n=0;while(Math.hypot(u.x-W()/2,u.y-300)>14&&n++<60*60)t.updateBattle(1/60);g.b.paused=true;return{s:g.b.t-t0,sta:100-u.sta}};
  const a=go(true),b=go(false);ok(a.s>b.s*1.25&&a.sta>b.sta,'from its foot to its top: '+a.s.toFixed(1)+' s up the steep hill, '+b.s.toFixed(1)+' s up a rise; stamina spent '+a.sta.toFixed(1)+' and '+b.sta.toFixed(1));
  w=army([G('hum_foot',1)],[G('hum_foot',1)],[[100,300],[W()-100,300]],hill(W()/2,300,120,2,{steep:true}));const T=w.b.terrain,u=w.mine[0].units[0],i=bankAt(T,4),p=mid(T,i);
  u.x=p.x;u.y=p.y;u.dir=PI;u.spdNow=20;ok(T.flag(u,'loose')&&T.flag(u,'thin')&&!t.cohesionReady(u),'on a steep bank ranks break: no cohesion, no shield wall nor wedge (loose, thin)');
  T.update();u.x=W()/2;u.y=300;u.spdNow=0;const br=t.steepRanks(u);w.b.t+=ST.reform+.1;ok(br&&!t.steepRanks(u),'and stay broken '+ST.reform+' s after the climb (steepRanks)')}

 // ======== momentum: none built or kept going up; none for riders on scree; a charge down it hits hard
 {w=army([G('hum_knight',1)],[G('hum_foot',1)],[[100,300],[W()-100,300]],hill(W()/2,300,120,2,{steep:true,scree:true,shoulder:270}));const T=w.b.terrain,u=w.mine[0].units[0],i=bankAt(T,4),p=mid(T,i);
  u.x=p.x;u.y=p.y;u.run=0;const up=T.runFor(u,-1,0,3),down=T.runFor(u,1,0,3);u.run=40;u.dir=PI;u.spdNow=30;T.update();const keptUp=u.run;u.run=40;u.dir=0;T.update();const keptScree=u.run;
  const R=army([G('hum_knight',1)],[G('hum_foot',1)],[[100,300],[W()-100,300]],hill(W()/2,300,120,2)).b.terrain,v=w.mine[0].units[0];
  ok(up===0&&keptUp===0&&R.runFor(Object.assign(v,{x:p.x,y:p.y,run:0}),-1,0,3)===HL.runUp,'up a steep bank no momentum builds ('+up+'; a rise ×'+HL.runUp+') and a rider\'s is lost ('+keptUp+')');
  ok(down===0&&keptScree===0,'scree: a rider gets no momentum on it, going down too ('+down+'), and loses what he had ('+keptScree+')');
  const f=army([G('hum_foot',1)],[G('hum_foot',1)],[[100,300],[W()-100,300]],hill(W()/2,300,120,2,{steep:true})),T2=f.b.terrain,a=f.mine[0].units[0],e=f.foe[0].units[0];
  e.x=W()/2+220;e.y=300;a.x=W()/2;a.y=300;a.run=0;T2.runFor(a,1,0,3);a.run=30;for(let k=0;k<6;k++){a.x+=10;T2.runFor(a,1,0,10)}a.rlv=1;const cS=T2.chargeFor(a,e);
  const f2=army([G('hum_foot',1)],[G('hum_foot',1)],[[100,300],[W()-100,300]],hill(W()/2,300,120,2)),T3=f2.b.terrain,a2=f2.mine[0].units[0],e2=f2.foe[0].units[0];e2.x=e.x;e2.y=300;a2.rlv=1;a2.x=W()/2+60;a2.y=300;const cR=T3.chargeFor(a2,e2);
  ok(cS>cR&&Math.abs(cS-(1+HL.charge+ST.charge*a.rst))<1e-9&&a.rst>.5,'a charge down off it hits ×'+cS.toFixed(2)+' (off a rise ×'+cR.toFixed(2)+'; '+Math.round(a.rst*100)+'% of the run off the steep hill)')}

 // ======== a strong height bonus: range, melee; scree: range
 {w=army([G('hum_bow',1)],[G('hum_foot',1)],[[W()/2,300],[W()-100,300]],hill(W()/2,300,120,2,{steep:true}));const T=w.b.terrain,u=w.mine[0].units[0],r0=t.ST.hum_bow.range;u.x=W()/2;u.y=300;T.update();const rs=u.s.range;
  const ws=army([G('hum_bow',1)],[G('hum_foot',1)],[[W()/2,300],[W()-100,300]],hill(W()/2,300,120,2,{steep:true,scree:true})),us=ws.mine[0].units[0];us.x=W()/2;us.y=300;ws.b.terrain.update();const rsc=us.s.range;
  const wr=army([G('hum_bow',1)],[G('hum_foot',1)],[[W()/2,300],[W()-100,300]],hill(W()/2,300,120,2)),ur=wr.mine[0].units[0];ur.x=W()/2;ur.y=300;wr.b.terrain.update();const rr=ur.s.range;
  ok(rr===r0*(1+HL.range*2)&&Math.abs(rs-r0*(1+(HL.range+ST.range)*2))<1e-9&&rsc>rs,'a bowman on top: '+Math.round(rs)+' px range on a steep hill, '+Math.round(rsc)+' on a scree one, '+Math.round(rr)+' on a rise (flat '+r0+')');
  const e=w.foe[0].units[0];e.x=W()/2+200;e.y=300;const hs=T.hitFor(u,e),hr=wr.b.terrain.hitFor(ur,Object.assign(wr.foe[0].units[0],{x:e.x,y:300}));
  ok(Math.abs(hs-(1+HL.melee+ST.melee))<1e-9&&Math.abs(hr-(1+HL.melee))<1e-9,'a blow down from it ×'+hs.toFixed(2)+' (from a rise ×'+hr.toFixed(2)+')');
  ok(/Steep high ground \(\+30% range\)/.test(T.label([u])),'the HUD: "'+T.label([u])+'"')}

 // ======== routes price the banks: by the shoulder when it is near; a group sent up takes it (the field's middle row: MID)
 {const MID=(t.fieldTop()+t.fieldBot())/2,g=hill(W()/2,MID,90,1,{steep:true,shoulder:0}),wt=army([G('hum_foot',12)],[G('hum_foot',1)],[[W()/2+125,MID-70],[W()-60,t.fieldTop()+20]],g,{quiet:true}),T=wt.b.terrain,gr=T.route.foot;
  const bankC=gr.cost[cells(T,2)[0]];ok(bankC===Math.round(t.ROUTE.unit*ST.route.foot)&&gr.wcap===bankC-1&&T.route.mounted.cost[cells(T,2)[0]]===Math.round(t.ROUTE.unit*ST.route.mounted),'a steep bank costs '+bankC+' on the foot\'s grid (open '+t.ROUTE.unit+'), the riders\' '+T.route.mounted.cost[cells(T,2)[0]]+'; a straight way is clear over ground up to '+gr.wcap);
  const crosses=(pts,x,y)=>{let n=0,px=x,py=y;for(const q of pts){const L0=Math.hypot(q[0]-px,q[1]-py),k=Math.ceil(L0/4);for(let j=1;j<=k;j++){const i=t.tIx(T,px+(q[0]-px)*j/k,py+(q[1]-py)*j/k);if(T.steep[i]&2)n++}px=q[0];py=q[1]}return n};
  const A={x:W()/2+125,y:MID-70},p=t.routePath(gr,A.x,A.y,W()/2,MID),straight=crosses([[W()/2,MID]],A.x,A.y);
  ok(straight>0&&crosses(p,A.x,A.y)===0&&p.ok,'from beside its shoulder (east) to the top: the straight way climbs the bank ('+straight+' samples on it), the way goes round by the shoulder ('+crosses(p,A.x,A.y)+')');
  const B0={x:W()/2-150,y:MID},q=t.routePath(gr,B0.x,B0.y,W()/2,MID);ok(q.ok&&crosses(q,B0.x,B0.y)>0,'from the far side (west), the shoulder far round: the way climbs the bank straight');
  // (the group: sent from beside the shoulder to the top, it goes up by the shoulder)
  // (its men's steps climbing a steep bank (on one, going up it), sent from beside the shoulder and from the far side)
  const send=(x,y)=>{const g2=army([G('hum_foot',12)],[G('hum_foot',1)],[[x,y],[W()-60,t.fieldTop()+20]],g,{quiet:true}),T2=g2.b.terrain,m=g2.mine[0];m.standAt(W()/2,MID);g2.b.paused=false;let n=0;
   for(let k=0;k<60*25;k++){t.updateBattle(1/60);for(const u of m.units){const i=t.tIx(T2,u.x,u.y);if(T2.steep[i]&2&&u.spdNow>0&&u.dir!=null&&T2.slope(i,Math.cos(u.dir),Math.sin(u.dir))>0)n++}}g2.b.paused=true;return{n,top:m.units.filter(u=>T2.lvl[t.tIx(T2,u.x,u.y)]>=1).length}};
  const a=send(W()/2+125,MID-70),b=send(W()/2-150,MID);ok(a.top>=9&&b.top>=9&&a.n<b.n*.3,'a group sent up from beside the shoulder gets there ('+a.top+'/12 on top after 25 s) with '+a.n+' climbing steps on the steep bank; from the far side, up the bank, '+b.n+' ('+b.top+'/12 on top)')}

 // ======== the AI: holds a steep crest before a rise; never runs up at one
 {const MID=(t.fieldTop()+t.fieldBot())/2,X0=W()-300,two={hills:[{x:X0/W(),y:(MID-80)/BH,r:60,top:1},{x:X0/W(),y:(MID+80)/BH,r:60,top:1,steep:true}],woods:[],seed:3},X=TA.steepHold;
  const hold=()=>{const d=army([G('hum_foot',36)],[G('hum_foot',12),G('hum_bow',16)],[[250,MID],[W()-160,MID],[W()-110,MID]],two);still(d.mine[0]);t.command(1);return t.captainMem(1)};
  const Q=hold();ok(Q.post==='defend'&&Q.hold&&Q.hold.y>MID&&X>0,'defending with a low rise and a steep hill on its half, alike in height and as near: it holds the steep crest ('+(Q.hold?Math.round(Q.hold.x)+','+Math.round(Q.hold.y):'none')+'; steepHold +'+X+')');
  {const b=t.B,inf=Object.values(b.groups).filter(g=>g.foe)[0],T2=b.terrain,i=t.tIx(T2,inf.ax,inf.ay);ok(T2.steep[i]&1&&T2.lvl[i]===1&&inf.ax<Q.hold.x,'its infantry is sent to the steep hill\'s forward crest ('+Math.round(Q.hold.x-inf.ax)+' px ahead of the top, toward the foe)')}
  TA.steepHold=0;const q0=hold().hold;TA.steepHold=X;info('(with steepHold 0 it holds '+(q0?Math.round(q0.x)+','+Math.round(q0.y):'none')+')');
  const up=steep=>{const u=army([G('hum_foot',16)],[G('hum_foot',32)],[[300,300],[450,300]],hill(300,300,115,2,steep?{steep:true}:{}));still(u.mine[0]);t.captainMem(1).commit=true;t.command(1);return u.foe[0].order};
  const a=up(true),b=up(false);ok(a!=='charge'&&b==='charge','strong enough to charge up a rise (32 to 16: '+b+'), they walk up at a steep crest instead ('+a+')')}

 // ======== words, look, the same tile the same field
 {const T=army([G('hum_foot',1)],[G('hum_foot',1)],[[100,300],[W()-100,300]],{recipe:'hills',seed:7}).b.terrain;void T;
  const S=(tx,ty,x={})=>t.battleSiteOf({tx,ty,t:t.T_HILL,c:'grass',high:{kind:'steep',up:0,scree:true,mixed:true,shoulder:2,...x}}),env={c:'grass',t:t.T_HILL},bt=s=>t.buildTerrain({...t.terrainOf(s,env),W:1100});
  const h=T0=>{let v=2166136261;for(const A of [T0.kind,T0.lvl,T0.up,T0.steep||[]])for(const c of A)v=Math.imul(v^(c&255),16777619)>>>0;return v};
  const a=bt(S(70,40)),b=bt(S(70,40)),c=bt(S(71,40));ok(h(a)===h(b)&&h(a)!==h(c)&&!!a.steep,'the same tile, the same steep field; the next tile another');
  ok(/steep: climbed anywhere, but slowly and tiringly/.test(a.recipe.text)&&/Scree/.test(a.recipe.text)&&/shoulder/.test(a.recipe.text),'its words: "'+a.recipe.text.replace(/^.*?(The hill|The hills)/,'$1')+'"');
  // (the look: a steep bank's pixels darker than the same bank painted as a rise; scree speckled)
  const paint=more=>{const g=army([G('hum_foot',1)],[G('hum_foot',1)],[[100,500],[W()-100,500]],hill(W()/2,300,120,2,more)),T0=g.b.terrain,cv=t.PX.battleGround({...T0,climate:'grass'}),D=cv.getContext('2d', { willReadFrequently: true }).getImageData(0,0,cv.width,cv.height).data;return{T0,D,w:cv.width}};
  const s=paint({steep:true}),r=paint({}),sc=paint({steep:true,scree:true}),lum=(P,i)=>{const C=P.T0.C,cs=P.T0.cs,x0=(i%C)*cs,y0=Math.floor(i/C)*cs;let n=0,v=0,v2=0;for(let y=y0;y<y0+cs;y++)for(let x=x0;x<x0+cs;x++){const o=(y*P.w+x)*4,l=.3*P.D[o]+.59*P.D[o+1]+.11*P.D[o+2];v+=l;v2+=l*l;n++}return[v/n,Math.sqrt(Math.max(0,v2/n-(v/n)**2))]};
  const bank=cells(s.T0,2).filter(i=>s.T0.up[i]===6);let ls=0,lr=0,vs=0,vc=0;for(const i of bank){ls+=lum(s,i)[0];lr+=lum(r,i)[0];vs+=lum(s,i)[1];vc+=lum(sc,i)[1]}ls/=bank.length;lr/=bank.length;vs/=bank.length;vc/=bank.length;
  ok(bank.length>0&&ls<lr-6,'its look: the south bank '+ls.toFixed(0)+' bright painted steep, '+lr.toFixed(0)+' as a rise (a darker stony bank, '+bank.length+' cells)');
  info('scree speckles the bank: its pixels vary ±'+vc.toFixed(1)+' (steep grass ±'+vs.toFixed(1)+')')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{if(L.active)L.exit();try{ev('TERRAIN.on=false')}catch(e){}}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
