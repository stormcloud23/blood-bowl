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
activation traits. A touchdown run or a late carrier move into scoring range
can budget one currently available team re-roll. Other forecasts use native
re-rolls. Planning leaves the actual match dice untouched.

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

This is shared coaching logic for Human/Orc computer exhibitions, observed matches,
and computer-controlled league fixtures.
Conservative passing, hand-offs and fouling were added in v0.0.54; see
[the risk policy](AI-RISK-POLICY.md). Existing field coverage and rear cage
protection regressions remain in the test suite.

`tests/features/computer-strategy.test.cjs` verifies action sequencing, risky
final-turn scoring, reliability comparisons, re-roll conservation, early central
positioning, contact avoidance, both defensive directions and goal-side support.
The seeded full-match tests remain separate from tactical tests; neither is a
competitive win-rate benchmark or visual browser review.

Role and skill preferences were extended in v0.0.55; see [role awareness](AI-ROLE-AWARENESS.md) for specialist assignments, contact/receiving positions and movement-risk valuation.

## Scoring and drive evaluation

The coach compares a shortlist of roll-free carrier destinations within
scoring range. An escort move earns credit when it reduces an opposing Blitz
threat and improves the projected touchdown chance over the best unscreened
destination. The coach reassesses the board after the escort moves. Opposing
Blitz forecasts consider roll-free detours and one-die Both Down sacks. The
touchdown forecast uses the projected board before the opponent takes a turn.
Near the end zone, the carrier's route search compares legal paths by their
forecast success probability. This applies the pathfinding principle from
the [GrodBot paper](https://ieee-cog.org/2019/papers/paper_177.pdf) to this
game's own movement and re-roll rules.
The coach normally requires a 70% forecast for a direct touchdown run.
It will attempt a lower-probability route on the final turn when it needs
the score, following the timing principle in the
[Bot Bowl scripted-bot tutorial](https://njustesen.github.io/botbowl/bots-ii.html).

An unmarked receiver with at least two extra squares of movement can earn a
hand-off if the catch is reliable and the receiving route gains ground.
On receiving setups, the coach uses the legal formation's existing squares
and moves a suitable retriever into the backfield. Strong blockers fill the
line of scrimmage when the roster has a designated retriever.
Near the end zone, the route search retains both routes that collect a loose
ball and routes that leave it in place. On a final turn that needs a score,
the coach can choose a pickup and touchdown in the same activation.

Set `BB_FULL_MATCH_TESTS=1` and run
`node --test --test-name-pattern="seeded AI league fixture" tests/features/computer.test.cjs`
to replay the two default league fixtures. Set `BB_LEAGUE_SCORE_BATCH=1` for
the ten-seed Human–Orc batch. Set `BB_LEAGUE_MIXED_ROSTERS=1` to replace the
all-lineman lineups with positional lineups and two team re-rolls per side.
To replay a custom set, put comma-separated seeds in `BB_LEAGUE_SEEDS`.
Each result reports the score, touchdown timing, planned touchdown attempts,
closest approach to the end zone, possession losses, and how often a team
kept possession through the opponent's turn.

### Seeded league comparison

Scores list Humans first. The original and updated all-lineman runs used
the same rosters and seeds. The positional run is a separate benchmark
with mixed lineups and two team re-rolls per team. The table precedes
the trailing-team adjustment described below.

| Seed | Original all-lineman | Updated all-lineman | Updated positional |
| ---: | :---: | :---: | :---: |
| 7 | 0–0 | 0–0 | 0–1 |
| 19 | 1–0 | 1–0 | 0–0 |
| 33 | 0–0 | 0–1 | 0–1 |
| 42 | 0–1 | 0–1 | 0–1 |
| 71 | 0–0 | 0–0 | 0–1 |
| 101 | 0–0 | 0–0 | 1–0 |
| 137 | 0–0 | 0–0 | 1–0 |
| 251 | 0–0 | 0–0 | 0–0 |
| 509 | 0–0 | 0–0 | 1–0 |
| 927 | 0–0 | 0–0 | 1–0 |

Seed 33 recovered a loose ball and scored in the same activation on turn
eight. The positional games produced four Human wins and four Orc wins.
In this checkpoint the coaches converted eight of twelve planned scoring attempts. Both
teams attempted to score in two of the ten games, which points to creating
more attempts as the next bottleneck in this sample.

The earlier local coach checkpoint scored eight touchdowns from nineteen
attempts with these same positional rosters and seeds. Its seven scoring
games included one 1–1 draw. The updated coach spread the same touchdown
total over eight games, with more late scores and fewer attempts overall.

The follow-up gives the trailing carrier more reason to advance from
turn three of the second half. In a four-seed positional retest it changed
seed 7 from a 0–1 loss to a 1–1 draw and kept the other three scores.
