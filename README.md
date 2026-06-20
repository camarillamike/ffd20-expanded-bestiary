# FF D20 Expanded Bestiary

Generated Foundry VTT module for FF D20 bestiary actors.

## Foundry Install

Install through the Foundry administrator package installer with this manifest URL:

```text
https://raw.githubusercontent.com/camarillamike/ffd20-expanded-bestiary/main/module.json
```

The installer uses the release zip referenced by `module.json`.

## Importing Actors

After enabling the module in an FF D20 world, run this in the browser console as a GM:

```js
await ffd20ExpandedBestiary.importActors()
```

The importer clears and rebuilds the module compendium:

```text
FF D20 Expanded Bestiary
```

## Current Test Scope

This first package contains the initial 10-entry validation batch generated from finalfantasyd20.com.
