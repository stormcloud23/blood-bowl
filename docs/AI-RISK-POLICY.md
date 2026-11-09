# Computer risk policy — v0.0.54

The computer uses engine forecasts, never samples future dice, and executes every action through the ordinary rules engine. The new actions are candidates only after explicit value and reliability gates; they are not routine alternatives to running.

## Passes and hand-offs

- A guaranteed running touchdown wins over adding transfer risk.
- Scoring transfers include the receiver's ability to activate and reach the end zone this turn. Used receivers are considered only when already standing in the end zone. The combined score probability must improve on the carrier's running option by more than eight percentage points.
- Ordinary release/catch probability must be at least 78% for a Pass or 80% for a Hand-off. A last-turn attempt while tied or behind can accept a 30% combined chance to transfer and score if it improves on running the ball in.
- Non-scoring transfers require at least 86% release/catch reliability and either a major advance (at least five squares beyond the carrier's reliable running advance), or escape from pressure to an unmarked receiver protected by at least two allies when walking away is substantially less reliable.
- An 80% hand-off can also reach an unmarked receiver with at least two more squares of movement and a reliable route that gains at least two squares over the carrier's reliable running advance.
- Estimates include movement, common activation traits, passing and catch targets, weather, marking, native Pass/Catch/Dodge/Sure Feet rerolls, Animosity, current interception candidates and a conservative allowance for nearby On the Ball interception moves. For last-turn scoring transfers with a roll-free approach, the forecast can budget one available team re-roll across the pass and catch. Hail Mary passes are excluded.
- Pending dice and defensive decisions retain their owning coach. The computer can take interceptions itself and can resolve the existing re-roll prompts. Plans validate action type, target position and endpoint before releasing the ball; completed transfers cannot be replayed.

## Fouls

Fouls are scheduled after other valuable actions. A qualifying fouler is reserved rather than spending their activation on a minor positional move first.

The policy prefers low-value players (effective value no more than 80k) against valuable victims (at least 100k effective value, a 40k gap and a 1.6:1 ratio). Effective value starts from the current saved player value, falling back to roster cost, and adds tactical weight for high MA/AG, Block–Dodge/Wrestle combinations and Guard. Wardancers and Gutter Runners consequently receive high value without hard-coded player names.

Approaches are short, unmarked and estimated at least 98% reliable, with no risky movement. Ball carriers, adjacent cage guards, the sole goal-side defender and expensive players are protected. Chainsaw foulers and Saboteur victims are excluded from intentional foul planning.

Foul odds enumerate Armour and Injury dice without rolling them. The estimate includes offensive/defensive assists, Put the Boot In/Defensive interactions, Dirty Player, Sneaky Git, Iron Hard Skin, Stunty, Thick Skull and referee detection. A minimum removal chance and positive margin over expected send-off/player loss are required. Already-stunned victims receive less credit; numerical disadvantage increases the cost of losing the fouler. The policy does not assume a Bribe or successful argument will rescue the foul.

The actual engine continues to resolve all armour, injury, medical and referee choices. These estimates are a bounded heuristic, not a full search of opponent responses, inducement decisions or every named skill. They do not guarantee a particular result or competitive win rate.

## Verification

`tests/features/computer-risk.test.cjs` covers positive scoring/progress/escape transfers, rejected low-value and high-risk plays, both directions/halves, limits, used receivers, interrupts, failures and foul value trade-offs. Existing strategy/cage tests remain in place. Seeded full-match tests check progress, occupancy, action/turn bounds and the final whistle; UI tests exercise the actual bundled step controller.
