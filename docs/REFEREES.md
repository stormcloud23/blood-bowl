# Referees and grouped Secret Weapon decisions

Biased Referees are available in the existing pregame resource menu for exhibitions and funded league fixtures. The pinned FFB defaults allow one for 120,000 gp, reduced to 80,000 gp with Bribery and Corruption. They add one to Argue the Call rolls and spot otherwise undetected opposing fouls on 5+, including Sneaky Git fouls. No extra spotting roll occurs when doubles already exposed the foul. Purchases lock with the other inducements and use the same CTV/Petty Cash/Treasury checks.

At the end of a drive, coaches choose which Secret Weapon players to argue for and which to protect with their remaining Bribes. The away coach argues first, then the home coach; each team's optional Bribery and Corruption re-roll is resolved after its arguments. Both coaches' arguments finish before either spends Bribes. A failed Bribe can be retried or the next Bribe can protect a different player. Choices use guarded callbacks; replaying an old button cannot roll or spend again.

Players who took part in the drive remain subject to the check while knocked out or in reserves. Casualties, eaten players, already sent-off players and unused reserves do not receive argument prompts. Successful protection lasts through that drive's processing, not through future drives. At full time, no further Secret Weapon arguments or Bribes are required.

## Pinned executable distinctions

Reference: `vendor/ffb` at `bf3f89d96b5143a8730910a841e7430791094492`:

- `ffb-common/.../factory/GameOptionFactory.java`: ordinary/discounted Biased Referee prices and limits.
- `ffb-common/.../inducement/bb2025/InducementCollection.java`: price eligibility and referee usages.
- `ffb-server/.../skillbehaviour/bb2025/SneakyGitBehaviour.java`: opposing referee spotting after ordinary detection.
- `ffb-server/.../step/bb2025/foul/StepBribes.java`: foul argument modifier, natural-one coach ban, automatic Bribery and Corruption retry, and Bribes.
- `ffb-server/.../step/bb2025/StepEndTurn.java`: grouped arguments/retries/Bribes, removed-player exclusions, full-time boundary.

The two argument paths differ in the pinned source. During a foul, a natural one bans the coach even with a Biased Referee; without a successful Bribery and Corruption retry it prevents a Bribe for that send-off. At drive end, the ban uses the modified roll: a Biased Referee prevents the natural-one ban and permits an optional rule re-roll. An unmodified one forces the rule re-roll when available, otherwise bans further arguments. End-of-drive Bribes remain available after a coach ban. These distinctions follow executable FFB behavior rather than claiming that every printed rule uses identical handling.

The remaining special named referee/staff and star-player exceptions are deferred. Secret Weapon's catalogue status covers the ordinary grouped drive-end behavior and supported resources; it is not certification of every unique ability.

## Validation

Deterministic cases cover purchase limits/prices, both argument paths, spotting with/without doubles, coach bans, choice order, optional retry allocation, repeated/reallocated Bribes, casualty/unused-player exclusions and full time. Embedded UI cases exercise the discount, multiple weapon selection, Bribe spending and stale callbacks. No visual browser inspection or Java differential runner was available.
