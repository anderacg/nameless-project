'use strict';
// Disciplines: every one starts at 0 (a race or past only gives a knack: faster learning), rises by doing what it names, and
// gives more of that.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,TILE=t.TILE;
 const zero=Object.keys(t.BGS).filter(b=>{t.act('begin',b);return !Object.values(P.sk).every(s=>s.lv===0&&s.xp===0)});
 ok(!zero.length&&Object.keys(t.SKILLS).length>=17,Object.keys(t.SKILLS).length+' disciplines, all at 0 for every past'+(zero.length?' (not: '+zero.join(', ')+')':''));
 t.act('begin','soldier');G.quietEvents=true;
 {t.train('oneh',5);t.train('twoh',5);ok(P.sk.oneh.xp>P.sk.twoh.xp,'a knack (the soldier’s One-Handed) learns faster than the rest ('+P.sk.oneh.xp.toFixed(1)+' xp against '+P.sk.twoh.xp.toFixed(1)+' for Two-Handed)');P.sk.oneh={lv:0,xp:0};P.sk.twoh={lv:0,xp:0}}
 const up=(k,f)=>{const x=P.sk[k].xp+P.sk[k].lv*1000;f();return P.sk[k].xp+P.sk[k].lv*1000>x};
 // Two-Handed: the grip decides which discipline a hit trains and which one adds damage
 P.gear.offhand=null;P.gear.weapon=t.gearId('greatsword',2);ok(t.meleeSk()==='twoh','a greatsword is held two-handed');
 {const d0=t.heroStats().dmg;P.sk.oneh.lv=5;const d1=t.heroStats().dmg;P.sk.twoh.lv=5;const d2=t.heroStats().dmg;ok(d1===d0&&d2>d1,'Two-Handed (not One-Handed) adds damage to a two-handed grip');P.sk.oneh.lv=0;P.sk.twoh.lv=0}
 P.gear.weapon=t.gearId('spear',1);ok(t.meleeSk()==='twoh','a spear with the off hand empty is two-handed');P.gear.offhand=t.gearId('shield',1);ok(t.meleeSk()==='oneh','with a shield it is one-handed');P.gear.weapon=t.gearId('sword',1);
 // Blocking
 {G.mode='world';G.modal=false;t.hidePanel();G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['orc_grunt']};t.startBattle({enemies:G.enc.list,tournament:false});const m0=t.blockMul();ok(up('block',()=>t.guard(10)),'a blocked hit trains Blocking');P.sk.block.lv=5;ok(t.blockMul()<m0,'and Blocking lets less of a blocked hit through');P.sk.block.lv=0;t.B.over=true;t.B.endT=0;t.updateBattle(.01);t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);G.mode='world';G.modal=false;t.hidePanel()}
 // Riding: only in the saddle
 {P.gear.mount=null;const v0=t.travelMul();P.sk.ride.lv=5;ok(t.travelMul()===v0,'Riding does nothing on foot');P.gear.mount='m_horse';const v1=t.travelMul();P.sk.ride.lv=0;ok(v1>t.travelMul(),'and speeds you in the saddle');
  P.tx=P.x+200;P.ty=P.y;ok(up('ride',()=>{for(let i=0;i<40&&G.mode==='world';i++)t.updateWorld(.05)}),'riding trains Riding');P.tx=null;P.gear.mount=null}
 // Survival: harsh land teaches it, and it softens the land
 {const z=t.TOWNS.find(q=>q.clim==='frost');let spot=null;for(let r=60;r<400&&!spot;r+=16)for(let a=0;a<6.28&&!spot;a+=.4){const x=z.x+Math.cos(a)*r,y=z.y+Math.sin(a)*r;if(t.climAt(x,y)==='frost'&&t.TOWNS.every(q=>Math.hypot(q.x-x,q.y-y)>=60))spot=[x,y]}
  P.x=spot[0];P.y=spot[1];t.invAdd('good','grain',30);const m0=P.morale=80;ok(up('surv',()=>t.survive()),'a night in the frost trains Survival');const lost0=m0-P.morale;
  P.sk.surv.lv=10;P.morale=80;t.survive();ok(80-P.morale<=lost0,'and a skilled band loses less to it ('+lost0+' morale without, '+(80-P.morale)+' with)');P.sk.surv.lv=0}
 // Stewardship: holding fiefs teaches it, and it raises their taxes
 {const z=t.townBy('Thornwick');z.owner='player';t.ensureEcon(z);const g0=t.fiefIncome(z);P.sk.stew.lv=10;ok(t.fiefIncome(z)>g0,'Stewardship raises a fief’s taxes ('+g0+' to '+t.fiefIncome(z)+' gold a day)');P.sk.stew.lv=0;ok(up('stew',()=>t.fiefDay()),'each day you hold fiefs trains it')}
 // Persuasion: demanding surrender teaches it, and foes yield more often
 {P.troops={hum_spear:6};const b={x:P.x+5,y:P.y,n:4,list:Array(4).fill('orc_grunt'),kind:'bandits'};t.bandits.push(b);const y0=t.yieldChance(b,'band');P.sk.pers.lv=10;ok(t.yieldChance(b,'band')>y0||y0>=.95,'Persuasion makes cornered foes likelier to yield');P.sk.pers.lv=0;
  t.parley(b,'band');ok(up('pers',()=>t.act('pl-yield')),'demanding a surrender trains it');G.mode='world';G.modal=false;t.hidePanel()}
 // Scouting: spotting a place
 {const s=W.sites.find(q=>!q.seen&&q.type!=='camp');P.x=s.x;P.y=s.y+40;G.lastSite=s;ok(up('scout',()=>t.updateSites())&&s.seen,'spotting a new place trains Scouting')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
