'use strict';
// The developer tools' quick controls (ui/developer.js DEV_TOOLS, DEV_QUICK; the owner, 2026-11-17: "Can you make dev console more
// friendly for dev? Less text and provide just a simplify control. Remove any redundant or create a combination of useful commands like
// disable all needs"): groups of one-tap buttons, each a command; a toggle lit while on; no needs over a whole day (no food eaten,
// no water drunk, no wages, no stamina drain, the harsh land's toll none); heal, level, supplies, troops, reveal, fog, a day on,
// bandits near; a short help; the bottom bar (Back, Close) and Esc following it; the minimap's marks small.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,D=t.DevConsole,C=t.CHEAT;
 Kit.begin('soldier',1);Kit.world();G.mode='world';G.modal=false;
 try{
  // ---- the panel: its groups and buttons, each a command
  D.show();const R=D.root,btn=R.querySelectorAll('[data-dev-quick]'),groups=[...R.querySelectorAll('.dev-group h3')].map(h=>h.textContent);
  ok(groups.join()==='Cheats,Give,World,Look,Go to'&&btn.length===t.DEV_TOOLS.reduce((a,g)=>a+g[1].length,0),'the tools in groups ('+groups.join(', ')+'), '+btn.length+' one-tap buttons');
  ok(R.querySelector('[data-dev-command]')&&R.querySelector('[data-dev-nav] [data-nav="close"]')&&!R.querySelector('[data-dev-nav] [data-nav="back"]'),'a command line under them; the bottom bar Close (no Back on the tools)');
  ok(D.help.split('\n').length<=7&&D.help.length<900,'help short: '+D.help.split('\n').length+' lines, '+D.help.length+' characters');
  // (a toggle: lit while on, off again on a second tap)
  const nn=[...btn].find(b=>b.textContent==='No needs');nn.click();const lit=R.querySelector('[data-dev-quick="0,0"]').getAttribute('aria-pressed');
  ok(C.noNeeds&&lit==='true','No needs: one tap on, its button lit');R.querySelector('[data-dev-quick="0,0"]').click();ok(!C.noNeeds&&R.querySelector('[data-dev-quick="0,0"]').getAttribute('aria-pressed')==='false','a second tap off');
  // (the realm economy, out of Settings: one button that names its mode, each tap the next, and the command econ)
  {const m0=t.ECON.mode,eb=()=>[...R.querySelectorAll('[data-dev-quick]')].find(b=>/^Economy: /.test(b.textContent)),seen=[];
   for(let i=0;i<3;i++){const b=eb();seen.push(b.textContent.slice(9));b.click()}
   ok(seen.length===3&&new Set(seen).size===3&&t.ECON.mode===m0&&eb().textContent==='Economy: '+t.ECON_MODES[m0][0],'the realm economy a tool: its button names the mode, a tap each the next ('+seen.join(' → ')+'), back to '+t.ECON_MODES[m0][0]);
   D.execute('econ light');const l=t.ECON.mode;D.execute('econ '+m0);ok(l==='light'&&t.ECON.mode===m0,'econ light sets it, econ '+m0+' back')}
  // ---- no needs over a whole day: no food, water, wages or stamina spent
  {P.troops={militia:12};if(typeof P.changed==='function')P.changed();P.gold=500;t.BAND.hungry=0;t.BAND.dry=0;P.bsta=60;D.execute('supplies');
   const gold=P.gold,food=t.foodN(),water=t.goodN('water');D.execute('noNeeds on');D.execute('day');
   ok(P.gold===gold&&t.foodN()===food&&t.goodN('water')===water&&!t.BAND.hungry&&!t.BAND.dry&&P.bsta>=60,'no needs, a day on: no wages ('+gold+' gold, '+P.gold+' after), no food or water spent ('+food+'/'+water+'), never hungry or thirsty, stamina '+P.bsta);
   D.execute('noNeeds off');const g1=P.gold;D.execute('day');ok(P.gold<g1,'needs back: the wages paid again ('+g1+' → '+P.gold+')')}
  // ---- give: gold, supplies, heal, level, troops
  {const g=P.gold;D.execute('money 1000');ok(P.gold===g+1000,'+1000 gold');
   const f=t.foodN();D.execute('supplies');ok(t.foodN()>f,'food and water given ('+f+' → '+t.foodN()+' food)');
   P.hp=1;P.bsta=10;P.wounded={militia:3};t.BAND.sick={militia:{fever:1}};const n=P.troops.militia||0;D.execute('heal');
   ok(P.hp>1&&P.bsta===100&&!Object.keys(P.wounded).length&&P.troops.militia===n+3&&!Object.keys(t.BAND.sick).length,'heal all: health ('+P.hp+') and stamina full, the 3 wounded back in the ranks, none sick');
   const h=t.leaderOf(P),lv=h.lv;D.execute('level');D.execute('level 2');ok(h.lv===lv+3,'level up: '+lv+' → '+h.lv);
   const before=Object.values(P.troops).reduce((a,b)=>a+b,0);D.execute('troops');D.execute('troops hum_spear 5');ok(Object.values(P.troops).reduce((a,b)=>a+b,0)===before+15&&P.troops.hum_spear>=5,'troops: 10 of your basic kind, then 5 spearmen');
   let bad=false;try{D.execute('troops nosuch 3')}catch(e){bad=true}ok(bad,'an unknown troop is refused')}
  // ---- the world: reveal, fog, a day on, bandits near
  {D.execute('reveal');const S=t.seenArr();ok(S.every(v=>v===1),'reveal: the whole map known');
   D.execute('fog off');ok(C.noFog&&!t.VIEW_SEEN.on,'fog off: the map drawn whole');D.execute('fog on');ok(!C.noFog&&t.VIEW_SEEN.on,'fog on again');
   const d=G.day;D.execute('day 2');ok(G.day===d+2,'two days on ('+d+' → '+G.day+')');
   const n=t.bandits.length;D.execute('bandits');const b=t.bandits[n];ok(t.bandits.length===n+1&&b&&Math.hypot(b.x-P.x,b.y-P.y)<=t.DEV_QUICK.near+2,'a band near you ('+(b?Math.round(Math.hypot(b.x-P.x,b.y-P.y)):'none')+' px)');t.bandits.length=n}
  // ---- go to a holding from its list
  {const sel=R.querySelector('[data-dev-goto]'),town=t.TOWNS[t.TOWNS.length-1];sel.value=town.name;R.querySelector('[data-dev-go]').click();ok(Math.hypot(P.x-town.x,P.y-town.y)<=t.TILE*8,'go to: picked from the list, there ('+town.name+')')}
  // ---- the bottom bar and Esc: Back to the tools from the battle test, Close from the tools
  {D.show('battle');const back=R.querySelector('[data-dev-nav] [data-nav="back"]');ok(!!back,'the battle test: Back on the left, Close on the right');
   window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));ok(D.opened&&D.tab==='console','Esc there goes back to the tools');
   window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));ok(!D.opened,'Esc on the tools closes them')}
  // ---- the minimap's marks small (render.js MINIMAP icon, iconMin)
  ok(t.MINIMAP.icon<=.3&&t.MINIMAP.iconMin<=3&&t.FULLMAP.icon.city*t.MINIMAP.icon<9,'the minimap\'s marks small: a city '+(t.FULLMAP.icon.city*t.MINIMAP.icon).toFixed(1)+' px of a 112 px map (was 12.6), a place '+(t.FULLMAP.icon.site*t.MINIMAP.icon).toFixed(1));
 }finally{C.noNeeds=false;C.speed=1;C.noFog=false;t.VIEW_SEEN.on=true;if(D.opened)D.close()}
});
