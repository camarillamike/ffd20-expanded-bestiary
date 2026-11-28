# v0.1.51: fresh-copy smoke test

Use Foundry v13 with FFd20. The module should supply 1,052 actors across 15 indexed packs, representing 944 tracked entries. No bulk import, console script or pre-existing world actor is required. Use fresh copies in a QA folder, Self Rolls and an inactive QA scene. Use a disposable world for tests that advance time. Do not apply to live tokens.

| Fresh copy | Procedure and expected evidence |
| --- | --- |
| Knights of the Round | Find King Thordan and twelve individually named knights. Place Charibert and Guerrique; their portraits and tokens should differ. Charibert's Heavensflame initial mode rolls 8d8 Fire at 240-foot range in a 30-foot radius (Reflex DC 37 half). Its existing-hazard mode rolls 6d6, without spending a new charge. Guerrique's +2 Greataxe includes 1d6 Wind normally and 2d10 additional Wind on a confirmed x3 critical. |
| Charibert's Elemental Shield | Toggle the recipient buff on one fresh target, not a sibling. From 25 pure Fire the buff should stop 20, while the sibling's own defenses are unchanged. Holy damage should not gain resistance from this buff. Remove the buff afterward. |
| Statue of the Gods, third tier | Use Lady and Rest as separate actors; lower both below maximum HP on QA copies. Apply a known single-element packet of 12 Fire to Lady: HP increases by 12 (up to maximum), on normal and Shift-Apply. Rest's resistance is not absorption. Test with ordinary elemental damage, not a power weapon or orb. |
| Statue of the Gods, second tier | On a disposable Machine token, set the normal field to 20 remaining and apply 35 ordinary final damage. The field should drop to zero and 15 should reach the hull. An unlinked sibling must keep its own capacity. Do not advance the live clock to test recharge. |
| Ser Vellguine | On Spear of Fury full attack, expect seven attacks at the same -5 penalty. The Jetstream longspear has a Water weapon rider, and Spear of Fury adds its own Water rider. Spiral Thrust's next-round pattern is a separate mode. |
| Tanket | Use a plain physical hit that does not bypass DR, then one with enough damage to get through DR 10/-. The physical resistance halves the remaining physical damage; it must not halve an unrelated elemental packet. |
| Bahamut Zero | In a disposable encounter compare per-phase actions and barrier changes. For a known shifted weakness, normal Apply and Shift-Apply should agree; phase IV removes the weakness. An unlinked sibling should not change phase or affinities. |

For phases, reserve targeting decisions, map placement, forced movement, and missing values explicitly identified in the printed rules for the GM. The review notes in `development/batch-reviews/051/` document per-encounter exceptions and additional live checks. Local validation does not replace a live Foundry update and token-sheet check.
