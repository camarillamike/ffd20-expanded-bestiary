# Group 5 handoff: v0.1.49

Ten independent source pages, twelve actors: King Behemoth and Malboro Menace each have two published forms. All ten cached pages were read through pageFields. Group-only hydrated draft: 2,063 checks, 80 group-specific checks, no open findings or unresolved lookups. Fourteen stock observations were documented only after separate evidence checks; their original observations remain in the JSON. No shared pack build or live Foundry testing was performed here.

## Source rulings

- Killing Machine: the Force Field paragraph explicitly gives capacity 100 and healing 20/round; the header gives 120/24. Use 100/20 and keep the conflict on the item. Do not apply this healing to the hull.
- Non-boss King Behemoth: normal AC 29 conflicts with its own modifiers. The actor uses 27 (10 + 18 natural + 1 Dexterity - 2 size); touch 9 and flat-footed 26 agree with the source. The boss has its own DCs, recharge rates, reactions, and spellbook. Boss Shockwave specifies no duration for Weighted.
- Malboro Menace: use Skills Perception +25, not the header's +18. The ranged form's fifth-level spell line is missing a closing parenthesis; it has Bioga, Drain, and Infectga, also confirmed by the melee form. Ranged vines have no impact damage: Feed deals its own damage. Only melee Feed heals; only the ranged form pulls.
- Green dragon: Crimson Rays grants Deprotect II **and Shell II** as printed, not Deshell II. Black dragon: Putrescence's Reflex save precedes its conditional Fortitude save. Silver dragon: Skills Perception +30 conflicts with the header's +26; use the Skills line.
- The mature dragons use their own listed recharge rates and DCs. Dragon Force has no printed daily limit on these pages. Alternate breath modes use the same item as the normal breath.

## Remaining manual mechanics

- Killing Machine's field has its own pool; damage interception, critical suppression, field recovery and the 24-hour shutdown use the shared field handler. Restore rocket ammunition one per six hours with scrap; reset the ten booster ignitions hourly.
- Apply recipient buffs and conditional defenses only to eligible targets. The draft does not automate alignment or prime-HD eligibility, successful-save immunity, all dispel or cleanse outcomes, forced movement, Strength damage, or actual-damage-based healing. Earthen Ward's buff has a capacity tracker; debit the DR it actually prevents.
- On boss counterattacks, spend Meteor MP once per casting, not once per area. Resolve inner/outer damage and Evasion separately. Direction, persistence and removal of Spirit Blades, and Northern Cross ice-object damage and escape, require adjudication.
- King Behemoth's Mighty Guard says "nearby" without a numeric radius. White dragon Ice Roar and brown dragon Magnitude 8 do not state a status duration. No fixed radius or expiry was invented for those effects.
