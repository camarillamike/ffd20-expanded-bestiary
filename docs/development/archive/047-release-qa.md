# v0.1.47 local checkpoint and live QA

This is an offline-validated Foundry 13 candidate. It does not require importing from a console. The source builds in five checkpoints of ten catalog pages; the last three start from the sealed 793-actor checkpoint. The first 50 pages of this release include variants, so the actor count is different from the number of catalog entries.

For release preparation, run `node tools/build-047.mjs --group=N` and `node tools/finish-047.mjs --group=N` for N = 3, 4, 5 in order from the builder. Finish with `node tools/test-047-final.mjs` and `node tools/test-046-shield.mjs --047 --package=dist/047-50/ffd20-expanded-bestiary`. Inspect the checkpoint and final pack reports. These commands are for the release maintainer, not the GM.

## Suggested smoke tests after updating

Use fresh imports into a QA folder and unlinked tokens on an inactive QA scene. Use Self Rolls and do not advance the live world clock.

- Cagnazzo: two fresh tokens. Before Gather Water, the drowning aura should be unavailable. Gather on only A, check ice absorption and fire immunity; B should not gain either. In Shellbound, Big Wave should stop; leave the shell and try again. Its normal 15-foot status radius is distinct from its 10-foot damage radius.
- Cie'th Ispusteke: start the barrier on a fresh token. It should have 60 capacity and DR 15/-. Apply 25 fire after its 10 resistance: remaining capacity 45; no HP lost. An unshielded sibling keeps its own resistances and HP.
- Gilgamesh (Form II): open Brotherhood from Inventory and roll it. The water rider should be separate from weapon damage. Perseus Bow has an ice rider; the Revolver in this encounter is a melee weapon. Select four weapons normally or eight during Octo-Break, not eight every full attack.
- Juvenile Crystal Dragon: the sheet should show Huge Dragon. Breath Weapon is a 50-foot 16d4 cone. Miasma instead deals 5d6 in a 30-foot cone; resolve the four separate saves only for a failed Reflex save.
- Tonberry King and Paleberry King: five daily Grudges each. The free retaliation is separate and does not spend that pool. Check the chance card for one d100: 01-30 for the shadow king; 01-10 for the holy king. Only test combat round advancement in a disposable world.

GM choices remain intentional: choose the Wraith's elemental weakness, assign damage to distinct recipients for Ruby Ray, and select appropriate attacks for multiweapon routines. Conditional effects are not automatically inflicted on every token inside a template. Encounter-specific spell adjustments are owned by these actors; they do not modify the PC spell compendiums.
