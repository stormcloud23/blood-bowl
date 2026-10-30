# Basic match resources and current team rules

Based on merged main `491b0e8` (outlier-skill PR #13). The application remains
static and self-contained, and the owner's pitch/endzone styling is preserved.

## Owner's revised development order

Star players and their unique abilities are deliberately deferred until the
core systems are largely complete. They do not block the initial exhibition
milestone or the team builder. The order is basic staff/inducements and relevant
team rules, non-star match verification, roster/team building, then league
progression. Return to star-player content late in development.

## Configuration and state

Before determining fans, each coach can configure permanent staff and the
basic inducements below. The current team-apothecary toggle still works and
preserves any selected Wandering Apothecaries. The UI shows selection costs,
and the match panel shows remaining apothecaries/Bribes and purchased Kegs.

`MATCH_RESOURCES` defines labels, groups and defaults. `resourceSpec(team,key)`
applies roster/team-rule eligibility and discounts; `setResource` validates
integer limits and locks changes after the fan step or during another dialog.
`resourceChoices` retains selections separately from the mutable match pools.
The constructor accepts optional `resources: [team0, team1]` overrides, or the
team fixture's `matchResources`. Input is copied and validated without mutating
the original team definitions. This is a foundation for later team management.

Permanent selections: 0–8 purchased team re-rolls, 0–1 eligible team apothecary,
0–6 assistant coaches, 0–6 cheerleaders, and an existing team's Dedicated Fans
value from 1–6. Existing roster re-roll prices and apothecary eligibility apply.
Staff cost 10,000 each; fan improvements cost 5,000 each above the free initial
fan. The [BB2025 drafting reference](https://bloodbowlbase.ru/bb2025/core_rules/drafting_a_blood_bowl_team/)
also limits **newly drafted** fans to three. Full fresh-roster legality and
draft budgets are deferred to the builder; this exhibition configuration can
represent a team already having a higher fan value.

No cash is automatically granted, no Treasury is spent, and no underdog/Petty
Cash calculation is claimed. The UI explicitly presents exhibition selections
and their costs. `resourceCosts` separates staff/re-roll value, fan investment
and inducement spending so a later roster budget can use the right values.

## Implemented basic inducements

Limits and prices below follow the project's **pinned FFB BB2025 option
defaults**, including where those defaults differ from published lists.

| Selection | Maximum | Price each | Match effect |
| --- | --- | --- | --- |
| Bribes | 3; 6 with Bribery and Corruption | 100,000; 50,000 with that rule | Existing send-off/Secret Weapon Bribe decisions |
| Blitzer's Best Kegs | 2 | 50,000 | Add purchased count to each KO recovery roll |
| Extra Training | 4 | 100,000 | Add ordinary re-rolls to each half's initial pool |
| Wandering Apothecaries | 2, if roster can hire an apothecary | 100,000 | Additional uses of the existing medical sequence |
| Part-time Assistant Coaches | 3 | 20,000 | Add to assistant-coach kickoff total |
| Temp Agency Cheerleaders | 4 | 20,000 | Add to cheerleader kickoff total |
| Halfling Master Chef | 1 | 300,000; 100,000 with the roster Master Chef keyword | Three 4+ dice each half, gaining re-rolls and reducing the opponent's regular pool |

Known price/limit differences are explicit: the [BB2025 inducement list](https://bloodbowlbase.ru/bb2025/core_rules/inducements/)
lists five temporary coaches, five 5,000-gp temporary cheerleaders, and eight
Extra Training selections. The pinned FFB factory instead gives 3, 4 at
20,000 gp, and 4 respectively. Existing owner precedence selects executable FFB
behavior. This increment does not silently update the reference revision or
claim printed-rules parity for those option defaults.

Assistant coaches/temporary coaches add to Brilliant Coaching. Cheerleaders/
temporary cheerleaders add to Cheering Fans. Ties retain the existing award to
both teams. Kegs are persistent modifiers and are not consumed by a recovery.
Get the Ref adds a Bribe on top of purchased and remaining Bribes; purchase
limits do not cap an in-match event award.

Permanent and Wandering Apothecaries share the match medical-use pool because
their supported treatment behavior is identical. Their purchase selections
remain separate for accounting. Spent medical uses and Bribes do not return
after a drive or at half-time. The existing casualty/apothecary choices and
grouped Multiple Block/bomb medical handling are reused.

Regular re-rolls carry across drives. Unspent Brilliant Coaching drive bonuses
still expire as before. At half-time, the configured purchased re-rolls plus
Extra Training replenish, rather than resetting to the old hard-coded two.

## Chef, Leader and team-rule boundaries

The Chef runs after both setups and before the kick and Leader grant, once per
half. Both Chefs roll first, then their losses/gains apply simultaneously.
Opposing losses are capped at zero, but a Chef's gains are not capped by the
opponent's available re-rolls. This matches `UtilServerGame.handleChefRolls`.
`chefHistory` preserves half, owner, dice and success count for the match.
Leader is granted **after** Chef deductions, so the Chef does not steal that
separate pool. Absent/removed Leaders retain the existing eligibility rules.

Bribery and Corruption now supplies both its discounted Bribe price/maximum and
one shared Argue the Call natural-one re-roll for the match. The unmodified
natural one is re-rolled automatically, matching the pinned unmodified case.
A second natural one bans the coach and prevents a Bribe. A rerolled ordinary
failure can proceed to Bribes, and non-one failures leave the team-rule re-roll
available. The use is shared across send-offs and not replenished at half-time.
Ordinary failed Bribes may spend another available Bribe under FFB's default.
Send-off and Bribe callbacks are guarded against invalid/stale replay.

Imperial Nobility has no listed special rule in the current fixture. Black
Orcs also have Brawlin' Brutes: `teamSppAwards` now exposes touchdown/casualty
values 2/3, versus ordinary 3/2, for later progression. No SPP is awarded or
persisted yet. This records the rule without prematurely building a league.

Leader moves from Partial to Implemented for the available actions/resources.
Secret Weapon remains Partial: grouped end-drive allocation of the shared
Argue re-roll and Biased Referee exceptions still need work. Current inventory
is **105 implemented, 1 partial, 2 deferred**. Catalogue labels remain scoped
feature coverage, not exhaustive parity certification.

## Reference and validation

Pinned FFB commit: `bf3f89d96b5143a8730910a841e7430791094492`.
Paths omit `src/main/java/com/fumbbl/ffb/`:

- Common `inducement/InducementCollection.java`,
  `inducement/bb2025/InducementCollection.java`, `factory/GameOptionFactory.java`:
  inducement options, prices, limits and eligibility.
- Server `step/bb2025/kickoff/StepApplyKickoffResult.java`: staff contest bonuses.
- Server `step/bb2025/start/StepMasterChef.java`,
  `step/generator/bb2025/Kickoff.java`, `util/UtilServerGame.java`,
  `DiceInterpreter.java`: timing, simultaneous Chef pools and three 4+ dice.
- Server `step/bb2025/StepEndTurn.java`: Keg recovery and remaining grouped
  end-drive Argue allocation behavior.
- Server `step/bb2025/start/StepBuyInducements.java` and
  `step/bb2025/foul/StepBribes.java`: initial team-rule use and natural-one re-roll.
- Common `mechanics/bb2025/SppMechanic.java`: Brawlin' Brutes award values.

All **671 tests pass**, including **47 new deterministic resource cases and
five actual inline-UI cases**. Coverage includes configuration guards, costs,
eligibility, staff contests, recovery, resource persistence, half-time
replenishment, both Chefs, Leader ordering/absence, team-rule consumption,
successive Bribes/send-offs, stale callbacks and real pregame controls.
Skill docs and standalone engines are regenerated; whitespace checks pass.
The UI cases use the existing real-inline-script DOM harness. No visual browser
inspection or Java differential runner is claimed.

Remaining non-star scope includes grouped Secret Weapon Argue choices, Biased
Referees, Mascots, Weather Mages, medical regeneration aids, prayers, Wizards,
special inducement players and other roster-specific team rules. Automatic
inducement allowances, team construction, persistence and league application
of injury/SPP records are later stages. Star players and unique named staff/
player abilities remain deliberately late work, not a prerequisite to those
core systems.
