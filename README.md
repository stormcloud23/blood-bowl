# Blood Bowl browser game

A browser implementation targeting the Blood Bowl 2025 ruleset.

**v0.0.14** ports selected FFB BB2025 rules into the existing browser engine. It corrects Pro usage and failed-Pro re-rolls, optional Break Tackle decisions, Iron Hard Skin injury interactions, Lone Fouler/send-off/Bribe sequencing, re-roll pool priority, and stalling when ending a turn without activating the carrier. Strong Arm and Bullseye are newly available in the skill laboratory. The game remains self-contained for GitHub Pages: no Java, backend or external runtime is needed. See [the FFB comparison](docs/FFB-AUDIT.md), [the 108-skill source map](docs/FFB-SKILL-MAP.md), and [third-party notices](THIRD_PARTY_NOTICES.md).

Build with `node build.cjs` and verify with `node --test *.test.cjs`. Skill coverage is now **78 implemented, 3 partial, 27 deferred** within the available actions. This release does not complete all match rules, saved games, AI or leagues.

## Agreed scope

- Two human players taking turns in the same browser (hotseat).
- One human player against a computer opponent.
- Complete standalone matches first, followed by persistent league progression.
- Simple, readable visuals; rules completeness takes priority over animation.

v0.0.13 adds waypoint movement previews: selecting a tile shows the remaining range from there, additional clicks extend the planned route, and **Cancel movement preview** restores the range from the player's current position. Previewing spends no movement and rolls no dice. Committing follows the displayed steps.

Local v0.0.12 changes movement highlights to show the check on each individual arrival step. A dodge early in a route no longer turns later no-roll tiles amber. Selected routes show their actual step checks; hover text and accessible labels explain them. Green tiles can still require risky earlier steps; the route preview lists all required checks.

Local v0.0.11 adds **Throw Team-mate, Right Stuff, and Always Hungry**, completing the starting abilities on the two demo rosters. Select **Throw Team-mate practice**, declare the throw, choose the Goblin in the side panel, then click a highlighted target twice. Scatter, fumbles, collisions, landing, crowd injury, Troll eating, carried balls, and scoring are supported. Coverage now totals **76 implemented, 3 partial, 29 deferred**. Run `node build.cjs` followed by `node --test movement.test.cjs match.test.cjs skills.test.cjs throw-ui.test.cjs` to verify the self-contained page and engines.

Version 0.0.10 audits all 108 skills/traits: 73 implemented, 3 partial, 32 deferred with individual dependency notes. Select Skills laboratory to add supported abilities to practice players. Optional skill controls, Foul, direct special actions, and the in-app coverage inventory are included. See [skills and traits coverage](docs/SKILLS.md). Version 0.0.9 added a guided exhibition match from pre-game fans/weather and kick/receive choice through legal setup, kickoff events, touchbacks, team turns, touchdowns, drive recovery, halftime, and full time. See [match sequence coverage](docs/MATCH.md) for rules and limits. Individual practice drills remain available. Games reset on reload. Version 0.0.8 added Hand-off and Pass practice, range and catch previews, interceptions, inaccurate scatter, fumbles, and Give and Go continuation. Declare an action, move as needed, then choose a ball target; click once to preview and again to commit. Version 0.0.7 added Blitz practice: declare a reachable opponent, move adjacent, choose Blitz Block (1 MA), resolve it, then continue moving. One Blitz is available per team turn, including any required rush for the block. Version 0.0.6 added Block and Secure the Ball practice. Block resolves eligible assists, Strength-based Block Dice, supported re-rolls, knockdowns, pushes, and follow-ups. Secure the Ball permits a free move to a safe loose ball and uses the special 2+ pickup roll. The two-click movement preview remains available. The practice drive still supports the Imperial Nobility and Black Orc profiles; it is not a complete match. See [action coverage and limitations](docs/MOVEMENT.md) and [roster coverage](docs/ROSTERS.md).

Open https://stormcloud23.github.io/blood-bowl/ to test published versions. GitHub Pages publishes from the root of main. The self-contained index.html needs no build step and can also be opened locally. Each published prototype shows its version number.

Repository: https://github.com/stormcloud23/blood-bowl

See [the development roadmap](docs/ROADMAP.md).
