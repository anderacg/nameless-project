'use strict';
// Sieges by the realms: a relief army fights the besiegers, the lords inside sally out when they are a match for them, and a
// siege stands still while its lord is fighting. At a holding someone else besieges you may take either side: break the
// siege (the garrison and the lords inside fight beside you, every besieger against you) or storm the walls with the
// besiegers (they fight beside you, and the realm that led the siege may have the holding). An army sent to relieve your own
// siege comes at your camp whatever the odds, and the garrison sallies with it.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;W.critters=[];W.sites=[];W.monsters=[];t.bandits.length=0;W.caravans=[];W.patrols=[];W.refugees=[];
 const world=()=>{t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.encCool=0;G.lastTown=null};
 const T1=t.TOWNS.find(z=>z.kind==='town'&&z.owner),A=T1.owner,B=t.FIDS.find(f=>f!==A&&!t.W.dead[f]);
 const war=()=>{t.W.rel[t.rk(A,B)]={s:'war',since:t.G.day}};war();P.fac=null;P.hostile={};P.honor={};
 const mk=(name,fac,x,y,n,type,o)=>t.asParty(Object.assign({id:name,uid:null,name,fac,x,y,troops:Array(n).fill(type||'hum_spear'),state:'rest',tgt:T1.name,sd:0,dead:false,cool:0},o||{}));
 const sieger=(tw,n,name)=>mk(name||'Ser Siege',B,tw.x+16,tw.y+12,n||10,'hum_spear',{state:'siege',tgt:tw.name});
 const farP=()=>{P.x=T1.x+600;P.y=T1.y+600};
 // ---- a relief army comes and fights the besieger
 farP();W.fights=[];const s1=sieger(T1),r1=mk('Lord Relief',A,T1.x-2,T1.y+12,12,'hum_spear',{state:'relieve'});W.lords=[s1,r1];t.updateLords(.05);
 ok(s1.fight&&r1.fight&&s1.fight===r1.fight,'a relief army that reaches the siege lines fights the besieger');
 {const sd=s1.sd;t.worldDay();ok(s1.sd===sd,'and the siege stands still while its lord is fighting')}
 // ---- the lords inside sally out when strong enough
 W.fights=[];const s2=sieger(T1,6),in1=mk('Lord Inside',A,T1.x,T1.y,20,'hum_knight',{inside:T1.name,tgt:T1.name});W.lords=[s2,in1];war();t.worldDay();
 ok(!in1.inside&&in1.fight&&in1.fight===s2.fight,'the lord inside, stronger than the besieger, rides out to break the siege');
 // ---- you, neutral to both: either side
 W.fights=[];const s3=sieger(T1,10);W.lords=[s3];war();world();P.x=T1.x;P.y=T1.y+20;P.troops={hum_knight:12};t.approachHolding(T1);
 const html=document.getElementById('panel').innerHTML;
 ok(/Break the siege/.test(html)&&/data-act="sg-relieve"/.test(html)&&/Join the siege/.test(html)&&/data-act="sg-join"/.test(html),'neutral to both, you may break the siege or join it');
 t.act('sg-join',B);ok(G.enc&&G.enc.kind==='siege'&&G.enc.allies.includes(s3)&&t.hostileTo(A)&&G.capWith===B,'joining: you storm the walls with the besieger beside you, and the defenders turn hostile');
 {const Bt=t.B;Bt.units.filter(u=>u.team===1).forEach(u=>t.applyDmg(u,9999));for(let i=0;i<80&&!Bt.over;i++)t.updateBattle(.05);Bt.endT=0;t.updateBattle(.01);t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
  ok(G.mode==='capture'&&/who led the siege/.test(document.getElementById('panel').innerHTML),'won: you may hand it to the realm that led the siege');
  const g0=P.gold;t.act('cap-peace');ok(T1.owner===B&&P.gold>g0&&!G.capWith,'handed over: it is theirs, and they pay you')}
 // ---- breaking a siege: garrison and lords inside beside you, every besieger against you
 world();P.hostile={};P.honor={};const T2=t.TOWNS.find(z=>z!==T1&&z.owner===A&&z.kind!=='village')||t.TOWNS.find(z=>z!==T1&&z.owner===A);
 if(T2){T2.gar=Math.max(T2.gar,6);const s4=sieger(T2,10,'Ser One'),s5=sieger(T2,8,'Ser Two'),in2=mk('Lord Holds',A,T2.x,T2.y,8,'hum_spear',{inside:T2.name,tgt:T2.name});W.lords=[s4,s5,in2];war();
  P.x=T2.x;P.y=T2.y+20;t.approachHolding(T2);t.act('sg-relieve','0');const e=G.enc;
  ok(e&&e.kind==='lord'&&e.allies.some(a=>a.kind==='garrison')&&e.allies.includes(in2)&&e.foes.includes(s5),'breaking the siege: the garrison and '+in2.name+' sally beside you, and the other besieger joins the fight against you');
  t.act('flee');world()}
 // ---- an army sent to relieve your siege attacks your camp, even a weak one, with the garrison sallying
 {const T3=t.TOWNS.find(z=>z.owner===A&&z.kind!=='village');P.hostile={[A]:G.day+60};T3.gar=5;P.siege={town:T3.name,days:1};P.troops={hum_knight:20};P.x=T3.x+20;P.y=T3.y+20;
  const rl=mk('Lord Rescue',A,P.x+6,P.y,6,'hum_levy',{state:'relieve',tgt:T3.name});W.lords=[rl];world();t.updateLords(.05);
  ok(G.enc&&G.enc.ref===rl&&G.enc.foes.some(f=>f.kind==='garrison'),'a relief army comes at your siege camp though you outnumber it, and the garrison sallies with it');
  t.act('flee');P.siege=null;world()}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
