# FF D20 Expanded Bestiary v0.1.45

537 prebuilt NPC actors across 15 native Foundry packs. This build adds 200 individually reviewed source entries; separate forms and companions explain the higher actor count. Another 45 Bomb form files are available from Create Bomb Form and are not additional pack entries.

Use Foundry Setup's normal module update, then enable the module in your FFd20 world. The packs do not require a console command, a GM import, or on-load item assembly. World imports and existing tokens are not replaced. Use a fresh QA copy to test a changed creature.

## Review evidence

- [Individual source and native actor hashes](docs/native-review-045-200.json)
- [First 100 checkpoint](docs/native-review-045-100.json)
- [Artwork provenance](docs/art-045.md)
- [Round-based recharge](docs/round-recharge.md)

## Foundry v13 smoke test

Use fresh actors in a disposable QA folder with Self Rolls; leave the active scene and world clock unchanged. Confirm the version and actor count above without bulk importing.
1. Create a Mystical (Arcane) form from Bomb T3. The new actor should be CR 8, XP 4,800, with Ruin and Poison. Its blast rolls a single 8d6 split between non-elemental and bludgeoning. The original remains CR 7 with Fire and Fire II.
2. Check both Malboro Sapling sheets: they have separate melee/ranged routines. Bio should offer a Fortitude save rather than applying caster-based damage. Its Sapped tick uses the target and cannot reduce HP below 1.
3. Open the Kobold Engineer and both of its separately packaged constructs. Check that the quadruped's Slam and the support droid's repair/shield features belong to their respective actors, each with its own artwork.
Keep the Blood Bat combat-clock retest in a separate world. Offline pack validation is not a live Foundry playtest.
