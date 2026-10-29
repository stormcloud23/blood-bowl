# Blood Bowl browser game

A browser implementation targeting the Blood Bowl 2025 ruleset.

## Agreed scope

- Two human players taking turns in the same browser (hotseat).
- One human player against a computer opponent.
- Complete standalone matches first, followed by persistent league progression.
- Simple, readable visuals; rules completeness takes priority over animation.

Version 0.0.4 adds movement range forecasts, lowest-movement-point routes, numbered waypoints, and required roll previews. Select a player to see reachable squares, choose a waypoint, then commit one step at a time or move through that waypoint. Dice are rolled only when movement is committed. The practice drive still supports the Imperial Nobility and Black Orc profiles; it is not a complete match. See [movement coverage and limitations](docs/MOVEMENT.md) and [roster coverage](docs/ROSTERS.md).

Open https://stormcloud23.github.io/blood-bowl/ to test published versions. GitHub Pages publishes from the root of main. The self-contained index.html needs no build step and can also be opened locally. Each published prototype shows its version number.

Repository: https://github.com/stormcloud23/blood-bowl

See [the development roadmap](docs/ROADMAP.md).

