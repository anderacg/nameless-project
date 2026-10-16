'use strict';
// Fixed field fixtures characterize player command routing before extraction; no combat frames or random world actors.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),t=T,G=t.G,P=t.P,random0=Math.random,measure0=t.measureField;
  const expected={"pick":"345e1bd9","select":"20ec1ad2","boxes":"52ac0e89","control_groups":"f5b35459","move":"9f77e5b7","queue":"c7be0530","attack":"30c85d26","own_icon":"f91bf2ab","orders":"42c9680c","flags":"2e05a5ff","formations":"551ad0ce","line_drag":"e0d7ecda","deployment":"74235056","empty":"c7f60109","pointer_select":"575c0d25","pointer_orders":"f2d007ba","pointer_line":"6ded13dc","touch":"f974cecd","keyboard":"0e45d371"};
  const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
  const hash=x=>{let h=2166136261;for(const c of JSON.stringify(stable(x)))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h.toString(16).padStart(8,'0')};
  const methods=['moveTo','attack','queueTo','hold','withdraw','setWalk','setFlag','setForm','setRun'],original={},calls=[];
  const cv=document.querySelector('canvas'),point=(x,y)=>{const p=t.fromField({x,y}),r=cv.getBoundingClientRect();return{clientX:r.left+p.x*r.width/cv.width,clientY:r.top+p.y*r.height/cv.height}};
  const pointer=(type,x,y,button=0,extra={})=>(type==='pointerup'?window:cv).dispatchEvent(new PointerEvent(type,{...point(x,y),button,pointerType:'mouse',bubbles:true,...extra}));
  const click=(x,y,button=0,extra={})=>{pointer('pointerdown',x,y,button,extra);pointer('pointerup',x,y,button,extra)};
  const drag=(x0,y0,x1,y1,button=0,extra={})=>{pointer('pointerdown',x0,y0,button,extra);pointer('pointermove',x1,y1,button,extra);pointer('pointerup',x1,y1,button,extra)};
  const key=(code,extra={})=>window.dispatchEvent(new KeyboardEvent('keydown',{key:code,code,bubbles:true,...extra}));
  const snapshot=(B,results,randomCalls)=>({sel:B.sel,ctrl:B.ctrl,groups:Object.fromEntries(Object.entries(B.groups).map(([id,g])=>[id,{...g,tgt:g.tgt&&g.tgt.id}])),
    units:B.units.map(u=>({id:u.id,grp:u.grp,team:u.team,hp:u.hp,x:u.x,y:u.y,sx:u.sx,sy:u.sy})),mark:B.mark,auto:B.auto,deploy:B.deploy,paused:B.paused,
    drag:[B.box||null,B.rdrag||null],lastRc:B.lastRc&&{x:B.lastRc.x,y:B.lastRc.y},camera:B.cam&&{x:B.cam.x,y:B.cam.y,z:B.cam.z,fit:B.cam.fit},
    messages:G.msgs.map(m=>({m:m.m,cls:m.cls})),buttons:[...document.querySelectorAll('[data-order],[data-flag],[data-form]')].map(b=>({order:b.dataset.order,flag:b.dataset.flag,form:b.dataset.form,on:b.classList.contains('on'),pressed:b.getAttribute('aria-pressed'),disabled:b.disabled})),
    results,calls:calls.slice(),randomCalls,next:[Math.random(),Math.random(),Math.random()]});
  try{
    Math.random=t.seeded(800);t.act('begin','soldier');G.quietEvents=true;t.W.lords=[];t.GUIDE.on=false;
    window.__commandMeasure=measure0;(0,eval)('measureField=()=>({top:40,bot:560})');
    for(const m of methods){original[m]=t.BattleControl.prototype[m];t.BattleControl.prototype[m]=function(...args){calls.push([m,this.id,args.map(a=>a&&a.unit?{unit:a.id}:a)]);return original[m].apply(this,args)}}
    const cases=['pick','select','boxes','control_groups','move','queue','attack','own_icon','orders','flags','formations','line_drag','deployment','empty','pointer_select','pointer_orders','pointer_line','touch','keyboard'];
    for(const [index,name] of cases.entries()){
      Math.random=t.seeded(900+index);P.troops={hum_foot:4,hum_bow:3,hum_mage:2,hum_knight:2};P.comps={};P.hp=40;P.morale=60;
      G.mode='world';G.modal=false;G.loot=null;G.enc={kind:'party',ref:{x:P.x+8,y:P.y,cool:0},list:['militia','archer','horse'],allies:[],foes:[]};
      t.BDEPLOY.on=name==='deployment';t.BAUTO.on=false;t.startBattle({enemies:G.enc.list,tournament:false,deploy:true});
      const B=t.B,anchors={hero:[100,300],inf:[200,180],arc:[200,380],mag:[140,490],cav:[140,90]};
      for(const g of t.GRPS){const gr=B.groups[g],[x,y]=anchors[g];gr.placeAt(x,y);t.grpUnits(g).forEach(u=>{u.x=x+(u.sx||0);u.y=y+(u.sy||0)})}
      const inf=t.grpUnits('inf'),arc=t.grpUnits('arc'),enemy=B.units.find(u=>u.team===1);B.units.filter(u=>u.team===1).forEach((u,i)=>{u.x=720;u.y=220+i*80});
      t.frame();B.icons=[];B.sel='inf';t.setOrderUI();G.msgs=[];calls.length=0;let randomCalls=0;const stream=t.seeded(1500+index);Math.random=()=>{randomCalls++;return stream()};const results={};
      if(name==='pick'){
        results.own=t.rtsUnitAt(inf[0].x,inf[0].y-6,0).id;results.wrong=t.rtsUnitAt(inf[0].x,inf[0].y-6,1);
        const hp=inf[0].hp;inf[0].hp=0;results.dead=t.rtsUnitAt(inf[0].x,inf[0].y-6,0)?.id??null;inf[0].hp=hp;
        const c=t.fromField({x:400,y:100});B.icons=[{g:'inf',team:0,x:c.x-8,y:c.y-8,w:16,h:16,cx:200,cy:180}];results.icon=t.rtsUnitAt(400,100,0).grp;
        ok(results.own===inf[0].id&&results.wrong===null&&results.dead!==inf[0].id&&results.icon==='inf','picking honors team, health, soldier position and group icons');
      }else if(name==='select'){
        t.rtsSelect(arc[0].x,arc[0].y-6,arc[0].x,arc[0].y-6);results.first=B.sel;
        t.rtsSelect(inf[0].x,inf[0].y-6,inf[0].x,inf[0].y-6,true);results.add=B.sel.slice();
        t.rtsSelect(-20,-20,-20,-20,true);results.emptyShift=B.sel.slice();t.rtsSelect(-20,-20,-20,-20);results.empty=B.sel;
        const ally={...inf[0],id:99,grp:'a_inf',x:450,y:450};B.units.push(ally);t.rtsSelect(450,444,450,444);results.ally=B.sel;
        ok(results.first==='arc'&&results.add.includes('inf')&&results.add.includes('arc')&&results.empty==='all'&&results.ally==='all','click, Shift-add and empty/allied selection behavior preserved');
      }else if(name==='boxes'){
        t.rtsSelect(250,410,150,140);results.two=B.sel.slice();t.rtsSelect(500,500,550,550);results.empty=B.sel.slice();t.rtsSelect(0,0,t.BW,t.BH);
        ok(results.two.includes('inf')&&results.two.includes('arc')&&JSON.stringify(results.two)===JSON.stringify(results.empty)&&B.sel==='all','reversed boxes select groups; empty boxes keep selection; full boxes select all');
      }else if(name==='control_groups'){
        B.sel=['inf','arc'];t.ctrlGroup('1',true);const saved=B.ctrl['1'];B.sel.push('mag');results.copied=saved.length===2;
        arc.forEach(u=>u.hp=0);t.ctrlGroup('1');results.recalled=B.sel;t.ctrlGroup('9');results.missing=B.sel;t.selectGroup('arc');results.dead=B.sel;
        t.selectGroup('all');t.ctrlGroup('2',true);t.selectGroup('inf');t.ctrlGroup('2');t.cycleGroup();results.cycled=B.sel;
        ok(results.copied&&results.recalled==='inf'&&results.missing==='inf'&&results.dead==='inf'&&B.ctrl['2']==='all'&&results.cycled==='hero','control groups copy selections, filter dead groups and retain dynamic All');
      }else if(name==='move'){
        B.sel=['inf','arc'];B.auto=true;t.rtsOrder(500,300,{run:true});
        ok(!B.auto&&B.groups.inf.run&&B.groups.arc.run&&B.groups.inf.ax===500&&B.groups.arc.ay-B.groups.inf.ay===200&&!B.mark.foe,'move routes through group controls, preserves offsets and takes command back');
      }else if(name==='queue'){
        B.sel=['inf','arc'];t.rtsOrder(450,300);t.rtsOrder(550,340,{queue:true});t.rtsOrder(650,400,{queue:true,run:true});
        ok(B.groups.inf.queue.length===2&&B.groups.arc.queue.length===2&&B.groups.arc.queue[1].y-B.groups.inf.queue[1].y===200,'queued moves keep relative offsets after the final waypoint');
      }else if(name==='attack'){
        B.auto=true;B.groups.inf.setForm('wall');t.rtsOrder(enemy.x,enemy.y-6,{run:true,queue:true});
        ok(!B.auto&&B.groups.inf.tgt===enemy&&B.groups.inf.form==='line'&&B.groups.inf.run&&!B.groups.inf.queue.length&&B.mark.foe,'enemy orders attack the original unit, break walls and ignore waypoint mode');
      }else if(name==='own_icon'){
        const p=t.fromField({x:500,y:100});B.icons=[{g:'arc',team:0,x:p.x-8,y:p.y-8,w:16,h:16,cx:200,cy:380}];t.rtsOrder(500,100);
        ok(B.groups.inf.ax===200&&B.groups.inf.ay===380&&!B.mark.foe,'an own-group icon orders movement to its field centre');
      }else if(name==='orders'){
        t.rtsOrder(enemy.x,enemy.y-6);t.setOrder('charge');results.charge=B.groups.inf.tgt===enemy&&!B.groups.inf.walk;
        t.setOrder('advance');results.advance=B.groups.inf.tgt===enemy&&B.groups.inf.walk;t.setOrder('hold');results.hold=B.groups.inf.tgt===null&&B.groups.inf.order==='hold';
        t.setOrder('withdraw');ok(results.charge&&results.advance&&results.hold&&B.groups.inf.order==='withdraw','pace commands preserve targets; hold and withdraw use group mechanics');
      }else if(name==='flags'){
        B.sel=['inf','arc'];t.toggleFlag('cease');results.onlyShooters=!B.groups.inf.cease&&B.groups.arc.cease;t.toggleFlag('cease');t.toggleFlag('firm');
        ok(results.onlyShooters&&!B.groups.arc.cease&&B.groups.inf.firm&&B.groups.arc.firm,'shooter-only flags filter groups and mixed flags toggle consistently');
      }else if(name==='formations'){
        t.setForm('wall');results.wall=B.groups.inf.form;t.setForm('wall');results.line=B.groups.inf.form;
        t.selectGroup('cav');t.setForm('wedge');results.wedge=B.groups.cav.form;t.selectGroup('arc');t.setForm('wall');
        ok(results.wall==='wall'&&results.line==='line'&&results.wedge==='wedge'&&B.groups.arc.form==='line','formation commands filter eligibility and toggle back to line');
      }else if(name==='line_drag'){
        B.sel=['hero','inf','arc'];B.auto=true;results.short=t.formDragTo(300,200,302,202);results.line=t.formDragTo(400,100,400,450);
        ok(!results.short&&results.line&&!B.auto&&B.groups.inf.ax===400&&B.groups.arc.ay>B.groups.inf.ay&&B.groups.hero.ax===370,'dragged lines share group space and leave the hero behind the line');
      }else if(name==='deployment'){
        B.sel=['inf','arc'];t.rtsOrder(enemy.x,enemy.y-6,{queue:true,run:true});results.move=B.units.filter(u=>['inf','arc'].includes(u.grp)).every(u=>u.x<=t.deployZone().x1);
        results.line=t.formDragTo(180,100,180,450);ok(results.move&&results.line&&!B.groups.inf.tgt&&!B.groups.inf.run&&!B.groups.inf.queue.length&&B.groups.arc.ax<=t.deployZone().x1,'deployment clamps and snaps orders without targets, queues or running');
      }else if(name==='empty'){
        inf.forEach(u=>u.hp=0);B.auto=true;t.rtsOrder(500,300);t.selectGroup('inf');results.invalid=t.formDragTo(100,100,100,250);
        ok(B.auto&&!B.mark&&!results.invalid,'empty selections do not take command or issue moves');
      }else if(name==='pointer_select'){
        click(arc[0].x,arc[0].y-6);results.first=B.sel;click(inf[0].x,inf[0].y-6,0,{shiftKey:true});results.add=B.sel.slice();drag(250,410,150,140);
        ok(results.first==='arc'&&results.add.includes('inf')&&results.add.includes('arc')&&Array.isArray(B.sel),'real pointer clicks, Shift-add and box drags route selection');
      }else if(name==='pointer_orders'){
        B.lastRc=null;click(500,300,2);results.walk=!B.groups.inf.run;click(500,300,2);results.run=B.groups.inf.run;
        B.lastRc=null;click(600,350,2,{shiftKey:true});ok(results.walk&&results.run&&B.groups.inf.queue.length===1,'real right-click, double-click and Shift-click route move/run/queue');
      }else if(name==='pointer_line'){
        drag(400,150,400,400,2);ok(B.groups.inf.ax===400&&B.groups.inf.files>1&&!B.rdrag,'real right-drag applies formation placement and clears drag state');
      }else if(name==='touch'){
        B.sel='all';click(inf[0].x,inf[0].y-6,0,{pointerType:'touch'});results.select=B.sel;click(500,300,0,{pointerType:'touch'});
        ok(results.select==='inf'&&B.groups.inf.ax===500&&B.groups.inf.ay===300,'touch selects a group and a subsequent ground touch moves it');
      }else if(name==='keyboard'){
        key('Digit1',{ctrlKey:true});t.selectGroup('arc');key('Digit1');results.recalled=B.sel;key('KeyR');results.run=!B.groups.inf.walk;key('KeyH');key('KeyW');
        ok(results.recalled==='inf'&&results.run&&B.groups.inf.order==='withdraw','real keyboard control groups, flags, hold and withdrawal remain connected');
      }
      const fingerprint=hash(snapshot(B,results,randomCalls));if(expected[name])ok(fingerprint===expected[name],name+' matches pre-extraction command state ('+fingerprint+')');else o.push('SNAP '+name+' '+fingerprint);
      ok(Object.values(B.groups).every(g=>g instanceof t.BattleControl),name+': commands retain the existing group model');
    }
  }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{
    Math.random=random0;for(const m in original)t.BattleControl.prototype[m]=original[m];if(window.__commandMeasure){(0,eval)('measureField=window.__commandMeasure');delete window.__commandMeasure}
  }
  const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
