'use strict';
// The column's order (the owner, 2026-11-01: "make march formation a menu alongside Roster ... add By road formation to let you
// decide the orders of units (in column)", "drag and drop adjustable preview ... locked in column form order"; ui/march.js
// ColumnEditor, marchstyles.js columnOrder): the Army window's March formation tab (Roster's button gone), its Field and By road
// views; the column drawn in its default order; a block dragged to a new place, the others sliding; a tap to pick and a tap to drop;
// Apply saves P.army.column, Reset the default; saved and loaded, an old save the default; By road, your column marches in that
// order, its head group first along the way; a new group at its default place; the phone's layout; Esc follows the bar; no errors.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,p=t.panel,scr=document.getElementById('screen'),original=scr.style.cssText,q=s=>p.querySelector(s),qa=s=>[...p.querySelectorAll(s)],esc=()=>Kit.key('Escape','Escape');
 const shown=e=>!!e&&e.getClientRects().length>0,inside=e=>{const a=e.getBoundingClientRect(),b=p.getBoundingClientRect();return a.left>=b.left-1&&a.right<=b.right+1&&a.top>=b.top-1&&a.bottom<=b.bottom+1};
 Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:99});t.GUIDE.on=false;t.WORLD_BATTLE.on=true;
 P.troops={hum_foot:6,hum_bow:4,hum_knight:3};P.comps={brann:{ap:5,role:''}};t.compInit('brann');delete P.army.column;delete P.army.march;
 const r=t.partyRoster(P),foot=r.groups.find(g=>g.type==='hum_foot'),bow=r.groups.find(g=>g.type==='hum_bow'),cav=r.groups.find(g=>g.type==='hum_knight');
 const lab=id=>t.armyGroupLabel(id),def=()=>t.columnOrder(P,t.marchRows(P),null).map(r=>r.id),open=()=>{Kit.world({encCool:99});t.openChar();t.act('char-tab','march');t.marchBind()};
 const cap=window.HTMLElement.prototype.setPointerCapture;window.HTMLElement.prototype.setPointerCapture=function(){};
 try{
  // ---- the tab beside Roster; Roster's button gone
  Kit.world();t.openChar();
  ok(qa('[data-act="char-tab"]').map(b=>b.textContent).join('|')==='Roster|March formation|Army skills|Condition|Passengers','the tabs: Roster, March formation, Army skills, Condition, Passengers');
  ok(!q('[data-act="march-open"]')&&!/March formation/.test(q('.fb-collection').textContent),'the Roster has no March formation button now');
  t.act('char-tab','march');t.marchBind();
  ok(G.char==='march'&&q('.fb-march-pane')&&q('#marchCanvas')&&G.march&&q('[data-act="march-view"][data-arg="field"]').classList.contains('on')&&/Apply formation/.test(Kit.text()),'the tab opens the editor on its Field view: today\'s preview, Apply formation');
  ok(qa('[data-act="march-view"]').map(b=>b.textContent).join('|')==='Field|By road (column)','its switch: Field, By road (column)');
  // ---- By road: the column in its default order
  t.act('march-view','column');const ed=G.column,cv=q('#columnCanvas');
  ok(t.partyView().march==='column'&&cv&&!q('#marchCanvas')&&ed,'By road (column) shows the column editor');
  const ids0=def();
  ok(ids0.length===5&&ids0.includes('hero')&&ids0.includes('comp_brann')&&ed.ids().join()===ids0.join()&&!P.army.column,'the default order: your battle lanes front to back ('+ids0.map(lab).join(', ')+')');
  ok(qa('[data-act="march-col-pick"]').map(b=>b.dataset.arg).join()===ids0.join(),'the list shows the column front first');
  {const L=ed.layout(),v=ed.v,c=cv.getContext('2d'),dpr=cv.width/cv.getBoundingClientRect().width,seen=id=>{const x=Math.round(ed.xAt(L.span[id].c)*dpr);let n=0;
     for(let y=Math.round((v.y0-12*v.scale)*dpr);y<=Math.round((v.y0+4*v.scale)*dpr);y++){const d=c.getImageData(x,y,1,1).data;if(![[0x21,0x1c],[0x3a,0x31],[0x5a,0x4a],[0x4c,0x3f],[0x36,0x3f],[0x6e,0x5a],[0xff,0xe0]].some(([R,G])=>Math.abs(d[0]-R)<4&&Math.abs(d[1]-G)<4))n++}return n};
   ok(v&&ids0.every((id,i)=>i===0||L.span[ids0[i-1]].c<=L.span[id].c)&&L.span[ids0[0]].c<L.span[ids0[4]].c&&ed.xAt(L.span[ids0[0]].c)>ed.xAt(L.span[ids0[4]].c)&&ed.xAt(L.span[ids0[0]].c)>v.w/2,'drawn front at the right (as the Field view faces), each next one behind it, to its left (two characters may share a rank)');
   ok(ids0.every(id=>seen(id)>0),'every group drawn on its place ('+ids0.map(id=>seen(id)).join(', ')+' px of men)');
   const M=L.men,per={};for(const m of M)per[m.rank]=(per[m.rank]||0)+1;ok(M.length===15&&Object.values(per).every(n=>n<=2)&&Object.keys(per).length===8,'2 abreast, as it marches (marchstyles.js MarchColumn): '+M.length+' men in '+Object.keys(per).length+' ranks')}
  // ---- a block dragged to a new place; the others slide
  const fire=(type,x,y,touch)=>cv.dispatchEvent(new PointerEvent(type,{pointerId:3,pointerType:touch?'touch':'mouse',button:0,buttons:type==='pointerup'?0:1,clientX:cv.getBoundingClientRect().left+x,clientY:cv.getBoundingClientRect().top+y,bubbles:true,cancelable:true}));
  const xOf=id=>ed.xAt(ed.layout().span[id].c),y0=()=>ed.v.y0-3*ed.v.scale;
  {const first=ids0[0],last=ids0[ids0.length-1],x0=xOf(first),x1=xOf(last)-20;
   fire('pointerdown',x0,y0());fire('pointermove',x0-10,y0());fire('pointermove',x1,y0());
   ok(ed.drag&&ed.drag.moved&&ed.drag.j===ids0.length-1,'dragged to the rear: its place the last while held');
   const held=ed.with(first,ed.drag.j);ok(held.join()===[...ids0.slice(1),first].join(),'the others make room, one place ahead each');
   const was=ed.shown[ids0[1]];fire('pointerup',x1,y0());
   const now=[...ids0.slice(1),first];ok(ed.ids().join()===now.join()&&ed.custom&&!P.army.column,'dropped: the order changed, the others keep theirs (not saved yet)');
   const L=ed.layout(),t1=L.span[ids0[1]].c;let k=0;while(Math.abs(ed.shown[ids0[1]]-t1)>.01&&k<200){G.column.draw();k++}
   ok(t.marchStill()||Math.abs(was-t1)>1&&k>2&&k<200,'the next one slides to the front ('+k+' frames)')}
  // ---- a tap to pick, a tap to drop (a phone)
  {const ids=ed.ids(),b=ids[2];fire('pointerdown',xOf(b),y0(),true);fire('pointerup',xOf(b),y0(),true);
   ok(G.column.pick===b&&q('[data-act="march-col-pick"][data-arg="'+b+'"]').classList.contains('on'),'a tap picks a block ('+t.armyGroupLabel(b)+')');
   const e=G.column,x=xOf(ids[0]);fire('pointerdown',x,y0(),true);fire('pointerup',x,y0(),true);
   ok(e.ids()[0]===b&&e.pick===null&&e.ids().length===ids.length,'a tap at the front drops it there: '+e.ids().map(lab).join(', '));
   t.act('march-col-pick',b);t.act('march-col-step','1');ok(G.column.ids()[1]===b&&G.column.pick===b,'picked in the list, Behind moves it a place back');
   t.act('march-col-step','-1');ok(G.column.ids()[0]===b,'Ahead, a place forward');ok(q('[data-act="march-col-step"][data-arg="-1"]').disabled,'and Ahead is shut at the front')}
  // ---- Apply; Reset; Discard
  {const want=G.column.ids();t.act('march-col-apply');ok(JSON.stringify(P.army.column)===JSON.stringify(want)&&G.column.ids().join()===want.join()&&!G.column.changed(),'Apply saves the order (P.army.column, front first)');
   ok(t.columnOrder(P,t.marchRows(P)).map(r=>r.id).join()===want.join(),'and your column takes it (columnOrder)');
   t.act('march-col-reset');ok(G.column.ids().join()===ids0.join()&&!G.column.custom&&G.column.changed()&&JSON.stringify(P.army.column)===JSON.stringify(want),'Reset: the default order again, not saved till Apply');
   t.act('march-col-discard');ok(G.column.ids().join()===want.join(),'Discard: the saved order back');
   t.act('march-col-reset');t.act('march-col-apply');ok(P.army.column===undefined&&G.column.ids().join()===ids0.join(),'Reset and Apply: no order saved, the default');
   const lone=new t.ColumnEditor();lone.move(ids0[3],0);P.army.column=lone.ids()}
  // ---- a new group joins at its default place; one gone leaves the order
  {const saved=P.army.column.slice();P.troops.hum_levy=4;const rows=t.marchRows(P),lv=t.partyRoster(P).groups.find(g=>g.type==='hum_levy').id,d=t.columnOrder(P,rows,null).map(r=>r.id),got=t.columnOrder(P,rows).map(r=>r.id),before=d[d.indexOf(lv)-1];
   ok(got.length===6&&got.indexOf(lv)===(before?got.indexOf(before)+1:0)&&got.filter(id=>id!==lv).join()===saved.join(),'a new group joins at its default place (after '+(before?t.armyGroupLabel(before):'none: the front')+'), the order set kept: '+got.map(lab).join(', '));
   delete P.troops.hum_levy;t.partyRoster(P).groups;ok(t.columnOrder(P,t.marchRows(P)).map(r=>r.id).join()===saved.join(),'gone again, the order as it was')}
  // ---- saved and loaded; an old save without it: the default
  {const saved=P.army.column.slice();G.mode='world';t.hidePanel();t.saveGame(true,'quick');P.army.column=['x'];t.loadGame('quick');
   ok(JSON.stringify(P.army.column)===JSON.stringify(saved)&&t.columnOrder(P,t.marchRows(P)).map(r=>r.id).join()===saved.join(),'saved and loaded, the order kept');
   const raw=JSON.parse(localStorage.getItem(t.slotKey('quick')));delete raw.P.army.column;localStorage.setItem(t.slotKey('quick'),JSON.stringify(raw));t.loadGame('quick');
   ok(P.army.column===undefined&&t.columnOrder(P,t.marchRows(P)).map(r=>r.id).join()===def().join(),'an old save without one: the default order');
   P.army.column=saved}
  // ---- By road: your column marches in that order, its head group first along the way
  {const {segs:S}=t.artRoadSegs();let Q=null;for(let i=0;i<S.length&&!Q;i+=5){const a=S[i],b=S[i+1],L=Math.hypot(S[i+2]-a,S[i+3]-b);if(L<6)continue;const x=(a+S[i+2])/2,y=(b+S[i+3])/2;if(t.TOWNS.some(h=>Math.hypot(h.x-x,h.y-y)<220)||!t.passable(t.terrAt(x,y)))continue;Q={x,y,hx:(S[i+2]-a)/L,hy:(S[i+3]-b)/L}}
   if(!Q)info('no road found');else{Kit.world({encCool:99});Kit.goTo(Q.x,Q.y);t.setByRoad(true);t.TravelStyle.forget(P);t.MARCH_LAYOUTS.delete(P);t.MARCH_ARMIES.delete(P);const A=t.MarchArmy.of(P);A.face=A.heading=Math.atan2(Q.hy,Q.hx);A.trail.clear();A.sync();
    const col=t.marchLayout(P).column,seq=col?[...new Set(col.T.map(x=>x.row))]:[],want=P.army.column;
    ok(col&&seq.join()===want.join(),'By road on: your column in the order you set ('+seq.map(lab).join(', ')+')');
    const T=A.targets(),fwd=id=>{const m=T.filter(x=>x.row===id).map(x=>(x.x-P.x)*Math.cos(A.heading)+(x.y-P.y)*Math.sin(A.heading));return m.reduce((a,b)=>a+b,0)/m.length},f=want.map(fwd);
    ok(f.every((v,i)=>i===0||v<=f[i-1]+1e-6)&&f[0]>f[1]&&f[0]>f[f.length-1],'its head group first along the way, each next one behind ('+f.map(v=>v.toFixed(1)).join(' > ')+' px)');
    const lord=t.W.lords.find(l=>!l.dead);if(lord){lord.army=lord.army||{};lord.army.column=[...t.marchRows(lord).map(r=>r.id)].reverse();const rows=t.marchRows(lord);ok(t.columnOrder(lord,rows).map(r=>r.id).join()===rows.slice().sort((a,b)=>b.x-a.x).map(r=>r.id).join(),'an AI army keeps the battle-style order');delete lord.army.column}
    t.setByRoad(false);t.TravelStyle.forget(P)}}
  // ---- the phone (844 × 390) and the desktop: the tab and both views fit; Esc follows the bar
  for(const [w,h] of [[844,390],[1280,800],[390,844]]){scr.style.cssText=original+';width:'+w+'px;height:'+h+'px';const at=w+' × '+h;
   for(const view of ['field','column']){open();t.act('march-view',view);t.marchBind();const c=q(view==='field'?'#marchCanvas':'#columnCanvas'),b=c.getBoundingClientRect(),side=q('.march-side'),bs=qa('.fb-march-pane button').filter(shown);
    p.style.animation='none';
    ok(inside(c)&&b.width>(w>650?400:300)&&b.height>=(w>650&&h>500?200:150)&&p.scrollWidth<=p.clientWidth+1&&qa('.nav .btn').every(inside),view+' '+at+': its preview '+Math.round(b.width)+' × '+Math.round(b.height)+', the frame and its bar fit');
    ok(bs.every(e=>e.getBoundingClientRect().height>=43.5),view+' '+at+': every control at least 44 px high ('+bs.filter(e=>e.getBoundingClientRect().height<43.5).map(e=>e.textContent.trim()).join(', ')+')');
    {const sc=side.querySelector('.fb-scroll'),last=[...sc.querySelectorAll('button')].pop(),apply=side.querySelector('.march-commit .primary');last.scrollIntoView({block:'nearest'});const s=sc.getBoundingClientRect(),e=last.getBoundingClientRect();
     ok(e.bottom<=s.bottom+1&&e.top>=s.top-1&&inside(apply)&&shown(apply),view+' '+at+': its last control scrolls into view; Apply always in sight, under the list')}
    ok(qa('[data-act="char-tab"]').every(e=>inside(e)&&e.scrollWidth<=e.clientWidth+1),view+' '+at+': the five tabs fit, their words whole')}
   const nb=q('.nav [data-nav="back"]');ok(nb&&nb.dataset.act==='fb-menu'&&q('.nav [data-nav="close"]').textContent==='Back to map',at+': the bar, Back (to the Game Menu) and Back to map');
   esc();ok(G.mode==='esc'&&G.esc.page==='menu',at+': Esc follows the bar, the Game Menu');esc();ok(G.mode==='world',at+': and resumes')}
  scr.style.cssText=original;
  // ---- opened afresh, the draft dropped
  {open();t.act('march-view','column');const id=G.column.ids()[2];t.act('march-col-pick',id);t.act('march-col-step','-1');ok(G.column.changed(),'a change not applied');Kit.world();open();ok(!G.column.changed()&&G.column.ids().join()===P.army.column.join(),'the window opened again: the saved order, the draft dropped');Kit.world()}
  ok(!ERR.length,'no runtime errors');
 }finally{window.HTMLElement.prototype.setPointerCapture=cap;scr.style.cssText=original}
});
