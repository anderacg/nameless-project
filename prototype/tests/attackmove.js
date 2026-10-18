'use strict';
// Attack-move (battlecontrol.js AMOVE, attackMove/amStep; commands.js rtsOrder, formDragTo, armAttackMove): marching past a foe
// within its reach it turns on him, then marches on and arrives; one further off it walks past; a move never stops; shooters halt
// and shoot; riders charge; runners chased no further than the leash; any new order calls it off; a Shift-queued one takes over at
// its waypoint; Ctrl + right-click, the button (D) and Esc; its path ends in crossed blades and its card says so.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),t=T,G=t.G,L=t.BattleLab;
 const Gp=(type,count)=>({type,count}),A=t.AMOVE;
 const lab=(left,right)=>{if(L.active)L.exit();G.mode='world';G.modal=false;L.start({leftGroups:left,rightGroups:right,deploy:false,ai:false,paused:false,morale:false,seed:7});const B=t.B;B.obs=[];B.cmdT=1e9;return B};
 const place=(g,x,y)=>{g.placeAt(x,y);t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+(u.sx||0);u.y=g.ay+(u.sy||0)})};
 const mid=g=>{const m=g.units.filter(u=>!u.rout);return{x:m.reduce((a,u)=>a+u.x,0)/m.length,y:m.reduce((a,u)=>a+u.y,0)/m.length}};
 // (one group of yours at (150,300), the foe's still group at (x,y), weak (hp) so a fight ends; mine selected)
 const setup=(type,n,fx,fy,hp=6,count=6)=>{const B=lab([Gp(type,n)],[Gp('hum_levy',count)]),g=B.groups[t.playerGroups()[0]],e=Object.values(B.groups).find(q=>q.foe);
  place(g,150,300);place(e,fx,fy);e.units.forEach(u=>{u.s={...u.s,spd:0};u.hp=u.max=hp});B.sel=g.id;return{B,g,e}};
 // (the battle on, s seconds at most, each frame watched; stop: true to end early)
 const go=(B,s,watch,stop)=>{const end=B.t+s;while(B.t<end&&!B.over){t.updateBattle(1/30);if(watch)watch();if(stop&&stop())break}};
 const there=(g,p,r=20)=>{const c=mid(g);return Math.hypot(c.x-p.x,c.y-p.y)<r};
 try{t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;window.__cbo=t.checkBattleOver;(0,eval)('checkBattleOver=()=>{}');// (the field never won: a foe beaten or running, the battle goes on)
  ok(A&&A.melee===90&&A.leash===120&&A.cav>=A.melee&&A.short>0,'the tunables in one table: melee '+A.melee+' px, riders '+A.cav+', shooters their reach + '+A.short+', leash '+A.leash);
  // ======== marching past a foe within reach: it turns on him, beats him, marches on and arrives
  {const {B,g,e}=setup('hum_spear',12,430,360),goal={x:700,y:300};t.rtsOrder(goal.x,goal.y,{amove:true});
   ok(g.amove&&g.amove.x===goal.x&&g.order==='hold'&&!g.hasTarget&&/attack-move/.test(G.msgs[G.msgs.length-1].m),'Ctrl + right-click (opt.amove): an attack-move, said in the log ('+G.msgs[G.msgs.length-1].m+')');
   let engaged=null,resumed=null;go(B,60,()=>{if(!engaged&&g.hasTarget&&g.targetGroupId===e.id&&g.amove&&g.amove.at)engaged={t:B.t,c:mid(g)};if(engaged&&!resumed&&!e.units.length&&g.amove&&!g.amove.at&&g.order==='hold'&&g.ax===goal.x)resumed=B.t},()=>!g.amove&&there(g,goal));
   ok(engaged&&engaged.c.x<430,'a foe within '+A.melee+' px of its march: it turns on his group ('+(engaged?'at '+engaged.t.toFixed(1)+' s, x '+Math.round(engaged.c.x):'never')+')');
   ok(resumed&&!e.units.length,'him beaten, it marches on to the same place ('+(resumed?resumed.toFixed(1)+' s':'never')+')');
   ok(there(g,goal)&&!g.amove&&g.order==='hold','and arrives, holding there, the attack-move done ('+B.t.toFixed(1)+' s)')}
  // ======== a foe out of reach of the march: it walks past
  {const {B,g,e}=setup('hum_spear',12,900,300),goal={x:640,y:300};t.rtsOrder(goal.x,goal.y,{amove:true});let fought=false,near=1e9;
   go(B,40,()=>{if(g.hasTarget)fought=true;for(const u of g.units)for(const f of e.units)near=Math.min(near,Math.hypot(u.x-f.x,u.y-f.y))},()=>!g.amove&&there(g,goal));
   ok(!fought&&there(g,goal)&&e.units.length===6&&near>A.melee,'a foe further off than its reach (at nearest '+Math.round(near)+' px): it walks on and arrives, leaving him be')}
  // ======== a plain move never stops to fight
  {const {B,g,e}=setup('hum_spear',12,430,360),goal={x:700,y:300};t.rtsOrder(goal.x,goal.y);let fought=false;
   go(B,40,()=>{if(g.hasTarget||g.order!=='hold')fought=true},()=>there(g,goal));
   ok(!g.amove&&!fought&&there(g,goal)&&e.units.length>0,'a plain move past the same foe never turns on him: it arrives, he still stands')}
  // ======== shooters halt and shoot, then march on
  {const {B,g,e}=setup('hum_bow',10,520,380,5),goal={x:820,y:300};t.rtsOrder(goal.x,goal.y,{amove:true});let halt=null,shots=0;const hp0=e.units.reduce((a,u)=>a+u.hp,0);let still=0,last=mid(g);
   go(B,60,()=>{const c=mid(g),mv=Math.hypot(c.x-last.x,c.y-last.y);last=c;if(g.amove&&g.amove.eng==='shoot'){still=mv<.05?still+1:0;if(still>30&&!halt)halt={t:B.t,c,order:g.order,tgt:g.hasTarget}}shots=Math.max(shots,B.arrows.length)},()=>!g.amove&&there(g,goal));
   ok(halt&&halt.order==='hold'&&!halt.tgt&&halt.c.x<520,'shooters with a foe in their reach halt where they are and shoot at will ('+(halt?'at x '+Math.round(halt.c.x)+', '+halt.t.toFixed(1)+' s':'never')+')');
   ok(shots>0&&e.units.reduce((a,u)=>a+u.hp,0)<hp0,'their arrows fly and hit ('+shots+' in the air at once)');
   ok(there(g,goal)&&!g.amove,'him beaten, they march on and arrive')}
  // ======== riders charge
  {const {B,g,e}=setup('hum_knight',6,430,360);t.rtsOrder(700,300,{amove:true});let ch=null;go(B,20,()=>{if(!ch&&g.hasTarget&&g.targetGroupId===e.id)ch={run:g.run,order:g.order}},()=>!!ch);
   ok(ch&&ch.run&&ch.order==='charge','riders turn on him at a charge (a run)')}
  // ======== runners: chased a short way only
  {const {B,g,e}=setup('hum_spear',12,430,360,999),goal={x:700,y:300};t.rtsOrder(goal.x,goal.y,{amove:true});go(B,20,null,()=>g.hasTarget&&g.amove&&g.amove.at);
   const at=g.amove&&g.amove.at;e.units.forEach(u=>{u.rout=true;u.s={...u.s,spd:70}});let back=null,far=0;
   go(B,20,()=>{if(at)far=Math.max(far,Math.hypot(mid(g).x-at.x,mid(g).y-at.y));if(!back&&g.amove&&!g.amove.at&&g.ax===goal.x)back=B.t},()=>back!=null);
   ok(at&&back!=null&&far<A.leash+40,'its foe running: it chases him '+Math.round(far)+' px from where it turned at most (leash '+A.leash+'), then marches on')}
  // ======== any new order calls it off
  {const {B,g,e}=setup('hum_spear',12,430,360,999);t.rtsOrder(700,300,{amove:true});go(B,20,null,()=>g.hasTarget);const was=!!(g.amove&&g.hasTarget);
   t.rtsOrder(200,200);const moved=!g.amove&&!g.hasTarget&&Math.abs(g.ax-200)<1;go(B,1);
   t.rtsOrder(700,300,{amove:true});const p=e.units[0];t.rtsOrder(p.x,p.y-6);const att=!g.amove&&g.targetGroupId===e.id;
   t.rtsOrder(700,300,{amove:true});t.setOrder('hold');const held=!g.amove;t.rtsOrder(700,300,{amove:true});t.setOrder('withdraw');const wd=!g.amove&&g.order==='withdraw';
   t.rtsOrder(700,300,{amove:true});const ok1=!!g.amove;t.formDragTo(300,150,300,450);const line=!g.amove;
   ok(was&&moved&&att&&held&&wd&&ok1&&line,'a new order calls the attack-move off: a move ('+moved+'), an attack ('+att+'), Hold ('+held+'), Withdraw ('+wd+'), a line ('+line+')');
   g.order='hold';t.rtsOrder(700,300,{amove:true});t.setOrder('charge');ok(!!g.amove&&!g.walk,'the pace (Run) is no new order: the attack-move goes on, at a run')}
  // ======== a Shift-queued attack-move takes over at its waypoint; a line dragged with Ctrl is one too
  {const {B,g,e}=setup('hum_spear',12,430,560);t.rtsOrder(300,300);t.rtsOrder(700,300,{queue:true,amove:true});
   const q=g.queue.length===1&&g.queue[0].am&&!g.amove;go(B,30,null,()=>!!g.amove);
   ok(q&&g.amove&&g.amove.x===g.ax&&g.ax>=650,'a Shift-queued attack-move: a plain move to its waypoint, the attack-move from there on');
   t.formDragTo(300,150,300,450,{amove:true});ok(g.amove&&g.amove.face!=null&&/attack-move to the line/.test(G.msgs[G.msgs.length-1].m),'a line dragged with Ctrl: an attack-move to it, keeping the line’s facing')}
  // ======== the input: Ctrl + right-click, the button (D) and Esc; its path and its card
  {const {B,g}=setup('hum_spear',12,430,560),cv=document.querySelector('canvas');t.frame();
   const point=(x,y)=>{const p=t.fromField({x,y}),r=cv.getBoundingClientRect();return{clientX:r.left+p.x*r.width/cv.width,clientY:r.top+p.y*r.height/cv.height}};
   const ptr=(type,x,y,extra)=>(type==='pointerup'?window:cv).dispatchEvent(new PointerEvent(type,{...point(x,y),button:2,pointerType:'mouse',bubbles:true,...extra}));
   const key=(k,code)=>window.dispatchEvent(new KeyboardEvent('keydown',{key:k,code,bubbles:true}));
   ptr('pointerdown',600,250,{ctrlKey:true});ptr('pointerup',600,250,{ctrlKey:true});const ctl=!!g.amove&&Math.abs(g.ax-600)<1;
   ptr('pointerdown',500,250,{});ptr('pointerup',500,250,{});const plain=!g.amove;
   ok(ctl&&plain&&!B.rdrag,'Ctrl + right-click on the ground: an attack-move; a right-click alone: a move');
   const btn=document.getElementById('bAmove');key('d','KeyD');const armed=B.amArm&&btn.getAttribute('aria-pressed')==='true'&&btn.classList.contains('on');
   ptr('pointerdown',620,260,{});ptr('pointerup',620,260,{});ok(armed&&g.amove&&!B.amArm&&btn.getAttribute('aria-pressed')==='false','the button (D) arms the next order on the ground: an attack-move, and then it is spent');
   btn.click();const on=B.amArm;key('Escape','Escape');ok(on&&!B.amArm,'pressed, then Esc: no longer armed');
   t.rtsOrder(700,300,{amove:true});go(B,.5);const P=t.orderPath(g.id);ok(P&&P.am&&P.kind==='move','its path: a move’s, marked an attack-move (crossed blades where it ends)');
   t.setOrderUI();const card=document.querySelector('.ucard[data-grp="'+g.id+'"]');ok(card&&card.querySelector('[data-st="amove"]')&&/attack-move/i.test(card.title),'its card shows the order ('+(card&&card.title)+')');
   t.selectGroup(g.id);t.setOrderUI();ok(/Attack-move/.test(document.getElementById('bInfo').textContent),'and so do its details')}
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{if(window.__cbo)(0,eval)('checkBattleOver=__cbo');if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
