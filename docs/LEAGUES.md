# Teams and local league progression

Use **Create a team / manage league progression** above the pitch. Draft Imperial Nobility or Black Orcs, submit a legal roster, create a league and enter the team. Select two entered teams to play a fixture. After full time, nominate six participants per coach for MVP and save the result. Develop the roster, then finish post-game preparation before its next fixture.

## Drafting comparison

The [BB2025 drafting rules](https://bloodbowlbase.ru/bb2025/core_rules/drafting_a_blood_bowl_team/) supply the roster-management rules. The initial budget is 1,000,000 gp; rookie teams need 11–16 players and must respect positional allowances. Re-rolls cap at eight; assistant coaches and cheerleaders at six each. One apothecary costs 50,000 gp. Fans start at one and can reach three during drafting for 5,000 gp per increase. Treasury and fans are excluded from TV. CTV excludes unavailable players. Later re-roll purchases cost double but retain their normal TV contribution; purchased re-rolls cannot be removed. Player releases cannot leave fewer than eleven eligible players.

The existing position profiles and roster prices are reused, including their primary/secondary access. New rosters can be added to the roster data without another team-specific builder. New racial rules still require engine work and verification.

## FFB comparison and implementation boundary

Pinned reference: `vendor/ffb`, commit `bf3f89d96b5143a8730910a841e7430791094492`. The Java match engine records results and exports them to its host; it is not the browser's roster-management backend. The [BB2025 league rules](https://bloodbowlbase.ru/bb2025/core_rules/league_play/) supply advancement and post-game management where FFB delegates to its host.

Reference paths under FFB:

- `ffb-common/src/main/java/com/fumbbl/ffb/mechanics/bb2025/SppMechanic.java`: ordinary and Brawlin' Brutes awards.
- `ffb-server/src/main/java/com/fumbbl/ffb/server/InjuryResult.java`: opposing casualties generate credit independently of lasting treatment outcomes.
- `ffb-server/src/main/java/com/fumbbl/ffb/server/step/bb2025/pass/StepEndPassing.java`: accurate completion at the pass coordinate. Off-target Diving Catch does not earn completion credit under the pinned behavior.
- `ffb-server/src/main/java/com/fumbbl/ffb/server/step/bb2025/ttm/StepRightStuff.java`: successful landing and Superb Throw statistics.
- `ffb-common/src/main/java/com/fumbbl/ffb/skill/bb2025/ViolentInnovator.java`: special-action casualty permission. Ordinary fouls earn no credit.

The pinned FFB ownership behavior allows Frenzy and Multiple Block on the same player, although they cannot be used together. The builder preserves that existing project decision despite the printed restriction.

## Progression and persistence

`league.cjs` owns versioned roster records, membership, fixtures and post-game changes. `league-ui.cjs` supplies the browser controls; `build.cjs` embeds both in the standalone HTML. No server or runtime dependencies were added.

Match statistics are separate from the capped display log and use permanent roster IDs. A match result commits both teams together. MVP validation precedes dice, and duplicate submissions cannot apply awards twice. Final effective casualties determine lasting injuries; treatment does not remove earned casualty credit. Existing MNG clears after the missed fixture, while new injuries affect the next one. Dead/eaten players move to the archive. Journeymen can be retained after the match.

Post-game includes winnings, fans, skills, characteristic improvements, recruitment, releases, temporary retirement, Expensive Mistakes and updated values. Random advances deduct SPP and save their rolled options before selection, so reopening the page cannot reroll them for free. Required advances block the next fixture. Match inducements follow CTV order, with Petty Cash and Treasury limits, using the supported inducement catalogue. The higher team's purchases lock before the lower team's choices.

Data saves under `blood-bowl-leagues-v1` in browser storage. Export/import uses JSON. Storage failures are reported and changes roll back. A stored active fixture can restart from pre-game after reload; live match decisions and callbacks are not serialized. Keep a backup when moving between browser profiles, origins or computers.

## Scope and validation

Local membership, manually selected fixtures, result history and basic standings are supported. Automated season scheduling, divisions, play-offs, prizes, concessions, off-season recovery/redrafting, remote league sharing and AI remain separate work. The official league format recommends at least four teams; local fixture testing also allows two. Existing exhibition gaps and unimplemented inducements/star content remain documented in the exhibition audit. The skill catalogue labels are deliberately conservative and do not certify every progression interaction or future roster.

Validation adds deterministic roster/progression scenarios and tests executing the actual embedded UI, including persistence/reload and a completed result. No automated Java differential runner or visual browser inspection was performed; Work browser access is disabled. Existing match regressions remain required.
