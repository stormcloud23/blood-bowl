# Mascots, Weather Mages and regeneration aids

These resources join the existing pregame menu and league funding checks. The page shows remaining uses separately from ordinary re-rolls and apothecaries.

| Resource | Pinned price / maximum | Availability and behavior |
| --- | --- | --- |
| Team Mascot | 25,000 gp / one | Once per match, attempt a 4+ check to grant a re-roll. Choose Mascot alone or an explicit team re-roll fallback. Successful grants require Loner when applicable. Ownership also automatically re-rolls a Cheering Fans natural one, even after the conditional re-roll was spent. |
| Weather Mage | 30,000 gp / one | At the start of an own turn, use it or retain it. Roll 2D6 and choose a weather reachable with a modifier from −2 through +2. A single reachable weather applies automatically. |
| Mortuary Assistant | 100,000 gp / one | Requires Masters of Undeath. Re-roll one failed Regeneration, including during the opponent's turn, without Loner. |
| Plague Doctor | 100,000 gp / one | Requires Favoured of Nurgle. One shared use for a failed Regeneration re-roll or apothecary treatment. |

Mascot attempts cannot re-roll the same test twice. A failed Mascot ends that re-roll attempt unless the coach selected the combined fallback beforehand. The fallback consumes a normal re-roll only when needed and retains the existing Brilliant Coaching/Leader priority. Pro may use a Mascot to re-roll Pro itself; it does not re-open the original die's re-roll window. The same source selection serves ordinary tests, Block pools, Multiple Block, bounded direction/distance rolls and Regeneration. Mascots cannot be used during kickoff Charge or the opponent's turn and do not replenish at halftime. Master Chefs do not steal Mascots.

Weather Mage choices are offered before an activation at the start of the owner's team turn. Spending the use is committed before rolling. Choosing unchanged weather still spends it. The pinned step sets the match's weather directly; it remains until another weather effect changes it. The Mage does not perform the kickoff event's airborne-ball scatter.

Available regeneration inducements take priority over ordinary re-roll sources. Declining an aid proceeds to ordinary treatment, rather than opening a second Regeneration retry. Mortuary Assistants take priority over Plague Doctors if a synthetic team has both rules. All initial Regeneration rolls in a medical group precede retries, and the coach can choose which failed wound to protect first. A re-rolled failure cannot be re-rolled again. Plague Doctor regeneration use also consumes its apothecary availability, and vice versa.

## Executable comparison and boundaries

Reference: `vendor/ffb` at `bf3f89d96b5143a8730910a841e7430791094492`:

- `ffb-common/.../factory/GameOptionFactory.java` and `inducement/bb2025/InducementCollection.java`: prices, caps, rule eligibility and usages.
- `ffb-server/.../mechanic/bb2025/RollMechanic.java`: Mascot 4+, Loner, explicit fallback and failed-Pro combinations.
- `ffb-server/.../step/bb2025/kickoff/StepApplyKickoffResult.java`: automatic Cheering Fans re-roll based on ownership.
- `ffb-server/.../step/bb2025/inducements/StepInitInducement.java` and `StepWeatherMage.java`: start-of-own-turn use and weather choices.
- `ffb-server/.../step/bb2025/shared/StepApothecary.java` and `mutliblock/StepApothecaryMultiple.java`: regeneration aid precedence, shared uses and grouped choices.
- `ffb-common/.../mechanics/bb2025/ApothecaryMechanic.java`: the pinned Plague Doctor treatment eligibility includes players beyond Journeymen. The browser follows that selected executable mechanic, without claiming the inducement name alone establishes printed eligibility.

The two demonstration rosters do not have the rules required to buy regeneration aids. Synthetic fixtures verify these resources until eligible rosters are added. Team Captain's additional resource-preservation mechanic, named coaching staff, wizards, prayers, mercenaries and remaining special roster inducements are separate work. This increment does not claim complete inducement or roster coverage.

Validation covers source selection, success/failure, explicit fallback spending, Loner, Pro, Block/Multiple Block, Regeneration groups, weather boundaries, coach ownership, resource eligibility and stale callback rejection. Embedded UI tests exercise ordinary and Block Mascot controls, Weather Mage decisions and both medical aids. Browser visual inspection remains unavailable because Work browser access is disabled.
