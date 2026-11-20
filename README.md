# FF D20 Expanded Bestiary

Generated Foundry VTT module for FF D20 bestiary actors.

## Foundry Install

Install through the Foundry administrator package installer with this manifest URL:

```text
https://raw.githubusercontent.com/camarillamike/ffd20-expanded-bestiary/main/module.json
```

The installer uses the release zip referenced by `module.json`.

## Importing Actors

After enabling the module in an FF D20 world as a GM, the module automatically refreshes its managed compendium packs when the packaged source version changes.

Manual import is still available from the browser console:

```js
await ffd20ExpandedBestiary.importActors()
```

The importer clears and rebuilds the module compendium:

```text
FF D20 Expanded Bestiary
```

## Applying Damage

In an FF D20 world, a normal click on the full **Apply Damage** button on an attack card uses each recipient's default damage reduction and energy resistance before changing HP. For example, 2 slashing damage against DR 5/bludgeoning causes no HP loss; 2 bludgeoning damage bypasses that DR.

Shift-click still opens FF D20's adjustment dialog. The half-damage button, healing, and MP damage are unchanged. A GM can turn off **Apply defenses on quick damage** in the module's world settings to restore the system's normal quick-click behavior.

Quick damage also respects packaged 50% resistances and splits a bomb's single Self-Destruct roll between its element and bludgeoning. Bombino and Cherry Bomb default to Fire; a GM can use **Create Bomb Form** on either sheet to create another form in the world without changing the compendium.

## Current Test Scope

Version 0.1.39 contains 99 distinct catalog entries, one separately playable companion, and seven additional elemental forms of Small Flan (107 actors). Updates refresh the managed compendium packs, not previously imported world actors or placed tokens. The [batch notes](docs/batch-0.1.39.md) explain the few source ambiguities and effects that need GM adjudication.

The Centaur Forager's bonded companion is **Forager's Wolf**, in the Animals pack. Use the Forager's **Club (Shillelagh)** only after casting the spell. On the Archer's actual longbow, select **Aim** only for its chosen opponent and **Point-Blank Shot** only within 30 feet. The Striker's **Mounted Lancer** is a mounted-charge option, not extra damage on every hit.

Familiar master buffs start inactive. Transfer the buff to the master and enable it there; conditional benefits appear as roll notes. Ability damage from poisons and diseases rolls in the effect notes for entry on the target's ability score, not its HP. For Marrow Drain, heal the skeleton by the actual MP lost by the target.

Round-based recharge abilities spend one charge. In a running encounter with an active GM, the module restores it at the due turn using the roll printed on the card. Outside that encounter, restore it after the printed number of rounds.

Each actor has a matching curation record under `source/curation/` with the source URL, parsed statblock, generated Foundry items, compendium lookup expectations, and unresolved review notes.
