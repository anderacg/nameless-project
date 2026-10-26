'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;t.prefSet('bpause',false);
 const home=Kit.goHome('Ashford');Kit.goTo(home.x+240,home.y+200);P.troops={hum_spear:8,hum_knight:5};
 // Open fixture ground makes saved slot positions exact rather than obstacle-adjusted.
 const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE);for(let y=ty-12;y<=ty+12;y++)for(let x=tx-12;x<=tx+12;x++){const i=y*t.MW+x;t.tiles[i]=t.T_OPEN;t.WM.edge[i]=0}
 const roster=t.partyRoster(P),foot=roster.groups.find(g=>g.type==='hum_spear'),cav=roster.groups.find(g=>g.type==='hum_knight');foot.files=1;cav.form='wedge';P.army.march={[foot.id]:{x:12,y:9,face:.5},[cav.id]:{x:-10,y:-12,face:-.4}};
 const enemy=t.asParty({kind:'bandits',troops:Array(6).fill('militia'),x:P.x+70,y:P.y,cool:0});t.bandits.push(enemy);
 const before=new Set();for(const owner of [P,enemy])for(const u of t.MarchArmy.of(owner).units){before.add(u);if(!u.pivot){u.x+=7;u.y-=5}}
 G.enc={kind:'party',ref:enemy,list:enemy.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});t.frame();let b=t.B;
 const near=(a,z)=>Math.abs(a-z)<.001,start=document.getElementById('bStart'),r=start.getBoundingClientRect(),screen=document.getElementById('screen').getBoundingClientRect();
 ok(b.ready&&b.paused&&!b.deploy&&b.t===0,'world battle opens formed up and paused even with the old pause preference off');
 ok(!start.hidden&&r.height>=44&&near(r.left+r.width/2,screen.left+screen.width/2)&&r.top<screen.top+35,'Start Battle is accessible at the top center');
 ok(b.groups['p_'+foot.id].files===1&&b.groups['p_'+cav.id].form==='wedge','saved Column and Wedge formations are retained');
 for(const owner of [P,enemy]){const groups=Object.values(b.groups).filter(g=>g.player=== (owner===P)),rows=t.marchRows(owner),anchor=b.world.starts[owner===P?0:1],face=anchor.facing;
  ok(groups.every(g=>{const row=rows.find(z=>z.id===(g.sourceGroupId||g.id));if(!row)return true;const p=b.world.field({x:anchor.x+row.x*Math.cos(face)-row.y*Math.sin(face),y:anchor.y+row.x*Math.sin(face)+row.y*Math.cos(face)});return near(g.ax,p.x)&&near(g.ay,p.y)&&near(g.face,face+row.face)}),(owner===P?'player':'enemy')+' group centers and facing match the saved march layout');
 }
 ok(b.units.filter(u=>u.hp>0&&!u.left).every(u=>near(u.x,b.groups[u.grp].ax+u.sx)&&near(u.y,b.groups[u.grp].ay+u.sy)),'all initial soldiers occupy their formation slots before Start');
 ok(b.units.filter(u=>u.marchUnit).every(u=>before.has(u.marchUnit)),'formation assembly preserves the original marcher identities and appearance');
 const positions=b.units.map(u=>[u.x,u.y,u.hp]);t.updateBattle(.5);ok(b.t===0&&JSON.stringify(positions)===JSON.stringify(b.units.map(u=>[u.x,u.y,u.hp])),'preparation advances neither combat nor unit positions');
 t.COMMAND_POWERS.on=true;ok(t.abilityWhyNot(b.groups['p_'+foot.id],'brace')==='Start the battle first'&&t.powerWhyNot(0,'stand')==='Start the battle first','abilities cannot consume cooldowns before combat starts');
 start.click();ok(!b.ready&&!b.paused&&start.hidden,'Start Battle releases the preparation pause and hides itself');t.battlePause(true);ok(b.paused&&start.hidden,'later tactical pauses do not show Start Battle again');
 // The same screen-space indicator is tested under real world and field camera transforms.
 const ctx=t.ctx,arc=ctx.arc,stroke=ctx.stroke;let circles=[],strokes=[];
 ctx.arc=function(...args){circles.push(args);return arc.apply(this,args)};ctx.stroke=function(...args){strokes.push({m:this.getTransform(),w:this.lineWidth});return stroke.apply(this,args)};
 try{
  for(const world of [true,false]){if(!world){t.WORLD_BATTLE.on=false;t.BDEPLOY.on=true;Kit.world();G.enc=null;t.startBattle({enemies:['militia'],deploy:true});b=t.B;t.frame();ok(b.ready&&b.deploy&&b.paused&&!start.hidden,'separate field deployment also waits for Start Battle');start.click();ok(!b.ready&&!b.deploy&&!b.paused,'Start Battle begins field deployment')}
   for(const z of world?[1/b.world.scale]:[t.camFit(),1,2]){
    b.cam.z=z;const box=t.cv.getBoundingClientRect(),cx=box.left+box.width*.4,cy=box.top+box.height*.5;
    t.TOUCH.lp={mode:'battle',B:b,cx,cy,q:{x:b.hero.x,y:b.hero.y},t0:0};circles=[];strokes=[];ctx.save();ctx.scale(7*z,7*z);ctx.translate(-50,-30);const original=ctx.getTransform();
    const drawn=t.drawTouchHold(t.TOUCH.hold/2),a=circles.at(-1),s=strokes.at(-1),after=ctx.getTransform();ctx.restore();
    ok(drawn&&a[2]===t.TOUCH.ring&&near(a[4]-a[3],Math.PI)&&near(a[0],cx-box.left)&&near(a[1],cy-box.top)&&near(s.m.a,t.cv.width/box.width)&&near(s.m.d,t.cv.height/box.height)&&s.w===3&&near(after.a,original.a)&&near(after.e,original.e),(world?'world':'field')+' hold ring stays round, at the finger and 34 CSS pixels at zoom '+z);
   }
  }
  t.TOUCH.lp.off=true;ok(!t.drawTouchHold(400),'cancelled holds leave no indicator');t.TOUCH.lp.off=false;G.modal=true;ok(!t.drawTouchHold(400),'menus suppress battle hold feedback');G.modal=false;
 }finally{ctx.arc=arc;ctx.stroke=stroke;t.TOUCH.lp=null}
 ok(!ERR.length,'battle preparation and hold feedback produce no runtime errors');
});
