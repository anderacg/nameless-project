'use strict';
// Vitals: health, stamina and mana carry over between battles, recover on the map (faster near holdings), fastest while staying in a holding,
// a knocked-out hero comes to at 10%, a lost auto-resolve costs half your health, and the Hero window and encounters show it. (Stamina
// is your band's, by the hour: tests/supply.js)
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P;try{localStorage.clear()}catch(e){}
 const done=()=>{while(G.mode==='perk')t.act('perk',G.perkOffer[0])};
 t.act('begin','soldier');const m=t.vitals();ok(P.hp===m[0]&&P.sp===m[1]&&P.mp===m[2],'a new hero starts full ('+m.join(' / ')+')');
 const battle=()=>{G.mode='world';G.modal=false;t.hidePanel();G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia']};t.startBattle({enemies:['militia'],tournament:false});return t.B};
 const finish=(B,win)=>{B.win=win;B.over=true;B.endT=0;t.updateBattle(.01);t.act('cont');done()};
 // carry over
 let B=battle();B.hero.hp-=30;t.updateBattle(.01);B.hx.sp-=25;B.hx.mp-=20;const hp=B.hero.hp,sp=B.hx.sp,mp=B.hx.mp;finish(B,true);
 ok(Math.abs(P.hp-hp)<1&&Math.abs(P.sp-sp)<1&&Math.abs(P.mp-mp)<1,'health, stamina and mana carry out of a battle');
 B=battle();ok(Math.abs(B.hero.hp-P.hp)<1&&B.hero.hp<B.hero.max,'the next battle starts wounded ('+Math.round(B.hero.hp)+' / '+B.hero.max+')');t.updateBattle(.01);
 ok(Math.abs(B.hx.sp-P.sp)<2&&Math.abs(B.hx.mp-P.mp)<2,'and with the stamina and mana you had left');
 B.hero.hp=0;finish(B,false);ok(P.hp===Math.max(1,Math.round(m[0]*.1)),'a knocked-out hero comes to at 10% health ('+P.hp+')');
 // recovery on the map
 P.x=t.TOWNS[0].x+400;P.y=t.TOWNS[0].y+400;t.unstick(P);P.hp=10;P.sp=0;P.mp=0;t.regenVitals(1);const far=[P.hp,P.sp,P.mp].map(Math.round);
 ok(far[0]>10&&far[1]===0&&far[2]>0&&far[0]<m[0],'a day on the road restores some health and mana ('+far.join(' / ')+'; stamina is the band’s, by the hour)');
 P.x=t.TOWNS[0].x;P.y=t.TOWNS[0].y+20;P.hp=10;P.sp=0;P.mp=0;t.regenVitals(1);ok(P.hp-10>(far[0]-10)*1.8,'recovery is twice as fast near a holding');
 {const g=t.townBy('Ashford');P.rep[g.name]=40;P.hp=10;P.sp=0;P.mp=0;t.startStay(g);t.stayTick(0);t.regenVitals(.5);t.stayTick(t.DAY*.5);ok(P.hp-10>(far[0]-10)*1.8&&!!P.stay,'staying in a holding recovers you faster still');t.leaveStay();done()}
 // auto-resolve defeat
 P.troops={};const h0=P.hp;G.mode='world';G.modal=false;t.startEncounter({kind:'party',ref:t.asParty({cool:0,x:P.x,y:P.y,troops:Array(15).fill('spearman')}),list:Array(15).fill('spearman'),band:'bandits'});t.autoResolve();t.act('cont');done();
 ok(Math.abs(P.hp-Math.round(h0*.5))<=1,'losing an auto-resolved fight costs half your health');
 // display
 P.hp=20;G.mode='world';G.modal=false;t.hidePanel();t.openChar();t.act('party-select','hero');ok(['Health','Stamina (your band’s)','Mana'].every(n=>document.querySelector('#panel .fb-meter[aria-label="'+n+'"]'))&&document.querySelector('#panel .fb-meter.bad[aria-label="Health"]')&&!/Mana/.test(document.getElementById('stats').innerHTML),'your hero’s card in the Army window shows your vitals and flags low health (not the party card)');t.act('char-close');
 G.mode='world';G.modal=false;t.startEncounter({kind:'party',ref:t.asParty({cool:0,x:P.x,y:P.y,n:3,kind:'bandits'}),n:3,band:'bandits'});ok(/You are wounded/.test(document.getElementById('panel').innerHTML),'encounters warn when you are wounded');t.act('flee');
 // saves
 P.hp=33;P.sp=12;P.mp=7;G.mode='world';G.modal=false;t.hidePanel();t.saveGame();P.hp=P.sp=P.mp=null;t.act('load');ok(P.hp===33&&P.sp===12&&P.mp===7,'save/load keeps your vitals');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
