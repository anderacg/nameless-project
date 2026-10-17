'use strict';
window.RUN=()=>{T.act('begin','soldier');T.frame();T.DevConsole.show(new URLSearchParams(location.search).get('tab')==='console'?'console':'battle');const d=document.createElement('pre');d.id='OUT';d.textContent='PASS developer tools visual fixture';document.body.appendChild(d)};
