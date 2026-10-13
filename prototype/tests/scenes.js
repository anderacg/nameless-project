'use strict';
// Scenes: every town has a walkable map laid out from its seed (the same each time), with walls and a gate, a square, and
// the buildings of everyone whose service the town offers; every door and person can be reached from the gate. You walk in
// from the town panel, can't walk through buildings, talk to people (which opens their tab, then back to the street),
// pray at the temple, hear gossip, pause and save inside, and walk out of the gate back to the panel.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');t.bandits.length=0;G.quietEvents=true;
 const panel=()=>document.getElementById('panel').innerHTML,towns=t.TOWNS.filter(x=>x.kind==='town');
 const esc=()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));
 // ---- layouts
 const bad=[];
 for(const tw of towns){const S=t.genTown(tw),sx=Math.floor(S.start.x/16),sy=Math.floor((S.start.y-1)/16);
   const reach=(x,y)=>!!t.scenePath(S,sx,sy,x,y)||x===sx&&y===sy;
   const roles=t.townRoles(tw),miss=roles.filter(r=>!S.npcs.some(n=>n.role===r));
   const far=S.npcs.filter(n=>!reach(Math.floor(n.x/16),Math.floor((n.y-1)/16)));
   const doors=S.blds.filter(b=>!reach(b.door[0],b.door[1]));
   if(miss.length||far.length||doors.length||!S.blds.some(b=>b.k==='hall'))bad.push(tw.name+(miss.length?' missing '+miss:'')+(far.length?' '+far.length+' people out of reach':'')+(doors.length?' '+doors.length+' doors out of reach':''));
   if(tw.style==='port'&&!(S.pier&&S.tiles.includes(t.S_WATER)))bad.push(tw.name+' has no harbour')}
 ok(!bad.length,'all '+towns.length+' towns lay out with everyone at work and every door and person reachable from the gate'+(bad.length?': '+bad.join('; '):''));
 const a=t.genTown(towns[0]),b=t.genTown(towns[0]);ok(a.tiles.join()===b.tiles.join()&&a.blds.length===b.blds.length,'the same town always gets the same layout');
 ok(new Set(towns.map(x=>t.genTown(x).tiles.join())).size===towns.length,'and no two towns look the same');
 const sizes=towns.map(x=>t.genTown(x).blds.length);ok(Math.min(...sizes)>=8,'each town has a hall, its trades and houses ('+Math.min(...sizes)+'–'+Math.max(...sizes)+' buildings)');
 // ---- in from the panel
 const tw=t.townBy('Ashford');G.mode='world';G.modal=false;t.hidePanel();G.lastTown=null;t.enterTown(tw);
 ok(/Walk the streets/.test(panel()),'the town panel offers to walk the streets');
 const castle=t.TOWNS.find(x=>x.kind==='castle');G.mode='world';G.lastTown=null;t.enterTown(castle);ok(!/Walk the streets/.test(panel()),'castles keep only their panel for now');
 G.mode='world';G.lastTown=null;t.enterTown(tw);t.act('scene-enter');const S=G.scene;
 ok(G.mode==='scene'&&S&&S.ref==='Ashford'&&!G.modal,'walking in opens the town');
 t.frame();ok(true,'and draws it');
 // ---- walking
 const p=S.p,y0=p.y;G.keys.w=true;for(let i=0;i<10;i++)t.updateScene(.05);G.keys.w=false;ok(p.y<y0-20,'WASD walks ('+Math.round(y0-p.y)+' px up the street)');
 const hb=S.blds[0];p.x=(hb.door[0]+.5)*16;p.y=(hb.door[1]+1)*16-3;G.keys.w=true;for(let i=0;i<30;i++)t.updateScene(.05);G.keys.w=false;
 ok(p.y>=(hb.y+hb.h)*16-1,'buildings are solid: you stop at the door');
 // ---- talking: click someone, walk there, and their tab opens
 const inn=S.npcs.find(n=>n.role==='innkeeper');p.x=S.start.x;p.y=S.start.y;const c=t.sceneCam(S);t.sceneClick((inn.x-c.x)*t.SCENE_ZOOM,(inn.y-6-c.y)*t.SCENE_ZOOM);
 let i=0;for(;i<400&&G.mode==='scene';i++)t.updateScene(.05);
 ok(G.mode==='town'&&G.town.tab==='tavern'&&/Innkeeper/.test(panel())&&/Back to the streets/.test(panel()),'clicking the innkeeper walks you over and opens the tavern ('+i+' steps)');
 t.act('tab','trade');ok(G.town.inScene&&/Trade|Buy/.test(panel()),'the other tabs stay at hand');
 t.act('leave');ok(G.mode==='scene'&&!G.modal&&G.scene===S,'Back to the streets returns to the town');
 const cap=S.npcs.find(n=>n.role==='captain');p.x=cap.x;p.y=cap.y;t.sceneUse();ok(G.town.tab==='recruit','the captain of the guard opens recruiting');esc();ok(G.mode==='scene','Esc closes it back to the street');
 // ---- the temple and the townsfolk
 const pr=S.npcs.find(n=>n.role==='priest');const m0=P.morale=50;p.x=pr.x;p.y=pr.y;t.sceneUse();ok(P.morale===m0+t.BLESSING.morale&&/Morale/.test(panel()),'the priest blesses you');t.act('scene-back');
 t.sceneUse();ok(P.morale===m0+t.BLESSING.morale&&/prayed here today/.test(panel()),'once a day');esc();ok(G.mode==='scene'&&!G.modal,'Esc closes the talk');
 const f=S.folk[0];p.x=f.x;p.y=f.y;S.npcs.forEach(n=>{n.x+=999});t.sceneUse();ok(/&ldquo;|“/.test(panel()),'townsfolk share gossip');S.npcs.forEach(n=>{n.x-=999});t.act('scene-back');
 const fx=S.folk.map(q=>q.x+','+q.y).join();for(let k=0;k<60;k++)t.updateScene(.1);ok(S.folk.map(q=>q.x+','+q.y).join()!==fx,'townsfolk walk the streets');
 // ---- pause and save inside; night
 esc();ok(G.mode==='esc'&&!/Finish what/.test(panel()),'Esc pauses inside, and you may save');t.act('esc-save');ok(t.readSave(),'saved');esc();ok(G.mode==='scene','resume');
 G.clock=t.DAY*.8;t.frame();G.clock=t.DAY*.25;ok(S.lights.length>4,'windows and lamps light up at night ('+S.lights.length+')');
 // ---- out through the gate
 p.x=(S.gate.x+1)*16;p.y=(S.gate.y)*16;G.keys.s=true;for(let k=0;k<40&&G.mode==='scene';k++)t.updateScene(.05);G.keys.s=false;
 ok(G.mode==='town'&&!G.scene&&/Leave (town|city)/.test(panel()),'walking out of the gate returns to the town panel');
 t.act('leave');ok(G.mode==='world','and Leave goes back to the map');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
