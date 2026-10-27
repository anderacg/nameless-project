'use strict';
// Sound (audio.js, music.js): off, every call is a no-op; every cue and mood builds and is heard (rendered offline, never past
// full scale); the per-cue limit and the voice cap hold under a battle's pile-up; the settings are stored and mute silences;
// Shift+M mutes (M opens the full map); the music follows the scene (title, road, town, battle, its stinger, then on); a lab battle is heard (its blows,
// shots, charges and routs) and fought the same with sound on or off. Sound is played into an
// OfflineAudioContext whose clock the test moves (a Proxy over it), so nothing reaches the speakers.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),t=T,A=t.AUDIO,MU=t.MUSIC,G=t.G,P=t.P;
window.requestAnimationFrame=()=>0;// (the game's loop stops: audioWatch runs only when the test calls it)
const finish=()=>{try{t.audioStop();A.on=false;A.ear=null;A.voices=24}catch(e){}const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
const SR=22050;
// a context for the sound to play into: offline, its clock (k.t) moved by the test; k.made counts the nodes made
const clock=(sec=4)=>{const real=new OfflineAudioContext(2,Math.ceil(SR*sec),SR),k={t:0,made:{}};
  const ctx=new Proxy(real,{get:(x,key)=>{if(key==='currentTime')return k.t;const v=x[key];if(typeof v!=='function')return v;
    return(...a)=>{if(/^create/.test(key))k.made[key]=(k.made[key]||0)+1;return v.apply(x,a)}}});
  t.audioStop();A.on=true;MU.want=null;t.audioStart(ctx);return{ctx,k,real}};// (no mood left wanted: it would start with it)
const level=buf=>{let pk=0,ss=0,n=0;for(let ch=0;ch<buf.numberOfChannels;ch++){const d=buf.getChannelData(ch);for(let i=0;i<d.length;i++){const v=d[i];if(Math.abs(v)>pk)pk=Math.abs(v);ss+=v*v;n++}}return{pk,rms:Math.sqrt(ss/n)}};
const dB=v=>(20*Math.log10(Math.max(1e-9,v))).toFixed(1);
const CUES=['click','confirm','back','refused','coin','levelup','notify','distantbattle','encounter','town','day','horn','charge','clash','hit','block','loose','arrowhit','brace','gallop','rout','rally','victory','defeat'];
const BATTLE=['clash','hit','block','loose','arrowhit','brace','gallop','clash','hit','clash','block','loose'];
const MOODS=['menu','world','town','battle','victory','defeat'];
const steps=[];// (the rendering checks, run one after another)
try{
 // ---- off: nothing made, nothing thrown
 t.audioStop();A.on=false;
 {let threw=null,r=[];try{r=[t.sfx('clash'),t.sfxAt('hit',10,10),t.sfx('nope'),t.music('battle'),t.audioStart()];window.dispatchEvent(new PointerEvent('pointerdown'));window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyQ'}));t.audioWatch();t.musicSchedule()}catch(e){threw=e}
  ok(!threw&&r.every(x=>x===false||x===null)&&!A.ctx&&!MU.cur&&!MU.timer,'sound off (AUDIO.on false): sfx, sfxAt, music, a key or a click make nothing and throw nothing'+(threw?': '+threw.message:''))}
 A.on=true;{let threw=null,r=[];try{r=[t.sfx('clash'),t.sfxAt('hit',1,1),t.music('world')]}catch(e){threw=e}ok(!threw&&r.every(x=>x===false)&&!A.ctx,'on but no context yet (before the first gesture): still no-ops')}
 // ---- the cue table and the moods
 {const miss=CUES.filter(n=>!t.SFX[n]||typeof t.SFX[n].play!=='function'||!t.SFX[n].n||!['ui','world','battle'].includes(t.SFX[n].g));ok(!miss.length,CUES.length+' cues, each with a recipe, a name and a group'+(miss.length?': missing '+miss.join(', '):''))}
 ok(MOODS.every(n=>t.MOODS[n]),'moods: '+MOODS.join(', '));
 {const bad=[];for(const n of Object.keys(t.SFX)){clock(4);const e0=A.stats.errors;if(!t.sfx(n)||A.stats.errors!==e0)bad.push(n+(A.stats.err?' ('+A.stats.err+')':''))}
  ok(!bad.length,'every cue builds without an error ('+Object.keys(t.SFX).length+')'+(bad.length?': '+bad.join(', '):''))}
 {const bad=[],rate=[];for(const n of MOODS){const {k}=clock(9);const e0=A.stats.errors,n0=MU.notes;t.music(n);t.musicSchedule(8);
   const osc=(k.made.createOscillator||0)+(k.made.createBufferSource||0);rate.push(n+' '+(osc/8).toFixed(1)+'/s');
   if(A.stats.errors!==e0||!MU.cur||MU.cur.name!==n||(!t.MOODS[n].stinger&&MU.notes===n0))bad.push(n+(A.stats.err?' ('+A.stats.err+')':''));if(osc/8>45)bad.push(n+' makes '+(osc/8).toFixed(1)+' sources a second')}
  ok(!bad.length,'every mood composes 8 s without an error, few voices (sources a second: '+rate.join(', ')+')'+(bad.length?': '+bad.join(', '):''))}
 // ---- the per-cue limit
 {const {k}=clock(4),S=t.SFX.clash;k.t=1;const a=t.sfx('clash'),l0=A.stats.limited,b=t.sfx('clash');k.t+=S.gap+.001;const c=t.sfx('clash');
  ok(a&&!b&&c&&A.stats.limited===l0+1,'a cue again within its gap ('+S.gap+' s) is held back; after it, it plays');
  let n=A.live.filter(v=>v.name==='clash').length;while(n<S.max){k.t+=S.gap+.001;if(t.sfx('clash'))n++;else break}k.t+=S.gap+.001;const over=t.sfx('clash');
  ok(n===S.max&&!over&&A.live.filter(v=>v.name==='clash').length===S.max,'at most '+S.max+' clashes ring at once');
  k.t+=2;ok(t.sfx('clash')&&A.live.length===1,'once they have died away it plays again (the finished voices let go)')}
 // ---- the voice cap: a pile-up of battle sounds; a horn still gets through
 {const {k}=clock(4);A.voices=6;const r=t.mkRng(5);let most=0;const s0={...A.stats};
  for(let i=0;i<60;i++){k.t=i*2/60;t.sfx(BATTLE[Math.floor(r()*BATTLE.length)],{vol:.5+r()*.5});most=Math.max(most,A.live.length)}
  const capped=A.stats.capped-s0.capped;k.t+=1;for(const n of new Set(BATTLE))t.sfx(n);// (full again: seven kinds at once)
  const full=A.live.length===6,st0=A.stats.stolen,h=t.sfx('horn');
  ok(most<=6&&capped>0,'the voice cap holds: at most '+most+' of 6 at once; '+capped+' dropped, '+(A.stats.limited-s0.limited)+' held by their own limits');
  ok(full&&h&&A.stats.stolen===st0+1&&A.live.length<=6,'a horn at the cap takes the place of a lesser sound');A.voices=24}
 // ---- sfxAt: panned and quieter off the middle of the view, unheard far off
 {clock(4);A.ear=()=>({x:400,y:300,w:800});const L=A.live;t.sfxAt('clash',400,300);const mid=L[L.length-1];A.last={};t.sfxAt('clash',800,300);const edge=L[L.length-1];A.last={};
  const far=t.sfxAt('clash',400+1400,300);ok(mid&&edge&&mid!==edge&&edge.out.gain.value<mid.out.gain.value*.8&&!far,'sfxAt: quieter at the edge of the view (gain '+(edge&&edge.out.gain.value.toFixed(2))+' vs '+(mid&&mid.out.gain.value.toFixed(2))+'), unheard three half-views off');A.ear=null}
 // ---- the settings: stored, read back, applied; mute
 {const key=k=>localStorage.getItem('ashmark.'+k);try{localStorage.clear()}catch(e){}
  ok(['mute','volmaster','volmusic','volsfx'].every(k=>Object.keys(t.PREFS).includes(k)),'four sound settings in PREFS, like the rest');
  ok(t.prefLoad('volmaster')===.8&&t.prefLoad('volmusic')===.5&&t.prefLoad('volsfx')===.8&&t.prefLoad('mute')===false,'defaults: volume 0.8, music 0.5, effects 0.8, sound on');
  const reads=[['0.3',.3],['0',0],['1',1],['junk',.5],['1.5',.5],['-1',.5],['',.5]].filter(([s,v])=>{localStorage.setItem('ashmark.volmusic',s);return t.prefLoad('volmusic')!==v});
  ok(!reads.length,'a stored volume reads back; out of range or junk gives the default'+(reads.length?': wrong for '+reads.map(x=>x[0]).join('|'):''));
  clock(4);t.prefSet('volmusic',.3);t.prefSet('volsfx',.6);ok(key('volmusic')==='0.3'&&key('volsfx')==='0.6'&&A.vol.music===.3&&Math.abs(A.level.music-.09)<1e-9&&Math.abs(A.level.sfx-.36*A.fxBoost)<1e-9,'a volume set is stored (ashmark.volmusic "0.3") and put on its bus at once (gain '+A.level.music.toFixed(2)+')');
  t.prefSet('mute',true);const m1=t.sfx('click');ok(key('mute')==='1'&&A.muted&&A.level.master===0&&!m1,'mute: stored, master at 0, and a cue then makes nothing');
  t.prefSet('mute',false);ok(key('mute')==='0'&&!A.muted&&t.sfx('click'),'sound back on: cues play');
  const press=()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyM',key:'M',shiftKey:true}));G.mode='world';G.modal=false;press();const on1=t.prefGet('mute')&&key('mute')==='1'&&A.muted;press();
  ok(on1&&!t.prefGet('mute')&&key('mute')==='0'&&/Sound on/.test((document.querySelector('#log')?.lastElementChild||{}).textContent),'Shift+M mutes, and Shift+M again brings the sound back ("Sound on.", on the screen: no journal line)');
  t.showTitle('settings');const pn=()=>document.getElementById('panel');
  ok(pn().querySelectorAll('[data-act="sound"]').length===2&&['volmaster','volmusic','volsfx'].every(k=>pn().querySelectorAll('[data-act="'+k+'"]').length===5)&&/data-nav="back"/.test(pn().innerHTML),'Settings: Sound off/on and three volumes (0–100%), the bottom bar\'s Back still there');
  t.act('sound','off');const off=A.muted&&pn().querySelector('[data-act="sound"][data-arg="off"]').classList.contains('on');t.act('volsfx','0.25');
  ok(off&&t.prefGet('volsfx')===.25&&key('volsfx')==='0.25'&&pn().querySelector('[data-act="volsfx"][data-arg="0.25"]').classList.contains('on')&&G.menu==='settings','its buttons set, store and show the setting');
  t.act('sound','on');t.prefSet('volmusic',.5);t.prefSet('volsfx',.8);ok(!A.muted,'and Sound on')}
 // ---- the music follows the scene
 {const {k}=clock(4),cur=()=>MU.cur&&MU.cur.name;let threw=null;
  try{
   t.showTitle();t.audioWatch();ok(MU.want==='menu'&&cur()==='menu','the title: the menu music');
   t.act('begin','soldier');G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();k.t=1;t.audioWatch();
   ok(cur()==='world'&&MU.fading.some(I=>I.name==='menu'),'a game begun: the road\'s music, crossfading from the title\'s');
   k.t=3;t.musicSchedule();ok(!MU.fading.length,'the old mood let go once the crossfade ('+MU.xf+' s) is over');
   {const d0=A.last.day;G.day++;k.t=4;t.audioWatch();ok(A.last.day===4&&d0!==4,'a new day: the soft chime')}
   G.lastTown=null;t.enterTown(t.townBy('Ashford'));k.t=5;t.audioWatch();ok(cur()==='town'&&A.last.town===5,'into a town: the town\'s music, the gate and its bells');
   G.mode='esc';G.esc={mode:'town'};ok(t.sceneMood()==='town','the pause menu keeps the music of what is under it');G.mode='town';G.esc=null;
   t.act('leave');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);k.t=6;t.audioWatch();ok(cur()==='world','out of the town: the road again');
   t.startEncounter({kind:'party',ref:t.asParty({x:P.x,y:P.y,cool:0,troops:['militia','militia','militia']}),n:3,list:['militia','militia','militia']});k.t=7;t.audioWatch();ok(A.last.encounter===7&&cur()==='world','met on the road: the alert');
   t.act('fight');k.t=8;t.audioWatch();ok(G.mode==='battle'&&cur()==='battle'&&A.last.horn===8,'a battle: the battle music, the horn as it begins');
   t.beginFight();// (a battle opens ready, paused for Start Battle: f8cfe32)
   const B=t.B;B.over=true;B.win=true;k.t=9;t.audioWatch();ok(cur()==='victory'&&MU.cur.M.stinger,'won: the victory stinger');
   B.win=false;ok(t.sceneMood()==='defeat','lost (or withdrawn): the defeat stinger');B.win=true;
   B.endT=0;t.updateBattle(.01);t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);k.t=9.5;t.audioWatch();
   ok(MU.want==='world'&&cur()==='victory','back on the road, the stinger still plays out');
   k.t=16;t.musicSchedule();ok(cur()==='world','then the road\'s music comes in');
   ok(A.stats.errors===0,'no sound error along the way'+(A.stats.err?' (last: '+A.stats.err+')':''))
  }catch(e){threw=e}if(threw)o.push('EXC '+threw.message+' '+threw.stack)}
 // ---- a battle heard (attacks.js, projectiles.js, morale.js, unitabilities.js, commands.js, commander.js): a lab fight with
 // sound on plays its blows, shots, strikes, charges and routs, never past the voice cap; on or off, the fight is the same
 // (sound draws no dice and changes nothing: the field and the next draw of the battle's seeded Math.random match)
 {const L=t.BattleLab,BC=['clash','hit','block','loose','arrowhit','brace','gallop','charge','rout','rally'],keep={},heard={};
  const cfg={leftGroups:[{type:'hum_foot',count:30},{type:'hum_bow',count:20},{type:'hum_knight',count:12}],rightGroups:[{type:'hum_levy',count:30},{type:'hum_bow',count:16},{type:'hum_squire',count:10}],morale:true,deploy:false,paused:true,ai:true,seed:11};
  for(const n of BC){keep[n]=t.SFX[n].play;t.SFX[n].play=(V,x)=>{heard[n]=(heard[n]||0)+1;return keep[n](V,x)}}
  const fight=on=>{if(L.active)L.exit();G.mode='world';G.modal=false;t.audioStop();A.on=false;L.start(cfg);const b=t.B;b.paused=false;let k=null,most=0,loud=0;
   if(on){k=clock(1).k;A.ear=()=>({x:t.BW/2,y:t.BH/2,w:t.BW*2})}// (heard from the middle of the field, all of it)
   for(let f=0;f<30*60&&!L.session.result;f++){
    if(f===30){const g=Object.values(b.groups).find(x=>!x.foe&&x.units.some(u=>u.type==='hum_foot'));if(g){t.selectGroup(g.id);t.setOrder('charge')}}// (your foot ordered to charge: the horn)
    t.updateBattle(1/30);if(k){k.t=b.t;most=Math.max(most,A.live.length);loud=Math.max(loud,A.live.filter(v=>v.end>k.t).length)}}
   let h=2166136261;const mix=v=>{h=Math.imul(h^(v|0),16777619)>>>0};for(const u of b.units){mix(u.x*1e6);mix(u.y*1e6);mix(u.hp*1e3);mix(u.rout?1:0)}mix(Math.random()*1e9);
   const r={fp:h.toString(16)+' @'+b.t.toFixed(1)+'s',most,loud,routs:Object.values(b.groups).filter(g=>g.resolve&&g.resolve.routed).length};A.ear=null;L.exit();t.audioStop();A.on=false;return r};
  let off,on,threw=null;try{off=fight(false);on=fight(true)}catch(e){threw=e}for(const n of BC)t.SFX[n].play=keep[n];
  if(threw)o.push('EXC '+threw.message+' '+threw.stack);else{
   const need=[['clash or hit',heard.clash||heard.hit],['loose',heard.loose],['arrowhit',heard.arrowhit],['rout',heard.rout],['charge or gallop',heard.charge||heard.gallop]],miss=need.filter(x=>!x[1]).map(x=>x[0]);
   ok(!miss.length,'a lab battle with sound on is heard: '+BC.filter(n=>heard[n]).map(n=>n+' '+heard[n]).join(', ')+(miss.length?'; never: '+miss.join(', '):''));
   ok(on.most<=A.voices,'and never past the voice cap: at most '+on.loud+' sounding at once ('+on.most+' held) of '+A.voices);
   ok(off.fp===on.fp,'sound changes nothing: the same field and the same next draw with sound on or off ('+on.fp+', '+on.routs+' routed)'+(off.fp===on.fp?'':': off '+off.fp))}}
 // ---- heard: each cue, each mood and a battle's pile-up rendered offline: audible, never past full scale (the limiter)
 for(const n of CUES)steps.push(()=>{const {real}=clock(5);t.sfx(n);return real.startRendering().then(b=>level(b)).then(l=>({n,...l}))});
 steps.push(()=>{const {k,real}=clock(3.5),r=t.mkRng(9);A.ear=()=>({x:400,y:300,w:800});const s0={...A.stats};let most=0;
  for(let i=0;i<60;i++){k.t=i*2/60;t.sfxAt(BATTLE[Math.floor(r()*BATTLE.length)],r()*800,300+(r()-.5)*400);most=Math.max(most,A.live.length)}
  A.ear=null;const s={played:A.stats.played-s0.played,limited:A.stats.limited-s0.limited,capped:A.stats.capped-s0.capped,most};
  return real.startRendering().then(b=>({n:'stress',...level(b),s}))});
 for(const n of MOODS)steps.push(()=>{const {real}=clock(7);t.music(n);t.musicSchedule(6.5);return real.startRendering().then(b=>({n:'music '+n,...level(b)}))});
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
// the renders, in turn
const res=[];
steps.reduce((p,f)=>p.then(()=>f().then(x=>{res.push(x)})),Promise.resolve()).then(()=>{
  const cues=res.filter(x=>CUES.includes(x.n)),quietC=cues.filter(x=>x.pk<.02),hot=res.filter(x=>x.pk>1);
  ok(cues.length===CUES.length&&!quietC.length,'every cue is heard (peaks '+cues.map(x=>x.n+' '+dB(x.pk)).join(', ')+' dBFS)'+(quietC.length?': too quiet '+quietC.map(x=>x.n).join(', '):''));
  const st=res.find(x=>x.n==='stress');
  ok(st&&st.pk<=1&&st.pk>.05&&st.s.most<=A.voices,'battle stress (60 cues in 2 s): peak '+(st&&dB(st.pk))+' dBFS, no clipping; '+(st&&st.s.played)+' played, '+(st&&st.s.limited)+' held by their limits, '+(st&&st.s.capped)+' over the cap, at most '+(st&&st.s.most)+' at once');
  const mus=res.filter(x=>/^music/.test(x.n)),quietM=mus.filter(x=>x.rms<.003);
  ok(mus.length===MOODS.length&&!quietM.length,'every mood is heard (rms '+mus.map(x=>x.n.slice(6)+' '+dB(x.rms)+' (peak '+dB(x.pk)+')').join(', ')+' dBFS)'+(quietM.length?': silent '+quietM.map(x=>x.n).join(', '):''));
  ok(!hot.length,'nothing rendered goes past full scale'+(hot.length?': '+hot.map(x=>x.n+' '+x.pk.toFixed(2)).join(', '):''));
  ok(A.stats.errors===0,'no sound errors at all'+(A.stats.err?' (last: '+A.stats.err+')':''));
}).catch(e=>o.push('EXC '+e.message+' '+e.stack)).then(finish)};
