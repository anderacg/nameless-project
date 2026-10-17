'use strict';
window.RUN=()=>{try{
 T.begin('soldier');T.G.quietEvents=true;T.G.mode='world';T.G.modal=false;T.hidePanel();
 const c=T.BattleLab.builtins()[0].config;
 if(new URLSearchParams(location.search).get('field')){T.BattleLab.start(c);T.selectGroup(T.playerGroups()[2]);T.frame()}
 else{T.DevConsole.show('battle');T.DevConsole.applyBattleConfig(c);T.DevConsole.root.querySelector('[data-lab-preset]').value='b0'}
 const d=document.createElement('pre');d.id='OUT';d.hidden=true;d.textContent='PASS army laboratory visual fixture';document.body.appendChild(d);
}catch(e){const d=document.createElement('pre');d.id='OUT';d.textContent='EXC '+e.stack;document.body.appendChild(d)}};
