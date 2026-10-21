'use strict';
/* ---------- sound (audio.js): every sound is made here by WebAudio, from oscillators, filtered noise and envelopes. Nothing is
   loaded: fetching files is unreliable from file://, and a phone downloads nothing.
   One AudioContext, made (or woken) by the first key, click or touch, as browsers require, and suspended while the tab is
   hidden. Its graph:  each sound → the effects bus ─┐
                       music.js's moods → the music bus ┴→ master → a compressor and a soft clip (a 400-man melee never clips) → out.
   sfx(name, opts) plays a cue of SFX; sfxAt(name, x, y) one heard from a point of the battlefield (panned, quieter far from the
   middle of the camera). Each cue has its own rate limit; at most AUDIO.voices sounds play at once.
   AUDIO.on false (tests/harness.js) or no WebAudio: every call is a cheap no-op that returns false and never throws.
   The volumes and mute are settings (ui.js PREFS: volmaster, volmusic, volsfx, mute; Shift+M mutes) ---------- */
// the sounds' own dice: never Math.random, so a seeded battle draws the same numbers with sound or without
function mkRng(seed){let s=seed>>>0;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const AUDIO={on:true,ctx:null,bus:null,noise:null,rng:mkRng(0xA5B1),
  vol:{master:.8,music:.5,sfx:.8},muted:false,// (the settings' values, 0–1; ui.js PREFS keeps them: audioPrefs)
  fxBoost:2,// the effects bus over its setting (about +6 dB: the cues sit above the music; the limiter holds the peaks)
  voices:24,// at most this many effects at once: past it a new one takes the place of the oldest less important one, or is dropped
  live:[],last:{},stats:{played:0,limited:0,capped:0,stolen:0,errors:0,err:''},
  ear:null};// sfxAt's listener: a function → {x, y, w} (the point heard from, the width of the view), else the battle camera
const quiet=p=>{if(p&&p.catch)p.catch(()=>{})};
// a setting's volume (0–1) as a gain: squared, so the steps sound even
const volGain=v=>{v=Math.max(0,Math.min(1,+v||0));return v*v};

/* ---------- the context ---------- */
// made on the first gesture (audioUnlock); a test may hand one in (an OfflineAudioContext). null: off, or no WebAudio
function audioStart(given){
  if(!AUDIO.on)return null;if(AUDIO.ctx)return AUDIO.ctx;
  try{const C=typeof window!=='undefined'&&(window.AudioContext||window.webkitAudioContext);if(!given&&!C)return null;
    const c=given||new C({latencyHint:'interactive'});
    const master=c.createGain(),music=c.createGain(),fx=c.createGain(),comp=c.createDynamicsCompressor(),clip=c.createWaveShaper();
    // the compressor, a light limiter: untouched below -14 dB, held firmly above it; then a soft clip for what slips past it
    comp.threshold.value=-14;comp.knee.value=10;comp.ratio.value=12;comp.attack.value=.002;comp.release.value=.18;
    const n=1024,curve=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;curve[i]=Math.abs(x)<.7?x:Math.sign(x)*(.7+.3*Math.tanh((Math.abs(x)-.7)/.3))}clip.curve=curve;
    music.connect(master);fx.connect(master);master.connect(comp);comp.connect(clip);clip.connect(c.destination);
    // noise: 2 s of it, made once; every hiss, thud and clash reads from it at its own offset
    const len=c.sampleRate*2|0,buf=c.createBuffer(1,len,c.sampleRate),d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=AUDIO.rng()*2-1;
    AUDIO.ctx=c;AUDIO.bus={master,music,fx,comp,clip};AUDIO.noise=buf;AUDIO.live=[];AUDIO.last={};audioPrefs();
    if(typeof musicWake==='function')musicWake();// (the mood already wanted starts now)
    return c}catch(e){AUDIO.ctx=null;AUDIO.bus=null;AUDIO.stats.errors++;AUDIO.stats.err='start: '+e.message;return null}}
// the context let go (tests; a fresh start)
function audioStop(){const c=AUDIO.ctx;if(typeof musicHalt==='function')musicHalt();AUDIO.ctx=null;AUDIO.bus=null;AUDIO.live=[];AUDIO.last={};
  try{if(c&&c.close&&c.state!=='closed')quiet(c.close())}catch(e){}}
// a key, click or touch: the context made, or woken (browsers start it suspended); the first also plays a silent sample (iOS)
function audioUnlock(){if(!AUDIO.on)return;const c=AUDIO.ctx||audioStart();if(!c)return;
  try{if(c.state==='suspended'&&!(typeof document!=='undefined'&&document.hidden)&&c.resume)quiet(c.resume());
    if(!AUDIO.primed){AUDIO.primed=true;const s=c.createBufferSource();s.buffer=c.createBuffer(1,1,22050);s.connect(c.destination);s.start(0)}}catch(e){}}
if(typeof window!=='undefined'){
  for(const ev of ['pointerdown','keydown','touchend'])window.addEventListener(ev,audioUnlock,{capture:true,passive:true});
  // a hidden tab is silent, and costs nothing: the context sleeps until the tab comes back
  document.addEventListener('visibilitychange',()=>{const c=AUDIO.ctx;if(!c)return;
    try{if(document.hidden){if(c.state==='running'&&c.suspend)quiet(c.suspend())}else if(AUDIO.on&&c.state==='suspended'&&c.resume)quiet(c.resume())}catch(e){}})}
// the buses follow the settings (AUDIO.vol, AUDIO.muted); AUDIO.level: the gains set, for a look
function audioVolumes(){const b=AUDIO.bus,c=AUDIO.ctx,L={master:AUDIO.muted?0:volGain(AUDIO.vol.master),music:volGain(AUDIO.vol.music),sfx:volGain(AUDIO.vol.sfx)*AUDIO.fxBoost};AUDIO.level=L;if(!b)return;
  const t=c.currentTime,set=(g,v)=>{try{g.gain.cancelScheduledValues(t);g.gain.setTargetAtTime(v,t,.03)}catch(e){g.gain.value=v}};
  set(b.master,L.master);set(b.music,L.music);set(b.fx,L.sfx)}
// the settings read (ui.js PREFS; the sound gallery has none and sets AUDIO.vol itself) and put on the buses
function audioPrefs(){if(typeof PREFS!=='undefined'&&PREFS.mute){AUDIO.muted=!!PREFS.mute.v;AUDIO.vol.master=PREFS.volmaster.v;AUDIO.vol.music=PREFS.volmusic.v;AUDIO.vol.sfx=PREFS.volsfx.v}audioVolumes()}

/* ---------- the synth: small parts the cues and music.js build from. V is one sound: {c: the context, t: its start time,
   out: where it goes, r: dice, p: a pitch factor}; at: seconds after V.t ---------- */
const AU={
  // a gain rising to peak in a, then dying away over d (exponentially, the way a struck or plucked thing does)
  env(V,s,a,d,peak,dest){const g=V.c.createGain(),p=g.gain;p.setValueAtTime(1e-4,s);p.linearRampToValueAtTime(Math.max(2e-4,peak),s+a);p.exponentialRampToValueAtTime(1e-4,s+a+d);g.connect(dest||V.out);return g},
  // a tone (sine, triangle, square, sawtooth), its pitch sliding from f to f1; lp: through a low-pass
  tone(V,{type='sine',f,f1,at=0,a=.004,d=.2,amp=.3,lp,dest}){const c=V.c,s=V.t+at,o=c.createOscillator();o.type=type;o.frequency.setValueAtTime(f*V.p,s);if(f1)o.frequency.exponentialRampToValueAtTime(f1*V.p,s+a+d);
    const g=AU.env(V,s,a,d,amp,dest);if(lp){const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=lp;o.connect(fl);fl.connect(g)}else o.connect(g);o.start(s);o.stop(s+a+d+.03);return a+d+at},
  // noise through a filter (bandpass, lowpass, highpass) whose frequency may sweep from f to f1
  noise(V,{ft='bandpass',f=1000,f1,q=1,at=0,a=.002,d=.15,amp=.3,dest}){const c=V.c,s=V.t+at,n=c.createBufferSource(),fl=c.createBiquadFilter();n.buffer=AUDIO.noise;
    fl.type=ft;fl.frequency.setValueAtTime(f,s);if(f1)fl.frequency.exponentialRampToValueAtTime(f1,s+a+d);fl.Q.value=q;const g=AU.env(V,s,a,d,amp,dest);n.connect(fl);fl.connect(g);
    n.start(s,V.r()*1.6);n.stop(s+a+d+.03);return a+d+at},
  // a plucked string (lute: sawtooth; harp: triangle): bright as it is struck, its low-pass closing as it dies
  pluck(V,{f,type='sawtooth',at=0,d=.9,amp=.25,bright=6,dest}){const c=V.c,s=V.t+at,F=f*V.p,o=c.createOscillator(),lp=c.createBiquadFilter();o.type=type;o.frequency.value=F;
    lp.type='lowpass';lp.Q.value=1.5;lp.frequency.setValueAtTime(Math.min(14000,F*bright),s);lp.frequency.exponentialRampToValueAtTime(Math.max(90,F*1.1),s+d*.7);
    o.connect(lp);lp.connect(AU.env(V,s,.003,d,amp,dest));o.start(s);o.stop(s+d+.03);return d+at},
  // a horn: two sawtooths a little apart, scooping up into the note, a low-pass opening as it speaks; f1: a fall (or rise) to it
  horn(V,{f,f1,at=0,a=.07,hold=.3,r=.25,amp=.2,scoop=.93,bright=5,dest}){const c=V.c,s=V.t+at,F=f*V.p,end=s+a+hold+r,g=c.createGain(),p=g.gain,lp=c.createBiquadFilter();
    p.setValueAtTime(1e-4,s);p.linearRampToValueAtTime(amp,s+a);p.setValueAtTime(amp,s+a+hold);p.exponentialRampToValueAtTime(1e-4,end);g.connect(dest||V.out);
    lp.type='lowpass';lp.Q.value=.8;lp.frequency.setValueAtTime(F*1.4,s);lp.frequency.linearRampToValueAtTime(F*bright,s+a*1.6);lp.frequency.linearRampToValueAtTime(F*bright*.6,end);lp.connect(g);
    for(const dt of [-8,8]){const o=c.createOscillator();o.type='sawtooth';o.detune.value=dt;o.frequency.setValueAtTime(F*scoop,s);o.frequency.exponentialRampToValueAtTime(F,s+a*1.5);
      if(f1){o.frequency.setValueAtTime(F,s+a+hold*.3);o.frequency.exponentialRampToValueAtTime(f1*V.p,end)}o.connect(lp);o.start(s);o.stop(end+.03)}
    return end-V.t},
  // a bell: sine partials at a bell's ratios, the high ones dying first
  bell(V,{f,at=0,d=2,amp=.15,parts=BELL,dest}){const c=V.c,s=V.t+at;for(const [m,v,k] of parts){const o=c.createOscillator();o.frequency.value=f*V.p*m;o.connect(AU.env(V,s,.002,d*k,amp*v,dest));o.start(s);o.stop(s+d*k+.03)}return d+at},
  // a held note (recorder, fiddle, drone): attack a, held for len, released over r; vib: a vibrato (cents) coming in on long notes
  voice(V,{f,type='triangle',at=0,len=.4,a=.03,r=.12,amp=.1,lp,q=.7,vib=0,chiff=0,dest}){const c=V.c,s=V.t+at,F=f*V.p,end=s+Math.max(a,len)+r,g=c.createGain(),p=g.gain;
    p.setValueAtTime(1e-4,s);p.linearRampToValueAtTime(amp,s+a);p.setValueAtTime(amp,s+Math.max(a,len));p.exponentialRampToValueAtTime(1e-4,end);g.connect(dest||V.out);
    let to=g;if(lp){const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=lp;fl.Q.value=q;fl.connect(g);to=fl}
    const o=c.createOscillator();o.type=type;o.frequency.value=F;o.connect(to);o.start(s);o.stop(end+.03);
    if(vib&&len>.35){const l=c.createOscillator(),lg=c.createGain();l.frequency.value=5.3;lg.gain.setValueAtTime(0,s);lg.gain.linearRampToValueAtTime(vib,s+Math.min(.45,len));l.connect(lg);lg.connect(o.detune);l.start(s);l.stop(end+.03)}
    if(chiff)AU.noise(V,{f:Math.min(9000,F*3),q:2,at,d:.05,amp:amp*chiff,dest});return end-V.t},
  // a frame drum: a thump falling to f, with the slap of its skin
  drum(V,{f=90,at=0,d=.35,amp=.5,skin=.25,dest}){const c=V.c,s=V.t+at,o=c.createOscillator();o.frequency.setValueAtTime(f*1.9*V.p,s);o.frequency.exponentialRampToValueAtTime(f*V.p,s+.05);
    o.connect(AU.env(V,s,.002,d,amp,dest));o.start(s);o.stop(s+d+.03);if(skin)AU.noise(V,{ft:'lowpass',f:1100,at,d:.06,amp:amp*skin,dest});return d+at},
  // the tabor's rim, or any small dry tap
  tek(V,{at=0,amp=.2,f=2600,q=1.8,d=.05,dest}){return AU.noise(V,{f,q,at,d,amp,dest})},
  // steel on steel: inharmonic partials ringing out, over a bright scrape
  metal(V,{f=2200,at=0,d=.35,amp=.18,dest}){const c=V.c,s=V.t+at;for(const [m,v,k] of METAL){const o=c.createOscillator();o.frequency.value=f*V.p*m*(1+(V.r()-.5)*.02);o.connect(AU.env(V,s,.001,d*k,amp*v,dest));o.start(s);o.stop(s+d*k+.03)}
    AU.noise(V,{ft:'highpass',f:4500,q:.7,at,d:.06,amp:amp*1.4,dest});return d+at}};
// partials: [ratio to f, loudness, how long against d]
const BELL=[[.5,.3,1.2],[1,1,1],[1.19,.45,.7],[1.5,.3,.6],[2,.4,.45],[2.74,.2,.3],[3.76,.12,.2]];
const CHIME=[[1,1,1],[2.76,.32,.4],[5.4,.12,.2]];// a small bell: brighter, fewer partials
const METAL=[[1,1,1],[1.47,.75,.8],[2.09,.55,.6],[2.56,.4,.5],[3.31,.25,.35]];
// a note (MIDI number) as a frequency
const mtof=m=>440*Math.pow(2,(m-69)/12);

/* ---------- the cues. g: the gallery's group; n: what it is; play(V, opts) → its length (s). gap: the fewest seconds between
   two of it; max: at most this many of it at once; pri: who gives way at the voice cap (a higher one takes a lower one's
   place); vol: its loudness; vary: a random pitch spread (±) ---------- */
const SFX={
  // the interface
  click:{g:'ui',n:'Click (any button)',pri:2,gap:.03,vol:.55,play:V=>{AU.noise(V,{f:2600,q:3,d:.025,amp:.45});AU.tone(V,{type:'triangle',f:1250,f1:800,d:.035,amp:.22});return .08}},
  confirm:{g:'ui',n:'Confirm (a primary button)',pri:2,gap:.05,vol:.6,play:V=>{AU.pluck(V,{f:392,d:.4,amp:.28});AU.pluck(V,{f:587.3,at:.07,d:.6,amp:.3});return .7}},
  back:{g:'ui',n:'Back / close',pri:2,gap:.05,vol:.5,play:V=>{AU.pluck(V,{f:587.3,d:.25,amp:.22,bright:4});AU.pluck(V,{f:440,at:.06,d:.4,amp:.24,bright:3});return .5}},
  refused:{g:'ui',n:'Refused / error',pri:2,gap:.15,vol:.6,play:V=>{for(const at of [0,.12])AU.tone(V,{type:'square',f:139,f1:117,at,d:.09,amp:.2,lp:700});AU.tek(V,{f:500,amp:.12,d:.04});return .3}},
  coin:{g:'ui',n:'Coin (trade)',pri:2,gap:.06,vol:.5,play:V=>{AU.bell(V,{f:2093,d:.35,amp:.16,parts:CHIME});AU.bell(V,{f:2637,at:.07,d:.45,amp:.14,parts:CHIME});AU.noise(V,{ft:'highpass',f:6000,d:.03,amp:.18});AU.noise(V,{ft:'highpass',f:6500,at:.07,d:.03,amp:.14});return .6}},
  levelup:{g:'ui',n:'Level up',pri:3,gap:.5,vol:.6,play:V=>{[293.7,370,440,587.3].forEach((f,i)=>AU.pluck(V,{f,at:i*.09,d:.9,amp:.22}));AU.bell(V,{f:1174.7,at:.36,d:1.4,amp:.1,parts:CHIME});AU.bell(V,{f:1480,at:.42,d:1.2,amp:.06,parts:CHIME});return 1.9}},
  notify:{g:'ui',n:'Notification',pri:2,gap:.3,vol:.5,play:V=>{AU.bell(V,{f:1318.5,d:.9,amp:.16,parts:CHIME});AU.bell(V,{f:1760,at:.12,d:1,amp:.11,parts:CHIME});return 1.2}},
  // the world
  encounter:{g:'world',n:'Encounter alert',pri:3,gap:1,vol:.7,play:V=>{AU.drum(V,{f:70,d:.4,amp:.6});AU.drum(V,{f:70,at:.18,d:.5,amp:.7});AU.horn(V,{f:146.8,f1:138.6,at:.2,a:.08,hold:.35,r:.3,amp:.16,bright:4});return 1}},
  town:{g:'world',n:'Entering a town (gate and bell)',pri:3,gap:2,vol:.6,play:V=>{AU.noise(V,{f:520,f1:880,q:9,a:.08,d:.45,amp:.12});AU.tone(V,{type:'triangle',f:95,f1:70,at:.45,d:.18,amp:.3});
    AU.bell(V,{f:330,at:.55,d:2.6,amp:.16});AU.bell(V,{f:247,at:1.35,d:3,amp:.14});return 4.4}},
  day:{g:'world',n:'A day passes (soft chime)',pri:1,gap:2,vol:.4,play:V=>{AU.bell(V,{f:1568,d:1.2,amp:.1,parts:CHIME});AU.bell(V,{f:2093,at:.2,d:1.4,amp:.07,parts:CHIME});return 1.6}},
  // the battle (the blows, shots and strikes: at most 16 of them at once, by their max)
  horn:{g:'battle',n:'Battle-start horn',pri:3,gap:2,vol:.75,play:V=>{AU.drum(V,{f:65,d:.6,amp:.5});AU.horn(V,{f:146.8,a:.12,hold:.8,r:.3,amp:.22,bright:4});AU.horn(V,{f:220,at:1.15,a:.1,hold:1.3,r:.6,amp:.24,bright:4.5});return 3.2}},
  charge:{g:'battle',n:'Charge horn',pri:3,gap:1.5,vol:.75,play:V=>{[220,277.2,329.6].forEach((f,i)=>AU.horn(V,{f,at:i*.17,a:.04,hold:.07,r:.06,amp:.2,scoop:.97}));AU.horn(V,{f:440,at:.52,a:.05,hold:.75,r:.3,amp:.22,scoop:.95,bright:4});return 1.7}},
  clash:{g:'battle',n:'Sword clash',gap:.06,max:4,vol:.55,vary:.08,play:V=>AU.metal(V,{f:1800+V.r()*700,d:.32,amp:.2})},
  hit:{g:'battle',n:'Blade on flesh',gap:.05,max:3,vol:.7,vary:.1,play:V=>{AU.noise(V,{ft:'lowpass',f:900,f1:200,q:1,d:.12,amp:.5});AU.tone(V,{f:150,f1:60,d:.1,amp:.4});AU.noise(V,{f:850,q:4,at:.01,d:.06,amp:.1});return .16}},
  block:{g:'battle',n:'Shield block',gap:.06,max:3,vol:.65,vary:.08,play:V=>{AU.tone(V,{type:'triangle',f:210,f1:140,d:.12,amp:.4});AU.noise(V,{f:480,q:2,d:.1,amp:.45});AU.metal(V,{f:1250,d:.12,amp:.05});return .2}},
  loose:{g:'battle',n:'Arrow loosed',gap:.06,max:3,vol:.45,vary:.1,play:V=>{AU.pluck(V,{f:196,type:'triangle',d:.14,amp:.3,bright:10});AU.noise(V,{f:3200,f1:900,q:2,a:.01,d:.18,amp:.22});return .22}},
  arrowhit:{g:'battle',n:'Arrow strikes',gap:.05,max:3,vol:.45,vary:.12,play:V=>{AU.noise(V,{f:1800,q:3,d:.04,amp:.45});AU.tone(V,{f:320,f1:170,d:.05,amp:.3});return .08}},
  brace:{g:'battle',n:'Spears brace',gap:.4,max:2,vol:.6,play:V=>{AU.drum(V,{f:62,d:.28,amp:.55,skin:.4});for(let i=0;i<5;i++)AU.tek(V,{f:1300+V.r()*900,q:6,at:.03+V.r()*.12,amp:.12,d:.03});AU.metal(V,{f:2600,at:.1,d:.12,amp:.04});return .4}},
  gallop:{g:'battle',n:'Cavalry gallop (short)',gap:.4,max:3,vol:.55,play:V=>{for(const at of [0,.09,.18,.4,.49,.58,.8,.89,.98]){AU.tone(V,{f:115,f1:68,at,d:.07,amp:.32});AU.noise(V,{ft:'lowpass',f:420,at,d:.05,amp:.22})}return 1.1}},
  rout:{g:'battle',n:'A unit routs (horn and cry)',pri:2,gap:1,vol:.65,play:V=>{AU.horn(V,{f:220,f1:146.8,a:.08,hold:.5,r:.5,amp:.18,scoop:1});AU.noise(V,{f:950,f1:480,q:6,a:.1,d:.9,amp:.09});AU.noise(V,{f:1300,f1:700,q:7,at:.15,a:.1,d:.8,amp:.06});return 1.2}},
  rally:{g:'battle',n:'Rally',pri:2,gap:1,vol:.65,play:V=>{AU.drum(V,{f:72,d:.3,amp:.45});AU.horn(V,{f:220,a:.05,hold:.18,r:.08,amp:.18});AU.drum(V,{f:72,at:.32,d:.35,amp:.5});AU.horn(V,{f:293.7,at:.32,a:.06,hold:.7,r:.35,amp:.2});return 1.5}},
  victory:{g:'battle',n:'Victory fanfare',pri:3,gap:2,vol:.7,play:V=>{[[0,293.7,.12],[.18,293.7,.12],[.36,440,.25],[.7,370,.12],[.88,440,.12],[1.06,587.3,1]].forEach(([at,f,hold])=>AU.horn(V,{f,at,a:.04,hold,r:.15,amp:.19,scoop:.97}));
    AU.drum(V,{f:80,at:1.06,d:.6,amp:.5});return 2.6}},
  defeat:{g:'battle',n:'Defeat stinger',pri:3,gap:2,vol:.7,play:V=>{[[0,220,.4],[.55,196,.4],[1.1,174.6,.45],[1.7,164.8,1.2]].forEach(([at,f,hold])=>AU.horn(V,{f,at,a:.1,hold,r:.3,amp:.16,bright:3}));
    AU.drum(V,{f:55,d:.9,amp:.5});AU.drum(V,{f:50,at:1.7,d:1.2,amp:.55});return 3.4}}};

/* ---------- playing them ---------- */
// is anything heard (the battle's hooks ask first, so a cue that needs reckoning costs nothing with sound off)
const sfxOn=()=>AUDIO.on&&!!AUDIO.ctx&&!AUDIO.muted;
// a cue, now (opts: vol, pan -1..1, pitch, delay s); false when it does not play (off, muted, unknown, held by its limit)
function sfx(name,o){
  if(!AUDIO.on||!AUDIO.ctx||AUDIO.muted)return false;const S=SFX[name];if(!S)return false;
  try{const c=AUDIO.ctx,now=c.currentTime,L=AUDIO.live;o=o||{};
    if(S.gap&&AUDIO.last[name]!=null&&now-AUDIO.last[name]<S.gap){AUDIO.stats.limited++;return false}
    for(let i=L.length-1;i>=0;i--)if(L[i].end<=now){voiceEnd(L[i]);L.splice(i,1)}
    if(S.max){let k=0;for(const v of L)if(v.name===name)k++;if(k>=S.max){AUDIO.stats.limited++;return false}}
    const pri=S.pri||0;
    if(L.length>=AUDIO.voices){// the cap: the oldest of the least important gives way, if less important than this one
      let k=-1;for(let i=0;i<L.length;i++)if(L[i].pri<pri&&(k<0||L[i].pri<L[k].pri||L[i].pri===L[k].pri&&L[i].t0<L[k].t0))k=i;
      if(k<0){AUDIO.stats.capped++;return false}voiceEnd(L[k],now);L.splice(k,1);AUDIO.stats.stolen++}
    const t=now+.01+(o.delay||0),out=c.createGain();out.gain.value=(S.vol==null?1:S.vol)*(o.vol==null?1:o.vol);
    if(o.pan&&c.createStereoPanner){const p=c.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,o.pan));out.connect(p);p.connect(AUDIO.bus.fx)}else out.connect(AUDIO.bus.fx);
    const r=AUDIO.rng,len=S.play({c,t,out,r,p:(o.pitch||1)*(S.vary?1+(r()*2-1)*S.vary:1)},o)||.5;
    L.push({name,pri,t0:now,end:t+len+.05,out});AUDIO.last[name]=now;AUDIO.stats.played++;return true
  }catch(e){AUDIO.stats.errors++;AUDIO.stats.err=name+': '+e.message;return false}}
// a voice over: let go (its sources have stopped), or (now given: stolen) faded out at once
function voiceEnd(v,now){try{if(now!=null){v.out.gain.cancelScheduledValues(now);v.out.gain.setTargetAtTime(0,now,.012)}else v.out.disconnect()}catch(e){}}
// where sfxAt listens from: AUDIO.ear, else the middle of the battle camera (camera.js), else nowhere (sfxAt plays it as sfx)
function audioEar(){if(AUDIO.ear)return AUDIO.ear();
  if(typeof B!=='undefined'&&B&&B.cam&&typeof BVW!=='undefined'){const c=B.cam,w=BVW/c.z;return{x:c.x+w/2,y:c.y+BVH/c.z/2,w}}return null}
// a cue from a point of the field: panned toward its side of the view, quieter the farther it is from the middle (at the
// view's edge about three quarters as loud), and not played at all three half-views away
function sfxAt(name,x,y,o){if(!AUDIO.on||!AUDIO.ctx||AUDIO.muted||!SFX[name])return false;
  try{const e=audioEar();if(!e)return sfx(name,o);const half=Math.max(1,e.w/2),dx=x-e.x,d=Math.hypot(dx,(y-e.y)*1.2)/half;if(!(d<=3))return false;
    return sfx(name,Object.assign({},o,{pan:Math.max(-1,Math.min(1,dx/half))*.75,vol:(o&&o.vol!=null?o.vol:1)/(1+d*d*.35)}))}catch(e){AUDIO.stats.errors++;AUDIO.stats.err=name+' at: '+e.message;return false}}
