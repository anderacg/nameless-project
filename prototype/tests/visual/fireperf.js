'use strict';
// Not a test (run by name: -Suites visual/fireperf): what fire costs (gfx/fire.js), its new look (FLAMES.on) against the old, on
// the same frames. The world map at night at a phone's 844 x 390 @3, three lords' armies marching by you (about 30 torches) and
// four camps' fires in view (drawWorld whole); a lab battle of bowmen loosing fire arrows (drawBattle whole, the simulation
// stepped between frames, untimed: the same steps either way). Each frame timed to a pixel read back. Headless Chrome draws in
// software (--disable-gpu): read the ratios
window.RUN=()=>{const o=[],t=T,G=t.G,P=t.P,W=t.W,L=t.BattleLab,F=t.FLAMES,on0=F.on;
 const stats=ms=>{const s=[...ms].sort((a,b)=>a-b);return (ms.reduce((a,b)=>a+b,0)/ms.length).toFixed(2)+' ms  median '+s[s.length>>1].toFixed(2)+'  p90 '+s[Math.floor(s.length*.9)].toFixed(2)};
 // (old and new frame by frame in turn, each its own times, so the page's drift falls on both alike)
 const pair=(name,warm,n,f)=>{const fl=()=>t.ctx.getImageData(0,0,1,1),ms={false:[],true:[]};for(let i=0;i<warm+2*n;i++){const on=!!(i&1);F.on=on;const a=performance.now();f();fl();if(i>=warm)ms[on].push(performance.now()-a)}
   for(const on of [false,true])o.push('INFO '+(name+', fire '+(on?'new':'old')).padEnd(48)+stats(ms[on]))};
 try{
  window.requestAnimationFrame=()=>0;t.act('begin','soldier');G.mode='world';G.modal=false;t.hidePanel();G.encCool=1e9;G.quietEvents=true;G.clock=t.DAY*.8;
  (0,eval)('VW=844;VH=390;VS=3');t.WORLD_BATTLE.on=true;
  let spot=null;for(let ty=12;ty<t.MH-12&&!spot;ty++)for(let tx=12;tx<t.MW-12&&!spot;tx++){const x=(tx+.5)*16,y=(ty+.5)*16;if(t.tAt(tx,ty)===t.T_OPEN&&t.tAt(tx+3,ty)===t.T_OPEN&&t.TOWNS.every(z=>Math.hypot(z.x-x,z.y-y)>200))spot=[x,y]}
  P.x=spot[0];P.y=spot[1];P.tx=null;
  const lords=W.lords.filter(l=>!l.dead).slice(0,3);lords.forEach((l,i)=>{Object.assign(l,{inside:null,fight:null,x:P.x-70+i*70,y:P.y+(i%2?30:-30)});l.army={nextId:1,groups:[]};l.tc={hum_bow:50,hum_foot:20};l.changed()});
  const camps=W.sites.filter(s=>t.siteSprite(s).fire&&!s.cleared).slice(0,4);camps.forEach((s,i)=>{s.x=P.x-150+i*100;s.y=P.y+90;s.seen=true});t.reveal();
  t.frame();const torches=lords.reduce((a,l)=>{const A=t.MarchArmy.of(l),R=t.marchRoles(A);return a+A.units.filter(u=>R.get(u)?.torch).length},0);
  o.push('INFO map at night: '+lords.reduce((a,l)=>a+t.MarchArmy.of(l).units.length,0)+' men marching, '+torches+' torches, '+camps.length+' camps\' fires; darkness '+t.Clock.darkness().toFixed(2));
  t.drawWorld();pair('map at night ('+(0,eval)('LIGHTQ').length+' lights)',30,150,()=>t.drawWorld())
  // ---- a battle of fire arrows
  Kit.kits(false,()=>{const cfg={leftGroups:[{type:'hum_bow',count:30},{type:'hum_bow',count:30}],rightGroups:[{type:'hum_foot',count:40}],morale:true,deploy:false,paused:true,ai:true,seed:42};
   try{L.start(cfg);const B=t.B;B.paused=false;let k=0;while((t.WARM.q.length||t.WARM.b.length)&&k++<4000)t.warmStep();
    for(const id of t.playerGroups())B.groups[id].useAbility('fire');const step=()=>{if(!L.session.result)t.updateBattle(1/60)};for(let i=0;i<120;i++)step();
    t.camReset();
    // (the same moment drawn both ways, many arrows in the air: the field held still)
    for(let i=0;i<400&&B.arrows.filter(a=>a.src&&a.src.fireArrow).length<30;i++)step();const lit=B.arrows.filter(a=>a.src&&a.src.fireArrow).length;
    pair('battle ('+lit+' fire arrows in the air)',20,120,()=>t.drawBattle())
    }
   finally{if(L.active)L.exit()}});
  o.push('PASS fire performance report completed');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 finally{F.on=on0}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
