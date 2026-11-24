'use strict';
window.PHONE=true;// (run in a phone's window, 844 x 390 with touch: tests/run-tests.ps1)
// The ink look (the owner, 2026-11-24, a picture of a hand-inked mobile RPG: "Can we adjust ui to have similar vibe like this?", then "remove
// the outer frame ... all ui sharing the same color tone ... a frame to be golden ...", \"golden rusted\", no black border, not square; ui/inkhud.js, ink-hud.css): every frame one of rusted gold, its corners round; on a phone's map your hero's card top left (level in a ring, health,
// stamina, morale, experience) that opens the party's details, your purse by a round minimap, round buttons with their names under
// them; Settings → Interface look: Forged puts every piece back as it was.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();G.paused=true;t.updateHUD(true);t.frame();
 if(!window.mobileWorldHud.media.matches)return ok(false,'the mobile layout is on: this suite needs a phone-sized window ('+innerWidth+' x '+innerHeight+')');
 const scr=document.getElementById('screen'),ink=window.inkHud,rect=e=>e.getBoundingClientRect(),shown=e=>!!e&&!e.hidden&&!!e.getClientRects().length&&getComputedStyle(e).display!=='none';
 ok(t.INK.on&&scr.classList.contains('ink')&&t.prefGet('inklook')===true,'the ink look is on at first');
 // (no frame round the screen; every frame in the game the rusted gold one: the forged rim's two names, campaign-hud.css and game-panels.css)
 {const cs=getComputedStyle(document.getElementById('panel')),bi=getComputedStyle(document.querySelector('.ink-hero')).borderImageSource;
  ok(!document.querySelector('.ink-edge'),'no frame round the screen');
  ok(cs.getPropertyValue('--ui-rim').trim()===ink.frameUrl&&getComputedStyle(scr).getPropertyValue('--campaign-frame').trim()===ink.frameUrl&&bi.startsWith('url("data:image/png'),'every frame the rusted gold one: the windows\', the HUD\'s and the ink\'s own')
  const F=t.INK.frame,g=ink.frame().getContext('2d'),px=(x,y)=>g.getImageData(x,y,1,1).data,mid=F.px/2,edge=px(mid,Math.round(F.band/2)),hole=px(mid,F.band+20),corner=px(2,2);
  ok(edge[3]===255&&edge[0]>edge[2]+40&&Math.max(...edge.slice(0,3))>110&&hole[3]===0&&corner[3]===0,'the frame: gold along its side (rgb '+edge.slice(0,3).join(',')+'), nothing inside it, its corner cut round');
  const hero=t.$('.ink-hero'),qt=document.querySelector('#qtrack .qt-list'),pan=document.getElementById('panel');
  ok(parseFloat(getComputedStyle(hero).borderTopLeftRadius)>=8&&document.getElementById('ink-corners')&&ink.cornerRules>10&&parseFloat(getComputedStyle(pan).borderTopLeftRadius)>=8,'their corners round, the windows\' too ('+ink.cornerRules+' framed rules rounded)');
  // (no black lines: the game's plates' hairline gold now)
  ok(!/rgb\(0, 0, 0\)/.test(getComputedStyle(scr).getPropertyValue('--plate'))&&!getComputedStyle(scr).getPropertyValue('--plate').includes('#000'),'no black hairline inside the plates')}
 // (the hero's card: your army's flag (the owner: "Change level to army flag"), his level, health of his most, stamina, morale, his experience to the next level)
 P.hp=Math.round(P.heroStats().hp*.5);P.bsta=64;P.morale=41;P.xp=Math.floor(t.leaderOf(P).xpNeed()*.25);t.updateHUD(true);
 {const h=ink.hero,txt=h.textContent,max=Math.round(P.heroStats().hp);
  ok(shown(h)&&rect(h).top<rect(scr).top+20&&rect(h).left<rect(scr).left+20,'your hero\'s card stands top left');
  ok(h.querySelector('.ink-lv img').getAttribute('src')===t.flagUrl(P.banner())&&txt.includes('Lv '+P.level)&&txt.includes(P.hp+' / '+max)&&txt.includes('64%')&&txt.includes('41%')&&txt.includes((100*P.xp/t.leaderOf(P).xpNeed()).toFixed(1)+'%'),'it shows your army\'s flag, your level, health ('+P.hp+' / '+max+'), stamina, morale and experience');
  const lv=rect(h.querySelector('.ink-lv'));ok(Math.abs(lv.width-lv.height)<1&&getComputedStyle(h.querySelector('.ink-lv')).borderRadius==='50%','your army\'s flag in a round ring');
  const q=rect(document.getElementById('qtrack'));ok(q.top>=rect(h).bottom-1,'the quests below the card, not under it ('+Math.round(q.top)+' / '+Math.round(rect(h).bottom)+')');
  h.click();t.frame();ok(scr.classList.contains('party-open')&&shown(document.getElementById('stats'))&&h.getAttribute('aria-expanded')==='true','a tap on it opens the party\'s details');
  h.click();t.frame();ok(!scr.classList.contains('party-open'),'and another closes them')}
 // (the purse, the round minimap, the round buttons)
 {const m=window.campaignHud.mobileMini,mr=rect(m),pu=ink.purse;
  ok(shown(m)&&Math.abs(mr.width-mr.height)<1&&getComputedStyle(m).borderTopLeftRadius==='50%','the minimap round ('+Math.round(mr.width)+' px)');
  ok(shown(pu)&&pu.textContent.includes(P.gold.toLocaleString('en'))&&rect(pu).right<=mr.left+1,'your gold, food and drink beside it');
  const bs=['pause','speedToggle','mapToggle','charBtn','menuBtn'].map(id=>document.getElementById(id)),round=bs.filter(b=>{const r=rect(b);return Math.abs(r.width-r.height)<1&&getComputedStyle(b).borderTopLeftRadius==='50%'});
  ok(round.length===bs.length,'the buttons are round ('+round.length+' of '+bs.length+')');
  const dl=document.querySelector('#mapToggle .dl');ok(rect(dl).width>8&&rect(dl).bottom>rect(document.getElementById('mapToggle')).bottom+2,'their names at their feet');
  ok(rect(window.mobileWorldHud.root).height<=52,'the bottom row as low as before ('+rect(window.mobileWorldHud.root).height+' px)')}
 // (the day on a plate across the minimap's foot, the owner: "make the day and time integrated with the mini map"; the bottom row the buttons only)
 {const d=ink.day,dr=rect(d),mr=rect(window.campaignHud.mobileMini),D=t.dayParts();
  ok(shown(d)&&d.textContent.includes(D.day)&&d.textContent.includes(D.time)&&dr.top<mr.bottom&&dr.bottom>mr.bottom&&dr.right<=mr.right+1&&dr.left<mr.left+mr.width/2,'the day, its season, time and weather on a plate across the minimap\'s foot ('+d.textContent+')');
  ok(!shown(document.querySelector('.mwh-status')),'no day strip by the buttons')}
 // (day and night round the minimap's rim, the owner: "make day and night as a circle integrated with map": the sun by day, the moon by
 // night, where the hour stands: dawn left, noon top, dusk right, midnight at its foot)
 {const dl=ink.dial,mr=rect(window.campaignHud.mobileMini),dr=rect(dl),A=t.INK.dial,was=G.clock;
  ok(shown(dl)&&Math.abs(dr.left-mr.left)<1&&Math.abs(dr.width-mr.width)<1&&Math.abs(dr.top-mr.top)<1,'the dial laid over the minimap\'s rim');
  // (the sun's middle; the moon's lit side, its middle cut by the crescent's shadow)
  const at=(f,dx=0,dy=0)=>{G.clock=f*t.DAY;t.updateHUD(true);const n=dl.width,m=n/2,ro=m-A.rim*n,ri=ro-A.band*n,rc=(ro+ri)/2,R=(ro-ri)*A.mark,a=Math.PI+f*2*Math.PI;return dl.getContext('2d').getImageData(Math.round(m+Math.cos(a)*rc+dx*R),Math.round(m+Math.sin(a)*rc+dy*R),1,1).data};
  const hex=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)),near=(d,c)=>hex(c).every((v,i)=>Math.abs(v-d[i])<12);
  const noon=at(.25),night=at(.75,-.6,.35);G.clock=was;t.updateHUD(true);
  ok(near(noon,A.sun[0])&&near(night,A.moon[0]),'the sun at noon at its top, the moon at midnight at its foot (rgb '+[...noon].slice(0,3)+' / '+[...night].slice(0,3)+')');
  ok(rect(ink.day).top>=mr.bottom-t.INK.dayLap-1,'the day\'s plate below the dial, the night\'s foot clear')}
 // (Forged: every piece as it was)
 t.prefSet('inklook',false);t.frame();
 ok(!scr.classList.contains('ink')&&!shown(ink.hero)&&!shown(ink.purse)&&!shown(ink.day)&&!shown(ink.dial)&&shown(document.querySelector('.mwh-status'))&&!scr.style.getPropertyValue('--campaign-frame')&&getComputedStyle(document.getElementById('panel')).getPropertyValue('--ui-rim').includes('forged-rim')&&shown(document.getElementById('partyToggle')),'Forged: no card or purse, the forged frames back, the party strip back');
 t.prefSet('inklook',true);t.frame();ok(scr.classList.contains('ink')&&shown(ink.hero),'and Ink again');
 ok(!ERR.length,'no runtime errors');
});
