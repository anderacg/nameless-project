'use strict';
// Input: keys are read by physical position, so WASD and hotkeys work on any keyboard layout (here a Thai layout), driven through the real game loop.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P;window.requestAnimationFrame=()=>0;try{localStorage.clear()}catch(e){}
 const run=n=>{for(let i=0;i<n;i++)t.loop((0,eval)('last')+16)};
 const key=(type,k,code)=>window.dispatchEvent(new KeyboardEvent(type,{key:k,code}));
 t.act('begin','soldier');P.tree=['start','might0','might1'];P.slots[0]='whirl';P.troops={hum_levy:3};G.mode='world';G.modal=false;t.hidePanel();
 t.startEncounter({kind:'party',ref:t.bandits[0],n:3,band:'bandits'});document.querySelector('[data-act="fight"]').click();
 const h=t.B.hero,x0=h.x;key('keydown','ก','KeyD');run(60);key('keyup','ก','KeyD');ok(h.x>x0+30,'the D key moves right on a Thai layout ('+Math.round(x0)+' → '+Math.round(h.x)+')');
 const y0=h.y;key('keydown','ไ','KeyW');run(30);key('keyup','ไ','KeyW');ok(h.y<y0-10,'the W key moves up');
 key('keydown','D','KeyD');run(5);ok(G.keys.d===true,'English layout still works');key('keyup','D','KeyD');
 key('keydown','ๅ','Digit1');ok(t.B.hx.cds.whirl>0,'1 casts the skill in slot 1 (Whirlwind)');
 key('keydown','ผ','KeyZ');ok(t.B.groups.inf.order==='hold','Z gives the Hold order');
 ok(!G.keys.d&&!G.keys.w,'keys release cleanly');
 t.B.over=true;t.B.endT=0;run(2);t.act('cont');G.mode='world';G.modal=false;t.hidePanel();key('keydown','ร','KeyI');ok(G.mode==='inv','I opens the inventory on a Thai layout');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
