# Additional star abilities in v0.0.28

The catalogue grows from 22 to **48 named players**, through **45 hiring
entries**. The first group and shared injury/carry architecture are documented
in [STAR-INJURY-PAIRS](STAR-INJURY-PAIRS.md). All rules comparisons use selected
BB2025 executable behavior at FFB `bf3f89d96b5143a8730910a841e7430791094492`.

| Added player | Implemented behavior |
| --- | --- |
| Ivan Deathshroud | Dwarven Scourge: +1 armour/injury alternative, +2 against the Dwarf keyword; Frogs do not retain the original Dwarf identity for this bonus. |
| Skitter Stab-Stab | Master Assassin: failed Stab armour re-roll, computed before ordinary injury and offered as a guarded once-game choice. |
| Helmut Wulf | Old Pro: one automatically selected armour die is re-rolled speculatively, then Pro resolves. Failed Pro discards the alternative and preserves Old Pro, but spends that turn's Pro. Includes Chainsaw, self-inflicted kickback, Block and Foul windows, including spotted doubles. Pro retries use normal resources/Loner. |
| Rashnak Backstabber | Toxin Connoisseur: +1 to the same Stab injury dice if it changes the result; never offered on an already-casualty result. |
| Wilhelm Chaney | Savage Mauling: independent injury re-roll, including applicable Foul windows; selected injury doubles determine send-off eligibility. Unselected casualties grant no credit. |
| Gretchen Wächter | Incorporeal: no Dodge checks for the chosen activation. Rush and Jump remain; ordinary non-Jump departures therefore do not open Dodge/Tentacles/Diving Tackle windows under the selected FFB movement path. |
| Gloriel Summerbloom | Shot to Nothing: temporary Hail Mary Pass for a Pass activation, with normal HMP accuracy/scatter restrictions. |
| Roxanna Darknail | Slashing Nails: optional once-half Claws for the Blitz activation; expires after its Frenzy chain and activation. |
| Kreek Rustgouger | I'll Be Back!: automatically ignores the first eligible Secret Weapon send-off, consuming no argument or Bribe. Does not rescue an ordinary foul send-off. |
| Hakflem Skuttlespike | Treacherous: take an adjacent standing teammate's ball before movement, then resolve the pinned Stab injury type without turnover. A holding armour result leaves the teammate standing, despite the broader printed knockdown wording. Declining permits use later before movement. |
| Boa Kon'ssstriktr | Look Into My Eyes: adjacent opposing standing holder, Foul Appearance first, then 2+ with normal re-rolls. Success transfers possession and ends the activation; an ordinary failure spends the use but permits the declared action to continue. |
| Count Luthor | Star of the Show: optional once-game touchdown reward, one Team re-roll for the following drive, expiring at its end. |
| Skrorg Snowpelt | Pump Up The Crowd: automatic once-game Team re-roll for a committed active-team Block casualty while Skrorg is not prone/stunned; expires at current drive end. |
| Withergrasp Doubledrool | Watch Out!: Dodge treatment for the first opposing Block each **half**, following pinned `SkillUsageType.ONCE_PER_HALF`, rather than the published drive wording. Tackle cancels it. First-Block consumption includes Foul Appearance cancellation. |
| Jordell Freshbreeze | Swift As The Breeze: optional post-roll rescue of Dodge/Jump/Rush, including a re-rolled die and Diving Tackle look-ahead. Natural one still fails; no additional roll is granted. |
| Rowana Forestfoot | Bounding Leap: choose before movement dice; ignore Jump modifiers through the initial die, optional personal re-roll and Diving Tackle response. The game use is marked by the Jump roll, so a failed Rush before it does not spend the use. |
| Grashnak Blackhoof | Gored By The Bull: selected Blitz enhancement adds a die to eligible positive one/two-die pools, including the second Frenzy pool; max three. Pinned `ServerUtilBlock.findNrOfBlockDice` does not add to signed uphill pools. A pool already at three does not spend the use. |
| Cindy Piewhistle | All You Can Eat: commit before the first bomb; after its resolution, the original Cindy must throw the second if still eligible and no turnover occurred. Then a 4+ test avoids ejection; normal re-rolls/Loner and repeated Bribes apply, with **no Argue the Call** window. First-bomb interruption spends the use but skips the second-bomb penalty. |

Temporary effects never rewrite the saved roster or permanent star profile.
Once-game uses persist through halftime; specified once-half uses renew.
The normal star purchase, funding, paired roster-slot, duplicate-cancellation,
Secret Weapon, MVP and postgame boundaries continue to apply.

## Executable source groups

- `skill/bb2025/special`: DwarvenScourge, MasterAssassin, Incorporeal,
  SlashingNails and PumpUpTheCrowd; selected mixed special definitions for
  the other abilities above.
- Server `injury/modification`: AvOrInjModification, OldProModification,
  SavageMaulingModification; BB2025 MasterAssassin/ToxinConnoisseur adapters.
- BB2025 `StepTreacherous`, `StepInitLookIntoMyEyes`, `StepLookIntoMyEyes`,
  `StepInitSelecting`, `StepSelectBlitzTarget`, `StepEndTurn` and
  `block/StepBlockChoice`, `StepEndBlocking`, `StepBlockRoll`.
- `util/ServerUtilBlock`, `util/bb2025/DodgeModifierSelectionService`,
  `JumpModifierSelectionService`, BB2025 `move/StepJump`,
  `mechanic/bb2025/StateMechanic`, `special/StepEndBomb` and selected mixed
  `pass/StepAllYouCanEat`.

Profile data was checked against the corresponding pages in the
[BB2025 player catalogue](https://bloodbowlbase.ru/bb2025/starplayers/).
Only profile facts, ability names and implementation summaries are retained.
FFB executable behavior takes precedence where wording differs.

Deterministic rules tests and actual bundled UI tests cover selected effects,
ownership, use/decline, timing, re-rolls and stale callbacks. Eighteen lifecycle
cases collectively field all 48 named players through regulation match
transitions. They do not prove every possible combination or full FFB parity.
No new desktop/mobile visual inspection is claimed for this increment.
