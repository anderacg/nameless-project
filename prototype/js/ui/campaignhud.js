'use strict';
/* Campaign chrome: live resources and a shared, clickable canvas minimap slot. */
class CampaignHud{
  constructor(){
    this.screen=$('#screen');this.root=document.createElement('div');this.root.className='campaign-chrome';
    this.root.innerHTML='<div class="campaign-rail"><div class="campaign-brand"><span aria-hidden="true">✠</span> ASHMARK<small>THE CAMPAIGN</small></div><div class="campaign-resources" role="group" aria-label="Company supplies"></div></div><button type="button" class="campaign-warning" hidden></button><div class="campaign-console" aria-hidden="true"><span>◆</span></div><div class="campaign-survey"><span aria-hidden="true">N</span><button type="button" class="campaign-mini-slot" aria-label="Open full map"></button><small aria-hidden="true">LOCAL MAP</small></div><button class="campaign-details" type="button" aria-controls="stats" aria-expanded="false">Company details ▴</button>';
    $('.hudlayer').appendChild(this.root);this.console=this.root.querySelector('.campaign-console');this.resources=this.root.querySelector('.campaign-resources');this.slot=this.root.querySelector('.campaign-mini-slot');this.details=this.root.querySelector('.campaign-details');this.warning=this.root.querySelector('.campaign-warning');
    this.slot.addEventListener('click',()=>document.getElementById('mapBtn').click());
    this.warning.addEventListener('click',()=>document.getElementById('invBtn').click());
    this.details.addEventListener('click',()=>{const open=this.screen.classList.toggle('company-details');this.details.setAttribute('aria-expanded',String(open));this.details.textContent='Company details '+(open?'▾':'▴')});
  }
  get desktop(){return G.mode==='world'&&!G.modal&&!window.mobileWorldHud?.media.matches}
  sync(){this.screen.classList.toggle('campaign-world',G.mode==='world'&&!G.modal)}
  update(S,cnt){
    this.sync();
    if(G.mode!=='world')return;
    const days=n=>(n>=10?Math.floor(n):Math.floor(n*10)/10)+'d';
    const cell=(ic,label,value,title,warn)=>'<div class="campaign-resource'+(warn?' warn':'')+'" title="'+htmlText(title)+'">'+icon(ic,22)+'<span><small>'+label+'</small><b>'+value+'</b></span></div>';
    setHtml(this.resources,cell('gold','Gold',P.gold,'Your gold')+cell('troops','Company',cnt,'Your company’s troop count')+cell('food','Food',days(S.foodDays),'Food remaining at the current consumption rate',S.foodDays<1)+cell('mug','Drink',days(S.drinkDays),'Drink remaining at the current consumption rate',S.drinkDays<1));
    this.warning.hidden=S.drinkDays>=1&&S.foodDays>=1;
    setHtml(this.warning,icon(S.drinkDays<1?'mug':'food',18)+'<span>'+(S.drinkDays<1?'Drink':'Food')+' running low</span>'+icon('bag',18));
    this.warning.setAttribute('aria-label',(S.drinkDays<1?'Drink':'Food')+' running low. Open inventory');
    this.slot.style.aspectRatio=MW+'/'+MH;
  }
  miniRect(){
    if(!this.desktop)return null;const r=this.slot.getBoundingClientRect(),c=cv.getBoundingClientRect();if(!r.width||!c.width)return null;
    const b=this.console.getBoundingClientRect(),x=r.left-b.left-3,y=r.top-b.top-3,right=x+r.width+6,bottom=y+r.height+6;
    const clip='polygon(evenodd,0 0,100% 0,100% 100%,0 100%,0 0,'+x+'px '+y+'px,'+x+'px '+bottom+'px,'+right+'px '+bottom+'px,'+right+'px '+y+'px,'+x+'px '+y+'px)';
    if(this.clip!==clip){this.clip=clip;this.console.style.clipPath=clip}
    const k=VW/c.width,w=Math.round(r.width*k),h=Math.round(r.height*k);
    return{x:Math.round((r.left-c.left)*k),y:Math.round((r.top-c.top)*k),w,h,s:w/MW};
  }
}
window.campaignHud=document.getElementById('screen')?new CampaignHud():null;
