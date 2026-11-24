'use strict';
window.PHONE=true;// (run in a phone's window, 844 x 390 with touch: tests/run-tests.ps1)
// The ink look (the owner, 2026-11-24, a picture of a hand-inked mobile RPG: "Can we adjust ui to have similar vibe like this?", then "remove
// the outer frame ... all ui sharing the same color tone ... a frame to be golden ...", \"golden rusted\", no black border, not square; ui/inkhud.js, ink-hud.css): every frame one of rusted gold, its corners round; on a phone's map your hero's card top left (level in a ring, health,
// stamina, morale, experience) that opens the party's details, a round minimap, round buttons with their names under
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
 // (your army's card: its flag (the owner: "Change level to army flag"), your level, health of your most, stamina, morale, your gold, food and
 // drink ("make the top left ui panel smaller and more compact. Make gold, food, water integrated with army info"), experience to the next level)
 P.hp=Math.round(P.heroStats().hp*.5);P.bsta=64;P.morale=41;P.xp=Math.floor(t.leaderOf(P).xpNeed()*.25);t.updateHUD(true);
 {const h=ink.hero,txt=h.textContent,max=Math.round(P.heroStats().hp);
  ok(shown(h)&&rect(h).top<rect(scr).top+20&&rect(h).left<rect(scr).left+20,'your hero\'s card stands top left');
  ok(h.querySelector('.ink-lv img').getAttribute('src')===t.flagUrl(P.banner())&&!txt.includes('Lv ')&&txt.includes(P.hp+'/'+max)&&txt.includes('64%')&&txt.includes('41%')&&!h.querySelector('.ink-xp'),'it shows your army\'s flag (no level: "Remove level from army"), health ('+P.hp+'/'+max+'), stamina, morale and experience');
  {const S=t.supplyNow(),r=h.querySelector('.ink-res');ok(r&&r.textContent.includes(P.gold.toLocaleString('en'))&&r.querySelectorAll('span').length===3&&!document.querySelector('.ink-purse'),'your gold, food and drink in the card, nowhere else ('+r.textContent+')');
   ok(rect(h).width<=212.5&&rect(h).height<=72,'compact: '+Math.round(rect(h).width)+' x '+Math.round(rect(h).height)+' px')}
  const lv=rect(h.querySelector('.ink-lv'));ok(Math.abs(lv.width-lv.height)<1&&getComputedStyle(h.querySelector('.ink-lv')).borderRadius==='50%','your army\'s flag in a round ring');
  const q=rect(document.getElementById('qtrack'));ok(q.top>=rect(h).bottom-1,'the quests below the card, not under it ('+Math.round(q.top)+' / '+Math.round(rect(h).bottom)+')');
  h.click();t.frame();ok(scr.classList.contains('party-open')&&shown(document.getElementById('stats'))&&h.getAttribute('aria-expanded')==='true','a tap on it opens the party\'s details');
  h.click();t.frame();ok(!scr.classList.contains('party-open'),'and another closes them')}
 // (the quest cards as compact as the army card, the owner: "Make quest tracking and cool down panel even smaller and compact": as wide
 // as it, each line one line)
 {const q=document.getElementById('qtrack'),h=rect(ink.hero),rows=[...q.querySelectorAll('.qt-row b,.qt-row small')].filter(shown);
  ok(rect(q).width<=h.width+1&&rows.length&&rows.every(e=>rect(e).height<=17),'the quest cards no wider than the army card, each line one line ('+Math.round(rect(q).width)+' px)')}
 // (the round minimap, the round buttons)
 {const m=window.campaignHud.mobileMini,mr=rect(m);
  ok(shown(m)&&Math.abs(mr.width-mr.height)<1&&getComputedStyle(m).borderTopLeftRadius==='50%','the minimap round ('+Math.round(mr.width)+' px)');
  const bs=['pause','speedToggle','mapToggle','charBtn','menuBtn'].map(id=>document.getElementById(id)),round=bs.filter(b=>{const r=rect(b);return Math.abs(r.width-r.height)<1&&getComputedStyle(b).borderTopLeftRadius==='50%'});
  ok(round.length===bs.length,'the buttons are round ('+round.length+' of '+bs.length+')');
  const dl=document.querySelector('#mapToggle .dl');ok(rect(dl).width>8&&rect(dl).bottom>rect(document.getElementById('mapToggle')).bottom+2,'their names at their feet');
  ok(rect(window.mobileWorldHud.root).height<=52,'the bottom row as low as before ('+rect(window.mobileWorldHud.root).height+' px)')}
 // (the day in one short line under the minimap (the owner: "Remove that bar and show only compact below text"), no frame; day and night
 // round its rim (the owner: "make day and night as a circle integrated with map"), the bar's own sky icon at the hour ("Why dont you
 // use icon from the bar?"): dawn left, noon top, dusk right, midnight at its foot)
 {const d=ink.day,dr=rect(d),mr=rect(window.campaignHud.mobileMini),D=t.dayParts(),dl=ink.dial,A=t.INK.dial,was=G.clock;
  ok(shown(d)&&d.textContent.includes(D.day)&&!d.textContent.includes(D.time)&&dr.top>=mr.bottom-1&&dr.right<=mr.right+1&&getComputedStyle(d).borderImageSource==='none'&&getComputedStyle(d).backgroundColor==='rgba(0, 0, 0, 0)','the day in a short line under the minimap, no frame ('+d.textContent+')');
  ok(!shown(document.querySelector('.mwh-status')),'no day strip by the buttons');
  const dd=rect(dl);ok(shown(dl)&&Math.abs(dd.left-mr.left)<1&&Math.abs(dd.width-mr.width)<1&&Math.abs(dd.top-mr.top)<1,'the dial laid over the minimap\'s rim');
  // (as the page has it: the sky's icon put through the page, so the two read alike)
  const norm=h=>{const e=document.createElement('span');e.innerHTML=h;return e.innerHTML};
  const at=f=>{G.clock=f*t.DAY;t.updateHUD(true);const h=rect(ink.hour);return{x:(h.left+h.right)/2-(mr.left+mr.width/2),y:(h.top+h.bottom)/2-(mr.top+mr.height/2),html:ink.hour.innerHTML,sky:norm(t.dayParts().sky)}};
  const noon=at(.25),night=at(.75),dawn=at(0);G.clock=was;t.updateHUD(true);
  ok(Math.abs(noon.x)<2&&noon.y<-mr.height*.35&&Math.abs(night.x)<2&&night.y>mr.height*.35&&dawn.x<-mr.width*.35,'the hour\'s icon: noon at its top, midnight at its foot, dawn at its left');
  info('the hour\'s icon at noon and midnight: '+(noon.html===night.html?'the same (the weather\'s)':'the sun\'s, then the moon\'s or the weather\'s'));
  ok(noon.html===noon.sky&&night.html===night.sky&&!!ink.hour.querySelector('svg'),'the bar\'s own sky icon, the sun\'s by day and the moon\'s or the weather\'s by night')}
 // (a level's skill points: a round button at the right under the day's line (the owner: "Change that and move it to the right side");
 // the log in the bottom-left corner ("Make log fit in bottom left"))
 {const h=t.leaderOf(P);h.addXp(h.xpNeed()-(h.xp||0));t.updateHUD(true);const b=document.querySelector('#lgroup .lvup'),br=b&&rect(b),dr=rect(ink.day),sr=rect(scr),tr=rect(document.querySelector('.toasts')),dk=rect(document.querySelector('.mwh-dock'));
  ok(b&&shown(b)&&Math.abs(br.width-br.height)<1&&getComputedStyle(b).borderTopLeftRadius==='50%'&&br.right>sr.right-20&&br.top>=dr.bottom,'a level\'s skill points: a round button at the right under the day ('+(br?[Math.round(br.left),Math.round(br.top)]:'none')+')');
  ok(tr.left<sr.left+20&&tr.bottom>sr.bottom-20&&tr.right<=dk.left,'the log in the bottom-left corner, clear of the buttons')}
 // (one gap between every two pieces and from the screen's edge, the owner: "make sure they are having the same gap")
 {const G=parseFloat(getComputedStyle(scr).getPropertyValue('--ink-gap')),sr=rect(scr),R=e=>rect(e),q=[...document.querySelectorAll('#qtrack>div,#qtrack .qt-list')].filter(shown).map(R).sort((a,b)=>a.top-b.top);
  const col=[R(ink.hero),...q.filter((r,i,a)=>!a.some((o,j)=>j!==i&&o.top<=r.top&&o.bottom>=r.bottom&&o!==r))],gaps=col.slice(1).map((r,i)=>Math.round(r.top-col[i].bottom));
  const mr=R(window.campaignHud.mobileMini),dk=R(document.querySelector('.mwh-dock')),bs=[...document.querySelectorAll('.mwh-dock>div')].map(R),bg=bs.slice(1).map((r,i)=>Math.round(r.left-bs[i].right));
  const edges=[R(ink.hero).left-sr.left,R(ink.hero).top-sr.top,sr.right-mr.right,mr.top-sr.top,sr.right-dk.right,sr.bottom-dk.bottom].map(Math.round);
  ok(G===6&&gaps.every(g=>g===G)&&bg.every(g=>g===G)&&edges.every(e=>e===G)&&Math.round(R(ink.day).top-mr.bottom)===G,'one gap of '+G+' px: the left column ('+gaps+'), the buttons ('+bg+'), the screen\'s edges ('+edges+'), the minimap to its day')}
 // (every round button's name on a tag across its ring's foot, the tags' feet at the screen's edge by the gap: "What about text at bottom right?")
 {const sr=rect(scr),G=parseFloat(getComputedStyle(scr).getPropertyValue('--ink-gap')),bs=[...document.querySelectorAll('.mwh-dock>div>button')];
  const tag=b=>{const e=b.querySelector('.dl,small');if(e&&shown(e))return{text:e.textContent,r:rect(e)};const a=getComputedStyle(b,'::after');return a.content&&a.content!=='none'?{text:a.content.replace(/"/g,''),r:{bottom:rect(b).bottom+parseFloat(a.bottom)*-1}}:null};
  const tags=bs.map(tag);ok(tags.every(Boolean)&&tags.every(t=>Math.round(sr.bottom-t.r.bottom)===G),'every round button named on a tag, '+G+' px from the screen\'s foot ('+tags.map(t=>t&&t.text).join(', ')+')')}
 // (Forged: every piece as it was)
 t.prefSet('inklook',false);t.frame();
 ok(!scr.classList.contains('ink')&&!shown(ink.hero)&&!shown(ink.day)&&!shown(ink.dial)&&!shown(ink.hour)&&shown(document.querySelector('.mwh-status'))&&!scr.style.getPropertyValue('--campaign-frame')&&getComputedStyle(document.getElementById('panel')).getPropertyValue('--ui-rim').includes('forged-rim')&&shown(document.getElementById('partyToggle')),'Forged: no card, the forged frames back, the party strip back');
 t.prefSet('inklook',true);t.frame();ok(scr.classList.contains('ink')&&shown(ink.hero),'and Ink again');
 ok(!ERR.length,'no runtime errors');
});
