# Move, Block & Secure the Ball actions — v0.0.8

## Sources reviewed October 28, 2026

- https://bloodbowlbase.ru/bb2025/core_rules/the_game_of_blood_bowl/#move-actions — Move, standing, dodging, jumping, pickup, rushing. Same page: armour/injury tables, catching, throw-ins, touchdowns.
- https://bloodbowlbase.ru/bb2025/core_rules/rules_and_regulations/ — natural rolls, re-rolls, marking, distraction, stunned recovery, falls and turnovers.
- https://bloodbowlbase.ru/bb2025/core_rules/skills_and_traits/ — Dodge, Stunty, Pro, Bone Head, Really Stupid, Loner, Catch, Thick Skull, Regeneration.
- https://bloodbowlbase.ru/bb2025/core_rules/the_game_of_blood_bowl/#block-actions — Secure the Ball eligibility and resolution; Block action, assist eligibility, Block Dice, pushes, chain pushes, crowd injury, and follow-up.
- https://bloodbowlbase.ru/bb2025/core_rules/skills_and_traits/ — Block, Wrestle, Brawler, Grab, Guard, Fend, Stand Firm, Mighty Blow, and Sure Hands interactions.

## Implemented

Declare Move explicitly; one activation per player per team turn, no switching activations mid-action. Inspecting another player does not change the active mover. End Move permits zero movement. Forecast reachable vacant squares and valid jumps, then preview required dice before committing movement.

Version 0.0.4 added a non-mutating movement forecast. Selecting an eligible player shows the lowest-movement-point route to every reachable square, including rush allowance, dodges, jumps, and pickup checks. Version 0.0.5 simplifies movement to two clicks: click a reachable destination once to preview the route and checks, then click it again to commit movement through that square. After arrival, the player can choose another destination while movement remains. A committed route pauses for any re-roll decision; after resolving it, choose a destination again to re-plan from the actual state. Forecasted targets are not dice rolls: dice are generated only on commitment. Choosing a closer destination allows deliberate partial moves.

Movement spends profile MA; up to two extra movement points require individual 2+ rush rolls. Rushes precede dodge/jump/pickup checks. Leaving an opponent's tackle zone requires an AG test, penalized for destination markers (without the old edition's +1 bonus). Standing, non-distracted opponents mark; Stunty ignores marking penalties on dodges.

Standing spends three movement points. MA 2 or lower uses a 4+ stand-up test. Jumps over adjacent prone/stunned players cost two movement points and use the higher marking count at either endpoint. Failed jump natural 1 and failed jump rushes leave the player at the origin; other jump failures leave them at the destination.

Pickup occurs after movement checks. Failure bounces the ball and causes a turnover even if a teammate catches it. Ball bounce, catch and throw-in resolution is supported. Catch skill and team/Pro re-roll eligibility are evaluated for the catching player. A standing ball carrier reaching the opposing end zone ends the practice drive.

Failed movement rolls offer eligible Dodge, Pro or team re-roll choices, or acceptance. Dice cannot be re-rolled twice. Team re-rolls can be used multiple times in one turn; each team starts practice with two. Loner can waste a team re-roll. Pro failure prevents trying another source on that die. Pro is not incorrectly limited to once per turn under this ruleset.

Bone Head and Really Stupid tests occur on declaration; failure causes distraction and ends the activation without an automatic turnover. Really Stupid checks for eligible standing adjacent helpers. Falls resolve armour and injury, with Stunty and Thick Skull tables and Regeneration, before completing turnover. Stunned players miss their next activation opportunity and recover to prone at the end of the appropriate team turn.

## Block action

The Block practice setup lets a standing, unused active player select an adjacent standing opponent. Eligible standing, non-distracted assists are counted on both sides; Guard bypasses the normal restriction on being marked. The engine adds assists to Strength, rolls one, two, or three Block Dice from the Strength comparison, and assigns result selection to the stronger player's coach (the active coach on a tie). The attacker coach rolls the pool. The interface exposes team re-roll, Pro, and Brawler when available, then asks the user to choose a result.

Player Down, Both Down (including Block and Wrestle choices), Push Back, Stumble, and POW resolve their applicable knockdowns and armor/injury rolls. The push flow allows the attacker coach to choose legal push squares, makes chain pushes interactive, handles crowd injury and ball throw-ins, asks about Stand Firm, and offers or prevents follow-up based on Fend. Mighty Blow choices are offered when a supported player knocks an opponent down. The default block drill places a Black Orc Brawler/Grab attacker against an Imperial Bodyguard with Wrestle/Stand Firm, with an offensive assist available.

## Secure the Ball action

The action is available once per team turn to a non-Big-Guy player only when the ball is loose, no standing non-distracted opponent is within two squares of it, and a legal Move Action can reach it. The player may preview and commit the free move as with the Move action. The committed move must finish on the ball or choosing to end early causes a turnover. A special D6 roll of 2+ secures it and ends the activation; 1 fails, bounces the ball, and causes a turnover. Sure Hands does not reroll this action. A prone player may declare the action and stand as part of the move.

## Deliberate practice boundaries

- Perfect Conditions only; no weather roll or weather modifiers.
- No full match clock, halves, kickoff, drive restart, KO recovery, or re-roll replenishment. Touchdown stops the drill.
- No AI. Move, Block, Blitz, Pass, Hand-off, and Secure the Ball work as practice actions; no full turn or match sequencing is implemented.
- No apothecaries or permanent casualty/league outcomes. Casualties leave the pitch; regeneration can place a Troll in reserves.
- Beneficial Thick Skull and Regeneration effects are applied automatically. Dice re-roll choices remain explicit.
- Only starting skills relevant to the implemented practice actions for the two supported rosters are implemented. Other skill effects remain future work.
- Practice scenarios are artificial fixtures, not legal kickoff formations. They reset the session, and reloads do not save play.

## Development

movement.cjs is the UI-independent engine; movement.test.cjs exercises it with injected dice. index.html contains a generated copy so root-of-main Pages hosting requires no runtime build.

After editing movement.cjs, run `node build.cjs`, then `node --test movement.test.cjs` when doing a requested verification pass. The tests verify that the embedded engine matches the source. Publish index.html with the supporting source and tests. Validation: 41 passing tests, including eight Block and Secure the Ball tests covering assists, result selection, turnovers, Wrestle, Stand Firm, eligibility, and pickup resolution.

## Blitz action

Reviewed the 2025 Blitz section: https://bloodbowlbase.ru/bb2025/core_rules/the_game_of_blood_bowl/#blitz-actions . Declare one reachable standing opponent before activation. A team may declare one Blitz per turn, even if the player skips the block or fails an activation trait. Movement, standing, and activation traits use the normal Move flow. The block costs one MA, requires a Rush if beyond MA, and only targets the declared opponent. Successful resolution resumes movement; follow-up is free. Brawler and Grab's expanded push selection are restricted to declared Block actions. The Blitz practice setup uses a Noble Blitzer against a Goblin Bruiser.

Validation: 45 tests pass, including Blitz movement before/after blocking, block cost, rush failure, activation failure, target eligibility, skipping the block, and allowance reset.

## Pass and Hand-off — v0.0.8

Sources: the 2025 Pass and Hand-off sections on https://bloodbowlbase.ru/bb2025/core_rules/the_game_of_blood_bowl/ , the Passing Range Chart image https://bloodbowlbase.ru/bb2025/media/core_rules/test_for_accurancy_1.jpg , the turnover rules at https://bloodbowlbase.ru/bb2025/core_rules/rules_and_regulations/#the-turnover , and Pass / Give and Go at https://bloodbowlbase.ru/bb2025/core_rules/skills_and_traits/ .

A team may declare one Pass and one Hand-off per turn. Either action permits movement and pickup before the transfer; declaration consumes the allowance even if the attempt is skipped. Hand-off requires an adjacent standing non-distracted teammate and an AG catch without the bounced-ball penalty. Pass targets may be occupied or empty squares within the published chart. PA tests apply range and marking penalties; natural six succeeds, natural one or modified one-or-less fumbles, and other failures scatter three squares before interception and landing resolution.

The inactive coach may nominate one eligible standing, non-distracted opponent whose square overlaps the passing ruler to attempt interception. Interception uses AG with -3 for an accurate pass or -2 for inaccurate, plus marking; it does not use Catch skill. The board models ruler overlap as a one-square-wide rectangle, excluding edge-only contact. This physical-template geometry remains a prototype approximation to review against tabletop placement. Scatter leaving the pitch triggers throw-in from the last in-bounds square.

Direct pass and hand-off catches use AG without the bounce/throw-in penalty. A failed catch bouncing directly to a teammate who catches it can avoid turnover; ground landings, fumbles, and opposition possession cause the applicable turnover. Pass, Catch, Pro, and team re-rolls remain explicit. Give and Go preserves the thrower's remaining movement after a Hand-off or Quick Pass that resolves without turnover, without allowing a second transfer. The receiver keeps their activation eligibility.

Validation: 61 automated tests pass, including 16 new tests for action limits, receiver eligibility, direct and bounced catches, range boundaries, interception eligibility/resolution, accurate and inaccurate passes, natural and modified fumbles, scatter into crowd, Pass skill, pickup before passing, and Give and Go.
