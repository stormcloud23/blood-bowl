# Exhibition parity — departure reactions

Baseline: merged main `81438b9` (PR #2). This increment adds Shadowing and
Arm Bar to the static browser engine. Catalogue totals: **81 implemented,
3 partial, 24 deferred**. These are feature inventory labels, not certification
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

All 24 deferred catalogue entries remain accounted for below. **22 have match
effects that still block skill-complete exhibition play.** The other two chiefly
depend on the deferred roster/progression systems.

| Group | Remaining entries | Required shared work |
| --- | --- | --- |
| Reactions | Diving Catch, Diving Tackle, Hit and Run, Safe Pair of Hands, Steady Footing, Dump-off, On the Ball, Trickster | Ball landing/placement windows, retained roll and modifier choices, pre-attack and out-of-turn movement contexts, continuation after a prevented fall. |
| Special actions and activation traits | Pile Driver, Saboteur, Monstrous Mouth, Punt, Multiple Block, Animal Savagery, Ball & Chain, Bloodlust (X+), Bombardier | Nested actions, movement restrictions across all relocation paths, feeding before scoring/passing, directional movement, simultaneous resolution even after a turnover. |
| Flight extensions | Lethal Flight, Kick Team-mate, Swoop | Extend the existing thrown-player flight/collision machinery with attribution, a separate kick allowance and fumble injury, directional flight and landing re-rolls. |
| Casualty-dependent match effects | Decay, Plague Ridden | Actual casualty results, Regeneration/apothecary ordering, eligible death attribution, once-per-game creation of a predefined reserve lineman. Plague Ridden's in-match reserve addition must not wait for league hiring. |
| Later roster/progression features | Insignificant, Violent Innovator | Draft-list counting and SPP from special-action casualties; retain match attribution where useful, postpone roster editing and advancement. |

Partial entries: Chainsaw still needs foul use; Leader and Secret Weapon still
need applicable inducement/team-rule interactions. Existing implemented entries
also need interaction audits as new actions arrive. In particular future Diving
Tackle must suppress Shadowing when used, preserve re-roll history, and keep
modifier selection before the defender's decision.

Other exhibition blockers remain: casualty/treatment resources, staff and
applicable inducements, star abilities and team rules, full kickoff/drive audit,
interception ruler geometry, and competition-specific end-of-match options.
The existing Tentacles increment also needs a sequencing audit: its pre-move
hold precedes Rush, whereas the pinned FFB Move/BlitzMove generators put
Go For It before Tentacles. That earlier behavior is preserved here rather than
represented as verified parity. See [the earlier reaction increment](REACTIONS.md).

## Validation

`node generate-skill-docs.cjs`, `node build.cjs`, `node --test *.test.cjs`,
and `git diff --check`. New deterministic scenarios cover defender choices,
attempt caps, both movement outcomes, pickup marking, Jump versus Rush, bonus
exclusivity, Iron Hard Skin, attribution, stacked reactions and stale callbacks.
The actual bundled UI tests exercise both new skills and the modifier buttons.
No Java/JavaScript differential runner or visual browser inspection is claimed.
