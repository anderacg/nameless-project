'use strict';
// The weather (world/weather.js Weather, data/weather.js WEATHER, gfx/weather.js WeatherArt): off (the harness's, as every other suite
// runs) the old way and nothing saved; on, each region's weather of its climate's kinds only (no sandstorm in the frost, no blizzard in
// the desert), changing over the hours in fronts that last, the same from the same game; its effects on the map (travel, sight) and
// in a battle (pace, reach, aim, sight); drawn and shown on the day bar; saved and loaded (an old save without it loads); the road's
// weather incidents only in their weather; the story's context and the older readers (tracks, birds) read it.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,WX=t.WEATHER,Wx=t.Weather,K=t.WEATHER_KINDS;
 Kit.begin('soldier',1);Kit.world();
 // ---- off (the harness's): the old way
 {const fx=Wx.at(P.x,P.y)===(t.climAt(P.x,P.y)==='frost'?'snow':'clear');
  ok(!WX.on&&fx&&t.ambWeather()===Wx.at(P.x,P.y)&&Wx.speed(P.x,P.y)===1&&Wx.sight(P.x,P.y)===1&&!('weather' in t.Saves.save()),'off: the old weather (snow in the frost, clear elsewhere), nothing slowed, nothing saved')}
 const base={speed:t.speedAt(P.x,P.y),vis:t.visMulAt(P.x,P.y)};
 const h0=[G.day,G.clock],hour=n=>{for(let i=0;i<n;i++){G.clock+=t.DAY/24;if(G.clock>=t.DAY){G.clock-=t.DAY;G.day++}Wx.hour()}};
 WX.on=true;
 try{
  ok(t.Systems.names('hour')[0]==='weather','the weather turns first in the hour: '+t.Systems.names('hour').join(', '));
  // ---- kinds by climate, over 600 hours
  const g=Wx.cells(),clim=i=>t.CLIMS[g.c[i]],allowed=i=>WX.climates[clim(i)]||{},bad=[],seen={},runs=[],last=new Int32Array(g.k.length).fill(-1);let changes=0;
  const look=()=>{for(let i=0;i<g.k.length;i++){const k=K[g.k[i]];if(!(allowed(i)[k]>0))bad.push(clim(i)+': '+k);(seen[clim(i)]||(seen[clim(i)]=new Set())).add(k)}};
  look();
  const startK=Uint8Array.from(g.k);
  for(let h=1;h<=600;h++){const k0=Uint8Array.from(g.k),u0=Int32Array.from(g.u);hour(1);
   for(let i=0;i<g.k.length;i++)if(g.u[i]!==u0[i]){if(last[i]>=0)runs.push(h-last[i]);last[i]=h;if(g.k[i]!==k0[i])changes++}look()}
  const climates=Object.keys(seen);
  ok(!bad.length,'every region\'s weather is one of its climate\'s kinds over 600 hours ('+g.w+' x '+g.h+' regions; climates '+climates.join(', ')+')'+(bad.length?': '+[...new Set(bad)].slice(0,6).join('; '):''));
  ok(!seen.frost||!seen.frost.has('sandstorm')&&!seen.frost.has('heat'),'no sandstorm nor heat wave in the frost'+(seen.frost?' (seen there: '+[...seen.frost].join(', ')+')':' (no frost region)'));
  ok(!seen.desert||!seen.desert.has('blizzard')&&!seen.desert.has('snow'),'no blizzard nor snow in the desert'+(seen.desert?' (seen there: '+[...seen.desert].join(', ')+')':' (no desert region)'));
  ok(climates.every(c=>seen[c].size>=3),'each climate sees several kinds: '+climates.map(c=>c+' '+[...seen[c]].join('/')).join('; '));
  ok(changes>g.k.length*5,'the weather changes over the hours: '+changes+' changes in 600 hours over '+g.k.length+' regions');
  const minRun=Math.min(...runs),mean=runs.reduce((a,b)=>a+b,0)/runs.length;
  ok(runs.length&&minRun>=Math.min(...K.map(k=>WX.kinds[k].hours[0]))&&mean>=3,'fronts last hours: at least '+minRun+', '+mean.toFixed(1)+' on average');
  // the same game, the same weather (the stream 'weather': core/rng.js, never Math.random)
  {const after=Uint8Array.from(g.k);G.day=h0[0];G.clock=h0[1];Wx.reset();t.Rng.streams.delete('weather');const g2=Wx.cells();
   const same0=g2.k.every((v,i)=>v===startK[i]);const r0=Math.random;let drew=0;Math.random=()=>{drew++;return r0()};try{hour(600)}finally{Math.random=r0}
   ok(same0&&g2.k.every((v,i)=>v===after[i])&&!drew,'the same game makes the same weather, hour by hour, drawing no Math.random')}
  // ---- effects on the map
  {const at=(k,f)=>{Wx.set(P.x,P.y,k);return f()},row=[];let good=true;
   for(const k of K){const W=WX.kinds[k],s=at(k,()=>t.speedAt(P.x,P.y)),v=at(k,()=>t.visMulAt(P.x,P.y));row.push(k+' '+(s/base.speed).toFixed(2)+'/'+(v/base.vis).toFixed(2));
    if(Math.abs(s-base.speed*W.speed)>1e-9||Math.abs(v-base.vis*W.sight)>1e-9)good=false}
   ok(good,'on the map, travel and sight by the weather (× speed / × sight): '+row.join(', '));
   ok(WX.kinds.rain.speed<1&&WX.kinds.snow.speed<1&&WX.kinds.blizzard.speed<=.6&&WX.kinds.sandstorm.speed<=.6&&WX.kinds.fog.sight<=.5&&WX.kinds.blizzard.sight<=.5&&WX.kinds.sandstorm.sight<=.5,'rain and snow slower; a blizzard and a sandstorm much slower and short-sighted; fog short-sighted');
   const m=WX.kinds.blizzard.speed,c=t.climAt(P.x,P.y);
   ok(Math.abs(at('blizzard',()=>Wx.speed(P.x,P.y,c,[c]))-(1-(1-m)*WX.home))<1e-9,'at home in the climate, only half the loss ('+(1-(1-m)*WX.home).toFixed(3)+' for '+m+')')}
  // ---- the older readers: the story's context, the tracks, the birds
  {Wx.set(P.x,P.y,'fog');const c=t.storyCtx();
   ok(c.weather==='fog'&&t.ambWeather()==='fog','the story\'s context reads the weather where you are (fog)');
   ok(K.every(k=>t.TRACKS.weather[k]>0)&&K.every(k=>['clear','rain','storm','snow'].includes(WX.kinds[k].like)),'every kind fades the tracks and reads as clear, rain, storm or snow to the birds');
   const bm=K.map(k=>{Wx.set(P.x,P.y,k);return t.ambMul('peck')});ok(bm.every(Number.isFinite),'the birds\' numbers in every weather: '+bm.map(v=>v.toFixed(2)).join(', '))}
  // ---- the bus and the toast as it changes where you are
  {let heard=null;const fn=t.worldOn('weather:changed',d=>{heard=d});Wx.set(P.x,P.y,'clear');Wx.tell();Wx.set(P.x,P.y,'rain');Wx.tell();t.worldOff('weather:changed',fn);
   ok(heard&&heard.k==='rain'&&heard.was==='clear','its change where you are on the bus (weather:changed: clear to rain)')}
  // ---- the day bar
  {Wx.set(P.x,P.y,'sandstorm');t.updateHUD(true);const d=Kit.q('#wday');
   ok(d&&d.querySelector('.wx svg')&&/Sandstorm/.test(d.textContent)&&/Sandstorm/.test(d.querySelector('.wx').title),'the day bar shows the weather: its icon and its name ('+(d&&d.textContent.trim())+')');
   ok(K.filter(k=>k!=='clear').every(k=>{const I=t.ICONS['wx_'+k];return I&&I.px.length===9&&I.px.every(r=>r.length===9&&[...r].every(ch=>ch==='.'||I.p[ch]))}),'each kind has its 9 × 9 icon')}
  // ---- drawn
  {const c=t.ctx,count=()=>{const d=c.getImageData(0,0,120,80).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i]+d[i+1]+d[i+2]>60)n++;return n};
   const paint=(k,rm)=>{const r0=window.reducedMotion;if(rm)window.reducedMotion=()=>true;try{c.save();c.setTransform(1,0,0,1,0,0);c.fillStyle='#000';c.fillRect(0,0,120,80);const A=t.WeatherArt;A.layers=[{k,a:1}];A.last=0;A.draw(k,120,80);c.restore();return count()}finally{window.reducedMotion=r0}};
   const rain=paint('rain'),calm=paint('rain',true),clear=paint('clear'),fog=paint('fog'),sand=paint('sandstorm');
   ok(rain>20&&clear===0&&fog>1000&&sand>1000,'drawn: rain streaks ('+rain+' px), a fog veil ('+fog+'), a sandstorm\'s haze ('+sand+'), nothing for a clear sky');
   ok(calm<rain,'with reduced motion, fewer drops ('+calm+' px against '+rain+')');
   WX.on=false;const off=paint('rain');WX.on=true;ok(off===0,'off: nothing drawn')}
  // ---- seasons (the owner, 2026-11-08: "make it into a seasons"): a 120-day year in four, each weighing its climate's kinds
  {const S=d=>Wx.season(d).k,gi=t.CLIMS.indexOf('grass'),fi=t.CLIMS.indexOf('frost');
   ok(S(1)==='spring'&&S(30)==='spring'&&S(31)==='summer'&&S(61)==='autumn'&&S(91)==='winter'&&S(121)==='spring','the seasons turn every 30 days: spring, summer, autumn, winter, and spring again');
   const gw=Wx.weights(gi,95),gs=Wx.weights(gi,40),fs=Wx.weights(fi,40),fw=Wx.weights(fi,95);
   ok(gw.snow>0&&!(gs.snow>0)&&gs.clear>gw.clear&&fw.snow>fs.snow&&fs.rain>0&&!(Wx.weights(fi,95).rain>0),'winter brings snow to the grassland, summer more clear sky; the frost snows more in winter, and rains only in summer');
   t.updateHUD(true);ok(new RegExp('Day '+G.day+' · '+Wx.season().n).test(Kit.q('#wday').textContent),'the day bar names the season ('+Kit.q('#wday').textContent.trim()+')')}
  // ---- gradually: one weather fades out as the next fades in; a new front builds over WEATHER.build hours
  {const A=t.WeatherArt,c=t.ctx;A.layers=[{k:'rain',a:1}];A.last=performance.now()/1000-.05;c.save();A.draw('fog',120,80);c.restore();
   const r=A.layers.find(l=>l.k==='rain'),f=A.layers.find(l=>l.k==='fog');
   ok(r&&f&&r.a<1&&r.a>.9&&f.a>0&&f.a<.1,'changing: the rain fading out ('+(r&&r.a.toFixed(3))+') as the fog fades in ('+(f&&f.a.toFixed(3))+'), over '+WX.ease+' s');
   const g=Wx.cells(),i=Wx.cellAt(P.x,P.y),k0=g.k[i];let n=0;do{Wx.next(i);n++}while(g.k[i]===k0&&n<50);
   const s0=Wx.strength(P.x,P.y);G.clock+=t.DAY/24*WX.build*.5;const s1=Wx.strength(P.x,P.y);G.clock+=t.DAY/24*WX.build;const s2=Wx.strength(P.x,P.y);
   ok(s0<.05&&s1>.4&&s1<.6&&s2===1,'a new front builds: '+s0.toFixed(2)+' as it comes, '+s1.toFixed(2)+' half way, '+s2+' after '+WX.build+' hours');
   Wx.set(P.x,P.y,'rain');ok(Wx.strength(P.x,P.y)===1,'one put there (a story’s, the tests’) is whole at once')}
  // ---- under the fog of war: on the map drawn before the fog, in a battle before its fog
  {const w=String(t.drawWorld),b=String(t.drawBattle);
   ok(w.indexOf('WeatherArt.draw')>0&&w.indexOf('WeatherArt.draw')<w.indexOf('drawWorldFog(cam,V)')&&b.indexOf('WeatherArt.draw')<b.indexOf('fogDraw()'),'the weather is drawn under the fog of war, on the map and on a battle’s field')}
  // ---- in a battle
  {const env={c:'grass',t:t.T_OPEN},s=t.ST.hum_bow,a=t.envStats(s,'human',env),b=t.envStats(s,'human',{...env,w:'storm'}),W=WX.kinds.storm.battle;
   ok(Math.abs(b.spd-a.spd*W.spd)<1e-9&&Math.abs(b.range-a.range*W.range)<1e-9,'a storm on the field: pace ×'+W.spd+', reach ×'+W.range+' (a bowman '+a.range+' to '+b.range.toFixed(1)+')');
   t.WORLD_BATTLE.on=false;Wx.set(P.x,P.y,'storm');G.enc={kind:'party',ref:{x:P.x,y:P.y,cool:0},list:['militia','archer'],allies:[],foes:[]};
   try{t.startBattle({enemies:G.enc.list,deploy:false});const B=t.B,u=B.units.find(q=>q.team===0)||B.hero;
    ok(B.env.w==='storm'&&B.sightK===W.sight,'a battle in a storm: the field\'s weather (B.env.w '+B.env.w+') and each man\'s sight ×'+B.sightK);
    const fire=()=>{B.arrows.length=0;t.Missile.fire(u,0,1,{race:'human'},300,{});const q=B.arrows[0];return Math.atan2(q.vy,q.vx)};
    const wild=[...Array(60)].map(fire),w0=B.env.w;B.env.w=null;const calm=[...Array(20)].map(fire);B.env.w=w0;B.arrows.length=0;
    ok(Math.max(...wild.map(Math.abs))>W.aim/4&&wild.every(v=>Math.abs(v)<=W.aim+1e-9)&&calm.every(v=>v===0),'its arrows fly wide (aim off by up to '+W.aim+' rad: '+Math.max(...wild.map(Math.abs)).toFixed(3)+'), in clear weather true')
    // (skills in the weather: the owner, 2026-11-08, "rain affect fire arrow which cannot be used"; data/weather.js WEATHER.skills)
    if(B.ready||B.deploy)t.beginFight();
    const g=Object.values(B.groups).find(q=>q.team===0&&q.units.length),keep=window.groupHasAbility,why={};window.groupHasAbility=()=>true;
    try{for(const k of ['rain','storm','snow','clear','fog',null]){B.env.w=k;why[k]=t.abilityWhyNot(g,'fire')}}finally{window.groupHasAbility=keep;B.env.w=w0}
    ok(['rain','storm','snow'].every(k=>/pitch/.test(why[k]))&&['clear','fog',null].every(k=>!/pitch/.test(why[k])),'no fire arrows in the rain, a storm or snow ("'+why.rain+'"); in clear weather, fog or none they may');
    const sm=k=>{B.env.w=k;const v=t.kitOf(B.hero,'fireball').sm;B.env.w=w0;return v},nv=k=>{B.env.w=k;const v=t.kitOf(B.hero,'nova').sm;B.env.w=w0;return v};
    ok(Math.abs(sm('rain')/sm('clear')-WX.skills.fireball.mul.rain)<1e-9&&sm('heat')>sm('clear')&&nv('blizzard')>nv('clear')&&nv('heat')<nv('clear'),'a fireball '+Math.round((1-WX.skills.fireball.mul.rain)*100)+'% weaker in the rain, stronger in a heat wave; a frost nova stronger in a blizzard, weaker in the heat');
    const tx=Wx.battleText('rain');ok(/no fire arrows/.test(tx)&&/Fireball weaker/.test(tx)&&/shorter/.test(tx)&&Wx.battleText('clear')==='','told before and as the battle starts: "'+tx+'"; nothing in clear weather')}
   finally{if(t.B){t.B.over=true;t.B.endT=0}Kit.world();t.WORLD_BATTLE.on=true}}
  // ---- saved and loaded
  {const g=Wx.cells(),sv=t.Saves.saveOf('weather').weather,k0=Array.from(g.k),u0=Array.from(g.u);
   ok(sv&&sv.k.length===g.k.length&&'weather' in t.Saves.save(),'on, the regions\' weather is in the save ('+JSON.stringify(sv).length+' chars)');
   g.k.fill(0);g.u.fill(0);t.Saves.loadOf('weather',JSON.parse(JSON.stringify(sv)));const g2=Wx.cells();
   ok(g2!==g&&Array.from(g2.k).join()===k0.join()&&Array.from(g2.u).join()===u0.join(),'and loads back as it was');
   t.Saves.loadOf('weather',undefined);ok(Wx.grid===null&&K.includes(Wx.at(P.x,P.y)),'an old save without it loads (its weather made afresh on first need)')}
  // ---- the road's incidents, only in their weather
  {G.quietEvents=false;P.troops={hum_levy:4};P.wounded={};P.race='human';const ids=t.INCIDENTS.map(e=>e.id),ok0=(k,id)=>{Wx.set(P.x,P.y,k);return t.INCIDENTS.find(e=>e.id===id).ok()};
   ok(['flood','lightning','frostbite','lost','heat','fineday'].every(id=>ids.includes(id)),'the weather\'s incidents: '+ids.join(', '));
   const gate=[['storm','storm'],['lightning','storm'],['flood','rain'],['lost','sandstorm'],['sandstorm','sandstorm'],['heat','heat'],['blizzard','blizzard']];
   ok(gate.every(([id,k])=>ok0(k,id)&&!ok0('cloudy',id)),'each comes only in its weather: '+gate.map(([id,k])=>id+' in '+k).join(', '));
   ok(ok0('clear','fineday')===(t.climAt(P.x,P.y)==='grass')&&!ok0('rain','fineday'),'a fine day only under a clear sky');
   const fire=id=>{G.mode='world';G.modal=false;t.hidePanel();const keep=t.INCIDENTS.slice();t.INCIDENTS.length=0;t.INCIDENTS.push(keep.find(e=>e.id===id));try{t.Incident.roll()}finally{t.INCIDENTS.length=0;keep.forEach(e=>t.INCIDENTS.push(e))}};
   Wx.set(P.x,P.y,'storm');const n0=G.msgs.length;fire('lightning');const hurt=Object.values(P.wounded||{}).reduce((a,b)=>a+b,0);
   ok(G.msgs.length>n0&&/Lightning/.test(G.msgs[G.msgs.length-1].m)&&hurt>=1,'lightning in a storm: '+hurt+' of your men hurt, its line logged');
   Wx.set(P.x,P.y,'clear');const n1=G.msgs.length;fire('lightning');ok(G.msgs.length===n1,'and none under a clear sky');
   G.quietEvents=true}
 }finally{WX.on=false;Wx.reset();G.day=h0[0];G.clock=h0[1]}
 // ---- a new game opens under a clear sky where you stand (the owner, 2026-11-08: "why always start with raining?"), the rest as drawn;
 // WEATHER.start null: as drawn (a third of starts in rain or a storm in spring on the grass)
 {const starts=n=>{const o=[];for(let i=0;i<n;i++){Kit.begin('soldier',100+i);const g=Wx.grid,j=Wx.cellAt(P.x,P.y);o.push([K[g.k[j]],g.u[j]-t.Clock.hourCount(),new Set(g.k).size])}return o};
  WX.on=true;const s0=WX.start;let on,off;
  try{on=starts(6);WX.start=null;off=starts(12)}finally{WX.start=s0;WX.on=false;Wx.reset();Kit.begin('soldier',1);Kit.world()}
  const H=WX.kinds.clear.hours,wet=off.filter(o=>o[0]!=='clear').length;
  ok(on.every(o=>o[0]==='clear'&&o[1]>=H[0]&&o[1]<=H[1]&&o[2]>1)&&wet>0,'a new game opens under a clear sky where you stand, for a clear front\'s '+H.join('-')+' hours ('+on.map(o=>o[1]+' h').join(', ')+'), the other regions as drawn; WEATHER.start null: as drawn ('+wet+' of 12 starts not clear: '+off.map(o=>o[0]).join(', ')+')')}
 ok(!ERR.length,'no errors on the page'+(ERR.length?': '+ERR.join('; '):''));
});
