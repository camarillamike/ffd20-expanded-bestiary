const reviewed = new Map([
  ["fire", { label: /^Reflex partial\b/i, type: "ref" }],
  ["aero", { label: /^Reflex partial\b/i, type: "ref" }],
  ["stabilize", { label: /^Will negates\b/i, type: "will", harmless: true }],
]);

// Called on the detached toObject() copy before it becomes an embedded item.
export function completeOwnedSpellSave(spell) {
  if (spell.type !== "spell") return;
  const rule = reviewed.get(spell.name.trim().toLowerCase());
  if (!rule) return;
  for (const { save } of spell.system.actions ?? []) {
    if (!save || save.type || !rule.label.test(save.description ?? "")) continue;
    save.type = rule.type;
    if (rule.harmless) save.harmless = true;
  }
}
