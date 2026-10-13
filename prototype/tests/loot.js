'use strict';
// Loot: the end of every fight shows what it brought in (gold, XP, renown, prisoners) and lays the things it won on the
// ground beside your bag: take what you want while there is room, put things back to make room, and leave the rest
// (your choice: Esc won't do it). Defeats show what was lost.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');t.bandits.length=0;G.quietEvents=true;
 const panel=()=>document.getElementById('panel'),html=()=>panel().innerHTML,world=()=>{G.mode='world';G.modal=false;G.enc=null;G.loot=null;t.hidePanel();G.encCool=0;while(G.mode==='perk')t.act('perk',G.perkOffer[0])};
 const tiles=()=>[...panel().querySelectorAll('.loot-item strong')].map(e=>e.textContent),chip=n=>{const s=[...panel().querySelectorAll('.loot-stats > span')].find(e=>e.querySelector('b').textContent===n);return s?s.lastChild.textContent:''};
 // a won monster fight: trophies, a forced rare drop, gold and XP
 P.troops={hum_knight:12};world();const M=t.MONSTERS.bear,gear0=M.gear;M.gear=gear0.map(([g])=>[g,1]);
 const m={id:'bear',x:P.x+5,y:P.y,hx:P.x,hy:P.y,lv:1,n:1,t:0,a:0,cool:0};W.monsters.push(m);const g0=P.gold;
 t.startMonster(m);t.concludeEncounter(true,{hum_knight:1},1,true,['bear']);M.gear=gear0;
 ok(/Spoils/.test(html())&&tiles().some(s=>/Bear Hide/.test(s))&&tiles().some(s=>/Bear Hide Coat/.test(s)),'a victory lists the spoils: '+tiles().join(', '));
 ok(tiles()[0]&&/Coat/.test(tiles()[0]),'gear comes first');
 ok(panel().querySelectorAll('.loot-item canvas').length===tiles().length,'every item shows its icon');
 ok((P.gold===g0?chip('Gold')==='':chip('Gold')==='+'+(P.gold-g0))&&/^\+\d+/.test(chip('XP')),'with the XP ('+chip('XP')+') it brought, and no gold line when beasts carry none');
 ok(/Your losses/.test(html())&&/1 knight|knight/i.test(html()),'and your losses');
 const has=id=>P.inv.some(x=>x&&x.id===id);ok(!has('bearcoat')&&!has('bearhide')&&/On the ground/.test(html()),'nothing goes into your bag until you take it');
 window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));ok(G.mode==='esc','Esc pauses rather than leave the spoils behind');window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));
 const ci=G.loot.pile.findIndex(x=>x.id==='bearcoat');t.act('lt-take',String(ci));ok(has('bearcoat')&&!G.loot.pile.some(x=>x.id==='bearcoat')&&tiles().length===2,'clicking an item takes it');
 t.act('lt-all');ok(has('bearhide')&&!G.loot.pile.length&&/You took everything/.test(html())&&/data-act="cont"/.test(html()),'Take all that fits takes the rest');
 t.act('cont');world();
 // a full bag: what would not fit is named
 const keep=P.inv.slice();for(let i=0;i<P.inv.length;i++)if(!P.inv[i])P.inv[i]={k:'mat',id:'goo',n:1};
 const w={id:'wolf',x:P.x+5,y:P.y,hx:P.x,hy:P.y,lv:1,n:4,t:0,a:0,cool:0};W.monsters.push(w);t.startMonster(w);t.concludeEncounter(true,{},4,true,['wolf','wolf','wolf','wolf']);
 ok(/no room/.test(html())&&panel().querySelector('[data-act="lt-all"]').disabled,'with a full bag, the spoils wait on the ground ('+tiles().join(', ')+')');
 const gi=P.inv.findIndex(x=>x&&x.id==='goo');t.act('lt-drop',String(gi));ok(!P.inv[gi]&&G.loot.pile.some(x=>x.id==='goo'),'putting something back makes room');
 const pi=G.loot.pile.findIndex(x=>x.id==='pelt');t.act('lt-take',String(pi));ok(P.inv.some(x=>x&&x.id==='pelt'),'and the pelts go in its place');
 t.act('lt-leave');ok(!G.loot&&G.msgs.some(m=>/You leave .*behind/.test(m.m)),'leaving the rest is a choice you make, and the log says what was left');world();P.inv=keep;
 // a defeat: what you lost
 P.prisoners={militia:2};P.gold=200;G.enc={kind:'party',ref:{x:P.x,y:P.y,cool:0},list:['militia']};t.concludeEncounter(false,{hum_knight:2},0,true,[]);
 ok(/Defeat/.test(html())&&chip('Gold')==='−50'&&/escaped/.test(chip('Prisoners')),'a defeat shows the gold lost ('+chip('Gold')+') and the prisoners who escaped');
 t.act('cont');world();
 // prisoners taken show by kind
 P.troops={hum_knight:6};P.prisoners={};G.enc={kind:'party',ref:{x:P.x,y:P.y,cool:0},list:Array(9).fill('militia')};t.concludeEncounter(true,{},9,true,Array(9).fill('militia'));
 ok(/^\+\d+ \(\d+ (militia|bandit)/i.test(chip('Prisoners')),'prisoners taken: '+chip('Prisoners'));t.act('cont');world();
 // a real battle: the summary includes arrows gathered from the field
 P.troops={hum_knight:8};P.gear.weapon=t.gearId('bow',1);t.invAdd('good','arrows',30);G.enc={kind:'party',ref:{x:P.x,y:P.y,cool:0},list:['militia','militia']};
 t.startBattle({enemies:G.enc.list,tournament:false});t.B.fired=20;t.B.units.filter(u=>u.team===1).forEach(u=>u.hp=0);let i=0;while(t.B&&i<400){t.updateBattle(.05);i++}
 ok(!t.B&&/Victory/.test(html())&&tiles().some(s=>/Arrows/.test(s)),'after a fought battle, arrows gathered from the field are among the spoils');
 t.act('lt-leave');world();
 ok(!G.loot,'the watch ends with the summary');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
