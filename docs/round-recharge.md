# Round recharge on an owned item

No Item Macro or on-use script is required. The bestiary module loads `scripts/recharge.mjs` for the FFd20 world. Its hooks also work on items you create on other actors. The quickest template is the Machina Worker's **Critical Attack**: copy it onto your creature, keep the charge settings and marked effect note, and change the name and attack to your own.

## Minimum setup

| Where | Value for a 1d4-round ability |
| --- | --- |
| Item: Limited Uses | Charges; current 1, maximum 1; deduct 1 when used. Leave the native recharge formula blank. |
| Item: document flag | `flags.ffd20-bestiary-builder.roundRecharge` = `"1d4"`. This is a document flag, not a roll-data flag in the item sheet's Advanced tab. |
| Action: Effect Notes | `Recharge <span class="ffd20-bestiary-recharge">[[1d4]]</span> rounds.` |

The inline roll supplies the duration. The flag opts the item in; its string is not rolled again. Use the same expression in both places. The marked span must survive in the actual action effect note, not just the item description or footnotes. For a fixed three rounds use `[[3]]` in the span and `"3"` for the flag.

## Optional one-time setup macro

Use this on a fresh **single-action world actor item** you own, not a compendium entry. Replace the placeholder with the owned item's UUID. It sets the charge pool to 1 and preserves the other action data and notes. Do not run it on an item with a charge pool that you want to keep.

```js
const item = await fromUuid("Actor.ACTOR_ID.Item.ITEM_ID");
if (item?.documentName !== "Item" || item.parent?.documentName !== "Actor" || item.pack || !item.isOwner)
  throw new Error("Choose an owned item on a world actor.");
const actions = item.toObject().system.actions;
if (actions?.length !== 1) throw new Error("This example expects exactly one action.");
const formula = "1d4";
const notes = actions[0].notes ??= {};
notes.effect = [...(notes.effect ?? []).filter(n => !n.includes("ffd20-bestiary-recharge")),
  `Recharge <span class="ffd20-bestiary-recharge">[[${formula}]]</span> rounds.`];
await item.update({
  "system.actions": actions,
  "system.uses.per": "charges", "system.uses.value": 1, "system.uses.maxFormula": "1",
  "system.uses.autoDeductChargesCost": "1", "system.uses.rechargeFormula": "",
  "flags.ffd20-bestiary-builder.roundRecharge": formula
});
```

## What happens at the table

1. FFd20 consumes the charge and posts the card. On `pf1PostActionUse`, if the actor is in the started encounter and the use actually cost a charge, the listener reads the rendered inline result. The player does not roll a second cooldown.
2. The listener stores `flags.ffd20-expanded-bestiary.nextRecharge` on the item: encounter ID, due round, and the ID of the combatant whose turn it was **when the action was used**.
3. On `updateCombat` (and on `ready` when reconnecting to a started encounter), the active GM restores **one charge** when that encounter reaches or passes the due turn, then clears the marker. Example: use it on the Worker's turn in round 2, roll a 3, and it returns on that turn in round 5.

This is a combat-round timer, not a clock, a generic multi-charge pool, or a minutes/hours scheduler. Outside combat, or if that encounter ends before the cooldown expires, restore the charge manually. A plain `Recharge [[1d4]]` note by itself only prints the roll.
