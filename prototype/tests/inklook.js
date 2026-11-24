'use strict';
window.PHONE=true;// (run in a phone's window, 844 x 390 with touch: tests/run-tests.ps1)
// The ink look (the owner, 2026-11-24, a picture of a hand-inked mobile RPG: "Can we adjust ui to have similar vibe like this?";
// ui/inkhud.js, ink-hud.css): a torn paper edge round the screen; on a phone's map your hero's card top left (level in a ring, health,
// stamina, morale, experience) that opens the party's details, your purse by a round minimap, round buttons with their names under
// them; Settings → Interface look: Forged puts every piece back as it was.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();G.paused=true;t.updateHUD(true);t.frame();
 if(!window.mobileWorldHud.media.matches)return ok(false,'the mobile layout is on: this suite needs a phone-sized window ('+innerWidth+' x '+innerHeight+')');
 const scr=document.getElementById('screen'),ink=window.inkHud,rect=e=>e.getBoundingClientRect(),shown=e=>!!e&&!e.hidden&&!!e.getClientRects().length&&getComputedStyle(e).display!=='none';
 ok(t.INK.on&&scr.classList.contains('ink')&&t.prefGet('inklook')===true,'the ink look is on at first');
 // (the paper: drawn at the edge, clear in the middle)
 {const c=ink.edge,g=c.getContext('2d'),a=(x,y)=>g.getImageData(x,y,1,1).data[3];
  ok(shown(c)&&c.width>0&&a(1,Math.round(c.height/2))>200&&a(Math.round(c.width/2),Math.round(c.height/2))===0&&getComputedStyle(c).pointerEvents==='none','a torn paper edge round the screen, the middle clear and never in the way of a tap ('+c.width+' x '+c.height+')')}
 // (the hero's card: his level, health of his most, stamina, morale, his experience to the next level)
 P.hp=Math.round(P.heroStats().hp*.5);P.bsta=64;P.morale=41;P.xp=Math.floor(t.leaderOf(P).xpNeed()*.25);t.updateHUD(true);
 {const h=ink.hero,txt=h.textContent,max=Math.round(P.heroStats().hp);
  ok(shown(h)&&rect(h).top<rect(scr).top+20&&rect(h).left<rect(scr).left+20,'your hero\'s card stands top left');
  ok(h.querySelector('.ink-lv').textContent.includes(String(P.level))&&txt.includes(P.hp+' / '+max)&&txt.includes('64%')&&txt.includes('41%')&&txt.includes((100*P.xp/t.leaderOf(P).xpNeed()).toFixed(1)+'%'),'it shows your level, health ('+P.hp+' / '+max+'), stamina, morale and experience');
  const lv=rect(h.querySelector('.ink-lv'));ok(Math.abs(lv.width-lv.height)<1&&getComputedStyle(h.querySelector('.ink-lv')).borderRadius==='50%','your level in a round ring');
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
 // (Forged: every piece as it was)
 t.prefSet('inklook',false);t.frame();
 ok(!scr.classList.contains('ink')&&!shown(ink.hero)&&!shown(ink.purse)&&!shown(ink.edge)&&shown(document.getElementById('partyToggle')),'Forged: no card, purse or paper, the party strip back');
 t.prefSet('inklook',true);t.frame();ok(scr.classList.contains('ink')&&shown(ink.hero),'and Ink again');
 ok(!ERR.length,'no runtime errors');
});
