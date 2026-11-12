'use strict';
/* Campaign chrome: live resources and a shared, clickable canvas minimap slot. */
class CampaignHud{
  constructor(){
    this.screen=$('#screen');this.root=document.createElement('div');this.root.className='campaign-chrome';
    this.root.innerHTML='<div class="campaign-rail"><button type="button" class="campaign-brand" aria-label="Your army"></button><div class="campaign-resources" role="group" aria-label="Company supplies"></div></div><div class="campaign-console" aria-hidden="true"><span>◆</span></div><div class="campaign-survey"><span aria-hidden="true">N</span><button type="button" class="campaign-mini-slot" aria-label="Open full map"></button><small aria-hidden="true">LOCAL MAP</small></div><button class="campaign-details" type="button" aria-controls="stats" aria-expanded="false">Company details ▴</button>';
    $('.hudlayer').appendChild(this.root);this.resources=this.root.querySelector('.campaign-resources');this.slot=this.root.querySelector('.campaign-mini-slot');this.details=this.root.querySelector('.campaign-details');this.brand=this.root.querySelector('.campaign-brand');
    this.company=document.createElement('section');this.company.className='campaign-company';this.company.setAttribute('aria-label','Company status and supplies');this.root.appendChild(this.company);
    this.companyHeader=document.createElement('header');this.companyHeader.className='campaign-company-header';this.company.appendChild(this.companyHeader);
    const tools=document.querySelector('.dockrow.sys');tools.prepend(document.getElementById('menuBtn'));
    this.mapZoom=document.createElement('div');this.mapZoom.className='campaign-map-zoom';this.mapZoom.setAttribute('role','group');this.mapZoom.setAttribute('aria-label','Map zoom');this.slot.parentNode.appendChild(this.mapZoom);
    this.moves=[['.campaign-brand',this.companyHeader],['#stats',this.company],['.dockrow.sys',this.root.querySelector('.campaign-rail')],['#zoomOut',this.mapZoom],['#zoomIn',this.mapZoom]].map(([selector,to])=>{const el=document.querySelector(selector),home=document.createComment('campaign control home');el.before(home);return{el,home,to}});
    this.help=document.getElementById('helpBtn');this.helpHome=document.createComment('campaign help home');this.help.before(this.helpHome);
    this.brand.addEventListener('click',()=>act('nm-open'));
    this.resources.addEventListener('click',e=>{if(e.target.closest('[data-supply]'))document.getElementById('invBtn').click()});
    this.commandArt=[['campBtn','fire'],['mapBtn','map'],['mapToggle','map'],['charBtn','troops'],['skillBtn','skills'],['invBtn','bag'],['journalBtn','book']];
    this.regionCard=document.createElement('aside');this.regionCard.className='campaign-region';this.regionCard.hidden=true;this.regionCard.setAttribute('aria-label','Current region');this.regionCard.setAttribute('aria-live','polite');this.regionCard.setAttribute('aria-atomic','true');this.root.querySelector('.campaign-rail').appendChild(this.regionCard);
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
  sync(){
    this.mobileMini.hidden=!this.phone;
    for(const n of this.moves){if(this.desktop){if(n.el.parentNode!==n.to)n.to.appendChild(n.el)}else if(n.el.parentNode===n.to)n.home.after(n.el)}
    const resourceHome=this.desktop?this.company:this.root.querySelector('.campaign-rail');if(this.resources.parentNode!==resourceHome)resourceHome.prepend(this.resources);
    if(!this.iconsReady){for(const [id,box] of this.commandArt)document.getElementById(id).insertAdjacentHTML('afterbegin',this.art(box,'campaign-command-art'));this.iconsReady=true}
    this.screen.classList.toggle('campaign-world',G.mode==='world'&&!G.modal);
    const home=this.desktop?document.querySelector('.dockrow.sys'):this.helpHome.parentNode;if(this.help.parentNode!==home){if(this.desktop)home.appendChild(this.help);else this.helpHome.after(this.help)}
  }
  update(S,cnt){
    this.sync();
    if(G.mode!=='world')return;
    setHtml(this.brand,'<span class="campaign-army-flag" aria-hidden="true">'+tipFlag(P)+'</span><span class="campaign-army-name">'+htmlText(bandName())+'</span>');this.brand.title=bandName()+' · Rename army';this.brand.setAttribute('aria-label',bandName()+'. Rename army');
    const days=n=>(n>=10?Math.floor(n):Math.floor(n*10)/10)+'d';
    const cell=(ic,label,value,title,warn,coverage)=>{const supply=coverage!=null,tag=supply?'button':'div';return '<'+tag+' class="campaign-resource'+(warn?' warn':'')+'"'+(supply?' type="button" data-supply="'+ic+'"':'')+' title="'+htmlText(title+(warn?'. Running low':'')+(supply?'. Open inventory':''))+'">'+this.art(ic,'campaign-resource-art')+'<span><small>'+label+(warn?'<em class="campaign-resource-alert">LOW</em>':'')+'</small><b>'+value+'</b>'+(supply?'<i class="campaign-supply-track" aria-hidden="true"><em style="width:'+Math.min(100,Math.max(0,coverage/3*100))+'%"></em></i>':'')+'</span></'+tag+'>'};
    setHtml(this.resources,cell('gold','Gold',P.gold,'Your gold')+cell('troops','Company',cnt,'Your company’s troop count')+cell('food','Food',days(S.foodDays),'Food remaining at the current consumption rate',S.foodDays<1,S.foodDays)+cell('mug','Drink',days(S.drinkDays),'Drink remaining at the current consumption rate',S.drinkDays<1,S.drinkDays));
    this.updateRegion();
    this.slot.style.aspectRatio=MW+'/'+MH;
  }
  updateRegion(){
    const t=this.desktop?landHold(P.x,P.y):null;
    this.region=t&&Discovery.named(t)?t:null;this.regionCard.hidden=!this.region;if(!this.region)return;
    const realm=t.owner&&FACS[t.owner],terrain=regionAt(P.x,P.y);
    setHtml(this.regionCard,'<div class="campaign-region-content"><small>Current region</small><h3>'+htmlText(landName(P.x,P.y))+'</h3><p>'+icon('banner',16)+'<span>'+htmlText(realm?realm.n:'Free folk')+'</span><span aria-hidden="true">·</span>'+icon('map',16)+'<span>'+htmlText(terrain.name)+'</span></p></div>');
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
