'use strict';
/* ---------- actions ---------- */
function act(a,arg){
  if(a==='begin')return begin(arg);
  if(a==='econmode'){setEconMode(arg);showTitle('settings');return}
  if(routeAct(a,arg)||menuAct(a,arg))return;
  if(a==='race'){G.race=arg;showTitle('new');const b=panel.querySelector('[data-act="race"].on');if(b)b.focus({preventScroll:true});return}
  if(a==='load')return loadGame();
  if(a==='wipe')return wipeSave();
  if(a==='fight'){const e=G.enc;return startBattle({enemies:e.list,tournament:false,lv:e.lv||1})}
  if(a==='auto')return autoResolve();
  if(a==='flee')return flee();
  if(a==='cont'){updateHUD(true);if(G.capture){toWorld();return showCapture()}return toWorld()}
  if(a==='leave'){G.town=null;return toWorld()}
  if(a==='back-town'){G.mode='town';renderTown();return}
  if(a==='lord-leave'){const l=G.enc&&G.enc.ref;if(l)l.cool=3;G.enc=null;G.encCool=2;G.mode='world';hidePanel();return}
  if(a==='lord-attack'){const l=G.enc.ref;P.hostile[l.fac]=G.day+20;addHonor(l.fac,-15,true);log('You attack '+l.name+'. The '+FACS[l.fac].n+' is now hostile to you.','bad');return startEncounter({kind:'lord',ref:l,list:l.troops.slice()})}
  if(a.startsWith('q-')){const tq=G.town&&G.town.ref;questAct(a,arg,G.mode==='town'?tq:null);if(a.startsWith('q-lord'))return;updateHUD(true);if(G.mode==='char')return renderChar();if(G.mode==='town')renderTown();return}
  if(charAct(a,arg))return;
  const t=G.town&&G.town.ref;if(!t)return;
  const keep=panel.scrollTop;
  if(a==='plan-siege'){G.town=null;hidePanel();G.mode='world';return openSiege(t)}
  if(fiefAct(a,arg,t)){}
  else if(a==='tab')G.town.tab=arg;
  else if(a==='hire'){const c=hireCost(arg);if(!canHire(t,arg))log('The people of '+t.name+' do not know you well enough yet.','bad');else if((t.vol||0)<1)log('No one else in '+t.name+' will take up arms today.','bad');else if(P.gold>=c&&partySize()<partyCap()){P.gold-=c;t.vol--;t.pop=Math.max(10,t.pop-1);P.troops[arg]=(P.troops[arg]||0)+1;log(cap1(an(ST[arg].n.toLowerCase()))+' joins your band.')}}
  else if(a==='train'){const [k,to]=arg.split(':'),c=trainCost(to);if(UP[k]&&UP[k].includes(to)&&P.gold>=c&&P.troops[k]>0){P.gold-=c;P.troops[k]--;P.troops[to]=(P.troops[to]||0)+1;log(ST[k].n+' trained into '+ST[to].n.toLowerCase()+'.')}}
  else if(a==='contract'){if(!P.fac){P.fac=t.owner;delete P.hostile[t.owner];log('You sign on with the '+FACS[t.owner].n+'. Their enemies are now yours.','gold')}}
  else if(a==='end-contract'){if(P.fac===t.owner){P.fac=null;log('You end your contract with the '+FACS[t.owner].n+'.')}}
  else if(a==='hire-comp'){const c=COMPS[arg];if(!P.comps[arg]&&P.gold>=c.cost&&partySize()<partyCap()){P.gold-=c.cost;P.comps[arg]={ap:0,role:''};log(c.n+' joins your band. Give them a role with C.','good')}}
  else if(a==='ransom'){const v=ransomValue();if(v){P.gold+=v;log('The broker pays '+v+' gold for '+prisonerCount()+' prisoners.','gold');P.prisoners={};mood('ransom')}}
  else if(a==='buy-gear'){const st=smithStock(t),id=st[+arg];if(id&&P.gold>=gearPrice(id)&&invAdd('gear',id,1)){P.gold-=gearPrice(id);st.splice(+arg,1);addRep(t.name,ITEMS[id].v/120,true);log('You buy the '+ITEMS[id].n+'.','gold')}}
  else if(a==='buy-ammo'){const [g,ns]=arg.split(':'),n=+ns;if(GOODS[g]&&GOODS[g].ammo){const r=buyGoods(t,g,n);if(r.got)log('You buy '+r.got+' '+GOODS[g].n.toLowerCase()+'.');else log('The smith has no '+GOODS[g].n.toLowerCase()+' to sell.','bad')}}
  else if(a==='buy-mount'){const id=arg,p=gearPrice(id);if(stableStock(t).includes(id)&&canBuyMount(t,id)&&P.gold>=p&&P.gear.mount!==id){
    if(!P.gear.mount){P.gear.mount=id;P.gold-=p;fitInv();log('You buy a '+ITEMS[id].n+' and ride it out of the stable.','gold')}
    else if(invAdd('gear',id,1)){P.gold-=p;log('You buy a '+ITEMS[id].n+'. Swap mounts in your inventory.','gold')}}}
  else if(a==='sell-loot'){const x=P.inv[+arg];if(x&&x.k==='mat'){const g=matPrice(x.id)*x.n;P.gold+=g;P.inv[+arg]=null;train('trade',g/20);log('You sell '+x.n+' '+MATS[x.id].n.toLowerCase()+(x.n>1?'s':'')+' for '+g+' gold.','gold')}}
  else if(a==='sell-item'){const x=P.inv[+arg];if(x&&x.k==='gear'){const g=itemPrice(x.id);P.gold+=g;P.inv[+arg]=null;train('trade',g/20);log('You sell the '+ITEMS[x.id].n+' for '+g+' gold.','gold')}}
  else if(a==='buy'||a==='sell'){const [g,nStr]=arg.split(':');let n=+nStr;
    if(a==='buy'){const r=buyGoods(t,g,n);if(r.got)addRep(t.name,r.spent/60,true)}
    else{const r=sellGoods(t,g,n);train('trade',r.earned/20);addRep(t.name,r.earned/60,true)}}
  else if(a==='rest'){if(P.gold>=5){P.gold-=5;P.morale=clamp(P.morale+15,0,100);restoreVitals();log('Your band rests at the inn. You wake fully recovered.','good')}}
  else if(a==='tourney'){if(P.gold>=10){P.gold-=10;updateHUD(true);return startBattle({enemies:['chief'],tournament:true})}}
  updateHUD(true);renderTown();panel.scrollTop=keep;
  const again=panel.querySelector('[data-act="'+a+'"][data-arg="'+arg+'"]:not([disabled])')||panel.querySelector('[data-act="tab"].on');if(again)again.focus({preventScroll:true});
}
panel.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b)act(b.dataset.act,b.dataset.arg)});
document.addEventListener('click',e=>{
  const s=e.target.closest('[data-speed]');if(s)setSpeed(+s.dataset.speed);
  const o=e.target.closest('[data-order]');if(o)setOrder(o.dataset.order);
  const g=e.target.closest('[data-grp]');if(g)selectGroup(g.dataset.grp);
});
$('#spread').addEventListener('click',setSpread);
$('#pause').addEventListener('click',togglePause);
$('#saveBtn').addEventListener('click',()=>saveGame());
// the main menu, from anywhere outside a battle
$('#menuBtn').addEventListener('click',()=>{if(G.mode==='title')return;if(G.mode==='esc')return escAct('esc-resume');showEsc()});

$('#charBtn').addEventListener('click',()=>{if(G.mode==='char')act('char-close');else openChar()});
$('#skillBtn').addEventListener('click',()=>{if(G.mode==='skills')act('sk-close');else openSkills()});
$('#invBtn').addEventListener('click',()=>{if(G.mode==='inv')act('inv-close');else openInv()});
$('#swing').addEventListener('click',swing);
document.querySelectorAll('[data-skill]').forEach(b=>b.addEventListener('click',()=>dodge()));
document.addEventListener('click',e=>{const s=e.target.closest&&e.target.closest('[data-slot]');if(s&&B)castSlot(+s.dataset.slot)});
const blk=$('#block');
blk.addEventListener('pointerdown',()=>{if(B)B.touchBlock=true});
['pointerup','pointerleave','pointercancel'].forEach(ev=>blk.addEventListener(ev,()=>{if(B)B.touchBlock=false}));
/* ---------- input ---------- */
function toCanvas(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*VW/r.width,y:(e.clientY-r.top)*VH/r.height}}
cv.addEventListener('pointermove',e=>{const p=toCanvas(e);G.mouse.x=p.x;G.mouse.y=p.y;G.mouse.in=true;G.mouse.type=e.pointerType});
cv.addEventListener('pointerleave',()=>{G.mouse.in=false});
cv.addEventListener('pointerdown',e=>{
  const p=toCanvas(e);G.mouse.x=p.x;G.mouse.y=p.y;G.mouse.in=true;G.mouse.type=e.pointerType;
  if(G.modal)return;
  if(G.mode==='world'){const wx=G.cam.x+p.x,wy=G.cam.y+p.y;if(clickAt(wx,wy)||G.chase)return;
    P.tx=clamp(wx,8,MW*TILE-8);P.ty=clamp(wy,8,MH*TILE-8);P.stuck=0}
  else if(G.mode==='battle'&&B){if(e.pointerType==='mouse'){if(e.button===2)shove();else if(e.button===0){if(isBow())drawStart();else swing()}}else B.mt={x:p.x,y:p.y}}
});
cv.addEventListener('contextmenu',e=>e.preventDefault());
// the bow: let go of the button (anywhere) to shoot; the wheel sets the angle
window.addEventListener('pointerup',e=>{if(e.button===0&&B&&B.draw)drawRelease()});
cv.addEventListener('wheel',e=>{if(G.mode==='battle'&&B&&isBow()){e.preventDefault();bowRangeStep(e.deltaY<0?15:-15)}},{passive:false});
// keys are read by physical position (e.code), so WASD and the hotkeys work on any keyboard layout, Thai included
function keyOf(e){const c=e.code||'';
  if(c.startsWith('Key'))return c.slice(3).toLowerCase();if(c.startsWith('Digit'))return c.slice(5);if(c.startsWith('Numpad')&&/\d$/.test(c))return c.slice(-1);
  if(c.startsWith('Arrow'))return c.toLowerCase();if(c.startsWith('Shift'))return 'shift';if(c==='Escape')return 'escape';return (e.key||'').toLowerCase()}
window.addEventListener('keydown',e=>{
  if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  const k=keyOf(e);
  if(e.key==='F6'){e.preventDefault();saveGame();return}
  if(k==='escape'){e.preventDefault();onEscape();return}
  if(G.mode==='battle'&&B){
    if(e.code==='Space'){e.preventDefault();if(!e.repeat){if(isBow())drawStart();else swing()}return}
    if(!e.repeat){const si=SLOT_KEYS.indexOf(k);if(si>=0)return castSlot(si);if(k==='f')return dodge()}
    if(k==='z')return setOrder('hold');if(k==='x')return setOrder('follow');if(k==='c')return setOrder('charge');if(k==='v')return setOrder('advance');
    if(k==='t')return setSpread();if(k==='g'&&!e.repeat)return cycleGroup();
    if(['arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();
    G.keys[k]=true;if(e.shiftKey)G.keys.shift=true;
  }else if(G.mode==='world'&&!G.modal){
    if(e.code==='Space'){e.preventDefault();if(!e.repeat)togglePause()}
    if(k==='1')setSpeed(1);if(k==='2')setSpeed(2);if(k==='3')setSpeed(3);
    if(k==='c')openChar();if(k==='i')openInv();if(k==='k')openSkills();
  }else if(G.mode==='char'&&(k==='c'||k==='escape'))act('char-close');
  else if(G.mode==='skills'&&(k==='k'||k==='escape'))act('sk-close');
  else if(G.mode==='inv'&&(k==='i'||k==='escape'))act('inv-close');
});
window.addEventListener('keyup',e=>{if(e.code==='Space'&&B&&B.draw)drawRelease();const k=keyOf(e);G.keys[k]=false;if(k==='shift'||!e.shiftKey)G.keys.shift=false});
window.addEventListener('blur',()=>{G.keys={}});
