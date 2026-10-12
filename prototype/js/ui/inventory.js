'use strict';
/* ---------- inventory ---------- */
// P.inv holds invCap() slots: null, or {k:'gear'|'good'|'mat', id, n}. Gear never stacks; trade goods stack to GOODS[id].stack, trophies to STACK.
// P.gear maps each EQUIP key (weapon = main hand, offhand, head, …, the mount and its gear, ring0–ring9) to an item id or null.
const itemDef=s=>s.k==='gear'?ITEMS[s.id]:s.k==='good'?GOODS[s.id]:MATS[s.id];
const stackOf=(k,id)=>k==='gear'?1:k==='good'?GOODS[id].stack:STACK;
const invCap=()=>INV_SIZE+gm('slots');
const invFree=()=>P.inv.filter(s=>!s).length;
const invCount=(k,id)=>P.inv.reduce((a,s)=>a+(s&&s.k===k&&s.id===id?s.n:0),0);
// trade goods: how many you carry, how many more fit, and taking some (partial stacks first, so slots free up)
const goodN=g=>invCount('good',g);
const goodRoom=g=>P.inv.reduce((a,s)=>a+(!s?GOODS[g].stack:s.k==='good'&&s.id===g?GOODS[g].stack-s.n:0),0);
const foodN=()=>FOODS.reduce((a,g)=>a+goodN(g),0);
const foodKinds=()=>FOODS.filter(g=>goodN(g)>0).length;
// the band eats the most perishable food first
function foodTake(n){let left=n;for(const g of FOODS){if(!left)break;left-=goodTake(g,left)}return n-left}
function goodTake(g,n){
  let left=n;const idx=P.inv.map((s,i)=>i).filter(i=>P.inv[i]&&P.inv[i].k==='good'&&P.inv[i].id===g).sort((a,b)=>P.inv[a].n-P.inv[b].n);
  for(const i of idx){if(!left)break;const s=P.inv[i],t=Math.min(left,s.n);s.n-=t;left-=t;if(!s.n)P.inv[i]=null}
  return n-left;
}
const itemRank=I=>I.tier!=null?I.tier:{common:2,rare:4,epic:6}[I.r];
// the main hand takes any weapon; the off hand takes shields, tomes and torches, or a one-handed weapon (dual wield)
const accepts=(key,id)=>{const I=ITEMS[id];if(key==='offhand')return I.slot==='offhand'||I.slot==='weapon'&&(I.hand||'one')==='one';return slotOfKey(key)===I.slot};
const twoHanded=id=>!!id&&ITEMS[id].hand==='two';
const HANDS={one:'one-handed',two:'two-handed',hybrid:'hybrid'};
const kindLabel=I=>I.slot==='weapon'?HANDS[I.hand||'one']+' weapon':SLOTS[I.slot].toLowerCase();
// add n of an item; returns how many fit
function invAdd(k,id,n){
  let left=n;const max=stackOf(k,id);
  if(max>1)for(const s of P.inv)if(left&&s&&s.k===k&&s.id===id&&s.n<max){const t=Math.min(left,max-s.n);s.n+=t;left-=t}
  for(let i=0;i<P.inv.length&&left;i++)if(!P.inv[i]){const t=Math.min(left,max);P.inv[i]={k,id,n:t};left-=t}
  return n-left;
}
// grow or shrink the bag to match the equipped pack; refuses (false) if shrinking would drop items
function fitInv(){
  const cap=invCap();if(P.inv.length>cap&&P.inv.slice(cap).some(Boolean))return false;
  while(P.inv.length<cap)P.inv.push(null);P.inv.length=cap;return true;
}
// where an item would go: its own slot, or for rings the first empty finger (else the first finger)
const targetKey=id=>{const sl=ITEMS[id].slot;if(sl!=='ring')return sl;const f=EQUIP.filter(k=>k.startsWith('ring'));return f.find(k=>!P.gear[k])||f[0]};
// why a slot cannot take anything right now, or ''
function blockedWhy(key){
  if(MOUNT_KEYS.includes(key)&&!P.gear.mount)return 'Equip a mount first: its gear needs something to wear it.';
  if(key==='offhand'&&twoHanded(P.gear.weapon))return 'Your '+ITEMS[P.gear.weapon].n+' takes both hands.';
  return '';
}
// what a change pushes off: the off hand when the main hand goes two-handed, the mount's gear when the mount comes off
const evicted=()=>[...(twoHanded(P.gear.weapon)&&P.gear.offhand?['offhand']:[]),...(P.gear.mount?[]:MOUNT_KEYS.filter(k=>P.gear[k]))];
// run a change to gear and bag, put what it pushes off into the bag, and undo it all if anything does not fit
function gearTxn(fn,fail){
  const g={...P.gear},inv=P.inv.map(s=>s&&{...s}),undo=m=>{P.gear=g;P.inv=inv;fitInv();if(m)log(m,'bad');return false};
  if(!fn())return undo();const moved=[];
  for(const k of evicted()){const i=P.inv.indexOf(null);if(i<0)return undo('Your bag is full. Make room for your '+ITEMS[P.gear[k]].n+' first.');P.inv[i]={k:'gear',id:P.gear[k],n:1};moved.push(ITEMS[P.gear[k]].n);P.gear[k]=null}
  if(!fitInv())return undo(fail||'Empty the extra bag slots before you swap that.');
  if(moved.length)log('Into the bag: '+moved.join(', ')+'.');return true;
}
function equipInto(i,key){
  const s=P.inv[i];if(!s||s.k!=='gear'||!accepts(key,s.id))return false;const why=blockedWhy(key);if(why){log(why,'bad');return false}
  if(!gearTxn(()=>{const old=P.gear[key];P.gear[key]=s.id;P.inv[i]=old?{k:'gear',id:old,n:1}:null;return true}))return false;
  log('You equip the '+ITEMS[s.id].n+(key==='offhand'&&ITEMS[s.id].slot==='weapon'?' in your off hand':'')+'.');return true;
}
const invEquip=i=>{const s=P.inv[i];return s&&s.k==='gear'?equipInto(i,targetKey(s.id)):false};
function invUnequip(key,to){
  const id=P.gear[key];if(!id)return false;const i=to!=null&&!P.inv[to]?to:P.inv.indexOf(null);
  if(i<0){log('Your bag is full. Make room before you take that off.','bad');return false}
  return gearTxn(()=>{P.gear[key]=null;P.inv[i]={k:'gear',id,n:1};return true},'Empty the extra bag slots before you take that off.');
}
// drag and drop: from/to are a slot index or 'eq:<key>'
function invMove(from,to){
  if(from===to)return;const fe=String(from).startsWith('eq:'),te=String(to).startsWith('eq:');
  if(fe&&te){const a=from.slice(3),b=to.slice(3),x=P.gear[a],y=P.gear[b];if(!x||!accepts(b,x)||y&&!accepts(a,y))return;
    const why=blockedWhy(b)||y&&blockedWhy(a);if(why){log(why,'bad');return}gearTxn(()=>{P.gear[a]=y;P.gear[b]=x;return true});return}
  if(fe){const key=from.slice(3),t=P.inv[to];if(!t)invUnequip(key,to);else if(t.k==='gear'&&accepts(key,t.id))equipInto(to,key);return}
  if(te){const s=P.inv[from];if(s&&s.k==='gear')equipInto(from,to.slice(3));return}
  const a=P.inv[from],b=P.inv[to];
  if(a&&b&&a.k!=='gear'&&b.k===a.k&&a.id===b.id&&b.n<stackOf(b.k,b.id)){const t=Math.min(a.n,stackOf(b.k,b.id)-b.n);b.n+=t;a.n-=t;if(!a.n)P.inv[from]=null;return}
  P.inv[from]=b;P.inv[to]=a;
}
function invSort(){
  const so=Object.fromEntries(Object.keys(SLOTS).map((k,i)=>[k,i])),items=P.inv.filter(Boolean);
  // merge partial stacks first; then gear, trade goods, trophies
  const merged=[],ko={gear:0,good:1,mat:2},go=Object.keys(GOODS);
  for(const s of items){const m=s.k!=='gear'&&merged.find(x=>x.k===s.k&&x.id===s.id&&x.n<stackOf(x.k,x.id));if(m){const t=Math.min(s.n,stackOf(m.k,m.id)-m.n);m.n+=t;s.n-=t;if(s.n)merged.push(s)}else merged.push(s)}
  merged.sort((a,b)=>a.k!==b.k?ko[a.k]-ko[b.k]:a.k==='good'?go.indexOf(a.id)-go.indexOf(b.id)||b.n-a.n:a.k==='gear'?(so[ITEMS[a.id].slot]-so[ITEMS[b.id].slot]||itemRank(ITEMS[b.id])-itemRank(ITEMS[a.id])||ITEMS[a.id].n.localeCompare(ITEMS[b.id].n)):(MATS[b.id].v-MATS[a.id].v||b.n-a.n));
  P.inv=merged.concat(Array(invCap()-merged.length).fill(null));G.invSel=null;
}

/* the screen: a body with each slot where it is worn, the mount below it, and the bag beside it */
// how an item changes the hero against what it would replace, as a list of "+3 damage" strings
function gearDiff(id,key){
  const cur=P.gear[key||targetKey(id)],a=ITEMS[id].m,b=cur?ITEMS[cur].m:{},out=[];
  for(const k of Object.keys(GEAR_STAT)){const d=(a[k]||0)-(b[k]||0);if(!d)continue;const [n,u,dir]=GEAR_STAT[k],v=u?Math.round(d*100):+d.toFixed(1),good=dir===-1?d<0:d>0;
    out.push('<span class="'+(good?'good':'bad')+'">'+(v>0?'+':'')+v+u+' '+n+'</span>')}
  const sk=new Set([...Object.keys(a.sk||{}),...Object.keys(b.sk||{})]);for(const k of sk){const d=((a.sk||{})[k]||0)-((b.sk||{})[k]||0);if(d)out.push('<span class="'+(d>0?'good':'bad')+'">'+(d>0?'+':'')+d+' '+SKILLS[k].n+'</span>')}
  return out;
}
function openInv(){if(G.mode!=='world'||G.modal)return;G.mode='inv';G.invSel=null;G.invArm=null;G.invTab=G.invTab||'all';renderInv()}
// the selected bag item, if it is gear
const selGear=()=>{const k=G.invSel;if(k==null||String(k).startsWith('eq:'))return null;const s=P.inv[k];return s&&s.k==='gear'?s.id:null};
function slotHtml(s,key,label,cls){
  const sel=String(G.invSel)===String(key),def=s&&itemDef(s),rc=s&&s.k==='gear'?RARITY[ITEMS[s.id].r]:'';
  const name=s?def.n+(s.k==='gear'?', '+ITEMS[s.id].r+' '+kindLabel(ITEMS[s.id]):s.k==='good'?', '+s.n:', '+s.n+' trophies'):label;
  return '<button class="slot'+(s?'':' empty')+(cls?' '+cls:'')+(sel?' sel':'')+'" type="button" data-act="inv-sel" data-arg="'+key+'" draggable="'+(!!s)+'" aria-pressed="'+sel+'" aria-label="'+name+'" title="'+name+'"'+(rc?' style="--rc:'+rc+'"':'')+'>'+
    (s?'<span data-icon="'+s.k+':'+s.id+'"></span>'+(s.n>1?'<b class="cnt">'+s.n+'</b>':''):String(key).startsWith('eq:')?'<small>'+label+'</small>':'')+'</button>';
}
const eqHtml=(key,label,cls)=>slotHtml(P.gear[key]?{k:'gear',id:P.gear[key],n:1}:null,'eq:'+key,label,cls||'eq');
const dropBtn=k=>'<button class="btn sm" type="button" data-act="inv-drop" data-arg="'+k+'">'+(G.invArm===k?'Confirm drop':'Drop')+'</button>';
function detailHtml(){
  const k=G.invSel;if(k==null)return '<p class="muted">Select an item to see what it does. Drag it onto the body to wear it, or double-click it.</p>';
  const eq=String(k).startsWith('eq:'),key=eq?k.slice(3):null,s=eq?(P.gear[key]?{k:'gear',id:P.gear[key],n:1}:null):P.inv[k];
  if(!s)return '<p class="muted">'+(eq?(blockedWhy(key)||SLOTS[slotOfKey(key)]+' slot is empty. '+(MOUNT_KEYS.includes(key)?'Stables and smiths sell mount gear.':key==='offhand'?'Hold a shield, a tome, a torch, or a second one-handed weapon.':'Smiths sell gear, and monsters and enemies drop it.')):'Empty slot.')+'</p>';
  if(s.k==='good'){const D=GOODS[s.id];return '<h3>'+D.n+'</h3><p class="muted">Trade good · '+s.n+' of '+D.stack+' in this slot</p><p>'+D.d+'</p><p class="muted">Worth about '+D.base+'g each. Prices change from town to town.</p><div class="btns">'+dropBtn(k)+'</div>'}
  if(s.k==='mat'){const M=MATS[s.id];return '<h3>'+M.n+'</h3><p class="muted">Trophy · stack of '+s.n+' (max '+STACK+')</p><p>Worth about '+M.v+'g each, '+M.v*s.n+'g for the stack. Sell it at any town market.</p><div class="btns">'+dropBtn(k)+'</div>'}
  const I=ITEMS[s.id],head='<h3 style="color:'+RARITY[I.r]+'">'+I.n+'</h3><p class="muted">'+cap1(I.r)+' '+kindLabel(I)+' · worth about '+I.v+'g</p><p>'+I.d+'</p>';
  if(eq){const g=key==='weapon'&&I.hand==='hybrid'?'<p class="gold">'+(offI()?'One-handed grip: your off hand is full.':'Two-handed grip: +20% damage, +4 reach.')+'</p>':key==='offhand'&&I.slot==='weapon'?'<p class="gold">Dual wield: half its damage adds to your main hand, and your combo turns quick.</p>':MOUNT_KEYS.includes(key)?'<p class="muted">Worn by your '+(mountDef()?mountDef().n:'mount')+'.</p>':'';
    return head+g+'<p class="muted">Equipped'+(key==='offhand'?' in your off hand':key==='weapon'?' in your main hand':'')+'.</p><div class="btns"><button class="btn sm" type="button" data-act="inv-unequip" data-arg="'+key+'"'+(invFree()?'':' disabled')+'>Unequip</button></div>'}
  const tk=targetKey(s.id),cur=P.gear[tk],why=blockedWhy(tk),diff=gearDiff(s.id,tk),off=I.slot==='weapon'&&accepts('offhand',s.id);
  const push=!why&&twoHanded(s.id)&&P.gear.offhand?'<p class="muted">Takes both hands: your '+ITEMS[P.gear.offhand].n+' goes into the bag.</p>':'';
  return head+'<p class="lab">'+(cur?'Compared with your '+ITEMS[cur].n:'Compared with an empty '+SLOTS[slotOfKey(tk)].toLowerCase()+' slot')+'</p><p class="diff">'+(diff.join(' · ')||'<span class="muted">No change.</span>')+'</p>'+push+
    (why?'<p class="bad">'+why+'</p>':'')+
    '<div class="btns"><button class="btn sm primary" type="button" data-act="inv-equip" data-arg="'+k+'"'+(why?' disabled':'')+'>'+(I.slot==='weapon'?(cur?'Swap main hand':'Main hand'):cur?'Swap':'Equip')+'</button>'+
    (off?'<button class="btn sm" type="button" data-act="inv-off" data-arg="'+k+'"'+(blockedWhy('offhand')?' disabled':'')+'>'+(P.gear.offhand?'Swap off hand':'Off hand')+'</button>':'')+dropBtn(k)+'</div>';
}
// where each slot sits on the 270 × 436 body, and five fingers by each hand (off hand first, main hand second)
const DOLL={ear:[58,30,'Earring'],head:[115,14,'Head'],face:[172,30,'Face'],arms:[24,84,'Arms'],body:[115,90,'Body'],cape:[206,84,'Cape'],
  offhand:[18,150,'Off hand'],weapon:[212,150,'Main hand'],belt:[115,162,'Belt'],bag:[50,262,'Bag'],legs:[115,218,'Legs'],feet:[115,276,'Feet'],
  mount:[14,358,'Mount'],mhead:[84,358,'Barding head'],marmor:[136,358,'Barding'],macc:[188,358,'Accessory']};
const FINGERS=[[4,198],[30,202],[56,206],[14,226],[40,230],[242,198],[216,202],[190,206],[232,226],[206,230]];
const BODY_SVG='<svg class="body" viewBox="0 0 270 330" width="270" height="330" aria-hidden="true"><g fill="#e4e0cf"><circle cx="135" cy="50" r="24"/><rect x="102" y="80" width="66" height="100" rx="14"/>'+
  '<rect x="74" y="84" width="24" height="92" rx="10"/><rect x="172" y="84" width="24" height="92" rx="10"/><rect x="106" y="182" width="26" height="128" rx="10"/><rect x="138" y="182" width="26" height="128" rx="10"/></g></svg>';
const INV_TABS=[['all','All'],['gear','Gear'],['good','Food & goods'],['mat','Trophies']];
const GRIP_N={one:'One hand',dual:'Dual wield',shield:'Sword & board',two:'Two hands'};
function renderInv(){
  const used=P.inv.length-invFree(),fit=selGear(),hs=heroStats(),tab=G.invTab||'all';
  const at=(x,y)=>'left:'+x+'px;top:'+y+'px';
  const place=(key,x,y,label,cls)=>{let c=cls||'eq';const why=blockedWhy(key);if(why)c+=MOUNT_KEYS.includes(key)?' off':' lock';else if(fit&&accepts(key,fit))c+=' fit';
    return eqHtml(key,why&&key==='offhand'?'Both hands':label,c).replace('<button ','<button style="'+at(x,y)+'" ')};
  const doll=Object.entries(DOLL).map(([k,[x,y,l]])=>place(k,x,y,l)).join('')+EQUIP.filter(k=>k.startsWith('ring')).map((k,i)=>place(k,FINGERS[i][0],FINGERS[i][1],'R'+(i+1),'eq ring')).join('');
  const lbl=(x,y,t)=>'<span class="lbl" style="'+at(x,y)+'">'+t+'</span>';
  showPanel('<div class="top"><h2>Inventory</h2><span class="muted">'+used+' / '+P.inv.length+' slots · <span class="gold">'+P.gold+' gold</span></span><button class="btn sm" type="button" data-act="inv-close">Back to map</button></div>'+
    '<div class="inv"><div class="doll" aria-label="Equipment">'+BODY_SVG+lbl(8,6,'Equipment')+lbl(16,138,'Off hand')+lbl(206,138,'Main hand')+
      '<div class="rule"></div>'+lbl(8,338,'Mount · '+(mountDef()?mountDef().n:'on foot'))+doll+
      '<div class="dstats"><span>HP <b>'+hs.hp+'</b></span><span>DMG <b>'+Math.round(hs.dmg)+'</b></span><span>'+(hs.range?'Range <b>'+hs.range+'</b>':'Reach <b>'+Math.round(hs.reach)+'</b>')+'</span><span class="gold">'+GRIP_N[grip()]+'</span></div></div>'+
    '<div class="invB"><div class="invtabs">'+INV_TABS.map(([k,l])=>'<button class="btn sm'+(tab===k?' on':'')+'" type="button" data-act="inv-tab" data-arg="'+k+'" aria-pressed="'+(tab===k)+'">'+l+'</button>').join('')+
      '<span class="grow"></span><button class="btn sm" type="button" data-act="inv-sort">Sort</button></div>'+
      '<div class="invcap" title="'+used+' of '+P.inv.length+' slots · food for about '+Math.floor(foodN()/eatPerDay())+' days"><i style="width:'+Math.round(100*used/P.inv.length)+'%"></i></div>'+
      '<div class="invgrid">'+P.inv.map((s,i)=>slotHtml(s,i,'Empty slot',s&&tab!=='all'&&s.k!==tab?'dim':'')).join('')+'</div>'+
      '<div class="invR" aria-live="polite">'+detailHtml()+'</div></div></div>');
  panel.querySelectorAll('[data-icon]').forEach(e=>{const [k,id]=e.dataset.icon.split(':'),src=itemIcon(itemDef({k,id})),c=document.createElement('canvas'),z=e.closest('.ring')?18:26;
    c.width=z;c.height=z;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(src,0,0,z,z);c.setAttribute('aria-hidden','true');e.replaceWith(c)});
}
function invAct(a,arg){
  if(!a.startsWith('inv-'))return false;
  if(a==='inv-close'){G.mode='world';hidePanel();return true}
  if(G.mode!=='inv')return true;
  const key=arg!=null&&!String(arg).startsWith('eq:')&&a!=='inv-unequip'&&a!=='inv-tab'?+arg:arg;
  if(a!=='inv-drop')G.invArm=null;
  if(a==='inv-sel')G.invSel=String(G.invSel)===String(key)?null:key;
  else if(a==='inv-tab')G.invTab=arg;
  else if(a==='inv-equip'){const s=P.inv[key];if(s&&s.k==='gear'){const tk=targetKey(s.id);if(invEquip(key))G.invSel='eq:'+tk}}
  else if(a==='inv-off'){if(equipInto(key,'offhand'))G.invSel='eq:offhand'}
  else if(a==='inv-unequip'){if(invUnequip(arg))G.invSel=null}
  else if(a==='inv-drop'){if(String(G.invArm)===String(key)){const s=P.inv[key];P.inv[key]=null;G.invArm=null;G.invSel=null;if(s)log('You leave '+(s.k==='good'?s.n+' '+itemDef(s).n.toLowerCase():s.n>1?s.n+' '+itemDef(s).n.toLowerCase()+'s':'the '+itemDef(s).n)+' behind.')}else G.invArm=key}
  else if(a==='inv-sort')invSort();
  updateHUD(true);renderInv();
  const again=panel.querySelector('[data-act="'+a+'"][data-arg="'+arg+'"]:not([disabled])')||panel.querySelector('.slot.sel');if(again)again.focus({preventScroll:true});
  return true;
}
// drag and drop between slots; double-click wears a bag item or takes off a worn one
panel.addEventListener('dragstart',e=>{const b=e.target.closest('.slot');if(!b||G.mode!=='inv')return;e.dataTransfer.setData('text/plain',b.dataset.arg);e.dataTransfer.effectAllowed='move'});
panel.addEventListener('dragover',e=>{if(G.mode==='inv'&&e.target.closest('.slot'))e.preventDefault()});
panel.addEventListener('drop',e=>{const b=e.target.closest('.slot');if(!b||G.mode!=='inv')return;e.preventDefault();
  const f=e.dataTransfer.getData('text/plain'),t=b.dataset.arg,num=x=>x.startsWith('eq:')?x:+x;invMove(num(f),num(t));G.invSel=num(t);G.invArm=null;updateHUD(true);renderInv()});
panel.addEventListener('dblclick',e=>{const b=e.target.closest('.slot');if(!b||G.mode!=='inv')return;const k=b.dataset.arg;
  if(k.startsWith('eq:')){if(P.gear[k.slice(3)])invAct('inv-unequip',k.slice(3))}else if(P.inv[+k]&&P.inv[+k].k==='gear')invAct('inv-equip',k)});
onAct('inv-',invAct);
