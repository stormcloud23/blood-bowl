# FFB parity gaps — v0.0.27, November 1, 2026

Full parity is **not complete**. This is a source/inventory audit after the
Deeproot, Skrull and Bilerot increment, not an integration comparison of every
FFB sequence. Executable authority remains FFB
`bf3f89d96b5143a8730910a841e7430791094492`. The local reference checkout's
browser-prototype changes do not replace that baseline.

## Named-star inventory

`MATCH_STARS` now contains **21 hiring entries / 22 named players**. All offered
entries have implemented abilities. The three new entries have deterministic
effect tests, bundled UI tests and two-half lifecycle coverage. Those lifecycle
matches verify transitions, not every ability interaction.

The [BB2025 published index](https://bloodbowlbase.ru/bb2025/starplayers/),
checked November 1, lists 63 hiring entries (66 individuals when its three pairs
are counted separately). Comparing its names with the offered catalogue leaves
**42 entries / 44 individuals** unsupported:

Barik Farblast; Boa Kon'ssstriktr; Captain Karina von Riesz; Cindy Piewhistle;
Count Luthor von Drakenborg; Dribl and Drull; Estelle la Veneaux;
Gloriel Summerbloom; Glotl Stop; Grak and Crumbleberry; Grashnak Blackhoof;
Gretchen Wächter; Grim Ironjaw; Grombrindal; Guffle Pusmaw; Hakflem Skuttlespike;
Helmut Wulf; Ivan 'the Animal' Deathshroud; Ivar Eriksson; Jeremiah Kool;
Jordell Freshbreeze; Josef Bugman (star); Kreek Rustgouger; Maple Highgrove;
Nobbla Blackwart; Rashnak Backstabber; Rodney Roachbait; Rowana Forestfoot;
Roxanna Darknail; Rumbelow Sheepskin; Scrappa Sorehead; Scyla Anfingrimm;
Skitter Stab-stab; Skrorg Snowpelt; Swiftvine Glimmershard; The Black Gobbo;
The Mighty Zug; Thorsson Stoutmead; Varag Ghoul-Chewer; Wilhelm Chaney;
Withergrasp Doubledrool; Zzharg Madeye.

This count is bounded to that index, not a claim that it enumerates every FFB
roster, supplemental publication or future star. Profile availability is not
proof that pinned FFB implements an ability. Audit each executable definition
and profile before offering it. Josef Bugman **staff** is already supported.

## Implementation priorities

| Priority | Gap | Concrete next work and acceptance checks |
| --- | --- | --- |
| 1 | Injury alternatives: Bugman, Varag, Grim, Zug | Capture speculative ordinary/alternate injury contexts; select and commit exactly one before casualty SPP, treatment, ball release and turnover. Cover both coaches, Multiple Block, grouped injury, Iron Hard Skin, Steady Footing and regeneration. See [STAR-BACKLOG](STAR-BACKLOG.md). |
| 2 | Remaining paired stars | Dribl/Drull require partner-conditioned Stab/Foul damage; Grak/Crumbleberry require carried-player state, temporary skills, forced placement/drop and no-empty-square behavior. Reuse atomic pair hiring without assuming it supplies the effects. |
| 3 | Other damage modifiers and re-rolls | Inspect Old Pro, Dwarven Scourge, Master Assassin, Toxin Connoisseur and related selected definitions. Preserve die-pool locks, modifier order, usage period and treatment timing. Do not turn speculative damage into immediate casualties. |
| 4 | Temporary enhancements and remote/compound actions | Implement the remaining selected special definitions with coach/target previews, normal action limits, precise expiry and one-shot continuations. Source groups include `skill/bb2025/special`, selected `skill/mixed/special` and corresponding server steps/behaviours. Each missing profile above still needs its own ability audit. |
| 5 | Combination verification | Expand shared-skill, kickoff, grouped medical, prayer/Wizard/star and second-half scenarios. Existing 108-skill labels are inventory labels. There is no full Java/JavaScript match differential runner; the geometry oracle covers isolated methods only. |

For priority 1 compare server `ModificationAwareInjuryTypeServer`,
`InjuryContextModification`, `AvOrInjModification`, `CrushingBlowModification`,
BB2025 `RerollArmourModification`, `DwarfenGritModification`,
`KrumpAndSmashModification`, `SlayerModification`,
`StepHandleDropPlayerContext` and `InjuryResult.swapToAlternateContext`.
Bugman also needs star/staff mutual exclusion in both purchasing directions.

## Match and product systems

| Area | Audit result / remaining gap |
| --- | --- |
| Pinned basic inducements | Browser selections now cover the non-star, non-mercenary purchase types in common + BB2025 `InducementCollection`, including Bugman staff. `infamousStaff` is a generic container, not evidence of another missing priced named staff member. Dummy Rock/beer/Wisdom entries are granted effects. Older statements that an unspecified basic purchase type is missing are too broad. |
| Inducement options | Purchased prayers stay disabled by pinned max zero. Equal-CTV Treasury spending and alternate option values are not exposed. Supplemental special inducements outside this selected collection need a separately scoped inventory before claiming parity with them. |
| Match completion | Regulation two-half play exists. Concessions, competition extra time/penalties and a broader competition-options UI remain unsupported. Sources to compare include the selected end-game generators, option factory and concession handlers. |
| Persistence | Team/league local storage and import/export exist. A live match uses callbacks and is not serializable; reloading an unfinished league fixture restarts pregame. Save/resume needs serializable decisions and continuations, not just a player snapshot. |
| Computer opponent | No AI opponent. Current match play remains hotseat/manual. This is separate from FFB rules equivalence. |
| League completeness | Roster construction, progression and league fixtures exist; this audit does not certify every competition configuration, season/redraft rule or supplemental option. Older handoff sections saying no roster/league feature exists are historical. |
| Verification | Deterministic rules, full-bundle UI and transition suites exist. Visual desktop/mobile review and random multi-ability exploration are separate checks; no new visual inspection is claimed for this increment. |

The static browser application remains self-contained. None of these gaps
requires restarting the Java server prototype.
