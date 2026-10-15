'use strict';
/* ---------- the game's icons: small pixel pictures (9×9), each letter a colour of its own palette, drawn as SVG wherever the
   interface wants one (the party card, the top bar, the dock, the menus and windows). icon(name, size) gives the SVG. ---------- */
const ICONS={
  gold:{p:{r:'#a8781e',y:'#e8b94a',w:'#fff6c0'},px:['..rrrrr..','.ryyyyyr.','ryywyyyyr','ryyyyyyyr','ryyyyyyyr','ryyyyyyyr','ryyyyyyyr','.ryyyyyr.','..rrrrr..']},
  food:{p:{b:'#7a4a22',c:'#d8a058',w:'#f2d8a0'},px:['.........','..bbbbb..','.bccwccb.','bcwccwccb','bccccccccb'.slice(0,9),'bbbbbbbbb','.bbbbbbb.','.........','.........']},
  troops:{p:{g:'#b8c0cc',d:'#6a7488',r:'#c0504a'},px:['....r....','...ggg...','..ggggg..','.ggggggg.','.ggggggg.','.gdgggdg.','.gd...dg.','.........','.........']},
  power:{p:{s:'#cfd6e0',h:'#8a6a44'},px:['s.......s','.s.....s.','..s...s..','...s.s...','....s....','...s.s...','.hs...sh.','h.......h','.........']},
  morale:{p:{r:'#e0605a',w:'#ffb0a8'},px:['.rr...rr.','rwrr.rrrr','rrrrrrrrr','rrrrrrrrr','.rrrrrrr.','..rrrrr..','...rrr...','....r....','.........']},
  speed:{p:{b:'#a87a4a',d:'#6a4a2a'},px:['..bbb....','..bbb....','..bbb....','..bbbb...','..bbbbbb.','.bbbbbbbb','.dddddddd','.........','.........']},
  prisoners:{p:{c:'#9aa3ad',d:'#5a6270'},px:['..ccc....','.c...c...','.c...c...','ccccccc..','ccdddcc..','cccdccc..','ccccccc..','.........','.........']},
  wounded:{p:{r:'#e0605a',w:'#f4efe0'},px:['.........','..wwwww..','.wwwrwww.','.wwwrwww.','.wrrrrrw.','.wwwrwww.','.wwwrwww.','..wwwww..','.........']},
  furs:{p:{b:'#a07850',d:'#6a4a30'},px:['.b.....b.','.bbbbbbb.','..bdbdb..','..bbbbb..','..bbbbb..','..bdbdb..','.bb...bb.','.........','.........']},
  region:{p:{r:'#e0605a',w:'#f4efe0',d:'#8a2a24'},px:['..rrrrr..','.rrrrrrr.','.rrwwwrr.','.rrwwwrr.','.rrrrrrr.','..rrrrr..','...rrr...','....d....','.........']},
  renown:{p:{y:'#e8b94a',w:'#fff6c0'},px:['....y....','....y....','...ywy...','yyyyyyyyy','.yyyyyyy.','..yyyyy..','..yy.yy..','.yy...yy.','.........']},
  banner:{p:{p:'#8a6a44',f:'#6fa8e0'},px:['.pfffff..','.pffffff.','.pfffff..','.pffff...','.p.......','.p.......','.p.......','ppp......','.........']},
  sun:{p:{y:'#ffd25a',o:'#e8902a'},px:['....y....','.y.....y.','...ooo...','..ooooo..','yyooooooy'.slice(0,9),'..ooooo..','...ooo...','.y.....y.','....y....']},
  moon:{p:{w:'#dfe6f2',b:'#9aa8c0'},px:['...www...','..ww.....','.ww......','.ww......','.ww......','.www.....','..wwwww..','...bbb...','.........']},
  hero:{p:{s:'#f0c8a0',h:'#6a4a2a',b:'#3d74d6'},px:['...hhh...','..hssss..','..sssss..','...sss...','..bbbbb..','.bbbbbbb.','.bbbbbbb.','.bbbbbbb.','.........']},
  skills:{p:{y:'#e8b94a',w:'#fff6c0'},px:['....w....','....y....','..w.y.w..','...yyy...','wyyyyyyyw','...yyy...','..w.y.w..','....y....','....w....']},
  bag:{p:{b:'#a07850',d:'#6a4a30',y:'#e8b94a'},px:['...ddd...','..d...d..','.bbbbbbb.','bbbbbbbbb','bbbbybbbb','bbbbbbbbb','bbbbbbbbb','.bbbbbbb.','.........']},
  log:{p:{p:'#e8dcb8',d:'#a89870'},px:['.ppppppp.','dpdddddpd','.ppppppp.','.pdddddp.','.ppppppp.','.pdddddp.','.ppppppp.','dpppppppd','.ddddddd.']},
  help:{p:{y:'#e8b94a'},px:['..yyyyy..','.yy...yy.','.....yy..','....yy...','...yy....','...yy....','.........','...yy....','.........']},
  save:{p:{b:'#6fa8e0',d:'#3d5a8a',w:'#f4efe0'},px:['bbbbbbbb.','bwwwwwwbb','bwwwwwwbb','bbbbbbbbb','bbbbbbbbb','bbddddbbb','bbddddbbb','bbbbbbbbb','.........']},
  full:{p:{w:'#d8d2bc'},px:['www...www','w.......w','w.......w','.........','.........','.........','w.......w','w.......w','www...www']},
  menu:{p:{w:'#d8d2bc'},px:['.........','wwwwwwwww','.........','.........','wwwwwwwww','.........','.........','wwwwwwwww','.........']},
  pause:{p:{w:'#d8d2bc'},px:['.........','.ww...ww.','.ww...ww.','.ww...ww.','.ww...ww.','.ww...ww.','.ww...ww.','.ww...ww.','.........']},
  play:{p:{w:'#d8d2bc'},px:['.w.......','.www.....','.wwwww...','.wwwwwww.','.wwwwwww.','.wwwww...','.www.....','.w.......','.........']},
  sword:{p:{s:'#cfd6e0',h:'#8a6a44',y:'#e8b94a'},px:['.......ss','......sss','.....sss.','....sss..','.y.sss...','..yss....','..hy.....','.h..y....','h........']},
  load:{p:{b:'#a07850',d:'#6a4a30',y:'#e8b94a'},px:['.........','.ddd.....','dbbbddddd','dbbbbbbbd','dbbbbbbbd','dbbbbbbbd','dbbbbbbbd','ddddddddd','.........']},
  settings:{p:{g:'#9aa3ad',d:'#5a6270'},px:['...g.g...','.ggggggg.','.gg...gg.','ggd...dgg','.g.....g.','ggd...dgg','.gg...gg.','.ggggggg.','...g.g...']},
  book:{p:{r:'#c0504a',w:'#f4efe0',d:'#7a2a24'},px:['.rrrrrrr.','.rwwwwwr.','.rwdddwr.','.rwwwwwr.','.rwdddwr.','.rwwwwwr.','.rrrrrrr.','.ddddddd.','.........']},
  exit:{p:{b:'#8a6a44',d:'#4a3a24',y:'#e8b94a'},px:['.bbbbbb..','.bdddddb.','.bdddddb.','.bdddyd.b','.bdddddb.','.bdddddb.','.bdddddb.','.bbbbbbb.','.........']},
  resume:{p:{g:'#78c474'},px:['.g.......','.ggg.....','.ggggg...','.ggggggg.','.ggggggg.','.ggggg...','.ggg.....','.g.......','.........']}
};
// an icon as SVG: its pixels in its colours (crisp at any whole size)
function icon(name,size,cls){const I=ICONS[name];if(!I)return '';size=size||16;let r='';
  I.px.forEach((row,y)=>[...row].forEach((c,x)=>{if(c!=='.'&&I.p[c])r+='<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+I.p[c]+'"/>'}));
  return '<svg class="'+(cls||'gico')+'" viewBox="0 0 9 9" width="'+size+'" height="'+size+'" shape-rendering="crispEdges" aria-hidden="true">'+r+'</svg>'}
