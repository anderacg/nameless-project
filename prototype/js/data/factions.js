'use strict';
/* ---------- data: factions ---------- */
// four single-race kingdoms and one mixed league
const FACS={
  vale:{n:'Vale Crown',col:'#e07a48',d:'Human kingdom of the western farmlands. Shield walls, pikes and armored knights.',races:['human'],lords:['Lord Aldric','Lady Maren','Ser Corwin','Lady Rowena']},
  karn:{n:'Karn Clans',col:'#6b9cf0',d:'Dwarf holds in the frozen north-east. Axes, crossbows and stubborn walls.',races:['dwarf'],lords:['Thane Borka','Thane Hroth','Thane Dain','Thane Gimra']},
  sylvan:{n:'Sylvan Court',col:'#e7a0d8',d:'Elven realm of the south-western woods. Archers without equal and swift riders.',races:['elf'],lords:['Lady Ithriel','Lord Caelan','Warden Sylas','Lord Faelar']},
  horde:{n:'Ashgor Horde',col:'#c84040',d:'Orc warbands of the eastern desert. Brutal, fast and many.',races:['orc'],lords:['Warchief Ulgra','Gash Bonecleaver','Mok the Red','Grukk Ironjaw']},
  salt:{n:'Salt League',col:'#4cc0a8',d:'Free merchant ports of the south coast, where elves, humans and orcs trade and fight side by side.',races:['elf','human','orc'],lords:['Admiral Cass','Captain Ivo','Admiral Neri','Captain Mirelle']}
};
