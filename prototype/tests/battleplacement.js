'use strict';
// Effective control-key badges and the hero's place in the same line as troops and companions.
Kit.suite(({ok})=>{
 const t=T,L=t.BattleLab,key=(k,save=false)=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'Digit'+k,key:k,ctrlKey:save,bubbles:true}));
 const config={leftGroups:[{type:'hum_foot',count:4},{type:'hero',count:1},{type:'hum_bow',count:3},{type:'brann',count:1}],rightGroups:[{type:'hum_foot',count:1}],deploy:false,paused:true,ai:false,morale:false,seed:42};
 try{
  L.start(config);const b=t.B,ids=t.playerGroups(),[a,h,c,d]=ids,card=g=>document.querySelector('.bcards [data-grp="'+g+'"]'),badge=g=>card(g).querySelector('.ukey').textContent;
  ok(h==='hero'&&ids.every((g,i)=>badge(g)===String(i+1))&&badge('all')==='','default badges follow actual roster order, including a hero in the middle');
  const cards=[...document.querySelector('.bcards').children];card(a).focus();b.sel=[a,c];key('2',true);
  ok(badge(h)===''&&badge(a)==='1·2'&&badge(c)==='2·3','saving a shared key removes the displaced default and marks both member cards immediately');
  ok(cards.every((el,i)=>el===document.querySelector('.bcards').children[i])&&document.activeElement===card(a),'rebinding preserves card order, DOM identity and keyboard focus');
  t.selectGroup(h);key('2');ok(Array.isArray(b.sel)&&b.sel.join()===[a,c].join(),'the displayed shared key recalls exactly its two groups');
  b.sel='all';key('5',true);ok(badge('all')==='5'&&ids.every(g=>card(g).dataset.key.split(', ').includes('5')),'a dynamic All binding appears on All and every living member');
  b.sel=a;for(const k of '67890')key(k,true);
  ok(badge(a)==='1·2+6'&&card(a).title.endsWith('(1, 2, 5, 6, 7, 8, 9, 0)')&&card(a).getAttribute('aria-label')===card(a).title&&card(a).getAttribute('aria-keyshortcuts')==='1 2 5 6 7 8 9 0','many bindings fit a compact badge; tooltip, long-press text and accessibility retain every key');
  b.sel=null;key('5',true);ok(badge('all')===''&&badge(h)===''&&!ids.some(g=>card(g).dataset.key.split(', ').includes('5')),'saving an empty selection removes that binding everywhere without restoring its default');
  b.sel=c;key('2',true);ok(!card(a).dataset.key.split(', ').includes('2')&&badge(c)==='2·3','overwriting a custom selection removes its badge from the former members');
  t.selectGroup(h);key('0');ok(b.sel===a,'the zero key recalls the group shown in its badge');
  const members=t.grpUnits(c),health=members.map(u=>u.hp);members.forEach(u=>u.hp=0);t.setOrderUI();
  ok(badge(c)===''&&card(c).disabled,'an eliminated group has no usable key badge');key('2');ok(b.sel===a,'recalling an eliminated custom group leaves the selection unchanged');
  members.forEach((u,i)=>u.hp=health[i]);t.setOrderUI();ok(badge(c)==='2·3','bindings return with a living member, without a stale card cache');
  b.ctrl={};t.setOrderUI();b.sel=[a,h,c,d];
  const lines=[[400,100,400,500],[400,500,400,100],[220,300,620,300],[620,300,220,300],[250,140,550,440]];
  for(const line of lines){const [x0,y0,x1,y1]=line,dx=x1-x0,dy=y1-y0,plan=t.formPlan(...line),hero=plan.find(p=>p.hero),progress=p=>((p.ax-x0)*dx+(p.ay-y0)*dy)/(dx*dx+dy*dy);
   ok(plan.length===4&&hero&&plan.every(p=>Math.abs((p.ax-x0)*dy-(p.ay-y0)*dx)<.001)&&plan.every((p,i)=>!i||progress(p)>progress(plan[i-1])),'hero, companion and troops share the line in selection order: '+line.join(','));
   ok(hero.files===null&&t.formDragTo(...line)&&plan.every(p=>Math.hypot(b.groups[p.g].ax-p.ax,b.groups[p.g].ay-p.ay)<.001&&t.angGap(b.groups[p.g].face,p.face)<.001),'committed anchors and facing match the preview plan: '+line.join(','));
  }
  b.sel=[a,h,c];b.rdrag={x0:400,y0:100,x1:400,y1:500};const plan=t.formPlan(400,100,400,500),hero=plan.find(p=>p.hero),ctx=t.ctx,rects=[],fill=ctx.fillRect;
  try{ctx.fillRect=function(...args){rects.push(args);return fill.apply(this,args)};t.drawFormGhost()}finally{ctx.fillRect=fill;b.rdrag=null}
  ok(rects.some(([x,y,w,h])=>Math.abs(x+w/2-hero.ax)<1&&Math.abs(y+h/2-hero.ay)<1),'the actual canvas ghost paints the hero dot on the planned line');
  const companion=[b.groups[d].ax,b.groups[d].ay];t.formDragTo(400,100,400,500);
  ok(b.groups[d].ax===companion[0]&&b.groups[d].ay===companion[1]&&b.hero.sx===0&&b.hero.sy===0,'an unselected companion stays put and the hero has no hidden slot offset');
  const old=[b.groups[h].ax,b.groups[h].ay];ok(!t.formDragTo(400,100,402,102)&&b.groups[h].ax===old[0]&&b.groups[h].ay===old[1],'a short drag issues no line order');
  b.sel=h;const lone=t.formPlan(300,100,300,400);ok(lone.length===1&&lone[0].ax===300&&lone[0].ay===250,'a hero alone still takes the line midpoint');
  b.sel=[a,h,c];const hp=b.hero.hp;b.hero.hp=0;const noHero=t.formPlan(400,100,400,500);b.hero.hp=hp;
  ok(noHero.length===2&&!noHero.some(p=>p.hero),'a fallen hero reserves no invisible gap in the line');
  const attack=t.formPlan(400,100,400,500);t.formDragTo(400,100,400,500,{amove:true});
  ok(attack.every(p=>b.groups[p.g].amove&&b.groups[p.g].amove.x===p.ax&&b.groups[p.g].amove.y===p.ay),'attack-move uses the same hero-inclusive destination line');
  t.formDragTo(400,100,400,500);const dest={x:b.groups[h].ax,y:b.groups[h].ay};
  for(const e of b.units.filter(u=>u.team===1)){e.s={...e.s,spd:0};e.x=t.BW-30;e.y=t.fieldTop()+20;e.hp=e.max=100000}
  b.paused=false;for(let i=0;i<1200;i++)t.updateBattle(1/60);b.paused=true;
  ok(Math.hypot(b.hero.x-dest.x,b.hero.y-dest.y)<5,'the hero actually walks to the line alongside the selected troops');
  b.deploy=true;b.sel='all';const z=t.deployZone(),x=(z.x0+z.x1)/2,y0=z.y0+30,y1=z.y1-30,placed=t.formPlan(x,y0,x,y1);t.formDragTo(x,y0,x,y1);
  ok(placed.every(p=>Math.hypot(b.groups[p.g].ax-p.ax,b.groups[p.g].ay-p.ay)<.001)&&Math.hypot(b.hero.x-placed.find(p=>p.hero).ax,b.hero.y-placed.find(p=>p.hero).ay)<.001,'deployment places the hero exactly at the line preview, with the other groups');
  ok(b.units.filter(u=>!u.team&&u.hp>0).every(u=>u.x>=z.x0&&u.x<=z.x1&&u.y>=z.y0&&u.y<=z.y1),'line placement keeps every deployed soldier in the deployment zone');
  L.exit();L.start(config);ok(t.playerGroups().every((g,i)=>badge(g)===String(i+1)),'custom bindings remain battle-local; the next battle restores default badges');
  L.exit();L.start({...config,leftGroups:Array.from({length:10},()=>({type:'hum_foot',count:1}))});const tenth=t.playerGroups()[9];
  key('0');ok(badge(tenth)==='0'&&t.B.sel===tenth,'a full ten-group army displays and recalls the default zero badge');
 }finally{if(L.active)L.exit()}
});
