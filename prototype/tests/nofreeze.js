'use strict';
// No freeze (the owner, 2026-11-12: "games freeze after the new battle"): the seamless fights of every kind run to their end with the
// live game's switches on, none throwing; a slash's arc never gets a radius below zero (gfx/render.js drawSlash: a goblin's short blow
// in a fight on the map threw, and the game stood still); and an error in a step or a frame never stops the loop (main.js loopError).
window.RUN=()=>{const R=Kit.report(),{ok,info}=R,t=T,G=t.G,P=t.P,W=t.W;
 try{
  const ON='BDEPLOY,BAUTO,TERRAIN,FOG,BEAST_TACTICS,PHYSICS,DISMOUNT,DEFENCE,DUEL,JOSTLE,FIELD_SIZES,EXITS,COMMAND_POWERS,AMBIENT,INTERIOR,TOWN_WALL,SIEGE_WALL,GATES,LORD_AUDIENCE,PROVINCE,WEATHER,DISCOVER,SEAMLESS,DROPS,DEATH'.split(',');
  const was=ON.map(k=>t[k].on);ON.forEach(k=>t[k].on=true);
  const bad=[];let runs=0;
  const run=(seed,name,start)=>{Kit.begin('soldier',seed);Kit.world();t.GUIDE.on=false;P.troops={hum_foot:8,hum_bow:4};const e0=ERR.length;let msg='';
   try{if(start()===false)return;runs++;let n=0;for(;n<3000&&G.mode==='battle'&&t.B&&!t.B.over;n++){t.updateBattle(.05);if(n%5==0)t.frame()}
    for(let k=0;k<40&&t.B;k++){t.updateBattle(.05);t.frame()}}catch(e){msg=e.message+' @ '+(e.stack||'').split('\n')[1]}
   const E=ERR.slice(e0);if(msg||E.length)bad.push(seed+' '+name+': '+(msg||E[0]));
   try{if(t.B)t.B.over=true;t.B=null;G.enc=null;Kit.world()}catch(e){}};
  const nearest=L=>L.sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];
  try{for(const seed of [5,23]){
   run(seed,'a band',()=>{const b=t.asParty({kind:'bandits',troops:['militia','militia','archer','militia','militia'],x:P.x+40,y:P.y,cool:0});t.bandits.push(b);t.startEncounter({kind:'party',ref:b,list:b.troops.slice()})});
   run(seed,'goblins',()=>{const b=nearest(t.bandits.filter(o=>o.kind==='goblins'&&!o.dead));if(!b)return false;P.x=b.x-40;P.y=b.y;t.startEncounter({kind:'party',ref:b,list:b.troops.slice()})});
   run(seed,'a band clicked',()=>{const b=nearest(t.bandits.filter(o=>!o.dead&&!o.inside));P.x=b.x-40;P.y=b.y;t.worldGo(b.x,b.y);for(let i=0;i<400&&G.mode==='world';i++)t.updateWorld(.05)});
   run(seed,'a beast',()=>{const m=nearest(W.monsters.filter(o=>o.n>0));if(!m)return false;P.x=m.x-30;P.y=m.y;t.startMonster(m)});
   run(seed,'a lord',()=>{const l=nearest(W.lords.filter(o=>!o.dead&&!o.inside));P.x=l.x-40;P.y=l.y;t.startEncounter({kind:'lord',ref:l,list:(l.troops||[]).slice()})});
   run(seed,'a camp',()=>{const s=W.sites.find(o=>o.type==='camp'&&!o.cleared);if(!s)return false;P.x=s.x-30;P.y=s.y;s.attack()})}}
  finally{ON.forEach((k,i)=>t[k].on=was[i])}
  ok(runs>=8&&!bad.length,'every kind of fight runs to its end, none throwing ('+runs+' fights'+(bad.length?': '+bad.slice(0,3).join(' ;; '):'')+')');
  // (a short blow's arc on the map: its inner strokes' radius kept above zero)
  {let threw=null;ctx.save();try{t.drawSlash({kind:'arc',x:10,y:10,a:0,life:.1,max:.2,arc:.8,r:1,dir:1,area:0})}catch(e){threw=e.message}ctx.restore();ok(!threw,'a slash of radius 1 draws ('+(threw||'no error')+')')}
 }catch(e){R.exc(e)}
 // (the loop: a step that throws once; the steps go on after it)
 Kit.begin('soldier',3);Kit.world();t.GUIDE.on=false;const u0=window.updateWorld;let n=0,thrown=0;
 window.updateWorld=function(dt){n++;if(n===3){thrown++;throw new Error('nofreeze probe: a step throws')}return u0.apply(this,arguments)};
 setTimeout(()=>{window.updateWorld=u0;const i=ERR.findIndex(e=>/nofreeze probe/.test(e));
  ok(thrown===1&&n>10&&i>=0,'a step that throws: the game goes on ('+n+' steps, the error still raised: '+(i>=0)+')');if(i>=0)ERR.splice(i,1);R.out()},2000)};
