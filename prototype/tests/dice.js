'use strict';
// The dice (ui/dice.js): a check's roll shown as it falls, on two ten-sided dice. The die's number on the right side of the mark (won at or under it,
// lost over it, won in part in the amber beyond); the check draws once, as before (no stream moves); the overlay comes, says what
// came of it, and goes (a click, or in time); a road's chance shows it; switched off, nothing shown.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,D=t.Dice;try{localStorage.clear()}catch(e){}t.act('begin','soldier');G.quietEvents=true;
 const ov=()=>document.querySelector('.dice-ov');
 // ---- the face: its number by the draw, kept on the right side of the mark
 {const bad=[];for(let i=0;i<400;i++){const p=(i%97)/97,r=((i*37)%101)/101,f=D.face({p,r,part:.2}),won=r<p,half=!won&&r<p+.2;
    if(won!==(f.n<=f.need)||f.res!==(won?'won':half?'part':'lost')||f.n<1||f.n>100)bad.push(p.toFixed(2)+'/'+r.toFixed(2)+':'+f.n+'/'+f.need+' '+f.res)}
  ok(!bad.length,'400 rolls: the die always on the right side of the mark, won in part in the band beyond it'+(bad.length?' ('+bad.slice(0,4).join(', ')+')':''))}
 // ---- the ten-sided: ten flat kites, each number once, opposite faces adding to 9; at rest, its number the face to you
 {const F=t.D10.faces,flat=F.every(f=>{const[a,b,c,d]=f.v,n=f.n;return [b,c,d].every(p=>Math.abs((p[0]-a[0])*n[0]+(p[1]-a[1])*n[1]+(p[2]-a[2])*n[2])<1e-9)}),
    opp=F.every(f=>{const o=F.find(g=>g.n[0]*f.n[0]+g.n[1]*f.n[1]+g.n[2]*f.n[2]<-.999);return o&&o.d+f.d===9});
  ok(F.length===10&&flat&&opp&&F.map(f=>f.d).sort().join('')==='0123456789','the ten-sided: ten flat faces, 0 to 9 once each, opposites adding to 9');
  ok([0,1,2,3,4,5,6,7,8,9].every(d=>t.D10.up(t.D10.rest(d,.2))===d&&t.D10.up(t.D10.rest(d,-.16))===d),'at rest, each die shows its number to you');
  ok([[47,'4,7'],[100,'0,0'],[6,'0,6'],[10,'1,0'],[1,'0,1'],[99,'9,9']].every(([n,w])=>D.pair(n).join()===w),'the pair reads the roll: tens and ones (100 is 00 and 0)')}
 // ---- a check: one draw, as the check's; won by the same rule
 {let n=0;const won=D.check(.5,'Test',()=>{n++;return .3});ok(n===1&&won===true&&D.check(.5,'Test',()=>.7)===false,'a check draws once, and is won under its odds')}
 // ---- shown: the overlay over the screen, its label, roll and result; gone on a click
 {D.clear();D.show({p:.4,r:.2,label:'Bribe the gaoler'});
  return new Promise(res=>setTimeout(()=>{const el=ov();ok(el&&/Bribe the gaoler/.test(el.textContent)&&/Rolled 21/.test(el.textContent)&&/needed 40 or less/.test(el.textContent)&&/Success/.test(el.textContent)&&el.querySelector('canvas.dice-cv'),'shown: the dice (on their canvas), the odds, what came of it');
    el.querySelector('.dice-card').click();ok(!ov(),'a click: gone');
    // ---- a road's chance: its roll shown (the road's own stream, as before)
    G.mode='world';t.hidePanel();const e=t.roadSpawn('toll',P.x+30,P.y);if(e){t.roadMeet(e);const i=e.D.acts.findIndex(c=>c.label==='Ask for their writ');t.act('enc-do',String(i))}
    setTimeout(()=>{ok(!e||ov()&&/Ask for their writ/.test(ov().textContent),'a road\'s check: its roll shown');D.clear();
      // ---- off: nothing
      t.DICE.on=false;D.show({p:.5,r:.2,label:'x'});setTimeout(()=>{ok(!ov(),'switched off: nothing shown');t.DICE.on=true;
        // ---- in time: gone
        D.show({p:.5,r:.2,label:'y'});setTimeout(()=>{ok(!!ov(),'it stays a while');setTimeout(()=>{ok(!ov(),'and goes in time ('+(t.DICE.tumble+t.DICE.hold)+' ms)');finish()},t.DICE.tumble+t.DICE.hold+500)},50)},20)},20);
    function finish(){const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);res()}},20))}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
