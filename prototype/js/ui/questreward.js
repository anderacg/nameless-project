'use strict';
/* ---------- a quest's reward (the owner, 2026-10-31: "when submitting quests make a popup window at the center to show what
   you've received, with icons"; "show item rewards in the popup too"): each quest paid adds its card to one window in the
   middle of the screen over whatever is open (a holding's streets, the map), a job's (story/quest.js pay: its gold, a friend's
   bonus, experience, renown, a holding's reputation, a realm's honor, the giver's regard) or a story's and a step's
   (story/forms.js end, story/steps.js pay: what its outcome gave, story/outcome.js: gold, gear, goods, troops, a companion and
   the rest), each its icon (an item its own picture); Continue (or Esc) closes it. A reward: [icon, amount, label, where]; an
   icon an ICONS name or an item's 'k:id'. Kinds by QUEST_REWARD: icon, label ---------- */
const QUEST_REWARD={gold:['gold','Gold'],bonus:['gold','A friend\'s bonus'],xp:['skills','Experience'],renown:['renown','Renown'],rep:['house','Reputation'],honor:['banner','Honor'],
  rel:['crown','Regard'],troops:['troops','Joins your band'],companion:['hero','Joins your band'],morale:['morale','Morale']};
const QuestReward={el:null,list:[],
  // a quest paid: its title and its rewards
  add(title,items){items=items.filter(x=>x&&x[1]!==0&&x[1]!==null);if(!items.length)return;this.list.push({title,items});this.show()},
  // (a job's: its gold, a friend's bonus, experience, renown, reputation, honor, regard)
  job(title,r){const K=QUEST_REWARD,it=(k,n,where)=>n?[K[k][0],n,K[k][1],where]:null;
    this.add(title,[it('gold',r.gold),it('bonus',r.bonus,r.giver),it('xp',r.xp),it('renown',r.renown),r.at&&it('rep',r.rep,r.at),it('honor',r.honor,FACS[r.fac]?.n),it('rel',r.rel,r.giver)])},
  // (a story's or a step's: its outcome o and what came of it, res; only what you gain)
  outcome(title,o,res){const K=QUEST_REWARD,it=(k,n,where)=>n>0?[K[k][0],n,K[k][1],where]:null,out=[];
    if(o.gold)out.push(it('gold',Outcome.amount(o.gold)));
    if(res.gear)out.push(['gear:'+res.gear,1,ITEMS[res.gear].n]);
    for(const [g,n] of Object.entries(res.goods||{}))if(n>0)out.push(['good:'+g,n,GOODS[g].n]);
    for(const [k,n] of Object.entries(o.troops||{}))out.push(it('troops',n,ST[k].n));
    if(o.companion&&COMPS[o.companion.id])out.push(['hero',1,COMPS[o.companion.id].short,'Joins your band']);
    if(o.xp)out.push(it('xp',o.xp));if(o.renown)out.push(it('renown',o.renown));
    if(o.rep)out.push(it('rep',o.rep[1],o.rep[0]));if(o.honor)out.push(it('honor',o.honor[1],FACS[o.honor[0]]?.n));if(o.rel)out.push(it('rel',o.rel[1],o.rel[0]));
    this.add(title,out)},
  open(){return !!this.el&&!this.el.hidden},
  // (one reward: its icon (an item's picture: loot.js fillIcons), the amount, what it is and where)
  item([ic,n,lab,where]){return '<div class="qrw-item">'+(ic.includes(':')?'<span data-icon="'+ic+'"></span>':icon(ic,28))+'<b>+'+n+'</b><small>'+htmlText(lab)+(where?'<br>'+htmlText(where):'')+'</small></div>'},
  card({title,items}){return '<div class="qrw-quest"><div class="lab">'+htmlText(title)+'</div><div class="qrw-items">'+items.map(x=>this.item(x)).join('')+'</div></div>'},
  show(){let el=this.el;if(!el){el=this.el=document.createElement('div');el.className='overlay qrw';el.id='qreward';ov.parentElement.appendChild(el);
      el.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b){e.stopPropagation();act(b.dataset.act,b.dataset.arg)}})}
    const n=this.list.length;el.innerHTML='<div class="panel qrw-card" role="dialog" aria-label="Quest complete"><div class="top"><h2>'+(n>1?n+' quests complete':'Quest complete')+'</h2></div>'+
      '<div class="qrw-body">'+this.list.map(q=>this.card(q)).join('')+'</div>'+nav(null,['qrw-close',null,'Continue'])+'</div>';fillIcons(el);el.hidden=false;uiSfx('good')},
  close(){this.list=[];if(this.el){this.el.hidden=true;this.el.innerHTML=''}},
  // (Esc: its Continue, while it is open: ui.js escDismiss)
  esc(){return this.open()?this.el.querySelector('[data-act="qrw-close"]'):null}};
onAct('qrw-',a=>{if(a==='qrw-close')QuestReward.close()});
