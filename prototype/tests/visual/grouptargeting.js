'use strict';
window.RUN=()=>{try{
 const t=T;t.begin('soldier');t.G.mode='world';t.G.modal=false;t.hidePanel();
 t.BattleLab.start({leftGroups:[{type:'hum_foot',count:8,name:'Attackers'},{type:'hum_bow',count:8,name:'Supporting archers'}],rightGroups:[{type:'hum_foot',count:8,name:'Chosen formation'},{type:'hum_foot',count:8,name:'Other formation'}],deploy:false,paused:true,ai:false,morale:false,seed:42});
 const b=t.B,own=t.playerGroups().map(id=>b.groups[id]),foes=Object.values(b.groups).filter(g=>g.foe),place=(g,x,y)=>{g.placeAt(x,y);t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+u.sx;u.y=g.ay+u.sy})};
 place(own[0],260,260);place(own[1],200,420);place(foes[0],570,270);place(foes[1],480,440);
 own.forEach(g=>g.attack(foes[0].units[0]));foes[0].units[0].hp=0;own.forEach(g=>g.step(0));b.sel=own.map(g=>g.id);t.drawBattle();t.setOrderUI();
 const d=document.createElement('pre');d.id='OUT';d.hidden=true;d.textContent='PASS formation attack order remains after originally clicked soldier falls';document.body.appendChild(d);
 }catch(e){const d=document.createElement('pre');d.id='OUT';d.textContent='EXC '+e.stack;document.body.appendChild(d)}
};
