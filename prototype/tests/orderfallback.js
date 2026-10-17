'use strict';
// every order of yours to a character's group ends its fall-back (commands.js playerOrder): the R key (pace), a formation, a flag;
// a unit ability does not (not counted: the group's order key, ordKey, stays as it was)
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),auto0=t.AUTOSK.on;try{
 const G=(type,count)=>({type,count}),still=g=>g.units.forEach(u=>{u.s={...u.s,spd:0};u.cd=999});
 const press=(u,list)=>{list.forEach((e,i)=>{const a=Math.PI*(.7+.3*i);e.x=u.x+Math.cos(a)*16;e.y=u.y+Math.sin(a)*16})};
 t.AUTOSK.on=true;if(L.active)L.exit();L.start({leftGroups:[G('hero',1),G('hum_foot',10)],rightGroups:[G('hum_foot',3),G('hum_foot',12)],morale:true,deploy:false,paused:true,ai:false,seed:42});
 const b=t.B;b.obs=[];const mine=t.playerGroups().map(id=>b.groups[id]),foe=Object.values(b.groups).filter(g=>g.foe),at=[[480,300],[300,300],[500,300],[700,120]];
 [...mine,...foe].forEach((g,i)=>{g.placeAt(at[i][0],at[i][1]);t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+(u.sx||0);u.y=g.ay+(u.sy||0)})});
 const h=b.hero,H=t.heroState(),hg=b.groups[h.grp],tg=foe[0],foot=mine.find(g=>g!==hg);foe.forEach(still);hg.attack(tg);
 let F0=null;/* (the first a real roll; after it the same fall-back again, remembering the group's orders as they are now) */
 const fall=()=>{if(F0)H.fallBack={...F0,at:b.t,ord:t.ordKey(hg)};else{press(h,tg.units);h.hp=h.max*.2;H.shoveCd=99;H.rollCd=0;H.sp=t.maxSP();H.think=0;t.commandCharacters(.01);F0=H.fallBack&&{...H.fallBack}}return !!H.fallBack};
 const look=()=>{H.sp=t.maxSP();H.fbT=0;t.commandCharacters(.01)};
 const key=k=>window.dispatchEvent(new KeyboardEvent('keydown',{key:k,code:'Key'+k.toUpperCase(),bubbles:true}));
 ok(fall(),'(your hero on Auto skills falls back)');look();ok(H.fallBack,'(no order of yours: still out, the press a trap)');
 t.selectGroup(h.grp);const w0=!!hg.walk;key('r');ok(!!hg.walk!==w0,'(the R key toggles the pace: walk '+hg.walk+')');look();ok(!H.fallBack,'the R key (pace, toggleFlag walk) ends a fall-back');
 ok(fall(),'(falls back again)');t.toggleFlag('walk');look();ok(!H.fallBack,'toggleFlag(walk) ends a fall-back');
 ok(fall(),'(falls back again)');t.toggleFlag('firm');look();ok(!H.fallBack,'a flag (hold their ground) ends a fall-back');
 ok(fall(),'(falls back again)');t.setForm('line');look();ok(!H.fallBack,'a formation (line) ends a fall-back');
 ok(fall(),'(falls back again)');b.sel=[h.grp,foot.id];const k0=t.ordKey(foot),s0=foot.orderSeq|0,used=t.groupAbility('rally');look();
 ok(H.fallBack&&t.ordKey(foot)===k0&&(foot.orderSeq|0)===s0,'a unit ability (Rally, '+(used?'used':'refused')+') is no order: the group’s order key is unchanged and the fall-back goes on');
 t.toggleFlag('firm');ok((foot.orderSeq|0)===s0+1,'while a flag to the same group is counted');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{t.AUTOSK.on=auto0;if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
