'use strict';
// Not a test: scenes for screenshots of the band card and the names (headless Chrome --screenshot at a window size).
// ?shot=card (on the map: a named band, some wounded, your hero hurt, a little tired) | default (the same, no names) |
// new (the New game page with its name fields filled) | names (the Names window over the map)
window.RUN=()=>{
 const t=T,G=t.G,P=t.P,shot=new URLSearchParams(location.search).get('shot')||'card';
 window.requestAnimationFrame=()=>0;Math.random=t.seeded(77);
 if(shot==='new'){t.showTitle('new');for(const [k,v] of [['hero','Bran Redhand'],['band','The Grey Company']]){const i=document.querySelector('#panel [data-name="'+k+'"]');i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}))}t.MainMenu.frame(performance.now());return}
 t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;G.mode='world';G.modal=false;t.hidePanel();
 if(shot!=='default'){P.name='Bran Redhand';P.band='The Grey Company'}
 P.troops={hum_spear:6,hum_bow:4};P.wounded={hum_spear:2};P.hp=t.vitals()[0]*.6;P.morale=72;P.bsta=38;P.tx=P.x+120;P.ty=P.y;
 t.updateHUD(true);t.frame();t.MainMenu.frame(performance.now());if(shot==='names')t.openNames();
};
