# Diving Tackle, Steady Footing and departure ordering

Built on merged main `cc2653f` (PR #3), using the local FFB reference at
`bf3f89d96b5143a8730910a841e7430791094492`. These skills were selected next
because they extend the existing departure continuations, complete another
defender reaction, and add a reusable boundary for preventing knockdowns.
The browser still runs from its committed standalone HTML on GitHub Pages.

## Diving Tackle

The moving coach resolves modifiers and re-rolls before the defender chooses
one tackler or declines. A successful die that could fail after Diving Tackle
opens that same moving-coach window first. Keeping that die preserves its
success if the defender declines. There is no new dodge/jump re-roll after the
defender's choice. Break Tackle choices account for the prospective penalty and
remain available to rescue a re-rolled die when applicable.

The defender can choose an ineffective tackle, including against a natural six.
One selected tackler is placed prone in the vacated square, without armour or a
Steady Footing check for that placement. Carried/ground balls bounce as needed.
Using Diving Tackle suppresses Shadowing for that departure; declining it does
not. Jump/Leap is supported; Pogo cancels Diving Tackle on jumps. Leap's modifier
is recalculated with the added penalty, including enabled Very Long Legs and
Prehensile Tail. Route previews show the possible tackle target explicitly.

## Steady Footing

Before an eligible standing, undistracted player falls, their coach may attempt
a separate 6+ test. Normal eligible team re-roll/Loner and acting-player Pro
rules apply. Failure or decline resumes the original fall once. Success avoids
armour, ball loss and the turnover from that fall; other causes of turnover
remain in force. Disabled skills, already prone players, Wrestle, and Diving
Tackle's prone placement do not open the window.

Movement failures retain their next step: a saved Rush proceeds to remaining
Rushes, Tentacles and the agility check; a saved agility failure proceeds to
arrival/pickup. A natural-one Jump restored to its starting square stays there
after being saved, while other Jump failures remain at the destination. Both
Down finishes both players' resolutions, tracking turnover only for actual
falls. Saved Blitz Rushes still reach their Block/special action; saved Block
knockdowns run cleanup and preserve Blitz continuation. Take Root clears only
when the fall actually happens.

Thrown-player landings and collision chains use the same boundary. A saved
landing handles a loose ball; a previously caused friendly-collision turnover
is retained even if the passenger subsequently stays standing. A saved special
action kick-back finishes that action. A prevented stalling knockdown resumes a
pending End Turn request exactly once.

## Tentacles correction and continuations

The previous implementation offered Tentacles before Rush. Movement now spends
its cost and moves provisionally, resolves Rushes and any fall prevention, then
offers Tentacles before Dodge/Jump. A hold restores the origin and ends the
activation without refunding movement or rolling the agility test. A failed
Rush never reaches Tentacles. Jump Rush failures occur at the destination,
matching FFB's Move-before-Go-For-It order; natural-one Jump-test failures still
restore the origin. Fumblerooski leaves the ball at departure on a failed Rush;
a held player restored to that square retains possession.

`beforeMovement`, `beforeDepartureTests`, `departureTest`, `movementOutcome`,
`preventFall` and `resolveFall` provide the relevant browser-local boundaries.
The interruption tokens and decision callbacks reject repeats. Browser buttons
also check decision identity, so a stale button cannot answer a subsequent
reaction with the same label. This remains an in-memory callback system, not a
serializable engine or save feature.

## Sources and verification

Rules as written: [Diving Tackle](https://bloodbowlbase.ru/bb2025/core_rules/skills_and_traits/#diving-tackle-active),
[Steady Footing](https://bloodbowlbase.ru/bb2025/core_rules/skills_and_traits/#steady-footing-active),
and [Tentacles](https://bloodbowlbase.ru/bb2025/core_rules/skills_and_traits/#tentacles-active).
Executable [FFB reference](https://github.com/christerk/ffb/tree/bf3f89d96b5143a8730910a841e7430791094492):

- `ffb-server/.../step/bb2025/move/StepMoveDodge.java` and `StepJump.java`:
  prospective Diving Tackle, retained dice and modifier-before-defender order.
- `skillbehaviour/bb2025/DivingTackleBehaviour.java`,
  `step/mixed/move/StepDropDivingTackler.java` and
  `ffb-common/.../util/UtilPlayer.java`: selection and prone placement.
- `step/bb2025/shared/StepSteadyFooting.java` and
  `model/SteadyFootingContext.java`: optional avoidance and deferred consequences.
- `step/generator/bb2025/Move.java`, `BlitzMove.java`, `BlitzBlock.java` and
  `ThrowTeamMate.java`: sequence continuations and retained independent turnovers.
- `ffb-common/.../skill/bb2025/Leap.java`, `Pogo.java`, `VeryLongLegs.java` and
  `factory/bb2025/JumpModifierFactory.java`: jump modifier interactions.

All **290 tests pass**. `dodge-footing.test.cjs` adds 44 deterministic scenarios; four additional
`throw-ui.test.cjs` scenarios execute the real inline UI. Earlier Tentacles and
Jump Rush tests are corrected to the source-derived ordering. Build with
`node generate-skill-docs.cjs`, `node build.cjs`; run `node --test *.test.cjs` and
`git diff --check`. No visual inspection or Java differential runner is claimed.

Coverage is now **83 implemented, 3 partial, 22 deferred**. Full exhibition
parity is still incomplete; see [the remaining exhibition dependencies](EXHIBITION-PARITY.md).
Safe Pair of Hands and Diving Catch are now implemented in the
[ball landing/placement increment](CATCH-PLACEMENT.md), adding shared boundaries
before the more complex pre-attack reactions.
Future special actions must supply their own prevented-fall continuations and
must preserve independent injury/turnover consequences.
