# Support Droid Shield: v0.1.46

**Rule and scope.** The [Engineer class, Support Droid: Shield](https://finalfantasyd20.com/classes/base-classes/engineer/) grants the designated ally a barrier. The level-9 [Kobold Engineer's support droid](https://finalfantasyd20.com/gamemastering/bestiary/humanoids/kobold-family/kobold-engineer/) provides DR 4/-, +1 deflection AC and +1 morale on saves for up to nine rounds. The ally must own the active buff. The droid does not gain DR merely by having its Shield ability. Existing ally copies with the precise v0.1.45 authoring marker also work; neither a friendly-looking item name nor sharing the same base actor ID qualifies a different token.

**Native finding.** In local FFd20 12.11.11.0, `template.json` describes buff changes, flags, conditions and duration, but has no native buff field/change target for granting a non-stacking physical DR entry. The native damage path reads the recipient's `system.traits.dr`. Its `apply-damage.mjs#getResistances` prepares the per-target choice and `_processReductions` iterates and adds all active rows. Appending a DR row to prepared traits, even temporarily via an effect, would stack with the recipient's existing defenses; replacing the trait would lose them. Numeric AC and saving throws therefore remain ordinary unmodified native buff changes. Only DR needs runtime support.

**Implementation.** The compiler helper marks only owned buff `967af9316215cbf1` on Support Droid `d6246cf7d58977bd` with `flags.ffd20-expanded-bestiary.supportDroidShieldDR = 4`. Identity is checked against the reviewed actor and the unique authored buff. The dedicated runtime adds a checkable 4/- choice to the recipient's native calculation, not to their Actor document. It applies only the difference between the shield allowance and the physical DR already applied to this hit. Energy resistance, immunities and hardness remain on their own native paths. Multiple copies supply one allowance. A single dual-typed roll with no separable physical amount does not receive the shield; distinct physical and energy parts are processed separately. The default quick-damage setting uses the same calculator as the dialog. Turning off quick-damage defenses still opts out, as before.

**Integration (coordinator).**
1. Import `patchSupportShield046` from `tools/lib/support-shield-046.mjs` and call it on mutable actor documents during the v0.1.46 preservation/build pass before serializing the native constructs pack and exported source JSON. It returns `true` for the droid and `false` for other actors. No independent change to the .45 input is needed.
2. Copy `tools/runtime/support-shield-046.mjs` to `scripts/support-shield-046.mjs` and include that path in `module.json.esmodules`. Retain the existing `quick-damage.mjs` script; no new module dependency, world migration, settings or socket permissions.
3. Run `node --test tools/test-046-shield.mjs` for the in-memory patch of the .45 native input. After compiling, run `node tools/test-046-shield.mjs --package=PATH_TO_046_MODULE` to also require the exact native item marker, manifest entry and runtime bytes in the candidate.

**Test evidence.** Nine tests passed against the installed system source map and the rebuilt .46 pack. The same harness also covers the marked withdrawal and rooted defense buffs. The tests execute both native `ActorPF.applyDamage` methods, the full native `ApplyDamage` calculator, real quick-damage hook, and native dialog `wait`, target-option preparation and submit method. Foundry host services, the DOM/render step, roll storage and persistence are fixtures. These are not live browser tests.

| Scenario | Quick HP loss | Dialog HP loss |
| --- | ---: | ---: |
| 7 slashing, buff off / on / removed | 7 / 3 / 7 | 7 / 3 / 7 |
| Simultaneous unbuffed token, same base actor ID | 7 / 7 / 7 | 7 / 7 / 7 |
| Two active shields; 3 slashing + 4 piercing | 3 | 3 |
| Native DR 6/piercing + shield: 7 slashing / 7 piercing | 1 / 3 | 1 / 3 |
| Native DR 2/piercing + shield: 7 slashing | 3 | 3 |
| 7 fire / 7 slashing + 5 ice | 7 / 8 | 7 / 8 |
| 7 MP damage | 0 HP, 7 MP | 0 HP, 7 MP |

Dialog de-selection is honored; losing or gaining the shield while the dialog is open is reconciled at submission. Tests check no writes outside native health/resource fields, unchanged innate DR, a renamed legacy copy unchanged after damage, unchanged compiler input, idempotent compilation, and retained AC/save changes and nine-round duration. No .45 or published files were modified.
