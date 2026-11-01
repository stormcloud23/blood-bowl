# Match-system audit — updated for v0.0.25

**Inducements are not complete.** This audit compares the browser with FFB
commit `bf3f89d96b5143a8730910a841e7430791094492`; older completion counts
describe skills/traits, not every match system or inducement.

## Inducements

Implemented selections include Bribes, Kegs, Extra Training, Wandering
Apothecaries, temporary coaches/cheerleaders, Master Chef, Mascot, Weather Mage,
Biased Referee, Mortuary Assistant and Plague Doctor. Their existing focused
tests cover ownership, costs, roster gates, consumption, rerolls and recovery.
The team's permanent staff are separate from purchased inducements.

Supported **Riotous Rookies**: one 100K group, available with Low Cost
Linemen, rolling 2D3+1 reserve Linemen with Loner (4+) after purchases and before
coin choice. They are temporary Journeymen, may exceed sixteen during the
match, can receive normal participant SPP and use existing postgame hiring
at base cost without Loner. Application is once per match and does not mutate
the saved permanent roster. Source: common `step/phase/inducement/StepRiotousRookies`,
`DiceRoller.rollRiotousRookies`, BB2025 InducementCollection and option defaults.

Wizards (Fireball/Zap) and mercenary construction are now supported; see
[WIZARDS-MERCENARIES.md](WIZARDS-MERCENARIES.md) for source references,
verification and remaining interaction audit limits.

Automatic underdog prayers and all sixteen pinned effects are now supported;
see [PRAYERS.md](PRAYERS.md) for allocation, effect boundaries and audit limits.
Purchased prayers remain unavailable under the pinned maximum of zero.

Josef Bugman named staff is supported; see [BUGMAN.md](BUGMAN.md) for the
KO bonus, kickoff redeployment, source paths and validation.

The first seventeen [named stars and unique abilities](STARS.md) are supported.
Still missing: the remaining star catalogue, other paired stars, other unique
abilities and special inducement players. These are intentionally not
offered as inert purchases. Prayers' pinned purchased maximum is zero, but
the underdog-prayer option is enabled and now implemented. General non-star
inducements still need work.

Pinned FFB prices/caps are retained, including historical differences from
printed tables (Weather Mage 30K, temporary cheerleaders 20K/max four, temporary
coaches max three, Extra Training max four). Temporary staff totals currently
stay within FFB combined limits given the browser's permanent staff caps.

## Pregame and team rules

Checked FFB StartGame/Kickoff generators: fans, weather, Petty Cash/purchases,
post-purchase additions, coin/receive choice, normal setups, Swarming, Chef,
kick, deviation/return, kickoff result and landing/touchback. The browser has
those supported phases, automatic prayers and league funding safeguards.
Unsupported special inducement sequences remain gaps, not completed no-op steps.

Equal-CTV Treasury inducements remain unavailable under the pinned default;
FFB's optional allow-spending-on-equal-CTV setting is not exposed. Journeymen
and Low Cost CTV are assembled before league purchasing. Purchased costs are
settled through the existing atomic result path; unfinished fixtures restart
from pregame rather than resuming in progress.

Team Captain, Swarming, Low Cost Linemen, Masters of Undeath, Brutes, corruption,
alignment/roster-league choices and Chef discounts are covered in ROSTERS.md
and team-rules.test.cjs. This pass does not certify every ability combination.

## Kickoff review

| Roll | Current coverage / finding |
| --- | --- |
| 2 Get the Ref | Additional Bribe per team, not capped by purchase limit |
| 3 Time-out | Shared marker change, kicking marker six threshold |
| 4 Solid Defence | Snapshot Open eligibility and D3+3 limit; selected players can now be lifted and swapped/redeployed before formation validation |
| 5 High Kick | Optional Open-player placement; touchback/occupied-target skip; receiving-coach ownership and guarded callbacks |
| 6 Cheering Fans | Staff contest, ties, ownership-based Mascot natural-one retry, first-Block bonus |
| 7 Brilliant Coaching | Staff contest, ties, expiring Drive reroll |
| 8 Changing Weather | Shared weather; perfect-weather airborne scatter and boundary checks |
| 9 Quick Snap | Snapshot Open eligibility, bounded one-square moves and player limit |
| 10 Charge | Supported Move/Blitz/Throw Team-mate activations; not a blanket certification of every special action |
| 11 Dodgy Snack | Both victims committed before effects; drive removal now has a distinct unavailable marker |
| 12 Pitch Invasion | Shared D3 count, distinct standing victims, medical/chain-player handling before landing |

Solid Defence previously could only move into currently empty tiles. FFB lifts
selected players before re-placing them. **Lift selected for Solid Defence**
now supports swaps while preserving original eligibility, player limit and
normal formation/captain restrictions. Dugout cards can select lifted players;
ordinary bench reserves cannot replace kickoff participants.

Sources: BB2025 `StepApplyKickoffResult`, StartGame/Kickoff generators,
`StepEndTurn`, `StepBuyInducements`, InducementCollection and GameOptionFactory.
Existing passing/drive and referee documents record earlier detailed audits.

## Dugout presentation

Both teams have labeled Reserves, Knocked out, Injured, Dead, Sent off and
Unavailable sections beneath the pitch. A nearby Dugouts link reaches them.
Player cards show numbers/names, hover/focus details and click/touch information.
Eligible cards can select a reserve for normal setup, Swarming or lifted
Solid Defence placement; the engine still validates the destination. KO/dead/
injured/sent-off cards cannot activate players or consume dice.

On-pitch prone/stunned players remain on the pitch count. Heat exhaustion and
Dodgy Snack drive removals are unavailable rather than ordinary reserves.
Saved injured/retired players absent from a league fixture appear as informational
cards without being inserted into the live match roster. Eaten/final Dead
results are distinct from nonfatal casualties. Pregame hides the board until
setup; counts and lanes update on each render.

Tests cover classification and partition counts, information-only interactions,
legal reserve selection, missing-player ghosts, Solid Defence swaps/guards,
Rookie eligibility/count/once-only application and postgame hiring. Full UI,
rules, generated-output and whitespace verification remain separate from
exhaustive visual/random-event parity.
