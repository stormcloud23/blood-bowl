# Blood Bowl browser game

A browser implementation targeting the Blood Bowl 2025 ruleset.

## Agreed scope

- Two human players taking turns in the same browser (hotseat).
- One human player against a computer opponent.
- Complete standalone matches first, followed by persistent league progression.
- Simple, readable visuals; rules completeness takes priority over animation.

Version 0.0.7 adds Blitz practice: declare a reachable opponent, move adjacent, choose Blitz Block (1 MA), resolve it, then continue moving. One Blitz is available per team turn, including any required rush for the block. Version 0.0.6 added Block and Secure the Ball practice. Block resolves eligible assists, Strength-based Block Dice, supported re-rolls, knockdowns, pushes, and follow-ups. Secure the Ball permits a free move to a safe loose ball and uses the special 2+ pickup roll. The two-click movement preview remains available. The practice drive still supports the Imperial Nobility and Black Orc profiles; it is not a complete match. See [action coverage and limitations](docs/MOVEMENT.md) and [roster coverage](docs/ROSTERS.md).

Open https://stormcloud23.github.io/blood-bowl/ to test published versions. GitHub Pages publishes from the root of main. The self-contained index.html needs no build step and can also be opened locally. Each published prototype shows its version number.

Repository: https://github.com/stormcloud23/blood-bowl

See [the development roadmap](docs/ROADMAP.md).

