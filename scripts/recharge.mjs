const SCOPE = "ffd20-expanded-bestiary";
const FLAG = "nextRecharge";

function ready(combat, marker) {
  if (!marker || marker.combat !== combat.id || combat.round < marker.round) return false;
  const turn = combat.turns.findIndex(c => c.id === marker.turnId);
  return combat.round > marker.round || turn < 0 || combat.turn >= turn;
}

async function restore(combat) {
  if (!game.users.activeGM?.isSelf) return;
  for (const actor of new Set(combat.combatants.map(c => c.actor).filter(Boolean))) {
    const updates = [];
    for (const item of actor.items) {
      if (!ready(combat, item.getFlag(SCOPE, FLAG))) continue;
      updates.push({ _id: item.id, "system.uses.value": 1, [`flags.${SCOPE}.-=${FLAG}`]: null });
    }
    if (updates.length) await actor.updateEmbeddedDocuments("Item", updates);
  }
}

Hooks.on("pf1PostActionUse", async use => {
  const { item, actor, shared } = use;
  if (!item.flags?.["ffd20-bestiary-builder"]?.roundRecharge || !shared.totalChargeCost) return;
  const combat = game.combat;
  if (!combat?.started || !combat.combatants.some(c => c.actor?.uuid === actor?.uuid)) return;
  // Read the very same inline result FFd20 enriched for the attack card. Never reroll the timer.
  const card = document.createElement("div");
  card.innerHTML = shared.chatAttacks.find(a => a.effectNotesHTML?.includes("ffd20-bestiary-recharge"))?.effectNotesHTML ?? "";
  const rounds = Number(card.querySelector(".ffd20-bestiary-recharge")?.textContent.trim());
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
