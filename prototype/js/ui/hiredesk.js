'use strict';
/* ---------- the hiring desk: one way to hire soldiers wherever they are hired (the owner, 2026-10-29: the camp's recruiting the
   same as the barracks). A row for each kind on offer (its face with i for its card, tier, role, price; how many you want with
   − + +5 Max, or typed), the picked one's card beside the list (on a small screen over it, Back the list where you were), and
   the hire bar: what the order costs and does to your band, Fill band (a mix of melee and ranged: RECRUIT_UI.fill), Clear,
   Groups (each kind to its group) and Hire (asked first when it spends more than RECRUIT_UI.ask of your gold). Its acts are
   its prefix's (p: 'rec-' in a town's Barracks, 'site-rec-' at a camp): pick, add, set, clear, fill, groups, hire, hire-ok,
   hire-no, info, info-back. Where it stands gives it its source (src):
     state: the visit's own object (its order: cart, cartTarget; pick, info, recScroll, recBack, recGroups, cartAsk, recruitNotice)
     kinds: the kinds on offer · cost(k) · avail(k): how many of k there are (none: as many as the willing) · willing: how many
       will take your coin · why(k): '' or why not (shown on its row) · line(k): its row's last line · note: under the list
     hire(k, n, group): {ok, cost, why}, the soldiers taken into that group ('new': a new one)
   The order belongs to the visit, never to a save ---------- */
const RECRUIT_UI={fill:.6,ask:.5,step:5};
// (the window's scroll: read, or set)
const panelScroll=v=>{const b=panel.querySelector('.rwbody');if(v===undefined)return b?b.scrollTop:0;if(b)b.scrollTop=v};
class HireDesk{
  constructor(p,src){this.p=p;this.src=src}
  get s(){return this.src.state}
  cart(){const s=this.s;return s.cart||(s.cart={})}
  totals(){const c=this.cart(),ks=Object.keys(c).filter(k=>c[k]>0);return {ks,n:ks.reduce((a,k)=>a+c[k],0),cost:ks.reduce((a,k)=>a+c[k]*this.src.cost(k),0)}}
  // (how many more of one kind you could still add: the willing, your band's room, your gold, how many of it there are)
  room(k){const S=this.src,c=this.cart(),T=this.totals(),mine=c[k]||0,others=T.n-mine,cost=T.cost-mine*S.cost(k),av=S.avail?S.avail(k):Infinity;
    return Math.max(0,Math.min(Math.floor(S.willing||0)-others,partyCap()-partySize()-others,Math.floor((P.gold-cost)/Math.max(1,S.cost(k))),av)-mine)}
  why(k){return this.src.why?this.src.why(k):''}
  btn(a,arg,label,why,cls=''){return '<button class="btn sm'+cls+'" type="button" data-act="'+this.p+a+'" data-arg="'+arg+'"'+(why?' disabled':'')+'>'+label+'</button>'}
  // the list (or, open, a unit's card over it on a small screen) and the hire bar
  body(){const s=this.s;
    if(s.info)return '<div class="rec-info"><div class="btns"><button class="btn" type="button" data-act="'+this.p+'info-back">‹ Back to the list</button></div>'+unitCard(s.info.split('>').pop(),s.info.includes('>')?s.info.split('>')[0]:null)+'</div>';
    const S=this.src,ks=S.kinds,c=this.cart(),kind=s=>s.range?'ranged':s.charge?'mounted':'melee';let pick=s.pick;if(!ks.includes(pick))pick=ks[0]||null;
    const rows=ks.map(k=>{const st=ST[k],n=c[k]||0,why=this.why(k),more=why?0:this.room(k);
      return '<div class="rec-row'+(pick===k?' sel':'')+'" data-act="'+this.p+'pick" data-arg="'+k+'"><button class="rec-pic" type="button" data-act="'+this.p+'info" data-arg="'+k+'" aria-label="'+htmlText(st.n)+': its card"><img src="'+portrait(k)+'" alt=""><span class="rec-badge" aria-hidden="true">i</span></button>'+
        '<div class="rec-txt"><strong>'+glyphSVG(iconOfType(k),14)+' '+st.n+'</strong><small>Tier '+st.tier+(st.race?' · '+RACES[st.race].n:'')+' · '+kind(st)+' · <b class="gold">'+S.cost(k)+'g</b></small><small>'+(why?'<span class="bad">'+why+'</span>':S.line(k))+'</small></div>'+
        '<div class="rec-step">'+this.btn('add',k+':-1','−',!n)+'<input class="rec-n" type="number" inputmode="numeric" min="0" max="'+(n+more)+'" step="1" value="'+n+'" data-qty="'+this.p+'set" data-arg="'+k+'" aria-label="'+htmlText(st.n)+': how many"'+(why?' disabled':'')+'>'+this.btn('add',k+':1','+',!more)+this.btn('add',k+':'+RECRUIT_UI.step,'+'+RECRUIT_UI.step,!more)+this.btn('add',k+':max','Max',!more)+'</div></div>'}).join('');
    return '<div class="recwrap"><div class="reclist"><div class="rec-rows">'+rows+'</div>'+(S.note?'<p class="muted" style="font-size:12px">'+S.note+'</p>':'')+'</div><div class="reccard">'+(pick?unitCard(pick):'')+'</div></div>'+this.bar()}
  // the hire bar: the order's totals, its buttons, the groups (when open) and the question (when it spends much)
  bar(){const s=this.s,T=this.totals(),r=partyRoster(P),c=this.cart(),q=this.check(),p=this.p,opt=(v,n,sel,dis)=>'<option value="'+v+'"'+(sel?' selected':'')+(dis?' disabled':'')+'>'+htmlText(n)+'</option>';
    const groups=s.recGroups&&T.ks.length?'<div class="rec-groups">'+T.ks.map(k=>'<label>'+ST[k].n+' ×'+c[k]+'<select data-recruit-field="cartTarget:'+k+'" aria-label="'+htmlText(ST[k].n)+': group">'+opt('auto','Automatic',!(s.cartTarget||{})[k])+r.groups.filter(g=>g.type===k).map(g=>opt(g.id,(g.name||ST[k].n)+' · '+g.id+' × '+g.count,(s.cartTarget||{})[k]===g.id,r.groupRoom(k,g.id)<c[k])).join('')+opt('new','A new group',(s.cartTarget||{})[k]==='new',r.groupRoom(k,'new')<c[k])+'</select></label>').join('')+'</div>':'';
    const ask=s.cartAsk?'<div class="recruit-confirm" role="status">Spend '+T.cost+'g, more than half your gold?<div class="btns"><button type="button" class="btn primary" data-act="'+p+'hire-ok">Yes, hire</button><button type="button" class="btn" data-act="'+p+'hire-no">Cancel</button></div></div>':'';
    return '<section class="rec-bar" aria-label="Your order"><div class="rec-sum" aria-live="polite">'+(T.n?'Hire <b>'+T.n+'</b> soldier'+(T.n>1?'s':'')+' · <b class="gold">'+T.cost+'g</b> · band '+partySize()+' → '+(partySize()+T.n)+' / '+partyCap():'Choose how many with + and − (or type it), or Fill band.')+(T.n&&!q.ok?' · <span class="bad">'+q.why+'</span>':'')+'</div>'+
      '<div class="btns"><button type="button" class="btn sm" data-act="'+p+'fill"'+(partySize()>=partyCap()?' disabled':'')+'>Fill band</button><button type="button" class="btn sm" data-act="'+p+'clear"'+(T.n?'':' disabled')+'>Clear</button><button type="button" class="btn sm" data-act="'+p+'groups"'+(T.n?'':' disabled')+'>Groups: '+(Object.keys(s.cartTarget||{}).some(k=>c[k])?'chosen':'auto')+(s.recGroups?' ▴':' ▾')+'</button><span class="grow"></span><button type="button" class="btn primary" data-act="'+p+'hire"'+(T.n&&q.ok?'':' disabled')+'>Hire'+(T.n?' · '+T.cost+'g':'')+'</button></div>'+groups+ask+(s.recruitNotice?'<p role="status">'+s.recruitNotice+'</p>':'')+'</section>'}
  // (can the whole order be hired: gold, willing, room in your band, each kind's own rules)
  check(){const T=this.totals(),S=this.src;if(!T.n)return {ok:false,why:''};if(T.cost>P.gold)return {ok:false,why:'Not enough gold'};if(T.n>Math.floor(S.willing||0)||S.avail&&T.ks.some(k=>this.cart()[k]>S.avail(k)))return {ok:false,why:'Not that many willing'};
    if(partySize()+T.n>partyCap())return {ok:false,why:'No room in your band'};const bad=T.ks.find(k=>this.why(k));return bad?{ok:false,why:ST[bad].n+': '+this.why(bad)}:{ok:true}}
  // ---- its acts (a: the act, its prefix taken off)
  act(a,arg){const v=a.slice(this.p.length),f={pick:'pick',add:'add',set:'set',clear:'clear',fill:'fill',groups:'groups',hire:'order','hire-ok':'order','hire-no':'order',info:'info','info-back':'info'}[v];
    if(f)this[f](arg,v);return !!f}
  pick(arg){this.s.pick=arg}
  ok(k){return this.src.kinds.includes(k)&&!this.why(k)}
  add(arg){const [k,n]=String(arg).split(':'),c=this.cart();if(!this.ok(k))return;const more=this.room(k);
    c[k]=Math.max(0,(c[k]||0)+(n==='max'?more:Math.min(+n||0,more)));this.s.cartAsk=false;this.s.recruitNotice=''}
  // (a typed count (k:n): as many as could be hired, none below 0)
  set(arg){const [k,n]=String(arg).split(':'),c=this.cart();if(!this.ok(k))return;
    c[k]=Math.max(0,Math.min(Math.floor(+n)||0,(c[k]||0)+this.room(k)));this.s.cartAsk=false;this.s.recruitNotice=''}
  clear(){const s=this.s;s.cart={};s.cartAsk=false;s.recruitNotice=''}
  groups(){this.s.recGroups=!this.s.recGroups}
  // Fill band: your free places, a mix of the cheapest melee and ranged kinds on offer (RECRUIT_UI.fill melee), as gold and the willing allow
  fill(){this.clear();const S=this.src,ok=S.kinds.filter(k=>!this.why(k)),cheap=l=>l.sort((a,b)=>S.cost(a)-S.cost(b))[0],m=cheap(ok.filter(k=>!ST[k].range)),r=cheap(ok.filter(k=>ST[k].range)),c=this.cart();
    for(let i=0;;i++){const T=this.totals(),k=!r?m:!m?r:(c[m]||0)<Math.ceil((T.n+1)*RECRUIT_UI.fill)?m:r;if(!k||!this.room(k))break;c[k]=(c[k]||0)+1}}
  // Hire: asked first when it spends much; then each kind into its group (chosen, or the one with room, then new ones), all or what could be
  order(arg,v){const s=this.s,T=this.totals();if(v==='hire-no'){s.cartAsk=false;return}if(!this.check().ok)return;
    if(v==='hire'&&T.cost>P.gold*RECRUIT_UI.ask){s.cartAsk=true;return}s.cartAsk=false;let got=0,spent=0,why='';
    for(const k of T.ks){let left=this.cart()[k];const chosen=(s.cartTarget||{})[k];
      while(left>0){const r=partyRoster(P),tgt=chosen||recruitment.rules.target(k),room=r.groupRoom(k,tgt)||0,n=Math.min(left,tgt==='new'?ARMY_GROUP.units:room);if(n<1){why='No room in a group for more '+ST[k].n;break}
        const res=this.src.hire(k,n,tgt);if(!res.ok){why=res.why;break}got+=n;spent+=res.cost;left-=n;this.cart()[k]=left;if(chosen==='new')break}}
    s.recruitNotice=got?'Hired '+got+' soldier'+(got>1?'s':'')+' for '+spent+'g.'+(why?' '+why+'.':''):why;for(const k in this.cart())if(!this.cart()[k])delete this.cart()[k]}
  // a unit's card: beside the list on a wide screen (picked), in the window over it on a small one (Back: the list, where you were)
  info(arg,v){const s=this.s;if(v==='info-back'){s.info=null;s.recBack=true;return}s.pick=arg;if(!window.matchMedia('(max-width:820px),(max-height:600px)').matches)return;s.info=arg;s.recScroll=panelScroll()}
  // (drawn again after an act: back from a card, the list where you left it; a card opened, its top)
  focus(a){const s=this.s,p=this.p;if(a===p+'info-back'&&s.recBack){s.recBack=false;panelScroll(s.recScroll||0);return true}if((a===p+'info'||a===p+'pick')&&s.info){panelScroll(0);return true}return false}
}
