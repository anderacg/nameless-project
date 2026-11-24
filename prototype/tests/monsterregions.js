'use strict';
// Geographic difficulty, spawn policy and the live company-relative forecast.
Kit.suite(({ok,info})=>{
 const t=T;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);const initial=t.W.monsters.length,expected=Math.round(t.density(t.WM).monsterStart*t.spawnMul('monsters'));Kit.clear();Kit.world();const C=t.MONSTER_REGIONS,R=t.MonsterRegions,home=Kit.goHome('Ashford'),x=home.x,y=home.y;
 ok(initial===expected,'new games keep their intended monster population: '+initial+'/'+expected);
 const a=R.at(x,y),before=JSON.stringify(a),day=t.G.day,level=t.P.level;t.G.day=500;t.P.level=50;
 ok(a.tier===0&&a.lo===1&&a.hi===1,'settlement centres have the lowest stable monster band');
 ok(JSON.stringify(R.at(x,y))===before,'calendar and player level do not rescale an area');t.G.day=day;t.P.level=level;
 ok(!R.allows('wyrm',a)&&!R.allows('troll',a)&&R.allows('boar',a),'settled land excludes high-threat species');
 ok(R.allows('wyrm',{tier:3})&&!R.allows('dragon',{tier:3}),'deep wilds admit wyrms while mythic spawning keeps its own rules');
 ok(R.count('wolf',0,6)===2&&R.count('wolf',1,6)===3&&R.count('wolf',2,6)===5&&R.count('wolf',3,6)===6,'pack sizes grow from reduced settled packs to full wilderness packs');
 for(let tier=0;tier<4;tier++){const area={tier,lo:C.levels[tier][0],hi:C.levels[tier][1]},r=t.seeded(120+tier),values=Array.from({length:100},()=>R.level(area,{int:(lo,hi)=>lo+Math.floor(r()*(hi-lo+1))}));ok(values.every(v=>v>=area.lo&&v<=area.hi)&&values.includes(area.lo)&&values.includes(area.hi),'tier '+tier+' levels stay within their geographic band')}
 for(let tier=0;tier<4;tier++){const area={tier,lo:C.levels[tier][0],hi:C.levels[tier][1]},n=area.hi-area.lo+1,hist=Array(n).fill(0),total=n*(n+1)/2;for(let roll=0;roll<total;roll++){let calls=0;const lv=R.level(area,{int:(lo,hi)=>{calls++;return roll}});hist[lv-area.lo]++;ok(calls===1,'tier '+tier+' weighted level roll '+roll+' uses one seeded draw')}ok(hist.every((v,i)=>v===n-i),'tier '+tier+' favors the low end without excluding its upper levels: '+hist.join(','))}
 ok(!R.allows('tiger',{tier:1})&&!R.allows('bear',{tier:1})&&!R.allows('troll',{tier:2})&&!R.allows('griffin',{tier:2}),'frontier excludes large predators; trolls and griffins require deep wilderness');
 {const before=t.W.monsters.slice(),rng={int:(lo,hi)=>lo};try{for(let i=0;i<30;i++)R.birth('wolf',x+i,y,rng);const safe=t.W.monsters.slice(before.length);ok(safe.every(m=>m.lv===1&&m.n<=2&&!m.alpha&&!m.breed),'settlement spawns remain level one, in small packs without alpha leaders or elite breeds')}finally{t.W.monsters=before}}
 let remote=null;const histogram=[0,0,0,0];for(let ty=5;ty<t.MH-5;ty+=8)for(let tx=5;tx<t.MW-5;tx+=8){if(!t.passable(t.tAt(tx,ty)))continue;const p={x:(tx+.5)*t.TILE,y:(ty+.5)*t.TILE},d=R.at(p.x,p.y);histogram[d.tier]++;if(!remote||d.tier>remote.d.tier)remote={...p,d}}
 ok(histogram.filter(Boolean).length>=3,'generated land offers distinct difficulty zones: '+histogram.join(', '));
 t.W.monsters=[];for(let i=0;i<60;i++)t.spawnMonster(true);const monsters=t.W.monsters;
 info('New spawn levels: '+JSON.stringify(monsters.reduce((a,m)=>(a[m.lv]=(a[m.lv]||0)+1,a),{})));
 ok(monsters.length===60,'regional restrictions retain healthy monster population: '+monsters.length+'/60 attempts');
 ok(monsters.every(m=>{const d=R.at(m.hx,m.hy);return m.lv>=d.lo&&m.lv<=d.hi&&R.allows(m.id,d)&&t.monOf(m).where.some(w=>t.habitatAt(m.hx,m.hy).includes(w))}),'every new monster respects its birthplace level range and species gate');
 const legend=document.createElement('div');legend.innerHTML=t.fullMapLegend();
 ok(!document.querySelector('.campaign-danger')&&legend.querySelectorAll('.danger-stars .danger-star').length===4&&legend.textContent.includes('Your region'),'regional difficulty lives in the full map, without a changing top-left panel');
 {const D=t.EnemyDifficulty,focus=G.chase,follow=G.follow,mouse=G.mouse.in,power=window.partyPower;try{
   window.partyPower=()=>100;D.powerAt=-Infinity;D.states.clear();G.chase=G.follow=null;G.mouse.in=false;
   const foe=t.asMonster({id:'wolf',n:2,lv:1,x:P.x+10,y:P.y,cool:0});foe.inView=()=>true;foe.here=()=>true;foe.power=()=>200;
   D.anchor(foe,30,20);D.anchor(foe,40,25);const anchor=D.worldAnchor(foe,{x:10,y:5});ok(anchor.x===20&&anchor.top===15,'stars use the topmost actually drawn flag or pack badge, including camera offset');D.anchors.clear();
   const near=D.worldEntries(G.cam,10,[foe]);ok(near.length===1&&near[0].stars===t.MonsterRegions.threat(200,100).stars,'nearby visible enemies use their own strength against the company');
   foe.x=P.x+t.ENEMY_DIFFICULTY.near+10;const fading=D.worldEntries(G.cam,10.1,[foe]);ok(fading.length===1&&fading[0].a<near[0].a,'a visible enemy fades when you leave its proximity');
   G.chase=foe;const selected=D.worldEntries(G.cam,10.2,[foe]);ok(selected.length===1&&selected[0].chosen,'a selected enemy remains marked beyond proximity');
   foe.inView=()=>false;ok(!D.worldEntries(G.cam,10.3,[foe]).length&&!D.states.has(foe),'hidden enemies disappear immediately without leaving stars at their location');
   const herd=t.asHerd({crit:true,id:'rabbit',n:4,x:P.x,y:P.y}),unit={x:P.x+5,y:P.y},animal=new t.WorldFigure(herd,unit,0);animal.here=()=>true;animal.inView=()=>true;G.chase=animal;
   const wild=D.worldEntries(G.cam,11,[]);ok(wild.length===1&&wild[0].o===animal&&wild[0].stars===1,'hunting stars attach to the targeted individual rather than its herd center');
   G.chase=null;ok(!D.worldEntries(G.cam,12,[]).length,'untargeted wildlife does not fill the world with indicators');
   ok(t.MonsterRegions.threat(100,10000).stars<t.MonsterRegions.threat(100,1).stars,'enemy stars measure relative company strength rather than geographic tier');
 }finally{window.partyPower=power;G.chase=focus;G.follow=follow;G.mouse.in=mouse;D.states.clear();D.powerAt=-Infinity}}
 const power=window.partyPower;let low,high;try{window.partyPower=()=>1;low=R.forecast(x+30,y+30);window.partyPower=()=>100000;high=R.forecast(x+30,y+30)}finally{window.partyPower=power}
 ok(high.risk<=low.risk&&high.tier===low.tier&&high.lo===low.lo,'a stronger company changes the forecast without moving the geographic level band');
 {const saved=t.W.monsters,power=window.partyPower;try{window.partyPower=()=>10;const roaming=t.asMonster({id:'dragon',n:1,lv:1,x:t.P.x,y:t.P.y});roaming.inView=()=>false;t.W.monsters=[roaming];const hidden=R.forecast(t.P.x,t.P.y);roaming.inView=()=>true;const seen=R.forecast(t.P.x,t.P.y);ok(!hidden.nearby&&seen.nearby==='Dragon'&&seen.risk>=hidden.risk&&seen.tier===hidden.tier,'visible roaming bosses raise the warning without exposing hidden enemies or changing the area band')}finally{t.W.monsters=saved;window.partyPower=power}}
 ok(!ERR.length,'regional monster balancing and HUD produce no runtime errors');
});
