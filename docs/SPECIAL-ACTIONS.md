# Exhibition actions and reaction contexts

Built on merged main `7b4880345818d96b4409b24d603445c3ba44cc6f` (PR #5).
Adds twelve previously deferred skills/traits and completes Chainsaw foul use.
To keep concurrent work separate, this skill delta is based on the independently
published route-preference branch `303d90d` ([PR #6](https://github.com/stormcloud23/blood-bowl/pull/6)).
Merge the route PR first, then this skill PR; the route changes are not part of
the skill PR's review diff.
Current catalogue: **98 implemented, 2 partial, 8 deferred**. These labels mean
support within the available actions, not exhaustive FFB parity. The browser
and committed GitHub Pages HTML remain self-contained; no server or package
dependency is introduced.

## Added behavior

| Skill / trait | Behavior and dependencies covered |
| --- | --- |
| Kick Team-mate | Separate once-per-team-turn declaration and UI button; uses existing throw selection, accuracy, flight, collision and landing. A fumble injures the passenger without armour, upgrades stun to KO, drops a carried ball from the original square, and preserves the carrier turnover. |
| Swoop | Passenger chooses a cardinal template or normal scatter. Direction and distance each have their own optional team/Loner/Pro re-roll window. Swooping gives a once-per-turn landing re-roll; declining Swoop or using Bullseye does not grant it. |
| Lethal Flight | Optional +1 to one opponent collision armour or injury roll, with no borrowed Claws/Mighty Blow. Iron Hard Skin blocks armour but permits injury use. Casualty attribution records the passenger; no SPP progression is calculated. Requires Right Stuff in the laboratory. |
| Animal Savagery | Mandatory activation check, automatic single or mandatory multiple teammate selection, distraction if no standing teammate, and resumption of the declared action after damage. Owned Claws/Mighty Blow are compulsory for armour even if toggled off; neither supplies an injury bonus for the lash-out. A ball carrier knockdown turns over unless the knockdown itself is prevented. |
| Trickster | Defending coach relocates adjacent to the attacker after Foul Appearance/Dauntless and before attack dice. Optional pickup and bounce resolve before resuming the attack; pickup failure causes no turnover. Carrier/ball movement is retained, with touchdown checks deferred until the attack resolves. Works for directly targeted special actions and repeated Frenzy attacks. |
| Hit and Run | Optional free square after Block or Stab, before final activation cleanup. No movement cost or Dodge/Rush, but pickup still resolves normally. Preserves Blitz continuation, is once per turn, and conflicts with Frenzy. |
| Dump-off | Optional Quick Pass target choice before the targeted attack, with normal passing/catching/scatter/interception but no pass-caused turnover. Saves/restores the interrupted actor, action and allowance state; never consumes a normal Pass allowance or gives Give and Go movement. Animosity, My Ball, Foul Appearance and Trickster ordering are included. |
| Punt | Separate declaration allowance, movement/pickup first, then **Punt now**. Cardinal template with ordered direction/distance decisions; Kick can re-roll either die, and each die also has eligible team/Loner/Pro choices. No pass accuracy or interception; ground recovery is allowed, opponent possession or crowd exit causes turnover. |
| Monstrous Mouth | Chomp declaration or Blitz replacement, 3+ check, persistent pin relations and existing Strip Ball protection. Restricts movement, Leap, pushes/chain pushes, thrown-passenger selection, follow-up and reaction relocation. Effects expire when a marker falls, is distracted, moves away or leaves play; they do not revive when it stands/returns. Multiple markers and drive reset are supported. Chomp preserves remaining Blitz movement. |
| Pile Driver | Detects an actual surviving Block knockdown, offers a free foul after the Block result, resolves modifiers/referee/Bribes, then places the attacker prone and ends activation. Does not consume the team's normal Foul allowance. Overrides Quick Foul and suppresses Hit and Run when used; placement/independent turnover causes remain separate. |
| On the Ball | Defensive players move sequentially up to three squares after pass target declaration but before accuracy; passing modifiers are recalculated afterwards. A fall ends the reaction group without changing the turn. At kickoff, one Open receiver may move after deviation and before event/catch, staying in its half; touchback skips this window. Preserves prior spent movement and activation state, and handles movement tests, ball handling, Tentacles, Chomp and Steady Footing. |
| Chainsaw foul completion | Optional use before a normal/free foul, kick-back re-roll window, +3 armour subject to Iron Hard Skin, ordinary assists/Dirty Player/doubles/Sneaky Git/Lone Fouler/referee/Bribes, and nested Pile Driver completion. |
| Saboteur | Optional 4+ reaction on Block knockdown, including attacker Skull/Both Down. Success gives the owner an automatic KO without armour/injury and resolves the opponent's collateral fall. Per-Block outcome records prevent duplicate injuries when the original Both Down list resumes; two Saboteurs and prevented collateral falls are supported. Requires Secret Weapon in the laboratory. |

## Sequencing and pinned defaults

`skillChoice` and `rollChoice` guard decision identity and keep re-rolled dice
from opening another window. `dumpContext` saves an interrupted attack while a
Quick Pass resolves; `moveContext` saves actor state during a bounded reaction.
Turn requests from these child sequences finish the child instead of advancing
the parent turn. Pending decisions cannot be bypassed by End Turn. Scoring
deferrals prevent a relocated carrier or free foul from scoring before the
entire parent action finishes. The actual inline UI uses the existing stale
button guards for all new decisions.

Pinned FFB choices that matter:

- Ordinary On the Ball and Dump-off do not offer team re-rolls or Pro. On the
  Ball reacting to Dump-off belongs to the active team: team re-rolls are
  allowed, Pro is still excluded, and the original interrupted attacker cannot
  move. Match turn boundaries reset opposing Dodge use for the new turn.
- On the Ball uses its own three-square allowance rather than spending the
  player's remaining activation movement; it cannot Rush. A low MA does not
  reduce the three-square reaction allowance. Jump cost still counts.
- FFB Hit and Run excludes any square adjacent to any opposing pitch player,
  including prone/stunned players. The browser follows that test rather than
  checking standing tackle zones only.
- `DIVING_TACKLE_LEAVING_TZ_ONLY` defaults to true. This audit corrected preview
  and execution to exclude tacklers whose tackle zone still contains the
  destination; earlier tests are adjusted to choose genuinely eligible tacklers.
- `SWOOP_DISTANCE` defaults to zero, meaning a D6 distance and a separate
  re-roll decision; a rerollable direction is resolved before distance.
- `CHAINSAW_TURNOVER` defaults to all failed kick-backs, including held armour.
  The normal Foul generator has no Steady Footing or Safe Pair placement step
  on that path. The free Pile Driver sequence does contain a placement step.
  Both paths retain the mandatory kick-back turnover.
- Pile Driver uses the own-skill prone drop, not Wrestle's explicit turnover
  reversal. A carrier may use Safe Pair of Hands, but its original carrier-drop
  turnover still applies. Referee and other independent turnovers are preserved.
- Animal Savagery forces armour modifiers only for the friendly lash-out,
  matching the BB2025 executable mode rather than older comments/editions.
- Triggered Saboteur replaces the ordinary falling-player turnover path. A
  non-carrier attacker can trigger it on Skull/Both Down without that normal
  turnover; an actual active carrier drop or independent recorded turnover
  still ends the turn. The automatic KO bypasses Steady Footing. An attacker
  Saboteur has no Safe Pair placement step; the defender path may place.
- FFB's `InjuryTypeSabotaged` collects no armour/injury modifiers for collateral
  damage. This excludes Chainsaw's armour bonus and Stunty's injury modifier;
  Thick Skull still applies through the final injury interpreter's property.
  The browser follows this pinned behavior rather than using ordinary Block
  injury modifiers for a blast.

Existing optional static benefits still use the laboratory's pre-roll enable/
disable controls. Not every FFB optional modifier combination or competition
option has a dedicated browser dialog. The contexts are in memory; they are
not serializable save/resume and are not a general simultaneous-result stack.

## Reference paths

Rules as written were checked against the [BB2025 skills and traits list](https://bloodbowlbase.ru/bb2025/core_rules/skills_and_traits/).
Executable reference remains [FFB at bf3f89d](https://github.com/christerk/ffb/tree/bf3f89d96b5143a8730910a841e7430791094492).
Relevant paths (Java package prefixes omitted below):

- `ffb-server/.../skillbehaviour/bb2025/SwoopBehaviour.java`,
  `step/bb2025/ttm/StepInitScatterPlayer.java`, `StepRightStuff.java`,
  `injury/injuryType/InjuryTypeFumbledKtm.java`, `InjuryTypeFumbledKtmApoKo.java`
  and `InjuryTypeTTMHitPlayerForSpp.java` for flight extensions.
- `skillbehaviour/bb2025/AnimalSavageryBehaviour.java`,
  `injury/injuryType/InjuryTypeBlock.java`, and
  `step/bb2025/shared/StepHandleDropPlayerContext.java` for lash-outs and damage.
- `step/generator/bb2025/Block.java`, `BlitzBlock.java`,
  `skillbehaviour/bb2025/DumpOffBehaviour.java`,
  `step/bb2025/block/StepTrickster.java`, `StepHitAndRun.java` and
  `StepChomp.java` for attacks.
- `skillbehaviour/bb2025/SaboteurBehaviour.java`,
  `step/bb2025/shared/StepDropFallingPlayers.java`,
  `injury/injuryType/InjuryTypeSaboteur.java` and `InjuryTypeSabotaged.java`
  for automatic KO, per-victim exceptions and collateral injury.
- `step/bb2025/punt/StepPuntDirection.java` and `StepPuntDistance.java`,
  `step/bb2025/foul/StepFoulChainsaw.java`,
  `step/generator/bb2025/Foul.java`, `step/generator/mixed/PileDriver.java`,
  `step/mixed/foul/StepPileDriver.java`, and `step/mixed/StepDropActingPlayer.java`.
- `step/bb2025/pass/StepPassBlock.java`, `step/bb2025/kickoff/StepKickoffReturn.java`,
  `mechanic/bb2025/RollMechanic.java`,
  `ffb-common/.../mechanics/mixed/OnTheBallMechanic.java`,
  `mechanics/bb2025/SkillMechanic.java` and `factory/GameOptionFactory.java`.

FFB MIT attribution remains in the project notices and standalone HTML. No Java
server was started or introduced as a runtime dependency.

## Validation and remaining work

All **427 tests pass** on the combined publication tree: 77 new deterministic
action/interaction cases, one additional Diving Tackle default regression,
eleven actual inline-UI scenarios, and the separate route PR's 338-test baseline.
Cases include real MatchGame turn/score handling,
fall prevention, carried balls, nested Dump-off → On the Ball → attack,
sequential movement, kickoff bounds, direction/distance resources, stale
decisions, mandatory selection, casualty attribution and Pile Driver cleanup.
Run the documentation generator, `node build.cjs`, `node --test *.test.cjs`,
and `git diff --check`. No visual browser inspection or Java differential
runner is claimed.

Six deferred catalogue entries still affect exhibitions:

| Foundation needed | Entries |
| --- | --- |
| Two committed complete attacks and their result groups | Multiple Block |
| Random movement and friendly collision Blocks | Ball & Chain |
| Feeding, action replacement and pre-pass/pre-score gates | Bloodlust (X+) |
| Separate airborne bomb and recursive caught-bomb sequence | Bombardier |
| Casualty table, treatment timing and in-match death handling | Decay, Plague Ridden |

Insignificant and Violent Innovator remain chiefly roster/progression work.
Leader and Secret Weapon still need applicable inducement/team-rule coverage.
Staff, apothecary resources, star abilities, the wider kickoff/drive audit,
interception geometry and competition-specific match endings remain outside
these skill additions. Future random movement and simultaneous actions must
integrate Chomp and preserve all injury/turnover consequences before cleanup.
