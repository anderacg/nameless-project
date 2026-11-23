# Wearable portrait equipment

Implemented: 17 body styles and 22 helmet styles, plus matching damaged variants (78 item definitions). No artwork generation or external assets.

The catalog in `data/gear.js` uses existing portrait part IDs. Padded jackets, gambesons, leather/harness/hide variants, brigandine, plate, cultural mail and plate, fur, open helmets and the newer closed helmets are actual equipment. Every item has a tier, price, illustrated icon, stats, portrait part and battlefield look. Light armor offers a small speed bonus; harnesses exchange health for critical chance; heavier armor/closed helmets add health and a small movement cost. These are alternatives inside the existing seven-tier economy.

`Faces.dress` pins only the clothing/headwear parts provided by equipped items. The portrait normalizer accepts those validated equipment parts across races, while facial features, character creation and ordinary generated wardrobe preferences keep their existing racial catalogs. Removing gear removes the override. Body cloth and helmet colours follow item colours.

Battlefield figures use the existing readable armor and helmet families. Harnesses add a shoulder strap; mail coifs and closed horned helmets have explicit doll combinations. Small battle sprites share silhouettes within a family; detailed engravings and individual visor shapes remain in portrait artwork. The new fur mantle obeys the equipped-fur rule and does not manufacture animal headwear.

Smiths keep six pieces and their weekly stock lifetime and material budget. The first two pieces are body/headwear styles at the forged tier; remaining pieces retain the existing ordinary assortment. Cultural pieces get a stock preference in the corresponding people's settlements, without race restrictions on equipment. Existing shops refresh normally, rather than rerolling stock on load.

Random armor/headwear drops can use the styles. Damaged drops preserve the style and repair into its exact whole item. Existing ordinary damaged gear remains valid. Existing saves require no migration; item definitions supply the new metadata.

Validation: `portraitgear` covers all 39 mappings on four races, stats/damaged variants, local icons, battlefield sprites, harness/fur rules, every stock tier, weekly stock reuse and exact-style repair. `junkgear` covers existing damaged gear and drops. `furgear` covers the previous equipment-only fur behavior. Preview sheets show equipped armor/headwear on human, dwarf, elf and orc portraits.
