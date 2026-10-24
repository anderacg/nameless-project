'use strict';
// Witnessing follows unit visibility; hearing conveys only a sound and white waves, never identities or a battle result.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,K=t.KNOWLEDGE,D=t.DISTRACTIONS,C=t.DISTRACTION;
 window.requestAnimationFrame=()=>0;Kit.begin('soldier',23);Kit.clear();Kit.world({town:null});G.paused=false;G.dead=false;P.fac=null;
 const oldSight=P.sight,own=Object.hasOwn(P,'sight'),sound=window.sfx,clock=performance.now;
 let V=100,now=1e6;const played=[];
 P.sight=()=>V;window.sfx=(name,o)=>{played.push({name,...o});return false};performance.now=()=>now;
 const ground=k=>{for(let y=105;y<145;y++)for(let x=105;x<145;x++)t.tiles[y*t.MW+x]=k};
 const source=r=>({x:P.x+V*r,y:P.y}),reset=()=>{D.reset();played.length=0;K.reset();G.msgs=[];t.newsLoad(null)};
 const pixels=()=>Array.from(t.ctx.getImageData(0,0,t.VW,t.VH).data),white=a=>{const out=[];for(let i=0;i<a.length;i+=4)if(a[i]>35&&a[i]===a[i+1]&&a[i]===a[i+2])out.push([i/4%t.VW,Math.floor(i/4/t.VW)]);return out};
 try{
  P.x=P.y=2000;ground(t.T_OPEN);W.lords.forEach((l,i)=>Object.assign(l,{inside:null,dead:false,gone:false,fight:null,x:-10000-i*100,y:-10000}));W.patrols=[];W.fights=[];
  for(const r of [.44,.46,.99,1,1.19,1.25,1.251,1.49]){const p=source(r),f=t.asFight({...p,sides:[[],[]]});
   ok(t.wlSees(p)===(r<1)&&f.inView(V)===t.spotted(p,V),'open ground at '+r+'x sight: logging, battle markers and units agree')}
  ground(t.T_FOREST);
  for(const r of [.44,.45,.6,.99,1.1]){const p=source(r),f=t.asFight({...p,sides:[[],[]]});ok(t.wlSees(p)===(r<.45)&&f.inView(V)===t.spotted(p,V),'woodland at '+r+'x sight: logging and battle markers respect unit concealment')}
  ground(t.T_OPEN);ok(!t.wlSees({x:P.x})&&!t.wlSees({x:NaN,y:P.y}),'events without a finite position cannot be witnessed');
  reset();const a=W.lords[0],b=W.lords.find(l=>l.fac!==a.fac),home=t.townBy('Ashford'),p=source(1.1),event={...p,text:a.name+' defeats '+b.name+'.',noise:'battle',news:['lord',home,{lord:a.name,fac:a.fac}],post:false};
  const route=t.worldEvent(event),news=W.news.items.at(-1);
  ok(route==='news'&&!G.msgs.length&&!K.knowsLord(a)&&!K.knowsLord(b)&&!Object.keys(K.lords).length,'a battle in the old witness-only band produces no log, names or last-known report');
  ok(news&&W.news.heard[news.id]==null&&D.active().length===1,'its news stays unheard while one location-only disturbance is emitted');
  ok(played.length===1&&played[0].name==='distantbattle'&&played[0].pan>0&&played[0].vol>0&&played[0].vol<1,'one quiet battle cry is panned toward the source from the army');
  ok(Object.keys(D.active()[0]).sort().join(',')==='t,x,y','a cue stores only its source and start time, without participants or outcome');
  const heard=t.rumourHear(news,{quiet:true,from:'a traveller'});ok(K.knowsLord(a)&&!K.knowsLord(b),'the unheard news can still reveal its actual subject later through a rumour');
  reset();const seen=t.worldEvent({...event,...source(.9)});ok(seen==='seen'&&G.msgs.length===1&&K.knowsLord(a)&&K.knowsLord(b)&&!D.active().length,'a truly visible event is witnessed normally, without an unseen-sound cue');
  reset();t.worldEvent({...event,...source(1.1),mine:true,post:true});ok(!G.msgs.length&&W.news.post.length===1&&D.active().length===1,'a heard but unseen event of yours still queues its existing delayed report');
  reset();t.worldEvent({...event,...source(1.1),involved:true});ok(G.msgs.length===1&&!D.active().length,'your own participation remains immediately known without a distraction');
  reset();t.worldEvent({...source(1.1),text:'A treaty was signed.'});ok(!D.active().length&&!played.length,'quiet political or informational events do not emit battle sounds');
  reset();ok(D.notice(source(1.25),'battle')&&!D.notice(source(1.251),'battle'),'hearing ends at exactly 1.25x the current sight, not the old 1.5x range');
  reset();ok(!D.notice(source(.99),'battle')&&!played.length,'visible sources do not create the beyond-sight cue');
  ground(t.T_FOREST);ok(D.notice(source(.6),'battle')&&!t.wlSees(source(.6)),'a concealed source may be heard without becoming visible');ground(t.T_OPEN);
  reset();D.notice(source(1.1),'battle');D.notice({...source(1.1),x:P.x+V*1.1+4},'raid');ok(played.length===1&&D.active().length===1,'nearby start, join and result reports coalesce instead of stacking cries');
  now+=C.life*1000+1;ok(!D.active().length&&!D.notice(source(1.1),'battle'),'the wave expires before its sound can repeat');
  now+=C.gap*1000;ok(D.notice(source(1.1),'battle')&&played.length===2,'an ongoing source can sound again after its cooldown');
  V=200;ok(!D.active().length,'increasing actual sight removes a cue once the source becomes visible');
  V=50;ok(!D.notice({x:P.x+70,y:P.y},'battle'),'reduced sight also reduces hearing range');V=100;
  reset();G.mode='journal';ok(!D.notice(source(1.1),'battle')&&!D.active().length,'no new cues are queued while another window is open');G.mode='world';
  G.paused=true;ok(!D.notice(source(1.1),'battle'),'paused simulation produces no new sound');G.paused=false;
  t.WORLD_LOG.on=false;ok(!D.notice(source(1.1),'battle'),'the existing world-log compatibility switch disables the new cue');t.WORLD_LOG.on=true;
  reset();D.notice(source(1.1),'battle');const cam={x:P.x-t.VW/2,y:P.y-t.VH/2},draw=(c,at,rm)=>{t.ctx.globalAlpha=1;t.ctx.fillStyle='#000';t.ctx.fillRect(0,0,t.VW,t.VH);t.wuiDistractions(c,at,rm);return pixels()};
  const first=draw(cam,now+450,false),wp=white(first);ok(wp.length>10&&wp.every(([x,y])=>Math.abs(x-(t.VW/2+110))<35&&Math.abs(y-t.VH/2)<25),'white waves originate at the unseen source, not at the player');
  ok(first.join(',')!==draw(cam,now+900,false).join(','),'waves expand outward over time');
  const still=draw(cam,now+450,true);ok(still.join(',')===draw(cam,now+900,true).join(','),'reduced motion holds the white source wave still');
  const edgeCam={x:P.x-t.VW+70,y:P.y-t.VH/2},ep=white(draw(edgeCam,now+450,false));ok(ep.length>10&&ep.every(([x])=>x>t.VW-60),'offscreen waves roll in from the source edge like an encounter');
  ok(t.ctx.globalAlpha===1,'drawing restores alpha for later UI');
  P.x-=1000;ok(!D.active().length,'leaving hearing range removes the old source cue');P.x+=1000;
  reset();for(let i=0;i<C.max+3;i++){const a=i*6.2832/(C.max+3);D.notice({x:P.x+110*Math.cos(a),y:P.y+110*Math.sin(a)},'battle')}
  ok(D.cues.size<=C.max&&D.last.size<=C.max*4,'dense nearby events keep bounded runtime cue and cooldown lists');
  // Real fight hooks: ride into range of one already under way; its end remains unheard knowledge.
  reset();const q=source(1.3);Object.assign(a,{x:q.x-5,y:q.y,troops:Array(8).fill('hum_spear')});Object.assign(b,{x:q.x+5,y:q.y,troops:Array(8).fill('hum_spear')});
  const fight=t.startFight([a],[b]);ok(!D.active().length&&!G.msgs.length,'a fight starting outside hearing produces neither a wave nor a log');
  P.x+=20;t.updateFights(0);ok(D.active().length===1&&played.length===1&&!K.knowsLord(a)&&!K.knowsLord(b),'riding within earshot of an ongoing battle produces only the sound cue');
  t.endFight(fight,0);ok(!G.msgs.length&&!K.knowsLord(a)&&!K.knowsLord(b),'an unseen battle result and rout do not leak names or outcomes');
  info('sound range '+C.range+'x; white '+C.col+'; '+C.life+'s waves; '+C.gap+'s cooldown');
 }finally{if(own)P.sight=oldSight;else delete P.sight;window.sfx=sound;performance.now=clock;t.WORLD_LOG.on=true;D.reset()}
 Kit.begin('soldier',23);ok(!D.cues.size&&!D.last.size,'a new campaign clears runtime disturbances and cooldowns');
});
