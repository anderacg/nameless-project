'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;P.troops={};P.comps={};
 // (on plain open ground: your hero marches off the army's middle now, 2026-10-31, and on a hill (sight ×1.3) or in the desert
 // (×1.2) he would see past the whole field, map.js visMulAt)
 const home=Kit.goHome('Ashford'),plain=(x,y)=>{for(let j=-3;j<=3;j++)for(let i=-3;i<=3;i++){const px=x+i*16,py=y+j*16;if(t.visMulAt(px,py)!==1||!t.passable(t.terrAt(px,py)))return false}return true};
 let spot=null;for(let r=0;r<40&&!spot;r++)for(let i=-r;i<=r&&!spot;i++)for(const [dx,dy] of [[i,-r],[i,r],[-r,i],[r,i]]){const x=home.x+240+dx*16,y=home.y+200+dy*16;if(plain(x,y)){spot=[x,y];break}}
 Kit.goTo(spot[0],spot[1]);
 const enemy=t.asParty({kind:'bandits',troops:['militia','militia'],x:P.x+30,y:P.y}),enc={kind:'party',ref:enemy,list:enemy.troops.slice(),allies:[],foes:[],mine:true};
 const small=new t.WorldBattleArea(enc);ok(small.r>t.vis()&&small.r>t.marchOuter(P)+t.marchOuter(enemy),'battle radius is larger than march circles and uses sight as its baseline');
 enemy.troops=Array(70).fill('militia');const large=new t.WorldBattleArea(enc);ok(large.r>small.r&&large.fighters>small.fighters,'combined fighter count increases battlefield radius');enemy.troops=['militia','militia'];
 const scouting=P.sk.scout.lv;P.sk.scout.lv=10*PROF.per;const sight=new t.WorldBattleArea(enc);ok(sight.r>small.r,'greater actual Scouting sight produces a larger battlefield');P.sk.scout.lv=scouting;
 ok(Math.hypot(P.x-small.x,P.y-small.y)+t.marchOuter(P)<=small.r&&Math.hypot(enemy.x-small.x,enemy.y-small.y)+t.marchOuter(enemy)<=small.r,'sight-based sizing still encloses both starting armies');
 G.enc=enc;t.startBattle({enemies:enc.list,tournament:false});const b=t.B,a=b.world,initial={x:a.x,y:a.y,r:a.r},anchor={x:P.x,y:P.y},eye=a.world(b.hero),ex=a.x-eye.x,ey=a.y-eye.y,ed=Math.hypot(ex,ey),far=ed>1?{x:a.x+ex/ed*(a.r-5),y:a.y+ey/ed*(a.r-5)}:{x:a.x+a.r-5,y:a.y};// (inside the edge, across the field from your hero)
 t.fogReset();a.view=null;t.reveal();ok(t.inSight(eye.x,eye.y)&&t.seenAt(eye.x,eye.y),'normal hero sight reveals nearby terrain');
 ok(a.inside(a.field(far))&&!t.inSight(far.x,far.y)&&!t.seenAt(far.x,far.y),'unexplored terrain inside the larger boundary stays hidden');
 const memory=t.seenSave();a.r+=100;t.reveal();ok(t.seenSave()===memory,'growing the circle alone adds no exploration or minimap knowledge');a.r=initial.r;
 const foe=b.units.find(u=>u.team===1);Object.assign(foe,a.field(far));a.view=null;t.sightStep(true);ok(!t.seenBy(0,foe)&&!t.visibleFoes(0).includes(foe),'enemy actor and AI target stay hidden beyond friendly sight');
 Object.assign(b.hero,a.field(far));b.t+=.01;a.view=null;t.reveal();t.sightStep(true);ok(t.inSight(far.x,far.y)&&t.seenAt(far.x,far.y)&&t.seenBy(0,foe),'advancing a friendly unit reveals only the land and enemies it can actually see');
 ok(Math.abs(t.worldEye().x-far.x)<.001&&P.x===anchor.x&&P.y===anchor.y,'campaign fog follows the combat hero without moving the army anchor');
 ok(a.x===initial.x&&a.y===initial.y&&a.r===initial.r,'moving combatants does not move or resize the fixed battlefield');
 Object.assign(b.hero,a.field(eye));b.t+=.01;a.view=null;t.reveal();ok(!t.inSight(far.x,far.y)&&t.seenAt(far.x,far.y),'land becomes remembered after leaving sight rather than retaining live vision');
 // (every living man of yours sees for you, by his kind: fog.js Sight; the owner, 2026-11-01)
 const ally={...b.hero,id:999,hero:false,comp:false,leader:null,s:t.ST.hum_foot,...a.field({x:eye.x+50,y:eye.y})};b.units.push(ally);b.t+=.01;
 {const r=t.vis()*t.fogRange(ally)/t.FOG.char,q={x:eye.x+50+r*.9,y:eye.y},q2={x:eye.x+50+r*1.1,y:eye.y};
  ok(r<t.vis()&&Math.hypot(q.x-eye.x,q.y-eye.y)>t.vis()&&t.inSight(q.x,q.y)&&!t.inSight(q2.x,q2.y),'a man of yours sees for you, as far as his kind: a man on foot '+Math.round(r)+' px to your hero\'s '+Math.round(t.vis()))}
 b.units.pop();b.t+=.01;
 const ctx=t.ctx,cam={x:eye.x-150,y:eye.y-150};
 ctx.save();try{ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,t.cv.width,t.cv.height);ctx.translate(a.x0-cam.x,a.y0-cam.y);ctx.scale(1/a.scale,1/a.scale);a.clipSight();ctx.fillStyle='#ff0000';ctx.fillRect(0,0,t.BW,t.BH);ok(ctx.getImageData(150,150,1,1).data[3]===255&&ctx.getImageData(20,150,1,1).data[3]===0,'combat effects and fallen sprites are clipped out of unseen terrain too')}finally{ctx.restore()}
 const saved=t.seenSave();window.eval('B=null');t.fogReset();t.seenLoad(saved);ok(t.seenAt(far.x,far.y),'only terrain genuinely explored during combat persists in the existing fog save');
});
