'use strict';
// The word of a lost group (battle/morale.js MORALE.army, armyWord, armyHear; the owner, 2026-10-20): when a group routs or is cut
// down, every other group of its side feels it, each later the farther it stands (word spreading), more for a big or elite group
// or a leader's own, less far away; repeated losses stack, each less; a rout's neighbours keep the cascade and never hear it twice;
// the word over a group that feels it; off with its switch or with morale off.
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);const A=t.MORALE.army,on0=A.on;try{
 // (a paused lab battle; your groups placed at [x, y] each, the enemy far off to the east)
 const start=(left,places,extra={})=>{if(L.active)L.exit();L.start({leftGroups:left,rightGroups:[{type:'hum_foot',count:10}],morale:true,deploy:false,paused:true,ai:false,seed:42,distance:800,...extra});
  const b=t.B;b.obs=[];const gs=t.playerGroups().map(id=>b.groups[id]),foe=Object.values(b.groups).find(g=>g.foe);
  const put=(g,x,y)=>{g.placeAt(x,y);g.face=0;g.currentFacing=0;t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+(u.sx||0);u.y=g.ay+(u.sy||0);u.cd=999})};
  gs.forEach((g,i)=>put(g,...places[i]));put(foe,1150,300);t.moraleTick(0);return{b,gs,foe}};
 const Q=()=>t.B.armyWord||[],entry=g=>Q().find(w=>w.gid===g.id),mor=g=>g.resolve.mor;
 const hear=at=>{t.B.t=at;t.armyHear()};
 const foot=n=>({type:'hum_foot',count:n});
 ok(A&&A.on===true&&A.delay>0&&A.per>0&&A.max>A.delay&&A.hit>0&&A.fade>0&&A.fade<1&&A.elite>1&&A.lead>1&&A.far<1,'its numbers in one table (MORALE.army: delay '+A.delay+' s + '+A.per+' s a 100 px, at most '+A.max+' s; hit '+A.hit+'; elite x'+A.elite+', leader x'+A.lead+'; far x'+A.far+' at '+A.span+' px; fade x'+A.fade+')');
 // ---- the delay grows with distance; the hit shrinks with it; a rout's neighbours keep the cascade
 let f=start([foot(10),foot(10),foot(10),foot(10),foot(10)],[[300,300],[300,380],[300,520],[300,800],[700,900]]);let [lost,near,mid,far,farther]=f.gs;
 const m0=f.gs.map(mor);lost.resolve.route();
 const eM=entry(mid),eF=entry(far),eX=entry(farther);
 ok(!entry(near)&&eM&&eF&&eX,'a rout: every other group of the army hears of it, but the one beside it (within '+t.GROUP_RESOLVE.routeRadius+' px) takes the cascade instead');
 ok(eM.at<eF.at&&eF.at<eX.at&&eM.at-f.b.t>=A.delay&&eX.at-f.b.t<=A.max+1e-9,'the word reaches each later the farther it stands ('+[eM,eF,eX].map(w=>(w.at-f.b.t).toFixed(2)+' s').join(', ')+')');
 ok(eM.hit>eF.hit&&eF.hit>eX.hit&&eX.hit>=A.hit*A.far-1e-9,'and hits the far ones less ('+[eM,eF,eX].map(w=>w.hit.toFixed(2)).join(', ')+')');
 t.moraleTick(0);ok(near.resolve.routShockAt===f.b.t&&mor(near)<m0[1]&&mor(mid)===m0[2],'at once: the neighbour shaken by the cascade, the others not yet');
 const nearAfter=mor(near);hear(eM.at);ok(mor(mid)<m0[2]&&mor(far)===m0[3]&&mor(farther)===m0[4]&&mor(near)===nearAfter,'then the word reaches the nearer group first, the far ones still unaware, the neighbour never twice');
 hear(eF.at);ok(mor(far)<m0[3]&&mor(farther)===m0[4],'then the farther');hear(eX.at);ok(mor(farther)<m0[4]&&!Q().length,'and last the farthest; none left to hear');
 ok(m0[2]-mor(mid)>m0[4]-mor(farther),'the near group felt it more than the far ('+(m0[2]-mor(mid)).toFixed(2)+' against '+(m0[4]-mor(farther)).toFixed(2)+')');
 // ---- bigger for a big or elite group, and for a leader's own
 const hitFrom=(lostKind,lostN)=>{const ff=start([{type:lostKind,count:lostN},foot(10),foot(10)],[[300,300],[300,600],[300,700]]);ff.gs[0].resolve.route();return entry(ff.gs[1]).hit};
 const small=hitFrom('hum_foot',4),avg=hitFrom('hum_foot',10),big=hitFrom('hum_foot',20),elite=hitFrom('hum_guard',10);
 ok(small<avg&&avg<big,'a bigger group lost hits harder ('+[small,avg,big].map(x=>x.toFixed(2)).join(' < ')+')');
 ok(elite>avg*1.3,'an elite group (tier '+t.ST.hum_guard.tier+') harder still than a plain one its size ('+elite.toFixed(2)+' against '+avg.toFixed(2)+')');
 {const ff=start([foot(10),foot(10),foot(10)],[[300,300],[300,600],[300,700]]);t.B.units.push(Object.assign({},ff.gs[0].units[0],{id:'ldr',leader:{lv:5},hp:1,grp:ff.gs[0].id}));
  ff.gs[0].resolve.route();const lh=entry(ff.gs[1]).hit;t.B.units.pop();ok(lh>avg*(A.lead-.01),'a leader’s own group lost: x'+A.lead+' ('+lh.toFixed(2)+')')}
 // ---- losses stack, each less; one lost skirmisher breaks nobody
 f=start([foot(10),foot(10),foot(10),foot(10)],[[300,200],[300,260],[300,700],[300,900]]);const [l1,l2,h,h2]=f.gs;const a0=mor(h);
 l1.resolve.route();const w1=entry(h);hear(w1.at);const d1=a0-mor(h);l2.resolve.route();const w2=entry(h);hear(w2.at);const d2=a0-mor(h)-d1;
 ok(d1>0&&d2>0&&d2<d1&&Math.abs(d2/d1/(A.fade*w2.hit/w1.hit)-1)<.05,'a second loss stacks, a little less ('+d1.toFixed(2)+' then '+d2.toFixed(2)+')');
 ok(h.resolve.armyHeard===2,'each group counts the word it has heard');
 f=start([foot(3),foot(15),foot(15),foot(15)],[[300,150],[300,400],[300,550],[300,700]]);const p0=f.gs.slice(1).map(mor);f.gs[0].resolve.route();hear(f.b.t+A.max+.01);
 const drops=f.gs.slice(1).map((g,i)=>p0[i]-mor(g));ok(drops.every(d=>d>0&&d<A.hit)&&f.gs.slice(1).every(g=>!g.resolve.routed&&mor(g)>t.MORALE.waver),'a lost skirmisher (3 men) shakes the army only a little ('+drops.map(d=>d.toFixed(2)).join(', ')+'), nobody near breaking');
 // ---- cut down to the last man: the word too (the neighbours as well: no cascade for that), and a group lost once
 f=start([foot(6),foot(10),foot(10)],[[300,300],[300,380],[300,700]]);let [cut,nb,fa]=f.gs;
 for(const u of cut.units){u.hp=0;t.moraleDeath(u,null)}
 ok(entry(nb)&&entry(fa)&&/has fallen!$/.test(entry(fa).say),'a group cut down: its whole army hears it, the neighbour too (“'+entry(fa).say+'”)');
 f=start([foot(6),foot(10)],[[300,300],[300,700]]);[cut,fa]=f.gs;cut.resolve.route();const n1=Q().length;for(const u of cut.units){u.hp=0;t.moraleDeath(u,null)}
 ok(n1===1&&Q().length===1,'routed, then cut down: one word, not two');
 // ---- what is said, over the group that feels it
 f=start([foot(10),foot(10),foot(10),foot(10)],[[300,120],[300,350],[300,500],[300,650]]);f.gs[0].resolve.route();
 ok(entry(f.gs[2]).say==='The left flank is broken!','where it stood: your northern group, facing the enemy in the east, is your left flank (“'+entry(f.gs[2]).say+'”)');
 hear(entry(f.gs[2]).at);ok(f.b.floats.some(x=>x.t==='The left flank is broken!'&&Math.abs(x.x-f.gs[2].resolve.live()[0].x)<1),'the word shows over the group as it hears it');
 {const ff=start([foot(10),foot(10),foot(10)],[[300,300],[300,150],[300,450]]);ff.gs[0].resolve.route();ok(Q().length===2&&Q().every(w=>w.say==='The centre is broken!'),'the middle group lost: “The centre is broken!”')}
 // ---- a routed hearer hears nothing; off; no morale
 f=start([foot(10),foot(10),foot(10)],[[300,200],[300,600],[300,800]]);f.gs[2].resolve.route();f.gs[0].resolve.route();const rm=mor(f.gs[2]);hear(f.b.t+A.max+.01);ok(mor(f.gs[2])===rm,'a group already routing hears none of it');
 A.on=false;f=start([foot(10),foot(10)],[[300,200],[300,600]]);f.gs[0].resolve.route();ok(!Q().length,'MORALE.army.on false: only the cascade, as before');A.on=on0;
 f=start([foot(10),foot(10)],[[300,200],[300,600]],{morale:false});for(const u of f.gs[0].units){u.hp=0;t.moraleDeath(u,null)}ok(!Q().length,'morale off: no word');
 // ---- in a fight: the AI armies, nothing thrown, the word heard
 f=start([foot(10),foot(4),foot(10),{type:'hum_bow',count:6}],[[300,150],[300,300],[300,450],[200,300]],{ai:true,distance:300,rightGroups:[{type:'hum_knight',count:8},{type:'hum_foot',count:14}]});f.foe.units.forEach(u=>u.cd=0);
 let heard=0;for(let i=0;i<20&&!t.B.over;i++){L.step(300);heard=Math.max(heard,...Object.values(t.B.groups).map(g=>g.resolve&&g.resolve.armyHeard||0))}const lostN=Object.values(t.B.groups).filter(g=>g.resolve&&g.resolve.armyLost).length;
 ok(!ERR.length&&heard>0,'an AI battle with groups routing runs, the word heard ('+t.B.t.toFixed(1)+' s; groups lost '+lostN+'; the most word a group heard: '+heard+')');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{A.on=on0;if(L.active)L.exit()}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
