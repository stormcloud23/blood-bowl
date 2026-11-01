# BB2025 roster catalogue

The catalogue now includes Imperial Nobility, Black Orcs, **Skaven**, **Dwarf**,
**Lizardmen** and **Elven Union**. All six can be drafted for local leagues or
selected independently for the home and away sides of an exhibition. Changing
an exhibition selection restarts that exhibition. Practice drills retain the
original two fixtures. Existing league backups keep their original roster IDs.

`rosters.json` is the catalogue source; `build.cjs` embeds it in the standalone
page. The separate original `team-data` fixture remains for practice and older
test scenarios. Match engines always receive two active teams, not the catalogue.

Profiles were checked on October 31, 2026 against these BB2025 roster tables:

- [Skaven](https://bloodbowlbase.ru/bb2025/teams/Skaven/)
- [Dwarf](https://bloodbowlbase.ru/bb2025/teams/Dwarf/)
- [Lizardmen](https://bloodbowlbase.ru/bb2025/teams/Lizardmen/)
- [Elven Union](https://bloodbowlbase.ru/bb2025/teams/Elven_Union/)

The data uses the 2025 profiles, prices, caps and advancement access, including
two Stab Gutter Runners, Defensive Dwarf linemen, Diving Tackle Dwarf blitzers,
Juggernaut/Unsteady Saurus, and Fumblerooski Elf linemen. Each demonstration
lineup has eleven players and fits a million-gold draft with two re-rolls.
All starting skills map to existing implemented catalogue entries.

Dwarfs use the existing Brawlin' Brutes SPP awards (2 per touchdown and 3 per
eligible casualty) and Bribery and Corruption discounts/argument re-roll. The
other three additions have no roster-wide special rule in the checked tables.
Deathrollers are available in the team builder even though the demonstration
lineup omits one. Named stars and unimplemented inducements remain out of scope.

Humans and Orcs were researched but are not added in this batch: their Team
Captain resource-preservation behavior still needs implementation. A complete
skill catalogue does not imply every roster-wide rule is implemented.

Tests cover draft budgets, positional limits, save/reload compatibility, match
snapshots, ability coverage, Dwarf resource/SPP behavior, actual team-creation
controls, exhibition selection and reset isolation. This is not an exhaustive
FFB interaction audit for the newly available skill combinations.
