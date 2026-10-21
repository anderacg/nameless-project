'use strict';
// Hunger and thirst hit your hero, and the game can end (the owner, 2026-10-22; world/supply.js SUPPLY.thirst.hero, hunger.hero):
// Parched or Hungry, her mana stops coming back; Dying of thirst, every thirst toll takes 10% of her health and 10% of her mana;
// Starving, 5% of each every 6 hours; Starving or Dying of thirst, her health stops coming back. At 0 health off the battlefield she
// dies: the game is over, a window says of what and on which day, its bar Load last save (greyed with none) and Back to the title,
// Esc following it; nothing runs on behind it. Here: a hero alone (no troops) dying of thirst in the desert, with no save and with one.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,S=t.SUPPLY,ev=s=>(0,eval)(s);
 const panel=()=>document.getElementById('panel').innerHTML;
 const desert=()=>{for(let ty=8;ty<t.MH-8;ty++)for(let tx=8;tx<t.MW-8;tx++){const x=(tx+.5)*16,y=(ty+.5)*16;if(t.tAt(tx,ty)===t.T_OPEN&&t.climAt(x,y)==='desert'&&!t.TOWNS.some(h=>Math.hypot(h.x-x,h.y-y)<120)&&!t.nearWater(x,y,4))return [x,y]}return null};
 const bag=g=>{for(const k of ['water','ale','liquor',...t.FOODS])t.goodTake(k,1e9);for(const k in g||{})t.playerInventory.add('good',k,g[k])};
 // (your hero alone, at full health and mana, in the desert with nothing to drink)
 const alone=(food)=>{Kit.clear();Kit.world({encCool:99});const s=desert();Kit.goTo(s[0],s[1]);P.troops={};P.comps={};P.wounded={};P.woundedGroups=[];P.race='human';P.bsta=100;P.morale=60;
  ev('BAND=freshBand()');bag(food===false?{}:{grain:40});P.restoreVitals();return s};
 Kit.begin('soldier',4242);
 ok(!!desert(),'(a spot in the desert, far from water and holdings)');
 // ---- Thirsty: all comes back; Parched: mana stops; Dying of thirst: health too, and every toll takes a share
 {alone();const m=t.vitals(),regen=()=>{P.hp=m[0]/2;P.mp=m[2]/2;t.regenVitals(1);return[P.hp>m[0]/2,P.mp>m[2]/2]};
  let r=regen();ok(r[0]&&r[1]&&t.thirstTag(t.supplyLand())[0]==='Thirsty','Thirsty: health and mana come back as ever');
  ev('BAND.dry='+S.thirst.parched);r=regen();const tip=t.thirstTag(t.supplyLand());ok(r[0]&&!r[1]&&tip[0]==='Parched'&&/mana does not come back/.test(tip[2]),'Parched: your mana stops coming back, health still does (the tag says so)');
  ev('BAND.dry='+S.thirst.dying);r=regen();const tip2=t.thirstTag(t.supplyLand());ok(!r[0]&&!r[1]&&/10% of your health and 10% of your mana/.test(tip2[2]),'Dying of thirst: neither comes back (the tag says what each toll takes)');
  P.restoreVitals();ev('BAND.dry='+(S.thirst.dying-S.thirst.desert));P.troops={hum_levy:3};const n0=t.troopCount();t.supplyHour();
  ok(t.troopCount()===n0-1&&Math.abs(P.hp-m[0]*(1-S.thirst.hero.hp))<1e-6&&Math.abs(P.mp-m[2]*(1-S.thirst.hero.mp))<1e-6,'a thirst toll: a man falls sick, and you lose '+S.thirst.hero.hp*100+'% of your health and '+S.thirst.hero.mp*100+'% of your mana')}
 // ---- Hungry: mana stops; Starving: 5% of each every 6 hours, health stops
 {alone(false);t.playerInventory.add('good','water',200);const m=t.vitals(),regen=()=>{P.hp=m[0]/2;P.mp=m[2]/2;t.regenVitals(1);return[P.hp>m[0]/2,P.mp>m[2]/2]};
  let r=regen();ok(r[0]&&!r[1]&&/mana does not come back/.test(t.hungerTag()[2]),'Hungry (no food): your mana stops coming back, health still does');
  ev('BAND.hungry='+(S.hunger.starving-1));r=regen();P.restoreVitals();t.supplyHour();
  ok(t.BAND.hungry===S.hunger.starving&&Math.abs(P.hp-m[0]*(1-S.hunger.hero.hp))<1e-6&&Math.abs(P.mp-m[2]*(1-S.hunger.hero.mp))<1e-6,'Starving: you lose '+S.hunger.hero.hp*100+'% of your health and mana as it begins');
  const h0=P.hp;for(let i=1;i<S.hunger.hero.every;i++)t.supplyHour();const mid=P.hp;t.supplyHour();ok(mid===h0&&P.hp<h0,'and again '+S.hunger.hero.every+' hours on, not between');
  P.hp=m[0]/2;t.regenVitals(1);ok(P.hp===m[0]/2&&/neither comes back/.test(t.hungerTag()[2]),'Starving: your health no longer comes back')}
 // ---- alone, dying of thirst in the desert, no save: the game is over
 {Kit.fresh();alone();let h=0;for(;h<200&&!G.dead;h++)t.supplyHour();
  ok(!!G.dead&&P.hp===0&&G.dead.why==='thirst'&&G.mode==='dead','alone in the desert with no water: you die of thirst ('+h+' hours), health at 0');
  const p=panel(),ld=document.querySelector('.nav [data-nav="back"]'),out=document.querySelector('.nav [data-nav="close"]');
  ok(/You have died/.test(p)&&/thirst/.test(p)&&p.includes('day '+G.dead.day),'the window: You have died, of thirst, on day '+G.dead.day);
  ok(ld&&ld.disabled&&/Load last save/.test(ld.textContent)&&out&&/Back to the title/.test(out.textContent),'its bar: Load last save on the left, greyed with no save; Back to the title on the right');
  const c=G.clock;t.updateWorld(.5);ok(G.clock===c&&G.mode==='dead','nothing runs on behind it');
  Kit.key('Escape','Escape');ok(G.mode==='title','Esc follows the bar: back to the title')}
 // ---- with a save: Load last save brings it back
 {Kit.begin('soldier',4242);Kit.world();t.saveGame(true,'quick');ok(!!t.readSave(),'(a save)');alone();ev('BAND.dry='+(S.thirst.dying+S.thirst.toll-1));P.hp=1;t.supplyHour();
  const ld=document.querySelector('.nav [data-nav="back"]');ok(G.mode==='dead'&&ld&&!ld.disabled,'dead again: Load last save is open');
  Kit.key('Escape','Escape');ok(G.mode==='world'&&!G.dead&&P.hp>0,'Esc follows the bar: the last save loaded, your hero alive')}
 // ---- a battle lost is not death; tolls never touch a hero away from them
 {Kit.begin('soldier',4242);Kit.world();P.hp=0;t.regenVitals(.01);ok(!G.dead,'health at 0 from a battle is not death by itself')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
