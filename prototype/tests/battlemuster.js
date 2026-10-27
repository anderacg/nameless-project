'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;P.camp=null;P.comps={};
 const h=Kit.goHome('Ashford');Kit.goTo(h.x+350,h.y+300);P.troops={hum_spear:8,hum_knight:4};
 const cx=Math.floor(P.x/t.TILE),cy=Math.floor(P.y/t.TILE);for(let y=cy-35;y<=cy+35;y++)for(let x=cx-35;x<=cx+35;x++)if(x>0&&y>0&&x<t.MW&&y<t.MH){const i=y*t.MW+x;t.tiles[i]=t.T_OPEN;t.WM.edge[i]=0}
 const roster=t.partyRoster(P),foot=roster.groups.find(g=>g.type==='hum_spear'),cav=roster.groups.find(g=>g.type==='hum_knight');foot.files=1;cav.form='wedge';P.army.march={[foot.id]:{x:12,y:9,face:.3},[cav.id]:{x:-8,y:-10,face:-.2}};
 const enemy=t.asParty({kind:'bandits',troops:Array(6).fill('militia'),x:P.x+65,y:P.y,cool:0});t.bandits.push(enemy);
 const begin=(extra={})=>{Kit.world();G.enc={kind:'party',ref:enemy,list:enemy.troops.slice(),allies:[],foes:[],mine:true,...extra};t.startBattle({enemies:enemy.troops.slice(),tournament:false});G.cam.x=P.x-t.VW/2;G.cam.y=P.y-t.VH/2;t.B.world.syncCamera();t.frame();return t.B};
 const originals=new Map();for(const owner of [P,enemy])for(const m of t.MarchArmy.of(owner).units){if(!m.pivot){m.x-=5;m.y+=3}originals.set(m,{x:m.x,y:m.y})}
 let b=begin(),m=b.muster;const start=document.getElementById('bStart'),near=(a,z)=>Math.abs(a-z)<.001;
 ok(m?.active&&!b.ready&&!b.paused&&b.t===0,'normal battle automatically enters a moving preparation phase');
 ok(b.units.filter(u=>u.marchUnit).every(u=>{const p=b.world.world(u),o=originals.get(u.marchUnit);return o&&near(p.x,o.x)&&near(p.y,o.y)}),'battle trigger preserves every actual marcher position without snapping');
 ok(!start.hidden&&start.disabled&&start.textContent.includes('Forming'),'Start Battle shows preparation status and cannot start early');
 t.beginFight();start.click();ok(m.active&&!b.ready&&b.t===0,'direct calls and disabled Start cannot bypass preparation');
 const faces=m.armies.map(a=>a.anchor.facing);ok(m.armies.length===2&&m.armies.every(a=>Math.hypot(a.anchor.x-a.owner.x,a.anchor.y-a.owner.y)<=t.BATTLE_MUSTER.retreat+.001)&&near(Math.abs(faces[0]-faces[1]),Math.PI),'armies form near their meeting positions, with a short retreat and opposing facing');
 const radius=b.world.radius;b.world.radius*=2;const wide=new t.BattleMuster(b);b.world.radius=radius;ok(wide.armies.every((a,i)=>near(a.anchor.x,m.armies[i].anchor.x)&&near(a.anchor.y,m.armies[i].anchor.y)),'a larger battle circle does not send armies farther away');
 const group=b.groups['p_'+foot.id],snapshot=b.units.map(u=>({u,x:u.x,y:u.y,hp:u.hp,sta:u.sta,cd:u.cd})),clock=G.clock,day=G.day;
 let issued=false;t.playerOrder([group.id],()=>{issued=true});t.selectGroup(group.id);t.setForm('loose');t.toggleFlag('firm');t.setOrder('withdraw');t.groupAbility('brace');ok(!issued&&group.form==='line'&&group.order==='hold','manual orders cannot interrupt the automatic forming movement');
 t.frame();const iconStart={...b.iconPos[group.id]};
 t.updateBattle(.05);ok(snapshot.some(o=>Math.hypot(o.u.x-o.x,o.u.y-o.y)>.01)&&snapshot.every(o=>Math.hypot(o.u.x-o.x,o.u.y-o.y)<=Math.max(t.BATTLE_MUSTER.minimum,o.u.s.spd*t.WORLD_BATTLE.sprite)*.05+.001),'preparation visibly moves soldiers within their walking budget');
 t.frame();const soldiers=b.units.filter(u=>u.grp===group.id&&u.hp>0),icon=b.iconPos[group.id],middle=soldiers.reduce((n,u)=>n+u.x,0)/soldiers.length,top=Math.min(...soldiers.map(u=>u.y));
 ok(b.t===0&&near(icon.x,middle)&&near(icon.y,top)&&Math.hypot(icon.x-iconStart.x,icon.y-iconStart.y)>.01,'group banner follows actual moving soldiers while the combat clock stays frozen');
 const hit=b.icons.find(i=>i.g===group.id);ok(hit&&near(hit.cx,middle)&&near(hit.cy,soldiers.reduce((n,u)=>n+u.y,0)/soldiers.length),'banner click target moves with the group during preparation');
 const pause=b.units.map(u=>[u.x,u.y]);t.battlePause(true);t.updateBattle(.1);ok(JSON.stringify(pause)===JSON.stringify(b.units.map(u=>[u.x,u.y])),'tactical pause stops preparation movement');t.battlePause(false);ok(m.active&&!b.paused&&!b.ready,'resuming preparation continues forming without entering combat');
 let legal=true,steps=0;for(;steps<1600&&m.active;steps++){const was=b.units.map(u=>[u,u.x,u.y]);t.updateBattle(.1);for(const [u,x,y] of was)if(u.hp>0&&!u.left)legal=legal&&b.terrain.routes.stepOk(x,y,u.x,u.y)}
 ok(!m.active&&b.ready&&b.paused&&m.done===m.entries.length,'both armies finish moving and automatically pause ready for battle');
 ok(legal&&b.units.filter(u=>u.hp>0&&!u.left).every(u=>b.world.inside(u,5)),'all preparation steps stay legal and inside the fixed circle');
 ok(b.t===0&&day===G.day&&clock===G.clock&&snapshot.every(o=>o.u.hp===o.hp&&o.u.sta===o.sta&&o.u.cd===o.cd)&&!b.arrows.length,'preparation runs no combat, campaign time, cooldowns or fatigue');
 ok(m.entries.every(e=>near(e.u.x,e.goal.x)&&near(e.u.y,e.goal.y)&&near(e.u.dir,e.g.face))&&group.files===1&&b.groups['p_'+cav.id].form==='wedge','soldiers settle in their saved formations and facing at the destination');
 const rect=start.getBoundingClientRect(),screen=document.getElementById('screen').getBoundingClientRect();ok(!start.disabled&&!start.hidden&&rect.height>=44&&near(rect.left+rect.width/2,screen.left+screen.width/2)&&near(rect.top+rect.height/2,screen.top+screen.height/2),'the enabled Start Battle button is accessible at the screen center');
 start.click();const time=b.t;t.updateBattle(.05);ok(!b.ready&&!b.paused&&start.hidden&&b.t>time,'Start Battle actually releases combat and advances its clock');t.battlePause(true);ok(start.hidden,'later tactical pauses do not restart preparation');
 // A later force uses the existing arrival path and never receives a new preparation phase.
 const late=t.asParty({kind:'bandits',troops:['militia','militia'],x:b.world.x,y:b.world.y+20,cool:0}),army=t.MarchArmy.of(late),latePositions=new Map(army.units.map(u=>[u,{x:u.x,y:u.y}]));t.bandits.push(late);b.world.join(late,1);
 ok(b.muster===m&&!m.active&&!b.ready&&b.units.filter(u=>u.sourceArmy?.src===late&&u.marchUnit).every(u=>{const p=b.world.world(u),q=latePositions.get(u.marchUnit);return q&&near(p.x,q.x)&&near(p.y,q.y)}),'late reinforcements arrive at their actual positions without repeating preparation');
 for(const extra of [{btype:{kind:'ambush',hid:1}},{surprise:true}]){b=begin(extra);ok(!b.muster&&!b.ready&&!b.paused&&start.hidden,'ambush or surprise attack enters combat directly');ok(b.units.filter(u=>u.marchUnit).every(u=>{const p=b.world.world(u);return near(p.x,u.marchUnit.x)&&near(p.y,u.marchUnit.y)}),'surprise entry preserves current positions');const time=b.t;t.updateBattle(.01);ok(b.t>time,'surprise combat runs without needing Start')}
 // Force a water barrier between armies and their ideal slots: preparation must find reachable fallback slots.
 b=begin();m=b.muster;const terrain=b.terrain,grid=terrain.route.foot,wall=Math.floor(grid.C/2);for(const g of Object.values(terrain.route)){for(let y=0;y<g.R;y++)g.cost[y*g.C+wall]=0;g.v++}
 let crossed=false;for(let i=0;i<1800&&m.active;i++){const before=m.entries.map(e=>[e.u,Math.floor(e.u.x/grid.cs)]);t.updateBattle(.1);for(const [u,x] of before)if(x!==wall&&Math.floor(u.x/grid.cs)!==x&&(x<wall)!==(Math.floor(u.x/grid.cs)<wall))crossed=true}
 ok(!m.active&&b.ready&&!crossed,'an unreachable edge uses reachable positions and completes without teleporting across the barrier');
 const shift=P.x+8-enemy.x;enemy.x+=shift;for(const u of t.MarchArmy.of(enemy).units)u.x+=shift;b=begin();m=b.muster;ok(m.armies.some(a=>Math.hypot(a.anchor.x-a.owner.x,a.anchor.y-a.owner.y)>1)&&m.armies.every(a=>Math.hypot(a.anchor.x-a.owner.x,a.anchor.y-a.owner.y)<=t.BATTLE_MUSTER.retreat+.001),'armies meeting at close range step back for formation space without a long retreat');
 ok(!ERR.length,'animated preparation produces no runtime errors');
});
