'use strict';
// The battle's soundscape (battlesound.js): off, it is a no-op and loads nothing; before its banks are in, its cues fall back
// to the synth and its beds are silent; the banks load (injected scripts) and decode; the beds follow the field (melee,
// marching, riders, a rout, the lines closing, your army wavering) and the zoom; arrows come as volleys and hails; a group
// charging cries, its charge crashes; orders are answered, each race in its own voice; the field's ambience is its climate's
// and ducks under the fight; the voice cap holds; nothing rendered passes full scale; no Math.random; and a lab battle is
// fought the same with the soundscape on or off. Sound plays into an OfflineAudioContext whose clock the test moves.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),t=T,A=t.AUDIO,BS=t.BSND,K=t.SFXBANK,G=t.G;
window.requestAnimationFrame=()=>0;
const finish=()=>{try{BS.sim=null;t.bsClose();t.audioStop();A.on=false;A.ear=null;A.voices=24}catch(e){}const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
const SR=22050,get=u=>{const x=new XMLHttpRequest();x.open('GET',u,false);x.send();return x.responseText};
// a context, offline, its clock k.t moved by the test; k.made counts the nodes made, k.src keeps the buffer sources
const clock=(sec=4)=>{const real=new OfflineAudioContext(2,Math.ceil(SR*sec),SR),k={t:0,made:{},src:[]};
  const ctx=new Proxy(real,{get:(x,key)=>{if(key==='currentTime')return k.t;const v=x[key];if(typeof v!=='function')return v;
    return(...a)=>{if(/^create/.test(key))k.made[key]=(k.made[key]||0)+1;const r=v.apply(x,a);if(key==='createBufferSource')k.src.push(r);return r}}});
  t.audioStop();A.on=true;t.MUSIC.want=null;t.audioStart(ctx);BS.next=0;return{ctx,k,real}};
const level=buf=>{let pk=0,ss=0,n=0;for(let ch=0;ch<buf.numberOfChannels;ch++){const d=buf.getChannelData(ch);for(let i=0;i<d.length;i++){const v=d[i];if(Math.abs(v)>pk)pk=Math.abs(v);ss+=v*v;n++}}return{pk,rms:Math.sqrt(ss/n)}};
const dB=v=>(20*Math.log10(Math.max(1e-9,v))).toFixed(1);
const ear=(w=800)=>{A.ear=()=>({x:400,y:300,w})};
const tick=k=>{k.t+=BS.every+.001;t.battleSoundTick()};
const SIM={zoom:.3,melee:0,march:0,cav:0,rout:0,approach:0,waver:0,wood:0,water:0,race:'human',climate:'grass'};
// a stand-in battle for the hooks that read B (bsLoose, bsLand, bsOrder): its clock and a few soldiers
const setB=v=>{window.__bs=v;(0,eval)('B=window.__bs')},fakeB=(units=[])=>setB({t:1,units,groups:Object.fromEntries(units.map(u=>[u.grp,{}])),over:false});
// what the cues were asked: wrap their play (each call's options kept)
const heard={};const spy=names=>{for(const n of names){const S=t.SFX[n];if(S.__keep)continue;S.__keep=S.play;S.play=(V,x)=>{(heard[n]=heard[n]||[]).push(x||{});return S.__keep(V,x)}}};
const unspy=()=>{for(const S of Object.values(t.SFX))if(S.__keep){S.play=S.__keep;delete S.__keep}};
const CUES=['warcry','impact','order','officer','cheer','panic','chatter','volley','hail','horn','rout','rally','loose','arrowhit','clash','hit','block'];
const steps=[];
try{
 // ---- off: nothing made, nothing loaded, nothing thrown
 t.audioStop();A.on=false;
 {let threw=null;const banks=Object.keys(K.want).length;try{for(let i=0;i<5;i++)t.battleSoundTick();BS.sim={...SIM};t.battleSoundTick();BS.sim=null;t.bsOrder('hold',['x'])}catch(e){threw=e}
  ok(!threw&&!A.ctx&&!BS.live&&Object.keys(K.want).length===banks&&banks===0,'sound off (AUDIO.on false): the tick and the hooks do nothing, load no bank and throw nothing'+(threw?': '+threw.message:''))}
 {let n=0;const t0=performance.now();for(let i=0;i<20000;i++)t.battleSoundTick();const us=(performance.now()-t0)/20000*1000;
  ok(us<5,'and cost next to nothing: '+us.toFixed(3)+' µs a frame')}
 // ---- no dice: the soundscape never touches Math.random
 {const code=u=>get(u).replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,''),src=code('js/core/battlesound.js'),aud=code('js/core/audio.js');ok(!/Math\.random/.test(src)&&!/Math\.random/.test(aud),'battlesound.js and audio.js never call Math.random (AUDIO.rng)')}
 // ---- the cues are in the table, with their synth stand-ins
 {const miss=['warcry','impact','order','officer','cheer','panic','chatter','volley','hail'].filter(n=>!t.SFX[n]||t.SFX[n].g!=='battle');ok(!miss.length,'the soundscape\'s cues are in audio.js SFX'+(miss.length?': missing '+miss.join(', '):''))}
 // ---- before the banks: the synth plays, the beds are silent
 {const {k}=clock(4);ear();spy(CUES);const e0=A.stats.errors,src0=k.src.length,osc0=k.made.createOscillator||0;
  const played=['warcry','impact','order','officer','cheer','panic','volley','hail','horn'].filter(n=>t.sfx(n,{race:'orc',n:20,kind:'hold',big:1}));
  ok(played.length===9&&A.stats.errors===e0&&(k.made.createOscillator||0)>osc0&&!Object.keys(K.buf).length,'no bank yet: every soundscape cue falls back to its synth ('+played.length+' played, '+((k.made.createOscillator||0)-osc0)+' oscillators)');
  ok(t.bsCue({c:k.ctx,t:0,out:A.bus.fx,r:A.rng,p:1},'warcry',{})===0,'(bsCue answers 0 with nothing loaded)');
  for(const b of ['voices','beds','amb-land','amb-grass'])K.want['battle-'+b]=1;BS.sim={...SIM,melee:1,march:1,cav:1};t.battleSoundTick();tick(k);const beds=Object.values(BS.bed),srcs=beds.filter(D=>D.s).length;
  ok(BS.live&&beds.length>=12&&!srcs,'and the beds wait silent ('+beds.length+' beds, '+srcs+' sources)');
  BS.sim=null;t.battleSoundTick();ok(!BS.live,'out of the battle, the beds let go');K.want={};unspy()}
 // ---- the banks: injected, decoded once
 steps.push(()=>{const {k}=clock(4);BS.sim={...SIM};t.battleSoundTick();const t0=performance.now(),want=t.bankList('grass');
  return new Promise(res=>{const wait=()=>{if(want.every(b=>K.ready[b])||performance.now()-t0>60000)return res();setTimeout(wait,50)};wait()}).then(()=>{
   const n=Object.keys(K.buf).length;
   ok(want.every(b=>K.ready[b])&&n>=90&&!K.stats.errors,'the banks for a grassland battle load (script tags) and decode: '+n+' sounds in '+((performance.now()-t0)/1000).toFixed(1)+' s ('+K.stats.ms.toFixed(0)+' ms of decoding and shaping)'+(K.stats.errors?': '+K.stats.err:''));
   const loops=['bed.crowd','bed.steel','bed.far','bed.feet','bed.hooves','bed.panic','bed.drums','amb.grass','amb.wood','amb.water'].filter(x=>!K.buf[x]);ok(!loops.length,'every bed has its loop'+(loops.length?': missing '+loops.join(', '):''));
   const req=document.querySelectorAll('script[src^="audio/sfx/"]').length;t.battleSoundTick();BS.sim=null;t.battleSoundTick();BS.sim={...SIM};t.battleSoundTick();
   ok(document.querySelectorAll('script[src^="audio/sfx/"]').length===req,'asked again, a bank is not loaded twice ('+req+' bank scripts)');
   ok(!/audio\/sfx/.test(get('Ashmark.html'))&&!/audio\/sfx/.test(get('wiki.html')),'the banks are no static scripts (loaded only when a battle is on)');
   BS.sim=null;t.battleSoundTick()})});
 // ---- the beds follow the field and the zoom
 steps.push(()=>{const {k}=clock(4);ear();const v=b=>BS.bed[b]?BS.bed[b].v:0,set=m=>{BS.sim={...SIM,...m};tick(k);tick(k)};
  set({});const quiet={crowd:v('crowd'),feet:v('feet'),hooves:v('hooves'),panic:v('panic'),drums:v('drums'),swell:v('swell'),wind:v('wind')};
  set({melee:.9});const loud=v('crowd'),wind=v('wind');set({melee:.3});const some=v('crowd');
  ok(quiet.crowd<.01&&loud>some&&some>.05,'the melee\'s roar follows the fighting near the camera (crowd '+quiet.crowd.toFixed(2)+' → '+some.toFixed(2)+' → '+loud.toFixed(2)+')');
  ok(wind<quiet.wind*.6,'and the field\'s ambience ducks under it (wind '+quiet.wind.toFixed(2)+' → '+wind.toFixed(2)+')');
  set({melee:.9,zoom:0});const far0=v('far'),cr0=v('crowd');set({melee:.9,zoom:1});const far1=v('far'),cr1=v('crowd');
  ok(far0>far1*2&&cr1<cr0,'zoomed out the battle is a mass (far '+far0.toFixed(2)+'), zoomed in it gives way (far '+far1.toFixed(2)+', crowd '+cr0.toFixed(2)+' → '+cr1.toFixed(2)+')');
  const keep=z=>{BS.sim={...SIM,melee:.9,zoom:z};tick(k);let n=0;for(let i=0;i<200;i++)if(t.bsBlow('clash',400+(i%7),300,false))n++;return n},k0=keep(0),k1=keep(1),farB=t.bsBlow('clash',400+1200,300,false)||t.bsBlow('clash',400+1200,300,false)||t.bsBlow('clash',400+1200,300,false);
  ok(k1>k0*2&&k1>=190&&!farB,'blows near the camera are heard alone, more zoomed in ('+k0+' of 200 zoomed out, '+k1+' zoomed in); far off, the bed has them');
  set({march:.8});const mv=v('feet'),kit=v('kit');set({cav:.4});const trot=v('hooves'),h0=v('herd');set({cav:1});const gal=v('herd');
  ok(mv>.2&&kit>.1&&quiet.feet<.01,'marching formations tramp and jingle (feet '+mv.toFixed(2)+', kit '+kit.toFixed(2)+')');
  ok(trot>.2&&gal>h0+.1,'riders rumble, building as they gallop (hooves '+trot.toFixed(2)+'; gallop '+h0.toFixed(2)+' → '+gal.toFixed(2)+')');
  set({rout:.8});const pn=v('panic');set({approach:.9});const dr=v('drums');set({approach:.9,melee:1});const dr2=v('drums');set({waver:.7});const sw=v('swell');
  ok(pn>.2&&dr>.2&&dr2<dr*.5&&sw>.04,'a rout panics (panic '+pn.toFixed(2)+'); drums build as the lines close ('+dr.toFixed(2)+') and fall away once they meet ('+dr2.toFixed(2)+'); your army wavering swells low ('+sw.toFixed(2)+')');
  set({melee:.9});const D=BS.bed.crowd,g=D&&D.g.gain;ok(D&&D.s&&g&&k.made.createBufferSource>0,'a heard bed has its long-lived loop (one source a bed, '+Object.values(BS.bed).filter(x=>x.s).length+' playing)');
  BS.sim=null;t.battleSoundTick()});
 // ---- the field's ambience: its climate's, woods and water by the view
 steps.push(()=>{const {k}=clock(4);ear();const res={},C=['grass','frost','desert','swamp'];let p=Promise.resolve();
  for(const c of C)p=p.then(()=>{t.bsClose();BS.sim={...SIM,climate:c,wood:c==='grass'?.6:0,water:c==='swamp'?.5:0};t.battleSoundTick();const t0=performance.now();
   return new Promise(r=>{const w=()=>{if(K.ready['battle-amb-'+c]||performance.now()-t0>30000)return r();setTimeout(w,50)};w()}).then(()=>{tick(k);tick(k);
    res[c]={wind:BS.bed.wind&&BS.bed.wind.src,on:!!(BS.bed.wind&&BS.bed.wind.s),life:BS.bed.life&&BS.bed.life.src,wood:BS.bed.wood.v,water:BS.bed.water.v}})});
  return p.then(()=>{const bad=C.filter(c=>res[c].wind!=='amb.'+c||!res[c].on);
   ok(!bad.length,'each climate has its own wind: '+C.map(c=>c+' '+res[c].wind).join(', ')+(bad.length?'; wrong: '+bad.join(', '):''));
   ok(res.grass.life==='amb.grass.life'&&!res.frost.life&&!res.desert.life,'grassland has birds and insects; frost and desert none (swamp: frogs and insects in its own)');
   ok(res.grass.wood>.1&&res.frost.wood===0&&res.swamp.water>.1&&res.grass.water===0,'woods rustle and a river runs only where the view has them');
   BS.sim=null;t.battleSoundTick()})});
 // ---- arrows: a group's shots are a volley, landing together a hail
 steps.push(()=>{const {k}=clock(4);ear();spy(['volley','hail','loose','arrowhit']);for(const n of ['volley','hail','loose','arrowhit'])heard[n]=[];
  fakeB();const sh=Array.from({length:16},(_,i)=>({grp:'bows',id:'b'+i,x:380+i,y:300}));let n=0;for(const u of sh){k.t+=.011;t.bsLoose(u);n++}
  const v1=heard.volley.length,l1=heard.loose.length;(0,eval)('B.t+=1');for(const u of sh.slice(0,3)){k.t+=.06;t.bsLoose(u)}
  ok(v1===1&&l1<=2&&heard.volley[0].n>=5,'16 shots of one group at once: one volley ('+v1+', of '+(heard.volley[0]&&heard.volley[0].n)+'), its first twangs alone ('+l1+')');
  ok(heard.volley.length===1,'3 shots a second later: no volley, singles only ('+(heard.loose.length-l1)+' heard)');
  let alone=0;for(let i=0;i<20;i++){k.t+=.016;if(t.bsLand(400+i,300))alone++}
  ok(heard.hail.length===1&&alone<BS.hail,'20 arrows landing together: one hail ('+heard.hail.length+'), '+alone+' heard alone first');
  setB(null);unspy()});
 // ---- a group charging cries, its charge crashes; a wavering line's officer; the end's cheers
 steps.push(()=>{const {k}=clock(4);ear();spy(['warcry','officer','cheer','panic','impact']);for(const n of ['warcry','officer','cheer','panic','impact'])heard[n]=[];
  const S=(run,mor)=>({groups:{g1:{n:20,run,x:400,y:300,team:1,race:{orc:18,human:2},w:1,mor,routed:false}}}),b={t:10,over:false};BS.gs={};
  t.bsEvents(b,S(0,80),k.t);b.t+=.2;t.bsEvents(b,S(12,80),k.t);b.t+=.2;t.bsEvents(b,S(14,80),k.t);
  ok(heard.warcry.length===1&&heard.warcry[0].race==='orc'&&heard.warcry[0].n===20,'a group setting off at a run cries out once, in its race\'s voice ('+JSON.stringify(heard.warcry[0]||{})+')');
  b.t+=.2;t.bsEvents(b,S(14,20),k.t);ok(heard.officer.length===1,'its morale falling to wavering: an officer\'s shout');
  b.over=true;b.win=true;b.units=[{team:0,hp:5,type:'dw_clan',s:{race:'dwarf'}}];t.bsEvents(b,S(0,50),k.t);ok(heard.cheer.length===1&&heard.cheer[0].big&&heard.cheer[0].race==='dwarf','won: your army cheers (dwarves)');
  fakeB();(0,eval)('B.t=5');t.bsImpact({x:400,y:300},.9,true);k.t+=.3;t.bsImpact({x:402,y:301},.9,true);(0,eval)('B.t=6');k.t+=.3;t.bsImpact({x:400,y:300},.9,true);
  ok(heard.impact.length===2&&BS.peakT>k.t,'a charge landing crashes once a wave ('+heard.impact.length+' for 3 strikes), and the hooves peak');setB(null);unspy()});
 // ---- orders answered, each race its own voice
 steps.push(()=>{const {k}=clock(4);ear();spy(['order']);heard.order=[];const races={human:'hum_levy',dwarf:'dw_clan',elf:'elf_glade',orc:'orc_grunt'},got={},rates={};
  for(const [r,ty] of Object.entries(races)){fakeB([{grp:'g_'+r,id:1,hp:9,x:400,y:300,type:ty,s:{race:r}}]);BS.lastPick={};BS.lastOrder=-9;const s0=k.src.length;k.t+=1;
   t.bsOrder(r==='orc'?'attack':'hold',['g_'+r]);const x=heard.order[heard.order.length-1]||{};got[r]=x.race+'/'+x.kind+'→'+Object.keys(BS.lastPick).join('+');
   const sr=k.src.slice(s0).filter(s=>s.buffer&&Object.values(K.buf).includes(s.buffer));rates[r]=sr.length?sr[0].playbackRate.value:0}
  ok(/orc\./.test(got.orc)&&/order\.hold/.test(got.human)&&got.dwarf.startsWith('dwarf/hold'),'each race answers in its voice: '+Object.values(got).join(', '));
  ok(Math.abs(rates.human-1)<.01&&rates.dwarf<.9&&rates.elf>1.08,'dwarves deeper, elves lighter (playback '+Object.entries(rates).map(([r,v])=>r+' '+v.toFixed(2)).join(', ')+')');
  const n0=heard.order.length;t.bsOrder('hold',['g_orc']);ok(heard.order.length===n0,'orders a breath apart: one answer');setB(null);unspy()});
 // ---- the horns: yours, then theirs, by race
 steps.push(()=>{const {k}=clock(4);const s0=k.src.length;t.sfx('horn',{race:'dwarf',foe:'orc'});const bufs=k.src.slice(s0).map(s=>Object.entries(K.buf).find(([n,b])=>b===s.buffer)).filter(Boolean).map(x=>x[0]);
  ok(bufs.includes('horn.dwarf')&&bufs.includes('horn.orc'),'the battle-start horn is your race\'s, answered by theirs ('+bufs.join(', ')+')')});
 // ---- the voice cap holds under a pile-up; the beds are no voices
 steps.push(()=>{const {k}=clock(4);ear();A.voices=8;BS.sim={...SIM,melee:1,march:.6,cav:1,rout:.5};let most=0;const r=t.mkRng(3),C=['warcry','impact','order','officer','cheer','panic','chatter','volley','hail','clash','hit','block','loose'];
  for(let i=0;i<80;i++){k.t=i*.025;if(i%8===0)t.battleSoundTick();t.sfx(C[Math.floor(r()*C.length)],{race:['human','orc','elf','dwarf'][i%4],n:12});most=Math.max(most,A.live.length)}
  const beds=Object.values(BS.bed).filter(D=>D.s).length;ok(most<=8&&beds>3,'the voice cap holds: at most '+most+' of 8 cues at once, while '+beds+' beds play outside it');A.voices=24;BS.sim=null;t.battleSoundTick()});
 // ---- heard: a full battle's mix rendered offline, never past full scale
 steps.push(()=>{const {k,real}=clock(6);ear(600);BS.sim={...SIM,melee:1,march:.5,cav:1,rout:.6,approach:.2,waver:.8,wood:.5,water:.5,zoom:.6};const r=t.mkRng(7),C=['warcry','impact','chatter','volley','hail','clash','hit','block','cheer','panic'];
  for(let i=0;i<240;i++){k.t=i*.02;if(i%5===0)t.battleSoundTick();if(i%3===0)t.sfx(C[Math.floor(r()*C.length)],{race:'human',n:20,pan:r()*2-1})}
  BS.sim=null;return real.startRendering().then(b=>{const l=level(b);ok(l.pk<=1&&l.pk>.1&&l.rms>.02,'a full battle\'s mix (every bed up, 80 cues in 5 s): peak '+dB(l.pk)+' dBFS, rms '+dB(l.rms)+' dBFS, never past full scale')})});
 // ---- a lab battle, its soundscape on (banks in, ticking) or off: the same fight
 steps.push(()=>{const L=t.BattleLab;spy(CUES);for(const n of CUES)heard[n]=[];
  const cfg={leftGroups:[{type:'hum_foot',count:30},{type:'hum_bow',count:24},{type:'hum_knight',count:12}],rightGroups:[{type:'orc_grunt',count:34},{type:'orc_thrower',count:16},{type:'hum_squire',count:10}],morale:true,deploy:false,paused:true,ai:true,seed:5};
  const fight=on=>{if(L.active)L.exit();G.mode='world';G.modal=false;t.audioStop();A.on=false;L.start(cfg);const b=t.B;b.paused=false;let k=null,ms=0,n=0;G.mode='battle';
   if(on){k=clock(1).k;A.ear=()=>({x:t.BW/2,y:t.BH/2,w:t.BW*.6})}
   for(let f=0;f<30*50&&!L.session.result;f++){if(f===30){const g=Object.values(b.groups).find(x=>!x.foe&&x.units.some(u=>u.type==='hum_foot'));if(g){t.selectGroup(g.id);t.setOrder('charge')}}
    t.updateBattle(1/30);if(k){k.t=b.t;const t0=performance.now();t.battleSoundTick();ms+=performance.now()-t0;n++}}
   let h=2166136261;const mix=v=>{h=Math.imul(h^(v|0),16777619)>>>0};for(const u of b.units){mix(u.x*1e6);mix(u.y*1e6);mix(u.hp*1e3);mix(u.rout?1:0)}mix(Math.random()*1e9);
   const r={fp:h.toString(16)+' @'+b.t.toFixed(1)+'s',ms:n?ms/n:0,looks:BS.stats.ticks};A.ear=null;L.exit();t.battleSoundTick();t.audioStop();A.on=false;return r};
  let off,on,threw=null;const ticks0=BS.stats.ticks,ms0=BS.stats.ms;try{fight(false);off=fight(false);on=fight(true)}catch(e){threw=e}// (a first lab fight in a page differs from the later ones, sound or not: it warms up)unspy();
  if(threw){o.push('EXC '+threw.message+' '+threw.stack);return}
  const got=CUES.filter(n=>heard[n].length).map(n=>n+' '+heard[n].length);
  ok(heard.warcry.length&&(heard.volley.length||heard.hail.length)&&heard.order.length&&(heard.clash.length||heard.hit.length||heard.block.length),'a lab battle with the soundscape on is heard: '+got.join(', '));
  ok(off.fp===on.fp,'the soundscape changes nothing: the same field and the same next draw with it on or off ('+on.fp+')'+(off.fp===on.fp?'':': off '+off.fp));
  const looks=BS.stats.ticks-ticks0,per=(BS.stats.ms-ms0)/Math.max(1,looks);info('cost with sound on: '+on.ms.toFixed(3)+' ms a frame on average (a look at the field every '+BS.every+' s: '+per.toFixed(3)+' ms each, '+looks+' looks)')});
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
steps.reduce((p,f)=>p.then(()=>f()),Promise.resolve()).catch(e=>o.push('EXC '+e.message+' '+e.stack)).then(()=>{ok(A.stats.errors===0&&!K.stats.errors,'no sound error at all'+(A.stats.err?' (last: '+A.stats.err+')':'')+(K.stats.err?' (bank: '+K.stats.err+')':''));finish()})};
