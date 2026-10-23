'use strict';
// Main menu (ui/mainmenu.js): New Campaign, Continue, Load game, Settings, Quit, then Wiki; the Game Menu (ui/hub.js: Esc, Tab, the
// bar's Menu) with Resume, Save and Load, Settings (the title's page), and Main menu and Exit, which ask first when play has moved on
// since the last save; its Main menu lets the world go; deleting the save asks twice.
// Pasts decide the starting weapon and a lean purse; early loot is lean too.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),close0=window.close;let closeCalls=0;
// CDP-created test tabs may actually close themselves. Check the request without destroying the reporting page.
window.close=()=>{closeCalls++};
try{
 const t=T,G=t.G,P=t.P;try{localStorage.clear()}catch(e){}
 const panel=()=>document.getElementById('panel').innerHTML,cards=()=>[...document.querySelectorAll('#panel .card strong')].map(e=>e.textContent),sysb=()=>[...document.querySelectorAll('#panel .gm-sys-btn')].map(b=>b.querySelector('strong').textContent+(b.disabled?' (off)':'')),
  navs=()=>[...document.querySelectorAll('#panel .nav [data-nav]')].map(b=>b.dataset.nav+':'+b.textContent).join(),page=()=>G.esc&&G.esc.page;
 const mm=document.getElementById('mainmenu'),btns=()=>[...mm.querySelectorAll('.mm-btn')].map(b=>b.textContent+(b.disabled?' (off)':'')),cont=()=>mm.querySelector('[data-mm="continue"]');
 t.showTitle();ok(G.mode==='title'&&!mm.hidden&&document.getElementById('ov').hidden&&btns().join()==='New Campaign,Continue (off),Load game,Settings,Quit','the main menu, no window over it: '+btns().join(', '));
 ok([...mm.querySelectorAll('.mm-more button')].map(b=>b.textContent).join()==='Wiki'&&/Ashmark/.test(mm.querySelector('.mm-title canvas').getAttribute('aria-label')),'under the buttons Wiki; the title drawn, named for readers');
 mm.querySelector('[data-mm="new"]').click();ok(G.menu==='new'&&mm.dataset.page==='new','New Campaign opens the New game page over the scene');t.act('menu','main');
 // new game
 t.act('menu','new');ok(G.menu==='new'&&document.querySelectorAll('[data-act="begin"]').length===7&&document.querySelectorAll('[data-act="race"]').length===4,'New game: four races and seven pasts');
 t.act('race','dwarf');ok(G.menu==='new'&&document.querySelector('[data-act="race"].on').dataset.arg==='dwarf','picking a race stays on the New game screen');
 t.act('menu','main');t.act('menu','new');t.act('race','human');t.act('begin','hedge');ok(G.mode==='world'&&P.gear.weapon===t.gearId('staff',0)&&P.gold===40,'the Hedge mage starts with a wooden staff and 40 gold');
 ok(Object.values(t.BGS).every(b=>b.gold<=110),'every past starts poor: '+Object.values(t.BGS).map(b=>b.n+' '+b.gold+'g').join(', '));
 // the bar's Menu button: the Game Menu; Main menu in a game never saved asks first
 G.mode='world';G.modal=false;t.hidePanel();document.getElementById('menuBtn').click();ok(G.mode==='esc'&&page()==='menu'&&/Paused/.test(panel()),'the bar’s Menu button opens the Game Menu');
 t.act('esc-main');ok(G.mode==='esc'&&page()==='leave'&&/Unsaved progress since you began will be lost/.test(Kit.text())&&cards().join()==='Save first,Leave anyway'&&navs()==='back:Cancel','Main menu, never saved: it asks first ('+cards().join(', ')+'; '+navs()+')');
 t.act('esc-back');ok(G.mode==='esc'&&page()==='menu','Cancel: back to the menu');
 t.act('esc-main');t.act('esc-leave','main');ok(G.mode==='title'&&!mm.hidden&&!btns().includes('Resume'),'Leave anyway: the main menu, which offers no Resume: '+btns().join(', '));
 ok(!t.WM&&!t.TOWNS.length&&!t.CAMP_SPOTS.length,'and the world is let go: no map, holdings or camps in');t.act('begin','hedge');G.quietEvents=true;ok(!!t.WM&&t.TOWNS.length>0&&G.mode==='world','a new game makes it again');
 G.mode='world';G.modal=false;t.hidePanel();
 // Esc: close what is open, else pause with the Esc menu
 const esc=()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));
 esc();ok(G.mode==='esc'&&sysb().map(n=>n.replace(' (off)','')).join()==='Save game,Load game,Settings,Main menu,Exit game'&&!sysb()[0].includes('(off)')&&navs()==='close:Resume','Esc on the map opens the Game Menu: '+sysb().join(', ')+'; its bar '+navs());
 {const h=document.querySelector('#panel .fb-head'),s=t.WM.settings,cp=h&&h.querySelector('[data-act="esc-seed"]'),x=h?h.textContent:'';
  ok(h&&/Paused/.test(x)&&x.includes('Day '+G.day)&&x.includes(t.worldName(t.WM))&&x.includes(t.worldKind(s))&&(s.seed?x.includes(s.seed)&&!!cp:!cp)&&!!h.querySelector('[data-act="esc-wpage"]'),'its header: Paused, the day, the world, its seed with Copy seed, and World ('+x+')');
  if(cp){cp.click();ok(G.mode==='esc','Copy seed keeps the menu open')}}
 // the game paused while it is open: the loop runs no world (frames stepped by hand, none scheduled)
 {const raf=window.requestAnimationFrame,p0=G.paused,step=n=>{for(let i=0;i<n;i++)t.loop(performance.now()+1000*(i+1))};window.requestAnimationFrame=()=>0;G.paused=false;
  try{const c0=G.clock,d0=G.day;step(10);ok(G.mode==='esc'&&G.clock===c0&&G.day===d0,'the clock stands still while the menu is open');
   esc();ok(G.mode==='world'&&!G.modal,'Esc again resumes');const c1=G.clock;step(4);ok(G.clock!==c1,'and the clock runs again ('+c1+' → '+G.clock+')')}
  finally{window.requestAnimationFrame=raf;(0,eval)('last=performance.now()');G.paused=p0;G.mode='world';G.modal=false;G.enc=null;t.hidePanel()}}
 // the pages step Back to the menu, Esc with them
 esc();t.act('esc-wpage');ok(page()==='world'&&navs()==='back:Back,close:Resume','the World page: Back, Resume');esc();ok(G.mode==='esc'&&page()==='menu','Esc on it: back to the menu');
 t.act('esc-saves');ok(page()==='save'&&/Slot 1/.test(panel()),'Save game: the slots');esc();ok(G.mode==='esc'&&page()==='menu','Esc on them: back to the menu');esc();ok(G.mode==='world','Esc on the menu: resumed');
 // Settings: the title's own page, its Back to the menu; a change is kept as on the title
 {const tmp=document.createElement('div');tmp.innerHTML=t.settingsPage();const labs=e=>[...e.querySelectorAll('.lab')].map(x=>x.textContent).join('|');
  esc();t.act('esc-settings');const pn=document.getElementById('panel');
  ok(G.mode==='esc'&&page()==='settings'&&labs(pn)===labs(tmp)&&/Realm economy/.test(labs(pn))&&/Sound/.test(labs(pn))&&/Developer tools/.test(labs(pn))&&navs()==='back:Back,close:Resume','Settings from the menu: the title’s page ('+labs(pn).split('|').length+' settings), Back and Resume');
  const g0=t.prefGet('guide');t.act('guide',g0?'off':'on');const on=q=>document.querySelector('#panel [data-act="guide"][data-arg="'+q+'"]');
  ok(page()==='settings'&&t.prefGet('guide')===!g0&&localStorage.getItem('ashmark.guide')===(g0?'0':'1')&&on(g0?'off':'on').classList.contains('on'),'a setting changed in game: the page redrawn, the setting stored (ashmark.guide '+localStorage.getItem('ashmark.guide')+')');
  esc();ok(G.mode==='esc'&&page()==='menu','Esc: back to the menu');t.act('esc-settings');ok(on(g0?'off':'on').classList.contains('on'),'opened again: the change kept');t.act('guide',g0?'on':'off');t.act('esc-resume');ok(G.mode==='world','Resume from Settings: back to the map')}
 esc();t.act('esc-save');ok(t.readSave()&&/Game saved/.test(panel())&&G.mode==='esc','Save game from the Game Menu');
 // right after a save nothing is lost; once play moves on, Main menu and Exit ask, naming the day of the last save
 ok(t.unsavedSince()===false,'right after a save: nothing unsaved');P.gold+=5;ok(t.unsavedSince()===G.day,'play moved on (gold): unsaved since day '+G.day);
 t.act('esc-exit');ok(page()==='leave'&&Kit.text().includes('Unsaved progress since day '+G.day+' will be lost.')&&/Exit game/.test(Kit.text())&&closeCalls===0,'Exit game asks first: '+(document.querySelector('#panel .gm-lose')||{}).textContent);
 esc();ok(G.mode==='esc'&&page()==='menu','Esc on the question: Cancel, back to the menu');P.gold-=5;ok(t.unsavedSince()===false,'(as saved again: nothing to lose)');esc();
 {const L=t.LOADING,sy=L.sync,si=Storage.prototype.setItem;L.sync=true;Storage.prototype.setItem=function(){throw new Error('QuotaExceededError')};
  try{esc();t.act('esc-save');ok(/Could not save/.test(panel())&&!/Game saved/.test(panel()),'a save the browser will not keep: the menu says it could not save, never "Game saved"')}finally{Storage.prototype.setItem=si;L.sync=sy}esc()}
 t.openInv();esc();ok(G.mode==='esc'&&page()==='menu','Esc on the inventory: its Back, the Game Menu');esc();t.openChar();esc();ok(G.mode==='esc'&&page()==='menu','Esc on the Army window: its Back, the Game Menu');esc();t.openSkills();esc();ok(G.mode==='char','Esc on the Skills view follows its Back: the Army window');t.act('char-close');
 t.enterTown(t.townBy('Ashford'));esc();ok(G.mode==='world','Esc leaves a town');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 // in an encounter Esc pauses and Resume brings the same choice back
 G.mode='world';G.modal=false;t.hidePanel();t.startEncounter({kind:'party',ref:t.asParty({x:P.x,y:P.y,cool:0,troops:['militia','militia','militia']}),n:3,list:['militia','militia','militia']});const encHtml=panel();
 esc();ok(G.mode==='esc'&&/Not during a battle|Finish what/.test(panel()),'an encounter cannot be saved over');esc();ok(G.mode==='dialog'&&panel()===encHtml,'Resume brings back the same encounter screen');
 // Esc closes each window that can be closed, one press at a time; only then does it pause
 {const enc=G.enc,world=()=>{G.mode='world';G.modal=false;G.enc=null;t.hidePanel();G.encCool=0},tw=t.townBy('Ashford');world();
  const l=W.lords.find(x=>!x.dead&&!t.hostileTo(x.fac));if(l){t.lordMeet(l);esc();ok(G.mode==='world'&&!G.modal,'Esc leaves a lord you met')}
  const c=t.asParty({cv:true,fac:tw.owner,from:tw.name,to:t.TOWNS[1].name,x:P.x,y:P.y,goods:{grain:5},guards:3,cool:0,dir:1});W.caravans.push(c);world();c.meet();esc();ok(G.mode==='world'&&!G.cv,'Esc leaves a caravan');W.caravans=W.caravans.filter(x=>x!==c);
  world();t.notice('A notice','Something happened.');esc();ok(G.mode==='world'&&!G.modal,'Esc closes a notice');
  world();G.enc={kind:'party',ref:{x:P.x,y:P.y,cool:0},list:['militia']};t.concludeEncounter(true,{},1,true,['militia']);if(G.loot){G.loot.pile=[];t.renderLoot()}ok(/Victory/.test(panel()),'(a victory screen, nothing left on the ground)');esc();
  while(G.mode==='perk')t.act('perk',G.perkOffer[0]);ok(G.mode==='world'&&!G.modal,'Esc continues past a victory screen');
  esc();ok(G.mode==='esc','with nothing left open, Esc pauses');esc();ok(G.mode==='world','and Esc resumes');
  world();G.enc=enc;t.startEncounter({kind:'party',ref:t.asParty({x:P.x,y:P.y,cool:0,troops:['militia','militia','militia']}),n:3,list:['militia','militia','militia']})}
 // in battle Esc pauses the fight
 t.act('fight');const B=t.B,bt=B.t;esc();ok(G.mode==='esc'&&/in battle/.test(panel())&&sysb().includes('Save game (off)')&&/Not during a battle/.test(document.querySelector('#panel [data-act="esc-saves"]').textContent),'Esc in battle: the Game Menu, Save greyed (Not during a battle)');
 {const ts=[...document.querySelectorAll('#panel .gm-tile')];ok(ts.length===6&&ts.every(b=>b.disabled&&/Not during a battle/.test(b.textContent)),'in battle every tile greyed: Not during a battle');t.act('esc-go','journal');ok(G.mode==='esc','(a greyed tile opens nothing)');
  t.act('esc-settings');ok(page()==='settings'&&/Realm economy/.test(panel()),'Settings in battle');esc();ok(page()==='menu','and Back')}
 for(let i=0;i<5;i++){if(G.mode==='battle')t.updateBattle(.05)}ok(B.t===bt,'the battle does not move while paused');t.frame();esc();ok(G.mode==='battle'&&!G.modal,'Esc resumes the battle');Kit.key('Tab','Tab');ok(G.mode==='esc'&&G.esc.mode==='battle','Tab in battle: the Game Menu too');esc();ok(G.mode==='battle','(resumed)');
 B.over=true;B.endT=0;t.updateBattle(.01);t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 // Load and Exit from the Esc menu
 esc();const g2=P.gold;P.gold=1;t.act('esc-load');ok(G.mode==='world'&&P.gold!==1,'Load game from the Game Menu');esc();t.act('esc-exit');ok(G.mode==='title'&&/Thanks for playing/.test(panel())&&closeCalls===1,'Exit game right after a load: no question, the tab asked to close');
 // in the menus Esc goes back
 t.act('menu','main');t.act('menu','settings');esc();ok(G.menu==='main','Esc in a menu page goes back to the main menu');
 // continue and load
 t.saveGame();t.showTitle();ok(!cont().disabled&&/hedge mage/i.test(cont().title),'with a save, Continue is open, the save named on it: '+cont().title);const g0=t.readSave().P.gold;P.gold=999;t.act('load');ok(G.mode==='world'&&P.gold===g0,'Continue loads it');
 t.showTitle('load');ok(/Autosave/.test(panel())&&/Quick save/.test(panel())&&/Slot 5/.test(panel())&&/Day \d+/.test(panel()),'Load game lists the save slots, the saved game in its own');
 t.act('wipe-ask','auto');ok(t.readSave()&&/Delete\?/.test(panel()),'deleting asks for a second click');t.act('wipe','auto');ok(!t.readSlot('auto')&&G.mode==='title','and then deletes that save (the others stay)');
 // settings, wiki, exit
 t.act('menu','settings');ok(/Realm economy/.test(panel())&&!/Pack sprites/.test(panel())&&/Controls/.test(panel())&&/Back/.test(panel()),'Settings: realm economy and controls, no art switch');
 let opened=null;const wo=window.open;window.open=(u)=>{opened=u;return null};t.act('menu','wiki');window.open=wo;ok(opened==='wiki.html','Wiki opens the wiki in a new tab');
 t.act('menu','exit');ok(/Thanks for playing/.test(panel())&&closeCalls===2,'Exit requests tab closure and says goodbye');t.act('menu','main');ok(G.menu==='main','and Back returns to the menu');
 // lean loot: a band of 8 gives far less than it used to
 t.act('menu','new');t.act('begin','soldier');P.troops={hum_knight:20};let gold=0;for(let k=0;k<6;k++){G.mode='world';G.modal=false;t.hidePanel();const g1=P.gold;t.startEncounter({kind:'party',ref:t.asParty({x:P.x,y:P.y,cool:0,troops:Array(8).fill('militia')}),n:8,list:Array(8).fill('militia')});t.autoResolve();gold+=P.gold-g1;t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0])}
 ok(gold/6<45,'beating 8 bandits pays about '+Math.round(gold/6)+' gold (it used to be about 90)');
 t.frame();
 // save slots: five of your own (from the menu), a quick save (F6), the autosave; Continue loads the latest
 {try{localStorage.clear()}catch(e){}t.act('begin','soldier');G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();
  const press=k=>window.dispatchEvent(new KeyboardEvent('keydown',{key:k,code:k==='Escape'?'Escape':k}));
  P.gold=111;press('F6');ok(t.readSlot('quick')&&t.readSlot('quick').P.gold===111,'F6: a quick save');
  press('Escape');t.act('esc-saves');ok(/Save game/.test(panel())&&/Slot 1/.test(panel())&&/empty/.test(panel()),'the menu\u2019s Save game lists the slots');
  P.gold=222;t.act('esc-save','2');ok(t.readSlot('2')&&t.readSlot('2').P.gold===222&&/Game saved \(Slot 2\)/.test(panel()),'saved to slot 2');
  P.gold=333;t.act('esc-save','2');ok(t.readSlot('2').P.gold===222&&/click again to overwrite/.test(panel()),'a slot in use asks a second click before it is overwritten');
  t.act('esc-save','2');ok(t.readSlot('2').P.gold===333,'and then overwrites it');
  t.act('esc-back');t.act('esc-resume');P.gold=1;t.act('load','quick');ok(P.gold===111,'loading a slot loads that one');
  G.mode='world';t.saveGame(true,'4');P.gold=2;t.showTitle();t.act('load');ok(P.gold===111,'Continue loads the latest save of all (slot 4)');
  t.showTitle('load');ok(panel().match(/data-act="load"/g).length>=4,'Load game: every slot in use, ready to load')}
 // Save first: a quick save, then away
 {t.act('load','quick');G.quietEvents=true;P.gold=444;esc();t.act('esc-main');ok(page()==='leave'&&/since day/.test(Kit.text()),'Main menu after play moved on: asked');
  t.act('esc-leave','main:save');ok(G.mode==='title'&&t.readSlot('quick').P.gold===444,'Save first: quick saved (444 gold), then the main menu')}
 // save rows keep their icon and full metadata inside the button, independent of inventory slots
 {const key=t.slotKey('quick'),raw=localStorage.getItem(key),d=JSON.parse(raw);
  try{d.world.map.settings={...d.world.map.settings,preset:'normal',seed:'north<em>and&stone</em>-a-very-long-world-name'};
   localStorage.setItem(key,JSON.stringify(d));
   const fits=()=>{const rows=[...document.querySelectorAll('#panel .save-slot')],inside=(r,b)=>r.left>=b.left-.5&&r.right<=b.right+.5&&r.top>=b.top-.5&&r.bottom<=b.bottom+.5;
    return rows.length>0&&rows.every(e=>{const b=e.getBoundingClientRect(),mi=e.querySelector('.mi').getBoundingClientRect(),mt=e.querySelector('.mt').getBoundingClientRect();return !e.classList.contains('slot')&&inside(mi,b)&&inside(mt,b)&&mi.right<=mt.left+1&&e.scrollWidth<=e.clientWidth+1&&getComputedStyle(e.querySelector('.mt span')).display!=='none'})};
   for(const mode of ['title','save','esc']){t.showPanel('<div class="top"><h2>Slots</h2></div><div class="slots">'+t.slotRows(mode)+'</div>'+t.nav(['menu','main','Back']));
    ok(fits(),mode+': save rows contain their icon, label and wrapped metadata (no inventory-slot layout)');
    const list=document.querySelector('#panel .slots');list.scrollTop=list.scrollHeight;
    ok(list.lastElementChild.getBoundingClientRect().bottom<=list.getBoundingClientRect().bottom+1&&document.querySelector('#panel .nav').getBoundingClientRect().top>=list.getBoundingClientRect().bottom-1,mode+': the last row scrolls into view above the fixed navigation');
    const line=document.querySelector('#panel .save-slot[data-arg="quick"] .mt>span');
    ok(line&&line.textContent===t.saveLine(d)&&!line.querySelector('em'),mode+': a seed containing markup and ampersands remains literal text')}
  }finally{localStorage.setItem(key,raw)}}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{window.close=close0}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
