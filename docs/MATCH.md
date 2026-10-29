# Exhibition match sequence — v0.0.9

Rules reviewed October 28, 2026. Source: [The Game of Blood Bowl, 2025](https://bloodbowlbase.ru/bb2025/core_rules/the_game_of_blood_bowl/#pre-game-sequence), [general rules and turnover timing](https://bloodbowlbase.ru/bb2025/core_rules/rules_and_regulations/), and [2025 skills](https://bloodbowlbase.ru/bb2025/core_rules/skills_and_traits/). The existing Imperial Nobility and Black Orc demonstration rosters each have 11 players, 1 Dedicated Fan, 2 purchased team re-rolls, and no purchased coaches, cheerleaders, apothecaries, or inducements.

Select **Exhibition match — pre-game**. The match panel guides both hotseat coaches through each stage. Practice modes remain separate. **Learning match** uses the source's first-few-games option: equal fans, Perfect Conditions, and no Kick-off Event. It still runs setup, deviation, touchbacks, drives, and two halves.

| Rule area | Coverage | Automated scenarios |
| --- | --- | --- |
| Fans | D3 Fair-weather Fans plus 1 Dedicated Fan per demo team | Pre-game order and totals |
| Weather | All five conditions; actual rush, pickup, catch, interception and PA penalties; Blizzard range restriction | Weather checks, Sunny inaccurate pass, Blizzard failed rush |
| Journeymen / Inducements | Explicitly skipped because these pre-game steps apply to League Play | Exhibition step progression |
| Determine kicking team | D6 roll-off, repeat ties, winning coach chooses either team to kick | Tied roll-off and coach choice |
| Setup | Kicking coach first; field all available players up to 11; own half; three central LOS players or all if fewer; two per Wide Zone; suggested formation and manual relocation | Setup order, LOS, Wide Zones, short roster, change of ends |
| Kick | Legal backfield central kicker; target in receiving half; D6 distance and D8 direction; ball remains airborne during event | Kicker eligibility, legal aim, deviation, event-before-touchback |
| Landing / touchback | Unmodified direct catch, bounce penalty, bounce across LOS/off pitch creates touchback; receiving coach allocates ball; empty square fallback when no standing players | Catch without team re-roll, deviation/bounce touchbacks, empty fallback |
| Get the Ref | Records one Bribe for each team; Bribe decisions are available after send-off / Argue the Call | Event before touchback |
| TIME-OUT | Moves both turn markers forwards early, backwards when kicking marker is 6–8 | Early and late cases |
| Solid Defence | Up to D3+3 Open kicking players; manual redeployment; legal final formation required | Cap, eligible players, final constraints |
| High Kick | Optional Open receiver moves beneath an unoccupied valid landing square | Choice and successful catch |
| Cheering Fans | D6 per coach, no purchased staff; winner/ties get one additional offensive assist on their first Block next turn | Winning team bonus |
| Brilliant Coaching | D6 per coach, no purchased staff; winner/ties receive a free drive re-roll; consumed first and unused bonus expires | Bonus expiration |
| Changing Weather | New weather; Scatter (3) if Perfect Conditions; touchback on crossing LOS/off pitch | Airborne scatter and landing |
| Quick Snap | Up to D3+3 initially Open receivers move one square each, including into opposing half | One square, one move per player |
| Charge | Up to D3+3 initially Open kicking players; free Move, one Blitz, or one Throw Team-mate; fall/knockdown stops further activations; no normal turn consumed | Free activation, trait limits, failed rush stops event |
| Dodgy Snack | Losing coach/ties randomly select player; 2+ loses 1 MA/AV this drive, 1 removes to reserves this drive | Temporary stats expire |
| Pitch Invasion | D6 plus Fan Factor; losing coach/ties randomly select D3 players; stunned without armor | Contest and random stun |
| Team turns / halves | Eight turns per team per half; turnovers advance; two halves; change ends and replenish re-rolls at halftime; final score/draw | Full 32-turn match |
| Touchdown / restart | Scores, ends drive, scorer kicks next; inactive scorer skips next turn | Score and restart, opposition-turn scoring |
| Stalling | Detects safe no-dice scoring route at activation; crowd D6 at end if still carrying; knockdown causes turnover | Crowd, armor, bounce and turnover |
| Drive effects / recovery | Sweltering Heat excludes D3 random fielded players from each team next drive; KO recovery 4+; temporary snack/drive re-rolls expire; casualties stay unavailable | KO, heat, casualty retention, halftime |

## Boundaries

This is the match sequence around the implemented actions, not complete standalone rules coverage. Foul and several direct special actions are now available in v0.0.10. v0.0.11 adds Throw Team-mate, including Charge activations. Kick Team-mate and other deferred actions remain unavailable. Available Bribes can now prevent a send-off. See SKILLS.md for all 108 ability statuses. The supplied demo rosters have no Secret Weapons and no purchased apothecary or staff. End-of-drive Secret Weapon handling is now available for future rosters; apothecaries and purchased staff remain outside this prototype. League preparation/progression, roster management, extra time, penalties, concessions, and save/resume remain future work. Reloading resets the match. Physical passing-ruler interception geometry remains the documented approximation in MOVEMENT.md.

The sequence review also corrected Block activation traits and Wrestle: both wrestlers are Placed Prone before resolving a loose ball; this only causes a turnover if an active-team ball carrier was placed prone. A Player Down result credits the defender with the knockdown, allowing their applicable Mighty Blow.

## Development

`match.cjs` extends the existing action engine. `build.cjs` embeds both engines in the self-contained Pages document. Run `node build.cjs` and `node --test movement.test.cjs match.test.cjs`. The suites use injected dice and cover both source/bundle equality and browser-script compilation.

Validation: 93 tests pass across movement.test.cjs and match.test.cjs, including 30 match-sequence tests and the complete two-half turn progression.
