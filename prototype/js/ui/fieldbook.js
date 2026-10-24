'use strict';
/* ---------- the field book: shared management-window presentation (doc/FIELDBOOK_UI.md)
   Runtime layout, scroll and choice drafts only. Game commands and their quotes remain in their owning systems. ---------- */
const FIELDBOOK={compact:{w:760,h:520},scroll:new Map(),art:null,emblem:null,pick:null};
onWorld(()=>{FIELDBOOK.scroll.clear();FIELDBOOK.pick=null});
function fbNarrow(){const r=$('#screen').getBoundingClientRect(),s=getComputedStyle(ov);return r.width-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight)<=650}
function fbCompact(){const r=$('#screen').getBoundingClientRect(),s=getComputedStyle(ov);return r.width-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight)<=FIELDBOOK.compact.w||r.height-parseFloat(s.paddingTop)-parseFloat(s.paddingBottom)<=FIELDBOOK.compact.h}
function fbArt(){
  if(FIELDBOOK.art===null){const c=PX.canvas(640,180);new MenuArt.MenuScene(640,180,0).draw(c.getContext('2d', { willReadFrequently: true }),4);FIELDBOOK.art=c.toDataURL();FIELDBOOK.emblem=MenuArt.menuEmblem().toDataURL()}
  panel.style.setProperty('--fb-land','url("'+FIELDBOOK.art+'")');panel.style.setProperty('--fb-emblem','url("'+FIELDBOOK.emblem+'")');
}
const fbIcon=(k,s=18)=>icon(k,s);
// a window's top level (the Game Menu's windows: Army's tabs, Inventory, Quests, the Journal, the full map), opened from the menu or
// by its key: its bar's left button is Back to the Game Menu (ui/hub.js), as Esc on the map opens it; a sub-page keeps its own Back
const fbMenu=back=>back||['fb-menu',null,'Back'];
const fbBtn=(a,arg,label,why,cls='')=>'<button type="button" class="btn sm '+cls+'" data-act="'+a+'"'+(arg!=null?' data-arg="'+htmlText(arg)+'"':'')+(why?' disabled':'')+'>'+label+'</button>';
function fbTabs(items,current,action,label){return '<div class="fb-tabs" role="tablist" aria-label="'+htmlText(label)+'">'+items.map(([id,n])=>'<button type="button" class="btn sm'+(id===current?' on':'')+'" role="tab" aria-selected="'+(id===current)+'" tabindex="'+(id===current?0:-1)+'" data-act="'+action+'" data-arg="'+id+'">'+n+'</button>').join('')+'</div>'}
function fbStat(ico,label,value,tone=''){return '<div class="fb-stat '+tone+'">'+fbIcon(ico)+'<span>'+htmlText(label)+'</span><strong>'+value+'</strong></div>'}
function fbMeter(ico,label,value,max=100,tone=''){const n=clamp(Number(value)||0,0,max),pc=n/Math.max(1,max)*100;return '<div class="fb-meter '+tone+'" role="meter" aria-label="'+htmlText(label)+'" aria-valuemin="0" aria-valuemax="'+max+'" aria-valuenow="'+n+'"><div>'+fbIcon(ico)+'<span>'+htmlText(label)+'</span><b>'+Math.round(n)+(max===100?'%':' / '+max)+'</b></div><div class="fb-bar"><i style="width:'+pc+'%"></i></div></div>'}
const fbDetails=(label,body)=>'<details class="fb-details"><summary>'+label+'</summary>'+body+'</details>';
function fbRewards(r,gold){if(!r)return '';return '<div class="fb-rewards" aria-label="Rewards"><span>Rewards</span>'+[['gold','gold','Gold'],['rep','renown','Reputation'],['honor','crown','Honour'],['xp','skills','Experience']].filter(([k])=>r[k]).map(([k,ic,n])=>{const v=k==='gold'&&gold!=null?gold:r[k];return '<span class="fb-reward" aria-label="'+v+' '+n+'">'+fbIcon(ic,24)+'<b>'+v+'</b><small>'+n+'</small></span>'}).join('')+'</div>'}
function fbRemember(){panel.querySelectorAll('[data-fb-scroll]').forEach(e=>FIELDBOOK.scroll.set(e.dataset.fbScroll,e.scrollTop))}
// (a short landscape screen: a phone on its side)
function fbShort(){const r=$('#screen').getBoundingClientRect(),s=getComputedStyle(ov);return r.height-parseFloat(s.paddingTop)-parseFloat(s.paddingBottom)<=FIELDBOOK.compact.h}
// over: the small line above the title (your band's name unless given); head: the header's own content instead (the Army's muster)
function fbShow(title,sub,tabs,body,back,close,cls='',over=htmlText(bandName()),head=null){
  const active=panel.contains(document.activeElement)?document.activeElement.closest('[data-act]'):null,focus=active?{act:active.dataset.act,arg:active.dataset.arg}:null;fbRemember();showPanel('<section class="fb-shell '+cls+'"><header class="top fb-head">'+(head||'<div><small>'+over+'</small><h2>'+title+'</h2></div><span class="muted">'+sub+'</span>')+'</header>'+tabs+'<div class="fb-body">'+body+'</div></section>'+nav(back,close));
  panel.classList.add('wide');fbArt();panel.querySelectorAll('[data-fb-scroll]').forEach(e=>e.scrollTop=FIELDBOOK.scroll.get(e.dataset.fbScroll)||0);if(focus){const b=panel.querySelector('[data-act="'+CSS.escape(focus.act)+'"]'+(focus.arg!=null?'[data-arg="'+CSS.escape(focus.arg)+'"]':''));if(b&&!b.disabled&&b.getClientRects().length)b.focus({preventScroll:true})}
}
function fbQuantity(value,max,attrs,label='Fit soldiers',min=1){return '<label class="fb-quantity"><span>'+label+'</span><span class="fb-quantity-controls">'+fbBtn('fb-qty','-1','−',value<=min?'At the minimum':'','fb-square')+'<input type="number" inputmode="numeric" min="'+min+'" max="'+max+'" step="1" value="'+value+'" aria-label="'+label+'" '+attrs+'>'+fbBtn('fb-qty','1','+',value>=max?'At the maximum':'','fb-square')+fbBtn('fb-qty','max','Max',max<min?'None available':'')+'</span></label>'}
/* A choice is a page, never a dropdown. Closing preserves the original value; Apply is its sole commit. */
function fbChoose(o){fbRemember();FIELDBOOK.pick={o,mode:G.mode,value:o.value};fbChoiceShow()}
function fbChoiceShow(){
  const p=FIELDBOOK.pick;if(!p||G.mode!==p.mode)return;const o=p.o,chosen=o.items.find(x=>String(x.id)===String(p.value));
  const cards=o.items.map(x=>'<button type="button" class="fb-choice'+(String(x.id)===String(p.value)?' on':'')+'" data-act="fb-choice" data-arg="'+htmlText(x.id)+'" aria-pressed="'+(String(x.id)===String(p.value))+'"'+(x.why?' disabled':'')+'>'+(x.pic?'<img src="'+x.pic+'" alt="">':fbIcon(x.ico||'banner',26))+'<span><strong>'+htmlText(x.name)+'</strong>'+(x.sub?'<small>'+htmlText(x.sub)+'</small>':'')+(x.why?'<small class="bad">'+htmlText(x.why)+'</small>':'')+'</span><b aria-hidden="true">'+(String(x.id)===String(p.value)?'✓':'○')+'</b></button>').join('');
  fbShow(o.title,o.sub||'Choose, then confirm','', '<div class="fb-scroll fb-choice-list" data-fb-scroll="choice:'+o.title+'">'+cards+(chosen&&chosen.note?'<p class="fb-note">'+htmlText(chosen.note)+'</p>':'')+'</div>',['fb-cancel',null,'Cancel'],['fb-apply',null,o.confirm||'Apply',!chosen||chosen.why?'Choose an available option':''],'fb-picker');
}
function fbChoiceClose(apply){const p=FIELDBOOK.pick;if(!p||G.mode!==p.mode)return;const x=p.o.items.find(i=>String(i.id)===String(p.value));if(apply&&(!x||x.why))return;FIELDBOOK.pick=null;if(apply)p.o.apply(x.id);else p.o.back();const b=p.o.focus&&panel.querySelector(p.o.focus);if(b)b.focus({preventScroll:true})}
onAct('fb-',(a,arg)=>{
  const p=FIELDBOOK.pick;
  if(a==='fb-choice'&&p&&G.mode===p.mode){const x=p.o.items.find(i=>String(i.id)===String(arg));if(x&&!x.why){p.value=x.id;fbChoiceShow()}return}
  if(a==='fb-cancel')return fbChoiceClose(false);
  if(a==='fb-apply')return fbChoiceClose(true);
  // (Back to the Game Menu: the window closed by its way out, then the Game Menu over the map or the streets)
  if(a==='fb-menu'){const c=panel.querySelector('.nav [data-nav="close"]:not([disabled])');if(c)act(c.dataset.act,c.dataset.arg);if(!G.modal&&['world','scene'].includes(G.mode))showEsc();return}
});
// Quantity controls keep each form's existing change handler and validation.
panel.addEventListener('click',e=>{const b=e.target.closest('[data-act="fb-qty"]');if(!b||b.disabled)return;const box=b.closest('.fb-quantity'),input=box&&box.querySelector('input');if(!input)return;const min=+input.min,max=+input.max,old=Number(input.value)||min;input.value=b.dataset.arg==='max'?max:clamp(old+Number(b.dataset.arg),min,max);input.dispatchEvent(new Event('change',{bubbles:true}));box.querySelectorAll('[data-act="fb-qty"]').forEach(x=>x.disabled=x.dataset.arg==='-1'?+input.value<=min:x.dataset.arg==='1'?+input.value>=max:max<min)});
panel.addEventListener('keydown',e=>{const b=e.target.closest('[role="tab"][data-act]');if(!b||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();e.stopPropagation();const bs=[...b.parentElement.querySelectorAll('[role="tab"]')],i=bs.indexOf(b),n=e.key==='Home'?0:e.key==='End'?bs.length-1:(i+(e.key==='ArrowRight'?1:-1)+bs.length)%bs.length,x=bs[n],a=x.dataset.act,arg=x.dataset.arg;act(a,arg);panel.querySelector('[data-act="'+a+'"][data-arg="'+CSS.escape(arg)+'"]')?.focus({preventScroll:true})});
