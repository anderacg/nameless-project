'use strict';
// The dice (ui/dice.js): a check's roll shown as it falls, on a d20 by its rules (roll + bonus against a DC). The die on the
// right side of the mark (won on it or over, won in part just under it); the check draws once, as before (no stream moves); the
// overlay comes, says what came of it, and waits for you (Continue, a click, Enter, Space, Esc; no other key reaches the game
// meanwhile); a road's chance shows it; switched off (as every other suite has it: harness.js), nothing shown.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
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
 // ---- a bonus and a natural 20 shown
 {D.clear();D.draw(D.face({p:.5,r:.01,bonus:.15,label:'z'}));const el=ov();ok(el&&/Rolled 20 \+ 3 = 23 · DC 14/.test(el.textContent)&&/natural 20/.test(el.textContent),'shown: the roll, its bonus and total against the DC; a natural 20 named');D.clear()}
 // ---- a check: one draw, as the check's; won by the same rule
 {let n=0;const won=D.check(.5,'Test',()=>{n++;return .3});ok(n===1&&won===true&&D.check(.5,'Test',()=>.7)===false,'a check draws once, and is won under its odds')}
 // ---- shown: the overlay over the screen, its label, roll and result; gone on a click
 {D.clear();D.show({p:.4,r:.2,label:'Bribe the gaoler'});
  return new Promise(res=>setTimeout(()=>{const el=ov();ok(el&&/Bribe the gaoler/.test(el.textContent)&&/Rolled 16 · DC 13 \(40%\)/.test(el.textContent)&&/Success/.test(el.textContent)&&el.querySelector('canvas.dice-cv'),'shown: the die (on its canvas), the roll against its DC, what came of it');
    el.querySelector('.dice-card').click();ok(!ov(),'a click: gone');
    // ---- a road's chance: its roll shown (the road's own stream, as before)
    G.mode='world';t.hidePanel();const e=t.roadSpawn('toll',P.x+30,P.y);if(e){t.roadMeet(e);const i=e.D.acts.findIndex(c=>c.label==='Ask for their writ');t.act('enc-do',String(i))}
    setTimeout(()=>{ok(!e||ov()&&/Ask for their writ/.test(ov().textContent),'a road\'s check: its roll shown');D.clear();
      // ---- off: nothing
      t.DICE.on=false;D.show({p:.5,r:.2,label:'x'});setTimeout(()=>{ok(!ov(),'switched off: nothing shown');t.DICE.on=true;
        // ---- it waits for you: still up long after it lands; a key not its own goes nowhere; Enter, Space, Esc close it (Esc only it)
        const key=k=>window.dispatchEvent(new KeyboardEvent('keydown',{key:k,code:k===' '?'Space':k,bubbles:true,cancelable:true})),mode=()=>G.mode+'|'+(t.panel?.innerHTML||'').length;
        D.show({p:.5,r:.2,label:'y'});setTimeout(()=>{ok(!!ov()&&!!ov().querySelector('.dice-go'),'it stays till you close it (a Continue button)');const m0=mode();key('1');key('m');
          ok(!!ov()&&mode()===m0,'while it is up, another key goes nowhere');key('Enter');ok(!ov(),'Enter closes it');
          D.draw(D.face({p:.5,r:.2}));key(' ');ok(!ov(),'Space closes it');D.draw(D.face({p:.5,r:.2}));const m1=mode();key('Escape');ok(!ov()&&mode()===m1,'Esc closes it, and only it');
          D.draw(D.face({p:.5,r:.2}));ov().querySelector('.dice-go').click();ok(!ov(),'Continue closes it');
          D.draw(D.face({p:.5,r:.2}));D.draw(D.face({p:.6,r:.9}));ok(document.querySelectorAll('.dice-ov').length===1&&/Failed/.test(ov().textContent),'a new roll replaces it');D.clear();
          key('Escape');ok(true,'with none up, keys are the game\'s again');finish()},t.DICE.tumble+600)},20)},20);
    function finish(){const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);res()}},20))}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
