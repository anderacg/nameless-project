'use strict';
window.RUN=()=>{try{
 T.begin('soldier');T.G.quietEvents=true;T.G.mode='world';T.G.modal=false;T.hidePanel();
 const left=Array.from({length:10},(_,i)=>({type:'hum_foot',count:i%3+1,name:i===0?'<script>literal</script>':'Left group '+(i+1)})),right=Array.from({length:10},(_,i)=>({type:'hum_bow',count:i%2+1,name:'Right group '+(i+1)}));
 T.BattleLab.start({leftGroups:left,rightGroups:right,deploy:false,paused:true,ai:false,seed:42});const B=T.B,lab=T.BattleLab,tele=lab.session.telemetry;
 for(const [i,g] of Object.values(tele.groups).entries()){g.damageDealt=37+i*11;g.damageTaken=29+i*7;g.kills=i%4;g.morale.push({time:4,average:72-i,minimum:35+i,alive:3,dead:0,routing:i%3===0?1:0,exited:0});if(i===0)g.events.push({time:2.35,type:'routed',groupId:g.id,unitId:1,unitType:'hum_foot'},{time:8.1,type:'field_exit',cause:'routed',groupId:g.id,unitId:1,unitType:'hum_foot'});if(i===11)g.events.push({time:6.75,type:'withdraw_order',groupId:g.id,side:'right'},{time:11.5,type:'field_exit',cause:'withdrawn',groupId:g.id,unitId:2,unitType:'hum_bow'})}
 B.win=true;lab.finish();T.DevConsole.show('report');const d=document.createElement('pre');d.id='OUT';d.hidden=true;d.textContent='PASS battle laboratory diagnostics report visual fixture';document.body.appendChild(d);
}catch(e){const d=document.createElement('pre');d.id='OUT';d.textContent='EXC '+e.stack;document.body.appendChild(d)}};
