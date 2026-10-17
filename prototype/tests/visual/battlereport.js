'use strict';
window.RUN=()=>{const random=Math.random;try{
 T.begin('soldier');T.G.quietEvents=true;T.BDEPLOY.on=false;T.P.sk.med={lv:3,xp:0};T.P.comps.brann={ap:0,role:''};
 const r=T.partyRoster(T.P);r.add('hum_foot',18);const foot=r.groups[0],second=r.split(foot.id,8);r.add('hum_bow',10);
 r.rename(foot.id,'Royal Guard');r.rename(second.id,'Forest Watch');r.rename(r.groups.find(g=>g.type==='hum_bow').id,'Ashford Archers');
 const foe=T.asParty({kind:'bandits',troops:Array(8).fill('militia'),x:T.P.x+8,y:T.P.y,cool:0});
 T.G.enc={kind:'party',ref:foe,list:foe.troops.slice(),allies:[],foes:[],mine:true};
 T.startBattle({enemies:T.G.enc.list,deploy:false});const B=T.B;B.win=true;B.kills=0;B.slain=[];B.lost={hum_foot:7};
 for(const [id,n] of [[foot.id,3],[second.id,4]])for(const u of B.units.filter(u=>u.grp==='p_'+id).slice(0,n))u.hp=0;
 const values=[0,.99,0,.99,.99,.99,.99,.99,0,.99,.99,0];let i=0;Math.random=()=>values[i++]??.99;
 new T.BattleResolution(B).finish();
 if(new URLSearchParams(location.search).get('scroll')){const panel=document.getElementById('panel'),report=panel.querySelector('.battle-report');panel.scrollTop+=report.getBoundingClientRect().top-panel.getBoundingClientRect().top-18}
 const d=document.createElement('pre');d.id='OUT';d.hidden=true;d.textContent='PASS battle report visual fixture';document.body.appendChild(d);
}catch(e){const d=document.createElement('pre');d.id='OUT';d.textContent='EXC '+e.stack;document.body.appendChild(d)}finally{Math.random=random}};
