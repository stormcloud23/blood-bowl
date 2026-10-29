# Move action — v0.0.3

## Sources reviewed October 28, 2026

- https://bloodbowlbase.ru/bb2025/core_rules/the_game_of_blood_bowl/#move-actions — Move, standing, dodging, jumping, pickup, rushing. Same page: armour/injury tables, catching, throw-ins, touchdowns.
- https://bloodbowlbase.ru/bb2025/core_rules/rules_and_regulations/ — natural rolls, re-rolls, marking, distraction, stunned recovery, falls and turnovers.
- https://bloodbowlbase.ru/bb2025/core_rules/skills_and_traits/ — Dodge, Stunty, Pro, Bone Head, Really Stupid, Loner, Catch, Thick Skull, Regeneration.

## Implemented

Declare Move explicitly; one activation per player per team turn, no switching activations mid-action. Inspecting another player does not change the active mover. End Move permits zero movement. Highlight adjacent vacant squares and valid jumps, then preview required dice before confirming one step.

Movement spends profile MA; up to two extra movement points require individual 2+ rush rolls. Rushes precede dodge/jump/pickup checks. Leaving an opponent's tackle zone requires an AG test, penalized for destination markers (without the old edition's +1 bonus). Standing, non-distracted opponents mark; Stunty ignores marking penalties on dodges.

Standing spends three movement points. MA 2 or lower uses a 4+ stand-up test. Jumps over adjacent prone/stunned players cost two movement points and use the higher marking count at either endpoint. Failed jump natural 1 and failed jump rushes leave the player at the origin; other jump failures leave them at the destination.

Pickup occurs after movement checks. Failure bounces the ball and causes a turnover even if a teammate catches it. Ball bounce, catch and throw-in resolution is supported. Catch skill and team/Pro re-roll eligibility are evaluated for the catching player. A standing ball carrier reaching the opposing end zone ends the practice drive.

Failed movement rolls offer eligible Dodge, Pro or team re-roll choices, or acceptance. Dice cannot be re-rolled twice. Team re-rolls can be used multiple times in one turn; each team starts practice with two. Loner can waste a team re-roll. Pro failure prevents trying another source on that die. Pro is not incorrectly limited to once per turn under this ruleset.

Bone Head and Really Stupid tests occur on declaration; failure causes distraction and ends the activation without an automatic turnover. Really Stupid checks for eligible standing adjacent helpers. Falls resolve armour and injury, with Stunty and Thick Skull tables and Regeneration, before completing turnover. Stunned players miss their next activation opportunity and recover to prone at the end of the appropriate team turn.

## Deliberate practice boundaries

- Perfect Conditions only; no weather roll or weather modifiers.
- No full match clock, halves, kickoff, drive restart, KO recovery, or re-roll replenishment. Touchdown stops the drill.
- No blocks, blitzes, passes, handoffs, Secure the Ball action, or AI.
- No apothecaries or permanent casualty/league outcomes. Casualties leave the pitch; regeneration can place a Troll in reserves.
- Beneficial Thick Skull and Regeneration effects are applied automatically. Dice re-roll choices remain explicit.
- Only starting skills relevant to movement and its consequences for the two supported rosters are implemented. Other skill effects remain future work.
- Practice scenarios are artificial fixtures, not legal kickoff formations. They reset the session, and reloads do not save play.

## Development

movement.cjs is the UI-independent engine; movement.test.cjs exercises it with injected dice. index.html contains a generated copy so root-of-main Pages hosting requires no runtime build.

After editing movement.cjs, run `node build.cjs`, then `node --test movement.test.cjs`. The tests verify that the embedded engine matches the source. Publish index.html with the supporting source and tests. Initial validation: 33 passing tests, including roll ordering, failure placement, re-roll limits, activation restrictions and ball resolution.
