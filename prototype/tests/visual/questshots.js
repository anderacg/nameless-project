'use strict';
// Not a test: scenes for screenshots of your Quests, the journal (ui/questwindow.js; headless Chrome --screenshot at a window size).
// ?shot=side (a story under way, two stages done: its detail) | main (a test-only main story, a stage failed and fallen back to
// its checkpoint) | jobs (your jobs and the offers you know of, a locked one chosen) | archive (done, failed, abandoned) |
// board (a holding's notice board, a locked offer greyed). &open=1: the chosen one opened (a phone's detail view; the board: its locked offer scrolled to); &w=844&h=390:
// the screen that size (as tests/questwindow.js sizes it: the tests' view is otherwise fixed)
window.RUN=()=>{
 const t=T,G=t.G,P=t.P,W=t.W,u=new URLSearchParams(location.search),shot=u.get('shot')||'side';
 window.requestAnimationFrame=()=>0;Math.random=t.seeded(23);
 Kit.begin('soldier',23);Kit.clear();Kit.world();
 // (the screen's size, kept after any resize the window makes: fitScreen sets the tests' fixed view)
 const size=()=>{if(u.get('w')){const e=document.getElementById('screen').style;e.width=u.get('w')+'px';e.height=u.get('h')+'px'}};
 size();addEventListener('resize',()=>{size();if(G.mode==='quests')t.renderQuests()});
 P.name='Bran Redhand';P.band='The Grey Company';P.renown=30;P.level=2;P.gold=420;
 const ash=t.townBy('Ashford');
 // ---- a wounded traveller taken home, his family heard: the trail under way
 const story=()=>{const D=t.kindOf('encounter','traveller'),pick=l=>String(t.ROAD_ENC.traveller.acts.findIndex(c=>c.label===l));t.WOUNDED.ander.p=0;
  for(const z of [ash,...t.TOWNS]){Kit.world();Kit.clear();W.road=null;P.quests=[];P.troops={hum_levy:6};G.clock=t.DAY*.4;Kit.goHome(z);const p=t.roadSpot(D.on,0,D.near),e=p&&t.roadSpawn('traveller',p[0],p[1]);if(!e)continue;
   t.roadMeet(e);t.act('enc-do','0');t.act('enc-do',pick('Take him home'));t.act('enc-leave');const th=W.story.threads.on.find(x=>x.k==='wounded');if(!th)continue;
   Kit.world();t.Quest.as(P.quests.find(x=>x.id===th.wait.id)).reached();t.act('thr-do','0');Kit.world();return th}};
 const jobs=()=>{Kit.goHome(ash);P.troops={hum_spear:8,hum_bow:6};const qb=t.makeQuest('bounty',ash);t.acceptQuest(qb);let qc=null;for(let k=0;k<10&&!qc;k++)qc=t.makeQuest('courier',ash);t.acceptQuest(qc);
  const qs=t.makeQuest('supply',ash);t.acceptQuest(qs);t.invAdd('good',qs.good,qs.n);P.jobs={Ashford:{day:G.day,list:[t.makeQuest('bounty',ash),t.makeQuest('troops',ash)]}};return {qb,qc,qs}};
 const open=(tab,k)=>{Kit.world();t.openQuests();t.act('qw-tab',tab);if(k)t.act('qw-sel',k);if(!u.get('open'))G.qw.open=false,t.renderQuests();q0()};
 const q0=()=>{const p=document.getElementById('panel');if(p)p.style.animation='none'};
 if(shot==='side'){const th=story();jobs();t.QuestTrack.set('t'+th.i);open('side','t'+th.i);return}
 if(shot==='main'){
  const page=(title,cs)=>({page:{title,text:title+'.',choices:cs.map(([label,how])=>({label,how,out:()=>({})}))}});
  t.defineKind('thread','qm_shot',{n:'A Name on the Road (test)',main:true,who:()=>'you',steps:[
   {id:'road',stage:'Reach Ashford',checkpoint:true,how:d=>d.e.fate,start:{step:'visit',town:'Ashford',spec:{to:{town:'Ashford'},title:'Reach Ashford'}},note:'Go to Ashford.',then:{arrived:'grain'}},
   {id:'grain',stage:'Recover the grain',checkpoint:true,fail:['lost'],setback:'The deserters beat you back. The grain is still theirs.',start:{step:'visit',town:'Ashford',spec:{to:{x:ash.x+300,y:ash.y+200,name:'the deserters’ camp'},title:'Recover the grain'}},how:d=>d.e.fate==='arrived'?'won':'lost',note:'Recover the grain from the deserters.',then:{won:'home'}},
   {id:'home',stage:'Home',start:page('Home',[['Rest','rest']]),note:'Rest.'}]});
  Kit.goHome(ash);const th=t.Thread.start('qm_shot',{town:'Ashford'}),sq=()=>t.Quest.as(P.quests.find(x=>x.id===th.wait.id));sq().arrive(ash);sq().abandon();jobs();open('main','t'+th.i);return}
 if(shot==='jobs'){story();const {qc}=jobs();P.level=1;t.QuestTrack.set('q'+qc.id);open('job','oAshford:1');return}
 if(shot==='archive'){story();const {qb,qc,qs}=jobs();t.turnIn(qs,ash);t.Quest.as(qb).abandon();qc.fail('The seal was broken.');delete P.shut;open('past','aq'+qb.id);return}
 if(shot==='board'){P.level=1;Kit.goHome(ash);P.jobs={Ashford:{day:G.day,list:[t.makeQuest('bounty',ash),t.makeQuest('troops',ash)]}};P.x=ash.x;P.y=ash.y+5;Kit.world();G.lastTown=null;t.updateWorld(.01);t.act('tab','jobs');q0();if(u.get('open'))document.querySelector('.row.locked').scrollIntoView()}
};
