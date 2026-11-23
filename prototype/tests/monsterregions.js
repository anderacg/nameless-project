'use strict';
// Geographic difficulty, spawn policy and the live company-relative forecast.
Kit.suite(({ok})=>{
 const t=T;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);const initial=t.W.monsters.length,expected=Math.round(t.density(t.WM).monsterStart*t.spawnMul('monsters'));Kit.clear();Kit.world();const C=t.MONSTER_REGIONS,R=t.MonsterRegions,home=Kit.goHome('Ashford'),x=home.x,y=home.y;
 ok(initial===expected,'new games keep their intended monster population: '+initial+'/'+expected);
 const a=R.at(x,y),before=JSON.stringify(a),day=t.G.day,level=t.P.level;t.G.day=500;t.P.level=50;
 ok(a.tier===0&&a.lo===1&&a.hi===2,'settlement centres have the lowest stable monster band');
 ok(JSON.stringify(R.at(x,y))===before,'calendar and player level do not rescale an area');t.G.day=day;t.P.level=level;
 ok(!R.allows('wyrm',a)&&!R.allows('troll',a)&&R.allows('boar',a),'settled land excludes high-threat species');
 ok(R.allows('wyrm',{tier:3})&&!R.allows('dragon',{tier:3}),'deep wilds admit wyrms while mythic spawning keeps its own rules');
 ok(R.count('wolf',0,6)===3&&R.count('wolf',1,6)===4&&R.count('wolf',3,6)===6,'pack sizes grow from reduced settled packs to full wilderness packs');
 for(let tier=0;tier<4;tier++){const area={tier,lo:C.levels[tier][0],hi:C.levels[tier][1]},r=t.seeded(120+tier),values=Array.from({length:100},()=>R.level(area,{int:(lo,hi)=>lo+Math.floor(r()*(hi-lo+1))}));ok(values.every(v=>v>=area.lo&&v<=area.hi)&&values.includes(area.lo)&&values.includes(area.hi),'tier '+tier+' levels stay within their geographic band')}
 let remote=null;const histogram=[0,0,0,0];for(let ty=5;ty<t.MH-5;ty+=8)for(let tx=5;tx<t.MW-5;tx+=8){if(!t.passable(t.tAt(tx,ty)))continue;const p={x:(tx+.5)*t.TILE,y:(ty+.5)*t.TILE},d=R.at(p.x,p.y);histogram[d.tier]++;if(!remote||d.tier>remote.d.tier)remote={...p,d}}
 ok(histogram.filter(Boolean).length>=3,'generated land offers distinct difficulty zones: '+histogram.join(', '));
 t.W.monsters=[];for(let i=0;i<60;i++)t.spawnMonster(true);const monsters=t.W.monsters;
 ok(monsters.length===60,'regional restrictions retain healthy monster population: '+monsters.length+'/60 attempts');
 ok(monsters.every(m=>{const d=R.at(m.hx,m.hy);return m.lv>=d.lo&&m.lv<=d.hi&&R.allows(m.id,d)&&t.monOf(m).where.some(w=>t.habitatAt(m.hx,m.hy).includes(w))}),'every new monster respects its birthplace level range and species gate');
 const reg=window.campaignHud;reg.updateDanger();const el=reg.danger;
 ok(el.querySelectorAll('.danger-pips i').length===4&&el.querySelectorAll('.danger-pips .lit').length===1&&el.textContent.includes('Lv 1–2')&&el.getAttribute('aria-label').includes('Typical monsters'),'danger crest explains the location with level text, four geographic pips and an accessible description');
 const power=window.partyPower;let low,high;try{window.partyPower=()=>1;low=R.forecast(x+30,y+30);window.partyPower=()=>100000;high=R.forecast(x+30,y+30)}finally{window.partyPower=power}
 ok(high.risk<=low.risk&&high.tier===low.tier&&high.lo===low.lo,'a stronger company changes the forecast without moving the geographic level band');
 {const saved=t.W.monsters,power=window.partyPower;try{window.partyPower=()=>10;const roaming=t.asMonster({id:'dragon',n:1,lv:1,x:t.P.x,y:t.P.y});roaming.inView=()=>false;t.W.monsters=[roaming];const hidden=R.forecast(t.P.x,t.P.y);roaming.inView=()=>true;const seen=R.forecast(t.P.x,t.P.y);ok(!hidden.nearby&&seen.nearby==='Dragon'&&seen.risk>=hidden.risk&&seen.tier===hidden.tier,'visible roaming bosses raise the warning without exposing hidden enemies or changing the area band')}finally{t.W.monsters=saved;window.partyPower=power}}
 ok(!ERR.length,'regional monster balancing and HUD produce no runtime errors');
});
