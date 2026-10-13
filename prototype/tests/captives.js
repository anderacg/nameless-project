'use strict';
// Leaders in battle and after it: a lord or chieftain fights at the head of his men as a tougher fighter; beaten by you he is
// your captive (ransom or hand over, or let go; back in time either way); beaten by others he gets away and rebuilds; lose a
// battle and your captives slip away; companions are wounded, never killed. And every party is drawn, clicked and seen one way.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}t.act('begin','soldier');G.quietEvents=true;W.monsters=[];W.critters=[];
 const done=()=>{while(G.mode==='perk')t.act('perk',G.perkOffer[0])},world=()=>{t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.encCool=0};
 const battle=e=>{world();t.startEncounter(e);t.startBattle({enemies:G.enc.list,tournament:false,lv:G.enc.lv||1});return t.B},endBattle=()=>{t.B.over=true;t.B.endT=0;t.B=null;world()};
 const L=W.lords.find(l=>!l.dead);Object.assign(L,{inside:null,x:P.x+8,y:P.y,troops:Array(10).fill('hum_spear'),state:'march',cool:0});P.hostile={[L.fac]:G.day+30};P.troops={hum_levy:5};
 // leaders fight
 {const B=battle({kind:'lord',ref:L,list:L.troops.slice(),allies:[],foes:[]}),u=B.units.find(x=>x.leader&&x.leader.ref===L);const base=t.ST[u&&u.type];
  ok(u&&u.team===1&&u.s.hp>base.hp*1.5,'a lord fights at the head of his army, far tougher than his men ('+(u&&u.s.hp)+' health against '+(base&&base.hp)+')');
  const n0=L.size;u.hp=1;t.applyDmg?t.applyDmg(u,99):(u.hp=0);ok(L.size===n0,'his fall costs him no soldier from his ranks');endBattle()}
 {const b=t.bandits[0];b.x=P.x+8;b.y=P.y;const B=battle({kind:'party',ref:b,n:b.n,list:b.list.slice(),band:'bandits'});const u=B.units.find(x=>x.leader);
  ok(u&&u.type==='chief'&&u.leader.name===b.ld.name,'a band’s chieftain fights with it, by name ('+(u&&u.leader.name)+')');endBattle()}
 {const s=W.sites.find(x=>x.type==='camp');s.cleared=false;const own=t.makeEnemies(7,true);const B=battle({kind:'camp',ref:s,list:own});
  ok(B.units.filter(x=>x.team===1&&x.type==='chief').length===1&&B.units.some(x=>x.leader&&x.type==='chief'),'a camp’s chieftain is the chief in its ranks, not a second one');endBattle()}
 {const A=W.lords.find(l=>!l.dead&&l!==L);Object.assign(A,{inside:null,x:P.x,y:P.y,troops:Array(6).fill('hum_spear')});const b=t.bandits[1];
  const B=battle({kind:'party',ref:b,n:b.n,list:b.list.slice(),band:'bandits',allies:[A],foes:[]});ok(B.units.some(x=>x.leader&&x.leader.ref===A&&x.team===0),'a lord riding beside you fights at his men’s head too');endBattle()}
 // a lord beaten by you
 {world();t.startEncounter({kind:'lord',ref:L,list:L.troops.slice(),allies:[],foes:[]});t.concludeEncounter(true,{},10,true,[]);t.act('cont');done();
  const i=P.captives.findIndex(c=>c.k==='lord'&&c.id===L.id);ok(i>=0&&L.dead&&L.held,'beat a lord and he is your captive');
  G.day+=20;t.worldDay();ok(L.dead,'held, he raises no army');
  const g0=P.gold,r=t.lordRansom(P.captives[i]);t.act('ct-ransom',String(i));ok(P.gold-g0===r&&!L.held&&L.back<=G.day+6,'ransomed ('+r+' gold), he rides home to raise a new army')}
 // a chieftain beaten by you, let go
 {world();const b=t.bandits[0],ld=b.ld;b.x=P.x+8;b.y=P.y;t.startEncounter({kind:'party',ref:b,n:b.n,list:b.list.slice(),band:'bandits'});t.concludeEncounter(true,{},3,true,[]);t.act('cont');done();
  const i=P.captives.findIndex(c=>c.ld===ld);ok(i>=0&&!t.bandits.includes(b),'break a band and its chieftain is your captive');
  t.act('ct-free',String(i));ok(W.exiles.some(x=>x.ld===ld),'let go, he goes off to gather a new band');
  const x=W.exiles.find(x=>x.ld===ld);G.day=x.back;t.chiefDay();ok(t.bandits.some(q=>q.ld===ld),'and is back on the roads with one ('+ld.name+')')}
 // beaten by others: he gets away
 {const b=t.bandits.find(q=>q.ld),ld=b.ld;t.routParty(b,[]);ok(!t.bandits.includes(b)&&W.exiles.some(x=>x.ld===ld),'a band broken by others: its chieftain gets away to rebuild')}
 // you lose: the captives slip away
 {const b=t.bandits.find(q=>q.ld);P.captives.push({k:'chief',ld:t.newChief('bandits',2)});world();b.x=P.x+8;b.y=P.y;t.startEncounter({kind:'party',ref:b,n:b.n,list:b.list.slice(),band:'bandits'});
  t.concludeEncounter(false,{},0,true,[]);t.act('cont');done();ok(!P.captives.length,'lose a battle and your captives slip away')}
 // companions
 {P.comps={elske:{ap:0,role:''}};t.compInit('elske');world();const b=t.bandits.find(q=>q.ld);b.x=P.x+8;b.y=P.y;const B=battle({kind:'party',ref:b,n:b.n,list:b.list.slice(),band:'bandits'});const u=B.units.find(x=>x.comp);
  u.hp=1;t.applyDmg(u,99);ok(P.comps.elske&&P.comps.elske.hurt>G.day&&!t.compInBand('elske'),'a companion knocked down is wounded for a few days, never killed');endBattle()}
 // one way to draw, click and see every party
 {const all=W.parties.filter(p=>p.onMap());ok(all.every(p=>{const k=p.look();return k&&k.col&&typeof k.label==='string'}),'every party says how it looks ('+all.length+')');
  ok(typeof t.drawParties==='function'&&typeof window.drawPatrols==='undefined'&&typeof window.drawCParties==='undefined','and one drawer draws them all');
  const A=W.lords.find(l=>!l.dead&&!l.inside);A.x=P.x+40;A.y=P.y;ok(t.pickAt(A.x,A.y-4)===A,'a lord on the map is clicked on his figure');A.inside='x';ok(t.pickAt(A.x,A.y-4)!==A,'and not while he is inside a holding');A.inside=null;
  const f=(()=>{for(let ty=10;ty<t.MH-10;ty++)for(let tx=10;tx<t.MW-10;tx++)if(t.tAt(tx,ty)===t.T_FOREST&&t.hiddenAt((tx+.5)*16,(ty+.5)*16))return [(tx+.5)*16,(ty+.5)*16]})();
  if(f){A.x=f[0];A.y=f[1];P.x=f[0]+100;P.y=f[1];const V=t.vis();ok(!A.inView(150)&&A.inView(400),'in the woods a party is seen only from nearer')}else ok(true,'(no woods)')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
