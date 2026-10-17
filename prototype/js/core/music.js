'use strict';
/* ---------- music (music.js): generative, in the old modes (Dorian, Aeolian, Mixolydian), played on audio.js's synth: a plucked
   lute or harp, a drone (a fiddle's open strings), a recorder or fiddle for the tune, a frame drum and tabor.
   Each mood (MOODS) has its own key, mode, pace and three motifs drawn once from its seed, so it is always recognisable; every
   phrase (four bars) is made afresh from them (repeated, moved up or down the scale, turned upside down, a note split, a new
   ending, a new chord walk), so it never loops. Victory and defeat are stingers: played once, then silence until the scene
   moves on. Notes go on the audio clock up to MUSIC.ahead s ahead, put there by a light timer (a lookahead scheduler); a new
   mood crossfades in over MUSIC.xf s. music(name) asks for a mood; audioWatch (main.js's loop) asks for the scene's ---------- */
const MODES={dorian:[0,2,3,5,7,9,10],aeolian:[0,2,3,5,7,8,10],mixolydian:[0,2,4,5,7,9,10]};
/* a mood: mode and root (MIDI), step (s, an eighth) and bar (steps), seed (its motifs), lead (recorder, fiddle), acc (the
   accompaniment: lute, harp, jig, ostinato), drone (MIDI notes held, and their loudness), drums (a DRUM_PATS set) and drumAmp,
   leadP: the chance a phrase carries the tune (else the accompaniment alone), rest: the chance a note of the tune rests */
const MOODS={
  menu:{n:'Title',mode:'dorian',root:52,step:.42,bar:6,seed:7,lead:'recorder',acc:'harp',drone:[[40,47],.05],drums:null,leadP:.8,rest:.15},
  world:{n:'Travelling',mode:'dorian',root:50,step:.34,bar:8,seed:19,lead:'recorder',acc:'lute',drone:[[38,45],.055],drums:'soft',drumAmp:.3,leadP:.55,rest:.25},
  town:{n:'Town',mode:'mixolydian',root:55,step:.2,bar:6,seed:31,lead:'recorder',acc:'jig',drone:[[43,50],.03],drums:'jig',drumAmp:.45,leadP:.85,rest:.1},
  battle:{n:'Battle',mode:'aeolian',root:45,step:.235,bar:8,seed:43,lead:'fiddle',acc:'ostinato',drone:[[33,45],.06],drums:'war',drumAmp:.7,leadP:.65,rest:.15},
  victory:{n:'Victory',stinger:'victory'},
  defeat:{n:'Defeat',stinger:'defeat'}};
// rhythms of one bar (in steps), by bar length
const RHYTHMS={8:[[2,2,2,2],[3,1,2,2],[1,1,2,4],[2,1,1,4],[4,2,2],[2,2,4],[1,1,1,1,2,2],[3,1,4],[2,2,1,1,2]],6:[[2,1,2,1],[2,2,2],[3,1,2],[1,1,1,3],[2,1,3],[4,2],[1,1,1,1,2]]};
// a phrase's bars: which motif, and how changed (+ up the scale, - down, ^ upside down); the last is always the cadence
const PHRASE_FORMS=[['A','A+','B','C'],['A','B','A','C'],['A','A-','B','C'],['B','A','B+','C'],['A','B','B-','C'],['A','A^','B','C']];
// the chord under each bar (a degree of the mode), by mode
const PROG={dorian:[[0,6,3,0],[0,3,0,4],[0,0,6,0],[0,6,0,4],[0,3,6,0]],aeolian:[[0,5,6,0],[0,0,5,4],[0,3,6,0],[0,6,5,4],[0,5,3,4]],mixolydian:[[0,6,3,0],[0,3,6,0],[0,0,6,0],[0,4,6,0]]};
// the drums of a bar (D: the frame drum's thump, t: the tabor's rim, -: nothing); warFill ends a battle phrase
const DRUM_PATS={soft:['D-------','D---t---','D-------'],jig:['D-tD-t','D-tt-t','D--D-t'],war:['D-tDD-t-','D-t-D-tt','DtD-D-tt'],warFill:['D-D-DDDD','DtDtDDtD','D-DtDDDD']};
// a degree of a mood's mode (any whole number: 7 is the octave up) as a MIDI note
const degNote=(M,d)=>{const sc=MODES[M.mode],i=((d%7)+7)%7;return M.root+12*Math.floor(d/7)+sc[i]};
// cur: the mood playing; fading: moods crossfading out; want: the mood asked for (kept while there is no sound yet)
const MUSIC={cur:null,fading:[],want:null,timer:null,count:0,ahead:.4,tick:.1,xf:1.8,notes:0,gain:2.4};// gain: a mood's loudness on the music bus

// ask for a mood (null: silence); false while there is no sound. A stinger plays out before the next mood comes in
function music(name){MUSIC.want=name&&MOODS[name]?name:null;if(!AUDIO.on||!AUDIO.ctx)return false;
  try{const cur=MUSIC.cur;if(cur?cur.name===MUSIC.want:!MUSIC.want)return true;
    if(cur&&cur.M.stinger&&AUDIO.ctx.currentTime<cur.end-.3)return true;// (musicSchedule moves on once it ends)
    musicSwitch(MUSIC.want);return true}catch(e){AUDIO.stats.errors++;AUDIO.stats.err='music '+name+': '+e.message;return false}}
// the sound has just started (audioStart): the mood already asked for comes in
function musicWake(){if(MUSIC.want)music(MUSIC.want)}
// everything stopped (audioStop)
function musicHalt(){if(MUSIC.timer)clearInterval(MUSIC.timer);MUSIC.timer=null;MUSIC.cur=null;MUSIC.fading=[]}
function musicSwitch(name){const c=AUDIO.ctx,now=c.currentTime,old=MUSIC.cur;
  if(old){const g=old.gain.gain;g.cancelScheduledValues(now);g.setValueAtTime(g.value,now);g.linearRampToValueAtTime(0,now+MUSIC.xf);old.out=now+MUSIC.xf+.05;MUSIC.fading.push(old)}
  MUSIC.cur=null;
  if(name){const M=MOODS[name],gain=c.createGain();gain.connect(AUDIO.bus.music);
    const I={name,M,gain,t:now+.08,n:0,bar:0,ph:null,end:Infinity,out:Infinity,rng:mkRng(((M.seed||1)*7919)^(++MUSIC.count*104729)^(Date.now()&0xfffff)),motifs:M.stinger?null:musicMotifs(M)};
    if(M.stinger){gain.gain.value=MUSIC.gain;I.end=musicStinger(I,now+.05)}else{gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(MUSIC.gain,now+MUSIC.xf)}
    MUSIC.cur=I}
  musicSchedule();}
// the scheduler: every MUSIC.tick s (a timer only wakes it; the notes are timed by the audio clock), the notes due before
// now + ahead are put on the clock. ahead: more (a test renders a stretch offline)
function musicSchedule(ahead){const c=AUDIO.ctx;if(!c){musicTimer();return}const now=c.currentTime,h=now+(ahead||MUSIC.ahead),cur=MUSIC.cur;
  if(cur&&cur.M.stinger&&MUSIC.want!==cur.name&&now>=cur.end-.3)return musicSwitch(MUSIC.want);// (a stinger over: on to the mood wanted)
  for(const I of MUSIC.fading.concat(cur?[cur]:[]))if(!I.M.stinger){if(I.t<now-.25)I.t=now+.05;// (fell behind: the tab slept)
    while(I.t<Math.min(h,I.out)){if(!AUDIO.muted)musicStep(I,I.t);I.t+=I.M.step;I.n++}}
  MUSIC.fading=MUSIC.fading.filter(I=>{if(now<I.out)return true;try{I.gain.disconnect()}catch(e){}return false});
  musicTimer()}
function musicTimer(){const need=!!(AUDIO.ctx&&(MUSIC.cur||MUSIC.fading.length));
  if(need&&!MUSIC.timer)MUSIC.timer=setInterval(()=>{try{musicSchedule()}catch(e){AUDIO.stats.errors++;AUDIO.stats.err='music: '+e.message}},MUSIC.tick*1000);
  else if(!need&&MUSIC.timer){clearInterval(MUSIC.timer);MUSIC.timer=null}}

/* ---------- composing ---------- */
// a mood's three motifs, from its seed: A (where it starts), B (higher), C (the cadence, falling home). A motif: one bar's
// rhythm (r, steps) and the degree of each note (d), mostly by step, now and then a leap
function musicMotifs(M){const r=mkRng(M.seed),bank=RHYTHMS[M.bar];
  const mk=(start,fall)=>{const rh=bank[Math.floor(r()*bank.length)].slice(),d=[];let x=start;
    for(let i=0;i<rh.length;i++){d.push(x);const u=r();x+=u<.35?1:u<.7?-1:u<.85?(r()<.5?2:-2):u<.93?0:(r()<.5?3:-3);if(fall)x=Math.min(x,d[i]);x=Math.max(-2,Math.min(9,x))}
    return{r:rh,d}};
  return[mk([0,2,4][Math.floor(r()*3)]),mk(4+Math.floor(r()*2)),mk(4,true)]}
// a phrase: four bars of tune (each [{s: its step, l: its length, d: degree or null (a rest)}]), the chords under them, and
// what plays: the tune or not, the accompaniment's pattern, the drums
function musicPhrase(I){const M=I.M,r=I.rng,pick=a=>a[Math.floor(r()*a.length)],[A,Bm,C]=I.motifs,form=pick(PHRASE_FORMS),chords=pick(PROG[M.mode]);
  const mel=form.map((f,i)=>{const m=f[0]==='A'?A:f[0]==='B'?Bm:C;let d=m.d.slice();const rh=m.r.slice();
    if(f[1]==='+')d=d.map(x=>x+1+(r()<.4?1:0));if(f[1]==='-')d=d.map(x=>x-1-(r()<.4?1:0));if(f[1]==='^')d=d.map(x=>2*m.d[0]-x);
    // now and then a long note split in two (a passing note), so even a repeat is not quite the same
    if(r()<.35){const k=rh.findIndex(l=>l>=2);if(k>=0){const l=rh[k],a=l>>1;rh.splice(k,1,a,l-a);d.splice(k+1,0,d[k]+(r()<.5?1:-1))}}
    // the cadence: home (or to the fifth, over the fifth's chord), held
    if(i===3)d[d.length-1]=chords[3]===4?4:d[d.length-1]>3?7:0;
    let s=0;return rh.map((l,j)=>{const e={s,l,d:j&&i<3&&r()<M.rest?null:d[j]};s+=l;return e})});
  const dr=M.drums&&DRUM_PATS[M.drums];
  return{mel,chords,lead:r()<M.leadP,horn:r()<.35,acc:Math.floor(r()*3),drum:dr?pick(dr):null,fill:M.drums==='war'?pick(DRUM_PATS.warFill):null}}
// one step of a mood at time t: a new phrase every four bars, the drone every two, then the tune, accompaniment and drums
function musicStep(I,t){const M=I.M,s=I.n%M.bar,V={c:AUDIO.ctx,t,out:I.gain,r:I.rng,p:1};
  if(s===0){const b=Math.floor(I.n/M.bar)%4;if(b===0||!I.ph)I.ph=musicPhrase(I);I.bar=b;if(b%2===0)musicDrone(I,V)}
  const ph=I.ph,ch=ph.chords[I.bar],n=d=>mtof(degNote(M,d));MUSIC.notes++;
  // the tune
  if(ph.lead){const e=ph.mel[I.bar].find(x=>x.s===s);if(e&&e.d!=null){const f=n(e.d+7),len=e.l*M.step*.92;
    if(M.lead==='fiddle'&&ph.horn)AU.horn(V,{f,a:.05,hold:Math.max(.05,len-.1),r:.15,amp:.09,scoop:.97,bright:4});
    else if(M.lead==='fiddle')AU.voice(V,{f,type:'sawtooth',len,a:.05,r:.1,amp:.06,lp:2200,q:1.2,vib:9});
    else AU.voice(V,{f:f*2,type:'sine',len,a:.03,r:.08,amp:.11,vib:12,chiff:.6})}}
  // the accompaniment
  if(M.acc==='lute'){if(s%2===0){const k=s/2,d=ch+[[0,2,4,7],[0,4,2,4],[0,4,7,4]][ph.acc][k%4];AU.pluck(V,{f:n(d),d:1.2,amp:k?.13:.18,bright:5})}}
  else if(M.acc==='harp'){if(s<4)AU.pluck(V,{f:n(ch+[0,2,4,7][s]),type:'triangle',d:2,amp:.14,bright:8})}
  else if(M.acc==='jig'){const pat=[[ch-7,.15],[ch+2,.07],[ch+4,.07],[ch-3,.13],[ch+2,.07],[ch+4,.07]][s];if(s%3===0||ph.acc)AU.pluck(V,{f:n(pat[0]),d:s%3?.35:.6,amp:pat[1],bright:s%3?6:4})}
  else if(M.acc==='ostinato'){const d=ch+[[0,0,7,0,0,0,5,4],[0,0,4,0,0,7,0,5],[0,7,0,0,4,0,5,0]][ph.acc][s];AU.pluck(V,{f:n(d),d:.3,amp:s%4?.1:.15,bright:3.5})}
  // the drums
  if(ph.drum&&(M.drums!=='soft'||ph.lead)){const pat=I.bar===3&&ph.fill?ph.fill:ph.drum,x=pat[s],a=M.drumAmp;
    if(x==='D')AU.drum(V,{f:M.drums==='war'?68:88,d:.35,amp:(s===0?1:.7)*a,skin:.3});else if(x==='t')AU.tek(V,{amp:.35*a})}}
// the drone: the mood's held notes, bowed in slowly, two bars long and overlapping the next
function musicDrone(I,V){const M=I.M,[notes,amp]=M.drone,len=M.bar*M.step*2;for(const m of notes)AU.voice(V,{f:mtof(m),type:'sawtooth',len,a:.7,r:1.1,amp,lp:520+m*4,q:1})}
// a stinger: written out, played once from t; → when it ends
function musicStinger(I,t){const V={c:AUDIO.ctx,t,out:I.gain,r:I.rng,p:1};
  if(I.M.stinger==='victory'){// D Mixolydian: a horn call, a drum roll, the lute's chord, a bell
    for(const [at,m,h] of [[0,62,.14],[.2,62,.14],[.4,69,.3],[.8,66,.14],[1,69,.14],[1.2,74,1.5]])AU.horn(V,{f:mtof(m),at,a:.04,hold:h,r:.2,amp:.13,scoop:.97,bright:4.5});
    for(const at of [0,.4,.8,1])AU.drum(V,{f:85,at,d:.3,amp:.4});for(let i=0;i<6;i++)AU.tek(V,{at:1+i*.035,amp:.15});AU.drum(V,{f:70,at:1.2,d:.8,amp:.6});
    [50,57,62,66,69].forEach((m,i)=>AU.pluck(V,{f:mtof(m),at:1.2+i*.03,d:2.4,amp:.12}));AU.bell(V,{f:mtof(86),at:1.25,d:2,amp:.06,parts:CHIME});
    for(const m of [38,45])AU.voice(V,{f:mtof(m),type:'sawtooth',at:1.2,len:2.2,a:.3,r:1.2,amp:.05,lp:600});return t+5}
  // defeat, A Aeolian: a falling line over a low drone, the drum tolling
  for(const m of [33,45])AU.voice(V,{f:mtof(m),type:'sawtooth',len:4.2,a:.9,r:1.5,amp:.06,lp:450});
  for(const [at,m,l] of [[.3,64,.55],[.9,62,.55],[1.5,60,.55],[2.1,59,.5],[2.7,57,1.8]])AU.voice(V,{f:mtof(m),type:'sawtooth',at,len:l,a:.08,r:.25,amp:.06,lp:1800,vib:10});
  AU.drum(V,{f:55,d:1,amp:.55});AU.drum(V,{f:50,at:2.7,d:1.4,amp:.6});AU.horn(V,{f:mtof(45),at:2.7,a:.25,hold:1.4,r:1,amp:.08,bright:2.5});return t+6}

/* ---------- the game's scene → its music and its sounds (audioWatch, every frame from main.js's loop; cheap with sound off) ---------- */
// the mood for what is on the screen: the title, a battle (its stinger once it is over), a town (its window or its streets), the road
function sceneMood(){if(typeof G==='undefined')return null;const m=G.mode==='esc'&&G.esc?G.esc.mode:G.mode,b=typeof B!=='undefined'?B:null;
  if(m==='title')return 'menu';
  if(m==='battle'&&b)return b.over?(b.win?'victory':'defeat'):'battle';
  if(G.town||G.scene||m==='town'||m==='scene')return 'town';
  return 'world'}
// what the last frame saw (to hear what changed)
const AW={mode:null,enc:null,town:false,day:null,lv:null,fight:null};
function audioWatch(){if(typeof G==='undefined')return;const mood=sceneMood();if(mood!==MUSIC.want)music(mood);
  const m=G.mode,b=typeof B!=='undefined'?B:null,lv=typeof P!=='undefined'?P.level:null,away=x=>x==='title'||x==='esc',
    calm=AW.mode!=null&&!away(AW.mode)&&!away(m),town=!!(G.town||G.scene);// (not while loading, starting or in the menus)
  if(m==='dialog'&&G.enc&&G.enc!==AW.enc&&calm)sfx('encounter');AW.enc=G.enc||null;// something met on the road
  if(town&&!AW.town&&calm)sfx('town');AW.town=town;// into a town: the gate, the bells
  if(G.day===AW.day+1&&calm)sfx('day');AW.day=G.day;// a new day
  if(lv!=null&&AW.lv!=null&&lv>AW.lv&&calm)sfx('levelup');AW.lv=lv;
  if(!b)AW.fight=null;else if(m==='battle'&&!b.deploy&&!b.over&&AW.fight!==b){AW.fight=b;sfx('horn')}// the fight begins (deployment over)
  AW.mode=m}
