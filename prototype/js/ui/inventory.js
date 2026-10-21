'use strict';
/* ---------- inventory screen and command feedback ---------- */
// (what each thing in the bag is, its words, its worth and its verbs: its kind, core/items.js itemKind)
function equipmentFeedback(result){
  if(result.reason)log(result.reason,'bad');
  if(result.ok&&result.moved.length)log('Into the bag: '+result.moved.join(', ')+'.');
  return result.ok;
}
function equipInto(i,key){
  const s=P.inv[i];if(!equipmentFeedback(heroEquipment.equip(i,key)))return false;
  log('You equip the '+ITEMS[s.id].n+(key==='offhand'&&ITEMS[s.id].slot==='weapon'?' in your off hand':'')+'.');return true;
}
const invEquip=i=>{const s=P.inv[i];return s&&s.k==='gear'?equipInto(i,targetKey(s.id)):false};
const invUnequip=(key,to)=>equipmentFeedback(heroEquipment.unequip(key,to));
// Drag and drop translate slot names into the same equipment commands used by buttons.
function invMove(from,to){
  if(from===to)return;const fe=String(from).startsWith('eq:'),te=String(to).startsWith('eq:');
  if(fe&&te){equipmentFeedback(heroEquipment.swap(from.slice(3),to.slice(3)));return}
  if(fe){const key=from.slice(3),s=P.inv[to];if(!s)invUnequip(key,to);else if(s.k==='gear'&&accepts(key,s.id))equipInto(to,key);return}
  if(te){const s=P.inv[from];if(s&&s.k==='gear')equipInto(from,to.slice(3));return}
  const a=P.inv[from],b=P.inv[to];
  if(a&&b&&a.k!=='gear'&&b.k===a.k&&a.id===b.id&&b.n<stackOf(b.k,b.id)){const n=Math.min(a.n,stackOf(b.k,b.id)-b.n);b.n+=n;a.n-=n;if(!a.n)P.inv[from]=null;return}
  P.inv[from]=b;P.inv[to]=a;
}
function invSort(){sortInventory();G.invSel=null}

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
// a slot: its record (s), its key (a bag slot's index, or eq:slot), its label when empty, its classes (a quest item's bound: marked)
function slotHtml(s,key,label,cls){
  const sel=String(G.invSel)===String(key),K=s&&itemKind(s),rc=s?K.colour(s):'',c=s&&K.cat(s);
  const name=s?K.title(s):label;
  return '<button class="slot'+(s?'':' empty')+(cls?' '+cls:'')+(c&&!c.drop?' bound':'')+(sel?' sel':'')+'" type="button" data-act="inv-sel" data-arg="'+key+'" draggable="'+(!!s)+'" aria-pressed="'+sel+'" aria-label="'+name+'" title="'+name+'"'+(rc?' style="--rc:'+rc+'"':'')+'>'+
    (s?'<span data-icon="'+s.k+':'+s.id+'"></span>'+(s.n>1?'<b class="cnt">'+s.n+'</b>':''):String(key).startsWith('eq:')?'<small>'+label+'</small>':'')+'</button>';
}
const eqHtml=(key,label,cls)=>slotHtml(P.gear[key]?{k:'gear',id:P.gear[key],n:1}:null,'eq:'+key,label,cls||'eq');
const dropBtn=k=>'<button class="btn sm" type="button" data-act="inv-drop" data-arg="'+k+'">'+(G.invArm===k?'Confirm drop':'Drop')+'</button>';
// (Drop where its category allows it: a quest item is bound)
const dropIf=(k,K)=>K.verb('drop')&&K.verb('drop').shown(k)?dropBtn(k):'';
function detailHtml(){
  const k=G.invSel;if(k==null)return '<p class="muted">Select an item to see what it does. Drag it onto the body to wear it, or double-click it.</p>';
  const eq=String(k).startsWith('eq:'),key=eq?k.slice(3):null,s=eq?(P.gear[key]?{k:'gear',id:P.gear[key],n:1}:null):P.inv[k];
  if(!s)return '<p class="muted">'+(eq?(blockedWhy(key)||SLOTS[slotOfKey(key)]+' slot is empty. '+(MOUNT_KEYS.includes(key)?'Stables and smiths sell mount gear.':key==='offhand'?'Hold a shield, a tome, a torch, or a second one-handed weapon.':'Smiths sell gear, and monsters and enemies drop it.')):'Empty slot.')+'</p>';
  const K=itemKind(s),C=K.cat(s)||{n:'Not an item'},over=!eq&&k>=playerInventory.size?'<p class="bad">In an overflow slot: it weighs on your pace.</p>':'';
  if(s.k==='good')return '<h3>'+K.name(s)+'</h3><p class="muted">'+C.n+' · '+s.n+' of '+K.stack(s.id)+' in this slot</p><p>'+K.describe(s)+'</p><p class="muted">Worth about '+K.worth(s)+'g each. Prices change from town to town.</p>'+over+'<div class="btns">'+dropIf(k,K)+'</div>';
  if(s.k==='letter')return letterDetail(k,s)+over;// (its page: world/letters.js)
  if(s.k==='mat')return '<h3>'+K.name(s)+'</h3><p class="muted">'+C.n+' · stack of '+s.n+' (max '+K.stack(s.id)+')</p><p>Worth about '+K.worth(s)+'g each, '+K.worth(s)*s.n+'g for the stack. Sell it at any town market.</p>'+over+'<div class="btns">'+dropIf(k,K)+'</div>';
  if(s.k==='val')return '<h3 style="color:'+K.colour(s)+'">'+K.name(s)+'</h3><p class="muted">'+C.n+' · '+s.n+' of '+K.stack(s.id)+' in this slot</p><p>'+K.describe(s)+'</p><p class="muted">Worth about '+K.worth(s)+'g each. Any market buys it; a city pays best.</p>'+over+'<div class="btns">'+dropIf(k,K)+'</div>';
  if(s.k==='quest')return '<h3>'+K.name(s)+'</h3><p class="muted">'+C.n+'</p><p>'+K.describe(s)+'</p><p class="muted">Bound to its quest: it cannot be sold or left behind, and it is gone once the quest is over.</p>'+over;
  const I=ITEMS[s.id],head='<h3 style="color:'+K.colour(s)+'">'+K.name(s)+'</h3><p class="muted">'+cap1(I.r)+' '+K.label(s)+' · worth about '+K.worth(s)+'g</p><p>'+K.describe(s)+'</p>';
  if(eq){const g=key==='weapon'&&I.hand==='hybrid'?'<p class="gold">'+(offI()?'One-handed grip: your off hand is full.':'Two-handed grip: +20% damage, +4 reach.')+'</p>':key==='offhand'&&I.slot==='weapon'?'<p class="gold">Dual wield: half its damage adds to your main hand, and your combo turns quick.</p>':MOUNT_KEYS.includes(key)?'<p class="muted">Worn by your '+(mountDef()?mountDef().n:'mount')+'.</p>':'';
    return head+g+'<p class="muted">Equipped'+(key==='offhand'?' in your off hand':key==='weapon'?' in your main hand':'')+'.</p><div class="btns"><button class="btn sm" type="button" data-act="inv-unequip" data-arg="'+key+'"'+(invFree()?'':' disabled')+'>Unequip</button></div>'}
  const tk=K.keyOn(s.id),cur=P.gear[tk],why=K.verb('equip').why(k),diff=gearDiff(s.id,tk),off=K.verb('off').shown(k);
  const push=!why&&twoHanded(s.id)&&P.gear.offhand?'<p class="muted">Takes both hands: your '+ITEMS[P.gear.offhand].n+' goes into the bag.</p>':'';
  return head+'<p class="lab">'+(cur?'Compared with your '+ITEMS[cur].n:'Compared with an empty '+SLOTS[slotOfKey(tk)].toLowerCase()+' slot')+'</p><p class="diff">'+(diff.join(' · ')||'<span class="muted">No change.</span>')+'</p>'+push+
    (why?'<p class="bad">'+why+'</p>':'')+
    '<div class="btns"><button class="btn sm primary" type="button" data-act="inv-equip" data-arg="'+k+'"'+(why?' disabled':'')+'>'+(I.slot==='weapon'?(cur?'Swap main hand':'Main hand'):cur?'Swap':'Equip')+'</button>'+
    (off?'<button class="btn sm" type="button" data-act="inv-off" data-arg="'+k+'"'+(K.verb('off').why(k)?' disabled':'')+'>'+(P.gear.offhand?'Swap off hand':'Off hand')+'</button>':'')+dropIf(k,K)+'</div>'+over;
}
// where each slot sits on the 270 × 436 body, and five fingers by each hand (off hand first, main hand second)
const DOLL={ear:[58,30,'Earring'],head:[115,14,'Head'],face:[172,30,'Face'],arms:[24,84,'Arms'],body:[115,90,'Body'],cape:[206,84,'Cape'],
  offhand:[18,150,'Off hand'],weapon:[212,150,'Main hand'],belt:[115,162,'Belt'],bag:[50,262,'Bag'],quiver:[180,262,'Quiver'],legs:[115,218,'Legs'],feet:[115,276,'Feet'],
  mount:[14,358,'Mount'],mhead:[84,358,'Barding head'],marmor:[136,358,'Barding'],macc:[188,358,'Accessory']};
const FINGERS=[[4,198],[30,202],[56,206],[14,226],[40,230],[242,198],[216,202],[190,206],[232,226],[206,230]];
const BODY_SVG='<svg class="body" viewBox="0 0 270 330" width="270" height="330" aria-hidden="true"><g fill="#e4e0cf"><circle cx="135" cy="50" r="24"/><rect x="102" y="80" width="66" height="100" rx="14"/>'+
  '<rect x="74" y="84" width="24" height="92" rx="10"/><rect x="172" y="84" width="24" height="92" rx="10"/><rect x="106" y="182" width="26" height="128" rx="10"/><rect x="138" y="182" width="26" height="128" rx="10"/></g></svg>';
// (the tabs: data/items.js BAG_TABS, each category's tab; Supplies shows your food, drink and morale over its items, read only)
function suppliesLine(){const S=supplyNow(),d=x=>(x>=10?Math.floor(x):Math.floor(x*10)/10)+' days';
  return '<p class="invsup muted">Food for about <b>'+d(S.foodDays)+'</b> · drink for about <b>'+d(S.drinkDays)+'</b> · morale <b>'+Math.round(P.morale)+'</b></p>'}
const GRIP_N={one:'One hand',dual:'Dual wield',shield:'Sword & board',two:'Two hands'};
function renderInv(){
  playerInventory.settle();// (the overflow tidied into any slot freed since: core/inventory.js)
  const I=playerInventory,size=I.size,used=I.used,over=I.over,fit=selGear(),hs=heroStats(),tab=BAG_TABS.some(([k])=>k===G.invTab)?G.invTab:'all';
  const dim=s=>s&&tab!=='all'&&(itemCat(s)||{}).tab!==tab;
  const at=(x,y)=>'left:'+x+'px;top:'+y+'px';
  const place=(key,x,y,label,cls)=>{let c=cls||'eq';const why=blockedWhy(key);if(why)c+=MOUNT_KEYS.includes(key)?' off':' lock';else if(fit&&accepts(key,fit))c+=' fit';
    return eqHtml(key,why&&key==='offhand'?'Both hands':label,c).replace('<button ','<button style="'+at(x,y)+'" ')};
  const doll=Object.entries(DOLL).map(([k,[x,y,l]])=>place(k,x,y,l)).join('')+EQUIP.filter(k=>k.startsWith('ring')).map((k,i)=>place(k,FINGERS[i][0],FINGERS[i][1],'R'+(i+1),'eq ring')).join('');
  const lbl=(x,y,t)=>'<span class="lbl" style="'+at(x,y)+'">'+t+'</span>';
  showPanel('<div class="top"><h2>Inventory</h2><span class="muted">'+used+' / '+size+' slots'+(over?' · <span class="bad">'+over+' over: pace −'+Math.round((1-I.burden())*100)+'%</span>':'')+' · <span class="gold">'+P.gold+' gold</span></span></div>'+
    '<div class="inv"><div class="doll" aria-label="Equipment">'+BODY_SVG+lbl(8,6,'Equipment')+lbl(16,138,'Off hand')+lbl(206,138,'Main hand')+
      '<div class="rule"></div>'+lbl(8,338,'Mount · '+(mountDef()?mountDef().n:'on foot'))+doll+
      '<div class="dstats"><span>HP <b>'+hs.hp+'</b></span><span>DMG <b>'+Math.round(hs.dmg)+'</b></span><span>'+(hs.range?'Range <b>'+hs.range+'</b>':'Reach <b>'+Math.round(hs.reach)+'</b>')+'</span><span class="gold">'+GRIP_N[grip()]+'</span></div></div>'+
    '<div class="invB"><div class="invtabs">'+BAG_TABS.map(([k,l])=>'<button class="btn sm'+(tab===k?' on':'')+'" type="button" data-act="inv-tab" data-arg="'+k+'" aria-pressed="'+(tab===k)+'">'+l+'</button>').join('')+
      '<span class="grow"></span><button class="btn sm" type="button" data-act="inv-sort">Sort</button></div>'+
      '<div class="invcap'+(over?' over':'')+'" title="'+used+' of '+size+' slots'+(over?', '+over+' past them (at most '+BAG.maxOver+')':'')+' · food for about '+Math.floor(foodN()/eatPerDay())+' days"><i style="width:'+Math.min(100,Math.round(100*used/size))+'%"></i></div>'+
      (tab==='supplies'?suppliesLine():'')+
      '<div class="invgrid">'+P.inv.map((s,i)=>slotHtml(s,i,i<size?'Empty slot':'Overflow slot',[dim(s)?'dim':'',i>=size?'over':''].filter(Boolean).join(' '))).join('')+'</div>'+
      '<div class="invR" aria-live="polite">'+detailHtml()+'</div></div></div>'+nav(null,['inv-close',null,'Back to map']));
  fillIcons();
}
function invAct(a,arg){
  if(!a.startsWith('inv-'))return false;
  if(a==='inv-close'){G.mode='world';hidePanel();return true}
  if(G.mode!=='inv')return true;
  const key=arg!=null&&!String(arg).startsWith('eq:')&&a!=='inv-unequip'&&a!=='inv-tab'?+arg:arg;
  if(a!=='inv-drop')G.invArm=null;
  if(a==='inv-sel')G.invSel=String(G.invSel)===String(key)?null:key;
  else if(a==='inv-tab')G.invTab=arg;
  // (a piece's verbs: its kind's Choices, core/items.js)
  else if(a==='inv-equip'){const s=P.inv[key];if(s&&s.k==='gear'){const tk=targetKey(s.id);if(itemKind(s).verb('equip').perform(key))G.invSel='eq:'+tk}}
  else if(a==='inv-off'){const s=P.inv[key],v=s&&s.k==='gear'&&itemKind(s).verb('off');if(v&&v.perform(key))G.invSel='eq:offhand'}
  else if(a==='inv-unequip'){if(invUnequip(arg))G.invSel=null}
  else if(a==='inv-drop'){if(String(G.invArm)===String(key)){const s=P.inv[key],v=s&&itemKind(s).verb('drop');G.invArm=null;G.invSel=null;if(!s)P.inv[key]=null;else if(v&&v.shown(key))v.perform(key)}else G.invArm=key}
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
  if(k.startsWith('eq:')){if(P.gear[k.slice(3)])invAct('inv-unequip',k.slice(3))}else if(P.inv[+k]&&P.inv[+k].k==='gear')invAct('inv-equip',k);else if(P.inv[+k]&&P.inv[+k].k==='letter')act('ltr-open',P.inv[+k].id)});
onAct('inv-',invAct);
