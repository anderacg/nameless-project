'use strict';
window.ARENA=true;// (the battle screen's own rules, on its own field: tests/harness.js)
// The arena (gfx/tourney.js TourneyArena; the owner, 2026-11-01: "can you have some small arena battle screen instead of open green
// field?"): a bout in the lists starts in the small ring (its field size, the fighters 120-160 px apart, facing); nobody leaves it
// (the hero pushed at each wall, sent past it, the champion too); its picture follows the holding's culture and climate (different
// keys and pixels); the crowd cheers a hard blow, a man down and the end (and only those), its arms raised near the action and
// heard; drawing it draws no Math.random; the result and rewards as before (won: 45 gold, renown; lost: the fee gone); the cheer and
// the roar are heard (rendered offline); off (TOURNEY_ARENA.on false), today's tournament on the open field.
window.RUN=()=>{const r=Kit.report(),{ok,info}=r,t=T,G=t.G,P=t.P,A=t.TOURNEY_ARENA,ev=s=>(0,eval)(s);
 const keep={random:Math.random,now:performance.now,sfx:window.sfx,sfxAt:window.sfxAt,on:A.on,manual:ev('MANUAL_HERO')};let async=false;
 const lists=()=>t.townBy('Ashford');
 const bout=(more)=>{G.mode='world';G.modal=false;t.hidePanel();G.enc=null;G.town={ref:lists(),tab:'tourney'};t.startBattle(Object.assign({enemies:['chief'],tournament:true},more||{}));return t.B};
 const champOf=B=>B.units.find(u=>u.team===1);
 const done=()=>{const B=t.B;if(!B)return;B.over=true;B.endT=0;B.win=false;B.units.filter(u=>u.team===1).forEach(u=>u.hp=0);t.finishBattle()};
 // (a picture's pixels hashed)
 const pixHash=cv=>{const d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let h=2166136261;for(let i=0;i<d.length;i+=4)h=Math.imul(h^(d[i]|d[i+1]<<8|d[i+2]<<16),16777619)>>>0;return h};
 const paintOf=a=>{const it=a.paintSteps();let n;while(!(n=it.next()).done);return n.value};
 try{
  Kit.begin('soldier',7);G.quietEvents=true;t.GUIDE.on=false;P.gold=100;
  // ---- the bout starts in the small ring
  let B=bout();const h=B.hero,ch=champOf(B),S=t.FIELD_SIZES;
  ok(B.arena instanceof t.TourneyArena&&t.BFIELD&&t.BFIELD.key==='tourney'&&t.BW===S.tourney.w&&t.BH===S.tourney.h,'a tournament bout opens in the arena: its own field size ('+t.BW+'x'+t.BH+', FIELD_SIZES.tourney) though sizes are off here');
  ok(t.BW*t.BH<=S.small.w*S.small.h/4,'a small ring: '+Math.round(t.BW*t.BH/(S.small.w*S.small.h)*100)+'% of the small field');
  const gap=ch.x-h.x;ok(gap>=120&&gap<=160&&Math.abs(ch.y-h.y)<2,'the fighters start '+Math.round(gap)+' px apart, level with each other');
  ok(h.face===1&&ch.face===-1&&B.groups[h.grp].face===0&&Math.abs(B.groups[ch.grp].face-Math.PI)<1e-9,'facing each other');
  ok(B.ftop===B.arena.top&&B.fbot===B.arena.bot&&B.ftop>=A.ring[0]&&B.fbot<=A.ring[1]&&[h,ch].every(u=>u.y>=B.ftop&&u.y<=B.fbot),'the fighting rows are the ring\'s ('+B.ftop+'-'+B.fbot+')');
  ok(B.units.length===2&&!B.fog&&!B.obs.length&&!B.terrain&&B.noMorale,'still one on one: no warband, no fog, no obstacles, no terrain, no morale');
  {const z=t.camFit();ok(z===Math.min(t.BVW/t.BW,t.BVH/t.BH)&&z>1.5,'the camera fits it as any field, close in (×'+z.toFixed(2)+')')}
  {const a=new t.TourneyArena({}),R=a.ring({top:44,bot:204});ok(R.top===A.ring[0]&&R.bot===204,'a phone\'s taller HUD shortens the ring from below ('+R.top+'-'+R.bot+'), never past its measured edges')}
  // ---- nobody leaves the ring
  {ev('MANUAL_HERO=true');t.beginFight();const c=champOf(t.B);let lo={x:1e9,y:1e9},hi={x:-1e9,y:-1e9},out=0;
   const run=(keys,sec)=>{G.keys=keys;for(let i=0;i<sec/.02;i++){if(!t.B)break;h.hp=Math.max(h.hp,h.max*.8);c.hp=c.max;t.updateBattle(.02);
     for(const u of [h,c]){if(u.x<8||u.x>t.BW-8||u.y<t.B.ftop||u.y>t.B.fbot)out++}lo={x:Math.min(lo.x,h.x),y:Math.min(lo.y,h.y)};hi={x:Math.max(hi.x,h.x),y:Math.max(hi.y,h.y)}}};
   run({a:true},5);run({w:true},3);run({a:true,w:true},2);run({d:true},10);run({s:true},4);run({d:true,s:true},2);G.keys={};
   ok(!out&&lo.x<=10&&lo.y<=t.B.ftop+1&&hi.x>=t.BW-10&&hi.y>=t.B.fbot-1,'pushed at each wall for 26 s the hero reaches it and goes no further (x '+Math.round(lo.x)+'-'+Math.round(hi.x)+', y '+Math.round(lo.y)+'-'+Math.round(hi.y)+'), nor does the champion'+(out?': '+out+' steps outside':''));
   const g=t.B.groups[h.grp];g.standAt(-400,-400);ok(g.ax>=8&&g.ay>=t.B.ftop,'an order past the wall stops at it ('+Math.round(g.ax)+', '+Math.round(g.ay)+')');ev('MANUAL_HERO='+keep.manual)}
  done();
  // ---- its look follows the holding's culture and climate
  {const want={'Ashford':['vale','grass'],'Karn Hold':['karn',null],'Greywell':['ashgor','desert'],'Elderglen':['sylvan',null],'Dunrak':['karn','frost']},bad=[];
   for(const [n,[c,cl]] of Object.entries(want)){const h0=t.townBy(n);if(!h0){bad.push(n+' missing');continue}const o=t.TourneyArena.optsOf(h0);
     if(o.culture!==c||cl&&o.climate!==cl||o.col!==t.FACS[h0.owner].col)bad.push(n+' '+o.culture+'/'+o.climate+'/'+o.col)}
   ok(!bad.length,'a holding\'s arena: its culture\'s walls, its climate\'s sand, its lord\'s colours ('+Object.keys(want).join(', ')+')'+(bad.length?': '+bad.join('; '):''))}
  {const looks=[['vale','grass'],['karn','frost'],['ashgor','desert'],['sylvan','swamp'],['league','grass'],['vale','frost']],keys=new Set(),pics=new Set(),kinds=new Set();
   for(const [culture,climate] of looks){const a=new t.TourneyArena({culture,climate,col:t.FACS.karn.col,dev:'karn',seed:5});a.ring({top:0,bot:999});paintOf(a);keys.add(a.key);pics.add(pixHash(a.cv));kinds.add(a.style.kind)}
   ok(keys.size===looks.length&&pics.size===looks.length&&kinds.size===3,'each culture and climate its own picture: '+keys.size+' keys, '+pics.size+' different pictures, walls of '+[...kinds].join(', '))
   const a=new t.TourneyArena({culture:'vale',climate:'grass',col:t.FACS.karn.col,dev:'karn',seed:5}),b=new t.TourneyArena({culture:'vale',climate:'grass',col:t.FACS.vale.col,dev:'vale',seed:5});a.ring({top:0,bot:999});b.ring({top:0,bot:999});
   paintOf(a);paintOf(b);ok(a.key!==b.key&&pixHash(a.cv)!==pixHash(b.cv)&&a.flags.every(f=>f.b.col===t.FACS.karn.col),'its lord\'s colours on its hangings and banners ('+a.flags.length+' flags)');
   const a2=new t.TourneyArena(a.o);a2.ring({top:0,bot:999});paintOf(a2);ok(a2.cv===a.cv,'a picture painted once and kept by its key')}
  // ---- the crowd reacts to a hard blow (and only to one), a man down, the end
  B=bout();{const C=B.arena.crowd,c=champOf(B),heard=[];window.sfx=n=>{heard.push(n);return false};window.sfxAt=n=>{heard.push(n);return false};
   C.watch(100);ok(C.cheers.length===1&&C.cheers[0].all&&heard.join()==='cheer','the crowd greets the fighters as the bout opens');
   c.hp-=c.max*.02;C.watch(200);ok(C.cheers.length===1,'a light blow: no cheer');
   const last=()=>C.cheers[C.cheers.length-1];c.hp-=c.max*.3;C.watch(200.05);const ch2=last();ok(ch2&&ch2.t===200.05&&Math.abs(ch2.x-c.x)<1&&ch2.p>=.5&&heard.length===2&&heard[1]==='cheer','a hard blow (30% of his health): a cheer where it landed, heard (strength '+(ch2&&ch2.p.toFixed(2))+')');
   const near=C.level(c.x,200.3),side=C.level(c.x+(c.x>t.BW/2?-50:50),200.3),far=C.level(c.x+400,200.3),later=C.level(c.x,203);
   ok(near>.4&&side<near&&far===0&&later===0,'its wave: strongest where it landed ('+near.toFixed(2)+'), less along the stands ('+side.toFixed(2)+'), none far off or once it has passed');
   // (the arms drawn: the stands in view with the cheer, and without it, at the same moment)
   const [MX,MY]=A.margin,draw=(cheer)=>{const cv=t.mkc(t.BW+2*MX,t.BH+2*MY,()=>{}),g=cv.getContext('2d');const was=C.cheers;if(!cheer)C.cheers=[];performance.now=()=>200300;
     g.save();try{g.translate(MX,MY);B.arena.drawView(g,-MX,-MY,t.BW+MX,t.BH+MY)}finally{g.restore();C.cheers=was;performance.now=keep.now}return cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data};
   const on=draw(true),off=draw(false),W=t.BW+2*MX,diff=(x0,x1)=>{let n=0;for(let y=0;y<MY+B.arena.top-16;y++)for(let x=x0+MX;x<x1+MX;x++){const i=(y*W+x)*4;if(on[i]!==off[i]||on[i+1]!==off[i+1])n++}return n};
   const dn=diff(Math.round(c.x-60),Math.round(c.x+60)),df=diff(c.x>t.BW/2?-MX:t.BW+MX-120,c.x>t.BW/2?-MX+120:t.BW+MX);
   ok(dn>40&&df===0,'arms raised in the stands near the blow ('+dn+' pixels changed), none at the far end');
   c.down=1;C.watch(300);ok(last().t===300&&heard.length===3,'a man knocked down: a cheer');C.watch(300.1);ok(heard.length===3,'once, while he lies');c.down=0;
   c.hp=0;C.watch(400);ok(last().t===400&&last().p>1&&heard.length===4,'a man felled: a big cheer');
   B.over=true;C.watch(401);ok(last().t===401&&last().all&&heard.length===5&&heard[4]==='roar','the end: the whole crowd roars, heard');C.watch(402);ok(heard.filter(n=>n==='roar').length===1,'once');
   window.sfx=keep.sfx;window.sfxAt=keep.sfxAt;B.over=false;c.hp=c.max}
  // ---- drawing it draws no Math.random
  {let calls=0;const inner=keep.random;Math.random=()=>{calls++;return inner()};const a=B.arena,C=a.crowd,c=champOf(B),[MX,MY]=A.margin,cv=t.mkc(t.BW,t.BH,()=>{}),g=cv.getContext('2d');
   try{t.TOURNEY_PICS.clear();const b=new t.TourneyArena({culture:'karn',climate:'frost',col:t.FACS.karn.col,dev:'karn',seed:9});b.ring({top:40,bot:300});paintOf(b);paintOf(a);
     for(let i=0;i<40;i++){performance.now=()=>500000+i*50;if(i===10)c.hp-=c.max*.25;if(i===20)B.over=true;a.drawView(g,-MX,-MY,t.BW+MX,t.BH+MY);b.drawView(g,0,0,t.BW,t.BH)}}
   finally{Math.random=inner;performance.now=keep.now;B.over=false}
   ok(calls===0,'painting it, drawing 40 frames of it and the crowd watching (a hard blow, the end) draw no Math.random ('+calls+')')}
  // ---- the time it takes
  {t.TOURNEY_PICS.clear();const a=new t.TourneyArena({culture:'vale',climate:'grass',seed:3});a.ring({top:44,bot:216});let t0=keep.now.call(performance);paintOf(a);const paint=keep.now.call(performance)-t0;
   const C=a.crowd,cv=t.mkc(640,384,()=>{}),g=cv.getContext('2d');C.b=B;C.cheer(t.BW/2,1.4,1000,true);t0=keep.now.call(performance);
   for(let i=0;i<60;i++){performance.now=()=>1000000+i*16;a.drawView(g,-96,-64,t.BW+96,t.BH+64)}performance.now=keep.now;const frame=(keep.now.call(performance)-t0)/60;
   info('perf: painting an arena '+paint.toFixed(1)+' ms (once a town: kept), a frame of it with the whole crowd roaring '+frame.toFixed(2)+' ms ('+a.seats.length+' seats)');ok(frame<8,'a frame of it, the crowd roaring, under 8 ms ('+frame.toFixed(2)+')')}
  done();
  // ---- the result and rewards as before
  for(const win of [true,false]){P.gold=100;P.renown=30;G.town={ref:lists(),tab:'tourney'};t.PLACES.tourney.entry.perform(G.town.ref);B=t.B;
   const fee=P.gold===90&&B&&B.arena instanceof t.TourneyArena;B.win=win;B.over=true;B.endT=0;B.hero.hp=win?B.hero.max:0;B.units.filter(u=>u.team===1).forEach(u=>{if(win)u.hp=0});t.finishBattle();
   const html=document.getElementById('panel').innerHTML;
   ok(fee&&!t.B&&t.BH===t.FIELD_H&&!t.BFIELD&&P.gold===(win?135:90)&&P.renown===(win?36:30)&&G.lootView.next==='back-town'&&html.includes(win?'Champion':'Beaten'),(win?'won: 45 gold and renown':'lost: the fee gone')+', back to the town, the field back to today\'s (gold '+P.gold+', renown '+P.renown+')');
   t.hidePanel();G.mode='world';G.modal=false}
  // ---- off: today's tournament
  {A.on=false;B=bout();ok(!(B.arena instanceof t.TourneyArena)&&!t.BFIELD&&t.BH===t.FIELD_H&&t.BW>=t.FIELD_W.min&&B.ftop===t.fieldTop()&&B.fbot>A.ring[1]&&!B.arena.seats,'TOURNEY_ARENA.on false: the open field as today ('+t.BW+'x'+t.BH+', the climate\'s ground; rows '+B.ftop+'-'+B.fbot+', '+(B.arena&&B.arena.constructor.name)+')');done();A.on=keep.on}
  // ---- heard: the cheer and the roar, rendered offline
  {const AU=t.AUDIO,SR=22050,res=[];async=true;
   const one=n=>{const real=new OfflineAudioContext(2,Math.ceil(SR*4),SR);t.audioStop();AU.on=true;t.audioStart(real);const played=t.sfx(n);
     return real.startRendering().then(b=>{let pk=0;for(let c=0;c<b.numberOfChannels;c++){const d=b.getChannelData(c);for(let i=0;i<d.length;i++)pk=Math.max(pk,Math.abs(d[i]))}res.push([n,played,pk,t.SFX[n].g])})};
   one('cheer').then(()=>one('roar')).then(()=>{ok(res.every(([n,p,pk,g])=>p&&pk>.02&&pk<=1&&g==='battle'),'the crowd heard: '+res.map(([n,p,pk])=>n+' '+(20*Math.log10(Math.max(1e-9,pk))).toFixed(1)+' dBFS').join(', ')+' (battle cues, never past full scale)')})
     .catch(e=>r.exc(e)).finally(()=>{try{t.audioStop();AU.on=false}catch(e){}r.out()})}
 }catch(e){r.exc(e)}
 finally{Math.random=keep.random;performance.now=keep.now;window.sfx=keep.sfx;window.sfxAt=keep.sfxAt;A.on=keep.on;ev('MANUAL_HERO='+keep.manual);G.keys={};if(t.B)try{done()}catch(e){}}
 if(!async)r.out()};
