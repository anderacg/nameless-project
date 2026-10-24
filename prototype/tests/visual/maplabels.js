'use strict';
// Native map labels beside the old raster labels: ?v=1&legacy=1; optional &zoom=2 or &zoom=4.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,u=new URLSearchParams(location.search);window.requestAnimationFrame=()=>0;Kit.begin('soldier',23);Kit.clear();Kit.world({town:null});t.GUIDE.on=false;
 const h=Kit.goHome('Ashford'),lot=h.lots.filter(l=>t.ESTATES[l.k]).sort((a,b)=>Math.hypot(t.lotMid(a).x-h.x,t.lotMid(a).y-h.y)-Math.hypot(t.lotMid(b).x-h.x,t.lotMid(b).y-h.y))[0],mid=t.lotMid(lot);
 P.x=mid.x+12;P.y=mid.y+12;P.stay=null;P.troops={hum_foot:8,hum_bow:4};W.road=null;W.sites=[];W.lords.forEach(l=>{l.x=l.y=-9999;l.inside=null});
 const lord=W.lords[0];Object.assign(lord,{x:P.x+32,y:P.y+20,dead:false,gone:false,inside:null,fight:null,troops:Array(18).fill('hum_spear')});
 const labels=[],native=window.mapTxt,legacy=!!u.get('legacy');window.mapTxt=(...a)=>{labels.push(String(a[0]));return legacy?t.txt(...a):native(...a)};
 if(u.get('zoom'))t.prefSet('mapzoom',+u.get('zoom'));G.clock=t.DAY*.3;G.paused=true;performance.now=()=>1e7;
 document.getElementById('log').replaceChildren();t.updateHUD(true);t.frame();
 ok(labels.includes(h.name)&&labels.some(s=>s.includes(t.ESTATES[lot.k].n)),'holding and actual nearby building labels are visible');
 ok(labels.includes('18'),'the nearby army count uses the same label path');
 info(JSON.stringify({legacy,labels,scale:t.VS,dpr:devicePixelRatio,view:[t.VW,t.VH]}));
});
