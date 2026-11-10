'use strict';
// Standards (doc/STANDARDS_DESIGN.md phase 1; the owner, 2026-11-10: "every factions will also have a static flag in their
// territory ... This tower and flag can be captured by another factions or even bandits, goblin"): a realm's standards on its
// land at its crossings, fords, passes and resources, the same every time a world begins; drawn (a plinth, a pole, its banners; a
// tower from level 2); taken by you: its guards beaten, your banner up after STANDARD.hold hours by it, for the realm you serve,
// for yourself once you hold a holding, else handed to a realm near or left to no one; its guards back a day; all through a save.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,S=t.STANDARD,SP=t.STANDARD_PLACE;
 Kit.begin('soldier');
 const all=()=>t.Standards.all(),A=all();
 info(A.length+' standards: '+A.map(s=>s.name+' ('+s.realm+', level '+s.lv+')').join('; '));
 // ---- where they stand
 const why=A.reduce((a,s)=>(a[s.why]=(a[s.why]||0)+1,a),{}),gap=Math.min(...A.flatMap((a,i)=>A.slice(i+1).map(b=>Math.hypot(a.tx-b.tx,a.ty-b.ty))));
 ok(A.length>=8&&A.every(s=>s instanceof t.Standard&&W.sites.includes(s)&&t.FACS[s.realm]&&s.realm!=='player'),A.length+' standards among the sites, each a realm\'s');
 {const bad=A.filter(s=>!(t.tAt(s.tx,s.ty)===t.T_OPEN&&!t.Standards.built(s.tx,s.ty)&&t.Standards.realmAt(s.tx,s.ty)===s.realm)).map(s=>s.name+' '+t.tAt(s.tx,s.ty)+' '+t.Standards.built(s.tx,s.ty)+' '+t.Standards.realmAt(s.tx,s.ty)+'/'+s.realm);ok(!bad.length,'each on open ground of its own realm\'s land, nothing built within '+SP.clear+' tiles'+(bad.length?': '+bad.join(', '):''))}
 ok(gap>=SP.gap&&why.deposit>0&&Object.keys(why).length>=2,'at least '+SP.gap+' tiles apart ('+gap.toFixed(1)+'); at deposits and at crossings, fords or passes ('+JSON.stringify(why)+')');
 {const byP=new Map();for(const s of A){const p=t.Provinces.at(s.x,s.y);byP.set(p,(byP.get(p)||0)+1)}ok([...byP.values()].every(n=>n<=SP.most+1),'at most '+(SP.most+1)+' a province');
  const again=t.Standards.place();ok(again.length===A.length&&again.every((s,i)=>s.tx===A[i].tx&&s.ty===A[i].ty&&s.name===A[i].name&&s.lv===A[i].lv),'the same standards every time the world is reckoned (no draw)')}
 ok(A.every(s=>s.guards===S.guards[s.lv]&&s.lv>=1&&s.lv<=3)&&A.some(s=>s.lv>=2),'its guards by its level ('+S.guards.slice(1).join(', ')+'), some with a tower');
 // ---- drawn, on the minimap and among the places
 {const one=A.find(s=>s.lv===1),two=A.find(s=>s.lv>=2),a=one&&t.siteSprite(one),b=two&&t.siteSprite(two);
  ok(a&&b&&a.width>0&&b.width>a.width&&a===t.siteSprite(one)&&t.Discovery.places().includes(two)&&Array.isArray(two.mapDot(0)||[]),'drawn as a standard, wider with its tower, made once; among the places you discover')}
 // ---- taken by you: you serve no one and hold nothing: handed to a realm near
 const strong=()=>{P.troops={hum_knight:40,hum_long:20};P.hp=null;t.vitals()};
 {Kit.world({encCool:0});strong();P.fac=null;const s=A.find(x=>x.guards>0),f0=s.realm,r0=P.renown;P.x=s.x+10;P.y=s.y+12;G.site=s;G.mode='site';t.showSite();
  ok(/Attack its guards/.test(Kit.panel()),'its page: whose it is and Attack its guards');
  t.act('site-attack');ok(G.enc&&G.enc.kind==='standard'&&G.enc.ref===s&&G.enc.list.length===s.guards&&t.hostileTo(f0),'attacking it: its guards to fight, and its realm hostile to you');
  t.act('auto');ok(s.guards===0&&s.taking&&s.taking.h===0,'its guards beaten: your banner begins to go up');
  G.mode='world';G.modal=false;t.hidePanel();for(let i=0;i<S.hold;i++)t.Standards.hour();
  ok(s.choose&&!s.taking&&G.mode==='site'&&G.site===s&&/Hand it to the/.test(Kit.panel())&&!s.nearRealms().some(([k])=>k===f0),'after '+S.hold+' hours by it, the realms near it to hand it to (not the one you took it from)');
  const to=s.nearRealms()[0][0],r1=P.renown;t.act('site-hand',to);ok(s.realm===to&&!s.choose&&s.guards===1&&P.renown===r1+S.renown&&r1>r0,'handed to the '+t.FACS[to].n+': its banner theirs, a guard of theirs, renown +'+S.renown);
  s.day();ok(s.guards===2,'its guards back a day while its realm holds it')}
 // ---- for the realm you serve; and walking off breaks it off
 {Kit.world({encCool:0});strong();const s=A.find(x=>x.realm&&x.realm!=='karn'&&x.guards>0&&!x.choose);P.fac='karn';s.guards=0;P.x=s.x;P.y=s.y+12;G.site=s;G.mode='site';t.showSite();
  ok(/Raise your banner/.test(Kit.panel()),'no guards left: Raise your banner');t.act('site-attack');ok(s.taking,'your banner goes up at once');
  P.x=s.x+S.r*4;t.Standards.hour();ok(!s.taking&&s.realm!=='karn','walk well off and it is broken off');
  P.x=s.x;t.act('site-attack');for(let i=0;i<S.hold;i++)t.Standards.hour();ok(s.realm==='karn'&&!s.choose,'stay by it: it flies the colours of the realm you serve');
  G.site=s;t.showSite();ok(!/Attack its guards|Raise your banner/.test(Kit.panel()),'and yours to keep: no attack on it');P.fac=null}
 // ---- edge cases: names, their tiles kept from building, a fallen realm's, a fight fought out on the field
 {const names=all().map(s=>s.name);ok(new Set(names).size===names.length,'every standard its own name');
  ok(all().every(s=>s.tiles().every(([x,y])=>t.occAt(x,y)!==0)),'its tiles (plinth, front, tower) kept from every holding\'s building');
  const s=all().find(x=>t.FACS[x.realm]&&x.realm!=='player'&&x.realm!=='karn'),f=s.realm;W.dead[f]=true;try{s.day();ok(!s.realm&&s.guards===0,'its realm fallen, it is no one\'s')}finally{delete W.dead[f];s.owner=f;s.guards=S.guards[s.lv]}}
 {Kit.world({encCool:0});strong();P.fac=null;const s=all().find(x=>x.guards>0&&x.realm&&x.realm!=='player'&&!x.choose&&!x.taking);P.x=s.x+10;P.y=s.y+12;G.site=s;G.mode='site';t.showSite();t.act('site-attack');
  t.startBattle({enemies:G.enc.list,tournament:false});const B=t.B,foes=B.units.filter(u=>u.team===1),fl=foes.map(u=>t.battleFlag(u)).find(Boolean);
  ok(foes.length===G.enc.list.length&&fl&&fl.col===s.col(),'fought out on the field: its guards there under its realm\'s banner');
  B.win=true;B.over=true;foes.forEach(u=>u.hp=0);t.finishBattle();ok(s.taking&&s.guards===0,'and won there, your banner begins to go up');G.mode='world';t.hidePanel();s.taking=null;s.guards=S.guards[s.lv]}
 // ---- through a save
 {const rec=all().map(s=>[s.name,s.realm,s.lv,s.guards].join());t.saveGame(true,'quick');W.sites=[];t.loadGame('quick');
  ok(all().length===A.length&&all().map(s=>[s.name,s.realm,s.lv,s.guards].join()).join('|')===rec.join('|')&&all().every(s=>s instanceof t.Standard),'a save keeps every standard, whose it is, its level and its guards')}
});
