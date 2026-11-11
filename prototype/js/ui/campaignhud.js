'use strict';
/* Campaign chrome: live resources and a shared, clickable canvas minimap slot. */
class CampaignHud{
  constructor(){
    this.screen=$('#screen');this.root=document.createElement('div');this.root.className='campaign-chrome';
    this.root.innerHTML='<div class="campaign-rail"><button type="button" class="campaign-brand" aria-label="Your army"></button><div class="campaign-resources" role="group" aria-label="Company supplies"></div></div><div class="campaign-console" aria-hidden="true"><span>◆</span></div><div class="campaign-survey"><span aria-hidden="true">N</span><button type="button" class="campaign-mini-slot" aria-label="Open full map"></button><small aria-hidden="true">LOCAL MAP</small></div><button class="campaign-details" type="button" aria-controls="stats" aria-expanded="false">Company details ▴</button>';
    $('.hudlayer').appendChild(this.root);this.resources=this.root.querySelector('.campaign-resources');this.slot=this.root.querySelector('.campaign-mini-slot');this.details=this.root.querySelector('.campaign-details');this.brand=this.root.querySelector('.campaign-brand');
    this.help=document.getElementById('helpBtn');this.helpHome=document.createComment('campaign help home');this.help.before(this.helpHome);
    this.brand.addEventListener('click',()=>act('nm-open'));
    this.resources.addEventListener('click',e=>{if(e.target.closest('[data-supply]'))document.getElementById('invBtn').click()});
    this.commandArt=[['campBtn','fire'],['mapBtn','map'],['mapToggle','map'],['charBtn','troops'],['skillBtn','skills'],['invBtn','bag'],['journalBtn','book']];
    this.townCard=document.createElement('aside');this.townCard.className='campaign-town';this.townCard.hidden=true;this.townCard.setAttribute('aria-label','Nearby holding');this.root.appendChild(this.townCard);
    this.townCard.addEventListener('click',e=>{const b=e.target.closest('[data-town-action]');if(!b||!this.town||G.mode!=='world'||G.modal)return;if(b.dataset.townAction==='approach')worldApproach(this.town);else fullMapOpen({x:this.town.x/TILE,y:this.town.y/TILE});this.sync()});
    this.details.textContent='⋯';this.details.setAttribute('aria-label','Company details');this.details.title='Company details';
    this.mobileMini=document.createElement('button');this.mobileMini.type='button';this.mobileMini.className='campaign-mobile-survey';this.mobileMini.hidden=true;this.mobileMini.setAttribute('aria-label','Open full map');$('.hudlayer').appendChild(this.mobileMini);this.mobileMini.addEventListener('click',()=>document.getElementById('mapBtn').click());
    this.slot.addEventListener('click',()=>document.getElementById('mapBtn').click());
    this.details.addEventListener('click',()=>{const open=this.screen.classList.toggle('company-details');this.details.setAttribute('aria-expanded',String(open));this.details.textContent=open?'×':'⋯'});
  }
  art(name,cls){return icon(name,52,cls)}
  condition(kind,value){
    const names={fit:'Fitness',mor:'Morale',sta:'Stamina'},arts={fit:'fitness',mor:'morale',sta:'stamina'},v=Math.max(0,Math.min(100,Math.round(value))),bad=kind==='fit'&&v<50||kind==='mor'&&v<30||kind==='sta'&&v<SUPPLY.exhausted,warn=kind==='sta'&&v<SUPPLY.tired;
    return '<span class="campaign-condition'+(bad?' condition-bad':warn?' condition-warn':'')+'" data-condition="'+kind+'">'+this.art(arts[kind],'campaign-condition-art')+'<span class="campaign-condition-name">'+names[kind]+'</span><span class="campaign-condition-gauge" aria-hidden="true"><span class="campaign-condition-fill" style="width:'+v+'%"></span></span><strong>'+v+'%</strong></span>';
  }
  get phone(){return G.mode==='world'&&!G.modal&&!!window.mobileWorldHud?.media.matches}
  get desktop(){return G.mode==='world'&&!G.modal&&!window.mobileWorldHud?.media.matches}
  sync(){this.mobileMini.hidden=!this.phone;if(!this.iconsReady){for(const [id,box] of this.commandArt)document.getElementById(id).insertAdjacentHTML('afterbegin',this.art(box,'campaign-command-art'));this.iconsReady=true}this.screen.classList.toggle('campaign-world',G.mode==='world'&&!G.modal);const home=this.desktop?document.querySelector('.dockrow.sys'):this.helpHome.parentNode;if(this.help.parentNode!==home){if(this.desktop)home.appendChild(this.help);else this.helpHome.after(this.help)}}
  update(S,cnt){
    this.sync();
    if(G.mode!=='world')return;
    setHtml(this.brand,'<span class="campaign-army-flag" aria-hidden="true">'+tipFlag(P)+'</span><span class="campaign-army-name">'+htmlText(bandName())+'</span>');this.brand.title=bandName()+' · Rename army';this.brand.setAttribute('aria-label',bandName()+'. Rename army');
    const days=n=>(n>=10?Math.floor(n):Math.floor(n*10)/10)+'d';
    const cell=(ic,label,value,title,warn,coverage)=>{const supply=coverage!=null,tag=supply?'button':'div';return '<'+tag+' class="campaign-resource'+(warn?' warn':'')+'"'+(supply?' type="button" data-supply="'+ic+'"':'')+' title="'+htmlText(title+(warn?'. Running low':'')+(supply?'. Open inventory':''))+'">'+this.art(ic,'campaign-resource-art')+'<span><small>'+label+(warn?'<em class="campaign-resource-alert">LOW</em>':'')+'</small><b>'+value+'</b>'+(supply?'<i class="campaign-supply-track" aria-hidden="true"><em style="width:'+Math.min(100,Math.max(0,coverage/3*100))+'%"></em></i>':'')+'</span></'+tag+'>'};
    setHtml(this.resources,cell('gold','Gold',P.gold,'Your gold')+cell('troops','Company',cnt,'Your company’s troop count')+cell('food','Food',days(S.foodDays),'Food remaining at the current consumption rate',S.foodDays<1,S.foodDays)+cell('mug','Drink',days(S.drinkDays),'Drink remaining at the current consumption rate',S.drinkDays<1,S.drinkDays));
    this.updateTown();
    this.slot.style.aspectRatio=MW+'/'+MH;
  }
  updateTown(){
    const focus=[G.chase,typeof WUI!=='undefined'?WUI.hov:null].find(o=>o&&objKind(o)==='town'),near=Spatial.nearestHolding(P.x,P.y,t=>!t.gone);
    const t=focus||near&&Math.hypot(near.x-P.x,near.y-P.y)<=Math.max(180,worldBattleReach(near)*2)&&near;
    this.town=t&&t.inView(vis())?t:null;this.townCard.hidden=!this.town;if(!this.town)return;
    const gate=Gates.admits(t),hostile=foeAt(t),closed=closedNow(t),open=gate.ok&&!hostile&&!closed,close=Math.hypot(t.x-P.x,t.y-P.y)<=worldBattleReach(t),realm=t.owner&&FACS[t.owner],name=htmlText(t.name);
    setHtml(this.townCard,'<header>'+this.art('crest','campaign-town-crest')+'<div><small>NEARBY HOLDING</small><h3>'+name+'</h3></div></header><div class="campaign-town-line">'+icon('house',18)+'<span>'+htmlText(t.T.n)+' · '+htmlText(realm?realm.n:'Free folk')+'</span></div><div class="campaign-town-line">'+icon('garrison',18)+'<span>Garrison <b>'+t.gar+'</b></span></div><div class="campaign-town-line">'+icon('banner',18)+'<span>Gate <b class="'+(open?'good':'gold')+'">'+(hostile?'Hostile':closed?'Closed':gate.ok?'Open':'Restricted')+'</b></span></div><footer><button type="button" data-town-action="approach">'+(close&&open?'Enter '+htmlText(t.T.n):'Approach gate')+'</button><button type="button" data-town-action="map" aria-label="Show '+name+' on the map">'+icon('zoomin',20)+'</button></footer>');
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
