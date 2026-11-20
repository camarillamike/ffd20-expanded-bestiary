# FF D20 Expanded Bestiary: prebuilt compendiums

**0.1.44:** Adds 100 source entries, three companions with separate stat blocks, and seven additional Large Flan forms. Bomb T2 has nine selectable, prebuilt forms with local art. Individual decisions and source links are in the five group reports under `docs/`; the [native review](docs/native-review-044.json) records offline results separately from live Foundry testing. See the [artwork record](docs/art-044.md).

Four feats were embedded at build time from PF Content for FFd20 11.4.0. Its notices are included. You do not need to install that module to use these actors.

**0.1.43:** Adds 100 individually reviewed bestiary entries, including eight Medium Flan forms from one source. Bomb T1's Create Bomb Form action supports nine elements. The [artwork record](docs/art-043.md) distinguishes page art, compendium art, and original illustrations.

**0.1.42:** Create Bomb Form uses matching portraits and prototype tokens for all nine elements of Bombino and Cherry Bomb. Fire keeps the original art. Existing world actors and placed tokens keep their art. Black Magery (Increased Damage) adds the published extra die to eligible spells. For custom creatures, see [Round recharge on an owned item](docs/round-recharge.md).

The Bestiary folder contains 15 Actor packs, ready when enabled. No GM import, console command, or server filesystem access is needed. The FFd20 system and FFd20 Content module are used for rules and referenced media. The source versions used for this build are recorded in source/upstream.json. Their original notices are included under notices/. The scene, players' actors, existing world copies, and original spell packs are not migrated.

[Compare all 18 form portraits at token size](docs/bomb-forms.png). [Artwork notes and prompts](docs/bomb-art.md).

## Before upgrading from 0.1.40

1. On the hosted installation, make a world backup and a module/data backup or host snapshot. World backups alone may not include module packs. Copy any personally edited bestiary pack entries to a world folder; treat the module packs as replaceable.
2. If a journal, roll table, macro, or hotbar entry points straight into an old bestiary pack, record its target name and old UUID before updating. 0.1.40 generated different IDs on different servers. The new IDs are stable going forward, but old direct links may need relinking once. No automatic search or rewrite of the world is performed.
3. Record the HP and scene of one existing QA token. Return to Setup before replacing the module. A host snapshot is the safest way to recover old generated pack IDs.

## Live checklist for Foundry v13

The [native review index](docs/native-review-043.json) records the checked source and packaged actor for each new entry. The files under `source/curation` are earlier diagnostics from before compendium items are resolved; use the native results and individual review notes for the finished actors.

- Open the world as GM. Confirm version 0.1.44 and 324 actors across the 15 FF D20 Expanded Bestiary packs. The optional Bomb forms are not counted as pack entries. No console command or bulk import is needed.
- Import a fresh Bomb T1 and create its Arcane form: CR 4, XP 1,200, distinct artwork and a mixed-type 4d6 Self-Destruct. The original should not change. Compare two Medium Flan forms: their artwork, elemental traits and assigned spells should differ.
- On a fresh Black Widow, toggle In Webs: Perception should move from +6 to +10 and Stealth from +9 to +13, then return to baseline when switched off.
- On a fresh Kobold Guard at STR 14, test the ordinary longspear (1d8+6) against Overhand Chop (1d8+8). At STR 16, Chop should be 1d8+10. Restore the test actor afterwards.
- Defer the Blood Bat cooldown retest to a separate world. Do not advance the production world's encounter or clock for this check.
- Open a humanoid family folder and drop a fresh actor into a disposable world folder. Confirm the original QA actors/tokens and their HP did not change. Test one previously recorded compendium link and repair it only if it no longer resolves.
- From Expanded Outsiders import a **fresh Hedgehog Pie**. Self-roll Fire: the GM card should offer **Reflex DC 12** against Burning, with typed fire damage. Do not test with an old world copy.
- From Animals, full-attack with a fresh **Coeurl Kitten**: two +4 claw rolls; a standard attack gives one. Check **Sprite** has six spells in its active Fey/Wisdom Primary book.
- Use **Create Bomb Form** on Bombino and choose Ice. The new world actor should know Blizzard, not Fire. The original should still know Fire. Check that both portraits and item icons render.
- Reload once; the counts and copied UUID of a new compendium entry should stay the same. On a future clean installation, repeat the pack counts and Fire test with no old import settings. A second world on the same host is not a separate clean install of the module.

If packs are empty, duplicated, or a fresh Fire card lacks the DC, stop and record the module, system, and content versions. Do not run the old import command. Use the backup if rollback is needed.
