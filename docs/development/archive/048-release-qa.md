# v0.1.48 Foundry smoke test

Confirm the module shows 0.1.48 and the 15 managed packs have 882 actors in total. The NPC pack remains empty. Use fresh imports in a new QA actor folder, Self Rolls and unlinked tokens on an inactive QA scene. Do not bulk import, change the active scene or advance the production clock.

| Actor | Check | Expected |
| --- | --- | --- |
| Whiskerwall Kupdi Koop | Open Inventory and Combat on the fresh actor. | An equipped shield, Shield Focus, AC 31, touch 19 and flat-footed 25. The shield is equipment, not a feat. |
| Io | Place two unlinked tokens. Use Rockets from A and inspect A and B separately. | A spends one of five rockets; B retains five. A rolls a 1d2 firing interval. Expiring the interval does not manufacture a missile. |
| Io | Apply 20 points of ordinary, non-bypassing physical damage to A with its field initially full. Check the target on the damage dialog and reopen A's token sheet. | The field absorbs the applied damage before HP; B's field stays at 90. In a disposable encounter only, an active Io field regenerates 18 per round up to 90. |
| Good King Moggle Mog XII | Use the one- and seven-moogle Memento Moogle modes separately, without applying damage. | The cards roll 3d6 and 21d6 Non-Elemental respectively, with Fortitude DC 26 for half. The seven named companions have independent portraits and tokens. |

Leave combat-time or recharge-expiry checks blocked if there is no disposable world. Record which actor or token was selected, the chat formula, and before/after values for each completed check.
