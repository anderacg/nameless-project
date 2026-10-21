'use strict';
// Fleeing: a fight you started can always be called off; otherwise it is a race your band's speed decides (night and cover
// help, a big band is slower). Some fights cannot be fled. Caught, your rearguard pays and you must fight; got away, the foe
// loses your trail for a while instead of standing on top of you.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;t.act('begin','soldier');G.quietEvents=true;W.monsters=[];W.critters=[];t.bandits.length=0;W.patrols=[];G.clock=t.DAY*.3;
 const panel=()=>document.getElementById('panel').innerHTML,world=()=>{t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.encCool=0};
 const flee=()=>t.__act0('flee');// the game's own flee, not the tests' shortcut
 const band=n=>{const b={x:P.x+8,y:P.y,n,cool:0,t:0,a:0,kind:'bandits'};t.bandits.push(t.asParty(b));return b};
 P.troops={hum_levy:10};
 // you started it: call it off
 world();let b=band(12);t.startEncounter({kind:'party',ref:b,n:12,band:'bandits',mine:true});ok(/>Leave</.test(panel()),'a fight you started shows Leave');flee();ok(G.mode==='world','and you can always call it off');
 // they came for you: a race
 world();b=band(12);t.startEncounter({kind:'party',ref:b,n:12,band:'bandits'});const od=t.fleeOdds(G.enc);
 ok(!od.leave&&od.ch>0&&od.ch<1&&/Flee · \d+% to get away/.test(panel()),'when they come for you, Flee shows your chance ('+Math.round(od.ch*100)+'%)');
 {const r=Math.random;Math.random=()=>.999;flee();Math.random=r;ok(G.mode==='dialog'&&G.enc&&G.enc.noFlee&&P.troops.hum_levy===9&&/They caught you/.test(panel()),'caught: your rearguard falls (1 of 10) and you must fight; Flee is closed')}
 world();b=band(12);t.startEncounter({kind:'party',ref:b,n:12,band:'bandits'});{const r=Math.random;Math.random=()=>0;const x0=P.x;flee();Math.random=r;
  ok(G.mode==='world'&&b.cool>=10&&Math.hypot(P.x-x0,0)>30,'got away: you put ground between you, and they lose your trail ('+b.cool+'s)');
  const d0=Math.hypot(b.x-P.x,b.y-P.y);for(let i=0;i<20;i++)t.updateWorld(.05);ok(Math.hypot(b.x-P.x,b.y-P.y)>=d0-14&&G.mode==='world','meanwhile they do not come and stand on you (they wander, no more)')}
 // what helps and what hurts
 world();b=band(14);b.troops=Array(14).fill('elf_glade');t.startEncounter({kind:'party',ref:b,n:14,band:'bandits',list:b.troops.slice()});// light infantry: close to your pace
 const day=t.fleeOdds(G.enc).ch;G.clock=t.DAY*.85;const night=t.fleeOdds(G.enc).ch;G.clock=t.DAY*.3;
 const s10=t.mySpeed();P.troops={hum_levy:40};const s40=t.mySpeed();P.troops={hum_levy:10};
 ok(night>day&&s40<s10,'night helps ('+Math.round(day*100)+'% → '+Math.round(night*100)+'%), a big band is slower ('+s10.toFixed(1)+' → '+s40.toFixed(1)+')');world();
 // impossible
 {const L=t.asParty({id:'X',name:'Lord X',fac:t.FIDS[0],x:P.x+60,y:P.y,troops:Array(12).fill('hum_spear'),state:'march',dead:false,cool:0});b=band(12);
  t.startEncounter({kind:'party',ref:b,n:12,band:'bandits',foes:[L]});ok(t.fleeOdds(G.enc).ch===0&&/closing in/.test(panel()),'with more of them closing in around you, you cannot flee');world()}
 {const dm=t.mythicOf('dragon')||t.spawnMythic('dragon');if(dm){dm.x=P.x+8;dm.y=P.y;t.startEncounter({kind:'monster',ref:dm,list:['dragon']});const f=t.fleeOdds(G.enc);ok(f.ch===0&&/on the wing/.test(panel()),'nor from a dragon on the wing ('+(f.why||f.ch)+')');world()}else ok(true,'(no dragon)')}
 // a patrol that met you does not crowd you while it cools down: one strong enough to ride at you (with no cool-down it would)
 // keeps to its beat (its next stop set away from you, and the
 // dice pinned, so a random stop that happens to lie past you, or a new one picked, never reads as riding at you)
 {const z=t.TOWNS.find(q=>q.owner&&q.owner!=='player');P.hostile={[z.owner]:G.day+30};const p=t.asParty({pt:true,watch:t.watchNow(),home:z.name,fac:z.owner,troops:t.garList({gar:30,races:z.races}),x:P.x+40,y:P.y,cool:8,dir:1,wx:P.x+120,wy:P.y});W.patrols=[p];
  const r0=Math.random;Math.random=t.seeded(7);try{const d0=Math.hypot(p.x-P.x,p.y-P.y);for(let i=0;i<20;i++)t.updatePatrols(.05);ok(Math.hypot(p.x-P.x,p.y-P.y)>=d0-12,'a patrol cooling down does not ride up and stand on you')}finally{Math.random=r0}P.hostile={}}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
