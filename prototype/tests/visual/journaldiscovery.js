'use strict';
// Screenshot scenes: ?scene=lords|realms|empty; &w=844&h=390. Real hearing gateways produce the discoveries.
Kit.suite(({ok})=>{
 const t=T,G=t.G,P=t.P,W=t.W,K=t.KNOWLEDGE,u=new URLSearchParams(location.search),scene=u.get('scene')||'lords';
 window.requestAnimationFrame=()=>0;Kit.begin('soldier',23);Kit.clear();Kit.world({town:null});
 const size=()=>{const e=document.getElementById('screen');if(u.get('w')){e.style.width=u.get('w')+'px';e.style.height=u.get('h')+'px'}};
 size();P.x=P.y=-9999;G.lastTown=null;K.reset();t.fogReset();W.lords.forEach(l=>{l.x=l.y=-20000});W.news=undefined;
 if(scene!=='empty'){
  const a=t.TOWNS.find(h=>h.owner==='vale'),b=t.TOWNS.find(h=>h.owner==='karn'),ls=W.lords.filter(l=>l.fac==='vale');
  G.day=3;const siege=t.newsRecord('siege',a,{town:a.name,lord:ls[0].name,fac:ls[0].fac});t.rumourHear(siege,{quiet:false,from:'tavern talk'});
  G.day=5;ls[1].inside=a.name;const offer=t.intelGather({at:[a],r:1}).find(o=>o.k==='lord'&&o.o===ls[1]);t.intelLearn(offer,'the innkeeper of '+a.name);
  G.day=6;t.proclaimHear([b],'the crier of '+b.name);const fell=t.newsRecord('fell',b,{town:b.name,fac:'karn'});t.proclaimHear([b],'the crier of '+b.name);
  K.hear(ls[2].name+' was mentioned by a traveller.');
  G.day=9;
 }
 t.openJournal(scene==='realms'?'realms':'lords');document.getElementById('panel').style.animation='none';
 addEventListener('resize',()=>{size();t.renderJournal()});ok(true,'Journal '+scene+' discoveries');
});
