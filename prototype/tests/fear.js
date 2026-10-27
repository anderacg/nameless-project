'use strict';
// Fear: parties weaker than you run or keep away, stronger ones hunt you, weak besiegers break off, lords avoid stronger armies.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.encCool=99;// no herds or sites in the way of the chases
 t.W.critters=[];t.W.sites=[];t.W.patrols=[];// no guards to step in: this is about the band and you
 // (open ground 8 tiles every way round you: the chases are about who runs, not the ground; a generated world's start may stand
 // among hills: then the nearest such spot)
 {const TL=t.TILE,open=(x,y)=>{for(let j=-8;j<=8;j++)for(let i=-8;i<=8;i++){const k=t.tAt(x+i,y+j);if(k!==t.T_OPEN&&k!==t.T_ROAD)return false}return true},x0=Math.floor(P.x/TL),y0=Math.floor(P.y/TL);
  if(!open(x0,y0))find:for(let r=1;r<80;r++)for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)if(Math.max(Math.abs(i),Math.abs(j))===r&&open(x0+i,y0+j)){P.x=(x0+i+.5)*TL;P.y=(y0+j+.5)*TL;break find}}
 const weak=()=>{P.troops={};P.comps={}},strong=()=>{P.troops={hum_knight:12,hum_guard:12,hum_long:10};P.comps={}};
 const gap=o2=>Math.hypot(o2.x-P.x,o2.y-P.y);
 // stance thresholds
 weak();const me=t.partyPower();ok(t.stance(me*.9)==='attack'&&t.stance(me*.6)==='wary'&&t.stance(me*.3)==='afraid','stance from power ratio: ≥80% attack, ≥50% wary, below that afraid');
 // bandits
 // (each has seen you: a party, beast or lord reckons with you only once it has detected you, worldobject.js TravelAwareness)
 const seen=x=>(t.TravelAwareness.notice(x),x);
 const band=n=>{const b={x:P.x+60,y:P.y,n,kind:'bandits',list:Array(n).fill('militia'),t:9,a:0,idle:true,cool:0};t.bandits.length=0;t.bandits.push(t.asParty(b));return seen(b)};
 // (45 frames of updateWorld: as far as 20 went before Phase 1's slower pace, D9: .4/.6 x .68 of the ground a frame)
 strong();let b=band(4),d0=gap(b);for(let k=0;k<45;k++){W.patrols=[];t.updateWorld(.05)}/* (the watch rides out every half second: kept out) */ok(gap(b)>d0+10,'a weak bandit band runs from a strong party ('+Math.round(d0)+' → '+Math.round(gap(b))+')');
 weak();b=band(14);d0=gap(b);for(let k=0;k<45;k++){G.encCool=99;W.patrols=[];t.updateWorld(.05)}ok(gap(b)<d0-10,'a strong bandit band hunts a weak party ('+Math.round(d0)+' → '+Math.round(gap(b))+')');
 // you can still run a fleeing band down
 // a band that flees is run down by riders
 strong();P.troops={hum_knight:20};P.gear.mount='m_horse';b=band(3);P.tx=b.x;P.ty=b.y;G.encCool=0;let k=0;for(;k<400&&G.mode==='world';k++){P.tx=b.x;P.ty=b.y;t.updateWorld(.05)}
 ok(G.mode==='dialog'&&G.par&&G.par.o===b,'riders can catch a fleeing band ('+k+' steps), and it is cornered: a parley, not a straight fight');t.act('pl-go');t.hidePanel();G.mode='world';G.modal=false;G.encCool=99;t.bandits.length=0;
 // monsters
 const mon=(id,n,lv)=>{const m={id,x:P.x+50,y:P.y,hx:P.x+50,hy:P.y,lv,n,t:9,a:0,cool:0};W.monsters=[m];return seen(t.asMonster(m))};
 strong();let m=mon('wolf',4,1);d0=gap(m);for(let i=0;i<20;i++)t.updateMonsters(.05);ok(gap(m)>d0+8,'a wolf pack runs from a strong party');
 weak();m=mon('tiger',1,3);d0=gap(m);for(let i=0;i<10;i++)t.updateMonsters(.05);ok(gap(m)<d0-8,'a tiger hunts a weak party');
 strong();m=mon('wolf',4,1);m.x=P.x+5;m.hx=m.x;G.encCool=0;t.updateMonsters(.01);ok(G.mode==='world','an afraid pack never starts a fight');W.monsters=[];
 // lords
 W.rel={};W.rel[t.rk('vale','karn')]={s:'war',since:1};P.fac='vale';W.lords.forEach((x,i)=>{x.x=-5000-i*400;x.y=-5000;x.inside=null});// out of their holdings, onto the field
 const l=W.lords.find(x=>x.fac==='karn'&&!x.dead);l.troops=Array(6).fill('dw_clan');l.state='rest';l.cool=0;l.x=P.x+60;l.y=P.y;seen(l);
 strong();d0=gap(l);for(let i=0;i<15;i++)t.updateLords(.05);ok(gap(l)>d0+5,'a weak hostile lord runs');
 const tw=t.townBy('Highmoor');l.state='siege';l.tgt=tw.name;l.x=tw.x+16;l.y=tw.y+12;P.x=tw.x;P.y=tw.y+40;seen(l);t.updateLords(.05);
 ok(l.state==='home'&&/abandons the siege/.test(G.msgs[G.msgs.length-1].m),'a weak besieger abandons the siege when you arrive');
 // in the grace after a fight (G.encCool), a hunting band or lord stops at GRACE_GAP: its last step is cut short, not
 // carried into the gap (big time steps make the steps long; each starts 40 px off on open ground in plain line to you)
 {const r0=Math.random;Math.random=t.seeded(41);try{weak();P.tx=null;P.ty=null;W.monsters=[];
  const spot=()=>[0,1,2,3,4,5,6,7].map(k=>[P.x+40*Math.cos(k*Math.PI/4),P.y+40*Math.sin(k*Math.PI/4)]).find(([x,y])=>t.passable(t.terrAt(x,y))&&t.clearLine(x,y,P.x,P.y))||[P.x+40,P.y];
  const closest=(o,step)=>{let lo=gap(o);for(let i=0;i<40;i++){G.encCool=5;step();lo=Math.min(lo,gap(o))}return lo};
  const bb=band(14);[bb.x,bb.y]=spot();bb.idle=false;const lb=closest(bb,()=>t.updateBands(.4));
  ok(t.stance(bb.power())==='attack'&&lb>=t.GRACE_GAP-1e-6&&lb<t.GRACE_GAP+6&&!G.enc,'in the grace, a hunting band closes in but never steps into the gap (closest '+lb.toFixed(2)+' px, gap '+t.GRACE_GAP+')');t.bandits.length=0;
  const gl=W.lords.find(x=>x.fac==='karn'&&!x.dead&&x!==l)||l;gl.troops=Array(14).fill('dw_axe');gl.state='rest';gl.inside=null;gl.cool=0;gl.tgt=t.townBy('Highmoor').name;[gl.x,gl.y]=spot();seen(gl);
  const ll=closest(gl,()=>t.updateLords(.4));
  ok(t.stance(t.rating(gl.troops))==='attack'&&ll>=t.GRACE_GAP-1e-6&&ll<t.GRACE_GAP+6&&!G.enc,'in the grace, a hunting lord closes in but never steps into the gap (closest '+ll.toFixed(2)+' px)');
  gl.x=-9000;gl.y=-9000;G.encCool=99}finally{Math.random=r0}}
 // lord against a much stronger enemy lord
 P.fac=null;P.x=-9999;P.y=-9999;const big=W.lords.find(x=>x.fac==='vale'&&!x.dead);big.troops=Array(18).fill('hum_knight');big.x=l.x+40;big.y=l.y;big.state='rest';
 l.state='march';l.tgt=t.townBy('Ashford').name;t.updateLords(.01);ok(l.state==='home','a marching lord turns back from a far stronger enemy army');
 // labels
 strong();ok(t.STANCE_COL[t.stance(t.rating(Array(3).fill('militia')))]==='#78c474','weak parties are labeled green');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
