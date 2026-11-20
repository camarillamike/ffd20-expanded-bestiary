export const BOMB_FORMS = {
  Fire: ["fire", "Fire", "ice", "water"], Ice: ["ice", "Blizzard", "wind", "fire"],
  Wind: ["wind", "Aero", "earth", "ice"], Earth: ["earth", "Stone", "lightning", "wind"],
  Lightning: ["lightning", "Thunder", "water", "earth"], Water: ["water", "Water", "fire", "lightning"],
  Holy: ["light", "Light", "", "dark"], Dark: ["dark", "Dark", "", "light"],
  Arcane: ["nonelemental", "Ruin", "", ""],
};
const moduleId = "ffd20-expanded-bestiary";
const builderId = "ffd20-bestiary-builder";
export const TIER_THREE_NAMES = {Fire:"Grenade",Ice:"Cryohedron",Wind:"Turbine",Earth:"Crevice",Lightning:"Circuitron",Water:"Maelstrom",Holy:"Angelic",Dark:"Shade",Arcane:"Mystical"};
export const TIER_TWO_NAMES = {Fire:"Balloon",Ice:"Cryonade",Wind:"Zephyr",Earth:"Fissure",Lightning:"Galvanade",Water:"Whirlpool",Holy:"Gleam",Dark:"Umbra",Arcane:"Esoteric"};

// Called on packaged source data, before item lookup, never on a player's edited actor.
export function configureBombForm(actor, form) {
  const [element, spellName, resist, weakness] = BOMB_FORMS[form];
  const traits = actor.system.traits;
  actor.flags[moduleId] ??= {};
  Object.assign(actor.flags[moduleId], {bombForm:form, halfResistances:resist ? [resist] : []});
  traits.di = [element];
  traits.ci = ["bleed","paralyze","poison","sleep"];
  traits.dv = weakness ? [weakness] : [];
  traits.eres = { value:[], custom:resist ? resist + " 50%" : "" };
  const weaknessItem = actor.items.find(i => i.flags?.[builderId]?.generatedWeaknesses);
  if (weaknessItem) {
    weaknessItem.name = "Elemental Affinity";
    weaknessItem.system.description.value = "<p>" + form + " form. Immune to " + element
      + (resist ? "; halves " + resist + " damage" : "") + (weakness ? "; vulnerable to " + weakness : "") + ".</p>";
  }
  const feature = actor.items.find(i => i.name === "Self-Destruct" && i.type === "feat");
  feature.flags[moduleId] = {...feature.flags[moduleId], splitBombDamage:element};
  const blast = feature.system.actions[0];
  const tierOne=actor.flags[moduleId].bombSource==="bomb-t1";
  const tierTwo=actor.flags[moduleId].bombSource==="bomb-t2";
  const tierThree=actor.flags[moduleId].bombSource==="bomb-t3";
  blast.damage.parts = [{formula:tierThree?"8d6":tierTwo?"6d6":tierOne?"4d6":"1d6", types:[element,"bludgeoning"]}];
  if(tierThree){
    actor.system.details.cr.base=form==="Arcane"?8:7;
    actor.system.details.xp.value=form==="Arcane"?4800:3200;
  }else if(tierTwo){
    actor.system.details.cr.base=form==="Arcane"?5:4;
    actor.system.details.xp.value=form==="Arcane"?1600:1200;
  }else if(tierOne){
    actor.system.details.cr.base=form==="Arcane"?4:3;
    actor.system.details.xp.value=form==="Arcane"?1200:800;
  }
  blast.notes ??= {};
  blast.notes.effect = (blast.notes.effect ?? []).filter(t => !t.startsWith("Split this roll:"));
  blast.notes.effect.push("Split this roll: half " + element + ", remainder bludgeoning. Do not roll the damage twice.");
  const spells = actor.items.filter(i => i.type === "spell");
  if(tierThree){
    const targets=[spellName,form==="Arcane"?"Poison":spellName+" II"];
    if(spells.length!==2)throw Error("Expected the two base Bomb T3 spells before compiling "+form);
    for(const [i,name] of targets.entries()){
      const spell=spells.find(s=>s.system.level===i+1);
      if(!spell)throw Error("Missing Bomb T3 spell level "+(i+1));
      spell.name=name;
      Object.assign(spell.flags[builderId],{lookupName:name,name});
      spell.system.tag=name.toLowerCase().replaceAll(" ","");
      spell.system.description.value="<p>"+form+" form spell: "+name+".</p>";
    }
  }else if (spells.length) {
    const keep = spells.find(i => i.flags[builderId].lookupName === spellName) ?? spells[0];
    actor.items = actor.items.filter(i => i.type !== "spell" || i === keep);
    keep.name = spellName;
    Object.assign(keep.flags[builderId], {lookupName:spellName, name:spellName});
    keep.system.tag = spellName.toLowerCase();
    keep.system.description.value = "<p>" + form + " form spell: " + spellName + ".</p>";
  }
}
