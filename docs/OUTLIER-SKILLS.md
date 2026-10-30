# Ball & Chain, Bloodlust and Bombardier

Based on merged main `e08ef6c` (Multiple Block PR #12). The endzone colors and
checkerboard styling are preserved. All gameplay remains in the standalone
browser application; no server, Java runtime or external rules request is used.

## Bloodlust

Bloodlust (X+) is checked once per activation through the shared activation
boundary. Blocking, Blitz, Foul and the relevant attack special actions lower
its target by one, with a minimum of 2+. The roll supports existing eligible
team/skill re-rolls. Failure allows the action to proceed with a feeding
requirement. Block/Multiple Block, Secure the Ball and Throw Bomb declarations
can be replaced with Move; the Multiple Block context is then discarded without
spending Block dice or leaking a score deferral.

The feeding gate applies at action completion, before a pass, handoff, punt or
thrown/kicked-player delivery, before awarding a touchdown, and before team-turn
cleanup. Adjacent friendly Thralls may be standing, prone or stunned. Eligibility
comes from the position's Thrall flag/keyword or a laboratory Thrall marker.
The laboratory now offers `Bloodlust (2+)` and Mark/Unmark Thrall controls.

A bite rolls injury without armour. Casualties are automatic Badly hurt without
D16 casualty dice. The bite excludes the Stunty injury table and attacking
damage modifiers; Thick Skull still applies. Its injury can use the existing
medical sequence. Biting the friendly match-ball carrier retains its turnover
even if treatment succeeds. Feeding does not use Safe Pair of Hands, matching
the default `dropPlayer(..., FEEDING)` eligibility flag in the reference.

Failure or refusal to feed causes a turnover, loss of tackle zones through the
existing distracted state, and a carried-ball bounce. The vampire stays on the
pitch; it does not leave for the reserves. A vampire who cannot feed cannot
score. A turnover/fall does not open a fresh voluntary feeding window. Feed,
treatment and scoring callbacks resume only after their decisions finish.

## Ball & Chain

Declare Move to open a direction-template dialog. Choose North/East/South/West,
then a D6 selects one of the three squares. Each result spends one movement.
There is no normal route preview or Dodge/Tentacles check. Ordinary Block,
Blitz, Foul, Pass, Hand-off, Secure the Ball, bomb, thrown-player and stand-up
declarations are unavailable. It cannot pick up or catch the ordinary ball.
The default FFB `ALLOW_BALL_AND_CHAIN_RE_ROLL=false` disallows direction
re-rolls, including the ordinary Pro/team re-roll window.

Standing collisions produce Blocks against either team. Neither side gets
assists when a participant has Ball & Chain, including Guard and the current
match cheering assist. Collision Blocks retain their applicable dice choices,
Dauntless, Hatred, damage modifiers and re-rolls. Foul Appearance, Trickster
and Fend do not stop the Ball & Chain collision. Following up is automatic.
Prone/stunned collisions are pushed and receive armour/injury without Block
dice or a fall-prevention test. An already-stunned player remains stunned if
armour holds. Friendly standing knockdowns cause turnovers; successful
Steady Footing on that victim can avoid the knockdown.

On an empty square the mover changes square before the Rush. On an occupied
square the collision sequence checks Rush before Block dice. A failed collision
Rush still resolves the push/follow-up (and a grounded target's damage) before
the mover's injury. Leaving the pitch resolves crowd injury and turnover.
The movement cap does not roll an extra direction die.

A Ball & Chain player being knocked down skips armour and rolls injury,
converting stunned results to KO. Its KO cannot use an apothecary. Applicable
attacker injury modifiers still get their normal decision window. Ball & Chain
cannot use Steady Footing itself. For an actual **placed-prone** path, including
Wrestle, the pinned `InjuryTypeBallAndChain` uses the literal fixed `{5,5}`
injury rather than random injury dice; this browser follows that executable
behavior explicitly. That is not a claim about the printed rulebook.

The laboratory rejects the Ball & Chain skill conflicts listed in the pinned
definition, including Leap, Grab, Frenzy, Multiple Block and Steady Footing.

## Bombardier

Throw Bomb is a separate once-per-team-turn special action, available from the
existing special-action menu. Aim on the pitch with the existing two-click
preview/commit flow. A bomb is a separate object: carrying/catching one does
not replace the ordinary match ball or consume the normal Pass allowance.
There is no movement before the throw. A caught/intercepted bomb must be
rethrown, including by an opponent or an already-used player; the UI identifies
the throwing coach and disables voluntary End Move/End Turn during a mandatory
rethrow. The original bomber alone spends the activation.

The sequence supports passing range/modifiers, inaccurate scatter, interceptions,
Diving Catch, recursive catches/rethrows, eligible Pass/Pro/team re-rolls,
Animosity, Safe Pass and Give and Go. On the Ball does not activate for bombs.
The pinned `CATCH_WORKS_FOR_BOMBS=false` excludes Catch/Monstrous Mouth re-rolls.
Extra Arms, Nerves of Steel and applicable delivery modifiers still apply.
Interception does not use the normal thrower's Stunty advantage. A successful
interception catches the bomb, without changing possession of the match ball.

A natural one or a modified passing result of one or lower fumbles in the
thrower's square. PA dash fumbles without a passing die and cannot use Safe
Pass. A bomb that leaves the pitch is removed instead of being thrown in.
With FFB's default `BOMB_BOUNCES_ON_EMPTY_SQUARES=true`, an initial empty-square
landing bounces once before exploding or being caught. A failed catch explodes
at the selected catcher's square without a bounce. Refusing a matching-team
transfer through Animosity ends the initial declaration; refusing while already
holding a caught bomb leaves it to explode in the holder's square.

The centre victim is automatically hit; each adjacent victim needs 4+. The blast
snapshot survives early knockdowns/turnover causes. Standing victims can use
Steady Footing and eligible Safe Pair of Hands, then are placed prone and take
armour/injury. Grounded victims also take armour/injury. The BB2025 selected
factories supply **no old-edition +1 Bomb armour/injury modifier**; Chainsaw's
knockdown armour modifier does not apply to this placed-prone blast. Ball &
Chain skips bomb armour and retains its minimum-KO injury rule.

All blast damage is committed before grouped medical decisions. Treatment uses
the shared defending-team/acting-team groups, and ordinary-ball movement is
delayed until the committed blast victims and their medical decisions finish.
Knocking down a standing member of the original bombing team causes a turnover
under FFB's default option, even if treatment cures the injury. A successful
fall-prevention roll avoids that knockdown cause. Original-thrower Quick Pass
Give and Go eligibility survives subsequent opponents' rethrows. Re-throwers'
activation flags, the original team turn and independent match-ball possession
are retained.

## Reference and validation

Pinned FFB commit: `bf3f89d96b5143a8730910a841e7430791094492`.
Paths omit `src/main/java/com/fumbbl/ffb/`:

- Common `skill/bb2025/BallAndChain.java`, `Bombardier.java`, and
  `skill/mixed/Bloodlust.java`: selected properties and conflicts.
- Server `skillbehaviour/bb2025/BloodLustBehaviour.java`,
  `step/bb2025/shared/StepBloodLust.java`, `StepInitFeeding.java`,
  `StepEndFeeding.java`, and `injury/injuryType/InjuryTypeBitten.java`.
- Common `util/UtilPlayer.java` / `model/RosterPosition.java`: Thrall eligibility.
- Server `step/bb2025/move/StepMoveBallAndChain.java`, `StepGoForIt.java`,
  `step/mixed/block/StepBlockBallAndChain.java`, `step/generator/bb2025/Move.java`
  and `Block.java`: direction, collisions and Rush order.
- Server `util/UtilServerInjury.java`, `injury/injuryType/InjuryTypeBallAndChain.java`
  and `step/bb2025/shared/StepDropFallingPlayers.java`: injuries and friendly falls.
- Server `step/generator/bb2025/Pass.java`, `Bomb.java`,
  `step/bb2025/special/StepInitBomb.java`, `StepResolveBomb.java`, `StepEndBomb.java`,
  `StepSpecialEffect.java`, and `step/bb2025/command/DropPlayerFromBombCommand.java`.
- Server `step/bb2025/pass/StepPass.java`, `StepEndPassing.java`, and common
  `mechanics/bb2025/PassMechanic.java`: accuracy, fumbles and Give and Go.
- Common `factory/GameOptionFactory.java`, `factory/bb2025/ArmorModifiers.java`,
  `InjuryModifiers.java` and `modifiers/bb2025/CatchModifierCollection.java`:
  selected defaults, damage modifiers and bomb catches.

The full suite passes **619 tests**, including **80 new deterministic outlier
cases and eight actual inline-UI cases**. Documentation and standalone engines
are rebuilt and whitespace checked. Browser-button tests use the existing DOM
harness; no visual browser inspection or Java differential runner is claimed.

Current catalogue: **104 implemented, 2 partial, 2 deferred**. The deferred
Insignificant and Violent Innovator entries chiefly require roster/progression
work. Leader and Secret Weapon retain their documented partial interactions.
No deferred catalogue entry now blocks the scoped exhibition actions, but these
labels do **not** certify full FFB interaction parity. Staff, inducements, star
and team exceptions, kickoff/drive audits, interception geometry and competition
endings still need work. These action contexts are in memory; save/resume and
league application of injury/SPP records remain unimplemented.
