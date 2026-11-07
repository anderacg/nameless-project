/* Ashmark portrait study: independent grayscale layers, one shared face rig. No image assets. */
(function (root) {
  'use strict';
  const SIZE = 128, VERSION = 7;
  const OPTIONS = Object.freeze({
    race: ['human', 'dwarf', 'orc', 'elf'],
    face: ['oval', 'angular', 'broad', 'long', 'round', 'chiseled', 'heart', 'balanced', 'soft-oval', 'tapered', 'full-cheeked', 'narrow', 'youthful', 'soft-heart', 'strong-jaw', 'dwarven', 'orcish', 'elven', 'dwarf-square', 'orc-heavy', 'elf-high-cheek'],
    ears: ['normal', 'small', 'rounded', 'broad', 'attached-lobe', 'pointed', 'elven-long', 'orc', 'none', 'elf-swept'],
    hair: ['pageboy', 'cropped', 'waves', 'long', 'braids', 'tonsure', 'receding', 'swept', 'curls', 'tousled', 'side-part', 'ponytail', 'high-bun', 'low-bun', 'half-up', 'single-braid', 'undercut', 'topknot', 'swept-back', 'buzz-cut', 'crew-cut', 'caesar', 'textured-crop', 'short-quiff', 'brushed-up', 'curtains', 'shag', 'slick-side', 'shoulder-length', 'loose-side-braid', 'loose-center-part', 'curly-shag', 'tied-back-waves', 'none', 'knight-crop', 'forge-braids', 'war-crest', 'braided-crown'],
    eyes: ['calm', 'keen', 'heavy', 'wide', 'downturned', 'almond', 'clear', 'hooded', 'upturned', 'deep-set', 'relaxed', 'round', 'smiling', 'focused', 'soft-lidded', 'natural-wide', 'deep-almond', 'human-steady', 'elf-slanted'],
    brows: ['natural', 'arched', 'bold', 'flat', 'broken', 'sculpted', 'soft', 'feathered', 'low-arch', 'high-arch', 'slim', 'tapered-natural', 'full-soft'],
    nose: ['straight', 'broad', 'aquiline', 'button', 'crooked', 'slender', 'rounded', 'short', 'roman', 'wide-tip', 'soft-tip', 'defined-tip', 'orc-flat', 'dwarf-bulb', 'orc-broad'],
    mouth: ['neutral', 'full', 'stern', 'thin', 'slight-smile', 'cupid', 'gentle-smile', 'reserved-smile', 'broad-smile', 'parted', 'asymmetric-smile', 'downturned', 'pout', 'thin-smile', 'soft-full', 'relaxed-bow', 'small-tusks', 'heavy-tusks'],
    beard: ['none', 'stubble', 'trimmed', 'full', 'forked', 'braided', 'goatee', 'moustache', 'short-boxed', 'rounded', 'tapered-beard', 'sideburns', 'walrus', 'close-beard', 'scruffy', 'bound-beard', 'chin-bristle'],
    age: ['young', 'mature', 'seasoned', 'elder', 'weathered'],
    marks: ['none', 'scar', 'freckles', 'pockmarks', 'beauty-mark', 'twin-scars', 'brow-scar', 'sunspots', 'weathering'],
    clothing: ['tunic', 'gambeson', 'mail', 'surcoat', 'fur', 'robe', 'leather', 'cloak', 'brocade', 'brigandine', 'doublet', 'jerkin', 'tabard', 'scale', 'lamellar', 'plate', 'traveler-coat', 'embroidered-robe', 'linen-chemise', 'velvet-bodice', 'embroidered-doublet', 'ruffled-mail', 'guild-doublet', 'rune-mail', 'hide-harness', 'leaf-mantle'],
    headwear: ['none', 'hood', 'coif', 'nasal', 'kettle', 'cap', 'circlet', 'beret', 'wrapped-hood', 'headband', 'veil', 'fur-cap', 'arming-cap', 'chaperon', 'straw-hat', 'feathered-cap', 'coronet', 'round-helm', 'turban', 'linen-wrap', 'draped-veil', 'pearl-hood', 'leaf-circlet', 'heraldic-cap', 'forge-helm', 'warband', 'vine-diadem']
  });
  // Length describes the hair before it is tied or braided; bald is separate.
  const HAIR_GROUPS=Object.freeze({
    Short:Object.freeze(['cropped','tonsure','receding','undercut','buzz-cut','crew-cut','caesar','textured-crop','short-quiff','brushed-up','knight-crop','war-crest']),
    Medium:Object.freeze(['pageboy','waves','swept','curls','tousled','side-part','swept-back','curtains','shag','slick-side','curly-shag']),
    Long:Object.freeze(['long','braids','ponytail','high-bun','low-bun','half-up','single-braid','topknot','shoulder-length','loose-side-braid','loose-center-part','tied-back-waves','forge-braids','braided-crown']),
    'No hair':Object.freeze(['none'])
  });
  const HEADWEAR_GROUPS=Object.freeze({
    Open:Object.freeze(['none','headband','circlet','coronet','leaf-circlet','warband','vine-diadem']),
    'Caps and helmets':Object.freeze(['cap','nasal','kettle','beret','fur-cap','arming-cap','chaperon','straw-hat','feathered-cap','round-helm','turban','heraldic-cap','forge-helm']),
    Enclosing:Object.freeze(['hood','coif','wrapped-hood','veil','linen-wrap','pearl-hood']),
    Draped:Object.freeze(['draped-veil'])
  });
  const HEADWEAR_RULES=Object.freeze(Object.fromEntries(Object.entries(HEADWEAR_GROUPS).flatMap(([group,kinds])=>kinds.map(kind=>[kind,Object.freeze({
    type:group,ears:group==='Enclosing'||group==='Draped'?'hide':'show',hair:group==='Open'?'show':group==='Enclosing'?'hide':group==='Draped'?'frame':'tuck',
    ...(group==='Caps and helmets'?{rim:kind==='kettle'?40:kind==='straw-hat'?38:kind==='nasal'?36:35}:{})
  })]))));
  const ADJUSTMENTS=Object.freeze({
    faceWidth:{name:'Face width',min:-2,max:2},jawWidth:{name:'Jaw width',min:-2,max:2},
    eyeSpacing:{name:'Eye spacing',min:-2,max:2},eyeSize:{name:'Eye size',min:-1,max:1},
    noseWidth:{name:'Nose width',min:-2,max:2},mouthWidth:{name:'Mouth width',min:-2,max:2},
    earSize:{name:'Ear size',min:-1,max:1},hairVolume:{name:'Hair volume',min:-1,max:1}
  });
  const DEFAULTS = Object.freeze({adjustments:Object.freeze(Object.fromEntries(Object.keys(ADJUSTMENTS).map(k=>[k,0]))),race:'human',ears:'normal',seed:23,face:'angular',hair:'pageboy',eyes:'calm',brows:'bold',nose:'straight',mouth:'neutral',beard:'stubble',age:'seasoned',marks:'none',clothing:'gambeson',headwear:'none',profile:'custom'});
  const PROFILES=Object.freeze(['male','female','custom']);
  const PROFILE_FEATURES={
    male:{face:'chiseled',hair:'waves',eyes:'clear',brows:'sculpted',nose:'straight',mouth:'gentle-smile',beard:'none'},
    female:{face:'heart',hair:'long',eyes:'almond',brows:'soft',nose:'slender',mouth:'cupid',beard:'none'}
  };
  const RACE_FEATURES=Object.freeze({
    human:{face:'balanced',ears:'normal',nose:'straight',eyes:'human-steady'},
    dwarf:{face:'dwarven',ears:'rounded',nose:'dwarf-bulb'},
    orc:{face:'orcish',ears:'orc',nose:'orc-flat',mouth:'small-tusks'},
    elf:{face:'elven',ears:'elven-long',nose:'slender',eyes:'elf-slanted',beard:'none'}
  });
  // One compatibility catalog drives selectors, normalization and each generator.
  const EXCLUSIVE_PARTS={
    face:{dwarven:['dwarf'],'dwarf-square':['dwarf'],orcish:['orc'],'orc-heavy':['orc'],elven:['elf'],'elf-high-cheek':['elf']},
    ears:{pointed:['orc','elf'],'elven-long':['elf'],'elf-swept':['elf'],orc:['orc']},
    eyes:{'human-steady':['human'],'elf-slanted':['elf']},
    nose:{'orc-flat':['orc'],'orc-broad':['orc'],'dwarf-bulb':['dwarf']},
    mouth:{'small-tusks':['orc'],'heavy-tusks':['orc']},
    hair:{'knight-crop':['human'],'forge-braids':['dwarf'],'war-crest':['orc'],'braided-crown':['elf'],tonsure:['human','dwarf']},
    beard:{'bound-beard':['dwarf'],'chin-bristle':['orc']},
    clothing:{'guild-doublet':['human'],'rune-mail':['dwarf'],'hide-harness':['orc'],'leaf-mantle':['elf']},
    headwear:{'heraldic-cap':['human'],'forge-helm':['dwarf'],warband:['orc'],'vine-diadem':['elf']}
  };
  const RACE_LIMITS={
    human:{face:['oval','angular','broad','long','round','chiseled','heart','balanced','soft-oval','tapered','full-cheeked','narrow','youthful','soft-heart','strong-jaw'],ears:['normal','small','rounded','broad','attached-lobe','none']},
    dwarf:{face:['dwarven','dwarf-square','broad','round','full-cheeked'],ears:['normal','small','rounded','broad','attached-lobe','none'],nose:['broad','rounded','short','wide-tip','crooked','dwarf-bulb'],eyes:['calm','heavy','deep-set','round','clear','focused','natural-wide'],brows:['bold','natural','flat','broken','full-soft','low-arch']},
    orc:{face:['orcish','orc-heavy','broad','strong-jaw'],ears:['orc','pointed','broad','none'],nose:['orc-flat','orc-broad','broad','wide-tip','crooked'],eyes:['heavy','keen','deep-set','focused','deep-almond','natural-wide'],brows:['bold','flat','full-soft','broken','low-arch'],mouth:['neutral','stern','thin','downturned','asymmetric-smile','small-tusks','heavy-tusks'],beard:['none','stubble','scruffy','sideburns','chin-bristle']},
    elf:{face:['elven','elf-high-cheek','oval','heart','narrow','tapered','soft-heart','balanced'],ears:['pointed','elven-long','elf-swept','none'],nose:['slender','straight','soft-tip','defined-tip','aquiline'],eyes:['elf-slanted','almond','clear','upturned','soft-lidded','deep-almond','keen'],brows:['soft','sculpted','slim','tapered-natural','arched','low-arch','high-arch'],beard:['none']}
  };
  const RACE_PARTS=Object.freeze(Object.fromEntries(OPTIONS.race.map(race=>[race,Object.freeze(Object.fromEntries(Object.entries(OPTIONS).filter(([key])=>key!=='race').map(([key,values])=>[key,Object.freeze((RACE_LIMITS[race][key]||values).filter(value=>!EXCLUSIVE_PARTS[key]?.[value]||EXCLUSIVE_PARTS[key][value].includes(race)))])))])));
  function partsFor(race,key){return key==='race'?OPTIONS.race:(RACE_PARTS[race]||RACE_PARTS.human)[key]||[];}
  const COLORS = Object.freeze({skin:'#b88b69',hair:'#45372e',iris:'#687f83',lips:'#9e7066',cloth:'#70464b',metal:'#899294',headwear:'#656e63'});
  const PRESETS = Object.freeze([
    {name:'Village levy',config:{profile:'male',seed:11,face:'round',hair:'pageboy',eyes:'wide',brows:'natural',nose:'button',mouth:'slight-smile',beard:'none',age:'young',marks:'freckles',clothing:'tunic',headwear:'cap'}},
    {name:'Company veteran',config:{profile:'male',seed:42,face:'angular',hair:'cropped',eyes:'keen',brows:'broken',nose:'crooked',mouth:'stern',beard:'stubble',age:'seasoned',marks:'scar',clothing:'mail',headwear:'coif'}},
    {name:'Court envoy',config:{profile:'female',seed:19,face:'oval',hair:'braids',eyes:'calm',brows:'arched',nose:'straight',mouth:'full',beard:'none',age:'young',marks:'none',clothing:'robe',headwear:'circlet'}},
    {name:'Forest ranger',config:{profile:'male',seed:71,face:'long',hair:'waves',eyes:'keen',brows:'flat',nose:'aquiline',mouth:'thin',beard:'goatee',age:'seasoned',marks:'scar',clothing:'tunic',headwear:'hood'}},
    {name:'Abbey brother',config:{profile:'male',seed:52,face:'long',hair:'tonsure',eyes:'heavy',brows:'natural',nose:'aquiline',mouth:'neutral',beard:'none',age:'elder',marks:'none',clothing:'robe',headwear:'none'}},
    {name:'Mounted sergeant',config:{profile:'male',seed:85,face:'broad',hair:'cropped',eyes:'keen',brows:'bold',nose:'broad',mouth:'stern',beard:'forked',age:'seasoned',marks:'none',clothing:'surcoat',headwear:'nasal'}},
    {name:'Road captain',config:{profile:'male',seed:93,face:'angular',hair:'pageboy',eyes:'downturned',brows:'bold',nose:'straight',mouth:'stern',beard:'trimmed',age:'seasoned',marks:'pockmarks',clothing:'gambeson',headwear:'kettle'}},
    {name:'Northern hunter',config:{profile:'male',seed:37,face:'broad',hair:'braids',eyes:'heavy',brows:'bold',nose:'broad',mouth:'neutral',beard:'braided',age:'seasoned',marks:'none',clothing:'fur',headwear:'none'}},
    {name:'Town merchant',config:{profile:'male',seed:24,face:'round',hair:'receding',eyes:'calm',brows:'arched',nose:'broad',mouth:'slight-smile',beard:'moustache',age:'elder',marks:'none',clothing:'robe',headwear:'cap'}},
    {name:'Village healer',config:{profile:'female',seed:69,face:'oval',hair:'long',eyes:'wide',brows:'natural',nose:'button',mouth:'full',beard:'none',age:'seasoned',marks:'freckles',clothing:'robe',headwear:'hood'}},
    {name:'Border warden',config:{profile:'male',seed:108,face:'angular',hair:'long',eyes:'downturned',brows:'flat',nose:'crooked',mouth:'thin',beard:'full',age:'elder',marks:'scar',clothing:'fur',headwear:'none'}},
    {name:'Castle retainer',config:{profile:'male',seed:121,face:'oval',hair:'pageboy',eyes:'calm',brows:'natural',nose:'straight',mouth:'neutral',beard:'trimmed',age:'young',marks:'none',clothing:'surcoat',headwear:'none'}},
    {name:'Handsome knight',config:{profile:'male',seed:201,face:'chiseled',hair:'waves',eyes:'clear',brows:'sculpted',nose:'straight',mouth:'gentle-smile',beard:'none',age:'young',marks:'none',clothing:'mail',headwear:'none'}},
    {name:'Court champion',config:{profile:'male',seed:202,face:'balanced',hair:'cropped',eyes:'almond',brows:'bold',nose:'broad',mouth:'gentle-smile',beard:'trimmed',age:'young',marks:'none',clothing:'gambeson',headwear:'none'}},
    {name:'Distinguished lord',config:{profile:'male',seed:203,face:'chiseled',hair:'swept',eyes:'clear',brows:'sculpted',nose:'aquiline',mouth:'neutral',beard:'trimmed',age:'seasoned',marks:'none',clothing:'surcoat',headwear:'circlet'}},
    {name:'Beautiful noblewoman',config:{profile:'female',seed:204,face:'heart',hair:'long',eyes:'almond',brows:'soft',nose:'slender',mouth:'cupid',beard:'none',age:'young',marks:'none',clothing:'robe',headwear:'circlet'}},
    {name:'Elegant envoy',config:{profile:'female',seed:205,face:'balanced',hair:'braids',eyes:'clear',brows:'soft',nose:'straight',mouth:'gentle-smile',beard:'none',age:'young',marks:'none',clothing:'robe',headwear:'none'}},
    {name:'Graceful huntress',config:{profile:'female',seed:206,face:'balanced',hair:'waves',eyes:'almond',brows:'sculpted',nose:'slender',mouth:'cupid',beard:'none',age:'young',marks:'freckles',clothing:'fur',headwear:'none'}},
    {"name":"Curly scholar","config":{"profile":"male","seed":310,"face":"soft-oval","hair":"curls","eyes":"hooded","brows":"feathered","nose":"rounded","mouth":"reserved-smile","beard":"none","clothing":"brocade","headwear":"none","age":"young","marks":"none"}},
    {"name":"Braided scout","config":{"profile":"female","seed":311,"face":"tapered","hair":"single-braid","eyes":"upturned","brows":"low-arch","nose":"short","mouth":"parted","beard":"none","clothing":"leather","headwear":"none","age":"young","marks":"none"}},
    {"name":"Tied-back knight","config":{"profile":"male","seed":312,"face":"chiseled","hair":"ponytail","eyes":"focused","brows":"bold","nose":"roman","mouth":"thin-smile","beard":"short-boxed","clothing":"brigandine","headwear":"none","age":"young","marks":"none"}},
    {"name":"Summer duchess","config":{"profile":"female","seed":313,"face":"heart","hair":"high-bun","eyes":"round","brows":"high-arch","nose":"button","mouth":"broad-smile","beard":"none","clothing":"brocade","headwear":"circlet","age":"young","marks":"none"}},
    {"name":"Storm captain","config":{"profile":"male","seed":314,"face":"broad","hair":"undercut","eyes":"deep-set","brows":"flat","nose":"wide-tip","mouth":"stern","beard":"rounded","clothing":"cloak","headwear":"none","age":"seasoned","marks":"none"}},
    {"name":"Quiet healer","config":{"profile":"female","seed":315,"face":"soft-oval","hair":"low-bun","eyes":"relaxed","brows":"slim","nose":"slender","mouth":"gentle-smile","beard":"none","clothing":"robe","headwear":"veil","age":"young","marks":"none"}},
    {"name":"Travelling poet","config":{"profile":"male","seed":316,"face":"narrow","hair":"tousled","eyes":"smiling","brows":"feathered","nose":"straight","mouth":"asymmetric-smile","beard":"sideburns","clothing":"cloak","headwear":"beret","age":"young","marks":"none"}},
    {"name":"Forest courier","config":{"profile":"female","seed":317,"face":"balanced","hair":"half-up","eyes":"clear","brows":"soft","nose":"short","mouth":"reserved-smile","beard":"none","clothing":"leather","headwear":"headband","age":"young","marks":"none"}},
    {"name":"Veteran marshal","config":{"profile":"male","seed":318,"face":"angular","hair":"swept-back","eyes":"keen","brows":"low-arch","nose":"aquiline","mouth":"downturned","beard":"walrus","clothing":"brigandine","headwear":"none","age":"seasoned","marks":"none"}},
    {"name":"Court musician","config":{"profile":"female","seed":319,"face":"full-cheeked","hair":"side-part","eyes":"almond","brows":"arched","nose":"rounded","mouth":"pout","beard":"none","clothing":"brocade","headwear":"none","age":"young","marks":"none"}},
    {"name":"Northern rider","config":{"profile":"male","seed":320,"face":"long","hair":"topknot","eyes":"heavy","brows":"bold","nose":"broad","mouth":"neutral","beard":"tapered-beard","clothing":"fur","headwear":"fur-cap","age":"seasoned","marks":"none"}},
    {"name":"Road herbalist","config":{"profile":"female","seed":321,"face":"round","hair":"curls","eyes":"wide","brows":"soft","nose":"button","mouth":"broad-smile","beard":"none","clothing":"cloak","headwear":"wrapped-hood","age":"young","marks":"none"}},
    {"name":"Garrison recruit","config":{"profile":"male","seed":510,"face":"balanced","hair":"buzz-cut","eyes":"clear","brows":"sculpted","nose":"straight","mouth":"neutral","beard":"stubble","age":"young","marks":"none","clothing":"doublet","headwear":"none"}},
    {"name":"Guild duelist","config":{"profile":"male","seed":511,"face":"chiseled","hair":"crew-cut","eyes":"focused","brows":"bold","nose":"roman","mouth":"reserved-smile","beard":"none","age":"young","marks":"none","clothing":"plate","headwear":"none"}},
    {"name":"Old town guard","config":{"profile":"male","seed":512,"face":"broad","hair":"caesar","eyes":"heavy","brows":"natural","nose":"rounded","mouth":"neutral","beard":"none","age":"seasoned","marks":"none","clothing":"tabard","headwear":"none"}},
    {"name":"Castle scout","config":{"profile":"male","seed":513,"face":"angular","hair":"textured-crop","eyes":"keen","brows":"sculpted","nose":"straight","mouth":"reserved-smile","beard":"stubble","age":"young","marks":"none","clothing":"jerkin","headwear":"none"}},
    {"name":"Young cavalier","config":{"profile":"male","seed":514,"face":"heart","hair":"short-quiff","eyes":"almond","brows":"bold","nose":"roman","mouth":"neutral","beard":"none","age":"young","marks":"none","clothing":"lamellar","headwear":"none"}},
    {"name":"Hill fighter","config":{"profile":"male","seed":515,"face":"long","hair":"brushed-up","eyes":"clear","brows":"natural","nose":"rounded","mouth":"reserved-smile","beard":"none","age":"young","marks":"none","clothing":"scale","headwear":"none"}},
    {"name":"Court scribe","config":{"profile":"male","seed":516,"face":"soft-oval","hair":"curtains","eyes":"focused","brows":"sculpted","nose":"straight","mouth":"neutral","beard":"stubble","age":"young","marks":"none","clothing":"embroidered-robe","headwear":"none"}},
    {"name":"Wandering swordsman","config":{"profile":"male","seed":517,"face":"narrow","hair":"shag","eyes":"heavy","brows":"bold","nose":"roman","mouth":"reserved-smile","beard":"none","age":"young","marks":"none","clothing":"traveler-coat","headwear":"none"}},
    {"name":"Palace steward","config":{"profile":"male","seed":518,"face":"oval","hair":"slick-side","eyes":"keen","brows":"natural","nose":"rounded","mouth":"neutral","beard":"none","age":"young","marks":"none","clothing":"brocade","headwear":"none"}},
    {"name":"Highland captain","config":{"profile":"male","seed":519,"face":"chiseled","hair":"shoulder-length","eyes":"almond","brows":"sculpted","nose":"straight","mouth":"reserved-smile","beard":"stubble","age":"young","marks":"none","clothing":"cloak","headwear":"none"}},
    {"name":"Braided shieldmaiden","config":{"profile":"female","seed":720,"face":"soft-heart","hair":"loose-side-braid","eyes":"soft-lidded","brows":"tapered-natural","nose":"defined-tip","mouth":"soft-full","beard":"none","age":"young","marks":"none","clothing":"ruffled-mail","headwear":"none"}},
    {"name":"Veiled village daughter","config":{"profile":"female","seed":721,"face":"youthful","hair":"loose-side-braid","eyes":"natural-wide","brows":"full-soft","nose":"soft-tip","mouth":"relaxed-bow","beard":"none","age":"young","marks":"none","clothing":"linen-chemise","headwear":"draped-veil"}},
    {"name":"Curly young traveler","config":{"profile":"male","seed":722,"face":"youthful","hair":"curly-shag","eyes":"natural-wide","brows":"full-soft","nose":"soft-tip","mouth":"soft-full","beard":"none","age":"young","marks":"none","clothing":"traveler-coat","headwear":"none"}},
    {"name":"Cropped household knight","config":{"profile":"male","seed":723,"face":"strong-jaw","hair":"buzz-cut","eyes":"deep-almond","brows":"tapered-natural","nose":"defined-tip","mouth":"relaxed-bow","beard":"close-beard","age":"young","marks":"none","clothing":"embroidered-doublet","headwear":"none"}},
    {"name":"Pearl hood noblewoman","config":{"profile":"female","seed":724,"face":"soft-heart","hair":"loose-center-part","eyes":"soft-lidded","brows":"tapered-natural","nose":"soft-tip","mouth":"soft-full","beard":"none","age":"young","marks":"none","clothing":"velvet-bodice","headwear":"pearl-hood"}},
    {"name":"Leaf circlet envoy","config":{"profile":"female","seed":725,"face":"soft-heart","hair":"loose-center-part","eyes":"deep-almond","brows":"tapered-natural","nose":"defined-tip","mouth":"relaxed-bow","beard":"none","age":"young","marks":"none","clothing":"embroidered-doublet","headwear":"leaf-circlet"}},
    {"name":"Tied back retainer","config":{"profile":"male","seed":726,"face":"strong-jaw","hair":"tied-back-waves","eyes":"deep-almond","brows":"full-soft","nose":"defined-tip","mouth":"relaxed-bow","beard":"scruffy","age":"young","marks":"none","clothing":"velvet-bodice","headwear":"none"}},
    {"name":"Human wanderer","config":{"race":"human","profile":"male","seed":840,"face":"balanced","ears":"normal","nose":"straight","hair":"crew-cut","beard":"stubble","clothing":"cloak","eyes":"clear","brows":"bold","mouth":"gentle-smile","age":"young","marks":"none","headwear":"none"}},
    {"name":"Human envoy","config":{"race":"human","profile":"female","seed":841,"face":"heart","ears":"small","nose":"slender","hair":"loose-center-part","beard":"none","clothing":"velvet-bodice","eyes":"clear","brows":"soft","mouth":"gentle-smile","age":"young","marks":"none","headwear":"none"}},
    {"name":"Dwarf smith","config":{"race":"dwarf","profile":"male","seed":842,"face":"dwarven","ears":"rounded","nose":"broad","hair":"braids","beard":"braided","clothing":"leather","eyes":"clear","brows":"bold","mouth":"gentle-smile","age":"seasoned","marks":"none","headwear":"none"}},
    {"name":"Dwarf steward","config":{"race":"dwarf","profile":"female","seed":843,"face":"dwarven","ears":"broad","nose":"broad","hair":"braids","beard":"none","clothing":"embroidered-doublet","eyes":"clear","brows":"soft","mouth":"gentle-smile","age":"seasoned","marks":"none","headwear":"none"}},
    {"name":"Orc scout","config":{"race":"orc","profile":"male","seed":844,"face":"orcish","ears":"orc","nose":"orc-flat","hair":"undercut","beard":"none","clothing":"brigandine","eyes":"deep-almond","brows":"bold","mouth":"neutral","age":"young","marks":"none","headwear":"none"}},
    {"name":"Orc warden","config":{"race":"orc","profile":"female","seed":845,"face":"orcish","ears":"pointed","nose":"orc-flat","hair":"tied-back-waves","beard":"none","clothing":"cloak","eyes":"deep-almond","brows":"soft","mouth":"neutral","age":"young","marks":"none","headwear":"none"}},
    {"name":"Elf ranger","config":{"race":"elf","profile":"male","seed":846,"face":"elven","ears":"elven-long","nose":"slender","hair":"half-up","beard":"none","clothing":"leather","eyes":"almond","brows":"bold","mouth":"gentle-smile","age":"young","marks":"none","headwear":"none"}},
    {"name":"Elf envoy","config":{"race":"elf","profile":"female","seed":847,"face":"elven","ears":"elven-long","nose":"slender","hair":"loose-center-part","beard":"none","clothing":"embroidered-robe","eyes":"almond","brows":"soft","mouth":"gentle-smile","age":"young","marks":"none","headwear":"none"}},
    {"name":"Human guild captain","config":{"race":"human","profile":"male","seed":960,"face":"chiseled","ears":"normal","hair":"knight-crop","eyes":"human-steady","brows":"bold","nose":"defined-tip","mouth":"gentle-smile","beard":"close-beard","clothing":"guild-doublet","headwear":"heraldic-cap","age":"young","marks":"none"}},
    {"name":"Dwarf rune smith","config":{"race":"dwarf","profile":"male","seed":961,"face":"dwarf-square","ears":"broad","hair":"forge-braids","eyes":"heavy","brows":"bold","nose":"dwarf-bulb","mouth":"stern","beard":"bound-beard","clothing":"rune-mail","headwear":"forge-helm","age":"mature","marks":"none"}},
    {"name":"Orc war rider","config":{"race":"orc","profile":"male","seed":962,"face":"orc-heavy","ears":"orc","hair":"war-crest","eyes":"focused","brows":"bold","nose":"orc-broad","mouth":"heavy-tusks","beard":"none","clothing":"hide-harness","headwear":"warband","age":"young","marks":"none"}},
    {"name":"Elf grove sentinel","config":{"race":"elf","profile":"male","seed":963,"face":"elf-high-cheek","ears":"elf-swept","hair":"braided-crown","eyes":"elf-slanted","brows":"sculpted","nose":"slender","mouth":"reserved-smile","beard":"none","clothing":"leaf-mantle","headwear":"vine-diadem","age":"young","marks":"none"}},
    {"name":"Human court crafter","config":{"race":"human","profile":"female","seed":964,"face":"heart","ears":"small","hair":"knight-crop","eyes":"human-steady","brows":"soft","nose":"button","mouth":"soft-full","beard":"none","clothing":"guild-doublet","headwear":"none","age":"young","marks":"none"}},
    {"name":"Dwarf rune steward","config":{"race":"dwarf","profile":"female","seed":965,"face":"dwarven","ears":"rounded","hair":"forge-braids","eyes":"round","brows":"full-soft","nose":"dwarf-bulb","mouth":"gentle-smile","beard":"none","clothing":"rune-mail","headwear":"headband","age":"mature","marks":"none"}},
    {"name":"Orc war caller","config":{"race":"orc","profile":"female","seed":966,"face":"orcish","ears":"pointed","hair":"war-crest","eyes":"natural-wide","brows":"full-soft","nose":"orc-flat","mouth":"small-tusks","beard":"chin-bristle","clothing":"hide-harness","headwear":"none","age":"young","marks":"none"}},
    {"name":"Elf grove envoy","config":{"race":"elf","profile":"female","seed":967,"face":"elven","ears":"elven-long","hair":"braided-crown","eyes":"elf-slanted","brows":"arched","nose":"soft-tip","mouth":"soft-full","beard":"none","clothing":"leaf-mantle","headwear":"none","age":"young","marks":"none"}}
  ]);
  // Each source is independent. Headwear has two passes; mail has its own metal tint.
  const LAYERS = Object.freeze([
    {id:'hairBack',name:'Hair · back',channel:'hair',feature:'hair'},
    {id:'headwearBack',name:'Headwear · back',channel:'headwear',feature:'headwear'},
    {id:'clothing',name:'Clothing',channel:'cloth',feature:'clothing'},
    {id:'armor',name:'Mail / metal',channel:'metal',feature:'clothing'},
    {id:'ears',name:'Ears',channel:'skin',feature:'ears'},
    {id:'face',name:'Face shape / skin',channel:'skin',feature:'face'},
    {id:'age',name:'Age / skin lines',channel:'skin',feature:'age'},
    {id:'marks',name:'Scars / skin marks',channel:'skin',feature:'marks'},
    {id:'nose',name:'Nose',channel:'skin',feature:'nose'},
    {id:'eyes',name:'Eyes · whites',channel:null,feature:'eyes'},
    {id:'iris',name:'Eyes · irises',channel:'iris',feature:'eyes'},
    {id:'eyelids',name:'Eyes · upper lids',channel:'skin',feature:'eyes'},
    {id:'brows',name:'Eyebrows',channel:'hair',feature:'brows'},
    {id:'mouth',name:'Mouth',channel:'lips',feature:'mouth'},
    {id:'teeth',name:'Teeth / tusks',channel:null,feature:'mouth'},
    {id:'hairFront',name:'Hair · fringe',channel:'hair',feature:'hair'},
    {id:'headwearFront',name:'Headwear · front',channel:'headwear',feature:'headwear'},
    {id:'beard',name:'Facial hair',channel:'hair',feature:'beard'}
  ]);
  function canvas() {const c = document.createElement('canvas'); c.width = c.height = SIZE; return c;}
  function rng(seed) {let n = seed >>> 0; return () => {n += 0x6D2B79F5; let a = Math.imul(n ^ n >>> 15, n | 1); a ^= a + Math.imul(a ^ a >>> 7, a | 61); return ((a ^ a >>> 14) >>> 0) / 4294967296;};}
  function gray(n) {n = Math.round(n); return `rgb(${n},${n},${n})`;}
  function contour(g,points) {
    const p=points.map(([x,y])=>[Number(x),Number(y)]),n=p.length;
    g.beginPath();
    for(let i=0;i<n;i++) {
      const prev=p[(i+n-1)%n],at=p[i],next=p[(i+1)%n];
      const d0=Math.hypot(at[0]-prev[0],at[1]-prev[1])||1,d1=Math.hypot(next[0]-at[0],next[1]-at[1])||1;
      const r=Math.min(2,d0*.28,d1*.28),a=[at[0]+(prev[0]-at[0])*r/d0,at[1]+(prev[1]-at[1])*r/d0],b=[at[0]+(next[0]-at[0])*r/d1,at[1]+(next[1]-at[1])*r/d1];
      if(i===0)g.moveTo(...a);else g.lineTo(...a);
      g.quadraticCurveTo(...at,...b);
    }
    g.closePath();
  }
  function poly(g,p,n) {g.fillStyle=gray(n);contour(g,p);g.fill();}
  function rect(g,x,y,w,h,n) {g.fillStyle=gray(n); g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  function line(g,p,n,w=1) {g.strokeStyle=gray(n); g.lineWidth=w; g.beginPath(); p.forEach(([x,y],i)=>i ? g.lineTo(Math.round(x)+.5,Math.round(y)+.5) : g.moveTo(Math.round(x)+.5,Math.round(y)+.5)); g.stroke();}
  // Reuse one outer-to-inner template; reflecting the whole local frame also mirrors strokes.
  function featureFrame(g,x,y,direction,draw) {
    g.save();g.translate(x,y);g.scale(direction,1);draw();g.restore();
  }
  // Every part receives this same rig. Replacements never guess their own absolute coordinates.
  function rig(shape,adjustments={}) {
    const source = {oval:{w:22,jaw:14,chin:9,eye:10}, angular:{w:23,jaw:20,chin:11,eye:11}, broad:{w:27,jaw:22,chin:13,eye:12},long:{w:20,jaw:13,chin:8,eye:9,y:92},round:{w:26,jaw:18,chin:12,eye:11,y:86},chiseled:{w:24,jaw:20,chin:12,eye:11,y:87,cheek:57,jawY:79,eyeY:52,definition:1,softness:.15},heart:{w:23,jaw:13,chin:7,eye:11,y:86,cheek:57,eyeY:52,mouthY:74,noseY:63,definition:.15,softness:1},balanced:{w:23,jaw:16,chin:10,eye:11,y:88,cheek:58,eyeY:52,mouthY:75,definition:.4,softness:.6},'soft-oval':{w:23,jaw:15,chin:10,eye:11,y:88,cheek:58,softness:.85,definition:.2},tapered:{w:22,jaw:14,chin:9,eye:10,y:87,cheek:56,softness:.5,definition:.3},'full-cheeked':{w:26,jaw:19,chin:12,eye:11,y:87,cheek:59,softness:.8,definition:.1},narrow:{w:20,jaw:14,chin:9,eye:10,y:90,softness:.45,definition:.3},youthful:{w:23,jaw:15,chin:10,eye:11,y:86,cheek:57,eyeY:52,mouthY:74,noseY:63,softness:.9,definition:.1},'soft-heart':{w:24,jaw:14,chin:9,eye:11,y:87,cheek:57,eyeY:52,mouthY:75,noseY:64,softness:.9,definition:.25},'strong-jaw':{w:25,jaw:21,chin:12,eye:11,y:89,cheek:58,jawY:80,eyeY:52,mouthY:76,noseY:64,softness:.3,definition:.9},dwarven:{w:28,jaw:24,chin:15,eye:12,y:86,cheek:58,jawY:77,eyeY:52,mouthY:74,noseY:63,softness:.35,definition:.9},orcish:{w:29,jaw:25,chin:17,eye:12,y:90,cheek:59,jawY:80,eyeY:52,mouthY:77,noseY:64,softness:.2,definition:1},elven:{w:22,jaw:13,chin:8,eye:11,y:90,cheek:57,jawY:79,eyeY:52,mouthY:76,noseY:64,softness:.65,definition:.45},'dwarf-square':{w:29,jaw:25,chin:16,eye:12,y:87,cheek:58,jawY:78,eyeY:52,mouthY:75,noseY:63,softness:.2,definition:1},'orc-heavy':{w:30,jaw:26,chin:18,eye:12,y:91,cheek:59,jawY:81,eyeY:52,mouthY:78,noseY:65,softness:.15,definition:1},'elf-high-cheek':{w:22,jaw:13,chin:7,eye:11,y:90,cheek:55,jawY:79,eyeY:51,mouthY:75,noseY:63,softness:.5,definition:.7}}[shape];
    const m=Object.fromEntries(Object.keys(ADJUSTMENTS).map(k=>[k,adjustments[k]||0]));
    const v={...source,w:source.w+m.faceWidth,jaw:source.jaw+m.jawWidth,chin:source.chin+m.jawWidth*.5,eye:source.eye+m.eyeSpacing};
    v.jaw=Math.max(v.chin+2,Math.min(v.w-2,v.jaw));v.eye=Math.max(8,Math.min(v.w-8,v.eye));
    const cx=64, top=24, cheekY=v.cheek||61, chinY=v.y||88;
    // Sample an elliptical cranium instead of a flat polygon across the scalp.
    const crown=Array.from({length:19},(_,i)=>{const t=Math.PI+i*Math.PI/18;return [cx+v.w*Math.cos(t),49+(49-top+3)*Math.sin(t)];});
    const outline=[...crown,[cx+v.w-2,cheekY+7],[cx+v.jaw,v.jawY||78],[cx+v.chin,chinY-2],[cx,chinY],[cx-v.chin,chinY-2],[cx-v.jaw,v.jawY||78],[cx-v.w+2,cheekY+7]];
    return {cx,top,eyeScale:1+m.eyeSize*.12,w:v.w,jaw:v.jaw,chin:v.chin,chinY,outline,definition:v.definition||0,softness:v.softness||0,eyes:[{x:cx-v.eye,y:v.eyeY||53},{x:cx+v.eye,y:v.eyeY||53}],nose:{x:cx,y:v.noseY||(shape==='long'?65:shape==='round'?63:64)},mouth:{x:cx,y:v.mouthY||(shape==='long'?78:shape==='round'?74:76)},brows:[{x:cx-v.eye,y:(v.eyeY||53)-5},{x:cx+v.eye,y:(v.eyeY||53)-5}]};
  }
  function clip(g,p,draw) {g.save();contour(g,p);g.clip();draw();g.restore();}
  function texture(g,r,box,count,lo,hi) {for(let i=0;i<count;i++){const x=box[0]+Math.floor(r()*box[2]),y=box[1]+Math.floor(r()*box[3]); rect(g,x,y,1+r()*2,1,lo+r()*(hi-lo));}}
  function baseFace(g,a,c) {drawNeck(g,a,c);}
  function ears(g,a,c) {
    const kind=c.ears;if(kind==='none')return;
    for(const side of [-1,1])featureFrame(g,a.cx+side*(a.w-1),0,side,()=>{
      g.save();const scale=1+c.adjustments.earSize*.13;g.translate(0,56);g.scale(scale,scale);g.translate(0,-56);if(kind==='small')g.transform(.76,0,0,.8,0,11);else if(kind==='broad')g.transform(1.3,0,0,1,0,0);
      const swept=kind==='elf-swept',long=kind==='elven-long'||swept,pointed=long||kind==='pointed'||kind==='orc';
      const path=()=>{
        g.beginPath();g.moveTo(-1,49);
        if(pointed){const tip=long?20:kind==='orc'?12:11,top=swept?44:long?35:kind==='orc'?43:42;g.bezierCurveTo(5,48,tip-5,top+5,tip,top);g.quadraticCurveTo(tip+2,top-1,tip+1,top+2);g.bezierCurveTo(tip-1,top+10,9,61,2,65);g.bezierCurveTo(-2,65,-3,57,-1,49);}
        else {g.bezierCurveTo(2,43,8,46,7,53);g.bezierCurveTo(7,60,4,kind==='rounded'?65:66,1,kind==='attached-lobe'?63:66);g.bezierCurveTo(-2,64,-3,57,-1,49);}
        g.closePath();
      };
      path();const light=g.createLinearGradient(-1,0,long?18:7,0);light.addColorStop(0,gray(side<0?164:121));light.addColorStop(1,gray(side<0?144:103));g.fillStyle=light;g.fill();g.save();g.clip();
      if(pointed){const tip=long?17:kind==='orc'?10:9,top=swept?46:long?39:45;curve(g,[1,51,5,49,tip-2,top+4,tip,top],side<0?190:144,.85);curve(g,[tip-1,top+3,10,54,4,59,2,61],99,.8);}
      else {curve(g,[1,49,5,46,7,54,3,61],side<0?185:136,.85);curve(g,[2,53,.5,55,2,57,2,59],97,.75);if(kind==='rounded')curve(g,[2,63,5,62,6,57,5,54],143,1);}
      g.restore();g.restore();
    });
  }
  // One shared neckline keeps the skin and cloth layers joined without a pointed skin wedge.
  const COLLAR=[[48,94],[53,99],[58,102],[64,103],[70,102],[75,99],[80,94]];
  const REFINED_BODY=[[48,94],[34,96],[15,106],[4,125],[124,125],[113,107],[94,96],[80,94],...COLLAR.slice(0,-1).reverse()];
  const bodyOutline=()=>REFINED_BODY;
  function drawNeck(g,a,c) {
    const x=a.cx,half=Math.max(9,Math.min(['dwarven','dwarf-square','orcish','orc-heavy'].includes(c.face)?14:12,a.jaw*.45+2)),top=a.chinY-11;
    const outline=[[x-half,top],[x+half,top],[x+half-1,91],...COLLAR.slice().reverse(),[x-half+1,91]];
    surface(g,outline,(px,py)=>{
      const u=(px-x)/(half+2);
      let v=134+31*Math.sqrt(Math.max(0,1-u*u))-12*u;
      v-=30*falloff(px,py,x,a.chinY+1,half+1,3.3);
      v-=8*falloff(px,py,x+6,96,3.5,7);
      v+=6*falloff(px,py,x-5,96,3.5,7);
      v-=10*falloff(px,py,x,103,17,2);
      return v+grain(Math.floor(px),Math.floor(py),c.seed)*1.5;
    });
  }
  function clothing(g,a,c) {
    const kind=c.clothing;
    const body=bodyOutline(c);
    poly(g,body,58);
    clip(g,body,()=>{
      poly(g,[[32,98],[46,95],[58,112],[64,125],[9,125],[20,109]],92);
      poly(g,[[83,96],[98,101],[115,115],[123,125],[68,125],[72,111]],72);
      if(kind==='gambeson') {
        for(let x=9;x<126;x+=9)line(g,[[x,91],[x-12,126]],43);
        for(let y=98;y<129;y+=8)line(g,[[8,y],[122,y+3]],118);
        line(g,[[38,97],[49,112],[51,125]],144);
        line(g,[[84,97],[76,113],[76,125]],106);
      } else if(kind==='robe') {
        for(const x of [17,32,47,78,93,108]){line(g,[[x,99],[x-5,125]],43,2);line(g,[[x+2,101],[x-1,125]],110);}
        line(g,[[9,119],[39,116],[64,119],[92,117],[120,121]],157,2);
        line(g,[[62,118],[68,121],[64,124]],185);
      } else if(kind==='fur') {
        poly(g,[[26,97],[43,91],[50,99],[58,106],[49,113],[37,108],[23,111],[14,108]],140);
        poly(g,[[82,93],[100,99],[114,109],[100,114],[87,109],[74,111],[69,105]],104);
        const R=rng(c.seed+812);for(let i=0;i<80;i++){const x=17+Math.floor(R()*95),y=98+Math.floor(R()*14);if(Math.abs(x-64)<9)continue;line(g,[[x,y],[x-2,y+3]],80+R()*90);}
      }
      if(kind==='leather'||kind==='brigandine') {
        poly(g,[[33,98],[47,95],[60,105],[80,96],[97,101],[108,125],[19,125]],95);
        for(const side of [-1,1])curve(g,[64+side*19,99,64+side*20,108,64+side*28,118,64+side*30,125],49,1.5);
        curve(g,[37,102,46,106,56,117,70,125],158,2.3);
        for(let y=107;y<125;y+=4)line(g,[[60,y],[67,y+1]],129,.5);
      }
      if(kind==='cloak'){poly(g,[[35,97],[50,95],[61,105],[53,125],[6,125]],116);poly(g,[[79,95],[97,100],[123,125],[68,125]],79);for(const side of [-1,1])curve(g,[64+side*20,98,64+side*27,104,64+side*21,115,64+side*34,125],side<0?146:105,1.2);oval(g,57,105,2.4,1.8,181);}
      if(kind==='brocade'){for(let y=104;y<126;y+=8)for(let x=20;x<111;x+=13){curve(g,[x,y+4,x-5,y-2,x+6,y-2,x+2,y+4],137,.6);curve(g,[x+2,y+4,x+7,y+9,x-3,y+9,x,y+4],102,.6);}curve(g,[43,99,48,107,55,111,64,112],172,1);}
      if(['doublet','jerkin','traveler-coat','embroidered-robe'].includes(kind)) {
        poly(g,[[37,97],[49,95],[64,105],[79,95],[96,99],[111,125],[17,125]],kind==='jerkin'?86:kind==='doublet'?107:73);
        for(const side of [-1,1])curve(g,[64+side*18,98,64+side*20,105,64+side*14,115,64+side*19,125],side<0?145:105,1);
        curve(g,[64,106,63,111,65,119,64,126],43,1.1);
        if(kind==='doublet')for(let y=109;y<125;y+=4)oval(g,66,y,.9,.9,181);
        if(kind==='jerkin'){curve(g,[40,99,44,106,46,116,45,125],139,2);curve(g,[87,99,84,107,82,117,83,125],111,2);for(let y=108;y<125;y+=5)curve(g,[59,y,61,y+1,65,y+2,68,y],148,.8);}
        if(kind==='traveler-coat'){poly(g,[[41,97],[51,95],[61,106],[53,116],[40,103]],128);poly(g,[[78,95],[91,99],[86,105],[72,115],[67,105]],107);curve(g,[21,124,36,120,46,120,52,124],49,2);}
        if(kind==='embroidered-robe')for(const side of [-1,1])for(let y=105;y<126;y+=5){const x=64+side*(12+(y-105)*.16);curve(g,[x,y,x-side*6,y-3,x-side*6,y+4,x,y+2],169,.8);}
      }
      if(kind==='tabard'){poly(g,[[44,97],[55,103],[74,103],[84,97],[88,125],[39,125]],122);curve(g,[45,102,45,112,44,120,43,125],172,1);curve(g,[84,102,83,112,83,120,84,125],65,1);oval(g,64,116,7,8,71);curve(g,[59,117,60,109,68,109,69,117],183,1.4);}
      if(['linen-chemise','velvet-bodice','embroidered-doublet','ruffled-mail'].includes(kind)) {
        const light=kind==='linen-chemise';poly(g,[[35,97],[49,95],[64,105],[79,95],[96,99],[113,125],[15,125]],light?159:78);
        for(const side of [-1,1])for(let i=0;i<4;i++)curve(g,[64+side*(19+i*5),99+i,64+side*(15+i*7),107,64+side*(20+i*6),117,64+side*(22+i*7),126],light?120+i*10:102+i*8,.8);
        if(kind==='linen-chemise'||kind==='velvet-bodice'){curve(g,[43,99,48,111,79,111,85,99],light?195:165,2);for(const side of [-1,1]){curve(g,[64+side*21,99,64+side*25,106,64+side*27,116,64+side*27,125],67,5);for(let y=103;y<126;y+=5)curve(g,[64+side*24,y,64+side*21,y+1,64+side*23,y+4,64+side*26,y+3],150,.8);}}
        if(kind==='velvet-bodice')poly(g,[[51,111],[77,111],[82,125],[46,125]],54);
        if(kind==='embroidered-doublet'){for(const side of [-1,1])for(let y=103;y<126;y+=7){const px=64+side*(13+(y-103)*.8);curve(g,[px,y,px-side*6,y-3,px-side*5,y+4,px,y+3],158,.7);oval(g,px,y+2,1,1.1,183);}curve(g,[64,105,62,112,65,118,64,126],39,1.5);}
        if(kind==='ruffled-mail'){for(const side of [-1,1])for(let i=0;i<7;i++){const px=64+side*(13+i*2.4),py=100-i*.8;oval(g,px,py,2.2,3.5,97+i*5,-side*.4);curve(g,[px-1,py-2,px+1,py-3,px+2,py,px+1,py+2],158,.7);}}
      }
      if(kind==='guild-doublet'){poly(g,[[36,98],[49,95],[64,104],[79,95],[96,100],[111,125],[17,125]],102);curve(g,[64,105,63,113,65,121,64,126],43,1.3);for(const side of [-1,1])for(let y=104;y<126;y+=6){const px=64+side*18;curve(g,[px,y,px-side*5,y-2,px-side*5,y+4,px,y+3],166,.7);}for(let y=108;y<126;y+=4)oval(g,66,y,.8,.8,185);}
      if(kind==='rune-mail')curve(g,[45,98,49,107,78,107,83,98],134,3);
      if(kind==='hide-harness'){for(const side of [-1,1]){poly(g,[[64+side*15,97],[64+side*24,98],[64+side*37,125],[64+side*24,125]],91);curve(g,[64+side*20,99,64+side*23,107,64+side*28,116,64+side*31,125],137,1.2);}for(let y=109;y<125;y+=5)curve(g,[57,y,60,y-1,67,y+2,71,y],116,.8);}
      if(kind==='leaf-mantle')for(const side of [-1,1])for(let i=0;i<5;i++){const px=64+side*(14+i*5),py=98+i*3;g.beginPath();g.moveTo(px,py);g.bezierCurveTo(px+side*14,py-1,px+side*12,py+10,px+side*16,py+18);g.bezierCurveTo(px+side*3,py+15,px-side*1,py+7,px,py);g.fillStyle=gray(87+i*10);g.fill();curve(g,[px+side,py+2,px+side*4,py+6,px+side*10,py+12,px+side*14,py+16],143,.7);}
      // Cloth lacing rather than a modern button placket.
      if(kind==='tunic'||kind==='gambeson'||kind==='surcoat') {
        poly(g,[[48,94],[51,93],[56,98],[64,101],[64,105],[56,103],[51,99]],kind==='tunic'?153:119);
        poly(g,[[80,94],[77,93],[72,98],[64,101],[64,105],[72,103],[77,99]],kind==='tunic'?132:96);
        line(g,[[63,109],[63,125]],35,2);
        for(let y=111;y<124;y+=4){line(g,[[59,y],[67,y+3]],168);line(g,[[67,y],[59,y+3]],135);}
      }
      if(kind==='surcoat') {
        poly(g,[[47,97],[58,109],[70,109],[82,97],[88,125],[39,125]],120);
        line(g,[[48,103],[44,125]],166);line(g,[[79,103],[83,125]],79);
        line(g,[[63,113],[63,123]],185,3);line(g,[[57,117],[69,117]],185,2);
      }
    });
    line(g,COLLAR,107,1.25);
  }
  function chain(g,outline,c) {
    // Small overlapping ovals in staggered rows suggest European four-in-one mail.
    // The dark centers remain visible; only short wire arcs catch the light.
    surface(g,outline,(x,y)=>58+16*falloff(x,y,45,45,27,50)+17*falloff(x,y,42,105,40,24)-12*falloff(x,y,94,76,22,45)+grain(Math.floor(x),Math.floor(y),41)*3);
    clip(g,outline,()=>{
      let row=0;
      for(let y=8;y<130;y+=2.15,row++)for(let x=1+(row%2)*1.65;x<130;x+=3.3) {
        const drape=y>86?.75*Math.sin((x-64)/17):.25*Math.sin((x-64)/19);
        const cx=x+.24*Math.sin(y/13),cy=y+drape,tilt=row%2?.22:-.22;
        const light=11*falloff(cx,cy,40,45,27,55)+13*falloff(cx,cy,42,106,38,22)-9*falloff(cx,cy,96,65,25,50);
        const variation=grain(Math.round(x),row,67)*8;
        const arc=(start,end,value,width,ox=0,oy=0)=>{
          g.strokeStyle=gray(value);g.lineWidth=width;g.beginPath();
          g.ellipse(cx+ox,cy+oy,1.38,1.02,tilt,start,end);g.stroke();
        };
        arc(0,Math.PI*2,32+light*.3,1.05,0,.18);
        arc(0,Math.PI*2,102+light+variation,.65);
        arc(Math.PI*1.02,Math.PI*1.70,149+light+variation,.65,-.08,-.08);
        arc(.08,Math.PI*.66,76+light+variation,.6);
      }
    });
  }
  function armor(g,a,c) {
    if(['scale','lamellar','plate'].includes(c.clothing)) {
      const outline=[[35,99],[47,97],[56,105],[72,105],[82,97],[96,101],[111,125],[17,125]];
      surface(g,outline,(px,py)=>99+58*falloff(px,py,49,104,29,23)-25*falloff(px,py,91,114,20,22));
      clip(g,outline,()=>{
        if(c.clothing==='scale')for(let row=0;row<6;row++)for(let x=20+(row%2)*4;x<112;x+=8){const y=100+row*5;oval(g,x,y,4.2,4.1,76);curve(g,[x-3,y-2,x-4,y+4,x+4,y+4,x+3,y-2],156,.8);}
        if(c.clothing==='lamellar')for(let y=100;y<128;y+=8)for(let x=24;x<111;x+=7){poly(g,[[x-2,y],[x+2,y],[x+3,y+6],[x-3,y+6]],124);curve(g,[x-1,y+1,x,y+2,x,y+3,x+1,y+4],52,.7);oval(g,x,y+5,.8,.8,196);}
        if(c.clothing==='plate'){for(const side of [-1,1]){curve(g,[64+side*4,105,64+side*13,109,64+side*24,105,64+side*30,101],182,1.2);curve(g,[64+side*2,108,64+side*6,114,64+side*11,121,64+side*14,125],side<0?195:77,1.4);}for(let y=119;y<128;y+=4)curve(g,[22,y,44,y-3,83,y-3,108,y],62,1);}
      });return;
    }
    if(c.clothing==='rune-mail'){chain(g,bodyOutline(c),c);for(const x of [39,51,77,89]){line(g,[[x,108],[x,116]],181,1);line(g,[[x,109],[x+3,111],[x,113]],173,1);}return;}
    if(c.clothing==='ruffled-mail'){chain(g,[[47,107],[56,111],[72,111],[80,107],[86,125],[41,125]],c);return;}
    if(c.clothing==='brigandine'){for(let y=106;y<126;y+=6)for(let x=31;x<103;x+=9)oval(g,x+(y%4),y,1.1,1.1,198);return;}
    if(c.clothing!=='mail'&&c.clothing!=='surcoat')return;
    if(c.clothing==='mail')chain(g,bodyOutline(c),c);
    else {
      chain(g,[[32,97],[45,94],[48,109],[39,125],[5,125],[15,107]],c);
      chain(g,[[83,95],[97,99],[114,109],[124,125],[89,125],[79,109]],c);
    }
    line(g,[[24,103],[39,98],[45,101]],147,1);
    line(g,[[85,100],[100,106],[110,115]],107,1);
  }
  function age(g,a,c) {
    if(c.age==='young')return;
    if(c.age==='mature'){
      clip(g,a.outline,()=>{g.save();g.globalAlpha=.42;
        for(const e of a.eyes){const side=e.x<a.cx?-1:1;
          curve(g,[e.x-3,e.y+6,e.x-1,e.y+6.8,e.x+1,e.y+6.8,e.x+3,e.y+6],158,.85);
          curve(g,[e.x+side*6,e.y+3,e.x+side*7,e.y+3.5,e.x+side*7.5,e.y+4,e.x+side*8,e.y+4.5],164,.65);
        }
        g.globalAlpha=.25;curve(g,[a.cx-7,40,a.cx-3,39,a.cx+3,39,a.cx+7,40],163,.7);
        g.restore();});return;
    }
    clip(g,a.outline,()=>{
      for(const e of a.eyes){const side=e.x<a.cx?-1:1;line(g,[[e.x+side*6,e.y+3],[e.x+side*9,e.y+5]],117);line(g,[[e.x-4,e.y+6],[e.x+3,e.y+6]],133);}
      for(const side of [-1,1])line(g,[[a.cx+side*9,69],[a.cx+side*12,74],[a.cx+side*12,79]],120);
      if(c.age==='weathered'){for(const y of [37,42])curve(g,[a.cx-11,y,a.cx-3,y-2,a.cx+4,y+1,a.cx+11,y],125,.65);for(const side of [-1,1])line(g,[[a.cx+side*18,64],[a.cx+side*14,72],[a.cx+side*15,79]],110,.7);}
      if(c.age==='elder') {
        for(const y of [35,39,43]){line(g,[[a.cx-12,y],[a.cx-4,y-1],[a.cx+8,y],[a.cx+12,y-1]],134);line(g,[[a.cx-9,y+1],[a.cx+8,y+1]],186);}
        for(const side of [-1,1]){line(g,[[a.cx+side*17,65],[a.cx+side*14,71]],112);line(g,[[a.cx+side*13,76],[a.cx+side*14,82]],112);}
      }
    });
    if(c.age==='elder')line(g,[[56,96],[63,98],[73,96]],105);
  }
  function marks(g,a,c) {
    if(c.marks==='none')return;
    const R=rng(c.seed+708);
    clip(g,a.outline,()=>{
      if(c.marks==='scar') {
        const e=a.eyes[1];line(g,[[e.x+7,41],[e.x+5,50],[e.x+3,61]],102);line(g,[[e.x+8,41],[e.x+6,50],[e.x+4,61]],206);return;
      }
      if(c.marks==='beauty-mark'){g.fillStyle=gray(91);g.beginPath();g.ellipse(a.cx+11,a.mouth.y-1,1.1,1.1,0,0,Math.PI*2);g.fill();return;}
      if(c.marks==='twin-scars'||c.marks==='brow-scar'){const e=a.eyes[1];for(let k=0;k<(c.marks==='twin-scars'?2:1);k++){const y=c.marks==='brow-scar'?44:63;curve(g,[e.x+4+k*3,y,e.x+3+k*3,y+3,e.x+1+k*3,y+5,e.x+k*3,y+7],115,.8);curve(g,[e.x+5+k*3,y,e.x+4+k*3,y+3,e.x+2+k*3,y+5,e.x+1+k*3,y+7],193,.5);}return;}
      if(c.marks==='sunspots'||c.marks==='weathering'){for(let k=0;k<20;k++){const px=a.cx-18+R()*36,py=37+R()*34;g.fillStyle=gray(c.marks==='sunspots'?143:155);g.beginPath();g.ellipse(px,py,.6+R(),.5+R()*.5,0,0,Math.PI*2);g.fill();}return;}
      const count=c.marks==='pockmarks'?32:25;
      for(let i=0;i<count;i++){
        const side=i%2?-1:1,x=a.cx+side*(9+Math.floor(R()*11)),y=60+Math.floor(R()*11);
        g.fillStyle=gray(c.marks==='freckles'?111+14*a.softness:103);g.beginPath();g.ellipse(x+.5,y+.5,.55,.55,0,0,Math.PI*2);g.fill();
        if(c.marks==='pockmarks')rect(g,x+1,y+1,1,1,183);
      }
    });
  }
  function eyeForm(g,e,a,kind) {
    const forms={calm:[4.6,1.15,.1],keen:[4.5,.85,-.2],heavy:[4.8,.75,.1],wide:[4.7,1.65,.1],downturned:[4.6,1.1,.55],almond:[4.8,1.2,-.35],clear:[4.6,1.4,0],hooded:[4.9,1.05,.1],upturned:[4.8,1.4,-.65],'deep-set':[4.5,1.2,-.05],relaxed:[5,1.15,.25],round:[4.45,1.95,0],smiling:[4.9,1.05,-.3],focused:[4.55,.95,-.4],'soft-lidded':[4.9,1.5,-.18],'natural-wide':[4.75,1.8,.15],'deep-almond':[5,1.45,-.45],'human-steady':[4.85,1.35,-.08],'elf-slanted':[5.15,1.35,-.65]};
    const [baseWidth,baseOpening,tilt]=forms[kind],w=baseWidth*1.15*(a.eyeScale||1),open=baseOpening*1.6*(a.eyeScale||1),dir=e.x<a.cx?1:-1,x=e.x+.5,y=e.y+.5;
    g.beginPath();g.moveTo(x-dir*w,y+tilt);
    g.bezierCurveTo(x-dir*1.8,y-open,x+dir*1.7,y-open,x+dir*(w-.35),y+.1);
    g.bezierCurveTo(x+dir*1.7,y+open*.85,x-dir*1.8,y+open*.9,x-dir*w,y+tilt);
    g.closePath();
    return {w,open,tilt,dir};
  }
  function naturalEyes(g,a,c,irises) {
    for(const e of a.eyes) {
      const x=e.x+.5,y=e.y+.5;
      if(irises) {
        g.save();eyeForm(g,e,a,c.eyes);g.clip();
        const iris=g.createRadialGradient(x-.35,y-.3,.2,x,y,2.15);
        iris.addColorStop(0,gray(104));iris.addColorStop(.65,gray(85));iris.addColorStop(1,gray(48));
        g.fillStyle=iris;g.beginPath();g.ellipse(x,y-.05,2,2.35,0,0,Math.PI*2);g.fill();
        g.fillStyle=gray(28);g.beginPath();g.ellipse(x,y-.05,.75,1.35,0,0,Math.PI*2);g.fill();
        g.fillStyle=gray(c.eyes==='clear'?145:132);g.beginPath();g.ellipse(x-.45,y-.4,.32,.3,0,0,Math.PI*2);g.fill();
        g.restore();continue;
      }
      const form=eyeForm(g,e,a,c.eyes),{w,open,tilt,dir}=form;
      const white=g.createLinearGradient(0,y-open,0,y+open);
      white.addColorStop(0,gray(107));white.addColorStop(.55,gray(153));white.addColorStop(1,gray(164));
      g.fillStyle=white;g.fill();
      // Upper lids draw on their own foreground layer, above the iris.
      if(c.eyes==='smiling')curve(g,[x-dir*(w-1),y+.8,x-dir*2,y+.25,x+dir*2,y+.25,x+dir*(w-1),y+.8],142,.6);
    }
  }
  function eyelids(g,a,c) {
    for(const e of a.eyes) {
      const {w,open,tilt,dir}=eyeForm(g,e,a,c.eyes),x=e.x+.5,y=e.y+.5;
      // The same upper boundary defines both the visible lid and iris occlusion.
      curve(g,[x-dir*w,y+tilt,x-dir*1.8,y-open,x+dir*1.7,y-open,x+dir*(w-.35),y+.1],69,c.eyes==='hooded'?1.35:c.eyes==='deep-set'?1.2:1.1);
    }
  }
  function brows(g,a,c) {
    const forms={natural:[7,1.2,1.8,1],arched:[7,2.7,1.7,1.5],bold:[7,1.2,2.6,1],flat:[6,.3,1.7,.3],broken:[7,1.2,1.8,1],sculpted:[7,1.6,1.9,1],soft:[6.5,1.1,1.2,1.1],feathered:[7.3,1.8,1.5,1.4],'low-arch':[7,.75,1.6,.8],'high-arch':[7,3.4,1.7,1.6],slim:[6.8,1.5,.9,1.2],'tapered-natural':[7.4,1.1,1.4,.5],'full-soft':[7.2,1.4,2.2,.8]};
    const [w,arch,thick,tail]=forms[c.brows];
    for(let i=0;i<a.brows.length;i++) {
      const e=a.brows[i];featureFrame(g,e.x+.5,e.y,e.x<a.cx?1:-1,()=>{
        g.fillStyle=gray(c.brows==='soft'||c.brows==='slim'?89:64);g.beginPath();g.moveTo(-w,tail);
        g.bezierCurveTo(-w*.7,-arch,w*.1,-arch,w-.9,-.15);
        g.quadraticCurveTo(w+.25,.2,w-.25,thick*.75);
        g.bezierCurveTo(w*.2,thick*.82-arch*.25,-w*.5,thick*.45,-w,tail);g.closePath();g.fill();
        g.save();g.globalCompositeOperation='source-atop';
        curve(g,[-w+.8,tail,-w*.6,-arch+.6,w*.2,-arch+.6,w-.8,.3],107,.45);
        if(c.brows==='feathered')for(let n=-5;n<5;n+=2)curve(g,[n,1,n,-1,n+.4,-1.8,n+1,-1.4],92,.55);
        g.restore();
        if(c.brows==='broken'&&i===1){g.save();g.globalCompositeOperation='destination-out';g.beginPath();g.ellipse(-5,0,.8,4,0,0,Math.PI*2);g.fill();g.restore();}
      });
    }
  }
  const MOUTHS={neutral:[8,2.6,0,1,0],full:[9,4.1,0,1.5,0],stern:[8,2.1,.25,.8,0],thin:[7,1.6,0,.65,0],'slight-smile':[8.5,2.5,-.7,1,0],cupid:[8,3.5,0,2,0],'gentle-smile':[9,3,-.8,1.2,0],'reserved-smile':[7.3,2.2,-.5,.9,0],'broad-smile':[10,3.5,-1.6,1,1.8],parted:[8.3,3.2,0,1.1,1.4],'asymmetric-smile':[8.5,2.7,-.8,1.2,0],downturned:[8.2,2.6,1,1,0],pout:[7.5,4.6,.2,1.8,0],'thin-smile':[8.6,1.7,-1.3,.7,0],'soft-full':[8.2,3.9,-.15,1.4,0],'relaxed-bow':[8.6,3.1,.1,1.65,0],'small-tusks':[9.2,3,0,1.1,0],'heavy-tusks':[10,3.6,.2,1.3,0]};
  function mouthForm(c){const form=[...MOUTHS[c.mouth]];form[0]+=c.adjustments.mouthWidth*.6;return form;}
  function mouthOpening(g,a,c) {
    const [w,h,smile,bow,open]=mouthForm(c),x=a.mouth.x,y=a.mouth.y;
    g.beginPath();g.moveTo(x-w+1,y+smile);
    g.bezierCurveTo(x-3,y+open*.1,x+3,y+open*.1,x+w-1,y+smile);
    g.bezierCurveTo(x+4,y+open+1,x-4,y+open+1,x-w+1,y+smile);g.closePath();
  }
  function mouth(g,a,c) {
    const [w,h,smile,bow,open]=mouthForm(c),x=a.mouth.x,y=a.mouth.y,asym=c.mouth==='asymmetric-smile'?.65:0;
    g.fillStyle=gray(134);g.beginPath();g.moveTo(x-w,y+smile+asym);
    g.bezierCurveTo(x-5,y-bow-1,x-2,y-bow,x,y-.7);
    g.bezierCurveTo(x+2,y-bow,x+5,y-bow-1,x+w,y+smile-asym);
    g.bezierCurveTo(x+3,y+1,x-3,y+1,x-w,y+smile+asym);g.fill();
    g.fillStyle=gray(174);g.beginPath();g.moveTo(x-w,y+smile+asym);
    g.bezierCurveTo(x-3,y+h+1,x+3,y+h+1,x+w,y+smile-asym);
    g.bezierCurveTo(x+3,y+.6,x-3,y+.6,x-w,y+smile+asym);g.fill();
    g.save();g.globalCompositeOperation='source-atop';
    if(open){mouthOpening(g,a,c);g.fillStyle=gray(48);g.fill();}
    else curve(g,[x-w+.7,y+smile+asym,x-3,y+.6,x+3,y+.6,x+w-.7,y+smile-asym],78,.65);
    curve(g,[x-3.5,y+h*.65,x-1,y+h*.85,x+2,y+h*.8,x+3.5,y+h*.55],185,.65);
    g.restore();
  }
  function teeth(g,a,c) {
    const form=mouthForm(c);
    if(c.mouth==='small-tusks'||c.mouth==='heavy-tusks'){
      const big=c.mouth==='heavy-tusks',height=big?5.2:2.9;
      for(const side of [-1,1])featureFrame(g,a.mouth.x+side*((big?6.8:6)+c.adjustments.mouthWidth*.45),a.mouth.y,side,()=>{
        g.beginPath();g.moveTo(-1.3,2);g.bezierCurveTo(-1.5,-1,-.5,-height+1,1.6,-height);
        g.quadraticCurveTo(2.1,-height-.3,2,-height+.3);g.bezierCurveTo(.9,-height+2,1.4,-.5,1.4,1.6);
        g.quadraticCurveTo(.2,2.4,-1.3,2);g.closePath();g.fillStyle=gray(184);g.fill();
        g.save();g.clip();curve(g,[-.6,1,-1,-.8,.1,-height+1,1.7,-height],216,.55);g.restore();
      });return;
    }
    if(!form[4])return;
    g.save();mouthOpening(g,a,c);g.clip();g.fillStyle=gray(c.mouth==='broad-smile'?194:171);
    g.beginPath();g.ellipse(a.mouth.x,a.mouth.y+.5,form[0]*.65,.65,0,0,Math.PI*2);g.fill();g.restore();
  }
  function shortBeard(g,a,c) {
    const out=canvas(),q=out.getContext('2d'),im=q.createImageData(SIZE,SIZE),p=im.data,close=c.beard==='close-beard';
    const fade=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
    for(let y=54;y<=a.chinY;y++)for(let x=Math.floor(a.cx-a.w);x<=a.cx+a.w;x++) {
      const dx=x+.5-a.cx,py=y+.5,side=Math.min(1,Math.abs(dx)/(a.w-2));
      const cheekTop=61+(1-side)*14,cheek=fade((py-cheekTop)/3);
      const burn=fade((Math.abs(dx)-(a.w-7))/3)*fade((py-54)/7);
      const upperLip=a.mouth.y-3.7+Math.abs(dx)*.035;
      const moustache=fade((1-Math.pow(dx/11,2)-Math.pow((py-upperLip)/2.1,2))*2.5);
      let coverage=Math.max(cheek,burn,moustache);
      if(c.beard==='chin-bristle'){const radius=Math.hypot(dx/11.5,(py-a.mouth.y-8.5)/7);coverage*=fade((1-radius)/.4)*fade((py-a.mouth.y-2)/3);}
      if(!coverage)continue;
      // A continuous soft beard shadow with fine tonal grain, not random dark dots.
      const tone=(close?71:84)+11*falloff(x,y,a.cx-10,a.mouth.y+7,15,10)-5*side+grain(x,y,c.seed+303)*(close?28:8);
      const density=close?.55+.18*falloff(x,y,a.cx,a.chinY-5,18,8):.11+.05*falloff(x,y,a.cx,a.chinY-5,18,8);
      const i=(y*SIZE+x)*4;p[i]=p[i+1]=p[i+2]=Math.round(tone);p[i+3]=Math.round(coverage*density*255);
    }
    q.putImageData(im,0,0);clip(g,a.outline,()=>g.drawImage(out,0,0));
  }
  function beard(g,a,c) {
    if(c.beard==='none')return;
    const x=a.cx,R=rng(c.seed+303);
    if(c.beard==='chin-bristle'){shortBeard(g,a,c);return;}
    if(c.beard==='bound-beard'){beard(g,a,{...c,beard:'rounded'});for(const side of [-1,1]){for(let y=84;y<101;y+=4)curve(g,[x+side*6-2,y,x+side*6,y+1,x+side*6+3,y+2,x+side*6,y+5],126,.9);curve(g,[x+side*6-3,99,x+side*6-1,100,x+side*6+2,100,x+side*6+3,99],182,2);}return;}

    if(c.beard==='stubble'||c.beard==='close-beard'){shortBeard(g,a,c);return;}
    const my=a.mouth.y;
    if(c.beard==='scruffy') {
      clip(g,a.outline,()=>{for(let i=0;i<260;i++){const px=x-a.w+R()*a.w*2,py=62+R()*(a.chinY-61);if(Math.abs(px-x)<11&&py<my+6)continue;if(py<my-2&&Math.abs(px-x)<a.w-8)continue;curve(g,[px,py,px-.3,py+.4,px+.1,py+1,px+.3,py+(c.beard==='scruffy'?2:1)],61+R()*49,.65);}});
      for(const side of [-1,1])for(let i=0;i<7;i++)curve(g,[x+side*(2+i),my-3.5,x+side*(4+i),my-4,x+side*(5+i),my-2,x+side*(6+i),my-1],65+i*4,.6);
      return;
    }

    if(c.beard==='sideburns'){for(const side of [-1,1])poly(g,[[x+side*(a.w-2),52],[x+side*(a.w-6),57],[x+side*(a.w-6),74],[x+side*(a.w-1),79],[x+side*a.w,64]],65);return;}
    if(c.beard==='walrus'){for(const side of [-1,1]){g.fillStyle=gray(62);g.beginPath();g.ellipse(x+side*6,my-1,6,3.3,side*.3,0,Math.PI*2);g.fill();for(let i=0;i<5;i++)curve(g,[x+side*(2+i),my-4,x+side*(3+i),my-2,x+side*(7+i),my+1,x+side*(8+i),my+2],105-i*5,.5);}return;}

    if(c.beard==='moustache'||c.beard==='goatee') {
      for(const side of [-1,1])poly(g,[[x+side, my-3],[x+side*6,my-5],[x+side*12,my-2],[x+side*13,my+2],[x+side*7,my],[x+side*2,my-1]],66);
      if(c.beard==='goatee') {poly(g,[[x-5,my+5],[x+5,my+5],[x+8,86],[x+4,98],[x,101],[x-5,96],[x-8,86]],66);for(let i=-3;i<=3;i+=2)line(g,[[x+i,85],[x+i,96]],107);}
      return;
    }
    if(['full','forked','braided','short-boxed','rounded','tapered-beard'].includes(c.beard)) {
      const end=c.beard==='short-boxed'?94:c.beard==='rounded'?100:c.beard==='full'?104:c.beard==='tapered-beard'?108:112,baseY=Math.min(98,end-4),tip=c.beard==='rounded'||c.beard==='short-boxed'?11:7;
      const jaw=[[x-a.w+2,61],[x-15,72],[x-11,my+3],[x-7,my+6],[x+7,my+6],[x+11,my+3],[x+15,72],[x+a.w-2,61],[x+a.jaw,82],[x+13,baseY],[x+tip,end],[x,end+1],[x-tip,end],[x-14,baseY],[x-a.jaw,82]];
      poly(g,jaw,59);
      clip(g,jaw,()=>{for(let i=0;i<130;i++){const px=x-17+Math.floor(R()*34),py=80+Math.floor(R()*32);line(g,[[px,py],[px-1,py+4]],78+R()*45);}});
      if(c.beard==='forked'){g.save();g.globalCompositeOperation='destination-out';g.beginPath();g.ellipse(x,111,1.5,12,0,0,Math.PI*2);g.fill();g.restore();line(g,[[x-7,96],[x-9,107]],130);line(g,[[x+7,96],[x+9,107]],107);}
      if(c.beard==='braided')for(let y=90;y<111;y+=4){line(g,[[x-5,y],[x+4,y+3],[x-4,y+5]],131);rect(g,x-5,109,10,2,183);}
      for(const side of [-1,1])poly(g,[[x+side,my-4],[x+side*5,my-5],[x+side*12,my-2],[x+side*12,my+1],[x+side*4,my-1],[x+side,my-1]],58);
      return;
    }
    // Deliberate lip opening: moustache and jaw do not obscure the mouth anchor.
    poly(g,[[x-a.w+2,61],[x-15,70],[x-12,79],[x-7,83],[x+7,83],[x+12,79],[x+15,70],[x+a.w-2,61],[x+a.jaw,79],[x+10,90],[x,93],[x-10,90],[x-a.jaw,79]],67);
    poly(g,[[x-11,my-3],[x-3,my-5],[x,my-3],[x+3,my-5],[x+11,my-3],[x+11,my],[x+4,my-2],[x,my-1],[x-4,my-2],[x-11,my]],65);
    for(let i=0;i<70;i++){const px=x-16+Math.floor(R()*32),py=81+Math.floor(R()*8);if(Math.abs(px-x)>14-(py-81)*.5)continue;rect(g,px,py,1,2,85+R()*37);}
  }
  function oval(g,x,y,rx,ry,n,rotation=0) {g.fillStyle=gray(n);g.beginPath();g.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);g.fill();}
  function referenceHair(g,a,c,back) {
    if(!['loose-side-braid','loose-center-part','curly-shag','tied-back-waves'].includes(c.hair))return false;
    const x=a.cx,w=a.w,R=rng(c.seed+1901),curly=c.hair==='curly-shag';
    const volume=(trace,n,detail)=>{g.save();g.beginPath();trace();g.closePath();g.fillStyle=gray(n);g.fill();if(detail){g.clip();detail();}g.restore();};
    const lock=(side,end)=>{const sx=x+side*(w-1);volume(()=>{g.moveTo(sx,34);g.bezierCurveTo(sx+side*13,44,sx+side*7,61,sx+side*7,76);g.bezierCurveTo(sx+side*7,92,sx+side*4,end-5,sx-side*1,end);g.bezierCurveTo(sx+side*2,end-13,sx-side*6,83,sx-side*2,65);g.bezierCurveTo(sx-side*4,48,sx-side*4,38,sx,34);},66,()=>{for(let i=0;i<6;i++)curve(g,[sx+side*i,38,sx+side*(12-i),59,sx-side*3,83,sx+side*(4-i*.7),end-4],97+i*6,.7);});};
    if(back){
      if(curly){for(const side of [-1,1])for(let i=0;i<5;i++){const px=x+side*(w+2+Math.sin(i)*2),py=35+i*5.4;oval(g,px,py,6,6.3,64+R()*11);curve(g,[px-3,py+2,px-5,py-5,px+5,py-4,px+3,py+2],113,.8);}}
      else {if(c.hair==='loose-center-part')for(const side of [-1,1])lock(side,110);if(c.hair==='loose-side-braid')lock(-1,83);if(c.hair==='tied-back-waves')lock(1,103);}
      return true;
    }
    const part=x+(c.hair==='loose-side-braid'?7:curly?3:0);
    volume(()=>{g.moveTo(x-w-2,49);g.bezierCurveTo(x-w-7,31,x-w+4,17,x-8,16);g.bezierCurveTo(x+10,11,x+w+9,24,x+w+2,48);if(curly){g.bezierCurveTo(x+w-1,51,x+w-5,43,x+w-6,37);g.bezierCurveTo(x+13,34,part+5,32,part,29);g.bezierCurveTo(part-5,33,x-13,38,x-w+5,44);g.bezierCurveTo(x-w+2,49,x-w+1,53,x-w-2,49);}else{g.bezierCurveTo(x+w+1,51,x+w-3,44,x+w-5,39);g.bezierCurveTo(x+w-9,34,part+7,33,part+1,34);g.bezierCurveTo(part-5,35,part-10,34,part-15,38);g.bezierCurveTo(x-w+10,40,x-w+6,42,x-w+4,47);g.bezierCurveTo(x-w+2,51,x-w-1,52,x-w-2,49);}},72,()=>{
      if(!curly){oval(g,part-12,27,15,6,111,-.5);oval(g,part+9,26,8,6,95,.55);}
      for(const side of [-1,1])for(let i=0;i<9;i++){const start=part+side*(1+i*.5),end=x+side*(8+i*2.3);curve(g,[start,17+i*.4,start+side*8,20,end+side*7,30,end,43+i*.3],i%3===0?144:107,.8);curve(g,[start+side,18+i*.4,start+side*9,22,end+side*8,32,end+side,45],54,.6);}
      curve(g,[part,17,part-2,21,part+1,27,part,curly?29:34],47,.7);
      if(!curly)for(let i=0;i<4;i++)curve(g,[part-1-i*3,27+i,part-7-i*3,27+i,part-12-i*3,32+i,part-15-i*3,37+i],124-i*5,.65);
    });
    if(curly)for(let row=0;row<3;row++)for(let i=0;i<8;i++){const px=x-w+1+i*(w*2-2)/7+(row%2),py=21+row*7+Math.abs(i-3.5)*1.7;oval(g,px,py,4.7,4.5,70+R()*22,(R()-.5)*.4);curve(g,[px-3,py+2,px-5,py-4,px+4,py-5,px+3,py+1],125+R()*20,.8);}
    if(c.hair==='loose-side-braid'){
      const bx=x-w+1;
      curve(g,[bx-1,52,bx-7,62,bx-5,73,bx+1,82],68,7);
      for(let i=0;i<8;i++){const py=79+i*4.5,px=bx+2+Math.sin(i*.6)*1.6;oval(g,px,py,4.7-i*.25,3.5,69);curve(g,[px-3,py-2,px,py,px+3,py,px+1,py+3],132,.8);curve(g,[px+3,py-2,px,py,px-3,py+1,px-1,py+3],95,.7);}
      curve(g,[bx-1,59,bx-8,64,bx-6,73,bx-4,79],118,.7);
    }
    if(c.hair==='loose-center-part')for(const side of [-1,1])lock(side,108);
    if(c.hair==='tied-back-waves')for(const side of [-1,1])curve(g,[x+side*(w-4),38,x+side*(w+3),48,x+side*(w-5),56,x+side*(w-1),65],95,3);
    return true;
  }
  function racialHair(g,a,c,back) {
    const base={'knight-crop':'cropped','forge-braids':'braids','war-crest':'undercut','braided-crown':'long'}[c.hair];if(!base)return false;
    hair(g,a,{...c,hair:base},back);if(back)return true;const x=a.cx;
    if(c.hair==='knight-crop'){g.save();g.globalCompositeOperation='source-atop';for(let i=-4;i<=4;i++)curve(g,[x+i*3,24,x+i*3-2,27,x+i*3-3,31,x+i*3-3,35],121,1.1);g.restore();}
    if(c.hair==='forge-braids')for(const side of [-1,1])for(let y=59;y<104;y+=5){const px=x+side*(a.w+1);oval(g,px,y+2,4.1,3.4,65);curve(g,[px-3,y,px-1,y+1,px+3,y+2,px+1,y+5],133,.9);}
    if(c.hair==='war-crest'){oval(g,x,17,5,11,65);for(let i=-2;i<=2;i++)curve(g,[x+i,25,x+i*2,18,x+i,10,x+i*.5,7],119,.7);}
    if(c.hair==='braided-crown')for(let i=-5;i<=5;i++){const px=x+i*3.6,py=35+Math.abs(i)*.3;oval(g,px,py,2.8,2.3,62);curve(g,[px-2,py-1,px,py,px+2,py+.4,px+1,py+2],136,.8);}
    return true;
  }
  // Curved scalp, hairline and hanging locks are independent volumes.
  function hair(g,a,c,back) {
    const style=c.hair;if(style==='none')return;
    if(racialHair(g,a,c,back)||referenceHair(g,a,c,back))return;
    const x=a.cx,w=a.w,R=rng(c.seed+419),short=HAIR_GROUPS.Short.includes(style);
    const open=['ponytail','high-bun','low-bun','topknot','swept-back','undercut','brushed-up','slick-side'].includes(style);
    const shape=(trace,n,detail)=>{g.save();g.beginPath();trace();g.closePath();g.fillStyle=gray(n);g.fill();if(detail){g.clip();detail();}g.restore();};
    const sideLock=(side,end,width,bend)=>{
      const sx=x+side*(w-2);
      shape(()=>{g.moveTo(sx,36);g.bezierCurveTo(sx+side*(width+4),45,sx+side*(width+bend),end-12,sx+side*bend,end);g.bezierCurveTo(sx-side*4,end+4,sx-side*5,end-12,sx-side*2,60);g.bezierCurveTo(sx-side*4,48,sx-side*3,39,sx,36);},59,()=>{
        for(let i=0;i<4;i++)curve(g,[sx+side*i,41,sx+side*(width+1),58,sx+side*(bend-2),end-12,sx+side*(bend-i*.4),end-3],95+i*7,.65);
      });
    };
    if(back) {
      // Small rounded temple sections; long styles add their own flowing lengths.
      if(!short)for(const side of [-1,1])sideLock(side,style==='pageboy'?76:style==='waves'?78:68,style==='waves'?6:3,1);
      if(['long','half-up','braids','shoulder-length','shag'].includes(style))for(const side of [-1,1])sideLock(side,style==='long'?105:style==='shag'?84:style==='shoulder-length'?96:101,8,side<0?2:5);
      if(style==='ponytail'){
        const sx=x+w-2;
        shape(()=>{g.moveTo(sx,35);g.bezierCurveTo(sx+16,35,sx+14,54,sx+8,65);g.bezierCurveTo(sx+3,76,sx+16,87,sx+6,100);g.bezierCurveTo(sx+8,87,sx-4,83,sx-2,72);g.bezierCurveTo(sx+5,54,sx+8,45,sx,40);},66,()=>{for(let i=0;i<4;i++)curve(g,[sx+3+i,40,sx+17,60,sx-3,75,sx+7,95],104+i*8,.7);});
      }
      if(['high-bun','topknot','low-bun','half-up'].includes(style)){
        const bx=style==='low-bun'?x-w-2:style==='half-up'?x+w-1:x,by=style==='low-bun'?62:style==='half-up'?39:style==='high-bun'?16:12;
        const rx=style==='high-bun'?10:style==='topknot'?6.5:8,ry=style==='high-bun'?9:7;
        oval(g,bx,by+4,rx*.65,ry+1,65);oval(g,bx,by,rx,ry,72,-.2);
        for(let i=0;i<4;i++)curve(g,[bx-rx+2,by+i-2,bx-rx,by-ry+2,bx+rx+2,by-ry+i,bx+rx-2,by+3],113+i*5,.7);
      }
      return;
    }
    if(style==='tonsure'||style==='buzz-cut') {
      g.save();contour(g,a.outline);g.clip();
      if(style==='tonsure')shape(()=>{
        g.moveTo(x-w,48);g.bezierCurveTo(x-w,41,x-w+2,33,x-w+5,30);
        g.bezierCurveTo(x-w+9,37,x-9,38,x,38);g.bezierCurveTo(x+10,38,x+w-9,37,x+w-5,30);
        g.bezierCurveTo(x+w-2,33,x+w,41,x+w,48);g.bezierCurveTo(x+w-4,50,x+w-5,45,x+w-7,41);
        g.bezierCurveTo(x+10,44,x-10,44,x-w+7,41);g.bezierCurveTo(x-w+5,45,x-w+4,50,x-w,48);
      },75,()=>{for(let i=-9;i<=9;i++)curve(g,[x+i*2,36,x+i*2,38,x+i*2+.5,40,x+i*2,43],114,.6);});
      else shape(()=>{
        g.moveTo(x-w,45);g.bezierCurveTo(x-w-3,26,x-13,18,x,19);g.bezierCurveTo(x+14,18,x+w+3,26,x+w,45);
        g.bezierCurveTo(x+w-4,43,x+w-5,39,x+w-6,36);g.bezierCurveTo(x+11,32,x+4,33,x,34);
        g.bezierCurveTo(x-5,33,x-12,33,x-w+6,37);g.bezierCurveTo(x-w+4,40,x-w+4,44,x-w,45);
      },104,()=>{for(let i=0;i<360;i++)oval(g,x-w+R()*w*2,20+R()*27,.55,.6,65+R()*40);});
      g.restore();return;
    }
    const lift=['tousled','short-quiff','brushed-up'].includes(style)?4:style==='waves'?2:0,top=(short?20:17)-lift,outer=w+(short?0:3);
    const cap=()=>{
      g.moveTo(x-outer,48);
      g.bezierCurveTo(x-outer-4,31,x-outer+5,top+2,x-8,top);
      g.bezierCurveTo(x+5,top-5,x+outer+4,top+6,x+outer,47);
      // Each inner edge curves across the forehead rather than forming a shelf.
      if(style==='curtains'){g.bezierCurveTo(x+w-2,53,x+w-7,50,x+5,35);g.bezierCurveTo(x+2,30,x+1,28,x,29);g.bezierCurveTo(x-3,31,x-8,44,x-w+3,51);g.bezierCurveTo(x-w,53,x-w-3,53,x-outer,48);}
      else if(style==='caesar'||style==='textured-crop'){const y=style==='caesar'?40:38;g.bezierCurveTo(x+w-3,47,x+w-4,42,x+w-5,y);g.bezierCurveTo(x+9,y+2,x-8,y-1,x-w+5,y+2);g.bezierCurveTo(x-w+3,44,x-w+3,48,x-outer,48);}
      else if(open){g.bezierCurveTo(x+w-3,45,x+w-4,39,x+w-6,36);g.bezierCurveTo(x+12,31,x-10,30,x-w+6,37);g.bezierCurveTo(x-w+3,41,x-w+4,47,x-outer,48);}
      else if(style==='pageboy'){g.bezierCurveTo(x+w-1,49,x+w-3,44,x+w-5,41);g.bezierCurveTo(x+12,44,x+4,38,x-2,40);g.bezierCurveTo(x-11,43,x-15,39,x-w+4,45);g.bezierCurveTo(x-w+2,49,x-w,51,x-outer,48);}
      else if(short){g.bezierCurveTo(x+w-2,46,x+w-4,39,x+w-5,35);g.bezierCurveTo(x+10,28,x-7,31,x-w+5,39);g.bezierCurveTo(x-w+3,43,x-w+3,48,x-outer,48);}
      else {const fringe=style==='side-part'?5:style==='swept'?8:style==='shag'?-4:style==='shoulder-length'?3:style==='curls'?-3:0;g.bezierCurveTo(x+w-2,48,x+w-3,40,x+w-6,35);g.bezierCurveTo(x+12,30,x+4+fringe,35,x-4+fringe,39);g.bezierCurveTo(x-13,44,x-w+6,43,x-w+3,49);g.bezierCurveTo(x-w+1,53,x-w-2,52,x-outer,48);}
    };
    if(style==='receding'){g.save();contour(g,a.outline);g.clip();}
    shape(cap,73,()=>{
      oval(g,x-9,top+10,18,11,113,-.22);
      for(let i=0;i<12;i++){const sx=x+18-i*3.3;curve(g,[sx,top+3,sx-9,top-1,sx-18,top+14,sx-19,44],i<8?137:102,.7);}
      if(open)for(let i=-5;i<=5;i++)curve(g,[x+i*3.5,36,x+i*4,29,x+i*2,top+4,x+i*1.4,top+2],124,.65);
      if(style==='side-part'||style==='swept'||style==='slick-side'){const px=x+(style==='side-part'?10:14);curve(g,[px,top+3,px-1,top+8,px-6,30,px-8,36],43,1);}
    });
    if(style==='pageboy')for(const side of [-1,1])sideLock(side,73,5,1);
    if(style==='long')for(const side of [-1,1])sideLock(side,103,6,side<0?-1:3);
    if(style==='waves')for(const side of [-1,1])sideLock(side,76,7,2);
    if(style==='curls'||style==='tousled'){
      const curls=style==='curls';
      for(let row=0;row<(curls?3:1);row++)for(let i=0;i<(curls?9:10);i++){
        const px=x-outer+3+i*(outer*2-6)/(curls?8:9),py=top+6+row*6+Math.abs(i-4)*1.5+R()*2;
        oval(g,px,py,curls?3.9:4.8,curls?4:3,71+R()*25,(R()-.5)*.8);
        curve(g,[px-2,py+2,px-4,py-3,px+3,py-4,px+2,py],128+R()*20,.8);
      }
      if(curls)for(const side of [-1,1])for(let i=0;i<5;i++){const px=x+side*(w+1+Math.sin(i)),py=42+i*5;oval(g,px,py,4,4.5,65);curve(g,[px-2,py+2,px-3,py-3,px+4,py-3,px+2,py+1],113,.7);}
    }
    if(style==='receding'){
      g.save();g.globalCompositeOperation='destination-out';
      shape(()=>{g.moveTo(x-14,23);g.bezierCurveTo(x-8,17,x+9,17,x+15,26);g.bezierCurveTo(x+17,34,x+9,37,x+5,34);g.bezierCurveTo(x,31,x-4,39,x-11,38);g.bezierCurveTo(x-17,35,x-17,28,x-14,23);},255);
      g.restore();
    }
    if(style==='crew-cut')curve(g,[x-w+5,35,x-11,29,x+8,25,x+w-6,32],154,1.4);
    if(style==='short-quiff')for(let i=0;i<5;i++)curve(g,[x-16+i*3,36,x-16+i*3,28,x-3+i*2,14,x+9+i*2,22],142-i*6,.8);
    if(style==='brushed-up')for(let i=-5;i<=5;i++)curve(g,[x+i*3,36,x+i*3.5,30,x+i*2,21,x+i*1.6,17],132,.9);
    if(style==='textured-crop')for(let i=-6;i<=6;i++)curve(g,[x+i*2.5,32,x+i*2.5-1,34,x+i*2.5+1,36,x+i*2.5,39],118,.9);
    if(style==='curtains')for(const side of [-1,1])for(let i=0;i<5;i++)curve(g,[x+side*2,21+i*.5,x+side*(8+i),26,x+side*(11+i*2),39,x+side*(14+i*2),48],134-i*5,.7);
    if(style==='shag')for(const side of [-1,1])sideLock(side,83,8,2);
    if(style==='shoulder-length')for(const side of [-1,1])sideLock(side,96,7,4);
    if(style==='receding')g.restore();
    if(style==='undercut')for(const side of [-1,1]){oval(g,x+side*(w-3),43,2,7,87);for(let y=39;y<48;y+=2)curve(g,[x+side*(w-4),y,x+side*(w-3),y-.5,x+side*(w-2),y,x+side*(w-2),y+1],62,.5);}
    if(style==='braids'||style==='single-braid')for(const side of style==='braids'?[-1,1]:[-1])for(let y=57;y<102;y+=5){const bx=x+side*(w+1);oval(g,bx,y+2,3.3,3.5,65);featureFrame(g,bx,y,-side,()=>{curve(g,[-2,0,0,1,2,2,1,5],128,.9);curve(g,[2,0,0,2,-2,3,-1,5],94,.8);});}
  }
  function racialHeadwear(g,a,c,back) {
    const base={'heraldic-cap':'cap','forge-helm':'round-helm',warband:'headband','vine-diadem':'leaf-circlet'}[c.headwear];if(!base)return false;
    headwear(g,a,{...c,headwear:base},back);if(back)return true;const x=a.cx;
    if(c.headwear==='heraldic-cap'){oval(g,x+9,28,3,3.6,180);curve(g,[x+8,30,x+7,27,x+10,25,x+10,28],75,1);}
    if(c.headwear==='forge-helm'){curve(g,[x-a.w,35,x-10,39,x+10,39,x+a.w,35],67,3);line(g,[[x,21],[x,31]],191,1.3);line(g,[[x,22],[x+4,25],[x,27]],181,1.2);}
    if(c.headwear==='warband')for(const px of [x-10,x,x+10])oval(g,px,36,1.6,1.6,174);
    if(c.headwear==='vine-diadem')for(const side of [-1,1])for(let i=0;i<3;i++)oval(g,x+side*(2+i*2),30-i*.6,2,1.1,181,-side*.6);
    return true;
  }
  function referenceHeadwear(g,a,c,back) {
    const kind=c.headwear;if(!['draped-veil','pearl-hood','leaf-circlet'].includes(kind))return false;
    const x=a.cx,w=a.w;
    if(kind==='leaf-circlet'){if(!back){curve(g,[x-w,35,x-8,31,x+9,31,x+w,35],126,1.6);for(let i=-4;i<=4;i++){const px=x+i*4.5,py=32+Math.abs(i)*.4;oval(g,px,py-1.3,2.2,1,165,i<0?-.6:.6);oval(g,px+1,py,1.6,.8,113);}}return true;}
    if(back){poly(g,[[x-w-7,31],[x-w-10,67],[x-39,112],[x-23,118],[x,108],[x+23,118],[x+40,112],[x+w+10,67],[x+w+7,31]],kind==='draped-veil'?173:100);for(const side of [-1,1])for(let i=0;i<4;i++)curve(g,[x+side*(w+3+i),31,x+side*(w+13-i),57,x+side*(21+i*4),92,x+side*(23+i*4),115],kind==='draped-veil'?193-i*12:123-i*8,.9);return true;}
    g.save();g.beginPath();g.moveTo(x-w-6,56);g.bezierCurveTo(x-w-10,19,x-16,8,x,8);g.bezierCurveTo(x+19,8,x+w+12,25,x+w+6,57);g.bezierCurveTo(x+w+2,57,x+w,46,x+w-2,36);g.bezierCurveTo(x+13,21,x-12,20,x-w+2,36);g.bezierCurveTo(x-w,45,x-w-2,56,x-w-6,56);g.closePath();g.fillStyle=gray(kind==='draped-veil'?177:122);g.fill();g.clip();for(let i=0;i<4;i++)curve(g,[x-w-5+i,35,x-w+3,9+i*3,x+13,5+i*3,x+w+6-i,40],kind==='draped-veil'?199-i*8:163-i*8,.9);g.restore();
    if(kind==='pearl-hood')for(let i=0;i<19;i++){const t=Math.PI+i*Math.PI/18,px=x+Math.cos(t)*(w+5),py=43+Math.sin(t)*29;oval(g,px,py,1.9,2,184);oval(g,px-.4,py-.5,.8,.8,230);}
    return true;
  }
  function addedHeadwear(g,a,c,back) {
    const kind=c.headwear,x=a.cx,w=a.w;
    if(!['arming-cap','chaperon','straw-hat','feathered-cap','coronet','round-helm','turban','linen-wrap'].includes(kind))return false;
    if(back){if(kind==='chaperon')curve(g,[x+w,34,x+w+15,45,x+w+5,81,x+w+9,102],71,8);if(kind==='linen-wrap')for(const side of [-1,1])curve(g,[x+side*(w+1),39,x+side*(w+5),62,x+side*25,82,x+side*31,98],151,8);return true;}
    const cap=(top,value)=>{g.fillStyle=gray(value);g.beginPath();g.moveTo(x-w-2,39);g.bezierCurveTo(x-w-4,top,x-14,top-5,x,top-5);g.bezierCurveTo(x+16,top-5,x+w+4,top+3,x+w+2,39);g.bezierCurveTo(x+12,43,x-12,43,x-w-2,39);g.fill();};
    if(kind==='coronet'){curve(g,[x-w+2,36,x-8,33,x+9,33,x+w-2,36],179,3);for(let i=-2;i<=2;i++){const px=x+i*7,py=34+Math.abs(i)*.35;curve(g,[px,py,px-2,py-3,px-2,py-6,px,py-7],172,2);oval(g,px,py-7,1.6,1.5,211);}return true;}
    if(kind==='round-helm'){cap(17,137);curve(g,[x-w-1,39,x-11,42,x+12,42,x+w+1,39],65,3);curve(g,[x-3,14,x-7,22,x-8,31,x-9,38],211,1.5);for(let i=-3;i<=3;i++)oval(g,x+i*6,39,.8,.8,197);return true;}
    if(kind==='straw-hat'){cap(20,125);oval(g,x,39,w+13,5.8,126);for(let i=-7;i<=7;i++)curve(g,[x+i*4,36,x+i*4+2,39,x+i*4+1,42,x+i*4,43],172,.6);curve(g,[x-w+2,33,x-9,36,x+9,36,x+w-2,33],68,3);return true;}
    if(kind==='feathered-cap'){cap(20,94);oval(g,x-4,27,w+5,9,97,-.2);curve(g,[x-w+1,37,x-9,41,x+11,39,x+w,36],48,3);curve(g,[x+w-7,29,x+w-4,22,x+w+5,13,x+w+7,8],177,2);for(let i=0;i<6;i++)curve(g,[x+w-4+i,24-i*2,x+w+i,24-i*2,x+w+5+i*.3,21-i*2,x+w+6,18-i],151,.8);return true;}
    if(kind==='arming-cap'){cap(23,154);for(const side of [-1,1])curve(g,[x+side*w,35,x+side*(w+2),41,x+side*(w+1),49,x+side*(w-1),54],144,5);curve(g,[x-3,19,x-6,24,x-5,31,x-4,39],103,.8);return true;}
    if(kind==='chaperon'){cap(17,86);oval(g,x,34,w+3,7,91);curve(g,[x-w,34,x-11,40,x+11,40,x+w,33],133,2);curve(g,[x-w+5,29,x-8,12,x+16,19,x+w-1,30],120,1.2);return true;}
    cap(kind==='turban'?18:22,kind==='turban'?124:166);
    for(let i=0;i<5;i++)curve(g,[x-w+1,33-i*2,x-9,43-i*5,x+12,30-i*3,x+w-2,33-i*2],kind==='turban'?80+i*10:123+i*9,1.4);
    curve(g,[x-w+1,37,x-9,43,x+13,41,x+w-1,35],kind==='turban'?163:195,1.5);
    return true;
  }
  function extraHeadwear(g,a,c,back) {
    const kind=c.headwear,x=a.cx,w=a.w;
    if(!['beret','wrapped-hood','headband','veil','fur-cap'].includes(kind))return false;
    if(back){if(kind==='veil'||kind==='wrapped-hood')poly(g,[[x-w-6,32],[x-w-7,74],[x-37,114],[x+37,114],[x+w+7,74],[x+w+5,32]],kind==='veil'?160:78);return true;}
    if(kind==='headband'){curve(g,[x-w+1,37,x-10,34,x+12,35,x+w-1,38],91,3);curve(g,[x-w+2,36,x-10,34,x+12,34,x+w-2,37],144,.65);return true;}
    if(kind==='beret'){oval(g,x-3,28,w+6,12,104,-.14);curve(g,[x-w+1,37,x-8,40,x+11,37,x+w,37],54,3);curve(g,[x-w,28,x-13,17,x+4,18,x+13,24],156,.9);return true;}
    if(kind==='fur-cap'){oval(g,x,28,w+3,13,91);for(let i=0;i<18;i++){const angle=Math.PI+(i/17)*Math.PI,px=x+Math.cos(angle)*(w+2),py=30+Math.sin(angle)*12;oval(g,px,py,3,2.7,106+(i%3)*12);}curve(g,[x-w,36,x-10,40,x+12,39,x+w,36],68,5);return true;}
    const outline=[[x-w-5,41],[x-w-2,24],[x-13,14],[x,10],[x+14,16],[x+w+5,29],[x+w+7,67],[x+30,105],[x+17,116],[x,111],[x-18,116],[x-32,105],[x-w-6,68]];
    poly(g,outline,kind==='veil'?163:97);
    g.save();g.globalCompositeOperation='destination-out';poly(g,[[x-w+4,44],[x-12,34],[x+11,34],[x+w-3,45],[x+w-3,69],[x+13,83],[x,92],[x-14,84],[x-w+4,68]],255);g.restore();
    if(kind==='wrapped-hood'){for(let i=0;i<3;i++)curve(g,[x-w-1,29+i*5,x-8,15+i*4,x+14,19+i*4,x+w+2,39+i*3],136-i*12,1.2);curve(g,[x-22,91,x-11,100,x+3,108,x+22,104],66,2.5);}
    else {for(const side of [-1,1])curve(g,[x+side*(w+1),42,x+side*(w+6),64,x+side*19,92,x+side*29,110],side<0?199:132,.8);}
    return true;
  }
  function headwear(g,a,c,back) {
    const kind=c.headwear,x=a.cx,w=a.w;
    if(kind==='none')return;
    if(racialHeadwear(g,a,c,back)||referenceHeadwear(g,a,c,back)||addedHeadwear(g,a,c,back)||extraHeadwear(g,a,c,back))return;
    if(back) {
      if(kind==='hood'||kind==='coif') {
        const p=[[x-w-8,39],[x-w-5,20],[x-13,9],[x+13,10],[x+w+7,25],[x+w+10,60],[x+w+6,87],[x+39,107],[x-40,106],[x-w-8,80]];
        if(kind==='coif')chain(g,p,c);else {poly(g,p,64);line(g,[[x-w-3,27],[x-w-4,64],[x-w+1,86]],108,2);}
      }
      return;
    }
    if(kind==='hood'||kind==='coif') {
      const outer=[[x-w-7,40],[x-w-3,21],[x-12,11],[x+12,12],[x+w+4,25],[x+w+8,54],[x+w+3,84],[x+37,107],[x+15,118],[x,110],[x-17,118],[x-38,107],[x-w-6,81]];
      if(kind==='coif')chain(g,outer,c);else {poly(g,outer,91);line(g,[[x-w-2,38],[x-13,22],[x+1,18],[x+17,26],[x+w+2,43]],141,2);}
      // Cut only the face opening; the hood/coif remains over the scalp and neck.
      g.save();g.globalCompositeOperation='destination-out';
      poly(g,[[x-w+4,44],[x-13,34],[x+10,34],[x+w-3,45],[x+w-4,67],[x+13,83],[x,91],[x-14,84],[x-w+4,67]],255);
      g.restore();
      line(g,[[x-w+3,46],[x-13,33],[x+10,33],[x+w-2,45]],kind==='hood'?175:153);
      if(kind==='hood'){line(g,[[x-21,89],[x-8,105],[x+1,109],[x+20,94]],52,2);line(g,[[x-5,107],[x+5,109],[x+1,116]],168);}
      return;
    }
    if(kind==='circlet') {
      line(g,[[x-w+2,37],[x-12,35],[x+12,35],[x+w-2,38]],180,3);
      line(g,[[x-w+3,36],[x-11,34],[x+12,34],[x+w-3,37]],224);
      poly(g,[[x,32],[x+3,36],[x,40],[x-3,36]],92);rect(g,x,34,1,2,220);return;
    }
    if(kind==='cap') {
      poly(g,[[x-w-3,37],[x-w+1,25],[x-12,18],[x+15,19],[x+w+5,29],[x+w+2,40],[x-9,42]],101);
      poly(g,[[x-w+1,30],[x-11,21],[x+7,21],[x+14,29],[x+9,36],[x-8,36]],135);
      line(g,[[x-w-3,38],[x-9,40],[x+11,38],[x+w+2,38]],56,3);return;
    }
    const dome=[[x-w-5,40],[x-w-3,25],[x-15,16],[x-4,12],[x+12,15],[x+w+3,25],[x+w+6,41]];
    poly(g,dome,126);clip(g,dome,()=>{poly(g,[[x-w-3,35],[x-15,20],[x-4,15],[x+1,18],[x-3,38]],195);poly(g,[[x+7,16],[x+w+4,27],[x+w+6,41],[x+10,41]],84);line(g,[[x,15],[x,37]],223);});
    if(kind==='kettle') {
      poly(g,[[x-w-15,41],[x-w-4,35],[x+w+5,35],[x+w+17,43],[x+w+10,47],[x-w-14,46]],112);
      line(g,[[x-w-13,41],[x+w+13,42]],207);line(g,[[x-w-12,46],[x+w+10,47]],57);
    } else {
      rect(g,x-w-5,38,w*2+11,4,84);line(g,[[x-w-3,38],[x+w+4,38]],201);
      poly(g,[[x-2,36],[x+3,36],[x+3,66],[x-1,68]],158);rect(g,x-1,39,1,26,226);
      for(let bx=x-w;bx<=x+w;bx+=8)rect(g,bx,40,1,1,217);
    }
  }
  // Refinement keeps the existing rig and silhouettes. No extra image assets or layer offsets.
  function falloff(x,y,cx,cy,rx,ry) {
    const u=(x-cx)/rx,v=(y-cy)/ry;
    return Math.exp(-2*(u*u+v*v));
  }
  function grain(x,y,seed) {
    let n=Math.imul(x+seed,374761393)^Math.imul(y+17,668265263);
    n=Math.imul(n^(n>>>13),1274126177);
    return ((n^(n>>>16))>>>0)/4294967296-.5;
  }
  function surface(g,outline,shade) {
    const c=canvas(),q=c.getContext('2d');poly(q,outline,255);
    const im=q.getImageData(0,0,SIZE,SIZE),p=im.data;
    for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++) {
      const i=(y*SIZE+x)*4;if(!p[i+3])continue;
      const v=Math.max(0,Math.min(255,Math.round(shade(x+.5,y+.5))));
      p[i]=p[i+1]=p[i+2]=v;
    }
    q.putImageData(im,0,0);g.drawImage(c,0,0);
  }
  // Opaque-pixel relief: changes shading without moving or enlarging a part's alpha mask.
  function relief(g,zones,seed,amount=1.5) {
    const im=g.getImageData(0,0,SIZE,SIZE),p=im.data;
    for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++) {
      const i=(y*SIZE+x)*4;if(!p[i+3])continue;
      let value=p[i]+grain(x,y,seed)*amount;
      for(const z of zones)value+=z[4]*falloff(x,y,z[0],z[1],z[2],z[3]);
      p[i]=p[i+1]=p[i+2]=Math.max(0,Math.min(255,Math.round(value)));
    }
    g.putImageData(im,0,0);
  }
  function curve(g,p,n,width=1) {
    g.strokeStyle=gray(n);g.lineWidth=width;g.beginPath();g.moveTo(p[0],p[1]);
    g.bezierCurveTo(...p.slice(2));g.stroke();
  }
  function drawFace(g,a,c) {
    baseFace(g,a,c);
    const x=a.cx,w=a.w;
    surface(g,a.outline,(px,py)=>{
      const u=(px-x)/w,dome=Math.sqrt(Math.max(0,1-u*u));
      let v=95+77*dome-29*u;
      v+=19*falloff(px,py,x-4,37,w*.8,11);
      v+=15*falloff(px,py,x-13,63,8,7);
      v+=8*falloff(px,py,x+13,62,7,7);
      v-=(19-5*a.definition-10*a.softness)*falloff(px,py,x-17,72,7,6);
      v-=(18-4*a.definition-8*a.softness)*falloff(px,py,x+17,74,8,10);
      v+=(17+a.definition-5*a.softness)*falloff(px,py,x-2,a.chinY-6,9,5);
      v-=12*falloff(px,py,x,a.mouth.y+5,8,2);
      v-=10*falloff(px,py,x+7,70,3,5);
      v+=11*falloff(px,py,x-3,58,3,12);
      for(const eye of a.eyes) {
        v-=(37-10*a.definition-14*a.softness)*falloff(px,py,eye.x,eye.y-1,7,4);
        v+=12*falloff(px,py,eye.x-1,eye.y-6,7,2.5);
        v+=9*falloff(px,py,eye.x-1,eye.y+5,6,2);
      }
      return v+grain(Math.floor(px),Math.floor(py),c.seed)*(3-.8*a.softness);
    });
  }

  function drawNose(g,a,c) {
    const x=a.nose.x+(c.nose==='crooked'?2:0),y=a.nose.y-(c.nose==='short'?1:0);
    const width={straight:5,broad:7,aquiline:5,button:4,crooked:5,slender:4,rounded:5.8,short:4.5,roman:5.5,'wide-tip':7,'soft-tip':4.8,'defined-tip':5.2,'orc-flat':8.3,'dwarf-bulb':8.1,'orc-broad':9.3}[c.nose];
    const noseWidth=width+c.adjustments.noseWidth*.6;
    const bridge=c.nose==='slender'?1:c.nose==='soft-tip'?1.25:c.nose==='defined-tip'?1.7:c.nose==='wide-tip'?1.5:2,top=c.nose==='orc-flat'||c.nose==='orc-broad'?54:c.nose==='short'?53:c.nose==='soft-tip'?51:49,hook=c.nose==='aquiline'?1.5:0;
    const outline=[[x-bridge,top],[x+bridge,top],[x+2.8,y-6],[x+noseWidth,y+hook],[x+noseWidth-1.5,y+3],[x,y+4],[x-noseWidth+1.5,y+3],[x-noseWidth,y],[x-2.5,y-5]];
    surface(g,outline,(px,py)=>154+38*falloff(px,py,x-1,y-7,2.5,9)-30*falloff(px,py,x+3,y-5,2.3,8)+25*falloff(px,py,x-1,y,4,3)-25*falloff(px,py,x,y+4,7,2));
    curve(g,[x-noseWidth+1,y+2,x-noseWidth+2,y+.4,x-3,y+1.7,x-2,y+2.8],70,.65);
    curve(g,[x+1,y+2.8,x+2,y+1+hook,x+noseWidth-1,y+1+hook,x+noseWidth-1,y+2.8+hook],69,.65);
    if(c.nose==='rounded'){g.fillStyle=gray(194);g.beginPath();g.ellipse(x-.8,y+.3,2.4,1.7,0,0,Math.PI*2);g.fill();}
    if(c.nose==='dwarf-bulb')oval(g,x-.5,y+.6,3.7,2.1,182);
    if(c.nose==='orc-broad')curve(g,[x-6,y+.5,x-3,y-1,x+3,y-1,x+6,y+.5],155,1.5);
    if(c.nose==='orc-flat')curve(g,[x-5,y,x-3,y-1.3,x+3,y-1.3,x+5,y],164,1.2);
    if(c.nose==='soft-tip')oval(g,x-.6,y+.4,1.7,1.2,186);
    if(c.nose==='defined-tip')curve(g,[x-.6,52,x-1,57,x-1.3,60,x-1.4,62],188,.7);
    if(c.nose==='roman')curve(g,[x+1,52,x+3,55,x+1,59,x+2,61],127,.8);
    if(c.nose==='wide-tip')curve(g,[x-4,y+.3,x-1,y-1.3,x+2,y-1.3,x+4,y+.3],187,.8);
    if(c.nose==='crooked')curve(g,[x-2,52,x-1,56,x-3,58,x-2,61],139,.65);
    curve(g,[x-1,y+5,x-1,y+6,x,y+7,x,y+8],131,.5);
  }
  function refineHair(g,id,a,c) {
    if(c.hair==='none')return;
    const x=a.cx,w=a.w,R=rng(c.seed+1337),im=g.getImageData(0,0,SIZE,SIZE),p=im.data;
    // A rounded mass beneath the locks prevents the strand highlights reading as stripes.
    for(let y=0;y<SIZE;y++)for(let px=0;px<SIZE;px++) {
      const i=(y*SIZE+px)*4;if(!p[i+3])continue;
      const v=p[i]*.68+17+23*falloff(px,y,x-12,28,21,15)-10*falloff(px,y,x+22,54,13,30)+grain(px,y,c.seed)*3;
      p[i]=p[i+1]=p[i+2]=Math.max(0,Math.min(255,Math.round(v)));
    }
    g.putImageData(im,0,0);if(['loose-side-braid','loose-center-part','curly-shag','tied-back-waves'].includes(c.hair))return;g.save();g.globalCompositeOperation='source-atop';
    const segment=(p,t0,t1)=>{
      const point=t=>{const u=1-t;return [u*u*u*p[0]+3*u*u*t*p[2]+3*u*t*t*p[4]+t*t*t*p[6],u*u*u*p[1]+3*u*u*t*p[3]+3*u*t*t*p[5]+t*t*t*p[7]];};
      const tangent=t=>{const u=1-t;return [3*u*u*(p[2]-p[0])+6*u*t*(p[4]-p[2])+3*t*t*(p[6]-p[4]),3*u*u*(p[3]-p[1])+6*u*t*(p[5]-p[3])+3*t*t*(p[7]-p[5])];};
      const a=point(t0),b=point(t1),da=tangent(t0),db=tangent(t1),d=(t1-t0)/3;
      return [...a,a[0]+da[0]*d,a[1]+da[1]*d,b[0]-db[0]*d,b[1]-db[1]*d,...b];
    };
    const lock=(path,width,light)=>{
      curve(g,path,47,width+.8);
      curve(g,path,82,width);
      const sheen=segment(path,.15+R()*.08,.61+R()*.12).map((v,i)=>i%2?v-.35:v-.55);
      curve(g,sheen,light,.7);
      // Broken, grouped filaments leave both roots and tips darker.
      curve(g,segment(path,.35,.86).map((v,i)=>i%2?v+.3:v+.55),61,.5);
    };
    if(id==='hairBack') {
      for(const side of [-1,1])for(let i=0;i<5;i++) {
        const sx=x+side*(w-3+i*1.5),wave=c.hair==='waves'?3.5:1.4;
        const end=['long','braids'].includes(c.hair)?96:74;
        lock([sx,40,sx+side*wave,53,sx-side*wave,end-12,sx+side,end],1.5,side<0?116:91);
      }
    } else if(['curls','tousled','buzz-cut','tonsure'].includes(c.hair)) {
      // Rounded curl and tuft strokes were drawn with their individual volumes.
    } else if(c.hair==='pageboy'||c.hair==='long'||c.hair==='braids') {
      const part=x+1;
      line(g,[[part,21],[part+1,27],[part+1,33]],53,.7);
      for(const side of [-1,1])for(let i=0;i<6;i++) {
        const sx=part+side*(1+i*2.6),sy=20+i*.55;
        const endX=x+side*(8+i*3.6),endY=40+i*3+(c.hair==='pageboy'?1:0);
        lock([sx,sy,sx+side*5,sy+4,endX+side*1.5,endY-8,endX,endY],1.8+R()*.7,side<0?139:107);
      }
      if(c.hair==='long')for(const side of [-1,1])for(let i=0;i<4;i++) {
        const sx=x+side*(w-2+i*1.5);
        lock([sx,44,sx+side*2,64,sx-side*2,87,sx+side,103-i],1.4,side<0?129:96);
      }
      if(c.hair==='braids')for(const side of [-1,1]) {
        const bx=x+side*(w+1);
        for(let y=58;y<101;y+=5) {
          featureFrame(g,bx,y,-side,()=>{
            curve(g,[-2,0,0,1,2,2,2,4],44,2.3);
            curve(g,[2,0,0,1,-2,2,-2,4],86,1.8);
            curve(g,[-2,.4,0,1,1,2,1,3],side<0?151:121,.7);
            curve(g,[2,1,0,2,-1,3,-1,4],111,.55);
          });
        }
      }
    } else if(c.hair==='tonsure'||c.hair==='receding') {
      for(const side of [-1,1])for(let i=0;i<6;i++) {
        const sx=x+side*(w-5+i*.9);
        lock([sx,28,sx+side*2,34,sx-side,43,sx+side,52+i],1,side<0?124:97);
      }
    } else {
      const wave=c.hair==='waves',short=c.hair==='cropped';
      for(let i=0;i<10;i++) {
        const sx=x+18-i*3.5,sy=21+Math.abs(i-4)*.6;
        const endX=sx-(short?9:17)-R()*3,endY=sy+(short?12:20)+R()*3;
        lock([sx,sy,sx-8,sy-2,endX+(wave?6:1),endY-9,endX,endY],short?1.5:2.1+R()*.6,i<7?142:108);
      }
      if(wave)for(const side of [-1,1])for(let i=0;i<3;i++) {
        const sx=x+side*(w-1+i*1.2);
        lock([sx,41,sx+side*5,49,sx-side*3,61,sx+side,73-i*2],1.7,side<0?127:98);
      }
    }
    g.restore();
  }
  function refineLayer(g,spec,a,c) {
    const id=spec.id,x=a.cx,w=a.w;
    if(id==='face')return;
    if(id==='eyes'||id==='iris'||id==='eyelids')return;
    if(id==='nose')return;
    if(id==='mouth') {
      relief(g,[[a.mouth.x-3,a.mouth.y+2,5,2,11],[a.mouth.x+5,a.mouth.y,4,3,-10]],c.seed,1);
      const w=mouthForm(c)[0],edge=g.createLinearGradient(a.mouth.x-w,0,a.mouth.x+w,0);
      for(const [at,alpha] of [[0,0],[.09,.55],[.18,1],[.82,1],[.91,.55],[1,0]])edge.addColorStop(at,'rgba(255,255,255,'+alpha+')');
      g.save();g.globalCompositeOperation='destination-in';g.fillStyle=edge;g.fillRect(0,0,SIZE,SIZE);g.restore();
      return;
    }
    if(id==='hairFront'||id==='hairBack'){refineHair(g,id,a,c);return;}
    if(id==='brows'){relief(g,[[x-12,29,18,12,9],[x+18,42,13,22,-10]],c.seed,1);return;}
    if(id==='beard') {
      if(id==='beard'&&(c.beard==='none'||c.beard==='stubble'||c.beard==='close-beard'||c.beard==='scruffy'||c.beard==='chin-bristle'))return;
      relief(g,[[x-12,29,18,12,9],[x+18,42,13,22,-10]],c.seed,2);
      g.save();g.globalCompositeOperation='source-atop';
      if(id==='beard') {
        for(let i=-14;i<=14;i+=2) {
          const end=['full','forked','braided','short-boxed','rounded','tapered-beard'].includes(c.beard)?(c.beard==='short-boxed'?94:c.beard==='rounded'?100:108):c.beard==='goatee'?98:91;
          const start=79+Math.abs(i)*.3;
          curve(g,[x+i,start,x+i*.95,start+5,x+i*.7,end-4,x+i*.65,end],42,.8);
          curve(g,[x+i-1,start,x+i*.95-1,start+5,x+i*.7-1,end-4,x+i*.65-1,end],111-Math.abs(i),.65);
        }
        for(const side of [-1,1])for(let i=0;i<5;i++)line(g,[[x+side*(3+i*2),a.mouth.y-4],[x+side*(6+i*2),a.mouth.y-1]],116-i*6,.6);
      }
      g.restore();return;
    }
    if(id==='clothing') {
      relief(g,[[35,105,25,18,16],[96,114,25,24,-12],[64,112,9,16,-9]],c.seed,3);
      g.save();g.globalCompositeOperation='source-atop';
      for(const side of [-1,1]) {
        curve(g,[x+side*21,99,x+side*28,102,x+side*32,111,x+side*37,123],42,1.2);
        curve(g,[x+side*20,99,x+side*27,102,x+side*31,111,x+side*36,123],124,.7);
      }
      if(['gambeson','tunic','robe'].includes(c.clothing))for(const side of [-1,1])for(let i=0;i<7;i++)rect(g,x+side*(23+i),101+i*2,1,1,side<0?139:106);
      g.restore();return;
    }
    if(id==='armor'||id==='headwearFront'||id==='headwearBack') {
      relief(g,[[x-13,25,20,14,19],[x+22,45,15,23,-16],[35,107,28,20,14],[92,118,20,24,-14]],c.seed,2);
      if(id==='headwearFront') {
        g.save();g.globalCompositeOperation='source-atop';
        if(c.headwear==='hood'||c.headwear==='cap') {
          for(const side of [-1,1]){curve(g,[x+side*(w+2),36,x+side*(w+8),52,x+side*(w-1),79,x+side*27,102],52,1.2);curve(g,[x+side*(w+1),36,x+side*(w+6),52,x+side*(w-2),79,x+side*26,102],127,.7);}
        } else if(c.headwear==='nasal'||c.headwear==='kettle') {
          curve(g,[x-w+1,35,x-w+1,26,x-12,19,x-5,17],228,.8);
          for(let bx=x-w;bx<x+w;bx+=8){rect(g,bx,39,1,1,220);rect(g,bx+1,40,1,1,63);}
          for(let j=0;j<6;j++)line(g,[[x-10+j*5,29+j%3],[x-8+j*5,30+j%3]],106,.6);
        }
        g.restore();
      }
    }
  }
  function normalize(input={}) {
    if(!input||typeof input!=='object')input={};
    const selectedRace=OPTIONS.race.includes(input.race)?input.race:'human';
    const c={...DEFAULTS,...(selectedRace==='human'?{}:RACE_FEATURES[selectedRace]),race:selectedRace};
    for(const [key,values] of Object.entries(OPTIONS))if(values.includes(input[key]))c[key]=input[key];
    for(const key of Object.keys(OPTIONS)){if(key==='race')continue;const allowed=partsFor(c.race,key);if(!allowed.includes(c[key])){const fallback=RACE_FEATURES[c.race][key];c[key]=allowed.includes(fallback)?fallback:allowed.includes(DEFAULTS[key])?DEFAULTS[key]:allowed[0];}}
    if(PROFILES.includes(input.profile))c.profile=input.profile;
    if(Number.isFinite(input.seed))c.seed=Math.trunc(input.seed)>>>0;
    c.adjustments=Object.fromEntries(Object.entries(ADJUSTMENTS).map(([key,range])=>{const value=input.adjustments?.[key];return [key,Number.isFinite(value)?Math.max(range.min,Math.min(range.max,Math.round(value))):0];}));
    return c;
  }
  function rasterize(c,steps=32,soft=false) {
    // Quantized pixel shading; soft facial contours retain eight coverage levels.
    const g=c.getContext('2d'),im=g.getImageData(0,0,SIZE,SIZE),p=im.data;
    for(let i=0;i<p.length;i+=4){if(p[i+3]<(soft?19:128)){p[i]=p[i+1]=p[i+2]=p[i+3]=0;continue;}const v=Math.round(Math.round(p[i]/255*(steps-1))*255/(steps-1));p[i]=p[i+1]=p[i+2]=v;p[i+3]=soft?Math.round(Math.round(p[i+3]/255*7)*255/7):255;}
    g.putImageData(im,0,0);return c;
  }
  // Use one raster silhouette for paired features. Canvas antialiasing can otherwise
  // round mirrored curves differently at the half-pixel boundary. Preserve lighting
  // on existing pixels; use the opposite pixel only to fill a coverage mismatch.
  function symmetricCoverage(c,axis=64.5) {
    const g=c.getContext('2d'),im=g.getImageData(0,0,SIZE,SIZE),p=im.data;
    for(let y=0;y<SIZE;y++)for(let x=1;x<64;x++) {
      const left=(y*SIZE+x)*4,right=(y*SIZE+Math.round(axis*2-1-x))*4;
      if(p[left+3]===p[right+3])continue;
      for(let k=0;k<4;k++)p[right+k]=p[left+k];
    }
    g.putImageData(im,0,0);return c;
  }
  // Remove only detached one-pixel islands in continuous hair/facial shapes.
  // Freckles, scars, stubble, eye reflections and equipment detail stay untouched.
  function removeSpecks(c) {
    const g=c.getContext('2d'),im=g.getImageData(0,0,SIZE,SIZE),p=im.data,clear=[];
    for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++) {
      const i=(y*SIZE+x)*4;if(!p[i+3])continue;let touches=false;
      for(let dy=-1;dy<=1&&!touches;dy++)for(let dx=-1;dx<=1;dx++) {
        if(!dx&&!dy)continue;const xx=x+dx,yy=y+dy;
        if(xx>=0&&xx<SIZE&&yy>=0&&yy<SIZE&&p[(yy*SIZE+xx)*4+3]){touches=true;break;}
      }
      if(!touches)clear.push(i);
    }
    for(const i of clear)p.fill(0,i,i+4);
    if(clear.length)g.putImageData(im,0,0);return c;
  }
  function build(input) {
    const config=normalize(input),anchors=rig(config.face,config.adjustments),layers={};
    const painters={ears,face:drawFace,clothing,armor,age,marks,nose:drawNose,brows,mouth,teeth,beard,eyelids,headwearBack:(g,a,c)=>headwear(g,a,c,true),headwearFront:(g,a,c)=>headwear(g,a,c,false),eyes:(g,a,c)=>naturalEyes(g,a,c,false),iris:(g,a,c)=>naturalEyes(g,a,c,true),hairBack:(g,a,c)=>hair(g,a,c,true),hairFront:(g,a,c)=>hair(g,a,c,false)};
    for(const spec of LAYERS){const c=canvas(),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.lineCap='round';g.lineJoin='round';g.save();if(spec.feature==='hair'){const v=config.adjustments.hairVolume;g.translate(anchors.cx,43);g.scale(1+v*.05,1+v*.04);g.translate(-anchors.cx,-43);}painters[spec.id](g,anchors,config);refineLayer(g,spec,anchors,config);g.restore();layers[spec.id]=rasterize(c,32,spec.id==='brows'||spec.id==='mouth'||spec.id==='teeth'&&['small-tusks','heavy-tusks'].includes(config.mouth)||spec.id==='age'&&config.age==='mature'||spec.id==='beard'&&['stubble','close-beard','chin-bristle'].includes(config.beard));}
    symmetricCoverage(layers.ears,64);
    for(const id of ['hairFront','hairBack','mouth','brows'])removeSpecks(layers[id]);
    for(const id of ['eyes','iris','eyelids',...(config.brows==='broken'?[]:['brows'])])symmetricCoverage(layers[id]);
    const mask=canvas(),mg=mask.getContext('2d');mg.fillStyle=gray(255);
    for(const eye of anchors.eyes){eyeForm(mg,eye,anchors,config.eyes);mg.fill();}
    symmetricCoverage(rasterize(mask));
    const ig=layers.iris.getContext('2d');ig.save();ig.globalCompositeOperation='destination-in';ig.drawImage(mask,0,0);ig.globalCompositeOperation='destination-out';ig.drawImage(layers.eyelids,0,0);ig.restore();
    if(config.beard==='stubble'||config.beard==='close-beard'||config.beard==='chin-bristle') {
      const bg=layers.beard.getContext('2d');bg.save();bg.globalCompositeOperation='destination-in';bg.drawImage(layers.face,0,0);bg.restore();
      const lips=canvas(),lg=lips.getContext('2d'),image=layers.mouth.getContext('2d').getImageData(0,0,SIZE,SIZE);
      for(let i=0;i<image.data.length;i+=4){const alpha=image.data[i+3]?255:0;image.data[i]=image.data[i+1]=image.data[i+2]=image.data[i+3]=alpha;}
      lg.putImageData(image,0,0);
      bg.save();bg.globalCompositeOperation='destination-out';bg.drawImage(lips,0,0);bg.restore();
    }
    if(config.race==='orc'&&['small-tusks','heavy-tusks'].includes(config.mouth)) {
      const mask=canvas(),mg=mask.getContext('2d'),pixels=layers.teeth.getContext('2d').getImageData(0,0,SIZE,SIZE);
      for(let i=0;i<pixels.data.length;i+=4){const alpha=pixels.data[i+3]?255:0;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=pixels.data[i+3]=alpha;}mg.putImageData(pixels,0,0);
      const g=layers.beard.getContext('2d');g.save();g.globalCompositeOperation='destination-out';g.drawImage(mask,0,0);g.restore();
    }
    // Skin overlays stay off the eye opening and its rim, including scar strokes.
    const protection=canvas(),pg=protection.getContext('2d');
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){pg.drawImage(layers.eyes,dx,dy);pg.drawImage(layers.eyelids,dx,dy);}
    for(const id of ['age','marks']){const g=layers[id].getContext('2d');g.save();g.globalCompositeOperation='destination-out';g.drawImage(protection,0,0);g.restore();}
    return {config,anchors,layers};
  }
  function tint(source,color) {
    if(!/^#[0-9a-f]{6}$/i.test(color))throw new Error('A tint must be a six-digit hex color');
    const out=canvas(),g=out.getContext('2d');g.drawImage(source,0,0);const im=g.getImageData(0,0,SIZE,SIZE),p=im.data;
    const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
    for(let i=0;i<p.length;i+=4){const v=p[i]/255;for(let k=0;k<3;k++)p[i+k]=Math.round(v<.5?rgb[k]*(.22+v*1.56):rgb[k]+(255-rgb[k])*(v-.5)*1.35);}
    g.putImageData(im,0,0);return out;
  }
  function hairFitMask(portrait,rule) {
    const out=canvas(),g=out.getContext('2d');
    if(rule.hair==='frame') {
      g.drawImage(portrait.layers.face,0,0);
      g.drawImage(portrait.layers.headwearBack,0,0);
      g.drawImage(portrait.layers.headwearFront,0,0);
    } else {g.fillStyle='#fff';g.fillRect(0,rule.rim,SIZE,SIZE-rule.rim);}
    return out;
  }
  function composite(portrait,{colors=null,visible=null}={}) {
    const out=canvas(),g=out.getContext('2d');g.imageSmoothingEnabled=false;
    const wearing=!visible||visible.headwearFront!==false||visible.headwearBack!==false;
    const rule=wearing?HEADWEAR_RULES[portrait.config.headwear]:HEADWEAR_RULES.none;
    const mask=rule.hair==='tuck'||rule.hair==='frame'?hairFitMask(portrait,rule):null;
    for(const spec of LAYERS) {
      if(visible&&visible[spec.id]===false)continue;
      const isHair=spec.feature==='hair';
      if(spec.id==='ears'&&rule.ears==='hide')continue;
      if(isHair&&(rule.hair==='hide'||rule.hair==='frame'&&spec.id==='hairBack'))continue;
      let src=portrait.layers[spec.id];
      if(isHair&&mask){const fitted=canvas(),fg=fitted.getContext('2d');fg.drawImage(src,0,0);fg.globalCompositeOperation='destination-in';fg.drawImage(mask,0,0);src=fitted;}
      g.drawImage(colors&&spec.channel?tint(src,colors[spec.channel]||COLORS[spec.channel]):src,0,0);
    }
    return out;
  }
  function startRace(race,input={}) {
    const current=normalize(input),selected=OPTIONS.race.includes(race)?race:'human',features={...RACE_FEATURES[selected]};
    if(selected==='human'&&PROFILE_FEATURES[current.profile])features.face=PROFILE_FEATURES[current.profile].face;
    return normalize({...current,...features,race:selected});
  }
  function startProfile(profile,input={}) {
    const current=normalize(input),selected=PROFILES.includes(profile)?profile:'custom';
    const next=normalize({...current,...(PROFILE_FEATURES[selected]||{}),profile:selected});
    return selected!=='custom'&&next.race!=='human'?startRace(next.race,next):next;
  }
  function random(seed,profile='custom',race='human') {
    const selected=PROFILES.includes(profile)?profile:'custom',kind=OPTIONS.race.includes(race)?race:'human',R=rng(seed),c={seed:seed>>>0,profile:selected,race:kind};
    const pick=values=>values[Math.floor(R()*values.length)];
    for(const key of Object.keys(RACE_PARTS[kind]))c[key]=pick(partsFor(kind,key));
    if(selected==='female'){c.beard='none';const hair=['long','braids','waves','swept','pageboy','cropped','curls','ponytail','high-bun','low-bun','half-up','single-braid','undercut','loose-side-braid','loose-center-part','forge-braids','braided-crown','war-crest'].filter(v=>partsFor(kind,'hair').includes(v));c.hair=pick(hair);}
    if(kind==='dwarf'&&selected!=='female'&&R()<.75)c.beard=pick(['full','forked','braided','bound-beard','rounded','trimmed']);
    if(kind==='orc'){if(R()<.7)c.mouth=pick(['small-tusks','heavy-tusks']);if(R()<.7)c.beard='none';}
    if(kind==='elf')c.beard='none';
    if(kind==='human'&&selected!=='female'&&R()<.35)c.beard='none';
    if(R()<.55)c.marks='none';
    return normalize(c);
  }
  function geometry(input){const c=normalize(input);return rig(c.face,c.adjustments);}
  root.PortraitEngine=Object.freeze({version:VERSION,size:SIZE,adjustments:ADJUSTMENTS,geometry,options:OPTIONS,hairGroups:HAIR_GROUPS,headwearGroups:HEADWEAR_GROUPS,headwearRules:HEADWEAR_RULES,races:OPTIONS.race,raceParts:RACE_PARTS,partsFor,profiles:PROFILES,presets:PRESETS,defaults:DEFAULTS,colors:COLORS,order:LAYERS,normalize,startProfile,startRace,build,composite,tint,random});
})(globalThis);
