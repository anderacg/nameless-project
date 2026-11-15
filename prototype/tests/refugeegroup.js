'use strict';
// Refugees as a group, and every walker in at the gate (the owner, 2026-11-15: "remove all numbers from refugee and etc. but why don't
// you make them like army group but just a group of refugee", "the refugee should give player peasant troops instead of spearman",
// "if there's item on ground and not picked yet, make sure we have a glowing or something noticeable", "make sure the refugee and
// all characters from quest, events etc enter the building like army do"): refugees marched as an army is, each of them his own
// figure (their people's peasants, their tools on their backs), no count over them but in dev mode; their volunteers your peasants;
// at their refuge in at its gate a man after another; a road's walker in at a gate itself, fading; a thing lying to be taken glows.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;G.paused=false;t.WORLD_BATTLE.on=true;
 const home=Kit.goHome('Ashford'),to=t.TOWNS.find(h=>h!==home&&!h.T.walls)||t.TOWNS[1];Kit.goTo(home.x+120,home.y+80);
 const r=t.asRefugees({rf:true,from:home.name,to:to.name,n:9,why:'sacked',race:'human',goods:{},purse:5,x:P.x-40,y:P.y,dir:1,cool:0});W.refugees=[r];
 for(let i=0;i<10;i++)t.updateWorld(.05);t.frame();const a=t.MARCH_ARMIES.get(r),pk=t.peasantLevy('human');
 ok(t.marchOwners().includes(r)&&a&&a.units.length===9&&a.units.every(u=>u.type===pk)&&!t.marchLook(a.units[0],r).weapon,'refugees marched as an army: each of the 9 his own figure, '+t.ST[pk].n+', his tools on his back ('+a.units.length+' men)');
 // (standing, a loose clump, no ranks (FORMS.huddle); on a long way, a close, straggling column (TRAVEL_STYLES.crowd); afraid,
 //  the clump again; children and elders among them: the owner, 2026-11-15, "using child or old sprites", "a refugee formation where
 //  they tend to stick together", "refugees should marching unorganized formation and again when traveling they may be in column
 //  just sticking to each other")
 {const sl=t.formSlots('huddle',9,0),xs=new Set(sl.map(q=>q[0].toFixed(1))),nn=Math.min(...sl.map((q,k)=>Math.min(...sl.filter((_,m)=>m!==k).map(w=>Math.hypot(w[0]-q[0],w[1]-q[1]))))),far=Math.max(...sl.map(q=>Math.hypot(q[0],q[1])));
  ok(xs.size===9&&nn>=4&&far<=26,'standing, a loose clump: no two of 9 in a rank, each '+nn.toFixed(1)+' px or more from the next, all within '+far.toFixed(1)+' px of their middle');
  t.TravelStyle.forget(r);t.MARCH_ARMIES.delete(r);for(let i=0;i<10;i++)t.updateWorld(.05);const L=t.marchLayout(r),C=L.column,by=C?C.T.reduce((m,q)=>(m[q.rank]=(m[q.rank]||0)+1,m),{}):{},ab=Object.values(by),gap=C&&C.s.length>1?(C.len/(C.s.length-1)):0;
  ok(t.TravelStyle.column(r)&&C&&Math.max(...ab)===3&&Math.min(...ab)===1&&C.T.some(q=>q.off)&&gap<14,'on their long way, a column of them sticking together: '+ab.length+' ranks of 1 to 3 abreast ('+ab.join(',')+'), '+gap.toFixed(1)+' px apart, each a little off his place');
  const bd=t.asParty({kind:'bandits',troops:Array(6).fill('militia'),x:r.x+70,y:r.y,cool:0});t.bandits.push(bd);t.TravelStyle.forget(r);const scared=!t.TravelStyle.column(r);t.bandits.splice(t.bandits.indexOf(bd),1);t.TravelStyle.forget(r);
  ok(scared,'bandits near: out of the column, into their clump');
  for(let i=0;i<10;i++)t.updateWorld(.05);const sc=[],df=window.drawFig;
  try{window.drawFig=function(s,x,y,f,k){sc.push(k||1);return df.apply(this,arguments)};t.frame()}finally{window.drawFig=df}const who=a.units.map(u=>t.REFUGEE_FOLK[u.id%t.REFUGEE_FOLK.length]);
  ok(t.marchLayout(r).rows.every(q=>q.form==='huddle')&&sc.some(k=>k<1)&&sc.some(k=>k===1)&&who.includes('child')&&who.includes('elder'),'children drawn smaller ('+sc.filter(k=>k<1).length+' of '+sc.length+') and elders among them')}
 const words=[],tx0=window.txt;try{window.txt=function(s){words.push(String(s));return tx0.apply(this,arguments)};t.prefSet('dev',false);t.frame();const off=words.filter(w=>/Refugees/.test(w)).length;words.length=0;t.prefSet('dev',true);t.frame();const on=words.filter(w=>/Refugees \d+/.test(w)).length;
  ok(!off&&on,'no count over them but in dev mode ('+off+' off, '+on+' on)')}finally{window.txt=tx0;t.prefSet('dev',false)}
 // (their volunteers: your people's peasants)
 {const k0=P.troops[pk]||0;P.troops={};G.modal=false;t.refugeeMeet(r);t.act('rf-recruit');const got=(P.troops[pk]||0)-k0;ok(got>0&&!Object.keys(P.troops).some(k=>k!==pk),'their volunteers join you as '+t.ST[pk].n+' ('+got+'), no spearmen');Kit.world()}
 // (at their refuge: in at its gate, a man after another)
 {const g=t.gateGoal(to);P.x=g.x+30;P.y=g.y+20;r.x=g.x+3;r.y=g.y;t.MARCH_ARMIES.delete(r);t.MarchArmy.of(r);t.GateFile.list=[];for(let i=0;i<4;i++){t.updateWorld(.05)}t.frame();
  const f=t.GateFile.list.find(q=>q.o===r);ok(!W.refugees.includes(r)&&f&&f.men.length>=1,'at their refuge they file in at its gate as an army does ('+(f?f.men.length:0)+' men walking in)')}
 // (a road's walker in at a gate: itself, walked in and fading)
 {const g=t.gateGoal(home),e={x:g.x+8,y:g.y+2,dir:1,drawn:0,draw(ents){this.drawn++;ents.push({y:this.y,f:()=>{}})}};t.GateFile.list=[];t.GateFile.walkIn(e,home);let n=0;for(;n<200&&t.GateFile.list.length;n++){t.GateFile.step(.05);if(n===2){const L=[];t.GateFile.draw(L,G.cam);e.calls=L.length}}
  ok(e.calls===1&&e.drawn>=1&&Math.hypot(e.x-g.x,e.y-g.y)<1&&!t.GateFile.list.length,'a walker drawn by itself (a quest\'s or an event\'s) walks in at the gate, fading, and is gone ('+n+' steps)')}
 // (a thing lying to be taken glows; picked clean, none)
 {const C=t.Carcass,c=t.asCarcass({x:P.x-20,y:P.y,type:'hum_foot',wild:null,mon:null,bst:false,face:1,items:[{k:'good',id:'meat',n:2}],day:G.day,at:G.day});C.list=[c];let n=0;const lg=window.lootGlow;
  try{window.lootGlow=function(){n++;return lg.apply(this,arguments)};t.frame();const full=n;n=0;c.items=[];t.frame();ok(full>=1&&!n&&t.LOOT_GLOW.on,'a carcass with something on it glows ('+full+'), picked clean it does not')}finally{window.lootGlow=lg;C.list=[]}}
});
