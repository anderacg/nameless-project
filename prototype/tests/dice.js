'use strict';
// The dice (ui/dice.js): a check's roll shown as it falls, on a d20 by its rules (roll + bonus against a DC). The die on the
// right side of the mark (won on it or over, won in part just under it); the check draws once, as before (no stream moves); the
// overlay comes, says what came of it, and waits for you (Continue, a click, Enter, Space, Esc; no other key reaches the game
// meanwhile); a road's chance shows it; switched off (as every other suite has it: harness.js), nothing shown.
window.RUN=async()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,D=t.Dice;try{localStorage.clear()}catch(e){}t.act('begin','soldier');G.quietEvents=true;t.DICE.on=true;
 const ov=()=>document.querySelector('.dice-ov');
 // ---- the face, by the d20's rules: won on the face needed or over, won in part just under it; a 20 always a win, a 1 always a loss
 {const bad=[];for(let i=0;i<600;i++){const p=(i%97)/97,r=((i*37)%101)/101,part=i%2?.2:0,f=D.face({p,r,part}),won=r<p,half=!won&&part>0&&r<p+part;
    if(won!==(f.n>=f.need)||half!==(f.n>=f.low&&f.n<f.need)||f.res!==(won?'won':half?'part':'lost')||f.n<1||f.n>20||f.need<2||f.need>20||f.n===20&&!won||f.n===1&&won)bad.push(p.toFixed(2)+'/'+r.toFixed(2)+':'+f.n+'/'+f.need+' '+f.res)}
  ok(!bad.length,'600 rolls: the die on the right side of the mark (and of the band won in part), 1 to 20, a 20 only won, a 1 never'+(bad.length?' ('+bad.slice(0,4).join(', ')+')':''))}
 {const f=D.face({p:.5,r:.3,bonus:.15}),g=D.face({p:.3,r:.1});ok(f.need===11&&f.b===3&&f.dc===14&&f.n===14&&g.need===15&&g.n===18&&g.b===0&&g.dc===15,'a 50% chance needs 11; your skills\' 15% a +3 bonus, the DC 14; a 30% chance needs 15')}
 // ---- the twenty-sided: twenty flat faces, each number once, opposite faces adding to 21; at rest, its number the face to you
 {const F=t.D20.faces,opp=F.every(f=>{const o=F.find(g=>g.n[0]*f.n[0]+g.n[1]*f.n[1]+g.n[2]*f.n[2]<-.999);return o&&o.d+f.d===21});
  ok(F.length===20&&opp&&F.map(f=>f.d).sort((a,b)=>a-b).join()===Array.from({length:20},(_,i)=>i+1).join(),'the twenty-sided: twenty faces, 1 to 20 once each, opposites adding to 21');
  ok(Array.from({length:20},(_,i)=>i+1).every(d=>t.D20.up(t.D20.rest(d,.14))===d&&t.D20.up(t.D20.rest(d,-.3))===d),'at rest, the die shows its number to you')}
 // Outcomes wait for the actual landing, and an early click/key cannot skip it.
 const oldTumble=t.DICE.tumble;t.DICE.tumble=80;
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 try{
  let applied=0,draws=0;const won=D.check(.5,'Timing',()=>{draws++;return .1});const outcome=D.after(()=>{applied++;return won});
  ov().querySelector('.dice-go').click();D.key('enter');
  ok(!!ov()&&!D.landed&&applied===0&&ov().querySelector('.dice-go').disabled,'early Continue and Enter cannot skip a rolling die or apply its action');
  const result=await outcome;ok(result&&applied===1&&draws===1&&D.landed&&!ov().querySelector('.dice-go').disabled,'landing applies the outcome exactly once, using the original draw');
  D.key('enter');ok(!ov(),'Continue is available after landing');
  let ran=0;const c=new t.Choice({odds:'dice',label:'Timing choice',run:(s,c)=>{ran++;return c.roll()?'won':'lost'}}),choice=c.perform({});
  ok(ran===0&&!!ov(),'a rolled choice does not execute its body before the animation');await choice;ok(ran===1,'a rolled choice executes once after landing');D.clear();
  G.mode='world';const clock=G.clock;D.show({p:.5,r:.1,label:'Freeze'});t.stepSimulation(.2);ok(G.clock===clock,'the world does not advance while the roll is visible');await D.after(()=>true);D.clear();
  // Escape has no long immunity window or zero-vector displacement.
  const b=t.asParty({kind:'bandits',troops:Array(12).fill('militia'),x:P.x,y:P.y,cool:0});G.enc={kind:'party',ref:b,list:b.troops.slice()};G.mode='dialog';
  const random=Math.random,at={x:P.x,y:P.y};Math.random=()=>0;let escaped;try{escaped=t.flee()}finally{Math.random=random}
  ok(G.mode==='dialog'&&P.x===at.x&&P.y===at.y,'escape movement waits until its die lands');await escaped;
  ok(G.mode==='world'&&b.cool<=1&&G.encCool<=.5&&Math.hypot(P.x-at.x,P.y-at.y)>0,'escape separates coincident parties and uses only a short grace');D.clear();
  t.DICE.on=false;let sync=false;D.check(.5,'Hidden',()=>.1);D.after(()=>{sync=true});ok(sync&&!ov(),'disabled dice keep synchronous behavior without an overlay');
 }finally{D.clear();t.DICE.tumble=oldTumble;t.DICE.on=true}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
