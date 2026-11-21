'use strict';

// Small, reusable cartoon paintings. All coordinates are relative to the feet.
const Art = (() => {
  const cache = new Map();
  const palettes = {
    blue: { cloth: '#547e94', light: '#91bac4', cape: '#466c8e' },
    red: { cloth: '#a45d42', light: '#d68a58', cape: '#984b36' },
    champion: { cloth: '#b76c36', light: '#e2ac5a', cape: '#b34e36' },
    captain: { cloth: '#387c7d', light: '#86b4a2', cape: '#d1a84f' },
    ranger: { cloth: '#748b3b', light: '#b3be64', cape: '#5c7634' },
    warden: { cloth: '#877397', light: '#bfacc4', cape: '#716184' }
  };
  function path(g, d, fill, stroke = '#49372a', width = 1.7) {
    const p = new Path2D(d);
    if (fill) { g.fillStyle = fill; g.fill(p); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = width; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(p); }
  }
  function ellipse(g, x, y, rx, ry, fill, stroke) {
    g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    g.fillStyle = fill; g.fill();
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1.5; g.stroke(); }
  }
  function gradient(g, x, y, w, h, colors) {
    const p = g.createLinearGradient(x, y, x + w, y + h);
    colors.forEach((color, i) => p.addColorStop(i / (colors.length - 1), color));
    return p;
  }
  function horse(g, step) {
    const leather = '#543a28';
    const body = gradient(g, -30, -48, 60, 45, ['#d7a267', '#a77244', '#765036']);
    const legs = [-20, -8, 12, 23];
    legs.forEach((x, i) => {
      const swing = Math.sin(step + i * Math.PI) * 4;
      path(g, `M${x} -29 L${x + swing + 2} -5 Q${x + swing + 8} 1 ${x + swing - 4} 0 L${x - 7} -5 L${x - 7} -29Z`, i % 2 ? '#89633e' : '#bd8d55');
      path(g, `M${x + swing - 7} -7 L${x + swing + 4} -7 L${x + swing + 6} 0 L${x + swing - 7} 0Z`, '#eee0b4');
    });
    path(g, 'M-29 -38 Q-41 -34 -43 -17 Q-35 -20 -31 -29', leather);
    ellipse(g, -1, -33, 32, 17, body, '#503d2c');
    path(g, 'M13 -36 Q20 -56 25 -68 L36 -70 L45 -52 Q62 -49 58 -37 Q53 -31 40 -35 L30 -46 L26 -22Z', body);
    path(g, 'M24 -66 L26 -80 L33 -70 M34 -68 L39 -79 L43 -64', '#b08450');
    path(g, 'M22 -65 Q16 -51 17 -36 L24 -45 L30 -66Z', '#60412a');
    ellipse(g, 50, -42, 10, 7, '#e9c798', '#76563a');
    ellipse(g, 41, -56, 2, 2.8, '#302c22');
    path(g, 'M31 -62 L35 -40 L55 -40 M35 -43 L3 -48', null, leather, 2);
    path(g, 'M-17 -48 Q0 -53 18 -45 L14 -29 L-20 -31Z', '#446f87');
    path(g, 'M-12 -48 Q1 -54 13 -46 L12 -40 L-11 -40Z', '#6b4831');
  }
  function shield(g, color, round = false) {
    const shade = gradient(g, -21, -36, 27, 34, ['#d6ba78', '#b88b48']);
    if (round) {
      ellipse(g, -18, -24, 14, 17, '#a6804c', '#46392a');
      path(g, 'M-24 -37 L-24 -11 M-16 -40 L-16 -8 M-8 -35 L-8 -13', null, '#7a5a34', 1);
      ellipse(g, -17, -24, 4, 5, '#d5bd83', '#6b573a');
    } else {
      path(g, 'M-33 -41 L-18 -46 L-3 -39 L-5 -18 Q-10 -8 -18 -3 Q-31 -10 -32 -21Z', shade);
      path(g, 'M-29 -38 L-18 -41 L-7 -37 L-9 -20 Q-12 -13 -18 -8 Q-27 -14 -28 -22Z', color, '#6f5938', 1);
      path(g, 'M-18 -36 L-18 -18 M-23 -29 L-13 -29', null, '#e9d59b', 2.3);
    }
  }
  function person(g, type, team, step, attacking, hero) {
    const bow = type === 'archer' || hero === 'ranger';
    const p = palettes[hero || (bow && team === 'blue' ? 'ranger' : team)];
    const staff = hero === 'warden';
    const orc = type === 'bruiser';
    const metal = gradient(g, -18, -54, 34, 35, ['#f0e7d1', '#b5bcc0', '#7b8990']);
    const skin = gradient(g, -13, -65, 29, 29, orc ? ['#c1c87a', '#8f9f50', '#758047'] : ['#ffe0a2', '#e5b374', '#ca915d']);
    const walk = Math.sin(step) * 4;
    path(g, 'M-11 -24 L-14 -9 L-9 -3 L-2 -5 L2 -23Z', '#694d37');
    path(g, `M3 -24 L${4 + walk} -7 L${14 + walk} -4 L${17 + walk} -9 L14 -25Z`, '#79573b');
    path(g, 'M-15 -10 Q-24 -10 -23 -3 Q-15 1 -3 -3 L-3 -10Z', '#64503b');
    path(g, `M${5 + walk} -11 Q${18 + walk} -13 ${21 + walk} -5 L${19 + walk} -1 L${4 + walk} -2Z`, '#71503a');
    path(g, 'M-11 -45 Q-24 -38 -28 -15 L-9 -23 L12 -19 L17 -40Z', p.cape);
    path(g, 'M-10 -45 Q2 -50 14 -42 L19 -21 Q1 -16 -15 -23Z', bow || staff || orc ? p.cloth : metal);
    path(g, 'M-9 -40 L-7 -29', null, bow || staff ? p.light : '#f1ecd7', 3);
    path(g, 'M-14 -25 L17 -24 L17 -18 L-14 -19Z', '#765234');
    path(g, 'M-1 -26 L7 -26 L7 -18 L-1 -18Z', '#d9b65d', '#765437', 1);
    path(g, 'M1 -24 L5 -24 L5 -20 L1 -20Z', '#5e4633', null);
    if (bow) {
      path(g, 'M-12 -48 L-24 -70 L-18 -72 L-6 -49Z', '#745536');
      path(g, 'M-23 -70 L-25 -77 M-20 -71 L-20 -79 M-17 -72 L-15 -78', null, '#f2d7a0', 2);
    }
    path(g, 'M-12 -41 Q-24 -40 -21 -29 L-10 -25 L-6 -33Z', p.cloth);
    ellipse(g, -13, -29, 7, 6, skin, '#805437');
    path(g, 'M12 -41 Q23 -40 20 -28 L10 -27 L8 -34Z', p.cloth);
    ellipse(g, 18, -30, 7, 6, skin, '#805437');
    ellipse(g, 1, -53, orc ? 19 : 17, 18, skin, '#6e5033');
    if (orc) {
      path(g, 'M-15 -58 L-28 -62 L-17 -49 M17 -57 L26 -60 L18 -48', skin);
      path(g, 'M-5 -43 L-6 -49 L-2 -45 M10 -44 L15 -49 L14 -42', '#fff0c2', '#867549', 1);
    }
    ellipse(g, 7, -53, 1.8, 3.2, '#332a22');
    path(g, 'M2 -60 L11 -58', null, '#5d432b', 2);
    path(g, 'M14 -50 L18 -48 L13 -46', skin, '#a57a4c', 1);
    path(g, 'M6 -42 Q10 -40 13 -43', null, '#805738', 1);
    if (bow) {
      path(g, 'M-17 -54 Q-22 -76 0 -76 Q19 -74 22 -60 L3 -63 L-11 -53Z', p.cloth);
      path(g, 'M-10 -68 Q4 -76 16 -64', null, p.light, 2);
      if (hero) path(g, 'M-15 -52 L-25 -58 L-18 -45', skin);
    } else if (staff) {
      path(g, 'M-17 -56 Q-20 -75 5 -74 Q22 -69 18 -57 L8 -61 L-2 -58Z', '#e5dac0');
      path(g, 'M-14 -47 L-11 -34 L-3 -28 L4 -35 L10 -29 L17 -37 L16 -49 Q8 -42 1 -48 Q-6 -43 -14 -47Z', '#f3e5c3');
    } else if (hero === 'champion') {
      path(g, 'M-17 -54 L-18 -67 L-9 -69 L-6 -77 L2 -72 L14 -76 L12 -67 L21 -64 L12 -57 L0 -60 L-9 -56Z', '#805036');
      path(g, 'M-12 -66 L2 -69 L10 -68', null, '#b47743', 3);
    } else if (hero === 'captain') {
      path(g, 'M-22 -62 L-10 -77 L0 -71 L20 -77 L25 -62 L7 -58Z', p.cloth);
      path(g, 'M-22 -62 L7 -58 L25 -62', null, '#e4bf65', 3);
      path(g, 'M-8 -74 Q-4 -93 -21 -93 Q-35 -85 -26 -83 L-13 -86Z', '#dfb547');
    } else if (!orc) {
      path(g, 'M-21 -57 Q-21 -77 -1 -77 Q17 -76 21 -59 L25 -57 Q0 -50 -23 -55Z', metal);
      path(g, 'M-5 -75 Q-11 -64 -8 -56', null, '#f4ead0', 2);
      if (type === 'shield') path(g, 'M-20 -57 L-18 -44 L-11 -44 L-10 -56', '#8d9da1');
    }
    if (bow) {
      path(g, 'M31 -58 Q54 -32 30 -9', null, '#533f2a', 5);
      path(g, 'M31 -56 Q48 -32 30 -11', null, '#c39450', 3);
      path(g, 'M31 -58 L23 -32 L30 -9 M15 -32 L49 -32', null, '#e9d8ac', 1);
      ellipse(g, 21, -32, 5, 5, skin, '#805437');
    } else if (staff) {
      path(g, 'M28 -8 L29 -75', null, '#654a2e', 5);
      path(g, 'M19 -77 L39 -77 L36 -58 L22 -58Z', '#d19b43');
      path(g, 'M23 -74 L34 -74 L32 -62 L24 -62Z', '#ffe3a0', null);
      path(g, 'M16 -77 L30 -88 L43 -77Z', '#94643b');
      shield(g, p.cloth);
    } else if (type === 'pike' || type === 'cavalry') {
      path(g, 'M21 -6 L30 -86', null, '#654a2c', 4);
      path(g, 'M30 -101 L24 -84 L30 -78 L36 -85Z', metal);
      ellipse(g, 25, -37, 5, 5, skin, '#805437');
    } else {
      g.save(); g.translate(20, -29); g.rotate(attacking ? -.9 : .5);
      path(g, 'M-3 7 L-3 -7 L3 -7 L3 7Z', '#936335');
      path(g, 'M-4 -9 L-5 -35 L1 -44 L6 -35 L4 -9Z', orc ? '#aeb8a4' : metal);
      path(g, 'M-9 -8 L10 -8', null, '#d6ae58', 4);
      path(g, 'M-2 -34 L0 -15', null, '#fff0cf', 1);
      g.restore();
      if (type === 'shield' || hero === 'captain') shield(g, p.cloth);
      if (type === 'levy') shield(g, p.cloth, true);
    }
  }
  function unit(g, unit, x, y, scale = .8, time = 0) {
    const moving = unit.moving;
    const frame = moving ? Math.floor(time * 9 + unit.id) % 4 : 0;
    const attack = unit.flash > .13;
    const key = [unit.type, unit.team, unit.hero || '', frame, attack].join(':');
    let c = cache.get(key);
    if (!c) {
      c = document.createElement('canvas'); c.width = 240; c.height = 240;
      const q = c.getContext('2d'); q.scale(2, 2); q.translate(57, 112);
      const step = moving ? frame * Math.PI / 2 : 0;
      if (unit.type === 'cavalry') {
        horse(q, step); q.save(); q.translate(-6, -39); q.scale(.65, .65);
        person(q, 'cavalry', unit.team, 0, attack, unit.hero); q.restore();
      } else person(q, unit.type, unit.team, step, attack, unit.hero);
      cache.set(key, c);
    }
    g.save();
    g.globalAlpha *= unit.dead ? .25 : 1;
    ellipse(g, x, y - 1, unit.type === 'cavalry' ? 31 * scale : 20 * scale, 5 * scale, '#28362233');
    g.translate(x, y);
    if (unit.face < 0) g.scale(-1, 1);
    const bob = moving ? Math.abs(Math.sin(time * 9 + unit.id)) * 2 * scale : 0;
    g.drawImage(c, -57 * scale, -112 * scale - bob, 120 * scale, 120 * scale);
    g.restore();
  }
  function tree(g, x, y, scale, variant = 0) {
    g.save(); g.translate(x, y); g.scale(scale, scale);
    ellipse(g, 5, 2, 38, 10, '#283a2333');
    path(g, 'M-6 0 L-5 -51 L7 -51 L9 0Z', '#765137');
    const leaf = gradient(g, -35, -85, 55, 80, ['#a8b26b', '#788b4a', '#4b693e']);
    for (const [a, b, r] of [[-24,-53,25],[19,-54,27],[0,-76,29],[-7,-39,26]]) {
      ellipse(g, a, b, r, r * .8, leaf, '#566b3b');
      path(g, `M${a-r*.6} ${b-r*.3} Q${a-r*.2} ${b-r*.8} ${a+r*.3} ${b-r*.5}`, null, '#c2c98255', 3);
    }
    g.restore();
  }
  function rock(g, x, y, s) {
    g.save(); g.translate(x,y); g.scale(s,s);
    ellipse(g, 2, 1, 19, 7, '#35432b22');
    path(g, 'M-19 -2 L-13 -20 L3 -28 L18 -16 L23 -2 Q0 8 -19 -2Z', '#929582', '#737c67');
    path(g, 'M-13 -20 L3 -28 L7 -14 L-4 -7 L-19 -2Z', '#b9b8a0', null);
    g.restore();
  }
  function wagon(g, x, y, secured = false) {
    g.save(); g.translate(x,y);
    ellipse(g, 4, 13, 66, 16, '#26372233');
    path(g, 'M-43 -24 L52 -24 L54 7 L-42 7Z', '#91673e');
    path(g, 'M-39 -20 L48 -20 L48 3 L-39 3Z', '#b28750');
    for (let n = -30; n < 49; n += 18) path(g, `M${n} -19 L${n} 3`, null, '#775534', 2);
    for (const xx of [-28,35]) {
      ellipse(g, xx, 8, 17, 20, '#64482f', '#423c29');
      ellipse(g, xx, 8, 12, 15, '#bf9657', '#6e5637');
      path(g, `M${xx-10} 8 L${xx+10} 8 M${xx} -5 L${xx} 21 M${xx-8} -3 L${xx+8} 19 M${xx+8} -3 L${xx-8} 19`, null, '#785638', 2);
      ellipse(g, xx, 8, 4, 4, '#d5b878', '#6b5738');
    }
    path(g, 'M-46 -25 Q-50 -81 -22 -86 L29 -83 Q57 -75 57 -24Z', gradient(g,-40,-85,80,60,['#f1dfab','#d0b47a','#a68a56']));
    path(g, 'M-46 -25 Q-49 -73 -23 -81 Q-1 -73 -1 -25Z', '#4c4930');
    path(g, 'M-48 -28 Q-46 -74 -23 -80 Q-7 -75 -3 -28', null, '#dfc48d', 7);
    path(g, 'M5 -79 Q26 -68 26 -26 M30 -77 Q49 -59 49 -27', null, '#a98e5a', 2);
    path(g, 'M-43 -29 L-44 0 M53 -25 L53 -4', null, '#705235', 3);
    path(g, 'M-47 2 L-70 24', null, '#745335', 5);
    path(g, 'M-59 16 L-44 24 L-48 36 L-65 29Z', '#aa8550');
    path(g, 'M49 -74 L49 -113', null, '#785838', 3);
    path(g, 'M51 -112 Q63 -116 78 -109 L76 -88 Q63 -94 51 -91Z', secured ? '#6b9eac' : '#a25338');
    g.restore();
  }
  function terrain() {
    const c = document.createElement('canvas'); c.width = 1280; c.height = 720;
    const g = c.getContext('2d');
    g.fillStyle = gradient(g,0,0,1280,720,['#aab66c','#a4b263','#879f58']); g.fillRect(0,0,1280,720);
    // Fixed seed keeps the layout identical for every attempt.
    let seed = 7301;
    const random = () => { seed = Math.imul(seed,1664525)+1013904223|0; return (seed>>>0)/4294967296; };
    for (let i=0;i<1800;i++) {
      const x=random()*1280,y=random()*720,r=2+random()*8;
      ellipse(g,x,y,r,r*.45,i%3?'#5e843312':'#dde0a01c');
    }
    g.lineCap='round'; g.lineJoin='round';
    const road = new Path2D('M-30 638 Q255 544 467 441 Q732 351 901 264 Q1030 213 1315 159');
    g.strokeStyle='#839653'; g.lineWidth=96; g.stroke(road);
    g.strokeStyle='#c7b47d'; g.lineWidth=78; g.stroke(road);
    g.strokeStyle='#d7c58e'; g.lineWidth=60; g.stroke(road);
    for (let i=0;i<270;i++) {
      const x=random()*1280,y=random()*720;
      if (y>555-x*.31 && y<675-x*.32) ellipse(g,x,y,random()*3+1,1,'#ac97642b');
      else if(i%4===0) {
        path(g,`M${x} ${y} l-2 -5 M${x+3} ${y+1} l2 -4`,null,'#688b4266',1.2);
        if(i%12===0)ellipse(g,x-2,y-6,1.7,1.7,'#f1e8ab');
      }
    }
    for (let i=0;i<22;i++) tree(g,i*65-25,42+Math.sin(i)*18,.8+(i%3)*.11,i);
    for (let i=0;i<12;i++) tree(g,i<6?i*31-45:1200+(i-6)*26,580+(i%6)*39,.9,i);
    for (const [x,y,s] of [[170,200,.7],[715,100,.6],[1140,367,.7],[81,426,.5],[1020,580,.5],[534,635,.5]]) rock(g,x,y,s);
    path(g,'M1090 159 L1090 208 M1140 147 L1140 196 M1190 134 L1190 183 M1090 178 L1190 153',null,'#7c6b40',4);
    return c;
  }
  return { unit, terrain, wagon, ellipse, path, gradient, cache };
})();
