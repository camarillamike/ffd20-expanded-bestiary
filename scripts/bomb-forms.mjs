export const BOMB_FORMS = {
  Fire: ["fire", "Fire", "ice", "water"], Ice: ["ice", "Blizzard", "wind", "fire"],
  Wind: ["wind", "Aero", "earth", "ice"], Earth: ["earth", "Stone", "lightning", "wind"],
  Lightning: ["lightning", "Thunder", "water", "earth"], Water: ["water", "Water", "fire", "lightning"],
  Holy: ["light", "Light", "", "dark"], Dark: ["dark", "Dark", "", "light"],
  Arcane: ["nonelemental", "Ruin", "", ""],
};
const moduleId = "ffd20-expanded-bestiary";
const builderId = "ffd20-bestiary-builder";
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
  blast.damage.parts = [{formula:tierTwo?"6d6":tierOne?"4d6":"1d6", types:[element,"bludgeoning"]}];
  if(tierTwo){
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
  if (spells.length) {
    const keep = spells.find(i => i.flags[builderId].lookupName === spellName) ?? spells[0];
    actor.items = actor.items.filter(i => i.type !== "spell" || i === keep);
    keep.name = spellName;
    Object.assign(keep.flags[builderId], {lookupName:spellName, name:spellName});
    keep.system.tag = spellName.toLowerCase();
    keep.system.description.value = "<p>" + form + " form spell: " + spellName + ".</p>";
  }
}
