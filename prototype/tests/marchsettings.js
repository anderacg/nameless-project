'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;
 P.troops={hum_foot:12,hum_knight:8};P.comps={brann:{ap:0,role:''}};t.compInit('brann').hurt=G.day+2;
 const r=t.partyRoster(P),foot=r.groups.find(g=>g.type==='hum_foot'),cav=r.groups.find(g=>g.type==='hum_knight');r.move(cav.id,-1);
 const numbers=t.marchNumbers(P),html=document.createElement('div');html.innerHTML=t.partyRosterPage();
 ok(t.marchRows(P).every(row=>html.querySelector('[data-army-group="'+row.id+'"] .fb-unit-key').textContent===String(numbers[row.id])),'Army and march numbers agree after reordering with a wounded companion');
 G.mode='char';t.openMarch();t.act('march-select',foot.id);t.act('march-form','column');
 ok(G.march.draft[foot.id].files===1&&foot.files!==1,'Column changes only the draft until Apply');
 ok(t.marchDraftRows().every(row=>Math.hypot(row.x,row.y)+t.marchExtent(row)<=t.marchDraftOuter()+.001),'draft formation footprints remain inside the outer ring');
 t.act('march-back');ok(foot.files!==1,'Back discards unit formation edits');
 t.openMarch();t.act('march-select',foot.id);t.act('march-form','column');t.act('march-select',cav.id);t.act('march-form','wedge');t.act('march-apply');
 ok(foot.form==='line'&&foot.files===1&&cav.form==='wedge'&&t.marchRows(P).find(row=>row.id===foot.id).files===1,'Apply stores Column and Wedge in persistent troop groups and travel uses them');
 t.openMarch();t.act('march-select',foot.id);t.act('march-form','wedge');ok(G.march.draft[foot.id].form==='line','infantry cannot select cavalry Wedge');t.act('march-back');
 Kit.world();const enemy=t.asParty({kind:'bandits',troops:['militia','militia'],x:P.x+70,y:P.y,cool:0});t.bandits.push(enemy);G.enc={kind:'party',ref:enemy,list:enemy.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});
 ok(t.B.world&&t.B.groups['p_'+foot.id].files===1&&t.B.groups['p_'+cav.id].form==='wedge','world battle starts with the march editor unit formations');
});
