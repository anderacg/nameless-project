'use strict';
/* ---------- the hiring desk: one way to hire soldiers wherever they are hired (the owner, 2026-10-29: the camp's recruiting the
   same as the barracks; 2026-10-31: "newly purchase will always provide 1 full units ... then you have another section to
   replenish your troop", from a pool: "if it has 19 then you can only hire 1 unit and 9 is for replenish"). Two sections:
   New units, a row for each kind on offer (its face with i for its card, tier, role, its unit's men and price; Recruit unit, one
   whole unit of its kind's size, data/units.js unitSize, into a free unit slot), and Replenish, a row for each of your units of a
   kind on offer that is short (its men, its wounded, the men and price to fill it; Refill, as many as the willing and your gold
   allow; Refill all). The picked kind's card beside the list (on a small screen over it, Back the list where you were); asked
   first when a press spends more than RECRUIT_UI.ask of your gold. Its acts are its prefix's (p: 'rec-' in a town's Barracks,
   'site-rec-' at a camp): pick, unit, refill, refillall, ok, no, info, info-back. Where it stands gives it its source (src):
     state: the visit's own object (pick, info, recScroll, recBack, recAsk, recruitNotice) · kinds: the kinds on offer · cost(k):
     a man's price · willing: the pool, how many will take your coin · avail(k): how many of k there are (none: as many as the
     willing) · why(k): '' or why not (shown on its row) · line(k): its row's last line · note: under the list · extra: more of
     Replenish (the barracks: its free volunteers)
     hire(k, n, group): {ok, cost, why}, the soldiers taken into that group ('new': a new unit)
   ---------- */
const RECRUIT_UI={ask:.5};
// (your units and men, for a desk's head: units in their slots, everyone you lead)
const unitsLine=()=>{const r=partyRoster(P);return 'units '+r.slots+' / '+r.groupLimit+' · '+partySize()+' men'};
// (the window's scroll: read, or set)
const panelScroll=v=>{const b=panel.querySelector('.rwbody');if(v===undefined)return b?b.scrollTop:0;if(b)b.scrollTop=v};
class HireDesk{
  constructor(p,src){this.p=p;this.src=src}
  get s(){return this.src.state}
  // (the willing for k: the pool, and as many of k as there are)
  pool(k){const S=this.src;return Math.max(0,Math.min(Math.floor(S.willing||0),S.avail?S.avail(k):Infinity))}
  why(k){return this.src.why?this.src.why(k):''}
  // a new unit of k: its men, its price, or why not
  unit(k){const r=partyRoster(P),n=unitSize(k),cost=n*this.src.cost(k),w=this.why(k);
    return{n,cost,why:w||(r.slots>=r.groupLimit?'No free unit slot (units '+r.slots+' / '+r.groupLimit+')':!r.accepts(k)?'Not in your band':this.pool(k)<n?'Needs '+n+' willing ('+this.pool(k)+' here: they can only refill)':P.gold<cost?'Needs '+cost+'g':'')}}
  // your units it could refill: of a kind on offer, short of their size (wounded count: they come back to it)
  short(){const r=partyRoster(P);return r.groups.filter(g=>this.src.kinds.includes(g.type)&&r.groupRoom(g.type,g.id)>0)}
  // a unit's refill: the men it lacks, how many it gets now (the willing, your gold), their price, or why not
  fill(g){const r=partyRoster(P),k=g.type,need=r.groupRoom(k,g.id),c=this.src.cost(k)+Buffs.perMan(g.id),w=this.why(k),n=Math.min(need,this.pool(k),Math.floor(P.gold/Math.max(1,c)));
    return{need,n,cost:n*c,why:w||(!this.pool(k)?'None willing':n<1?'Needs '+c+'g a man':'')}}
  btn(a,arg,label,why,cls=''){return '<button class="btn sm'+cls+'" type="button" data-act="'+this.p+a+'"'+(arg!=null?' data-arg="'+arg+'"':'')+(why?' disabled title="'+htmlText(why)+'"':'')+'>'+label+'</button>'}
  // the list (or, open, a unit's card over it on a small screen) and the question (when a press spends much)
  body(){const s=this.s;
    if(s.info)return '<div class="rec-info"><div class="btns"><button class="btn" type="button" data-act="'+this.p+'info-back">‹ Back to the list</button></div>'+unitCard(s.info.split('>').pop(),s.info.includes('>')?s.info.split('>')[0]:null)+'</div>';
    const S=this.src,ks=S.kinds,r=partyRoster(P),kind=s=>s.range?'ranged':s.mounted?'mounted':'melee';let pick=s.pick;if(!ks.includes(pick))pick=ks[0]||null;
    const units=ks.map(k=>{const st=ST[k],u=this.unit(k);
      return '<div class="rec-row'+(pick===k?' sel':'')+'" data-act="'+this.p+'pick" data-arg="'+k+'"><button class="rec-pic" type="button" data-act="'+this.p+'info" data-arg="'+k+'" aria-label="'+htmlText(st.n)+': its card"><img src="'+portrait(k)+'" alt=""><span class="rec-badge" aria-hidden="true">i</span></button>'+
        '<div class="rec-txt"><strong>'+glyphSVG(iconOfType(k),14)+' '+st.n+'</strong><small>Tier '+st.tier+(st.race?' · '+raceOf(st.race).n:'')+' · '+kind(st)+' · <b>'+u.n+' men</b> · <b class="gold">'+u.cost+'g</b></small><small>'+S.line(k)+(u.why?' · <span class="bad">'+htmlText(u.why)+'</span>':'')+'</small></div>'+
        '<div class="rec-step">'+this.btn('unit',k,'Recruit unit',u.why,u.why?'':' primary')+'</div></div>'}).join('');
    const gs=this.short(),fills=gs.map(g=>{const f=this.fill(g),n=unitSize(g.type),w=r.wounded(g.id);
      return '<div class="rec-row rec-refill"><div class="rec-txt"><strong>'+groupBadge(g,12)+' '+htmlText(armyGroupLabel(g.id))+'</strong><span class="rec-meter" aria-hidden="true"><i style="width:'+Math.round(g.count/n*100)+'%"></i><b style="width:'+Math.round(w/n*100)+'%"></b></span>'+
        '<small>'+g.count+' / '+n+(w?' · '+w+' wounded':'')+' · needs '+f.need+(f.why?' · <span class="bad">'+htmlText(f.why)+'</span>':f.n<f.need?' · '+f.n+' now':'')+'</small></div>'+
        '<div class="rec-step">'+this.btn('refill',g.id,'Refill'+(f.n?' +'+f.n+' · '+f.cost+'g':''),f.why)+'</div></div>'}).join(''),
      all=gs.map(g=>this.fill(g)).filter(f=>!f.why),allCost=all.reduce((a,f)=>a+f.cost,0);
    const ask=s.recAsk?'<div class="recruit-confirm" role="status">Spend '+s.recAsk.cost+'g, more than half your gold?<div class="btns">'+this.btn('ok',null,'Yes, hire','',' primary')+this.btn('no',null,'Cancel','')+'</div></div>':'';
    return '<div class="recwrap"><div class="reclist">'+ask+(s.recruitNotice?'<p class="rec-notice" role="status">'+s.recruitNotice+'</p>':'')+
      '<div class="lab">New units <small class="muted">each a full unit</small></div><div class="rec-rows">'+units+'</div>'+
      '<div class="lab">Replenish your units</div><div class="rec-rows">'+(S.extra||'')+(fills||'<p class="muted">None of your units of these kinds is short.</p>')+'</div>'+
      (gs.length>1?'<div class="btns rec-all">'+this.btn('refillall',null,'Refill all'+(allCost?' · '+allCost+'g':''),all.length?'':'None can be refilled now')+'</div>':'')+
      (S.note?'<p class="muted" style="font-size:12px">'+S.note+'</p>':'')+'</div><div class="reccard">'+(pick?unitCard(pick):'')+'</div></div>'}
  // ---- its acts (a: the act, its prefix taken off)
  act(a,arg){const v=a.slice(this.p.length),f={pick:'pick',unit:'buy',refill:'buy',refillall:'buy',ok:'buy',no:'buy',info:'info','info-back':'info'}[v];
    if(f)this[f](arg,v);return !!f}
  pick(arg){this.s.pick=arg}
  // Recruit unit, Refill, Refill all: asked first when it spends much (its question's Yes: ok, its No: no)
  buy(arg,v){const s=this.s;if(v==='no'){s.recAsk=null;return}if(v==='ok'){const q=s.recAsk;s.recAsk=null;if(q)this.run(q.v,q.arg);return}
    const cost=v==='unit'?this.unit(arg).cost:v==='refill'?this.fill(partyRoster(P).groups.find(g=>g.id===arg)||{type:''}).cost:this.short().reduce((a,g)=>{const f=this.fill(g);return a+(f.why?0:f.cost)},0);
    if(cost>P.gold*RECRUIT_UI.ask){s.recAsk={v,arg,cost};return}s.recAsk=null;this.run(v,arg)}
  run(v,arg){const s=this.s,r=partyRoster(P);let got=0,spent=0,why='';
    const take=(k,n,g)=>{const res=this.src.hire(k,n,g);if(res.ok){got+=n;spent+=res.cost}else why=res.why;return res.ok};
    if(v==='unit'){const u=this.unit(arg);if(u.why)why=u.why;else take(arg,u.n,'new')}
    else for(const g of v==='refill'?r.groups.filter(g=>g.id===arg):this.short()){const f=this.fill(g);if(f.why){why=why||f.why;continue}if(!take(g.type,f.n,g.id))break;
      const x=f.n*Buffs.perMan(g.id);if(x){P.gold-=x;spent+=x}}// (the new men's share of the unit's upgrades: world/buffs.js)
    s.recruitNotice=got?(v==='unit'?'A new unit of '+got+' '+ST[arg].n+(got>1?'s':'')+' joins you':got+' men join your unit'+(v==='refillall'?'s':''))+' for '+spent+'g.'+(why?' '+why+'.':''):why}
  // a unit's card: beside the list on a wide screen (picked), in the window over it on a small one (Back: the list, where you were)
  info(arg,v){const s=this.s;if(v==='info-back'){s.info=null;s.recBack=true;return}s.pick=arg;if(!window.matchMedia('(max-width:820px),(max-height:600px)').matches)return;s.info=arg;s.recScroll=panelScroll()}
  // (drawn again after an act: back from a card, the list where you left it; a card opened, its top)
  focus(a){const s=this.s,p=this.p;if(a===p+'info-back'&&s.recBack){s.recBack=false;panelScroll(s.recScroll||0);return true}if((a===p+'info'||a===p+'pick')&&s.info){panelScroll(0);return true}return false}
}
