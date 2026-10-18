'use strict';
/* The battle soundscape's mixer for sounds.html (battlesound.js): the field set by hand (zoom, melee, marching, riders,
   archery, a rout, the lines closing, wavering), a race and a climate, a 40-second battle story, and every recording with a
   Play button. It loads battlesound.js itself (sounds.html has one line for this file). battleStory() is also what the
   offline preview render plays. */
// the story: [time s, what happens]; o: {race, foe, climate}. The mixer's state is eased by the beds; the cues play as in battle
function battleStory(o){o=o||{};const race=o.race||'human',foe=o.foe||'orc',climate=o.climate||'grass',r=mkRng(42),ev=[],at=(t,f)=>ev.push([t,f]),
    m=x=>()=>Object.assign(BSND.sim,x),cue=(n,x)=>()=>sfx(n,x);
  at(0,()=>{BSND.sim={zoom:.25,melee:0,march:.7,cav:0,rout:0,approach:.05,waver:0,wood:.25,water:.2,race,climate}});// (marching out, the field's own sounds)
  at(.8,cue('horn',{race,foe}));at(4,m({approach:.35}));at(5,cue('order',{kind:'advance',race,n:30}));// (the horns; drums as the lines close)
  at(6.5,cue('volley',{n:24,pan:-.4}));at(8.2,cue('hail',{n:30,pan:.35}));at(8.5,m({approach:.6}));// (your archers loose; it lands on them)
  at(9.6,cue('volley',{n:20,pan:.4}));at(11.2,cue('hail',{n:24,pan:-.3}));at(11,m({cav:.35,approach:.8,march:.5}));// (theirs answer; your riders move up)
  at(13,cue('order',{kind:'charge',race,n:12}));at(13.1,cue('charge'));at(13.4,m({cav:1}));at(13.6,cue('warcry',{race,n:30,pan:-.2}));at(14.2,cue('warcry',{race:foe,n:30,pan:.3}));
  at(15.8,()=>{BSND.peakT=AUDIO.ctx.currentTime+.7;sfx('impact',{m:1,cav:1,pan:.1})});at(16,cue('impact',{m:.9,pan:-.1}));at(16.1,m({melee:.6,approach:0,march:.15,cav:.4}));at(16.3,cue('impact',{m:.7,pan:.25}));
  at(18,m({melee:.9,cav:.2}));at(20,m({zoom:.95}));// (the melee swells; zoomed in, the blows near the camera come forward)
  for(let i=0;i<26;i++)at(20.2+i*.15+r()*.08,cue(['clash','hit','block','clash','hit'][Math.floor(r()*5)],{pan:r()*1.4-.7}));
  at(24.5,m({zoom:.3}));at(25.5,m({waver:.7}));at(26,cue('officer',{race,pan:-.25}));at(27.5,cue('order',{kind:'hold',race,n:30}));// (your line wavers: an officer, Hold!)
  at(29,m({rout:.8,melee:.45,waver:.2}));at(29.1,cue('rout',{race:foe,pan:.4}));at(31,cue('rally',{race,pan:-.2}));at(31.2,m({waver:0}));// (they break; yours rally)
  at(33,m({melee:.12,rout:.5}));at(34,cue('cheer',{big:1,race}));at(36.5,m({melee:0,rout:.15,march:0,cav:0}));at(38.5,m({rout:0}));// (the field is yours)
  return ev.sort((a,b)=>a[0]-b[0])}
// the story's events due by t (s from its start), each once
function storyStep(S,t){while(S.i<S.ev.length&&S.ev[S.i][0]<=t){try{S.ev[S.i][1]()}catch(e){AUDIO.stats.errors++;AUDIO.stats.err='story: '+e.message}S.i++}}
(()=>{
const main=document.querySelector('main');if(!main)return;// (the offline render: the story only)
const go=()=>{
  const $=id=>document.getElementById(id),SL=[['zoom','Zoom (whole field → close)'],['melee','Melee near the camera'],['march','Marching formations'],['cav','Cavalry (trot → gallop)'],['arch','Archery (volleys)'],['rout','A rout'],['approach','Lines closing (drums)'],['waver','Your army wavering'],['wood','Woods in view'],['water','A river in view']];
  const sec=document.createElement('section');sec.className='card';sec.setAttribute('aria-labelledby','h-bs');
  sec.innerHTML='<h2 id="h-bs">Battle soundscape</h2><p class="muted note" style="margin-bottom:10px">The field\'s beds follow these as in a battle (eased: they swell and ebb). Recordings (CC0, audio/sfx/LICENSE-sfx.md) load when you start; until then the synth stands in.</p>'+
    '<div class="mixer">'+SL.map(([k,n])=>'<label class="sl"><span>'+n+' <output id="bo-'+k+'"></output></span><input type="range" min="0" max="100" step="5" value="0" id="bs-'+k+'"></label>').join('')+
    '<label class="sl"><span>Race</span><select id="bs-race"><option>human</option><option>dwarf</option><option>elf</option><option>orc</option></select></label>'+
    '<label class="sl"><span>Climate</span><select id="bs-climate"><option>grass</option><option>frost</option><option>desert</option><option>swamp</option></select></label></div>'+
    '<div class="row" style="margin-top:12px"><button type="button" class="primary" id="bs-field">Start the field</button><button type="button" id="bs-story">Play a battle story (40 s)</button><span class="stats" id="bs-stat"></span></div>'+
    '<h2 style="margin-top:16px">Recordings</h2><div class="grid" id="bs-samples"><p class="muted note">Start the field to load them.</p></div>';
  main.appendChild(sec);
  const sim=()=>{const s={race:$('bs-race').value,climate:$('bs-climate').value};for(const [k] of SL)s[k]=$('bs-'+k).value/100;return s};
  for(const [k] of SL){const i=$('bs-'+k);$('bo-'+k).textContent=i.value+'%';i.addEventListener('input',()=>{$('bo-'+k).textContent=i.value+'%';if(BSND.sim&&!story)Object.assign(BSND.sim,sim())})}
  for(const k of ['race','climate'])$('bs-'+k).addEventListener('change',()=>{if(BSND.sim&&!story){BSND.sim=sim();if(k==='climate')bsClose()}});
  let on=false,story=null,arch=0,raf=0;const start=()=>{if(!AUDIO.ctx)audioUnlock();if(!AUDIO.ctx)return false;AUDIO.ear=()=>({x:400,y:300,w:800});if(!BSND.sim)BSND.sim=sim();if(!raf)raf=requestAnimationFrame(loop);return true};
  const stop=()=>{on=false;story=null;BSND.sim=null;AUDIO.ear=null;battleSoundTick();$('bs-field').textContent='Start the field';$('bs-story').textContent='Play a battle story (40 s)'};
  $('bs-field').addEventListener('click',()=>{if(on||story)return stop();if(!start())return;on=true;$('bs-field').textContent='Stop the field'});
  $('bs-story').addEventListener('click',()=>{if(story)return stop();if(!start())return;on=false;$('bs-field').textContent='Stop';const s=sim();story={ev:battleStory({race:s.race,foe:s.race==='orc'?'human':'orc',climate:s.climate}),i:0,t0:AUDIO.ctx.currentTime};$('bs-story').textContent='Stop the story'});
  // each frame: the story's events, the archery slider's volleys, the soundscape's tick; the samples listed once loaded
  let listed=0;function loop(){raf=0;if(!on&&!story)return;const c=AUDIO.ctx,now=c.currentTime;
    if(story){const t=now-story.t0;storyStep(story,t);if(t>40.5)stop()}
    else if(BSND.sim.arch>0&&now>arch){arch=now+6-4.5*BSND.sim.arch;sfx('volley',{n:10+30*BSND.sim.arch,pan:-.3});setTimeout(()=>{if(BSND.sim)sfx('hail',{n:10+30*BSND.sim.arch,pan:.3})},1600)}
    battleSoundTick();const K=SFXBANK.stats,live=Object.values(BSND.bed).filter(D=>D.s||D.osc).length;
    $('bs-stat').textContent=(story?'story '+(now-story.t0).toFixed(1)+' s · ':'')+Object.keys(SFXBANK.buf).length+' recordings ('+K.ms.toFixed(0)+' ms to decode) · '+live+' beds playing'+(K.errors?' · errors '+K.errors+' ('+K.err+')':'');
    if(Object.keys(SFXBANK.buf).length!==listed)list();raf=requestAnimationFrame(loop)}
  function list(){const names=Object.keys(SFXBANK.buf).sort();listed=names.length;const g=$('bs-samples');g.innerHTML='';
    for(const n of names){const d=document.createElement('div');d.className='cue';const b=SFXBANK.buf[n];
      d.innerHTML='<span class="nm"><b>'+n+'</b><code>'+b.duration.toFixed(1)+' s'+(/^(bed|amb)\./.test(n)?' · loop':'')+'</code></span><button type="button" class="sm primary">Play</button>';
      d.querySelector('button').addEventListener('click',()=>{const c=AUDIO.ctx,s=c.createBufferSource(),gn=c.createGain();s.buffer=b;gn.gain.value=.8;s.connect(gn);gn.connect(AUDIO.bus.fx);s.start();s.stop(c.currentTime+Math.min(b.duration,12))});g.appendChild(d)}}};
if(typeof battleSoundTick==='function')go();else{const s=document.createElement('script');s.src='js/core/battlesound.js';s.onload=go;document.head.appendChild(s)}
})();
