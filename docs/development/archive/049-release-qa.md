# v0.1.49 Foundry smoke test

Use fresh compendium copies in a QA Actors folder, unlinked QA tokens, and Self Rolls. Apply damage only to an explicitly identified QA recipient. Use a separate world for passing rounds or 24 hours. Do not advance a live world's clock or alter compendium actors.

1. **Setup:** 934 actors across 15 expanded packs, with NPCs empty. King Behemoth and Malboro Menace each have two published statblocks; Shiva is one actor with selectable forms.
2. **Judge Master:** in the starting equipment, verify AC 31, touch 15, flat-footed 26. Normal Apply of a 12-point ordinary slashing hit should cost 3 HP in armor, 12 with only the shield equipped, and 3 after re-equipping armor. Reset HP between trials.
3. **Deathmask:** two unlinked copies start at 240 field HP each. An ordinary 35-point hit that is not otherwise mitigated should put A at 205 field HP with hull HP unchanged and leave B at 240. In an isolated world, one round recovers 24, giving A 229. For Killing Machine, start at 100, not 120; its detailed ability gives recovery 20, not the conflicting header's 24.
4. **Malboro Menace:** the ranged actor has four 100-ft. tendrils on a full attack; the melee actor has four 30-ft. vines with physical damage. The ranged tendrils grab rather than dealing the melee actor's bite or vine damage.
5. **Gold Dragon (Kefka's Tower):** choose each Gigavolt mode on separate fresh copies to avoid resetting charges. Charged bolt rolls 15d10; Shock wave rolls 10d10 with a 60-ft. radius. Both ask for Reflex. Do not add both damage rolls together.
6. **Whiskerwall Kupdi Koop:** confirm the shield is equipped, Shield Focus is under Feats, and starting AC is 31 / 19 / 25.

HP, charge and target changes must be read from the intended token sheet, not a sibling or a stale HUD. Boss phase timing, terrain placement and recipient choices are GM decisions; the offline pack checks did not exercise a live Foundry UI.
