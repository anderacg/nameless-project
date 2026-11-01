'use strict';
// Filling places (core/assign.js SLOTFILL; the owner, 2026-11-01: "when unit groups moving in march formation or battle, just make
// units try to fill the position instead of fixed to one specific unit"): the helper's share is the least walking in all (checked
// against every share of a few men), the same each time, its buffers kept, and cheap (ms for 15, 30 and 100 men). Battle
// (formations.js layForm, battlecontrol.js refill): a line turned about takes its back rank for its front, no two paths crossing;
// a new width less walking than before; a man fallen, the nearest closes the gap; a character and a man at grips keep their
// places (the latter till his fight is over); a battle replays the same. The march (march.js MarchArmy refill): an army wheeling
// and turning back on itself, its column forming and breaking, less walking than each man to his index's place. No runtime errors.
Kit.suite(({ok,info})=>{
 const t=T,S=t.SLOTFILL,F=t.FILL;
 // ---- the helper
 // (n men and n places at random, seeded; into its buffers)
 let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 const put=(n,k)=>{t.fillRoom(Math.max(n,k));for(let i=0;i<n;i++){F.mx[i]=rnd()*200;F.my[i]=rnd()*200}for(let j=0;j<k;j++){F.px[j]=rnd()*200;F.py[j]=rnd()*200}};
 {let worst=0;for(let r=0;r<20;r++){const n=6;put(n,n);const got=t.assignSlots(n,n);let best=Infinity;const p=[0,1,2,3,4,5];
   const perm=(k)=>{if(k===n){let s=0;for(let i=0;i<n;i++)s+=t.fillCost(i,p[i]);best=Math.min(best,s);return}for(let i=k;i<n;i++){[p[k],p[i]]=[p[i],p[k]];perm(k+1);[p[k],p[i]]=[p[i],p[k]]}};perm(0);worst=Math.max(worst,got-best)}
  ok(worst<1e-6,'the least walking in all: 20 draws of 6 men, the share is the best of all 720 ('+worst.toExponential(1)+' off at worst)')}
 {put(5,8);t.assignSlots(5,8);const a=[...F.out.slice(0,5)];put(8,5);t.assignSlots(8,5);const b=[...F.out.slice(0,8)];
  ok(new Set(a).size===5&&a.every(j=>j>=0&&j<8)&&b.filter(j=>j>=0).length===5&&new Set(b.filter(j=>j>=0)).size===5,'fewer men than places, and more: each place one man at most ('+a.join(' ')+' / '+b.join(' ')+')')}
 {seed=11;put(60,60);const idx=[];for(let i=0;i<60;i++)idx.push(i);const was=t.fillWalk(60,null),cost=t.assignSlots(60,60),out=[...F.out.slice(0,60)];let id=0;for(let i=0;i<60;i++)id+=t.fillCost(i,i);
  ok(new Set(out).size===60&&cost<id*.6,'over '+S.exact+' men (60): nearest first and a pass of swaps, a whole share, '+Math.round(100*cost/id)+'% of the squares of each man to his index\'s place (walk '+Math.round(t.fillWalk(60,F.out))+' px for '+Math.round(was)+')')}
 {seed=3;put(30,30);t.assignSlots(30,30);const a=[...F.out.slice(0,30)];seed=3;put(30,30);t.assignSlots(30,30);const b=[...F.out.slice(0,30)];
  // (ties: men on one spot, places on one spot: to the lower index)
  t.fillRoom(4);for(let i=0;i<4;i++){F.mx[i]=F.my[i]=0;F.px[i]=F.py[i]=5}t.assignSlots(4,4);
  ok(a.join()===b.join()&&[...F.out.slice(0,4)].join()==='0,1,2,3','the same men and places, the same share; ties to the lower index ('+[...F.out.slice(0,4)].join()+')')}
 {const cost={};for(const n of [15,30,100]){seed=5;let ms=0,runs=n>30?20:60;for(let r=0;r<runs;r++){put(n,n);const t0=performance.now();t.assignSlots(n,n);ms+=performance.now()-t0}cost[n]=ms/runs}
  info('cost of a share: '+Object.entries(cost).map(([n,ms])=>n+' men '+ms.toFixed(3)+' ms').join(', '));
  const bufs=['mx','my','px','py','out','u','v','mn','p','way','used','ix','c'].map(k=>F[k]);for(let r=0;r<40;r++){const n=5+r%90;put(n,n);t.assignSlots(n,n)}
  ok(['mx','my','px','py','out','u','v','mn','p','way','used','ix','c'].every((k,i)=>F[k]===bufs[i])&&cost[30]<2,'its buffers kept, grown once to the biggest group (40 shares more, none made); 30 men in '+cost[30].toFixed(3)+' ms')}
 // ---- battle
 const L=t.BattleLab;
 try{
  L.start({leftGroups:[{type:'hum_foot',count:20,name:'Foot'},{type:'hum_foot',count:4,name:'Spare'}],rightGroups:[{type:'hum_foot',count:4,name:'Enemy'}],deploy:false,paused:true,ai:false,morale:false,seed:42});
  const b=t.B,ids=t.playerGroups(),g=b.groups[ids[0]],foe=b.groups[Object.keys(b.groups).find(id=>b.groups[id].foe)];
  const men=()=>t.grpUnits(g.id),far=()=>{for(const e of t.grpUnits(foe.id)){e.x=t.BW-20;e.y=40}};
  // (formed: facing face, files wide, at 400, 300, every man on his place)
  const form=(face,files)=>{far();g.placeAt(400,300);g.face=g.currentFacing=face;g.files=files;g.form='line';t.layForm(g.id);for(const u of men()){u.x=g.ax+u.sx;u.y=g.ay+u.sy}};
  const walk=()=>men().reduce((s,u)=>s+Math.hypot(g.ax+u.sx-u.x,g.ay+u.sy-u.y),0);
  const crossings=()=>{const m=men(),seg=u=>[u.x,u.y,g.ax+u.sx,g.ay+u.sy],X=(a,b)=>{const [x1,y1,x2,y2]=a,[x3,y3,x4,y4]=b,d=(x2-x1)*(y4-y3)-(y2-y1)*(x4-x3);if(Math.abs(d)<1e-9)return false;
    const s=((x3-x1)*(y4-y3)-(y3-y1)*(x4-x3))/d,r=((x3-x1)*(y2-y1)-(y3-y1)*(x2-x1))/d;return s>.01&&s<.99&&r>.01&&r<.99};let n=0;for(let i=0;i<m.length;i++)for(let j=i+1;j<m.length;j++)if(X(seg(m[i]),seg(m[j])))n++;return n};
  const distinct=()=>new Set(men().map(u=>Math.round(u.sx*10)+','+Math.round(u.sy*10))).size===men().length;
  // (the same with SLOTFILL off: as before)
  const old=f=>{S.on=false;try{return f()}finally{S.on=true}};
  {const turn=()=>{form(0,8);g.moveTo(400,300,{face:Math.PI});return{w:walk(),c:crossings()}},a=turn(),o=old(turn);
   info('a line of 20 (8 files, 3 ranks) turned about: '+a.w.toFixed(0)+' px walked in all, '+a.c+' paths crossing; before (front slots first, each to the nearest free man) '+o.w.toFixed(0)+' px, '+o.c+' crossing');
   ok(a.c===0&&a.w<=o.w+1e-6&&distinct(),'a line turned about: its back rank its front, no two men\'s paths crossing ('+a.w.toFixed(0)+' px walked for '+o.w.toFixed(0)+')')}
  {const wheel=()=>{form(0,8);g.moveTo(400,300,{face:Math.PI/2});return{w:walk(),c:crossings()}},a=wheel(),o=old(wheel);
   ok(a.w<=o.w+1e-6&&distinct(),'wheeled a quarter: '+a.w.toFixed(0)+' px walked in all ('+a.c+' crossing) for '+o.w.toFixed(0)+' ('+o.c+') before')}
  {const wide=()=>{form(0,8);g.setForm('line',{files:4});return{w:walk(),c:crossings()}},a=wide(),o=old(wide);
   ok(a.w<=o.w+1e-6&&a.c<=o.c&&distinct(),'8 files to 4: '+a.w.toFixed(0)+' px walked in all ('+a.c+' crossing) for '+o.w.toFixed(0)+' ('+o.c+') before')}
  // (a man fallen in its front rank: the formation laid for the rest, the man nearest his place taking it)
  {form(0,8);g.step(.001);const m=men(),front=m.filter(u=>u.sx>Math.max(...m.map(v=>v.sx))-1),f=front[3],nx=g.ax+f.sx,ny=g.ay+f.sy;
   const near=m.filter(u=>u!==f).sort((a,b)=>Math.hypot(a.x-nx,a.y-ny)-Math.hypot(b.x-nx,b.y-ny))[0];f.hp=0;g.step(.001);
   const S2=t.formSlots('line',19,0,8,1),gap=S2.reduce((a,p)=>Math.hypot(p[0]-f.sx,p[1]-f.sy)<Math.hypot(a[0]-f.sx,a[1]-f.sy)?p:a),holder=men().find(u=>Math.abs(u.sx-gap[0])<.01&&Math.abs(u.sy-gap[1])<.01);
   ok(men().length===19&&distinct()&&holder===near&&men().every(u=>S2.some(p=>Math.abs(p[0]-u.sx)<.01&&Math.abs(p[1]-u.sy)<.01)),'a man fallen in the front rank: the 19 laid again in 3 ranks, his place taken by the man nearest it (the one behind him, '+Math.hypot(near.x-nx,near.y-ny).toFixed(0)+' px off)');
   f.hp=f.max}
  // (a character: his own place, whatever the group does)
  {form(0,8);const c=men()[5],was=[c.sx,c.sy];c.leader={name:'Test',lv:1};try{g.moveTo(400,300,{face:Math.PI});g.setForm('line',{files:5})}finally{delete c.leader}
   ok(c.sx===was[0]&&c.sy===was[1]&&distinct(),'a character (a lord, a chief, a companion) keeps his own place through a turn and a new width, no man given it')}
  // (a man at grips keeps his place till his fight is over; then the formation is laid again round all)
  {form(0,8);const m=men(),front=m.filter(u=>u.sx>Math.max(...m.map(v=>v.sx))-1).sort((a,b)=>a.sy-b.sy),u=front[0],e=t.grpUnits(foe.id)[0],was=[u.sx,u.sy];e.x=u.x+12;e.y=u.y-14;
   const at=m.filter(v=>Math.hypot(e.x-v.x,e.y-v.y)<(v.s.reach||11)+t.FILL_GRIPS),kept=at.map(v=>[v,v.sx,v.sy]);g.moveTo(400,300,{face:Math.PI});
   ok(at.length>=1&&at.length<m.length&&u.sx===was[0]&&u.sy===was[1]&&kept.every(([v,x,y])=>v.sx===x&&v.sy===y)&&distinct(),'a man at grips ('+at.length+' of them) keeps his place through a turn about; the rest re-formed round him, none on his place');
   const slots=()=>t.formSlots('line',men().length,g.face,g.files,1),onSlot=v=>slots().some(p=>Math.abs(p[0]-v.sx)<.01&&Math.abs(p[1]-v.sy)<.01);
   const flagged=men().filter(v=>v.slotKept).length;far();g.refill(men().filter(v=>!v.rout));
   ok(flagged>0&&!men().some(v=>v.slotKept)&&men().every(onSlot)&&distinct(),'his fight over: the formation laid again round all ('+flagged+' kept till then), every man on one of its places')}
  // (no allocation: the helper's buffers and the march's kept through the battle's shares)
  {const bufs=[F.mx,F.px,F.out,F.u];for(let i=0;i<20;i++){form(i%2?0:Math.PI,4+i%5);g.refill(men())}
   ok(F.mx===bufs[0]&&F.px===bufs[1]&&F.out===bufs[2]&&F.u===bufs[3],'the helper\'s buffers kept through 20 battle shares')}
 }catch(e){ok(false,'battle: '+e.message+' '+e.stack)}finally{if(L.active)L.exit()}
 // (a battle replays the same: 300 frames of 20 against 20, twice, the same seed)
 {const run=()=>{L.start({leftGroups:[{type:'hum_foot',count:20,name:'Foot'}],rightGroups:[{type:'orc_grunt',count:20,name:'Orcs'}],deploy:false,paused:false,ai:true,morale:true,seed:9});
    try{const b=t.B;for(const id of t.playerGroups())b.groups[id].charge();for(let i=0;i<300;i++)t.updateBattle(1/30);return b.units.map(u=>u.hp+':'+u.x.toFixed(3)+':'+u.y.toFixed(3)+':'+(u.sx||0).toFixed(3)).join('|')}finally{if(L.active)L.exit()}};
  const a=run(),c=run();ok(a===c&&a.length>0,'a battle replays the same: 300 frames of 20 against 20, twice, every man where he was the first time')}
 // ---- the march
 // (your army, 20 foot and your hero, on open ground; marched east, then wheeled, then back west on itself)
 const P=t.P;
 const begin=()=>{Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:99});t.WORLD_BATTLE.on=true;t.GUIDE.on=false;P.troops={hum_foot:20};P.comps={};P.bsta=100;const h=Kit.goHome('Ashford');Kit.goTo(h.x+240,h.y+200);
  const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE);for(let y=ty-30;y<=ty+30;y++)for(let x=tx-40;x<=tx+40;x++)if(t.WM.has(x,y)){const i=y*t.MW+x;t.WM.kind[i]=t.T_OPEN;t.WM.edge[i]=0;t.WM.elev[i]=64}
  t.setByRoad(false);t.TravelStyle.forget(P);t.MARCH_ARMIES.delete(P);const A=t.MarchArmy.of(P);for(let i=0;i<120;i++)A.step(1/30);return A};
 const walked=A=>A.units.reduce((s,u)=>s+(u.walk||0),0);
 // (marched to x, y for n frames: its walking in all)
 const go=(A,dx,dy,n)=>{const w=walked(A);P.tx=P.x+dx;P.ty=P.y+dy;for(let i=0;i<n;i++){t.marchStep(1/30);A.step(1/30)}return walked(A)-w};
 const col=t.TravelStyle.column;
 try{
  const wheel=()=>{const A=begin(),a=go(A,200,0,150),b=go(A,0,200,150),c=go(A,-400,0,300);return{a,b,c,all:a+b+c}};
  const on=wheel(),off=(()=>{S.on=false;try{return wheel()}finally{S.on=true}})();
  info('your army wheeling and turning back on itself: walked '+on.all.toFixed(0)+' px in all (east '+on.a.toFixed(0)+', wheeled '+on.b.toFixed(0)+', back '+on.c.toFixed(0)+'); each man to his index\'s place '+off.all.toFixed(0)+' (east '+off.a.toFixed(0)+', wheeled '+off.b.toFixed(0)+', back '+off.c.toFixed(0)+')');
  ok(on.b+on.c<off.b+off.c,'an army wheeling and turning back on itself: its men fill the nearest places, '+(on.b+on.c).toFixed(0)+' px walked through the wheel and the turn for '+(off.b+off.c).toFixed(0)+' each to his own');
  // (a column forced on and off while it marches east, forming, then breaking: at each, the px from each man to the place he is
  // given in all, against each to his index's place (and forming, as before: by the order they stand along the way, fileIn))
  // (less the shift all of them share: the walk of the share alone, not of the column's places laid back along the way)
  const plan=(A,ix)=>{const w=new Map(A.targets().map(p=>[p.row+':'+p.index,p])),d=A.units.map((u,i)=>{const p=w.get(u.row+':'+(ix?ix[i]:u.index));return p?[u.x-p.x,u.y-p.y]:null}).filter(Boolean),
    mx=d.reduce((s,q)=>s+q[0],0)/d.length,my=d.reduce((s,q)=>s+q[1],0)/d.length;return d.reduce((s,q)=>s+Math.hypot(q[0]-mx,q[1]-my),0)};
  const swap=(A,on)=>{const ix=A.units.map(u=>u.index);on();t.marchStep(1/30);A.step(1/30);const now=plan(A),idx=plan(A,ix),own=A.units.map(u=>u.index);A.fileIn();const file=plan(A);A.units.forEach((u,i)=>{u.index=own[i]});A.goalGround=null;return{now,idx,file}};
  {let on=false;t.TravelStyle.column=o=>o===P?on:col.call(t.TravelStyle,o);try{const A=begin();go(A,300,0,90);const f=swap(A,()=>{on=true});go(A,300,0,240);const formed=!!A.col;const k=swap(A,()=>{on=false});go(A,300,0,240);
    info('a column formed on the march: '+f.now.toFixed(0)+' px from its men to their places in all; each to his index\'s '+f.idx.toFixed(0)+', as before (fileIn) '+f.file.toFixed(0)+'; broken: '+k.now.toFixed(0)+', each to his index\'s '+k.idx.toFixed(0));
    ok(formed&&!A.col&&f.now<f.idx&&f.now<=f.file+1e-6&&k.now<k.idx,'its column forming and breaking: its men given the nearest places, '+f.now.toFixed(0)+' and '+k.now.toFixed(0)+' px to walk in all, for '+f.idx.toFixed(0)+' and '+k.idx.toFixed(0)+' each to his index\'s')}
   finally{t.TravelStyle.column=col}}
  {const A=t.MARCH_ARMIES.get(P),M=t.MARCH_FILL,bufs=[M.men,M.ix,M.of,M.cur,F.mx];go(A,0,-300,200);ok(M.men===bufs[0]&&M.ix===bufs[1]&&M.of===bufs[2]&&M.cur===bufs[3]&&F.mx===bufs[4],'the march\'s buffers kept from share to share')}
  // (the march replays the same)
  {const run=()=>{const A=begin();go(A,200,0,100);go(A,-300,50,200);return A.units.map(u=>u.index+':'+u.x.toFixed(3)+':'+u.y.toFixed(3)).join('|')};ok(run()===run(),'the march replays the same: each man\'s place and spot')}
  // (a character keeps his own: your hero's row is his alone)
  // (a new share never moves the army's point: the same places, its men only traded among them (march.js refill, fillOff); on the
  // march its point then goes on at its pace, no leap, as its men walk to their new places)
  {const A=begin();go(A,200,0,60);const T=A.targets(),at=new Map(T.map(p=>[p.row+':'+p.index,p])),men=A.units.filter(u=>u.row!=='hero').sort((a,b)=>a.id-b.id);
   const sw=(a,b)=>{const k=a.index;a.index=b.index;b.index=k};sw(men[0],men[men.length-1]);sw(men[1],men[men.length-2]);const m0=A.middle(at),changed=A.refill(T,true),m1=A.middle(at);
   let leap=0,px=P.x,py=P.y;for(let i=0;i<90;i++){t.marchStep(1/30);A.step(1/30);leap=Math.max(leap,Math.hypot(P.x-px,P.y-py));px=P.x;py=P.y}const pace=t.moveStep(t.marchPace(P),1/30,true);
   ok(changed&&Math.hypot(m1.x-m0.x,m1.y-m0.y)<1e-6&&leap<=pace*t.MARCH_MOVE.road*1.5,'a new share never moves the army\'s point ('+Math.hypot(m1.x-m0.x,m1.y-m0.y).toExponential(1)+' px), and it goes on at its pace after (at most '+leap.toFixed(2)+' px a moment, its step '+pace.toFixed(2)+')')}
  {const A=t.MARCH_ARMIES.get(P),h=A.units.find(u=>u.row==='hero');ok(h&&h.index===0&&A.units.filter(u=>u.row==='hero').length===1,'your hero keeps his own place in the march')}
 }catch(e){ok(false,'march: '+e.message+' '+e.stack)}finally{t.TravelStyle.column=col;S.on=true}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
