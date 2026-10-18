'use strict';
/* ---------- the battle's soundscape (battlesound.js): what a Total War field sounds like, under audio.js's cues.
   Beds: long loops (the melee's roar, marching, hooves, a rout's panic, war drums, the field's own wind and life) whose levels
   follow what happens in and near the view, sampled every BSND.every s and eased (setTargetAtTime: they swell and ebb, never
   jump). Zoomed out the battle is a mass (the far roar); zoomed in the blows and voices near the camera come forward and the
   beds give way a little. Voices: war cries as a group charges, the crash as a charge lands, replies to your orders, an
   officer as a line wavers, cheers and panic, each race its own (orcs their own voices; dwarves deeper, elves lighter).
   Arrows come as volleys: many loosed together are one whoosh, many landing together one hail.
   The recordings (CC0, audio/sfx/LICENSE-sfx.md) are banks (audio/sfx/*.js) injected as <script>s once a battle is on (file://
   cannot fetch), decoded once and kept; until one is in, its cues fall back to audio.js's synth and its beds are silent.
   Read only: the battle's state is looked at, never changed, and sound draws no dice (AUDIO.rng). Off (AUDIO.on false, no
   context, muted): battleSoundTick and every hook return at once ---------- */

/* ---------- the banks. A bank file calls SFXBANK.put(bank, {name: entry}); an entry (made by audio/sfx/build_banks.py) is
   f: mp3 (frames cut from a recording, decoded by the browser) or ima (4-bit IMA ADPCM, decoded here), b: base64, r: the rate
   to decode at, c: channels kept, o, d: its start and length (s) in the decoded cut, x: a loop's crossfade (s), loop: loops
   whole, fo: a one-shot's fade out (s). Decoded, each is evened to one loudness (bankShape) ---------- */
const SFXBANK={dir:'audio/sfx/',want:{},ready:{},buf:{},pools:{},dec:{},q:Promise.resolve(),stats:{banks:0,decoded:0,ms:0,errors:0,err:''},
  put(bank,ents){const S=this.stats;S.banks++;
    for(const [k,e] of Object.entries(ents))this.q=this.q.then(()=>bankDecode(k,e)).then(b=>{if(b){this.buf[k]=b;this.pools={};S.decoded++}},x=>{S.errors++;S.err=k+': '+(x&&x.message||x)});
    this.q=this.q.then(()=>{this.ready[bank]=true;for(const e of Object.values(ents))delete e.b})}};// (the base64 let go once decoded)
// the banks a battle wants: its beds and voices, the land's (woods, water) and its climate's
const bankList=c=>['battle-voices','battle-beds','battle-amb-land','battle-amb-'+(['grass','frost','desert','swamp'].includes(c)?c:'grass')];
// ask for banks: each one's <script> put in once (a bank already in, or asked for, costs nothing)
function bankLoad(list){if(typeof document==='undefined')return;
  for(const k of list){if(SFXBANK.want[k])continue;SFXBANK.want[k]=1;
    const s=document.createElement('script');s.src=SFXBANK.dir+k+'.js';s.async=true;s.onerror=()=>{SFXBANK.stats.errors++;SFXBANK.stats.err='no bank '+k};document.head.appendChild(s)}}
const b64u8=s=>{const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u};
const IMA_STEP=[7,8,9,10,11,12,13,14,16,17,19,21,23,25,28,31,34,37,41,45,50,55,60,66,73,80,88,97,107,118,130,143,157,173,190,209,230,253,279,307,337,371,408,449,494,544,598,658,724,796,876,963,1060,1166,1282,1411,1552,1707,1878,2066,2272,2499,2749,3024,3327,3660,4026,4428,4871,5358,5894,6484,7132,7845,8630,9493,10442,11487,12635,13899,15289,16818,18500,20350,22385,24623,27086,29794,32767],IMA_IX=[-1,-1,-1,-1,2,4,6,8];
// an entry → its AudioBuffer (a promise; null without a context)
function bankDecode(k,e){const c=AUDIO.ctx;if(!c||!e.b)return null;const t0=typeof performance!=='undefined'?performance.now():0;
  const done=b=>{const r=bankShape(c,b,e);SFXBANK.stats.ms+=(typeof performance!=='undefined'?performance.now():0)-t0;return r};
  if(e.f==='ima'){const u=b64u8(e.b),n=e.n,b=c.createBuffer(1,n,e.r),d=b.getChannelData(0);let p=0,ix=0;
    for(let i=0;i<n;i++){const v=u[i>>1]>>((i&1)<<2)&15,st=IMA_STEP[ix];let df=st>>3;if(v&4)df+=st;if(v&2)df+=st>>1;if(v&1)df+=st>>2;
      p=v&8?Math.max(-32768,p-df):Math.min(32767,p+df);ix=Math.max(0,Math.min(88,ix+IMA_IX[v&7]));d[i]=p/32768}
    return Promise.resolve(done(b))}
  const O=typeof window!=='undefined'&&(window.OfflineAudioContext||window.webkitOfflineAudioContext),r=e.r||32000,dc=O?SFXBANK.dec[r]||(SFXBANK.dec[r]=new O(1,1,r)):c,u=b64u8(e.b);// (decoded at its rate: one context a rate)
  return new Promise((ok,no)=>{const p=dc.decodeAudioData(u.buffer,ok,no);if(p&&p.then)p.then(ok,no)}).then(done)}
// a decoded cut → the sound: [o, o+d] (and a loop's crossfade x past it, folded onto its start), c channels, evened
function bankShape(c,b,e){const sr=b.sampleRate,n=Math.max(1,Math.round((e.loop?b.duration:e.d)*sr)),o=Math.round((e.o||0)*sr),x=Math.round((e.x||0)*sr),ch=Math.min(e.c||1,2),
    out=c.createBuffer(ch,n,sr),src=[];for(let i=0;i<b.numberOfChannels;i++)src.push(b.getChannelData(i));
  const at=(k,i)=>{const a=src[Math.min(k,src.length-1)];return i<a.length?a[i]:0},fo=Math.round((e.fo||0)*sr),fi=Math.round(.004*sr);let ss=0,pk=0;
  for(let k=0;k<ch;k++){const d=out.getChannelData(k);
    for(let i=0;i<n;i++){let v=ch===1&&src.length>1?(at(0,o+i)+at(1,o+i))/2:at(k,o+i);
      if(x&&i<x){const w=i/x,t=ch===1&&src.length>1?(at(0,o+n+i)+at(1,o+n+i))/2:at(k,o+n+i);v=v*Math.sin(w*Math.PI/2)+t*Math.cos(w*Math.PI/2)}// (the loop's seam: equal power)
      else if(!x&&!e.loop){if(i<fi)v*=i/fi;if(fo&&i>n-fo)v*=(n-i)/fo}
      d[i]=v;ss+=v*v;const a=v<0?-v:v;if(a>pk)pk=a}}
  // (a loop to -16.5 dBFS rms; a one-shot's loud part (20 ms frames within 30 dB of its loudest) to -18.4 dBFS rms, its peak under -0.5 dBFS)
  let g;if(x||e.loop)g=Math.min(12,.15/Math.max(1e-4,Math.sqrt(ss/(n*ch))));
  else{const d=out.getChannelData(0),F=Math.max(1,Math.round(.02*sr)),fr=[];for(let i=0;i<n;i+=F){let q=0,m=0;for(let j=i;j<Math.min(n,i+F);j++){q+=d[j]*d[j];m++}fr.push(q/m)}
    const top=Math.max(...fr),act=fr.filter(q=>q>top*1e-3),ra=Math.sqrt(act.reduce((a,q)=>a+q,0)/Math.max(1,act.length));g=Math.min(12,.12/Math.max(1e-4,ra),.95/Math.max(1e-4,pk))}
  for(let k=0;k<ch;k++){const d=out.getChannelData(k);for(let i=0;i<n;i++)d[i]*=g}return out}
// the loaded sounds whose names start with p (a pool: 'warcry.man' → warcry.man1, …)
function bankPool(p){const P=SFXBANK.pools;return P[p]||(P[p]=Object.keys(SFXBANK.buf).filter(k=>k===p||k.startsWith(p+'.')||k.startsWith(p)&&/^\d+$/.test(k.slice(p.length))))}
// one of a pool, never the one played last if there is another (AUDIO.rng's dice)
function bankPick(p){const a=bankPool(p);if(!a.length)return null;let k=a[Math.floor(AUDIO.rng()*a.length)];if(a.length>1&&k===BSND.lastPick[p])k=a[(a.indexOf(k)+1)%a.length];BSND.lastPick[p]=k;return k}

/* ---------- the settings of the soundscape. every: s between looks at the field; bus: the beds' loudness (headroom: beds and
   cues together stay under the limiter); near: half-views within which a blow is still heard alone (past it the bed has it);
   keep: the share of blows heard alone, zoomed out → in; volley/hail: arrows loosed (by one group) or landing (in one cell, px)
   within win s that make a volley's whoosh or a hail; cry: a group's share running at a foe that is a charge (a war cry) ---------- */
const BSND={on:true,every:.2,bus:.7,near:1.4,keep:[.3,1],volley:5,hail:6,win:.5,cell:96,cry:.35,cryGap:9,offGap:12,
  ctx:null,out:null,bed:{},next:0,live:false,over:null,gs:{},vol:{},land:{},impact:{},acc:0,lastPick:{},lastOrder:0,peakT:0,sim:null,S:null,
  stats:{ticks:0,ms:0,beds:0}};
// the races' voices: p, a pitch for the human recordings; clip: elves' shorter; own: orcs have their own (and beasts roar)
const BS_VOX={human:{p:1},dwarf:{p:.84},elf:{p:1.13,clip:.7},orc:{p:.8,own:'orc'},beast:{p:.75,own:'orc'}};
// the beds: their sound (by climate for the wind), and how each follows the field's state S (bsLevels)
const BS_BEDS={crowd:'bed.crowd',steel:'bed.steel',far:'bed.far',feet:'bed.feet',kit:'bed.kit',hooves:'bed.hooves',herd:'bed.herd',panic:'bed.panic',drums:'bed.drums',
  wind:c=>'amb.'+(['frost','desert','swamp'].includes(c)?c:'grass'),life:c=>c==='grass'||!c?'amb.grass.life':null,wood:'amb.wood',water:'amb.water',swell:null};
const BS_PAN={crowd:'mx',steel:'mx',far:'ax',feet:'vx',kit:'vx',hooves:'cx',herd:'cx',panic:'rx'};
const bsSat=v=>1-Math.exp(-Math.max(0,v));
const bsRace=u=>{const s=u.s||{};return s.race||ST[u.type]&&ST[u.type].race||(s.beast||s.big||ST[u.type]&&ST[u.type].beast?'beast':'human')};
const bsRate=r=>({orc:.88,dwarf:.9,elf:1.07,beast:.85})[r]||1;

/* ---------- each frame (main.js's loop): in a battle, the banks asked for, the beds opened, and every BSND.every s (on the
   audio clock) the field looked at and the beds set; out of one, the beds let go. Nothing at all with sound off ---------- */
function battleSoundTick(){
  if(!BSND.on||!AUDIO.on||!AUDIO.ctx||AUDIO.muted){if(BSND.live)bsClose();return}
  const b=typeof B!=='undefined'?B:null,inB=BSND.sim||b&&typeof G!=='undefined'&&(G.mode==='battle'||G.mode==='esc'&&G.esc&&G.esc.mode==='battle');
  if(!inB){if(BSND.live)bsClose();return}
  const c=AUDIO.ctx,now=c.currentTime;if(BSND.ctx!==c)bsReset();
  const clim=BSND.sim?BSND.sim.climate:b.env&&b.env.c;bankLoad(bankList(clim));
  if(!BSND.live)bsOpen(clim);if(now<BSND.next)return;BSND.next=now+BSND.every;
  const t0=typeof performance!=='undefined'?performance.now():0;
  const S=BSND.S=BSND.sim?bsSim(BSND.sim):bsSense(b);bsLevels(S,now);if(!BSND.sim)bsEvents(b,S,now);bsChatter(S);
  BSND.stats.ticks++;BSND.stats.ms+=(typeof performance!=='undefined'?performance.now():0)-t0}
// a new context (tests; the sound restarted): what was made on the old one is forgotten
function bsReset(){BSND.ctx=AUDIO.ctx;BSND.out=null;BSND.bed={};BSND.live=false;BSND.next=0;BSND.lastOrder=-9;BSND.peakT=0}
// the beds' bus (into the effects bus: the Effects volume), each bed's gain and pan; their sources start when first heard
function bsOpen(clim){const c=AUDIO.ctx;
  if(!BSND.out){BSND.out=c.createGain();BSND.out.connect(AUDIO.bus.fx)}const o=BSND.out;o.gain.cancelScheduledValues(c.currentTime);o.gain.setTargetAtTime(BSND.bus,c.currentTime,.3);
  for(const k of Object.keys(BS_BEDS)){let D=BSND.bed[k];const src=typeof BS_BEDS[k]==='function'?BS_BEDS[k](clim):BS_BEDS[k];
    if(D&&D.src!==src){bedStop(D,c.currentTime);D=null}
    if(!D){D=BSND.bed[k]={k,src,g:c.createGain(),p:null,s:null,v:0,quiet:0};D.g.gain.value=0;
      if(BS_PAN[k]&&c.createStereoPanner){D.p=c.createStereoPanner();D.g.connect(D.p);D.p.connect(o)}else D.g.connect(o)}}
  BSND.live=true;BSND.over=null;BSND.gs={};BSND.vol={};BSND.land={};BSND.impact={}}
// out of the battle: the beds fade (1 s) and stop
function bsClose(){const c=AUDIO.ctx;BSND.live=false;if(!c||BSND.ctx!==c){BSND.bed={};return}const now=c.currentTime;
  if(BSND.out){BSND.out.gain.cancelScheduledValues(now);BSND.out.gain.setTargetAtTime(0,now,.3)}for(const D of Object.values(BSND.bed))bedStop(D,now+1.5)}
function bedStop(D,at){try{if(D.s){D.s.stop(at);D.s=null}if(D.osc){for(const o of D.osc)o.stop(at);D.osc=null}}catch(e){}}
// a bed's sound started (a loop from a point of it the dice pick; the swell: two low detuned saws under a low-pass)
function bedStart(D,now){const c=AUDIO.ctx;
  if(D.k==='swell'){const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=240;lp.Q.value=2;lp.connect(D.g);D.osc=[];
    for(const [f,dt] of [[55,-7],[82.4,6],[41.2,0]]){const o=c.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=dt;o.connect(lp);o.start(now);D.osc.push(o)}return true}
  const buf=SFXBANK.buf[D.src];if(!buf)return false;const s=c.createBufferSource();s.buffer=buf;s.loop=true;s.connect(D.g);s.start(now,AUDIO.rng()*buf.duration*.9);D.s=s;BSND.stats.beds++;return true}

/* ---------- the field looked at: S = {z: the zoom 0 (the whole field) to 1 (closest), m: soldiers in melee in and near the view
   (weighted: 1 inside it, less outside), mAll: in melee anywhere, mv: marching (moving, not mounted, not fighting), cv: riders
   moving, cg: riders running in, rv: routing, rate: the melee's race tint, mx…rx: where each is across the view (-1..1),
   gap: the least distance between two foes' groups, waver: your army's share wavering or running, wood, water: the view's
   share of woods and of river, groups: per group {n, run, x, y, team, race}} ---------- */
function bsSense(b){const e=audioEar()||{x:BW/2,y:BH/2,w:BW},hw=Math.max(1,e.w/2),hh=hw*(typeof BVW!=='undefined'?BVH/BVW:.6),t=b.t,R=hw*1.2;
  const S={z:Math.max(0,Math.min(1,Math.log(Math.max(1,BW/e.w))/Math.log(3))),m:0,mAll:0,mv:0,cv:0,cg:0,rv:0,rate:0,mx:0,ax:0,vx:0,cx:0,rx:0,gap:1e9,waver:0,wood:0,water:0,mr:{},groups:{}},Gs=S.groups;
  let rw=0,n0=0,wv=0;
  for(const u of b.units){if(u.hp<=0||u.left)continue;const s=u.s||{},dx=u.x-e.x,ax=Math.max(0,Math.abs(dx)-hw),ay=Math.max(0,Math.abs(u.y-e.y)-hh),w=Math.max(0,1-Math.hypot(ax,ay)/R),px=Math.max(-1,Math.min(1,dx/hw));
    const cav=!!(s.charge&&!s.range||s.mounted),tg=u.tgt,fight=!u.rout&&t-(u.atkAt??-9)<1.2&&(!s.range||tg&&Math.abs(tg.x-u.x)+Math.abs(tg.y-u.y)<40),mov=(u.spdNow||0)>0;
    if(u.grp){const g=Gs[u.grp]||(Gs[u.grp]={n:0,run:0,x:0,y:0,team:u.team,race:{},w:0});g.n++;g.x+=u.x;g.y+=u.y;g.w=Math.max(g.w,w);if((u.run||0)>0&&tg&&!u.rout)g.run++;const r=bsRace(u);g.race[r]=(g.race[r]||0)+1}
    if(!u.team)n0++;
    if(fight){S.mAll++;S.ax+=px;if(w>0){const r=bsRace(u);S.m+=w;S.mx+=px*w;S.rate+=bsRate(r)*w;rw+=w;S.mr[r]=(S.mr[r]||0)+w}}
    else if(u.rout){S.rv+=w;S.rx+=px*w}
    else if(mov&&cav){S.cv+=w;S.cx+=px*w;if((u.run||0)>0)S.cg+=w}
    else if(mov&&!cav){S.mv+=w;S.vx+=px*w}}
  S.rate=rw?S.rate/rw:1;S.mx=S.m?S.mx/S.m:0;S.ax=S.mAll?S.ax/S.mAll:0;S.vx=S.mv?S.vx/S.mv:0;S.cx=S.cv?S.cx/S.cv:0;S.rx=S.rv?S.rx/S.rv:0;
  const ids=Object.keys(Gs);for(const id of ids){const g=Gs[id];g.x/=g.n;g.y/=g.n;const r=b.groups&&b.groups[id]&&b.groups[id].resolve;g.mor=r?r.mor:100;g.routed=!!(r&&r.routed);
    if(!g.team&&(g.routed||r&&r.mor<MORALE.waver))wv+=g.n}
  for(let i=0;i<ids.length;i++){const a=Gs[ids[i]];if(a.n<3)continue;for(let j=i+1;j<ids.length;j++){const c=Gs[ids[j]];if(c.n<3||c.team===a.team)continue;S.gap=Math.min(S.gap,Math.hypot(a.x-c.x,a.y-c.y))}}
  S.waver=n0?wv/n0:0;
  const T=b.terrain;if(T&&T.kind&&typeof tIx==='function'){let n=0;// (the view and a little round it, on a 7×5 grid)
    for(let i=0;i<7;i++)for(let j=0;j<5;j++){const k=T.kind[tIx(T,e.x+(i/3-1)*hw*1.15,e.y+(j/2-1)*hh*1.15)];n++;if(k===TKIND.wood)S.wood++;else if(k===TKIND.ford||k===TKIND.deep||k===TKIND.bridge)S.water++}S.wood/=n;S.water/=n}
  return S}
// the gallery's mixer (sounds-battle.js): the state set by hand. sim: {zoom, melee, march, cav, rout, approach, waver, wood, water, race}
function bsSim(m){const z=+m.zoom||0,r=bsRate(m.race||'human');
  return{z,m:(m.melee||0)*60,mAll:(m.melee||0)*80,mv:(m.march||0)*60,cv:(m.cav||0)*24,cg:(m.cav||0)>.5?(m.cav-.5)*48:0,rv:(m.rout||0)*40,rate:r,mx:0,ax:0,vx:-.2,cx:.3,rx:.4,
    gap:m.approach?700-m.approach*620:1e9,waver:m.waver||0,wood:m.wood||0,water:m.water||0,mr:{[m.race||'human']:1},groups:{}}}

/* ---------- the field → the beds' levels (eased: rising in about a third of a second, falling over one) ---------- */
function bsLevels(S,now){const z=S.z,back=1-.3*z,L=bsSat(S.m/24),F=bsSat(S.mAll/40),M=bsSat(S.mv/30),C=bsSat(S.cv/10),Cg=bsSat(S.cg/8),P=bsSat(S.rv/18),
    hit=now<BSND.peakT?1:0,ap=S.gap<1e8&&S.gap>40?Math.max(0,Math.min(1,(700-S.gap)/520)):0,fight=Math.max(L,F*.7,C*.5,P*.6),duck=1-.75*fight;
  const T={crowd:.8*L*back,steel:.6*bsSat(S.m/12)*(.75+.25*z)*back,far:.65*F*(1-.8*z),feet:.5*M*back,kit:.3*M*(.6+.4*z),hooves:.55*C*back,herd:Math.min(.9,.6*Cg+.35*hit)*back,
    panic:.45*P*back,drums:.45*ap*(1-L)*(1-F*.5),wind:.32*duck,life:.22*duck,wood:.45*Math.min(1,S.wood*2)*duck,water:.5*Math.min(1,S.water*3)*duck,swell:.07*Math.min(1,S.waver*1.6)};
  for(const [k,v] of Object.entries(T))bedSet(k,v,now,S);
  const cr=BSND.bed.crowd;if(cr&&cr.s)cr.s.playbackRate.setTargetAtTime(S.rate||1,now,.8);const dr=BSND.bed.drums;if(dr&&dr.s)dr.s.playbackRate.setTargetAtTime(.94+.1*ap,now,1)}
function bedSet(k,v,now,S){const D=BSND.bed[k];if(!D)return;
  if(v>.004&&!D.s&&!D.osc)bedStart(D,now);if(v<.002){D.quiet=D.quiet||now;if(now-D.quiet>4&&(D.s||D.osc)){bedStop(D,now);D.quiet=0}}else D.quiet=0;
  try{D.g.gain.setTargetAtTime(v,now,v>D.v?.35:1.1);if(D.p&&S)D.p.pan.setTargetAtTime(Math.max(-.6,Math.min(.6,(S[BS_PAN[k]]||0)*.6)),now,.5)}catch(e){}D.v=v}

/* ---------- events read off the field each look: a group charging (its war cry), a line wavering (its officer), the end ---------- */
function bsEvents(b,S,now){const t=b.t;
  for(const [id,g] of Object.entries(S.groups)){const P=BSND.gs[id]||(BSND.gs[id]={run:0,cry:-99,off:-99,mor:g.mor});const run=g.n?g.run/g.n:0,race=bsTop(g.race);
    if(run>=BSND.cry&&P.run<BSND.cry&&t-P.cry>BSND.cryGap&&g.n>=3){P.cry=t;sfxAt('warcry',g.x,g.y,{race,n:g.n})}
    if(g.mor<MORALE.waver&&P.mor>=MORALE.waver&&!g.routed&&t-P.off>BSND.offGap&&g.w>0){P.off=t;sfxAt('officer',g.x,g.y,{race})}
    P.run=run;P.mor=g.mor}
  if(b.over&&!BSND.over){const r=bsArmy(b,0);if(b.win)sfx('cheer',{big:1,race:r,delay:.4});else sfx('panic',{race:r,delay:.3})}BSND.over=!!b.over}
const bsTop=o=>{let k='human',n=-1;for(const [r,v] of Object.entries(o))if(v>n){n=v;k=r}return k};
// an army's race (team 0: yours): the most of its living
function bsArmy(b,team){const o={};if(b&&b.units)for(const u of b.units)if(u.team===team&&u.hp>0){const r=bsRace(u);o[r]=(o[r]||0)+1}return bsTop(o)}

/* ---------- the hooks (one line each in the battle's code; each asked only with sfxOn()) ---------- */
// a blow, or an arrow striking (attacks.js blowSound): heard alone? With the beds running, only near the camera and only some
// (more zoomed in: BSND.keep), the rest the melee bed has; arrows landing together become a hail (bsLand). Before the beds
// (no banks yet) every blow is heard as it always was
function bsBlow(k,x,y,arrow){if(arrow&&!bsLand(x,y))return false;if(!BSND.live||!BSND.S||!SFXBANK.ready['battle-beds'])return true;
  const e=audioEar();if(!e)return true;const d=Math.hypot(x-e.x,(y-e.y)*1.2)/Math.max(1,e.w/2);if(d>BSND.near)return false;
  const z=BSND.S.z;BSND.acc+=BSND.keep[0]+(BSND.keep[1]-BSND.keep[0])*z;if(BSND.acc<1)return false;BSND.acc-=1;return true}
// an arrow (or bolt) landing at (x, y), on a man or the ground: counted in its cell; once BSND.hail land within BSND.win s,
// one hail is heard there and the window's other strikes are not heard alone. → whether this one is heard alone
function bsLand(x,y){if(typeof B==='undefined'||!B)return true;const t=B.t,k=Math.floor(x/BSND.cell)+','+Math.floor(y/BSND.cell),L=BSND.land;let c=L[k];
  if(!c||t-c.t>BSND.win)c=L[k]={t,n:0,x:0,y:0,hail:false};c.n++;c.x+=x;c.y+=y;
  if(c.hail)return false;if(c.n>=BSND.hail){c.hail=true;sfxAt('hail',c.x/c.n,c.y/c.n,{n:c.n*3});return false}return true}
// a shot loosed (attacks.js attack): the first of a group's few is heard alone (its twang); once BSND.volley of one group are
// loosed within BSND.win s, the volley's whoosh
function bsLoose(u){if(typeof B==='undefined'||!B)return;const t=B.t,k=u.grp||u.id,V=BSND.vol;let c=V[k];
  if(!c||t-c.t>BSND.win)c=V[k]={t,n:0,x:0,y:0,on:false};c.n++;c.x+=u.x;c.y+=u.y;
  if(c.on)return;if(c.n>=BSND.volley){c.on=true;sfxAt('volley',c.x/c.n,c.y/c.n,{n:c.n});return}
  if(sndTurn('loose')&&bsBlow('loose',u.x,u.y,false))sfxAt('loose',u.x,u.y)}
// a charge lands (morale.js chargeMul: t struck, m its momentum, cav riders): one crash for each wave of it (a cell, 0.6 s),
// and the hooves peak
function bsImpact(t,m,cav){if(typeof B==='undefined'||!B)return;const now=B.t,k=Math.floor(t.x/BSND.cell)+','+Math.floor(t.y/BSND.cell),I=BSND.impact,c=I[k];
  if(cav&&AUDIO.ctx)BSND.peakT=AUDIO.ctx.currentTime+.7;if(c&&now-c<.6)return;I[k]=now;sfxAt('impact',t.x,t.y,{m,cav:!!cav})}
// your order to groups gs (commands.js): one of them answers (its race's voice; kind: move, attack, charge, advance, hold,
// withdraw, form, and the flags)
function bsOrder(kind,gs){if(!sfxOn()||typeof B==='undefined'||!B)return;const c=AUDIO.ctx;if(c.currentTime-BSND.lastOrder<.3)return;
  const id=(gs||[]).find(g=>B.groups[g]);if(!id)return;let n=0,x=0,o={};for(const u of B.units)if(u.grp===id&&u.hp>0){n++;x+=u.x;const r=bsRace(u);o[r]=(o[r]||0)+1}if(!n)return;
  const e=audioEar();BSND.lastOrder=c.currentTime;sfx('order',{kind,race:bsTop(o),n,pan:e?Math.max(-.5,Math.min(.5,(x/n-e.x)/Math.max(1,e.w))):0})}

/* ---------- the cues' samples (audio.js SFX: play(V, o) asks bsCue first; 0 → its synth). V: audio.js's sound; o: the cue's
   options. → the sound's length (s), or 0 with nothing loaded for it ---------- */
// one sound of a pool at V.t + at, its pitch p (×V.p), loudness v, cut to len s (a fade of fo), through a low-pass at lp Hz
function bsBuf(V,name,{at=0,p=1,v=1,len=0,fo=.05,lp=0}={}){const buf=name&&SFXBANK.buf[name];if(!buf)return 0;const c=V.c,s=c.createBufferSource(),g=c.createGain(),t=V.t+at,r=p*V.p;
  s.buffer=buf;s.playbackRate.value=r;if(lp){const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=lp;s.connect(f);f.connect(g)}else s.connect(g);g.connect(V.out);const d=buf.duration/r,L=len&&len<d?len:d;g.gain.value=v;
  if(L<d){g.gain.setValueAtTime(v,t+Math.max(0,L-fo));g.gain.linearRampToValueAtTime(0,t+L)}s.start(t);s.stop(t+L+.02);return at+L}
const bsP=(V,p,o)=>bsBuf(V,bankPick(p),o);
function bsCue(V,k,o){o=o||{};const X=BS_VOX[o.race]||BS_VOX.human,p=X.p,own=X.own;
  switch(k){
  case 'warcry':{const big=(o.n||0)>=8;let L=0;
    if(own){L=Math.max(L,bsP(V,'warcry.roar',{v:.7,p:o.race==='beast'?.8:1}),bsP(V,AUDIO.rng()<.5?'orc.charge':'orc.kill',{at:.1}));if(big)L=Math.max(L,bsP(V,'warcry.crowd',{p,v:.8,at:.15}))}
    else{if(o.race==='elf')L=bsP(V,'warcry.elf',{v:.9,len:1.8,fo:.4});else L=bsP(V,'warcry.man',{p,v:.9});if(big)L=Math.max(L,bsP(V,'warcry.crowd',{p:p*(o.race==='elf'?1.04:1),v:1,at:.08,len:X.clip?3:0,fo:.8}))}
    return L}
  case 'impact':{const m=Math.min(1,o.m||.6);let L=bsP(V,'impact.shield',{v:.7+.3*m});L=Math.max(L,bsP(V,o.cav?'impact.body':'impact.heavy',{at:.03,v:.8*m+.2,p:o.cav?.9:1}));
    if(L&&m>.5)L=Math.max(L,bsP(V,'impact.shield',{at:.07+AUDIO.rng()*.05,v:.6,p:.92}),bsP(V,'grunt',{at:.1,v:.5}));return L}
  case 'order':{const q=o.kind,att=q==='attack'||q==='charge',hold=q==='hold'||q==='firm'||q==='shieldWall',back=q==='withdraw';
    if(own)return bsP(V,att?(AUDIO.rng()<.5?'orc.charge':'orc.scum'):hold?'orc.wait':back?'orc.retreat':(AUDIO.rng()<.4?'orc.march':'orc.grunt'),{len:1.6,fo:.3});
    const pool=att?(q==='charge'?'order.war':AUDIO.rng()<.5?'order.go':'order.ha'):hold?'order.hold':(o.n||0)>=10&&AUDIO.rng()<.45?(o.race==='dwarf'?'order.huh':'order.hey'):'order.yes';
    return bsP(V,pool,{p,len:X.clip?.55:0,fo:.08})}
  case 'officer':return own?bsP(V,'orc.wait'):bsP(V,AUDIO.rng()<.7?'officer.hold':'officer.king',{p,len:X.clip?2.2:0,fo:.3});
  case 'cheer':{if(own&&o.big){const a=bsP(V,'orc.victory'),b=bsP(V,'orc.laugh',{at:1.6,v:.8});return Math.max(a,b,bsP(V,'cheer.big',{p:.82,v:.7,at:.2}))}
    return bsP(V,o.big?'cheer.big':'cheer.short',{p:p*(own?.85:1),len:X.clip?(o.big?4.5:1.8):0,fo:.6})}
  case 'panic':{const a=bsP(V,'panic',{p:own?.85:p,v:.9});return a&&Math.max(a,bsP(V,own?'orc.scream':'scream',{at:.2+AUDIO.rng()*.3,p:own?1:p,v:.7}))}
  case 'chatter':return bsP(V,own?(AUDIO.rng()<.5?'orc.fight':'orc.grunt'):'grunt',{p:p*(.94+AUDIO.rng()*.12),v:.8,len:X.clip?.4:0,fo:.08});
  case 'volley':{const n=o.n||8,a=bsP(V,'volley',{v:.9,p:.95+AUDIO.rng()*.1});if(!a)return 0;let L=a;for(let i=0;i<Math.min(4,n/6);i++)L=Math.max(L,bsP(V,'whoosh',{at:.05+i*.11+AUDIO.rng()*.08,v:.5,p:.9+AUDIO.rng()*.2}));return L}
  case 'hail':{// (a tight scatter of dry hits over 0.6 s, at most 9, the far ones softer and duller, now and then a clack on a shield)
    const n=Math.min(9,Math.max(4,Math.round((o.n||8)/3)));if(!bankPool('thunk').length)return 0;let L=0;
    for(let i=0;i<n;i++){const d=AUDIO.rng(),k=AUDIO.rng()<.15&&bankPool('clack').length?'clack':'thunk';L=Math.max(L,bsP(V,k,{at:Math.pow(AUDIO.rng(),1.3)*.6,v:(k==='clack'?.5:.9)-.5*d,p:.93+AUDIO.rng()*.14,lp:9000-6000*d}))}return L}
  case 'horn':{const b=typeof B!=='undefined'&&B,me=o.race||(b?bsArmy(b,0):'human'),foe=o.foe||(b?bsArmy(b,1):'human'),hn=r=>'horn.'+(r==='beast'?'orc':BS_VOX[r]?r:'human');
    const a=bsBuf(V,hn(me),{v:1});if(!a)return 0;return Math.max(a,bsBuf(V,hn(foe),{at:2.4,v:.7,p:me===foe?.94:1}))}
  case 'rout':return bsCue(V,'panic',o);
  case 'rally':return bsP(V,'cheer.short',{p,at:.25,v:.8,len:X.clip?1.8:0,fo:.5})}
  return 0}
// the melee's voices near the camera: grunts and shouts now and then, more the thicker the fight in view (each look)
function bsChatter(S){if(!S||S.m<3||!bankPool('grunt').length)return;const e=audioEar();if(!e)return;const n=Math.min(3,Math.floor(bsSat(S.m/20)*(1+S.z*2)+AUDIO.rng()*.8));
  const rs=Object.entries(S.mr||{}),tot=rs.reduce((a,x)=>a+x[1],0);
  for(let i=0;i<n;i++){let q=AUDIO.rng()*tot,race='human';for(const [r,v] of rs){race=r;if((q-=v)<=0)break}sfx('chatter',{race,pan:(AUDIO.rng()*2-1)*.6,vol:.5+.5*S.z,delay:AUDIO.rng()*BSND.every})}}
