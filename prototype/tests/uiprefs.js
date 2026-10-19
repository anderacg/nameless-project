'use strict';
// Settings (PREFS, ui.js): every setting reads its stored value, or its default, as it always did; a change writes the same
// storage key and value as before; blocked storage costs only the remembering. Town actions (townAct, town.js) still answer
// their names through act(): tabs, buying and selling, recruits and training, contracts, the broker, companions, the tournament.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),SP=Storage.prototype,gi=SP.getItem,si=SP.setItem;
try{
 const t=T,G=t.G,P=t.P;try{localStorage.clear()}catch(e){}
 const key=k=>localStorage.getItem('ashmark.'+k),panel=()=>document.getElementById('panel').innerHTML;
 // the readers as they were before the table (the stored text → the value), and the defaults
 const sp=[.5,1,2,5],OLD={grid:s=>s==='1',bspeed:s=>sp.includes(+s)?+s:1,hpbars:s=>s!=='0',blood:s=>s!=='0',guide:s=>s!=='0',bdeploy:s=>s!=='0',autoskills:s=>s!=='0',bauto:s=>s==='1',bfog:s=>s!=='0',opaths:s=>['all','sel','off'].includes(s)?s:'sel'};
 const DEF={grid:false,bspeed:1,hpbars:true,blood:true,guide:true,bdeploy:true,autoskills:true,bauto:false,bfog:true,opaths:'sel'};
 const VIEW={grid:['GRID','on'],bspeed:['BSPEED','v'],hpbars:['HPBARS','on'],blood:['BLOOD','on'],guide:['GUIDE','on'],bdeploy:['BDEPLOY','on'],autoskills:['AUTOSK','on'],bauto:['BAUTO','on'],bfog:['FOG','on']};
 ok(Object.keys(t.PREFS).sort().join()===[...Object.keys(OLD),'mute','volmaster','volmusic','volsfx','mapzoom'].sort().join(),'the ten settings (fog of war: battlefog.js; order paths: ui/orderpaths.js), the four of sound (audio.js) and the map zoom (tests/mapzoom.js) in one table: '+Object.keys(t.PREFS).join(', '));
 const inputs=[null,'1','0','','junk','2','0.5','.5','5','7','true'];
 for(const k in OLD){const bad=inputs.filter(s=>{if(s==null)localStorage.removeItem('ashmark.'+k);else localStorage.setItem('ashmark.'+k,s);return t.prefLoad(k)!==OLD[k](s)});
   ok(!bad.length&&t.PREFS[k].def===DEF[k],k+' reads ashmark.'+k+' as before (default '+DEF[k]+')'+(bad.length?': differs for '+bad.join('|'):''))}
 localStorage.clear();
 ok(Object.entries(VIEW).every(([k,[g,f]])=>t[g][f]===t.prefGet(k)),'the globals other files read are the settings: '+Object.values(VIEW).map(([g,f])=>g+'.'+f).join(', '));
 {const g0=t.GRID.on;t.GRID.on=!g0;ok(t.prefGet('grid')===!g0&&key('grid')===null,'setting GRID.on directly changes the setting for this session, stores nothing');t.GRID.on=g0}
 // the setters write the same key and value as before
 const SET={grid:'setGrid',blood:'setBlood',hpbars:'setHpBars',guide:'setGuide',bdeploy:'setDeploy',autoskills:'setAutoSkills'};
 for(const k in SET){const [g,f]=VIEW[k],bad=[];for(const v of [true,false,1,0,undefined,'x']){t[SET[k]](v);if(!(key(k)===(v?'1':'0')&&t[g][f]===!!v&&t.prefGet(k)===!!v))bad.push(String(v))}
   ok(!bad.length,SET[k]+' writes ashmark.'+k+' 1 or 0 and sets '+g+'.'+f+(bad.length?': wrong for '+bad.join('|'):''))}
 {const b=document.getElementById('hpBtn');t.setHpBars(false);const off=!b.classList.contains('on')&&b.getAttribute('aria-pressed')==='false';t.setHpBars(true);
  ok(off&&b.classList.contains('on')&&b.getAttribute('aria-pressed')==='true','the HP bars button follows its setting (its apply hook)')}
 t.setBattleSpeed(.5,true);ok(key('bspeed')==='0.5'&&t.BSPEED.v===.5,'setBattleSpeed(.5, save) writes ashmark.bspeed "0.5"');
 t.setBattleSpeed(2);ok(key('bspeed')==='0.5'&&t.BSPEED.v===.5,'without save it neither stores nor changes the setting');
 t.setBattleSpeed(3,true);ok(key('bspeed')==='0.5'&&t.BSPEED.v===.5,'a speed not offered is ignored');t.setBattleSpeed(1,true);ok(key('bspeed')==='1'&&t.BSPEED.v===1,'and back to 1');
 // the Settings buttons: one handler, the page redraws with the button on
 t.showTitle('settings');{const bad=[];
  for(const [a,arg,v] of [['grid','on',true],['grid','off',false],['blood','off',false],['blood','on',true],['hpbars','off',false],['hpbars','on',true],['bdeploy','off',false],['bdeploy','on',true],['guide','off',false],['guide','on',true],['bfog','off',false],['bfog','on',true],['opaths','all','all'],['opaths','off','off'],['opaths','sel','sel'],['bspeed','2',2],['bspeed','0.5',.5],['bspeed','1',1]]){
   t.act(a,arg);const b=document.querySelector('#panel [data-act="'+a+'"][data-arg="'+arg+'"]');
   if(!(t.prefGet(a)===v&&key(a)===(typeof v==='boolean'?(v?'1':'0'):String(v))&&G.menu==='settings'&&b&&b.classList.contains('on')))bad.push(a+' '+arg)}
  ok(!bad.length,'each Settings button sets, stores and shows its setting'+(bad.length?': wrong for '+bad.join(', '):''))}
 t.act('econmode','light');ok(t.ECON.mode==='light'&&localStorage.getItem('ashmark.econ')==='light'&&G.menu==='settings','the realm economy button still sets its mode');t.act('econmode','full');
 ok(t.settingAct('autoskills','on')===false&&t.settingAct('bauto','on')===false&&t.settingAct('tab','trade')===false,'actions that are no Settings button pass on');
 // storage blocked: the settings still change for this session; reading gives the defaults
 SP.setItem=function(){throw new Error('blocked')};SP.getItem=function(){throw new Error('blocked')};
 {let threw=null,blocked=false;try{localStorage.setItem('x','1')}catch(e){blocked=true}
  try{t.setGrid(true);t.setBlood(false);t.setBattleSpeed(5,true);t.showTitle('settings');t.act('guide','off');t.setAutoSkills(false)}catch(e){threw=e}
  ok(blocked&&!threw&&t.GRID.on===true&&t.BLOOD.on===false&&t.BSPEED.v===5&&t.GUIDE.on===false&&t.AUTOSK.on===false,'with storage blocked a setting still changes for this session'+(threw?': '+threw.message:''));
  ok(Object.keys(DEF).every(k=>t.prefLoad(k)===DEF[k]),'and reading blocked storage gives every default')}
 SP.setItem=si;SP.getItem=gi;t.setGrid(false);t.setBlood(true);t.setBattleSpeed(1,true);t.setGuide(true);t.setAutoSkills(true);
 // the AI in command (setAuto, in a battle) and Auto skills' message
 t.act('begin','soldier');G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();
 t.startEncounter({kind:'party',ref:t.asParty({x:P.x,y:P.y,cool:0,troops:['militia','militia','militia']}),n:3,list:['militia','militia','militia']});t.act('fight');
 {t.setAuto(true,true);const on=key('bauto')==='1'&&t.BAUTO.on===true;t.setAuto(false,true);ok(t.B&&on&&key('bauto')==='0'&&t.BAUTO.on===false,'setAuto writes ashmark.bauto 1 or 0 and sets BAUTO.on')}
 t.setAutoSkills(false);ok(G.msgs[G.msgs.length-1].m==='Auto skills off: your hero and companions use no skills.'&&key('autoskills')==='0','Auto skills in battle: stored and said');t.setAutoSkills(true);
 t.B.over=true;t.B.endT=0;t.updateBattle(.01);t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 // town actions through act(), each by its name
 t.act('begin','soldier');G.quietEvents=true;P.troops={};P.gold=5000;G.day=31;G.lastTown=null;
 const ash=t.townBy('Ashford'),last=()=>G.msgs[G.msgs.length-1].m;t.ensureEcon(ash);Object.assign(ash.stock,{iron:40,copper:10,tin:10,timber:40,grain:50,arrows:200});
 t.W.shops=t.W.shops||{};delete t.W.shops[ash.name];P.rep[ash.name]=90;ash.vol=5;
 {G.town=null;const g0=P.gold,n0=t.goodN('grain'),r=t.act('buy','grain:1');ok(r===undefined&&P.gold===g0&&t.goodN('grain')===n0,'outside a town a town action does nothing')}
 t.enterTown(ash);t.act('tab','trade');ok(G.mode==='town'&&G.town.tab==='trade'&&/data-act="buy"/.test(panel()),'tab: the trade tab');
 {const n0=t.goodN('grain'),g0=P.gold;t.act('qty','5');t.act('buy','grain:5');const f=document.activeElement;ok(t.goodN('grain')===n0+5&&P.gold<g0,'buy: 5 grain for '+(g0-P.gold)+'g');
  ok(f&&f.dataset.act==='buy'&&f.dataset.arg==='grain:5','the window redraws with the focus on the button pressed');
  const g1=P.gold;t.act('sell','grain:5');ok(t.goodN('grain')===n0&&P.gold>g1,'sell: 5 grain for '+(P.gold-g1)+'g')}
 {const gid=t.gearId(Object.keys(t.BASES)[0],0);t.invAdd('gear',gid,1);const i=P.inv.findIndex(x=>x&&x.k==='gear'&&x.id===gid),g=t.itemPrice(gid),g0=P.gold;t.act('sell-item',String(i));
  ok(P.gold===g0+g&&!P.inv[i]&&last()==='You sell the '+t.ITEMS[gid].n+' for '+g+' gold.','sell-item: '+last())}
 {const m=Object.keys(t.MATS)[0];t.invAdd('mat',m,2);const i=P.inv.findIndex(x=>x&&x.k==='mat'&&x.id===m),n=P.inv[i].n,g=t.matPrice(m)*n,g0=P.gold;t.act('sell-loot',String(i));
  ok(P.gold===g0+g&&!P.inv[i]&&last()==='You sell '+n+' '+t.MATS[m].n.toLowerCase()+(n>1?'s':'')+' for '+g+' gold.','sell-loot: '+last())}
 t.act('tab','smith');{const a0=t.goodN('arrows');t.act('buy-ammo','arrows:10');ok(t.goodN('arrows')===a0+10&&last()==='You buy 10 '+t.GOODS.arrows.n.toLowerCase()+'.','buy-ammo: '+last())}
 {const st=t.smithStock(ash),first=st[0],n0=st.length,c0=t.invCount('gear',first);t.act('buy-gear','0');ok(first&&st.length===n0-1&&t.invCount('gear',first)===c0+1&&last()==='You buy the '+t.ITEMS[first].n+'.','buy-gear: '+last())}
 t.act('tab','stable');{const id=t.stableStock(ash).find(k=>t.canBuyMount(ash,k));P.gear.mount=null;const g0=P.gold;t.act('buy-mount',id);
  ok(P.gear.mount===id&&P.gold===g0-t.gearPrice(id)&&last()==='You buy a '+t.ITEMS[id].n+' and ride it out of the stable.','buy-mount: '+last())}
 t.act('tab','recruit');{const kind=t.RACES.human.melee;t.act('rec-pick',kind);ok(G.town.pick===kind,'rec-pick picks the unit');
  t.act('hire',kind);ok(P.troops[kind]===1&&last()===t.cap1(t.an(t.ST[kind].n.toLowerCase()))+' joins your band.','hire: '+last());
  t.act('rec-review');const rv=!!G.town.review;t.act('rec-cancel');ok(rv&&!G.town.review&&P.troops[kind]===1,'rec-review, then rec-cancel: nothing bought');
  t.act('rec-review');t.act('rec-confirm');ok(P.troops[kind]===2&&!G.town.review,'rec-review, then rec-confirm: one more');
  P.txp[kind]=t.txpNeed(kind);const to=t.UP[kind][0];t.act('train',kind+':'+to);ok(P.troops[to]===1&&P.troops[kind]===1&&last()===t.ST[kind].n+' trained into '+t.ST[to].n.toLowerCase()+'.','train: '+last())}
 t.act('tab','tavern');{const f=t.FACS[ash.owner].n;P.fac=null;t.act('contract');ok(P.fac===ash.owner&&last()==='You sign on with the '+f+'. Their enemies are now yours.','contract: '+last());
  t.act('end-contract');ok(P.fac===null&&last()==='You end your contract with the '+f+'.','end-contract: '+last())}
 {P.prisoners={militia:2};const v=t.ransomValue(),g0=P.gold;t.act('ransom');ok(v>0&&P.gold===g0+v&&!Object.keys(P.prisoners).length&&last()==='The broker pays '+v+' gold for 2 prisoners.','ransom: '+last())}
 t.act('leave');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 {const cid='brann',ct=t.townBy(t.COMPS[cid].town);G.mode='world';G.modal=false;t.hidePanel();G.lastTown=null;t.enterTown(ct);t.act('tab','tavern');t.act('hire-comp',cid);ok(!!P.comps[cid],'hire-comp: '+t.COMPS[cid].n+' joins');
  t.act('leave');while(G.mode==='perk')t.act('perk',G.perkOffer[0])}
 {const tw=t.TOWNS.find(x=>x.T.tourney);G.mode='world';G.modal=false;t.hidePanel();G.lastTown=null;t.enterTown(tw);t.act('tab','tavern');P.gold=100;t.act('tourney');ok(P.gold===90&&t.B&&t.B.opts.tournament,'tourney: 10 gold and into the lists')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{SP.setItem=si;SP.getItem=gi}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
