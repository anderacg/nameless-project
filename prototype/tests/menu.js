'use strict';
// Main menu (ui/mainmenu.js): New Campaign, Continue, Settings, Quit, then Load game and Wiki; the HUD Menu button with Resume; the
// Esc menu's Main menu lets the world go; deleting the save asks twice.
// Pasts decide the starting weapon and a lean purse; early loot is lean too.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),close0=window.close;let closeCalls=0;
// CDP-created test tabs may actually close themselves. Check the request without destroying the reporting page.
window.close=()=>{closeCalls++};
try{
 const t=T,G=t.G,P=t.P;try{localStorage.clear()}catch(e){}
 const panel=()=>document.getElementById('panel').innerHTML,cards=()=>[...document.querySelectorAll('#panel .card strong')].map(e=>e.textContent);
 const mm=document.getElementById('mainmenu'),btns=()=>[...mm.querySelectorAll('.mm-btn')].map(b=>b.textContent+(b.disabled?' (off)':'')),cont=()=>mm.querySelector('[data-mm="continue"]');
 t.showTitle();ok(G.mode==='title'&&!mm.hidden&&document.getElementById('ov').hidden&&btns().join()==='New Campaign,Continue (off),Settings,Quit','the main menu, no window over it: '+btns().join(', '));
 ok([...mm.querySelectorAll('.mm-more button')].map(b=>b.textContent).join()==='Load game,Wiki'&&/Ashmark/.test(mm.querySelector('.mm-title canvas').getAttribute('aria-label')),'under the buttons Load game and Wiki; the title drawn, named for readers');
 mm.querySelector('[data-mm="new"]').click();ok(G.menu==='new'&&mm.dataset.page==='new','New Campaign opens the New game page over the scene');t.act('menu','main');
 // new game
 t.act('menu','new');ok(G.menu==='new'&&document.querySelectorAll('[data-act="begin"]').length===7&&document.querySelectorAll('[data-act="race"]').length===4,'New game: four races and seven pasts');
 t.act('race','dwarf');ok(G.menu==='new'&&document.querySelector('[data-act="race"].on').dataset.arg==='dwarf','picking a race stays on the New game screen');
 t.act('menu','main');t.act('menu','new');t.act('race','human');t.act('begin','hedge');ok(G.mode==='world'&&P.gear.weapon===t.gearId('staff',0)&&P.gold===40,'the Hedge mage starts with a wooden staff and 40 gold');
 ok(Object.values(t.BGS).every(b=>b.gold<=110),'every past starts poor: '+Object.values(t.BGS).map(b=>b.n+' '+b.gold+'g').join(', '));
 // the HUD Menu button: resume where you were
 G.mode='world';G.modal=false;t.hidePanel();document.getElementById('menuBtn').click();ok(G.mode==='esc'&&/Paused/.test(panel()),'the HUD Menu button opens the Esc menu');
 t.act('esc-main');ok(G.mode==='title'&&!mm.hidden&&!btns().includes('Resume'),'the main menu offers no Resume: '+btns().join(', '));
 ok(!t.WM&&!t.TOWNS.length&&!t.CAMP_SPOTS.length,'and the world is let go: no map, holdings or camps in');t.act('begin','hedge');G.quietEvents=true;ok(!!t.WM&&t.TOWNS.length>0&&G.mode==='world','a new game makes it again');
 G.mode='world';G.modal=false;t.hidePanel();
 // Esc: close what is open, else pause with the Esc menu
 const esc=()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));
 esc();ok(G.mode==='esc'&&['Save game','Load game','Main menu','Exit game'].every(n=>cards().includes(n))&&/Resume/.test(document.querySelector('.nav [data-nav="close"]').textContent),'Esc on the map opens the Esc menu, Resume in its bottom bar: '+cards().join(', '));
 {const w=document.querySelector('#panel .esc-world'),s=t.WM.settings,cp=w&&w.querySelector('[data-act="esc-seed"]');
  ok(w&&/Classic/.test(w.textContent)&&(s?w.textContent.includes(s.seed)&&!!cp:!cp),'the Esc menu names the world and its seed, a Copy button by the seed ('+(w&&w.textContent)+')');
  if(cp){cp.click();ok(G.mode==='esc','Copy seed keeps the menu open')}}
 const day=G.day,clk=G.clock;t.loop&&0;esc();ok(G.mode==='world'&&!G.modal,'Esc again resumes');
 esc();t.act('esc-save');ok(t.readSave()&&/Game saved/.test(panel())&&G.mode==='esc','Save game from the Esc menu');esc();
 {const L=t.LOADING,sy=L.sync,si=Storage.prototype.setItem;L.sync=true;Storage.prototype.setItem=function(){throw new Error('QuotaExceededError')};
  try{esc();t.act('esc-save');ok(/Could not save/.test(panel())&&!/Game saved/.test(panel()),'a save the browser will not keep: the menu says it could not save, never "Game saved"')}finally{Storage.prototype.setItem=si;L.sync=sy}esc()}
 t.openInv();esc();ok(G.mode==='world','Esc closes the inventory');t.openChar();esc();ok(G.mode==='world','Esc closes the character screen');t.openSkills();esc();ok(G.mode==='world','Esc closes the Skills page');
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
 t.act('fight');const B=t.B,bt=B.t;esc();ok(G.mode==='esc'&&/in battle/.test(panel())&&/Not during a battle/.test(panel()),'Esc in battle pauses it; no saving mid-fight');
 for(let i=0;i<5;i++){if(G.mode==='battle')t.updateBattle(.05)}ok(B.t===bt,'the battle does not move while paused');t.frame();esc();ok(G.mode==='battle'&&!G.modal,'Esc resumes the battle');
 B.over=true;B.endT=0;t.updateBattle(.01);t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 // Load and Exit from the Esc menu
 esc();const g2=P.gold;P.gold=1;t.act('esc-load');ok(G.mode==='world'&&P.gold!==1,'Load game from the Esc menu');esc();t.act('esc-exit');ok(G.mode==='title'&&/Thanks for playing/.test(panel())&&closeCalls===1,'Exit game from the Esc menu requests tab closure');
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
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{window.close=close0}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
