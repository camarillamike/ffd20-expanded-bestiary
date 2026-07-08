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

This package contains the current 20-entry validation batch generated from finalfantasyd20.com.

Each actor has a matching curation record under `source/curation/` with the source URL, parsed statblock, generated Foundry items, compendium lookup expectations, and unresolved review notes.
