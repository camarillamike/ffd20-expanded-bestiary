const MODULE = "ffd20-expanded-bestiary";
const SETTING = "quickDamageDefenses";

Hooks.on("pf1RegisterMaterials", registry => {
  if (!registry.has("crystal")) registry.register(MODULE,"crystal",{name:"Crystal",shortName:"Crystal",addon:true,intrinsic:true,dr:true});
});

Hooks.once("init", () => {
  if (game.system.id !== "ffd20") return;
  game.settings.register(MODULE, SETTING, {
    name: "Apply defenses on quick damage",
    hint: "The full Apply Damage button on FFd20 attack cards uses each recipient's default defenses. Shift-click still opens the adjustment dialog.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });
});

Hooks.on("pf1ApplyDamage", (actor, options) => {
  const button = options.element?.dataset;
  if (game.system.id !== "ffd20" || options.dialog || options.forceDialog || options.asManaDamage
    || !options.interactive || !(options.value > 0) || options.reduction || options.ratio !== 1
    || button?.action !== "applyDamage" || button.ratio !== "1"
    || !Number.isInteger(options.attackIndex) || !options.message
    || !game.settings.get(MODULE, SETTING)) return;

  try {
    // FFd20's quick path clones damage models without their rolled values. Recover the
    // original typed rolls, never rerolling or inferring damage types from item names.
    const attack = options.message.systemRolls.attacks[options.attackIndex];
    const rolls = [...attack.damage, ...(options.isCritical ? attack.critDamage ?? [] : [])];
    if (!rolls.length) throw new Error("No damage rolls on this attack");
    const split = options.action?.item?.flags?.[MODULE]?.splitBombDamage;
    const instances = rolls.flatMap(roll => {
      if (!Number.isFinite(roll.total)) throw new Error("Missing damage total");
      const part = new ffd20.models.action.DamagePartModel(roll.damageType.toObject());
      part.value = roll.total;
      if (split && new Set(part.types).has(split) && new Set(part.types).has("bludgeoning")) {
        return [[split,Math.floor(part.value/2)],["bludgeoning",part.value-Math.floor(part.value/2)]].map(([type,value])=>{
          const instance = new ffd20.models.action.DamagePartModel({...roll.damageType.toObject(),types:[type]});
          instance.value=value;
          return instance;
        });
      }
      return part;
    });
    // Construct the same per-target calculation as Shift-click, without rendering
    // or submitting the form. FFd20 remains the only code that writes HP.
    const preview = new ffd20.applications.ApplyDamage({ ...options, targets: [actor], instances });
    const target = preview.targets.get(actor.uuid);
    let reduction = target?.reduction.total;
    if (!Number.isFinite(reduction) || reduction < 0) throw new Error("Missing target reduction");
    const authored = actor.flags?.[MODULE]?.halfResistances;
    const liveEntries = String(actor.system.traits.eres?.custom ?? "").toLowerCase().split(/[;,]/).map(s=>s.trim());
    const half = authored?.filter(t=>liveEntries.includes(t+" 50%"));
    if (half?.length) {
      const eligible = target.instances.filter(i=>i.total>0 && (i.isPhysical && half.includes("physical")
        || [...i.typeIds].some(t=>half.includes(t)))).reduce((total,i)=>total+i.total,0);
      reduction += Math.ceil(eligible/2);
    }
    options.reduction = Math.min(options.value, reduction);
  } catch (error) {
    options.value = 0;
    console.warn("FF D20 Expanded Bestiary | Quick damage calculation failed", error);
    ui.notifications.warn(`Quick damage not applied to ${actor.name}. Shift-click Apply Damage to review this hit.`);
  }
});
