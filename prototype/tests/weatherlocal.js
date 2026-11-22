"use strict";
// Geographic fronts, dry breaks, save continuity and native-size precipitation.
Kit.suite(({ok,info})=>{const t=T,W=t.Weather,D=t.WEATHER,K=t.WEATHER_KINDS;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();
 const was=D.on;D.on=true;const g=W.cells(),C=D.cell*t.TILE,ri=K.indexOf('rain'),ci=K.indexOf('clear'),h0=[t.G.day,t.G.clock],saved=W.save();
 const near=(a,b)=>Math.abs(a-b)<1e-7,advance=n=>{t.G.clock+=n*t.DAY/24;while(t.G.clock>=t.DAY){t.G.day++;t.G.clock-=t.DAY}};
 try{
  g.k.fill(ci);g.p.fill(ci);g.s.fill(-1e9);g.u.fill(t.Clock.hourCount()+30);
  const x=C*.5,y=C*.5;W.set(x,y,'rain');
  ok(W.sample(x,y)[ri]===1&&W.sample(C*1.5,y)[ri]===0,'rain stays at its geographic region; neighbouring clear centre stays dry');
  const a=W.sample(C-.001,y)[ri],b=W.sample(C+.001,y)[ri];ok(Math.abs(a-.5)<.001&&Math.abs(a-b)<.001,'front edges blend continuously across a regional border');
  const px=t.P.x,py=t.P.y,mix=Array.from(W.sample(x,y));t.P.x=C*2;t.P.y=C*2;ok(mix.every((v,i)=>v===W.sample(x,y)[i]),'moving the player cannot move weather at a fixed location');t.P.x=px;t.P.y=py;
  const i=W.cellAt(x,y);g.p[i]=ci;g.k[i]=ri;g.s[i]=t.Clock.hours();ok(W.sample(x,y)[ri]===0,'a new shower starts gradually');advance(D.build/2);ok(near(W.sample(x,y)[ri],.5),'a shower is half strength halfway through its build');
  const snap=W.save(),before=Array.from(W.sample(x,y));W.load(snap);ok(before.every((v,i)=>near(v,W.sample(x,y)[i])),'save/load preserves a developing front exactly');
  W.load({w:snap.w,h:snap.h,k:snap.k,u:snap.u});ok(W.sample(x,y)[ri]===1,'older saves default to established fronts');
  W.set(x,y,'rain');const gg=W.cells();W.next(i);ok(!W.wet(K[gg.k[i]])&&gg.r[i]>=t.Clock.hourCount()+D.rest,'a shower ends in a dry break, even beside another wet front');
  ok(gg.p[i]===ri&&W.sample(x,y)[ri]===1,'an ending shower retains its old front so it fades out instead of disappearing');
  let wetHours=0,total=0;const hour0=t.Clock.hourCount();gg.c.fill(t.CLIMS.indexOf('grass'));gg.k.fill(ci);gg.p.fill(ci);gg.u.fill(hour0+1);gg.r.fill(0);
  for(let h=0;h<720;h++){advance(1);W.hour();for(const k of gg.k){total++;if(W.wet(K[k]))wetHours++}}
  info('Grass precipitation over 720 regional hours: '+(100*wetHours/total).toFixed(2)+'%');ok(wetHours>0&&wetHours/total<.12,'grass weather is predominantly dry, with occasional precipitation');
  const c=t.ctx,A=t.WeatherArt,original=W.sample,lines=[],move=c.moveTo,line=c.lineTo,old=t.WEATHER.visual.max;let from=null,samples=[];
  W.sample=(wx,wy)=>{samples.push([wx,wy]);const m=new Float64Array(K.length);m[ri]=1;return m};c.moveTo=function(x,y){from=[x,y];return move.call(this,x,y)};c.lineTo=function(x,y){if(from)lines.push(Math.hypot(x-from[0],y-from[1]));return line.call(this,x,y)};
  try{c.save();c.setTransform(1,0,0,1,0,0);A.world({x:500,y:700},1,640,360,10);c.restore();const n=lines.length;
   ok(n>0&&lines.every(v=>near(v,D.kinds.rain.art.fall.len)),'rain uses short, consistent screen-pixel lengths');
   lines.length=0;A.world({x:500,y:700},5,640,360,10);ok(lines.length>0&&lines.every(v=>near(v,D.kinds.rain.art.fall.len)),'zooming the map five times does not enlarge rain streaks');
   ok(samples.some(([wx,wy])=>wx>=500&&wy>=700)&&samples.some(([wx])=>wx>600),'rendering samples visible world coordinates, not the player or battle-start weather');
   samples=[];A.world({x:1500,y:1700},1,640,360,10);ok(samples.every(([wx,wy])=>wx>=1500&&wy>=1700),'panning the camera queries the new area');
  }finally{W.sample=original;c.moveTo=move;c.lineTo=line;D.visual.max=old}
  const draw=String(t.drawWorld),battle=String(t.drawBattle);ok(draw.indexOf('WeatherArt.drawMap')<draw.indexOf('drawWorldFog,cam,V')&&battle.includes('if(B.world)WeatherArt.drawMap()'),'campaign weather remains under fog; world combat reads the live geographic sky');
  t.CAIR.fl.push({x:0,y:0,z:0});t.climateAir(t.G.cam);ok(t.CAIR.fl.length===0,'regional weather suppresses the old player-centred permanent snowfall');
  ok(D.kinds.storm.art.flash.every>=30&&D.kinds.rain.art.fall.n<60,'lightning is occasional and ordinary rain is sparse');
  ok(!ERR.length,'regional weather runs without runtime errors');
 }finally{t.G.day=h0[0];t.G.clock=h0[1];W.load(saved);D.on=was}
});
