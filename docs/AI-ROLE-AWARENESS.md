# Computer role and skill awareness — v0.0.55

Role tags come from the current roster profile's comma-separated traits, rather than the player's name or team. Blitzer, Blocker, Thrower, Runner, Catcher and Big Guy tags provide bounded preferences. Disabled skills do not receive capability bonuses. Reliability, legal actions, scoring and the existing transfer/foul value gates remain part of every decision.

## Assignments

- Blitzers receive a small Blitz preference; Blockers prefer ordinary blocks. Block, Wrestle, Horns, Juggernaut, Mighty Blow, Tackle against Dodge and Strip Ball against a vulnerable carrier contribute target-specific affinity.
- A specialist with a valuable attack estimated at least 90% reliable can be reserved for it rather than spending the activation on a minor positioning move. A substantially more valuable positional move can still override that reservation, as can carrier duties and scoring.
- Thrower tags and passing skills increase passing affinity after the transfer passes the existing risk/value gates. They also improve the player's suitability for collecting or receiving the ball. A tag cannot create an otherwise unjustified pass.
- Runners and Catchers receive carrier preferences alongside actual MA, AG, Sure Hands, Dodge and Extra Arms. Touchback choices and loose-ball recovery consequently favor suitable specialists. Runners modestly favor downfield advancement while carrying.

## Positions and movement

Blockers, Guard players, strong players and Big Guys value useful contact and assistance positions. Inferior-strength contact and multiple-opponent exposure receive less credit. Cage protection, existing zone coverage and defensive depth continue to contribute to the position score.

Runners, Catchers and players with Catch value unmarked receiving space ahead of a friendly carrier when other support is available. The preference is capped so it does not pay the entire team to abandon the carrier.

Movement penalties now reflect the survival improvement supplied by native Dodge, Sure Feet and Sure Hands rerolls. The existing probability calculation still tracks once-per-activation uses. A spent Dodge reroll or opposing Tackle removes the relevant discount; a role label alone does not make dodging safer. Forecast results are cached within a planning pass and never alter match state or inspect future dice.

## Block forecasts

Block odds are evaluated on a separate board with the actor at the proposed contact square. Horns adds its actual Blitz strength bonus, Juggernaut changes Blitz Both Down safety, and Tackle/Wrestle affect applicable knockdown outcomes. Wrestle's Both Down result is valued more highly when it can dislodge the opposing carrier. Actual actions and conditional tests remain engine-owned.

This is a bounded extension to the existing heuristic, not complete planning for every named skill or future opponent response. Role preferences are small enough for strength, risk and tactical value to prevail.

## Verification

`tests/features/computer-roles.test.cjs` covers comparable specialist assignments, stronger non-specialists beating unsuitable tagged players, active contact positioning, Guard support, pickup/touchback jobs, receiving positions, native reroll availability, a real Dodge escape, actual Horns block parity, disabled skills, score safety gates and planning without dice/state mutation. Existing cage, strategy and transfer/foul regressions are retained, along with seeded full-match checks.
