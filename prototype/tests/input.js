'use strict';
// Input: keys are read by physical position, so WASD and hotkeys work on any keyboard layout (here a Thai layout), driven through the real game loop.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P;window.requestAnimationFrame=()=>0;try{localStorage.clear()}catch(e){}
 const run=n=>{for(let i=0;i<n;i++)t.loop((0,eval)('last')+16)};
 const key=(type,k,code)=>window.dispatchEvent(new KeyboardEvent(type,{key:k,code}));
 t.act('begin','soldier');P.tree=['start','might0','might1'];P.slots[0]='whirl';P.troops={hum_levy:3};G.mode='world';G.modal=false;t.hidePanel();
 t.startEncounter({kind:'party',ref:t.bandits[0],n:3,band:'bandits'});document.querySelector('[data-act="fight"]').click();
 // (moving your hero with WASD and casting with 1-0 are set aside with the manual control; in RTS command 1-9 are control groups)
 t.selectGroup(testGroup('inf'));t.ctrlGroup('2',true);t.selectGroup('all');key('keydown','/','Digit2');ok(t.B.sel===testGroup('inf'),'2 picks the selection kept under it, on a Thai layout too');t.selectGroup('hero');const s1=t.B.sel;key('keydown','ๅ','Digit1');ok(t.B.sel===s1,'an unassigned number selects its actual army card');t.selectGroup('all');
 key('keydown','D','KeyD');run(5);ok(!G.keys.d,'D no longer moves your hero');key('keyup','D','KeyD');
 key('keydown','ผ','KeyZ');ok(t.B.groups[testGroup('inf')].order==='hold','Z gives the Hold order');
 ok(!G.keys.d&&!G.keys.w,'keys release cleanly');
 t.B.over=true;t.B.endT=0;run(2);t.act('cont');G.mode='world';G.modal=false;t.hidePanel();key('keydown','ร','KeyI');ok(G.mode==='inv','I opens the inventory on a Thai layout');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
