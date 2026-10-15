'use strict';
// Lords grow as you do: a level, renown and the disciplines of command; an army capped by your formula; recruits hired from a
// holding's volunteers at your price; winning teaches them; Tactics makes their armies count for more.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;t.act('begin','soldier');G.quietEvents=true;
 ok(W.lords.every(l=>t.lordStats(l).lv>=2&&['lead','tact','med'].every(k=>l.sk[k]&&l.sk[k].lv>=0)),'every lord has a level and the disciplines of command (Leadership, Tactics, Medicine)');
 const l=W.lords[0];t.lordStats(l);const c0=t.lcapOf(l);l.lv+=2;const c1=t.lcapOf(l);l.sk.lead.lv+=3;const c2=t.lcapOf(l);
 ok(c1===c0+6&&c2===c1+3,'his army cap grows as yours does: +3 a level, +1 a level of Leadership ('+c0+' → '+c1+' → '+c2+')');
 // hiring from volunteers
 const h=t.TOWNS.find(z=>z.owner===l.fac);t.ensureEcon(h);W.treas[l.fac]=5000;Object.assign(l,{dead:false,inside:null,state:'rest',tgt:h.name,troops:['hum_levy'],x:h.x,y:h.y+14});
 h.vol=0;t.worldDay();ok(l.troops.length===1,'with no volunteers in '+h.name+', he hires nobody');
 Object.assign(l,{state:'rest',tgt:h.name,inside:null});h.vol=10;h.gar=h.T.gar;const p0=h.pop,v0=h.vol,g0=W.treas[l.fac],n0=l.troops.length,before=t.countsOf(l.troops);t.worldDay();const got=l.troops.length-n0;
 ok(got>0&&h.vol===v0-got&&h.pop===p0-got&&W.treas[l.fac]<g0,'with volunteers he hires them, as you would: '+got+' joined, the people and the treasury pay ('+(g0-W.treas[l.fac])+' gold)');
 {const c1=t.countsOf(l.troops),gained=Object.keys(c1).filter(k=>c1[k]>(before[k]||0));// (one of them may be trained up the same day)
 ok(gained.length&&gained.every(k=>h.races.some(r=>[t.RACES[r].melee,t.RACES[r].shield,t.RACES[r].ranged].includes(k))||Object.values(t.UP).some(u=>u.includes(k))),'his recruits are '+h.name+'’s own folk')}
 // a beaten lord needs volunteers to raise a new army
 {const b=W.lords.find(x=>x!==l);t.lordStats(b);const lv=b.lv;t.defeatLord(b);b.back=G.day;t.fiefsOf(b.fac).forEach(z=>{t.ensureEcon(z);z.vol=0});t.worldDay();ok(b.dead,'a beaten lord with no volunteers in his realm raises no army');
  t.fiefsOf(b.fac).forEach(z=>{z.vol=12});W.treas[b.fac]=5000;t.worldDay();ok(!b.dead&&b.troops.length>=3&&b.lv===lv,'with them he rises again at level '+b.lv+' with '+b.troops.length+' soldiers')}
 // winning teaches
 {const a=W.lords.find(x=>!x.dead);t.lordStats(a);const lv0=a.lv,xp0=a.xp+a.lv*1e4,ld=a.sk.lead.lv*1e4+a.sk.lead.xp;t.lordWins(a,30);
  ok(a.xp+a.lv*1e4>xp0&&a.sk.lead.lv*1e4+a.sk.lead.xp>ld,'a victory gives him experience and raises his Leadership');a.xp=a.lv*60-1;t.lordXp(a,5);ok(a.lv===lv0+1||a.lv>lv0,'enough experience and he reaches the next level ('+lv0+' → '+a.lv+')')}
 // tactics
 {const a=W.lords[0];a.sk.tact.lv=0;const m0=t.lordTac([a]);a.sk.tact.lv=6;ok(t.lordTac([a])>m0,'Tactics makes his army count for more in a fight (×'+t.lordTac([a]).toFixed(2)+')')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
