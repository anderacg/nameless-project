'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;
 const h=Kit.goHome('Ashford');Kit.goTo(h.x+160,h.y+120);P.troops={hum_bow:2};const e=t.asParty({kind:'bandits',troops:['militia'],x:P.x+70,y:P.y,cool:0});G.enc={kind:'party',ref:e,list:e.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});
 const b=t.B,c=t.ctx,k=t.WORLD_BATTLE.sprite,world=b.world;
 const spy=fn=>{const methods=['arc','ellipse','fillRect','stroke','drawImage'],old=methods.map(n=>c[n]),calls=[];c.save();c.setTransform(1,0,0,1,0,0);
  try{methods.forEach((n,i)=>c[n]=function(...args){const m=this.getTransform();calls.push({n,args,k:Math.hypot(m.a,m.b),m,style:this.fillStyle,width:this.lineWidth});return old[i].apply(this,args)});fn();return calls}finally{methods.forEach((n,i)=>c[n]=old[i]);c.restore()}
 };
 for(const kind of ['dust','frost','spark','ember','blood','ghost','glow']){const p={k:kind,x:300,y:250,r:8,z:4,vx:12,vy:-4,life:.5,max:1,col:kind==='dust'?'170,152,112':'#ffc080',sp:t.actorSprite(b.hero,0,true),face:1},before=JSON.stringify(p,(key,v)=>key==='sp'?null:v);b.vfx=[p];
  const calls=spy(()=>kind==='dust'||kind==='frost'?t.vfxGround():t.vfxAir()),paint=calls.find(q=>['arc','fillRect','drawImage','stroke'].includes(q.n));
  ok(paint&&Math.abs(paint.k-k)<.001&&(kind==='ghost'?Math.hypot(paint.m.e-p.x,paint.m.f-p.y)<.001:Math.abs(paint.m.a*p.x+paint.m.c*p.y+paint.m.e-p.x)<.001&&Math.abs(paint.m.b*p.x+paint.m.d*p.y+paint.m.f-p.y)<.001),kind+' scales around its own origin');
  ok(JSON.stringify(p,(key,v)=>key==='sp'?null:v)===before,kind+' drawing does not alter particle state');
 }
 b.vfx=[{k:'shock',x:300,y:250,r:40,area:true,life:.5,max:1,col:'255,200,100'}];let calls=spy(()=>t.vfxGround()),ring=calls.find(q=>q.n==='ellipse'),stroke=calls.find(q=>q.n==='stroke');
 ok(ring&&ring.k===1&&Math.abs(ring.args[2]-30)<.001&&stroke.width===3*k,'area shockwave preserves its radius while scaling stroke weight');
 const slash={kind:'arc',x:300,y:250,r:45,a:0,arc:1,dir:1,w:3,life:.1,max:.2},before=JSON.stringify(slash);calls=spy(()=>t.drawSlash(slash));const arc=calls.find(q=>q.n==='arc');
 ok(arc&&Math.abs(arc.k*arc.args[2]-45)<.001&&JSON.stringify(slash)===before,'slash detail scales while preserving combat reach and source state');
 b.vfx=[];b.arrows=[{magic:true,x:b.hero.x,y:b.hero.y,col:'#aabbff'}];b.parts=[{x:b.hero.x,y:b.hero.y,stuck:1,life:3}];
 calls=spy(()=>t.drawBattle());const bolt=calls.find(q=>q.n==='arc'&&q.args[0]===b.hero.x&&q.args[1]===b.hero.y&&q.args[2]===2.5),stuck=calls.find(q=>q.n==='fillRect'&&q.style==='#c9b48a'&&q.args[2]===1&&q.args[3]===2);
 ok(bolt&&Math.abs(bolt.k-b.cam.z*k)<.001,'magic bolt core and glow use world sprite scale');
 ok(stuck&&Math.abs(stuck.k-b.cam.z*k)<.001,'ground-stuck arrows use the same scale as flying arrows');
 b.world=null;b.vfx=[{k:'ember',x:300,y:250,life:.5,max:1,col:'#ffc080'}];calls=spy(()=>t.vfxAir());ok(calls.some(q=>q.n==='fillRect'&&q.k===1),'separate tactical battle effects retain their original scale');b.world=world;
});
