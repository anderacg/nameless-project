'use strict';
window.ARENA=true;// (the battle screen's own rules, on its own field: tests/harness.js)
// Calling a drag off in battle (input.js dragCancel): a right-drag's line ghost goes with a left-click or Esc (Esc then opens no
// menu), a box with Esc, a finger's held line with a second finger; nothing is sent and the selection stays. A right-drag let go
// as ever still lays the line. And deploying, a group's banner (moraleicons.js iconLayout) stands over it as soon as it is placed.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),t=T,G=t.G,P=t.P,random0=Math.random,measure0=t.measureField;
  window.requestAnimationFrame=()=>0;try{localStorage.clear()}catch(e){}
  const cv=document.querySelector('canvas'),TO=t.TOUCH,later=()=>performance.now()+TO.hold+50;
  const fromF=(x,y)=>{const p=t.fromField({x,y}),r=cv.getBoundingClientRect();return{clientX:r.left+p.x*r.width/cv.width,clientY:r.top+p.y*r.height/cv.height}};
  const fire=(type,c,id=1,kind='touch',button=type==='pointermove'?-1:0,extra={})=>cv.dispatchEvent(new PointerEvent(type,{...c,pointerId:id,isPrimary:id===1,pointerType:kind,button,bubbles:true,cancelable:true,...extra}));
  const up=(c,button)=>window.dispatchEvent(new PointerEvent('pointerup',{...c,pointerType:'mouse',button,bubbles:true}));
  const esc=()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true}));
  const calls=[],orig={},methods=['moveTo','attack','queueTo'];
  const fresh=deploy=>{P.troops={hum_foot:4,hum_bow:3,hum_mage:2,hum_knight:2};P.comps={};P.hp=40;P.morale=60;
    G.mode='world';G.modal=false;t.hidePanel();G.loot=null;G.enc={kind:'party',ref:{x:P.x+8,y:P.y,cool:0},list:['militia','archer','horse'],allies:[],foes:[]};
    t.BDEPLOY.on=!!deploy;t.BAUTO.on=false;t.startBattle({enemies:G.enc.list,tournament:false,deploy:true});t.BDEPLOY.on=false;
    const B=t.B,anchors={hero:[100,300],inf:[200,180],arc:[200,380],mag:[140,490],cav:[140,90]};
    for(const g of t.playerGroups()){const gr=B.groups[g],[x,y]=anchors[gr.role];gr.placeAt(x,y);t.grpUnits(g).forEach(u=>{u.x=x+(u.sx||0);u.y=y+(u.sy||0)})}
    B.units.filter(u=>u.team===1).forEach((u,i)=>{u.x=720;u.y=220+i*80});t.camReset();t.frame();if(!deploy)B.paused=true;B.sel=testGroup('inf');t.setOrderUI();G.msgs=[];calls.length=0;return B};
  try{
    Math.random=t.seeded(4300);t.act('begin','soldier');G.quietEvents=true;t.W.lords=[];t.GUIDE.on=false;
    window.__dcMeasure=measure0;(0,eval)('measureField=()=>({top:40,bot:560})');
    for(const m of methods){orig[m]=t.BattleControl.prototype[m];t.BattleControl.prototype[m]=function(...a){calls.push([m,this.id]);return orig[m].apply(this,a)}}
    let B=fresh();const inf=()=>B.groups[testGroup('inf')],a=fromF(400,150),b=fromF(400,400);
    const kept=(ax0,ay0)=>!calls.length&&inf().ax===ax0&&inf().ay===ay0&&B.sel===testGroup('inf');
    // a right-drag, then the left button: as a move with it held (how a browser sends a second button), or a press
    for(const how of ['move','press']){B=fresh();const ax0=inf().ax,ay0=inf().ay;fire('pointerdown',a,1,'mouse',2,{buttons:2});fire('pointermove',b,1,'mouse',-1,{buttons:2});
      let drew=true;try{t.frame()}catch(e){drew=false}ok(B.rdrag&&drew,'right-dragging draws the line ghost ('+how+')');
      if(how==='move')fire('pointermove',b,1,'mouse',0,{buttons:3});else fire('pointerdown',b,1,'mouse',0,{buttons:3});
      ok(!B.rdrag&&!B.box,'the left button ('+how+') calls the right-drag off: no ghost, no box');
      up(b,0);fire('pointermove',fromF(420,300),1,'mouse',-1,{buttons:2});up(fromF(420,300),2);t.frame();
      ok(kept(ax0,ay0)&&!B.rdrag&&!B.box,'and letting go of both orders nothing, the selection kept ('+how+')')}
    // a right-drag, then Esc: called off, and no menu
    B=fresh();{const ax0=inf().ax,ay0=inf().ay;fire('pointerdown',a,1,'mouse',2,{buttons:2});fire('pointermove',b,1,'mouse',-1,{buttons:2});esc();
      ok(!B.rdrag&&G.mode==='battle'&&document.getElementById('ov').hidden,'Esc mid right-drag calls it off and opens no menu ('+G.mode+')');up(b,2);
      ok(kept(ax0,ay0),'and letting go orders nothing, the selection kept');esc();ok(G.mode==='esc','Esc with no drag opens the menu as ever');t.act('esc-resume');ok(G.mode==='battle','(resumed)')}
    // a box, then Esc: gone, the selection as it was
    B=fresh();B.sel=testGroup('inf');fire('pointerdown',fromF(150,140),1,'mouse',0,{buttons:1});fire('pointermove',fromF(250,410),1,'mouse',-1,{buttons:1});ok(B.box,'left-drag boxes');
    esc();up(fromF(250,410),0);ok(!B.box&&B.sel===testGroup('inf')&&G.mode==='battle'&&!calls.length,'Esc calls the box off: the selection as it was, no menu');
    // a finger held and dragged into a line, then a second finger: called off (and the two then pinch)
    B=fresh();{const ax0=inf().ax,ay0=inf().ay;fire('pointerdown',a,1);t.touchTick(later());fire('pointermove',fromF(400,300),1);ok(B.rdrag&&TO.lp&&TO.lp.armed,'a held finger drags the line ghost');
      fire('pointerdown',fromF(600,300),2);ok(!B.rdrag&&!TO.lp&&TO.pinch,'a second finger calls it off (and the two pinch)');fire('pointermove',fromF(620,300),2);
      fire('pointerup',fromF(400,300),1);fire('pointerup',fromF(620,300),2);ok(kept(ax0,ay0)&&!TO.pts.size,'and lifting both orders nothing, the selection kept')}
    // Esc calls a finger's line off too
    B=fresh();fire('pointerdown',a,1);t.touchTick(later());fire('pointermove',b,1);esc();ok(!B.rdrag&&!TO.lp&&G.mode==='battle','Esc calls a held finger\'s line off');fire('pointerup',b,1);ok(!calls.length,'and its lift sends nothing');
    // a right-drag let go as ever: the line
    B=fresh();fire('pointerdown',a,1,'mouse',2,{buttons:2});fire('pointermove',b,1,'mouse',-1,{buttons:2});up(b,2);
    ok(calls.some(c=>c[0]==='moveTo'&&c[1]===testGroup('inf'))&&Math.abs(inf().ax-400)<1&&inf().files>1&&!B.rdrag,'a right-drag let go still lays the line ('+Math.round(inf().ax)+','+Math.round(inf().ay)+', '+inf().files+' files)');
    B.over=true;B.endT=0;t.B=null;
    // deploying: a group's banner stands over it the moment it is placed (the battle's clock stands still), and stays
    B=fresh(true);ok(B.deploy,'a battle opens in deployment');const S=t.UICON.s*t.UICON.k;
    const banner=g=>{const ic=B.icons.find(i=>i.g===g),m=t.grpUnits(g).filter(u=>!u.rout),cx=m.reduce((s,u)=>s+u.x,0)/m.length,top=Math.min(...m.map(u=>u.y)),sp=t.fromField({x:cx,y:top});
      return ic?{dx:ic.x+S/2-sp.x,y:ic.y,want:Math.max(4,sp.y-t.UICON.lift*B.cam.z-ic.h)}:null};
    const over=g=>{const q=banner(g);return !!q&&Math.abs(q.dx)<=1.5&&Math.abs(q.y-q.want)<=1.5},say=g=>{const q=banner(g);return q?'off by '+q.dx.toFixed(1)+','+(q.y-q.want).toFixed(1):'none'};
    const g0=testGroup('inf');ok(over(g0),'its banner over it to start ('+say(g0)+')');
    t.selectGroup(g0);t.rtsOrder(inf().ax+60,inf().ay+40);t.frame();ok(over(g0),'right-click 72 px off: the banner over it the next frame ('+say(g0)+')');
    t.rtsOrder(inf().ax-20,inf().ay+10);t.frame();ok(over(g0),'a short move too ('+say(g0)+')');
    fire('pointerdown',fromF(150,150),1,'mouse',2,{buttons:2});fire('pointermove',fromF(150,330),1,'mouse',-1,{buttons:2});up(fromF(150,330),2);t.frame();ok(over(g0),'right-drag a line: the banner over it ('+say(g0)+')');
    const ys=[];for(let i=0;i<5;i++){t.frame();const ic=B.icons.find(i=>i.g===g0);ys.push(ic.x+','+ic.y)}ok(new Set(ys).size===1,'and it stays put frame after frame (no drift or jump)');
    const pre=B.icons.find(i=>i.g===g0);t.beginFight();t.updateBattle(.03);t.frame();const post=B.icons.find(i=>i.g===g0);
    ok(!B.deploy&&Math.abs(post.x-pre.x)<=2&&Math.abs(post.y-pre.y)<=2,'the battle begins with no banner jump ('+(post.x-pre.x)+','+(post.y-pre.y)+')');
    B.over=true;B.endT=0;t.B=null;
  }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{
    Math.random=random0;for(const m in orig)t.BattleControl.prototype[m]=orig[m];if(window.__dcMeasure){(0,eval)('measureField=window.__dcMeasure');delete window.__dcMeasure}
  }
  const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
