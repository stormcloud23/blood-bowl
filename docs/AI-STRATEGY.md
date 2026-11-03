# General coaching strategy — v0.0.38

These changes adapt ideas from three King_Ghidra articles on Tabletop Battles.
The priorities, weights and algorithms are our implementation choices; they
are not code or a complete coaching system supplied by the author.

| Article | General principle | Implemented adaptation |
| --- | --- | --- |
| [Moving From Beginner to Intermediate](https://www.tabletopbattles.com/blood-bowl-moving-from-beginner-to-intermediate), July 3, 2023 | Order useful actions around risk, avoid unnecessary contact, and treat re-rolls as a limited resource. | Useful guaranteed moves precede optional risky actions. Block estimates distinguish dice count, Block/Wrestle, Dodge/Tackle and activation traits. The last team re-roll is reserved on peripheral failures. |
| [How To Advance Your Cage](https://www.tabletopbattles.com/blood-bowl-how-to-advance-your-cage), September 4, 2023 | Keep early cage positioning flexible and protect it from direct contact. | Carrier destinations favour central space early. Marked cage corners receive less positional credit, and exposed carrier destinations are penalized. Existing escort and coverage scoring still applies. |
| [The Art of Game Management](https://www.tabletopbattles.com/blood-bowl-the-art-of-game-management), June 20, 2022 | Tactical aggression should serve the match situation; defending a lead differs from needing a defensive score. | Goal-side screening, restraint around contact, and deep defensive support are preferred ordinarily. A team behind late in the second half applies more carrier pressure and values offensive progress more urgently. |

## Action order and probability

Candidate actions have a utility estimate and an ordering priority. Scoring
opportunities come first. Escaping immediate carrier contact, clearing an
opponent off our carrier, and direct attacks against an imminent opposing
scorer or a necessary late ball recovery can override ordinary sequencing. Otherwise, useful actions estimated
to require no uncertain checks are completed before optional risky ones. High-value ball transfers can rank alongside safe positioning, while optional fouls are scheduled last; their separate reliability and value gates are documented in the risk policy.
Insignificant positional improvements are not enough to trigger an activation.

Route estimates use the engine's forecast targets and D6 success rule, weather,
pickup modifiers, Dodge/Tackle and Sure Hands. A small probability distribution
tracks remaining once-per-activation Dodge/Sure Feet uses across several checks.
It also accounts conservatively for Diving Tackle/Tentacles and common
activation traits. Planning never assumes a team re-roll will be available and
never consumes or previews actual match dice.

Block estimates use the engine's assists at the proposed attack square,
strength-based dice selection, unsafe faces and likely knockdowns. These are
advisory estimates, not a full simulation of every skill or reaction. They do
not completely model Frenzy follow-up blocks, optional modifiers, Pro, every
trait consequence or future opponent responses. The rules engine still
executes and validates every actual action.
An equivalent adjacent standing Block does not consume the team's Blitz.

## Resources and match context

Native skill re-rolls remain preferred when available. A single remaining
team re-roll is normally preserved on peripheral failures before turn seven,
but remains available for ball recovery, carrier actions, scoring attempts,
critical blocks and late attempts to recover a losing game. This is a bounded
policy rather than an optimal resource planner for all inducements and skills.

Screen scoring rewards standing between the opposing carrier and our end zone,
without blindly chasing behind the carrier or giving it cheap blocks. The last
deep defender receives additional positional value until another teammate
provides cover. This is geometric positional guidance, not an exhaustive enemy
reachability map or a guarantee that every breakthrough is covered.

## Edition and scope

These articles predate our BB2025 rules target. They inform strategic goals;
they do not replace current engine rules. In particular, this increment does
not introduce intentional eight-turn stalling from the older guides. Available
touchdowns are still taken, and current crowd/stalling rules remain intact.

This is shared coaching logic for Human/Orc computer exhibitions and observed matches.
Conservative passing, hand-offs and fouling were added in v0.0.54; see
[the risk policy](AI-RISK-POLICY.md). It does not unlock other opponent rosters or deliberate
chain pushes or a complete coordinated cage-advancement planner. Existing
field coverage and rear cage protection regressions remain in the test suite.

`tests/features/computer-strategy.test.cjs` verifies action sequencing, risky
final-turn scoring, reliability comparisons, re-roll conservation, early central
positioning, contact avoidance, both defensive directions and goal-side support.
The seeded full-match tests remain separate from tactical tests; neither is a
competitive win-rate benchmark or visual browser review.
