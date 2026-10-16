'use strict';
// Setup snapshots were captured before extraction. Geometry is fixed only for parity; real HUD measurement is checked too.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),t=T,G=t.G,P=t.P,W=t.W;
  const expected={field:'a06ebd13',reinforced:'14b7cfd0',chief_reuse:'05052405',siege:'8c3c904b',beasts:'93ccfb94',tournament:'15500309',deployment_off:'01087829',narrow:'5b575c04',wide:'424f8633'};
  const original={random:Math.random,measure:t.measureField,width:t.BVW,height:t.BVH,deploy:t.BDEPLOY.on,auto:t.BAUTO.on,speed:t.BSPEED.v,guide:t.GUIDE.on};
  const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
  const fingerprint=x=>{let h=2166136261;for(const c of JSON.stringify(stable(x)))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h.toString(16).padStart(8,'0')};
  const snapshot=(B,calls,next)=>({width:t.BW,env:B.env,top:B.ftop,bot:B.fbot,obs:B.obs,groups:B.groups,
    units:B.units.map(u=>({id:u.id,v:u.v,type:u.type,team:u.team,x:u.x,y:u.y,hp:u.hp,max:u.max,cd:u.cd,hero:u.hero,comp:!!u.comp,face:u.face,grp:u.grp,sx:u.sx,sy:u.sy,s:u.s,
      mor:u.mor,mor0:u.mor0,sta:u.sta,vig:u.vig,role:u.unit.role||'troop',key:u.unit.key,lord:u.lord&&u.lord.id,leader:u.leader&&{type:u.leader.type,team:u.leader.team,name:u.leader.name}})),
    hero:B.hero.id,opts:B.opts,deploy:B.deploy,auto:B.auto,speed:B.speed,paused:B.paused,noMorale:!!B.noMorale,exit:B.exit,cam:B.cam,hx:B.hx,warm:t.WARM.q.length,
    fresh:[B.rings,B.arrows,B.parts,B.floats,B.slashes,B.corpses,B.lost],clock:B.t,kills:B.kills,slain:B.slain,sel:B.sel,mode:G.mode,calls,next});
  try{
    window.__setupMeasure=original.measure;(0,eval)('measureField=()=>({top:40,bot:560})');
    const cases=['field','reinforced','chief_reuse','siege','beasts','tournament','deployment_off','narrow','wide'];
    for(const [index,name] of cases.entries()){
      Math.random=t.seeded(100+index);t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;
      P.troops={hum_spear:3,hum_bow:2,hum_mage:1,hum_knight:1};P.comps={brann:{ap:5,role:''},elske:{ap:0,role:''},tavi:{ap:0,role:''}};
      t.compInit('brann').lv=3;t.compInit('elske').hurt=G.day+2;t.compInit('tavi').party=t.asParty({cid:'tavi',troops:['hum_bow'],x:P.x+200,y:P.y,order:'stay'});
      P.hp=23;P.sp=31;P.mp=7;P.morale=64;t.BDEPLOY.on=true;t.BAUTO.on=false;t.BSPEED.v=2;
      (0,eval)('BVW='+ (name==='narrow'?500:name==='wide'?1700:1000)+';BVH=BH');
      let enemies=['militia','militia','archer','orc_shaman','horse'],opts={enemies,tournament:false,deploy:true};
      G.enc={kind:'party',ref:{x:P.x,y:P.y,cool:0},list:enemies,allies:[],foes:[]};
      if(name==='reinforced'){
        const ally=W.lords.find(l=>l.fac==='vale'),enemy=W.lords.find(l=>l.fac==='karn'),helper=W.lords.find(l=>l.fac==='sylvan');
        for(const l of [ally,enemy,helper]){l.inside=null;l.dead=false;l.lv=3;l.xp=0;l.renown=24;l.sk=Object.fromEntries(t.LORD_SK.map(k=>[k,{lv:1,xp:0}]))}
        ally.troops=['hum_spear','hum_bow'];enemy.troops=['dw_clan','dw_xbow'];helper.troops=['elf_glade'];
        enemies=enemy.troops.slice();opts={enemies,tournament:false,lv:2,deploy:true};G.enc={kind:'lord',ref:enemy,list:enemies,allies:[ally],foes:[helper]};
      }else if(name==='chief_reuse'){
        enemies=['militia','chief','archer'];opts={enemies,tournament:false,lv:2};G.enc={kind:'camp',ref:{ld:t.newChief('bandits',4)},list:enemies,allies:[],foes:[]};
      }else if(name==='siege'){
        const town=t.TOWNS.find(h=>h.owner==='karn'&&h.kind==='town');town.wall=3;enemies=t.garList(town);opts={enemies,tournament:false,lv:4,deploy:true};G.enc={kind:'siege',ref:town,list:enemies,allies:[],foes:[]};
      }else if(name==='beasts'){
        enemies=['troll','dragon','wolf','spider'];opts={enemies,tournament:false,lv:3};G.enc={kind:'monster',ref:{id:'dragon'},list:enemies,allies:[],foes:[]};
      }else if(name==='tournament'){
        enemies=['chief'];opts={enemies,tournament:true,deploy:true};t.BAUTO.on=true;
      }else if(name==='deployment_off'){t.BDEPLOY.on=false;t.BAUTO.on=true}
      let calls=0;const random=t.seeded(900+index);Math.random=()=>{calls++;return random()};const returned=t.startBattle(opts),B=t.B,used=calls,next=[Math.random(),Math.random(),Math.random()];
      const hash=fingerprint(snapshot(B,used,next));if(expected[name])ok(hash===expected[name],name+' matches pre-extraction setup snapshot ('+hash+')');else o.push('SNAP '+name+' '+hash);
      ok(returned===undefined&&B.opts===opts&&B.hero===B.units[0]&&B.hero.hp===23,name+': entry point, options identity and hero health are preserved');
      ok(new Set(B.units.map(u=>u.id)).size===B.units.length&&B.units.every((u,i)=>u.id===i),name+': unit IDs are consecutive and restart per battle');
      ok(B.units.every(u=>u.unit instanceof t.Unit&&u.unit.key===u.type)&&Object.values(B.groups).every(g=>g instanceof t.BattleControl),name+': units and group controls keep their existing models');
      ok(B.units.every(u=>u.y>=B.ftop&&u.y<=B.fbot)&&B.rings.length===0&&B.arrows.length===0&&B.t===0&&!B.over,name+': units start in bounds with fresh transient state');
      if(name==='tournament')ok(B.units.length===2&&B.noMorale&&!B.deploy&&!B.auto&&!B.obs.length,'tournaments still exclude the warband, reinforcements, deployment and obstacles');
      else ok(B.units.filter(u=>u.comp).length===1&&B.units.some(u=>u.type==='brann')&&!B.units.some(u=>u.type==='elske'||u.type==='tavi'),name+': only healthy companions in the band spawn');
      if(name==='reinforced')ok(B.units.filter(u=>u.leader).length===3&&B.units.some(u=>u.grp&&u.grp.startsWith('a_')),'reinforcements retain their leaders, source links and allied groups');
      if(name==='chief_reuse')ok(B.units.filter(u=>u.type==='chief').length===1&&B.units.find(u=>u.type==='chief').leader,'the camp chief already in the ranks becomes its leader, not a duplicate');
      if(name==='siege')ok(!B.units.find(u=>u.type==='hum_knight').s.charge&&B.units.find(u=>u.team===1).s.hp>t.ST[B.units.find(u=>u.team===1).type].hp,'sieges retain cavalry penalties and enemy-level scaling');
      if(name==='beasts')ok(B.units.filter(u=>u.team===1).every(u=>!u.grp),'beasts stay outside humanoid command groups');
      if(name==='deployment_off')ok(!B.deploy&&B.auto,'deployment-off and auto-command settings are honored');
      if(name==='narrow'||name==='wide')ok(t.BW===(name==='narrow'?t.FIELD_W.min:t.FIELD_W.max),'field width still clamps at the '+name+' limit');
    }
    (0,eval)('measureField=window.__setupMeasure;BVW='+original.width+';BVH='+original.height);delete window.__setupMeasure;
    G.mode='world';G.modal=false;G.enc={kind:'party',ref:{cool:0},allies:[],foes:[],list:['militia']};t.startBattle({enemies:['militia'],tournament:false});
    ok(t.fieldTop()>=t.FIELD_EDGE.top&&t.fieldBot()<=t.BH-t.FIELD_EDGE.bot&&t.fieldBot()>t.fieldTop(),'real HUD measurement still leaves a valid fighting area');
  }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{
    Math.random=original.random;if(window.__setupMeasure){(0,eval)('measureField=window.__setupMeasure');delete window.__setupMeasure}
    (0,eval)('BVW='+original.width+';BVH='+original.height);t.BDEPLOY.on=original.deploy;t.BAUTO.on=original.auto;t.BSPEED.v=original.speed;t.GUIDE.on=original.guide;
  }
  const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
