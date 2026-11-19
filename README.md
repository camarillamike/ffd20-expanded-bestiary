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

## Current Test Scope

This package contains the first 45 reviewed actors from finalfantasyd20.com. Updates refresh the managed compendium packs, not previously imported world actors or placed tokens.

Familiar master buffs start inactive. Transfer the buff to the master and enable it there; conditional benefits appear as roll notes. Ability damage from poisons and diseases rolls in the effect notes for entry on the target's ability score, not its HP. For Marrow Drain, heal the skeleton by the actual MP lost by the target.

Round-based recharge abilities spend one charge. In a running encounter with an active GM, the module restores it at the due turn using the roll printed on the card. Outside that encounter, restore it after the printed number of rounds.

Each actor has a matching curation record under `source/curation/` with the source URL, parsed statblock, generated Foundry items, compendium lookup expectations, and unresolved review notes.
