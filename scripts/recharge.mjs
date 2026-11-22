const SCOPE = "ffd20-expanded-bestiary";
const FLAG = "nextRecharge";
const DAILY = "dailyCooldownUntil";
const dual = item => Boolean(item.flags?.["ffd20-bestiary-builder"]?.dailyRoundCooldown);
const pending = new WeakMap();
const uses = new WeakMap();

function ready(combat, marker) {
  if (!marker || marker.combat !== combat.id || combat.round < marker.round) return false;
  const turn = combat.turns.findIndex(c => c.id === marker.turnId);
  return combat.round > marker.round || turn < 0 || combat.turn >= turn;
}

function rolledInterval(shared) {
  const card = document.createElement("div");
  card.innerHTML = shared.chatAttacks.find(a => a.effectNotesHTML?.includes("ffd20-bestiary-recharge"))?.effectNotesHTML ?? "";
  return Number(card.querySelector(".ffd20-bestiary-recharge")?.textContent.trim());
}

function cooling(item, marker) {
  if (!marker || marker.owner !== item.uuid) return false;
  const combat = marker.combat && (game.combats?.get(marker.combat) ?? (game.combat?.id === marker.combat ? game.combat : null));
  if (combat?.started && combat.combatants.some(c => c.actor?.uuid === item.actor.uuid)) return !ready(combat, marker);
  return game.time.worldTime < marker.worldTime;
}

function reject(reason) {
  ui.notifications.warn(reason);
  return false;
}

// ActionUse.process has enriched effectNotesHTML here, but has not run scripts,
// subtracted charges, or posted chat. Hooks.call needs a synchronous false.
Hooks.on("pf1PreActionUse", use => {
  const { item, actor, shared } = use;
  if (!dual(item)) return;
  if (!actor || item.actor !== actor || (use.token?.actor && use.token.actor.uuid !== actor.uuid)
      || (item.system.uses?.per !== "day" && !(item.system.uses?.per === "charges" && item.flags?.["ffd20-bestiary-builder"]?.rocketRack048)) || item.links?.charges || shared.rollData.chargeCost !== 1)
    return reject(`${item.name}: use the owned token item with its normal daily cost of one.`);
  if (!(item.system.uses.value > 0)) return reject(`${item.name}: no daily uses remain.`);
  const previous = pending.get(item);
  if (previous && (previous.provisional || (previous.use.shared.totalChargeCost && cooling(item,previous.marker))))
    return reject(`${item.name}: a use is already being resolved.`);
  if (cooling(item, item.getFlag(SCOPE, DAILY))) return reject(`${item.name}: its rolled cooldown has not expired.`);
  const rounds = rolledInterval(shared), seconds = CONFIG.time.roundTime;
  if (!Number.isSafeInteger(rounds) || rounds < 1 || !Number.isFinite(game.time.worldTime) || !(seconds > 0))
    return reject(`${item.name}: missing rolled interval or world clock; no daily use spent.`);
  const marker = { owner: item.uuid, worldTime: game.time.worldTime + rounds * seconds, seconds: rounds * seconds };
  const combat = game.combat;
  if (combat?.started && combat.combatants.some(c => c.actor?.uuid === actor.uuid))
    Object.assign(marker, { combat: combat.id, round: combat.round + rounds, turnId: combat.combatant?.id });
  const record = { use, marker, provisional: true, attached: false };
  pending.set(item, record);
  uses.set(use, record);
  // Later pre-hooks or use scripts can veto without any post hook. Keep the
  // synchronous reservation only through this dispatch unless native spending begins.
  setTimeout(() => { record.provisional = false; }, 0);
});

// ItemPF.addCharges(-cost) issues item.update({"system.uses.value": ...}).
// Persist the deadline in that same owned item write, not a second daily debit.
Hooks.on("preUpdateItem", (item, changed) => {
  if (!dual(item)) return;
  const record = pending.get(item);
  if (!record || record.use.shared.totalChargeCost !== 1 || record.attached) return;
  const value = changed.system?.uses?.value ?? changed["system.uses.value"];
  if (value !== item.system.uses.value - 1) return;
  foundry.utils.setProperty(changed, `flags.${SCOPE}.${DAILY}`, record.marker);
  record.attached = true;
});

// performRest constructs itemUpdates, calls this cancellable hook, then commits
// them together. Do not create a use or simulate world time for other actors.
Hooks.on("pf1PreActorRest", (actor, options, _actorUpdate, itemUpdates) => {
  for (const item of actor.items) {
    if (!dual(item)) continue;
    const marker = item.getFlag(SCOPE, DAILY);
    if (!marker || (cooling(item, marker) && !(options.hours * 3600 >= marker.seconds))) continue;
    let update = itemUpdates.find(u => u._id === item.id);
    if (!update) itemUpdates.push(update = { _id: item.id });
    foundry.utils.setProperty(update, `flags.${SCOPE}.-=${DAILY}`, null);
  }
});

async function restore(combat) {
  if (!game.users.activeGM?.isSelf) return;
  for (const actor of new Set(combat.combatants.map(c => c.actor).filter(Boolean))) {
    const updates = [];
    for (const item of actor.items) {
      if (dual(item) || !ready(combat, item.getFlag(SCOPE, FLAG))) continue;
      updates.push({ _id: item.id, "system.uses.value": 1, [`flags.${SCOPE}.-=${FLAG}`]: null });
    }
    if (updates.length) await actor.updateEmbeddedDocuments("Item", updates);
  }
}

Hooks.on("pf1PostActionUse", async use => {
  const { item, actor, shared } = use;
  if (dual(item)) {
    const record = uses.get(use);
    if (!record) return;
    try {
      // Some synthetic document backends do not expose the embedded pre-update.
      if (!record.attached && shared.totalChargeCost === 1) await item.setFlag(SCOPE, DAILY, record.marker);
    } finally {
      uses.delete(use);
      if (pending.get(item) === record) pending.delete(item);
    }
    return;
  }
  if (!item.flags?.["ffd20-bestiary-builder"]?.roundRecharge || !shared.totalChargeCost) return;
  const combat = game.combat;
  if (!combat?.started || !combat.combatants.some(c => c.actor?.uuid === actor?.uuid)) return;
  // Read the very same inline result FFd20 enriched for the attack card. Never reroll the timer.
  const rounds = rolledInterval(shared);
  if (!Number.isInteger(rounds) || rounds < 1) {
    ui.notifications.warn(`${item.name}: restore the charge manually after the cooldown shown on the card.`);
    return;
  }
  await item.setFlag(SCOPE, FLAG, { combat: combat.id, round: combat.round + rounds, turnId: combat.combatant?.id });
});

Hooks.on("updateCombat", (combat, changed) => {
  if ("round" in changed || "turn" in changed) return restore(combat);
});
Hooks.once("ready", () => {
  if (game.combat?.started) return restore(game.combat);
});
