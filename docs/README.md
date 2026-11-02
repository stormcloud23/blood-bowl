# Documentation index

The [project README](../README.md) explains the repository layout, development
commands and generated files. The game is self-contained; these are reference
documents, not runtime dependencies.

## Start here

- [Current parity gaps](PARITY-GAPS.md): what remains and what existing tests prove.
- [Workspace and controls](UI-UX.md): navigation, match decisions and team tools.
- [Roster catalogue](ROSTERS.md) and [team creation / leagues](LEAGUES.md).
- [Star catalogue](STARS.md) and [completed catalogue scope](STAR-BACKLOG.md).

## Rules and feature groups

| Area | Guides |
| --- | --- |
| Movement and ball handling | [Movement](MOVEMENT.md), [Dodge / Footing](DODGE-FOOTING.md), [catch placement](CATCH-PLACEMENT.md), [reactions](REACTIONS.md) |
| Actions and damage | [Special actions](SPECIAL-ACTIONS.md), [Multiple Block](MULTIPLE-BLOCK.md), [casualties / treatment](CASUALTY-TREATMENT.md), [outlier skills](OUTLIER-SKILLS.md) |
| Match flow | [Match guide](MATCH.md), [passing / drive audit](PASSING-DRIVE-AUDIT.md), [match-system audit](MATCH-SYSTEM-AUDIT.md) |
| Staff and inducements | [Basic resources](BASIC-RESOURCES.md), [medical and other actions](INDUCEMENT-ACTIONS.md), [referees](REFEREES.md), [Wizards / mercenaries](WIZARDS-MERCENARIES.md), [prayers](PRAYERS.md), [Bugman](BUGMAN.md) |
| Stars | [Catalogue](STARS.md), [injury alternatives / pairs](STAR-INJURY-PAIRS.md), [v0.0.28 abilities](STAR-SPECIALS-28.md), [v0.0.29 abilities](STAR-SPECIALS-29.md) |
| Rosters and progression | [Rosters](ROSTERS.md), [leagues](LEAGUES.md), [league skills](LEAGUE-SKILLS.md) |

## Coverage and reference

- [FFB comparison policy](FFB-AUDIT.md), [exhibition coverage](EXHIBITION-PARITY.md),
  and [FFB skill source map](FFB-SKILL-MAP.md).
- [Generated skill coverage](SKILLS.md), rebuilt with `npm run docs`.
- [Development-only FFB oracle](../tools/README.md).
- [Historical README and review notes](archive/PROJECT-NOTES.md), retained for
  provenance. Its old commands, plans and counts describe previous versions.

Older feature documents preserve the scope of the increment they describe.
Use PARITY-GAPS and the current catalogue guides for current status. Existing
public document paths are preserved so published links continue to work.
