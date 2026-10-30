# Exhibition parity — departure reactions

The departure reaction increment added Shadowing and Arm Bar in PR #3.
The [next movement increment](DODGE-FOOTING.md) adds Diving Tackle and Steady
Footing and corrects Rush-before-Tentacles ordering, based on merged main
`cc2653f`. [Ball landing and placement](CATCH-PLACEMENT.md) adds Diving Catch
and Safe Pair of Hands on merged main `c2138fc` (PR #4).
The [special-action and reaction-context batch](SPECIAL-ACTIONS.md), based on
merged main `7b48803` (PR #5), adds twelve skills/traits and completes Chainsaw
foul use. It is stacked above the separately reviewed route-preference PR #6.
The [casualty/treatment increment](CASUALTY-TREATMENT.md), based on merged
main `35117f8`, adds casualty results, team apothecaries, Decay and Plague Ridden.
The [Multiple Block increment](MULTIPLE-BLOCK.md), based on main `634a179`,
adds committed two-attack result groups and deferred medical choices.
Current catalogue totals: **101 implemented,
2 partial, 5 deferred**. These are feature inventory labels, not certification
of complete FFB parity. GitHub Pages continues to serve the committed standalone
HTML; no backend, runtime package, or external rules request is required.

## Movement continuation boundary

`MovementGame.movementOutcome` runs after movement tests and their re-rolls,
before pickup/scoring on success or armour/ball loss/turnover on failure.
It receives the original square and failure type. `SkillGame` snapshots eligible
departure markers, selects an Arm Bar owner when relevant, then resolves
Shadowing. Only after both guarded interruptions finish does the original
action resume. Arm Bar modifier decisions also reject stale callbacks.

- Shadowing: one selected defender rolls 4+, with failed attempts counting
  toward that player's MA limit per turn. It costs no movement or activation.
  It follows a failed dodge before armour, and a successful dodge before pickup,
  so the relocated defender affects the pickup's tackle zones. No Shadowing on
  Jump/Leap, unmarked movement, or from prone/distracted/rooted/disabled players.
  A planned dodge whose Rush fails follows FFB's fall-path Shadowing timing.
  Both teams' attempt counters reset on turn changes, including match turns.
- Arm Bar: one selected departure marker may add one to armour or injury after
  rolling, for a failed Dodge/Jump/Leap. Rush failure does not qualify. Spending
  the modifier on armour precludes spending it on injury. The owner's Claws and
  Mighty Blow do not apply. Casualties retain `casualtySource` for future event
  attribution; this does not calculate SPP or implement progression.
- FFB difference from the literal Iron Hard Skin wording: the pinned
  `InjuryTypeDropDodgeForSpp` and `InjuryTypeDropJump` suppress Arm Bar's injury
  modifier as well as its armour modifier. This follows the owner's FFB
  precedence. It does not change Mighty Blow or Dirty Player injury bonuses.

Rules reviewed: [Shadowing](https://bloodbowlbase.ru/bb2025/core_rules/skills_and_traits/#shadowing-active),
[Arm Bar](https://bloodbowlbase.ru/bb2025/core_rules/skills_and_traits/#arm-bar-active),
and [Iron Hard Skin](https://bloodbowlbase.ru/bb2025/core_rules/skills_and_traits/#iron-hard-skin-passive).
Executable reference: [FFB at bf3f89d](https://github.com/christerk/ffb/tree/bf3f89d96b5143a8730910a841e7430791094492),
especially `ffb-server/.../skillbehaviour/bb2025/ShadowingBehaviour.java`,
`step/bb2025/move/StepMoveDodge.java`, `step/generator/bb2025/Move.java`,
`step/generator/bb2025/BlitzMove.java`, and
`injury/injuryType/InjuryTypeDropDodgeForSpp.java` / `InjuryTypeDropJump.java`.
Use executable BB2025 behavior, not the outdated Shadowing JavaDoc.

## Remaining exhibition skill dependencies

All 5 deferred catalogue entries remain accounted for below. **3 have match
effects that still block skill-complete exhibition play.** The other two chiefly
depend on the deferred roster/progression systems.

| Group | Remaining entries | Required shared work |
| --- | --- | --- |
| Special movement/actions | Ball & Chain, Bloodlust (X+), Bombardier | Random movement and friendly Blocks, feeding before scoring/passing, a separate bomb object with recursive caught-bomb throws and group damage. |
| Later roster/progression features | Insignificant, Violent Innovator | Draft-list counting and SPP from special-action casualties; retain match attribution where useful, postpone roster editing and advancement. |

Partial entries: Leader and Secret Weapon still
need applicable inducement/team-rule interactions. Existing implemented entries
also need interaction audits as new actions arrive. Diving Tackle now suppresses
Shadowing when used, preserves re-roll history, and keeps modifier selection
before the defender's decision. New knockdown actions must route through the
Steady Footing boundary and supply a continuation for a prevented fall. Eligible
prone placements use `beforeProne`; deliveries carry an explicit landing mode.
Pinned FFB exceptions, including Diving Tackle's exclusion from Safe Pair of
Hands, are recorded in the ball-handling audit.

The current reaction/action batch includes parent-state restoration and bounded
movement and per-Block knockdown outcomes for Saboteur, but it does not supply
a serializable action stack. Multiple Block now adds a bounded two-attack
context, grouped treatment and deferred cleanup. The remaining foundations are
random movement, feeding gates and recursive bomb resolution. Catalogue skill
completion alone will not finish the wider exhibition milestone.

Other exhibition blockers remain: medical inducement/team/star exceptions, other staff and
applicable inducements, star abilities and team rules, full kickoff/drive audit,
interception ruler geometry, and competition-specific end-of-match options.
The Rush-before-Tentacles discrepancy identified during PR #3 is now corrected,
including failed Rushes, Steady Footing recovery, two-Rush leaps, and held ball
carriers. See [the movement follow-on](DODGE-FOOTING.md) and
[the earlier reaction increment](REACTIONS.md) for historical context.

## Validation

`node generate-skill-docs.cjs`, `node build.cjs`, `node --test *.test.cjs`,
and `git diff --check`. New deterministic scenarios cover defender choices,
attempt caps, both movement outcomes, pickup marking, Jump versus Rush, bonus
exclusivity, Iron Hard Skin, attribution, stacked reactions and stale callbacks.
The actual bundled UI tests exercise both new skills and the modifier buttons.
No Java/JavaScript differential runner or visual browser inspection is claimed.
