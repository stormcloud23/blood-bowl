# FFB comparison — v0.0.14

Follow-on work: [reaction continuations and Tentacles](REACTIONS.md) adds an
in-memory interruption stack and the first departure reaction. Current coverage
is 79 implemented, 3 partial and 26 deferred; the historical comparison below
describes the preceding increment.

Compared October 29, 2026. Browser baseline: `stormcloud23/blood-bowl` commit `d0f1fbfc2241efd2ffe5865740b3a4adf663ac81`. Java reference: [`christerk/ffb` at bf3f89d](https://github.com/christerk/ffb/tree/bf3f89d96b5143a8730910a841e7430791094492).

The owner's current instruction is to prefer FFB's executable **BB2025** behavior when it conflicts with the existing browser implementation. This supersedes earlier project decisions favoring the linked rulebook interpretation for those conflicts. Shared `common` and `mixed` classes are considered only when selected by BB2025. Old Java comments are not reliable edition identifiers: for example, the Pro comment describes a 4+ test, while the BB2025 roll mechanic actually uses 3+.

This is a targeted comparison and port, not certification that every rule or every combination of the 108 catalog entries matches FFB. The static skill-source map identifies where the remaining behavior lives. No continuous FFB synchronization is planned; future rules/FAQ/team updates can be reviewed as occasional releases.

## Architectural comparison

| Area | Browser engine | FFB reference and decision |
| --- | --- | --- |
| State and rules | MovementGame → SkillGame → MatchGame, rendered into one self-contained HTML file | Keep this browser architecture. No Java runtime, network calls, JavaScript framework or server dependency is added. |
| Sequencing | Pending choices and continuation callbacks pause resolution | FFB uses Step/Sequence stacks. Preserve the pending continuation boundaries for this increment, and add missing modifier/Pro/Bullseye/Bribe windows. A general serializable interrupt stack remains future work. |
| Turn/drive flow | Two halves, eight turns each, setups, kickoff, touchdowns, drive effects | Compared relevant end-turn and stalling branches. Preserve the existing 32-turn flow and correct unactivated stalling and bonus re-roll priority. This is not a full comparison of all kickoff events. |
| Skills | 108-entry catalogue; 76 implemented, 3 partial, 29 deferred at baseline | Implement Strong Arm and Bullseye and correct existing interactions. Coverage becomes 78 implemented, 3 partial, 27 deferred, within the existing actions. A matching Java class is not proof of browser parity. |
| Tests | Injected dice and actual inline-UI harness | Add FFB-derived scenarios for decisions and their continuations; retain existing tests and bundle equality checks. These are source-derived regression tests, not an automated differential runner against Java. |
| League / AI / persistence | Not implemented | Remain outside this increment. FFB's remote website connector does not supply a standalone league backend for the browser. |

## Conflicts corrected and behavior added

All Java paths below are relative to the pinned reference above. Each row is exercised by `ffb-regression.test.cjs`; the new decision buttons also have inline-UI scenarios in `throw-ui.test.cjs`.

| Mechanic | Previous browser behavior | FFB behavior now used | Java evidence |
| --- | --- | --- | --- |
| Pro usage | Cleared the used flag after each resolved roll, allowing repeated attempts during one turn | Once per player per turn; a failed attempt also consumes Pro | `ffb-common/.../skill/bb2025/Pro.java`; `ffb-server/.../mechanic/RollMechanic.java:isProReRollAvailable`; `ffb-common/.../util/UtilPlayer.java:refreshPlayersForTurnStart` |
| Failed Pro | Immediately accepted the original failure | Offer a team re-roll of the Pro test itself, with Loner if applicable; never re-roll the original die twice | `ffb-server/.../mechanic/bb2025/RollMechanic.java:useReRoll`; `ffb-server/.../step/mixed/StepPro.java` |
| Block decision boundary | Public re-roll method could be called during a push decision; Leader could be consumed before validation | Re-roll only while choosing the original Block dice; retain resources when an invalid request is rejected | `ffb-server/.../step/bb2025/block/StepBlockRoll.java`; FFB's Step command routing |
| Break Tackle | Automatically spent a modifier that could save a failed dodge | Coach may apply it, re-roll, or accept failure; it can rescue the re-rolled result without reopening re-rolls | `ffb-common/.../skill/bb2025/BreakTackle.java`; `ffb-server/.../step/bb2025/move/StepMove.java`; `ffb-server/.../util/bb2025/ReRollModifierChoiceDialogParameterFactory.java` |
| Iron Hard Skin | Cancelled both armour and injury uses of Mighty Blow/Dirty Player | Cancels relevant armour modifiers and Claws; injury modifiers remain available when armour was broken naturally | `ffb-common/.../skill/mixed/IronHardSkin.java`; `ffb-common/.../skill/bb2025/MightyBlow.java`; `ffb-common/.../skill/bb2025/DirtyPlayer.java` |
| Lone Fouler | Offered only when armour held; successful doubles went straight to injury/send-off | Also offered on broken-armour doubles and when ending the turn would expose a separate unactivated stalling carrier; decide before injury | `ffb-server/.../injury/modification/bb2025/LoneFoulerModification.java` |
| Argue the Call 1 | Still offered a Bribe after the coach rolled 1 | Bans the coach and disallows a Bribe for that send-off; a later independent send-off may still use Bribes | `ffb-server/.../step/bb2025/foul/StepBribes.java:rollArgue` |
| Failed Bribe | Removed the player immediately even with more Bribes remaining | Offer another available Bribe, matching FFB's default `onlyOneBribePerSendOff=false`; do not repeat Argue the Call | `ffb-server/.../step/bb2025/foul/StepBribes.java`; `ffb-common/.../factory/GameOptionFactory.java` |
| Stalling without activation | Ending a turn without activating the carrier bypassed stalling | Check an eligible unactivated carrier before changing turns; resolve the rock/ball/turnover exactly once | `ffb-server/.../step/bb2025/shared/StepForgoneStalling.java`; `.../StallingExtension.java` |
| Stalling eligibility | Omitted Fury/Animal Savagery/Take Root exclusions and rolled an ineffective D6 in turns 7–8 | Exclude activation-roll traits and distracted carriers; no crowd die after turn six | `ffb-server/.../step/bb2025/shared/StallingExtension.java` |
| Re-roll pool priority | Always spent Leader before Brilliant Coaching | Spend expiring Brilliant Coaching re-rolls first, then Leader, then regular re-rolls; applies to failed-Pro fallback too | `ffb-server/.../mechanic/bb2025/RollMechanic.java:firstAvailableSpecialReRollSource` |
| Strong Arm | Deferred despite existing thrown-player machinery | Enabled optional +1 Throw Team-mate accuracy modifier; natural 1 still fumbles; requires Throw Team-mate in the laboratory | `ffb-common/.../skill/mixed/StrongArm.java` |
| Bullseye | Deferred despite existing thrown-player machinery | On a Superb Throw, offer landing in the target square instead of scatter; preserve collisions, landing, ball and turnover handling | `ffb-common/.../skill/bb2025/Bullseye.java`; `ffb-server/.../skillbehaviour/bb2025/BullseyeBehaviour.java` |

## Preserved after checking

- **Multiple team re-rolls in one turn:** the BB2025 mechanic decrements the pool without setting the BB2016 once-per-turn flag. The shared availability guard alone is misleading. The browser keeps allowing separate dice tests to use separate team re-rolls, with no re-rolling a re-rolled die.
- **Natural/modified results:** natural ones still fail; natural sixes succeed. Existing exactly-one fumble classification remains unchanged. Strong Arm affects thrown-player accuracy, not normal Pass actions.
- **Leader:** existing once-per-half pool remains usable with a Leader prone or stunned on the pitch. Inducement interactions are still partial.
- **Turn/drive progression:** existing match sequence tests still cover 32 turns, scoring during the opposing turn, kickoff choices, weather, recovery and halftime. Only the named conflicts were changed; other event branches are not claimed to have full FFB parity.

## Remaining work

The other 27 deferred skills still require their missing reaction/action/league systems. In particular Diving Tackle, Shadowing, Tentacles, Dump-off, On the Ball, Steady Footing, Safe Pair of Hands, simultaneous Multiple Block and bombs have not been silently enabled. A reusable interrupt stack would make these safer to port. Strong Arm currently uses the existing pre-roll enable/disable control; not every FFB modifier combination is exposed. The roster catalogue, complete game flow, casualty/advancement systems, save/resume and computer opponent still need their own comparisons and implementation work.

The browser's UI is tested by executing its embedded scripts against a small DOM harness. Visual browser inspection was unavailable in this environment. No Java server was started for this port.

Validation: **215 tests pass**, including 30 new source-derived rules regressions and three new inline-UI decision scenarios. GitHub Actions also verifies the generated skill documentation and embedded browser engines match their committed sources.

Run `node build.cjs`, then `node --test *.test.cjs`. GitHub Pages still serves the committed `index.html` directly. See [third-party notices](../THIRD_PARTY_NOTICES.md) for FFB attribution and its MIT license.
