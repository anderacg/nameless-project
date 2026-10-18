'use strict';
// Not a test: scenes for screenshots of groups handed to the AI, allies in green and attack-moves (headless Chrome --screenshot).
// ?shot=ai (two of your groups the AI's, the rest yours, every path shown) | ally (yours, an ally's and the enemy, whole) |
// ally3 (the same at ×3 on the allies' line) | amove (an attack-move's path) | amfight (a group turning on a foe mid-march)
window.RUN=()=>{
 const t=T,G=t.G,P=t.P,W=t.W,q=new URLSearchParams(location.search),shot=q.get('shot')||'ai';
 Math.random=t.seeded(4242);t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;t.BDEPLOY.on=false;t.BAUTO.on=false;t.HPBARS.on=true;
 const step=(B,s)=>{const e=B.t+s;while(B.t<e&&!B.over)t.updateBattle(1/30)},role=(B,r)=>t.playerGroups().find(id=>B.groups[id].role===r);
 const world=()=>{P.troops={hum_spear:8,hum_bow:6,hum_knight:4};P.comps={};const ally=W.lords.find(l=>l.fac==='vale');
  ally.inside=null;ally.dead=false;ally.lv=3;ally.xp=0;ally.renown=24;ally.sk=Object.fromEntries(t.LORD_SK.map(k=>[k,{lv:1,xp:0}]));ally.troops=['hum_spear','hum_spear','hum_spear','hum_bow','hum_bow'];
  const enemies=['militia','militia','militia','militia','militia','militia','archer','archer','archer','archer','horse','horse'];G.mode='world';G.modal=false;t.hidePanel();
  G.enc={kind:'party',ref:{x:P.x,y:P.y,cool:0},list:enemies,allies:[ally],foes:[]};t.startBattle({enemies,tournament:false});return t.B};
 const lab=(left,right)=>{G.mode='world';G.modal=false;t.BattleLab.start({leftGroups:left,rightGroups:right,deploy:false,ai:false,paused:false,morale:false,seed:5});const B=t.B;B.obs=[];B.cmdT=1e9;return B};
 const place=(g,x,y)=>{g.placeAt(x,y);t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+(u.sx||0);u.y=g.ay+(u.sy||0)})};
 try{t.prefSet('opaths','all')}catch(e){}
 if(shot==='ai'){const B=world(),inf=role(B,'inf'),arc=role(B,'arc'),cav=role(B,'cav');B.sel=[inf,arc];t.autoKey();B.groups[cav].moveTo(B.groups[cav].ax+170,B.groups[cav].ay-40);step(B,+(q.get('t')||2));B.sel=null;t.selectGroup(inf);t.selectGroup(arc,true);t.selectGroup(cav,true);const z=+(q.get('z')||0);if(z){B.cam.z=z;B.cam.fit=false;t.camLookAt([inf,arc,cav])}t.setOrderUI()}
 else if(shot==='ally'||shot==='ally3'){const B=world();step(B,4);B.sel=null;if(shot==='ally3'){const a=B.units.filter(u=>t.sideKey(u)==='ally'&&u.hp>0);B.cam.z=3;B.cam.fit=false;t.camCentre(a.reduce((s,u)=>s+u.x,0)/a.length-20,a.reduce((s,u)=>s+u.y,0)/a.length-30)}t.setOrderUI()}
 else if(shot==='amove'||shot==='amfight'){const B=lab([{type:'hum_spear',count:16},{type:'hum_bow',count:10}],[{type:'hum_levy',count:8},{type:'hum_levy',count:8}]);
  const [sp,bw]=t.playerGroups().map(id=>B.groups[id]),[e1,e2]=Object.values(B.groups).filter(g=>g.foe);place(sp,140,250);place(bw,90,330);place(e1,420,320);place(e2,820,110);
  for(const e of [e1,e2])e.units.forEach(u=>{u.s={...u.s,spd:0}});B.sel=sp.id;t.rtsOrder(860,250,{amove:true});B.sel=bw.id;t.rtsOrder(700,420);B.sel=[sp.id,bw.id];t.selectGroup(sp.id);t.selectGroup(bw.id,true);
  if(shot==='amove')step(B,.5);else{let n=0;while(!sp.hasTarget&&n++<2000)t.updateBattle(1/30);step(B,2.5);B.cam.z=2;B.cam.fit=false;t.camLookAt([sp.id,e1.id])}t.setOrderUI()}
 t.B.paused=true;t.frame();
};
