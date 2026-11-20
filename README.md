# FF D20 Expanded Bestiary: prebuilt compendiums

The Bestiary folder contains 15 Actor packs, ready when enabled. No GM import, console command, or server filesystem access is needed. The FFd20 system and FFd20 Content module are used for rules and referenced media. The source versions used for this build are recorded in source/upstream.json. Their original notices are included under notices/. The scene, players' actors, existing world copies, and original spell packs are not migrated.

## Before upgrading from 0.1.40

1. On the hosted installation, make a world backup and a module/data backup or host snapshot. World backups alone may not include module packs. Copy any personally edited bestiary pack entries to a world folder; treat the module packs as replaceable.
2. If a journal, roll table, macro, or hotbar entry points straight into an old bestiary pack, record its target name and old UUID before updating. 0.1.40 generated different IDs on different servers. The new IDs are stable going forward, but old direct links may need relinking once. No automatic search or rewrite of the world is performed.
3. Record the HP and scene of one existing QA token. Return to Setup before replacing the module. A host snapshot is the safest way to recover old generated pack IDs.

## Live checklist for Foundry v13

- Open the world as GM. Confirm the module version and the FF D20 Expanded Bestiary folder. No "import complete" notification or console command should be required. Check Animals (24), Humanoids (21), Outsiders (19), and Undead (4). There are 107 actors in total; the NPCs pack is intentionally empty.
- Open a humanoid family folder and drop a fresh actor into a disposable world folder. Confirm the original QA actors/tokens and their HP did not change. Test one previously recorded compendium link and repair it only if it no longer resolves.
- From Expanded Outsiders import a **fresh Hedgehog Pie**. Self-roll Fire: the GM card should offer **Reflex DC 12** against Burning, with typed fire damage. Do not test with an old world copy.
- From Animals, full-attack with a fresh **Coeurl Kitten**: two +4 claw rolls; a standard attack gives one. Check **Sprite** has six spells in its active Fey/Wisdom Primary book.
- Use **Create Bomb Form** on Bombino and choose Ice. The new world actor should know Blizzard, not Fire. The original should still know Fire. Check that both portraits and item icons render.
- Reload once; the counts and copied UUID of a new compendium entry should stay the same. On a future clean installation, repeat the pack counts and Fire test with no old import settings. A second world on the same host is not a separate clean install of the module.

If packs are empty, duplicated, or a fresh Fire card lacks the DC, stop and record the module, system, and content versions. Do not run the old import command. Use the backup if rollback is needed.
