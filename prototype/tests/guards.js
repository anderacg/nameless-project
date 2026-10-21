'use strict';
// Estate guards fall and stay fallen: beaten (plunder, burn, a caught sabotage, villagers fighting back with the guards), the
// estate's own guards are gone and their posts fill again one a day after GUARDS.refill days; the garrison's men are lost to it;
// kept in the save while a post is empty (estates.js guardsBeaten, data/holdings.js x.gd)
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),out=()=>{const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
 const t=T,G=t.G;
 try{t.act('begin','soldier');G.quietEvents=true;
  const z=t.TOWNS.find(x=>x.owner&&x.owner!=='player'&&Object.keys(t.ESTATES).some(k=>t.bldLv(x,k)));const k=Object.keys(t.ESTATES).find(k=>t.bldLv(z,k));
  const lv=t.bldLv(z,k),own=t.GUARDS.base+t.GUARDS.per*lv,n0=t.estateGuards(z,k).length,g0=z.gar||0;
  // (an estate near the walls has some of the garrison standing with its own: those are lost, and as many more stand there next)
  const near=t.estateOf(z,k).nearWalls();t.guardsBeaten(z,k);const n1=t.estateGuards(z,k).length,stand=near?Math.min(t.GUARDS.gar,z.gar||0):0;
  ok(n1===stand,'beaten, the estate\u2019s own guards are gone ('+n0+' to '+n1+'; own '+own+(near?'; near the walls, '+stand+' more of the garrison stand by it':'')+')');
  ok(g0-(z.gar||0)===(near?Math.min(t.GUARDS.gar,g0):0),'and any garrison men who stood with them are lost to the garrison ('+g0+' to '+(z.gar||0)+')');
  const d0=G.day;G.day=d0+t.GUARDS.refill-1;const a=t.estateGuards(z,k).length;G.day=d0+t.GUARDS.refill+1;const b=t.estateGuards(z,k).length;G.day=d0+t.GUARDS.refill+own+1;const c=t.estateGuards(z,k).length;
  ok(a===n1&&b>a&&c>=own,'their posts stay empty '+(t.GUARDS.refill-1)+' days, then fill one a day ('+a+', '+b+', '+c+')');
  G.day=d0;t.guardsBeaten(z,k);ok(!!(z.gd&&z.gd[k]&&z.gd[k].length),'the empty posts are kept on the holding (saved while one is empty)');
  // population: the dead are the holding's people; each post filled takes one more; too few people and it waits
  {G.day=d0;delete z.gd;const lv2=t.bldLv(z,k),own2=t.GUARDS.base+t.GUARDS.per*lv2;z.pop=200;t.guardsBeaten(z,k);ok(z.pop===200-own2,'the fallen guards were the holding’s people ('+own2+' fewer: '+z.pop+')');
   const p0=z.pop;for(let i=0;i<t.GUARDS.refill+own2+1;i++){G.day++;t.guardsDay(z)}ok(z.pop===p0-own2&&t.estateGuards(z,k).length>=own2,'each post filled again takes one person ('+p0+' to '+z.pop+')');
   G.day=d0;delete z.gd;z.pop=t.GUARDS.minPop;t.guardsBeaten(z,k);const pl=z.pop;for(let i=0;i<t.GUARDS.refill+own2+3;i++){G.day++;t.guardsDay(z)}
   ok(z.gd&&z.gd[k]&&z.gd[k].length===own2&&z.pop===pl,'a holding with too few people cannot fill them (posts wait; '+pl+' people)')}
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}out()};
