'use strict';
/* Campaign chrome: live resources and a shared, clickable canvas minimap slot. */
class CampaignHud{
  constructor(){
    this.screen=$('#screen');this.root=document.createElement('div');this.root.className='campaign-chrome';
    this.root.innerHTML='<div class="campaign-rail"><div class="campaign-brand"><span aria-hidden="true">✠</span> ASHMARK<small>THE CAMPAIGN</small></div><div class="campaign-resources" role="group" aria-label="Company supplies"></div></div><button type="button" class="campaign-warning" hidden></button><div class="campaign-console" aria-hidden="true"><span>◆</span></div><div class="campaign-survey"><span aria-hidden="true">N</span><button type="button" class="campaign-mini-slot" aria-label="Open full map"></button><small aria-hidden="true">LOCAL MAP</small></div><button class="campaign-details" type="button" aria-controls="stats" aria-expanded="false">Company details ▴</button>';
    $('.hudlayer').appendChild(this.root);this.resources=this.root.querySelector('.campaign-resources');this.slot=this.root.querySelector('.campaign-mini-slot');this.details=this.root.querySelector('.campaign-details');this.warning=this.root.querySelector('.campaign-warning');
    this.help=document.getElementById('helpBtn');this.helpHome=document.createComment('campaign help home');this.help.before(this.helpHome);
    this.root.querySelector('.campaign-brand').innerHTML=this.art([45,3,268,91],'campaign-banner');
    const mapArt=[727,783,70,66];
    this.commandArt=[['campBtn',[608,783,65,66]],['mapBtn',mapArt],['mapToggle',mapArt],['charBtn',[847,784,68,66]],['skillBtn',[978,783,70,66]],['invBtn',[1091,784,69,67]],['journalBtn',[1211,783,72,68]]];
    this.townCard=document.createElement('aside');this.townCard.className='campaign-town';this.townCard.hidden=true;this.townCard.setAttribute('aria-label','Nearby holding');this.root.appendChild(this.townCard);
    this.townCard.addEventListener('click',e=>{const b=e.target.closest('[data-town-action]');if(!b||!this.town||G.mode!=='world'||G.modal)return;if(b.dataset.townAction==='approach')worldApproach(this.town);else fullMapOpen({x:this.town.x/TILE,y:this.town.y/TILE});this.sync()});
    this.details.textContent='⋯';this.details.setAttribute('aria-label','Company details');this.details.title='Company details';
    this.mobileMini=document.createElement('button');this.mobileMini.type='button';this.mobileMini.className='campaign-mobile-survey';this.mobileMini.hidden=true;this.mobileMini.setAttribute('aria-label','Open full map');$('.hudlayer').appendChild(this.mobileMini);this.mobileMini.addEventListener('click',()=>document.getElementById('mapBtn').click());
    this.slot.addEventListener('click',()=>document.getElementById('mapBtn').click());
    this.warning.addEventListener('click',()=>document.getElementById('invBtn').click());
    this.details.addEventListener('click',()=>{const open=this.screen.classList.toggle('company-details');this.details.setAttribute('aria-expanded',String(open));this.details.textContent=open?'×':'⋯'});
  }
  art(box,cls){return '<svg class="'+cls+'" viewBox="'+box.join(' ')+'" aria-hidden="true" focusable="false"><image href="art/ui/campaign-art.png" width="1672" height="941"/></svg>'}
  get phone(){return G.mode==='world'&&!G.modal&&!!window.mobileWorldHud?.media.matches}
  get desktop(){return G.mode==='world'&&!G.modal&&!window.mobileWorldHud?.media.matches}
  sync(){this.mobileMini.hidden=!this.phone;if(!this.iconsReady){for(const [id,box] of this.commandArt)document.getElementById(id).insertAdjacentHTML('afterbegin',this.art(box,'campaign-command-art'));this.iconsReady=true}this.screen.classList.toggle('campaign-world',G.mode==='world'&&!G.modal);const home=this.desktop?document.querySelector('.dockrow.sys'):this.helpHome.parentNode;if(this.help.parentNode!==home){if(this.desktop)home.appendChild(this.help);else this.helpHome.after(this.help)}}
  update(S,cnt){
    this.sync();
    if(G.mode!=='world')return;
    const days=n=>(n>=10?Math.floor(n):Math.floor(n*10)/10)+'d';
    const art={gold:[382,14,43,43],troops:[575,16,42,42],food:[786,12,43,44],mug:[1006,12,44,44]};
    const cell=(ic,label,value,title,warn,coverage)=>'<div class="campaign-resource'+(warn?' warn':'')+'" title="'+htmlText(title)+'">'+this.art(art[ic],'campaign-resource-art')+'<span><small>'+label+'</small><b>'+value+'</b>'+(coverage!=null?'<i class="campaign-supply-track" aria-hidden="true"><em style="width:'+Math.min(100,Math.max(0,coverage/3*100))+'%"></em></i>':'')+'</span></div>';
    setHtml(this.resources,cell('gold','Gold',P.gold,'Your gold')+cell('troops','Company',cnt,'Your company’s troop count')+cell('food','Food',days(S.foodDays),'Food remaining at the current consumption rate',S.foodDays<1,S.foodDays)+cell('mug','Drink',days(S.drinkDays),'Drink remaining at the current consumption rate',S.drinkDays<1,S.drinkDays));
    this.warning.hidden=S.drinkDays>=1&&S.foodDays>=1;
    setHtml(this.warning,icon(S.drinkDays<1?'mug':'food',18)+'<span>'+(S.drinkDays<1?'Drink':'Food')+' running low</span>'+icon('bag',18));
    this.warning.setAttribute('aria-label',(S.drinkDays<1?'Drink':'Food')+' running low. Open inventory');
    for(const bar of document.querySelectorAll('#stats .bar'))bar.style.setProperty('--fill',parseFloat(bar.querySelector('i').style.width)/100);
    this.updateTown();
    this.slot.style.aspectRatio=MW+'/'+MH;
  }
  updateTown(){
    const focus=[G.chase,typeof WUI!=='undefined'?WUI.hov:null].find(o=>o&&objKind(o)==='town'),near=Spatial.nearestHolding(P.x,P.y,t=>!t.gone);
    const t=focus||near&&Math.hypot(near.x-P.x,near.y-P.y)<=Math.max(180,worldBattleReach(near)*2)&&near;
    this.town=t&&t.inView(vis())?t:null;this.townCard.hidden=!this.town;if(!this.town)return;
    const gate=Gates.admits(t),hostile=foeAt(t),closed=closedNow(t),open=gate.ok&&!hostile&&!closed,close=Math.hypot(t.x-P.x,t.y-P.y)<=worldBattleReach(t),realm=t.owner&&FACS[t.owner],name=htmlText(t.name);
    setHtml(this.townCard,'<header>'+this.art([1340,365,83,90],'campaign-town-crest')+'<div><small>NEARBY HOLDING</small><h3>'+name+'</h3></div></header><div class="campaign-town-line">'+icon('house',18)+'<span>'+htmlText(t.T.n)+' · '+htmlText(realm?realm.n:'Free folk')+'</span></div><div class="campaign-town-line">'+icon('troops',18)+'<span>Garrison <b>'+t.gar+'</b></span></div><div class="campaign-town-line">'+icon('banner',18)+'<span>Gate <b class="'+(open?'good':'gold')+'">'+(hostile?'Hostile':closed?'Closed':gate.ok?'Open':'Restricted')+'</b></span></div><footer><button type="button" data-town-action="approach">'+(close&&open?'Enter '+htmlText(t.T.n):'Approach gate')+'</button><button type="button" data-town-action="map" aria-label="Show '+name+' on the map">'+icon('eye',20)+'</button></footer>');
  }
  presentMini(face){
    let target;if(this.desktop)target=this.slot;else if(this.phone){
      target=this.mobileMini;const r=worldMiniRect(),c=cv.getBoundingClientRect(),host=target.parentNode.getBoundingClientRect(),k=c.width/VW;
      const rim=Math.max(1,Math.min(Math.max(8,Math.ceil(UW_FRAME*k)),Math.floor(r.y*k),Math.floor((VW-r.x-r.w)*k)));
      target.style.setProperty('--phone-map-rim',rim+'px');target.style.left=c.left-host.left+r.x*k-rim+'px';target.style.top=c.top-host.top+r.y*k-rim+'px';target.style.width=r.w*k+2*rim+'px';target.style.height=r.h*k+2*rim+'px';
    }
    if(target&&face.parentNode!==target){face.setAttribute('aria-hidden','true');target.replaceChildren(face)}
  }
  miniRect(){
    if(!this.desktop)return null;const r=this.slot.getBoundingClientRect(),c=cv.getBoundingClientRect();if(!r.width||!c.width)return null;
    const k=VW/c.width,w=Math.round(r.width*k),h=Math.round(r.height*k);
    return{x:Math.round((r.left-c.left)*k),y:Math.round((r.top-c.top)*k),w,h,s:w/MW};
  }
}
window.campaignHud=document.getElementById('screen')?new CampaignHud():null;
