'use strict';
/* ---------- a quest's reward (the owner, 2026-10-31: "when submitting quests make a popup window at the center to show what
   you've received, with icons"): each quest paid (story/quest.js pay) adds its card to one window in the middle of the screen
   over whatever is open (a holding's streets, the map), its gold (a friend's bonus with it), experience, renown, a holding's
   reputation, a realm's honor and the giver's regard, each its icon; Continue (or Esc) closes it. Kinds by QUEST_REWARD:
   icon, label ---------- */
const QUEST_REWARD={gold:['gold','Gold'],bonus:['gold','A friend\'s bonus'],xp:['skills','Experience'],renown:['renown','Renown'],rep:['house','Reputation'],honor:['banner','Honor'],rel:['crown','Regard']};
const QuestReward={el:null,list:[],
  // a quest paid: its title and what it gave ({gold, bonus, xp, renown, rep, at, honor, fac, rel, giver})
  add(title,r){this.list.push({title,r});this.show()},
  open(){return !!this.el&&!this.el.hidden},
  // (one reward: its icon, the amount, what it is and where)
  item(k,n,where){const [ic,lab]=QUEST_REWARD[k];return '<div class="qrw-item">'+icon(ic,28)+'<b>+'+n+'</b><small>'+lab+(where?'<br>'+htmlText(where):'')+'</small></div>'},
  card({title,r}){const it=[r.gold&&this.item('gold',r.gold),r.bonus&&this.item('bonus',r.bonus,r.giver),r.xp&&this.item('xp',r.xp),r.renown&&this.item('renown',r.renown),
      r.rep&&r.at&&this.item('rep',r.rep,r.at),r.honor&&this.item('honor',r.honor,FACS[r.fac]?.n),r.rel&&this.item('rel',r.rel,r.giver)].filter(Boolean).join('');
    return '<div class="qrw-quest"><div class="lab">'+htmlText(title)+'</div><div class="qrw-items">'+it+'</div></div>'},
  show(){let el=this.el;if(!el){el=this.el=document.createElement('div');el.className='overlay qrw';el.id='qreward';ov.parentElement.appendChild(el);
      el.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b){e.stopPropagation();act(b.dataset.act,b.dataset.arg)}})}
    const n=this.list.length;el.innerHTML='<div class="panel qrw-card" role="dialog" aria-label="Quest complete"><div class="top"><h2>'+(n>1?n+' quests complete':'Quest complete')+'</h2></div>'+
      '<div class="qrw-body">'+this.list.map(q=>this.card(q)).join('')+'</div>'+nav(null,['qrw-close',null,'Continue'])+'</div>';el.hidden=false;uiSfx('good')},
  close(){this.list=[];if(this.el){this.el.hidden=true;this.el.innerHTML=''}},
  // (Esc: its Continue, while it is open: ui.js escDismiss)
  esc(){return this.open()?this.el.querySelector('[data-act="qrw-close"]'):null}};
onAct('qrw-',a=>{if(a==='qrw-close')QuestReward.close()});
