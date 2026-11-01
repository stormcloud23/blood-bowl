# Underdog prayers — v0.0.22

This increment follows executable BB2025 FFB at
`bf3f89d96b5143a8730910a841e7430791094492`. It adds all sixteen prayer effects
and automatic allocation; it is not certification of every possible FFB
interaction or completion of the remaining inducement catalogue.

## Allocation and sequence

After both coaches finish inducements, compare their current match values plus
the actual inducement fees purchased. Each full 50,000 gp of remaining difference
gives the lower-value team one prayer, capped at sixteen. Spending can eliminate
or reverse the underdog. Unspent Petty Cash is not added to value. For saved
teams, the existing CTV includes available players, Journeymen, permanent staff
and Low Cost Linemen adjustments. Exhibitions derive the corresponding value
from their selected lineup and configured staff.

The sixteen results are sampled uniformly without replacement. Random player
choices are separate from the prayer selection; selected-player effects use
reserve players available for this game, including mercenaries, excluding stars
and absent players. Required player/skill decisions suspend pregame with an
explicit coach owner. Prayers precede Riotous Rookies, so new Rookies cannot
retroactively receive their enhancements. An effect with no eligible player is
recorded as wasted rather than blocking the game. Learning mode deliberately
omits automatic prayers along with its existing simplified random pregame.

Purchased prayers remain unavailable under the pinned maximum of zero. This
does not disable automatic underdog prayers. A custom league-option editor is
not added. All sixteen pinned BB2025 effects last until game end, except that
Throw a Rock is removed from the active prayer display when its use is spent.

## Effects

| Prayer | Browser behavior |
| --- | --- |
| Treacherous Trapdoor | Both teams check 2+ when crossing squares (7,2) and (20,14), using displayed one-based coordinates. Failure removes the player with crowd-style injury and no armour; carrying the ball releases it from that square. Active-team removal turns over. Movement/failed movement, pushes/follow-up and thrown-player placement have continuation hooks. Block damage precedes queued trapdoor checks; the thrown-player trapdoor check precedes Landing. Fan Interaction can credit a pushed opponent's casualty. Tiles and movement previews identify the hazard. |
| Friends with the Ref | +1 on Argue the Call rolls above one, combining with Biased Referee. Applies to foul send-offs and end-of-drive Secret Weapons. A natural one retains the existing ban/retry handling. |
| Stiletto | One random eligible own reserve gains Stab. |
| Iron Man | Choose one eligible own reserve for +1 AV, capped at 11+. |
| Knuckle Dusters | Choose an eligible own reserve without Mighty Blow to gain it. |
| Bad Habits | D3 distinct random eligible opposing reserves without Loner gain Loner (2+); existing Loner is preserved. |
| Greasy Cleats | One random eligible opposing reserve loses 1 MA, with a floor of one. |
| Blessing of Nuffle | One random eligible own reserve gains Pro. |
| Moles under the Pitch | Opposing Rushes are one harder, combining with Blizzard. Forecasts show the same target as actual rolls. |
| Perfect Passing | Completion SPP increases from one to two, including the existing qualifying thrown-player completions. |
| Dazzling Catching | A caught pass grants one additional catch SPP to an affected team's receiver, including opposing-team receptions and rebound catches. Kickoff catches do not qualify. |
| Fan Interaction | Opposing crowd-push/trapdoor-push casualties receive normal casualty SPP attribution to the attacker. Pinned Brawlin' Brutes casualty values still apply. |
| Fouling Frenzy | Opposing foul casualties receive normal casualty SPP attribution, without requiring Violent Innovator. |
| Throw a Rock | One optional use selects a random standing opponent on the pitch; a 4+ hit knocks down with normal armour/injury. Uses the pinned between-turn inducement windows, ending coach first, then opposing coach, alongside Wizards. Damage dice precede Steady Footing; Safe Pair and medical decisions finish before play resumes. A miss spends the use; no eligible target preserves it. |
| Under Scrutiny | Opposing fouls are spotted when armour breaks, even without doubles and even with Sneaky Git. Unbroken fouls retain their normal spotting checks. |
| Intensive Training | A random eligible own reserve gets a coach-selected new Primary skill, respecting FFB assignment conflicts and prerequisites. |

The pinned Rock implementation differs from its descriptive text: the selected
`StepInitInducement` offers it at end-of-own/opponent-turn windows, and
`StepThrowARock` uses `InjuryTypeThrowARockStalling`, which rolls armour. Those
executable choices take precedence here. Animation-only random draws are not
reproduced; random selection distributions and rules dice are tested.

## Persistence and presentation

Player prayer skills and stat changes are match-local overlays. They survive
drive/half changes but never overwrite a permanent profile, change a hiring
price or create a permanent advancement. League postgame retains earned SPP,
casualties and catches while the next fixture rebuilds from permanent data.
The active-prayer disclosure lists both coaches' effects and affected shirt
numbers. Optional-skill controls work for granted abilities.

A related visual-review finding is fixed: High Kick now identifies the receiving
coach. Kick/High Kick/touchback decisions reuse guarded choices, so old buttons
cannot resolve them again.

## Source and verification scope

Primary source groups: BB2025 `start/StepBuyInducements`, `start/StepPrayers`,
`StepPrayer`, `inducement/bb2025/{Prayer,Prayers}`, the selected BB2025/mixed prayer
handlers/selectors, `factory/GameOptionFactory`, `mechanics/bb2025/SppMechanic`,
`pass/StepEndPassing`, `foul/StepBribes`, `SneakyGitBehaviour`,
`move/StepTrapDoor`, `inducements/{StepInitInducement,StepThrowARock}` and the
Move/Block/ScatterPlayer/ThrowARock sequence generators.

Deterministic tests cover all effects, allocation thresholds/reversal/caps,
choice ownership and stale callbacks, temporary versus permanent data, actual
pass/foul/crowd/movement/throw outcomes, SPP and postgame reload. Complete inline
UI tests cover pregame choices, trapdoor labels/previews and Rock-only windows.
These are source-derived scenarios, not an automated Java/JavaScript
differential runner. Complex combinations involving multiple simultaneous
injuries, every repositioning skill, unusual star abilities and every kickoff
outcome remain subject to further parity audits.
