'use strict';
/* ---------- commander powers: an army's own orders from its commander, apart from the groups' abilities (unitabilities.js) and
   the hero's own skills (charmind.js). The commander: on your side your hero (B.hero); on theirs their lord or chieftain (the
   first leader of theirs on the field), else none. A power works only while the commander is alive, on the field and not
   running; Rally the Line and Stand Fast! reach the groups of its side with a soldier within its command radius. COMMAND_POWERS:
   on (off: no power for anyone, the HUD's bar hidden; tests/harness.js turns it off for the older suites, the lab's powers key
   overrides it), radius (px), lead, leadMax (+radius a level of the commander's Leadership, at most), cdLead, cdMin (−cooldown a
   level, down to this share), think (s between the AI's looks); each power: n, key, d, cd (combat s, from its use) and its own
   numbers. Leadership: your hero's skill('lead'); a lord's own Leadership, a chieftain's (or anyone's without one) half his level.
   State per side, B.cmdp[team] {rally, stand: {at, readyAt}; scout: {at, until}}; on a resolve (morale.js): cmdRallyAt (rallied
   by the power), standUntil (Stand Fast! till then). One API for you and the AI: powerWhyNot(team,id) ('' when it can),
   usePower(team,id) (false when refused); the AI's think (powersThink) comes from commander.js command ---------- */
const COMMAND_POWERS={on:true,radius:220,lead:.08,leadMax:.6,cdLead:.04,cdMin:.6,think:.5,
  // gain: morale to a wavering group (from 0 if it is breaking), half of it on top of a routing group's rally (morale.js rally);
  // lock: s before a group it rallied can be rallied by it again; waver: the AI's count of wavering groups worth it
  rally:{n:'Rally the Line',key:'Z',cd:60,gain:20,lock:120,waver:2,snd:'rally',
    d:'Your commander rallies the line: every routing unit of yours within the command radius stops and re-forms (morale.js rally, no second rally after a rout: it shatters), every wavering or breaking one gets +20 morale. A unit it rallied cannot be rallied by it again for 120 s.'},
  // dur: s it lasts; gain: morale at once; shock: what a shock does to them meanwhile; floor: never under it (wavering under
  // MORALE.waver); meet: the AI calls it as its groups in range come this near the foe (px), groups: how many of them
  stand:{n:'Stand Fast!',key:'S',cd:45,dur:12,gain:10,shock:.6,meet:120,groups:2,snd:'horn',
    d:'Your commander steadies the line: units of yours within the command radius get +10 morale, take 40% less morale shock and cannot drop to wavering (nor break) for 12 s.'},
  // dur: the enemy seen through the fog till this battle second (from the deployment on)
  scout:{n:'Scout',key:'O',dur:10,snd:'notify',
    d:'Before the battle, outriders find the enemy: you see their units through the fog of war, where they stand, while you deploy and for the first 10 s of the fight. Once a battle; only with fog of war.'}};
const POWER_ORDER=Object.keys(COMMAND_POWERS).filter(k=>typeof COMMAND_POWERS[k]==='object');
// what is said: the word over the commander, then the banner (battlehud.js), when yours uses it and when theirs does
const POWER_SAY={rally:['Rally to me!','Rally!','Enemy rallies its line!'],stand:['Stand fast!','Stand Fast!','Enemy: Stand Fast!'],scout:['','Scouts report the enemy’s positions','Enemy scouts have seen your lines']};
// on for this battle (the lab's powers key first), not in a tournament
const powersOn=()=>!!B&&!(B.opts&&B.opts.tournament)&&(B.cmdOn??COMMAND_POWERS.on);
// a side's commander (the lab may name one, or none: B.cmdForce {team: unit id or null}), able to command now, else null
function commanderOf(team){
  if(!B)return null;const F=B.cmdForce,f=F&&Object.hasOwn(F,team)?F[team]:undefined;
  const u=f!==undefined?(f==null?null:B.units.find(x=>x.id===f)):team===0?B.hero:B.units.find(x=>x.team===team&&x.leader&&x.hp>0&&!x.left&&!x.rout);
  return u&&u.team===team&&u.hp>0&&!u.left&&!u.rout?u:null}
// his Leadership (0-10; the lab may set it: B.cmdLead {team: level})
function commanderLead(team,u=commanderOf(team)){
  const f=B&&B.cmdLead&&B.cmdLead[team];if(f!=null)return clamp(f,0,10);if(!u)return 0;
  if(u.hero)return clamp(P&&P.sk&&P.sk.lead?skill('lead'):0,0,10);
  const L=u.leader,r=L&&L.ref;if(r&&r.sk&&r.sk.lead)return clamp(r.sk.lead.lv|0,0,10);return L?clamp(Math.floor((L.lv||1)/2),0,10):0}
const commandRadius=team=>COMMAND_POWERS.radius*(1+Math.min(COMMAND_POWERS.leadMax,COMMAND_POWERS.lead*commanderLead(team)));
const powerCd=(team,id)=>Math.round(COMMAND_POWERS[id].cd*Math.max(COMMAND_POWERS.cdMin,1-COMMAND_POWERS.cdLead*commanderLead(team)));
const powerState=team=>{const S=B.cmdp||(B.cmdp={});return S[team]||(S[team]={})};// (made on first use: looking makes none)
const powerOf=(team,id)=>B.cmdp&&B.cmdp[team]&&B.cmdp[team][id]||null;
// the groups of a side with a living soldier within the radius (and a resolve: characters and beasts never break)
function powerGroups(team,c=commanderOf(team)){if(!c)return [];const R=commandRadius(team);
  return Object.values(B.groups).filter(g=>g.team===team&&g.resolve&&g.resolve.live().some(u=>Math.hypot(u.x-c.x,u.y-c.y)<=R))}
// Rally the Line's: routing (not shattered) or wavering, and not rallied by it lately
const rallyLocked=r=>B.t<(r.cmdRallyAt??-Infinity)+COMMAND_POWERS.rally.lock;
const rallyTargets=team=>powerGroups(team).filter(g=>{const r=g.resolve;return !rallyLocked(r)&&(r.routed?!r.shattered:r.mor<MORALE.waver)});
const standTargets=team=>powerGroups(team).filter(g=>!g.resolve.routed);
// why a side cannot use it now ('' when it can)
function powerWhyNot(team,id){
  const A=COMMAND_POWERS[id];if(!B||!A||typeof A!=='object')return 'Unknown power';if(!powersOn())return 'Commander powers are off';
  if(B.over)return 'The battle is over';if(!commanderOf(team))return team?'No commander':'Your hero is not commanding (fallen, gone or absent)';
  const S=powerOf(team,id);
  if(id==='scout'){if(!B.fog)return 'Only with fog of war';if(S)return 'Used (once a battle)';if(!B.deploy&&B.t>=A.dur)return 'Only before the battle';return ''}
  if(B.deploy)return 'Not while deploying';if(B.noMorale)return 'Morale is off';
  if(S&&B.t<S.readyAt)return 'Ready in '+Math.ceil(S.readyAt-B.t-1e-9)+' s';
  if(!(id==='rally'?rallyTargets(team):standTargets(team)).length)return id==='rally'?'No routing or wavering unit within range':'No unit within range';
  return ''}
// one power's state for a side (the HUD): cooling down (s), on (Stand Fast!, s left on the longest), its cooldown, why not
function powerStatus(team,id){const S=powerOf(team,id),A=COMMAND_POWERS[id];let left=0;
  if(id==='stand')for(const g of Object.values(B.groups))if(g.team===team&&g.resolve&&g.resolve.standing())left=Math.max(left,g.resolve.standUntil-B.t);
  if(id==='scout'&&S&&(B.deploy||B.t<S.until))left=B.deploy?A.dur:S.until-B.t;
  return{id,n:A.n,cooldown:S&&S.readyAt?Math.max(0,S.readyAt-B.t):0,cd:id==='scout'?0:powerCd(team,id),left,used:id==='scout'&&!!S,why:powerWhyNot(team,id)}}
// use it: false (nothing done) when it cannot be used now
function usePower(team,id){
  if(powerWhyNot(team,id))return false;const A=COMMAND_POWERS[id],c=commanderOf(team),mine=!team,gs=id==='rally'?rallyTargets(team):id==='stand'?standTargets(team):[];
  const S=powerState(team)[id]={at:B.t};if(id!=='scout')S.readyAt=B.t+powerCd(team,id);
  if(id==='rally')for(const g of gs){const r=g.resolve;r.cmdRallyAt=B.t;
    // (a routing group: the rally of morale.js, as when it rallies on its own; then half the gain on top)
    if(r.routed){r.rally();r.mor=Math.min(100,r.mor+A.gain/2)}else{r.mor=Math.min(100,Math.max(0,r.mor)+A.gain);r.breakT=0;delete r.breakLimit}r.refreshState();r.sync()}
  if(id==='stand')for(const g of gs){const r=g.resolve;r.standUntil=B.t+A.dur;r.mor=Math.min(100,Math.max(0,r.mor)+A.gain);r.breakT=0;delete r.breakLimit;r.standFloor();r.refreshState();r.sync()}
  if(id==='scout'){S.until=A.dur;scoutApply(team);if(sightOn())sightStep(true)}
  // (the word over him, the ring of his reach, the log and his horn; then its event: the banner, the bar's cue, the lab's row)
  const say=POWER_SAY[id];
  if(say[0])moraleSay(c,say[0],mine?'#ffe08a':'#ff9a90',1.2);if(id!=='scout')B.rings.push({x:c.x,y:c.y-6,r:commandRadius(team),life:.7,max:.7,col:mine?'255,224,138':'255,154,144'});
  log(htmlText((mine?'Your commander':'Their commander')+': '+A.n+(gs.length?' ('+gs.map(g=>groupName(g.id)).join(', ')+')':'')+'.'),mine?'good':'bad');
  if(A.snd&&sfxOn())sfxAt(A.snd,c.x,c.y);
  battleEvent('power',{team,id,c,gs});
  return true}
// Scout: every soldier of the other sides seen by this one (terrain.js sightStep's u.rv, as a blow gives him away) till
// S.until; set again each think, a blow since having put it earlier
function scoutApply(team){const S=powerOf(team,'scout');if(!S)return;const at=S.until-SIGHT.memory;
  for(const u of B.units)if(u.team!==team&&u.hp>0){const v=u.rv||(u.rv=[]);if(!(v[team]>=at))v[team]=at}}
// your press of a power (its button or key): no order (a character's fall-back goes on, commands.js playerOrder); a refusal is told
function commandPower(id){if(!B||!COMMAND_POWERS[id])return false;const why=powerWhyNot(0,id);if(why){log(htmlText(COMMAND_POWERS[id].n+': '+why.toLowerCase()+'.'));return false}
  const ok=usePower(0,id);bhudPowers();return ok}
const powerKey=k=>POWER_ORDER.find(id=>COMMAND_POWERS[id].key.toLowerCase()===k);
/* the AI's commander (commander.js command, each frame of the fight; every think s): the enemy's always, yours with your whole army the AI's (aiAll).
   Scout at once (the fight's first think); Rally the Line when a group in range routs, or rally.waver of them waver; else Stand
   Fast! when a group in range wavers, or as stand.groups of them (all, if fewer) come within stand.meet px of a foe it sees */
function powersThink(dt){
  if(!powersOn()||(B.cpT=(B.cpT||0)-dt)>0)return;B.cpT=COMMAND_POWERS.think;
  for(const t of [0,1]){const S=B.cmdp&&B.cmdp[t];if(S&&S.scout&&B.t<S.scout.until)scoutApply(t)}
  for(const t of [0,1]){if(t===0&&!aiAll()||!commanderOf(t))continue;// (yours: with your whole army the AI's, deploy.js)
    if(!powerWhyNot(t,'scout')){usePower(t,'scout');continue}
    const R=rallyTargets(t);if(R.length&&!powerWhyNot(t,'rally')&&(R.some(g=>g.resolve.routed)||R.length>=COMMAND_POWERS.rally.waver)){usePower(t,'rally');continue}
    if(powerWhyNot(t,'stand'))continue;const gs=standTargets(t),X=COMMAND_POWERS.stand;
    if(gs.some(g=>g.resolve.mor<MORALE.waver)){usePower(t,'stand');continue}
    const foes=B.units.filter(e=>e.team!==t&&fighting(e)&&seenBy(t,e)),near=g=>{const C=g.centre();return foes.some(e=>Math.hypot(e.x-C.x,e.y-C.y)<=X.meet)};
    if(foes.length&&gs.filter(near).length>=Math.min(X.groups,gs.length))usePower(t,'stand')}}
/* ---- the HUD: the commander bar (left middle of the field), distinct from the order bar: a round button a power, with a
   sweep that empties as its cooldown runs out, the seconds, its key; dimmed (aria-disabled, so hovering still works) with the
   reason in its tooltip. Scout only with fog of war. Hovering Rally or Stand Fast! (or just after one) shows the command radius */
const POWER_ICON={
  rally:['aa.......','aaaaaa...','abbbbba..','abbbba...','aaaaaaa..','a........','a........','a.......a','aa.....aa'],
  stand:['.aaaaaaa.','aabbbbbaa','aab.a.baa','aab.a.baa','aabaaabaa','.ab.a.ba.','.aab.baa.','..aabaa..','....a....'],
  scout:['.........','..aaaaa..','.a.....a.','a..bbb..a','a.bbabb.a','a..bbb..a','.a.....a.','..aaaaa..','.........'],
  ai:['.........','.aa..aaa.','a..a..a..','a..a..a..','aaaa..a..','a..a..a..','a..a..a..','a..a.aaa.','.........']};
// (the AI button under the powers: your groups handed to the AI (deploy.js autoKey, A); yours alone, no commander's power, so the
// AI's commanders never use it, and it shows with the powers off)
const AI_TIP='AI (A): the AI commands the selected groups, or with none selected your whole army; A again takes them back, and any order you give a group takes that group back';
function bhudPowers(){
  const bar=typeof document!=='undefined'&&document.getElementById('bbar');if(!bar||!B)return;let el=document.getElementById('bCmd');
  if(!el){el=document.createElement('div');el.id='bCmd';el.className='cmdbar';el.setAttribute('role','group');el.setAttribute('aria-label','Commander powers (Z rally the line, S stand fast, O scout) and the AI (A)');
    el.innerHTML='<span class="cmdh">Command</span>'+POWER_ORDER.map(id=>'<button type="button" class="cbtn" data-power="'+id+'"><i class="ccd" aria-hidden="true"></i>'+pixelSVG(POWER_ICON[id],20)+'<span class="ct" aria-hidden="true"></span><span class="k">'+COMMAND_POWERS[id].key+'</span></button>').join('')+
      '<button type="button" class="cbtn cai" id="bAuto" aria-pressed="false" title="'+AI_TIP+'" aria-label="'+AI_TIP+'">'+pixelSVG(POWER_ICON.ai,20)+'<span class="k">A</span></button>';
    el.addEventListener('click',e=>{if(e.target.closest('#bAuto')){autoKey();return}const b=e.target.closest('[data-power]');if(b)commandPower(b.dataset.power)});
    el.addEventListener('pointerover',e=>{const b=e.target.closest('[data-power]');if(B)B.cmdHov=b?b.dataset.power:null});el.addEventListener('pointerleave',()=>{if(B)B.cmdHov=null});
    bar.appendChild(el);autoUI()}
  const pw=powersOn();el.hidden=false;if(!pw){for(const b of el.querySelectorAll('[data-power]'))b.hidden=true;return}
  const c=commanderOf(0),R=c?Math.round(commandRadius(0)):0;
  for(const b of el.querySelectorAll('[data-power]')){const id=b.dataset.power,A=COMMAND_POWERS[id],st=powerStatus(0,id);b.hidden=id==='scout'&&!B.fog;
    const off=!!st.why,cool=st.cooldown>0;b.classList.toggle('off',off);b.setAttribute('aria-disabled',String(off));b.classList.toggle('on',st.left>0);
    b.querySelector('.ccd').style.setProperty('--cd',cool?(st.cooldown/st.cd*360).toFixed(1)+'deg':'0deg');
    b.querySelector('.ct').textContent=cool?Math.ceil(st.cooldown-1e-9):st.left>0?Math.ceil(st.left-1e-9):'';
    b.title=A.n+' ('+A.key+'): '+A.d+(id==='scout'?'':' Cooldown '+st.cd+' s'+(c?', radius '+R+' px':'')+' (Leadership '+commanderLead(0)+'). Needs your commander alive and the units within range.')+(off?' Unavailable: '+st.why+'.':' Ready.');
    b.setAttribute('aria-label',b.title)}}
/* on the field (render.js, over the selection): the command radius round your commander while you point at Rally or Stand Fast!
   (or for a moment after either), its rim and a soft fill, rings under the units it would reach; a gold glow under every
   soldier of a group standing fast (both sides, those you see) */
// (just after yours uses Rally or Stand Fast!: its radius shown for a moment, B.cmdShow)
battleOn((type,d)=>{if(type==='power'&&!d.team&&d.id!=='scout')B.cmdShow={id:d.id,until:performance.now()+1500}});
function drawCommandPowers(){
  if(!powersOn())return;const pulse=.55+.25*Math.sin(performance.now()/180);
  for(const g of Object.values(B.groups)){const r=g.resolve;if(!r||!r.standing())continue;ctx.fillStyle='rgba(255,214,110,'+(.3*pulse+.15).toFixed(3)+')';
    for(const u of r.live())if(seenBy(0,u)){ctx.beginPath();ctx.ellipse(Math.round(u.x),Math.round(u.y),10,5,0,0,7);ctx.fill()}}
  const sh=B.cmdShow&&performance.now()<B.cmdShow.until?B.cmdShow.id:null,id=B.cmdHov==='rally'||B.cmdHov==='stand'?B.cmdHov:sh,c=id&&commanderOf(0);if(!c)return;
  const R=commandRadius(0),tg=powerWhyNot(0,id)&&!sh?[]:id==='rally'?rallyTargets(0):standTargets(0);
  ctx.save();ctx.fillStyle='rgba(255,224,138,.07)';ctx.beginPath();ctx.arc(c.x,c.y,R,0,6.283);ctx.fill();
  ctx.setLineDash([6,4]);ctx.strokeStyle='rgba(255,224,138,.85)';ctx.lineWidth=1.5;ctx.stroke();ctx.setLineDash([]);
  ctx.strokeStyle='rgba(159,224,154,.95)';ctx.lineWidth=1.5;for(const g of tg)for(const u of g.resolve.live()){ctx.beginPath();ctx.ellipse(Math.round(u.x)+.5,Math.round(u.y)+.5,9,4.5,0,0,7);ctx.stroke()}
  ctx.restore()}
