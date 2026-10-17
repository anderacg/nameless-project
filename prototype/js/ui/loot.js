'use strict';
/* ---------- the spoils: what a fight brought in, and what you choose to carry away ---------- */
// lootStart() snapshots your gold, XP, renown, bag and prisoners and opens a pile: while it is collecting, everything a
// fight pays out in things (drops, trophies, hoards, cargo, chests, arrows gathered from the field) lands on the pile instead
// of in your bag (invAdd sends it there). lootShow() then lays the pile beside your bag: take what you want while there is
// room, put things from your bag back on the pile to make room, and leave the rest. Gold, XP, renown and prisoners are
// counted from the snapshot. Leaving things behind is your choice, so Esc never does it for you.
const xpTotal=()=>{let n=P.xp;for(let l=1;l<P.level;l++)n+=l*60;return n};
function lootSnap(){return{gold:P.gold,xp:xpTotal(),lv:P.level,renown:P.renown,pris:{...P.prisoners}}}
function lootStart(){if(!G.loot)G.loot={from:lootSnap(),pile:[],capture:true};return G.loot}
const looting=()=>!!(G.loot&&G.loot.capture);
// onto the pile: goods and trophies stack; each piece of gear is its own
function lootPile(k,id,n){const p=G.loot.pile;if(n<=0)return;if(k==='gear'){for(let i=0;i<n;i++)p.push({k,id,n:1});return}const x=p.find(s=>s.k===k&&s.id===id);if(x)x.n+=n;else p.push({k,id,n})}
// gear first, best first; then trophies, then goods
const lootRank=s=>s.k==='gear'?100+itemRank(ITEMS[s.id]):s.k==='mat'?50+MATS[s.id].v/10:GOODS[s.id].base/10;
// how many of a pile entry your bag can take now
function lootRoom(s){const max=stackOf(s.k,s.id);let r=0;for(const x of P.inv)r+=!x?max:x.k===s.k&&x.id===s.id&&max>1?max-x.n:0;return Math.min(s.n,r)}
const lootDesc=s=>{const def=itemDef(s);return s.k==='gear'?cap1(ITEMS[s.id].r)+' '+kindLabel(ITEMS[s.id]):s.k==='mat'?'Trophy · '+MATS[s.id].v+'g':'Goods · '+def.stack+' a slot'};
function lootTile(s,i){
  const def=itemDef(s),rc=s.k==='gear'?RARITY[ITEMS[s.id].r]:'',room=lootRoom(s);
  return '<button class="loot-item" type="button" data-act="lt-take" data-arg="'+i+'"'+(room?' title="Take '+(room<s.n?room+' of ':'')+def.n+'"':' disabled title="No room in your bag"')+'>'+
    '<span class="slot" style="'+(rc?'--rc:'+rc:'')+'"><span data-icon="'+s.k+':'+s.id+'"></span>'+(s.n>1?'<b class="cnt">'+s.n+'</b>':'')+'</span>'+
    '<span><strong'+(rc?' style="color:'+rc+'"':'')+'>'+def.n+(s.n>1?' ×'+s.n:'')+'</strong><small>'+lootDesc(s)+(room?'':' · no room')+'</small></span></button>';
}
// the summary: what you gained or lost, the pile, your bag, then your band's losses
function lootHtml(lost,saved){
  const L=G.loot;if(!L)return '';
  const a=L.from,b=lootSnap(),chips=[],sign=n=>(n>0?'+':'−')+Math.abs(n);
  if(b.gold!==a.gold)chips.push(['Gold',sign(b.gold-a.gold),b.gold>a.gold?'gold':'bad']);
  if(b.xp>a.xp)chips.push(['XP','+'+(b.xp-a.xp)+(b.lv>a.lv?' · level '+b.lv+'!':''),b.lv>a.lv?'gold':'']);
  if(b.renown!==a.renown)chips.push(['Renown',sign(b.renown-a.renown),'']);
  const pk=[...new Set([...Object.keys(a.pris),...Object.keys(b.pris)])],pd=pk.map(k=>[k,(b.pris[k]||0)-(a.pris[k]||0)]).filter(([,n])=>n),pn=pd.reduce((s,[,n])=>s+n,0);
  if(pd.length)chips.push(['Prisoners',pn>0?'+'+pn+' ('+pd.filter(([,n])=>n>0).map(([k,n])=>n+' '+ST[k].n.toLowerCase()).join(', ')+')':pn<0?sign(pn)+', escaped':'±0',pn>0?'good':'bad']);
  L.pile.sort((x,y)=>lootRank(y)-lootRank(x));
  const losses=lost&&Object.keys(lost).filter(k=>lost[k]>0),used=P.inv.filter(Boolean).length;
  return (chips.length?'<div class="lab">Spoils</div><div class="loot-stats">'+chips.map(([n,v,c])=>'<span><b>'+n+'</b><span class="'+c+'">'+v+'</span></span>').join('')+'</div>':'')+
    (L.pile.length?'<div class="lab">On the ground · click to take</div><div class="loot">'+L.pile.map(lootTile).join('')+'</div>':L.took?'<p class="muted">You took everything.</p>':'<p class="muted">No goods or gear to take.</p>')+
    (L.pile.length||L.took?'<div class="lab">Your bag · '+used+' / '+P.inv.length+' · click something to put it back</div><div class="invgrid">'+P.inv.map((s,i)=>s?
      '<button class="slot" type="button" data-act="lt-drop" data-arg="'+i+'" title="Put '+itemDef(s).n+' back"'+(s.k==='gear'?' style="--rc:'+RARITY[ITEMS[s.id].r]+'"':'')+'><span data-icon="'+s.k+':'+s.id+'"></span>'+(s.n>1?'<b class="cnt">'+s.n+'</b>':'')+'</button>':'<span class="slot empty"></span>').join('')+'</div>':'')+
    (lost?'<div class="lab">Your losses</div><p class="'+(losses.length?'':'muted')+'" style="font-size:14px">'+(losses.length?lossText(lost):'None.')+(saved?' '+saved+' more were wounded but saved by your medicine.':'')+'</p>':'');
}
// the end-of-fight panel: head (the story), the spoils, and the way on (next: the action that continues)
function lootShow(head,lost,saved,next,report){lootStart();G.loot.capture=false;G.lootView={head,lost,saved,next};if(report)G.lootView.report=report;renderLoot()}
function battleReportHtml(report){
  if(!report)return '';
  const rows=report.groups||[],characters=report.characters||[];
  const best=report.best;// (the unit of the battle: resolution.js)
  return '<section class="battle-report" aria-label="Army battle report"><div class="lab">Your army · battle report</div>'+
    (best?'<p class="battle-best" data-best-group="'+htmlText(best.id)+'"><b>Unit of the battle:</b> '+htmlText(best.name)+' — '+(best.kills?best.kills+' kill'+(best.kills>1?'s':''):best.damage+' damage dealt')+'</p>':'')+
    (rows.length?'<p class="muted">Fit includes soldiers returned immediately by medicine. Wounded are new injuries from this battle; earlier wounded are not included.</p><div class="battle-report-scroll" tabindex="0" role="region" aria-label="Troop group outcomes"><table><thead><tr><th scope="col">Group</th><th scope="col">Started</th><th scope="col">Fit</th><th scope="col">Wounded</th><th scope="col">Killed</th></tr></thead><tbody>'+rows.map(g=>
      '<tr data-report-group="'+htmlText(g.id)+'"><th scope="row">'+htmlText(g.name)+'<small>'+htmlText(ST[g.type]?.n||g.type)+' · '+htmlText(g.id)+'</small>'+
      (g.saved||g.rearguard?'<small>'+[g.saved?g.saved+' returned by medicine':'',g.rearguard?g.rearguard+' killed in rearguard':''].filter(Boolean).join(' · ')+'</small>':'')+'</th>'+
      '<td>'+g.start+'</td><td>'+g.fit+'</td><td class="'+(g.wounded?'gold':'muted')+'">'+g.wounded+'</td><td class="'+(g.killed?'bad':'muted')+'">'+g.killed+'</td></tr>').join('')+'</tbody></table></div>':'<p class="muted">No troop groups took part.</p>')+
    (characters.length?'<div class="battle-report-characters">'+characters.map(c=>'<span>'+htmlText(c.name)+' · <strong>'+htmlText(c.status)+'</strong></span>').join('')+'</div><p class="muted">Character condition at field exit; heroes and companions are not counted as killed.</p>':'')+'</section>';
}
function renderLoot(){
  const V=G.lootView,L=G.loot;if(!V||!L)return;const n=L.pile.reduce((a,s)=>a+s.n,0),any=L.pile.some(lootRoom);
  showPanel(V.head+battleReportHtml(V.report)+lootHtml(V.lost,V.saved)+(L.pile.length?'<div class="btns"><button class="btn primary" type="button" data-act="lt-all"'+(any?'':' disabled title="No room in your bag"')+'>Take all that fits</button></div>'+nav(null,['lt-leave',null,'Continue · leave '+n+' behind',null,true])
    :nav(null,[V.next,null,V.next==='back-town'?'Back to town':'Continue'])));
  fillIcons();updateHUD(true);
}
// done with the spoils (continuing, or leaving the rest)
const lootEnd=()=>{G.loot=null;G.lootView=null};
function lootAct(a,arg){
  const L=G.loot,V=G.lootView;if(!L||!V)return;
  const take=s=>{const n=lootRoom(s);if(!n)return 0;const got=invAdd(s.k,s.id,n);s.n-=got;if(got)L.took=true;return got};
  if(a==='lt-take'){const s=L.pile[+arg];if(s){take(s);L.pile=L.pile.filter(x=>x.n>0)}}
  if(a==='lt-all'){for(const s of L.pile)take(s);L.pile=L.pile.filter(x=>x.n>0)}
  if(a==='lt-drop'){const s=P.inv[+arg];if(s){P.inv[+arg]=null;if(s.k==='gear')L.pile.push({k:'gear',id:s.id,n:1});else{const x=L.pile.find(p=>p.k===s.k&&p.id===s.id);if(x)x.n+=s.n;else L.pile.push({...s})}}}
  if(a==='lt-leave'){const left=L.pile.map(s=>(s.n>1?s.n+' ':'')+itemDef(s).n.toLowerCase());if(left.length)log('You leave '+left.join(', ')+' behind.','bad');const next=V.next;lootEnd();return act(next)}
  renderLoot();
}
onAct('lt-',lootAct);
// turn the panel's [data-icon] placeholders into item icons
function fillIcons(root){
  (root||panel).querySelectorAll('[data-icon]').forEach(e=>{const [k,id]=e.dataset.icon.split(':'),src=itemIcon(itemDef({k,id})),c=document.createElement('canvas'),z=e.closest('.ring')?18:26;
    c.width=z;c.height=z;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(src,0,0,z,z);c.setAttribute('aria-hidden','true');e.replaceWith(c)});
}
