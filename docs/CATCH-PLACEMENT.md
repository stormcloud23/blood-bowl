# Diving Catch and Safe Pair of Hands

Based on merged main `c2138fc` (PR #4). Both skills now use guarded local
decisions in the static browser engine. Catalogue totals: **85 implemented,
3 partial, 20 deferred**. No server, network rule lookup or new runtime package
is needed; the generated `index.html` remains the GitHub Pages application.

## Catch deliveries and coach selection

Pass resolution retains its original target, accuracy and occupied-target mode.
`landBall` accepts explicit delivery context; `chooseLandingCatcher` selects a
receiver, and `landingTarget` calculates the base catch target. Existing weather,
marking, Extra Arms, Nerves of Steel, Disturbing Presence, Catch and eligible
team re-rolls then apply through the shared test path. Context is passed to the
individual catch rather than kept as a global bonus that could affect a bounce.

For a pass, kickoff or crowd throw-in, eligible adjacent Diving Catch players
can catch without moving. The active coach chooses first; the other coach is
asked only if the first declines. The player under the ball is also offered to
their coach when adjacent catchers exist. If both coaches decline, that original
player still makes the mandatory catch if eligible. Several friendly catchers
do not cancel one another. A failed chosen catch bounces from that player's
square, and the bounce does not open another Diving Catch selection.

Accurate occupied-target delivery has no scatter penalty and enables Diving
Catch's bonus. Empty/inaccurate pass deliveries and throw-ins use the scatter
catch penalty; kickoff has no scatter penalty. Bounce, Hand-off and placement
do not invoke adjacent Diving Catch. Pass previews include the direct
receiver's bonus, labelled as applying to an accurate delivery.

Kickoff selection completes before the receiving turn begins. If Diving Catch
takes the ball outside the receiving half, the normal touchback decision runs.
A non-fumbled pass recovered by the passing team avoids turnover, including a
pass aimed at an empty square recovered by Diving Catch or a later bounce.
This corrects the earlier browser's unconditional empty-square pass turnover.
Fumbles and failed pickups retain their independent turnover rules.

## Shared prone-placement boundary

`beforeProne` offers the possessing player's coach an empty, on-pitch square
adjacent to the eventual prone square, or the normal bounce. Placement leaves
the ball on the ground and opens no catch or bounce. The choice suspends the
action and rejects invalid or stale callbacks. Injury/removal after the choice
does not relocate the placed ball.

Actual falls run this boundary after failed/declined Steady Footing, before
armour. Saved falls preserve possession and never ask for ball placement.
Wrestle prepares the choice before both players become prone; successful
placement prevents its active carrier-drop turnover, while independently
recorded turnovers remain. Breathe Fire's prone result and broken-armour
Stab/Vomit-style injuries also use the shared boundary. Armour that holds does
not trigger placement. Thrown-player falls use the final landing square and
retain their original turnover consequences.

`placeProne` and `releaseProneBall` centralize forced-prone ball handling.
Disabled/distracted players, non-carriers, and players with no empty adjacent
square cannot place. Crowd removal, send-off, being eaten and Strip Ball are
different causes of ball loss and do not invoke this skill.

## Explicit pinned-FFB differences and limits

The project's existing decision is to use executable BB2025 FFB behavior when
it conflicts with literal text or older browser behavior. Three details need
to remain visible:

- The selected BB2025 catch step offers adjacent catchers even when the landing
  square is occupied. Its active/passive coach selection supersedes the older
  JavaDoc's empty-square restriction and multiple-catcher cancellation.
- The literal Diving Catch bonus mentions the pass target square. The pinned
  engine instead retains `CATCH_ACCURATE_PASS` mode when an adjacent catcher
  replaces a valid original target receiver. A selected Diving Catch player
  receives that mode's bonus. An accurate pass aimed at an empty square uses
  `CATCH_ACCURATE_PASS_EMPTY_SQUARE`, which converts to scatter catch mode after
  selection and grants no bonus. Browser tests preserve this distinction.
- Despite the literal Safe Pair of Hands wording covering prone placement,
  FFB's `StepDropDivingTackler` uses the `dropPlayer` overload that does not
  mark the player eligible for placement. The browser passes
  `allowPlacement:false` for that path; the tackle carrier's ball bounces.

The implementation covers existing exhibition actions. Bombs, nested passing
reactions, ball-specific star powers and future special actions still require
their own integration. General casualty, team, kickoff and match-rule parity
remains incomplete. This is an in-memory callback engine, not save/resume.

## Sources and verification

Rules as written: [Diving Catch](https://bloodbowlbase.ru/bb2025/core_rules/skills_and_traits/#diving-catch-active)
and [Safe Pair of Hands](https://bloodbowlbase.ru/bb2025/core_rules/skills_and_traits/#safe-pair-of-hands-active).
Pinned [FFB Java reference](https://github.com/christerk/ffb/tree/bf3f89d96b5143a8730910a841e7430791094492):

- `ffb-server/.../step/bb2025/shared/StepCatchScatterThrowIn.java`:
  `askForDivingCatch`, `divingCatchers`, `catchBall`, failed catch and kickoff bounds.
- `step/bb2025/pass/StepResolvePass.java` and `StepEndPassing.java`:
  accurate/empty/missed modes and final-possession turnover decisions.
- `ffb-common/.../skill/common/DivingCatch.java` and
  `modifiers/bb2025/CatchModifierCollection.java`: accurate bonus and scatter penalty.
- `ffb-server/.../step/bb2025/shared/StepPlaceBall.java`:
  empty adjacent placement, coach ownership and optional turnover reversal.
- `skillbehaviour/bb2025/WrestleBehaviour.java`,
  `step/bb2025/block/StepBreatheFire.java`, `util/UtilServerInjury.java`,
  `step/bb2025/shared/StepHandleDropPlayerContext.java` and
  `step/mixed/move/StepDropDivingTackler.java`: placement eligibility by cause.

All **337 tests pass**, including 43 new deterministic cases in
`catch-placement.test.cjs` and four real bundled-UI scenarios. Cases cover
contested choices, occupied/empty targets, re-rolls, bounce origins, throw-ins,
kickoff touchbacks, fall prevention, Wrestle, injury/removal, throw landings,
placement eligibility, stale callbacks and turnover preservation.

Run `node generate-skill-docs.cjs`, `node build.cjs`, `node --test *.test.cjs`,
and `git diff --check`. Generated sources and docs are verified by CI.
No visual browser inspection or automated Java/JavaScript differential runner
is claimed. See [the remaining exhibition dependencies](EXHIBITION-PARITY.md).
