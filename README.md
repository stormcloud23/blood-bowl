# Blood Bowl browser game

A self-contained **Blood Bowl 2025 browser game** with local teams and league
progression. Rules behavior follows the selected FFB BB2025 executable sources.

**[Play on GitHub Pages](https://stormcloud23.github.io/blood-bowl/)**, or open
`index.html` locally. Playing requires no installation, Java server or backend.

## Project layout

```text
src/
  engine/           Movement, skills and match rules
  features/league/  Team records, league progression and league controls
  ui/               Main app controls, workspace navigation and styling
  data/             Curated roster catalogue
  index.template.html  Editable page shell and build placeholders
scripts/            Standalone-page build and documentation generators
tests/
  build/            Published-page reproducibility
  rules/            Match actions, reactions and resources
  stars/            Named player abilities and lifecycle scenarios
  features/         League, roster and team-rule scenarios
  ui/               Actual bundled browser controls in DOM harnesses
  fixtures/         Committed FFB-derived reference data
  helpers/          Shared test file-path utilities
docs/               Feature guides, rules references and parity audits
tools/              Optional development-only FFB comparison tools
index.html          Generated, committed GitHub Pages application
```

Edit files under `src/`, then rebuild. **Do not edit the generated `index.html`
directly.** The build embeds the source, data and styles into that one file, so
GitHub Pages and downloaded copies remain self-contained.

## Develop and verify

Use Node.js 24 with its bundled npm, matching CI. There are no package dependencies
and no install step is required.

```sh
npm run build     # Rebuild index.html from src/
npm run docs      # Regenerate skill and roster documentation
npm test          # Discover and run all nested test suites
npm run check     # Regenerate docs, rebuild the app, and run all tests
```

Run commands from the repository root. The build and documentation scripts also
resolve their files relative to the repository when invoked from another folder.
To run a focused suite:

```sh
node --test tests/rules/movement.test.cjs
node --test tests/stars/remaining-stars.test.cjs
```

Commit generated `index.html`, `docs/SKILLS.md` and `docs/ROSTERS.md` alongside
source changes. CI rebuilds these outputs, rejects unexpected generated changes,
and runs the full rules/UI suite. Keep `git diff --check` clean.

## Playing and testing

Play starts full exhibition matches or opens Teams & leagues for league fixtures.
Each exhibition side has separate preset and submitted custom team dropdowns.
A custom choice overrides the preset; selecting a preset switches back.

During drive setup, select a player and click a team-mate to swap their positions.
A selected reserve replaces the clicked fielded player; empty squares still move
the selected player normally.

To stand a prone player without moving, click once to select them and again on
the same player, or choose **Stand up in place**. This begins a normal Move with
the usual stand-up costs/checks; remaining movement is available and limited team
actions such as Blitz and Pass are preserved.

Skill and reaction destinations, including On the Ball and Trickster, are
highlighted and selected directly on the pitch. Exhibition pregame/setup shows
full player-plus-staff TV, with CTV and inducement values labelled separately.
See [pitch choices and value details](docs/PITCH-CHOICES.md).

During kickoff On the Ball reactions, the deviated landing point stays visible
with the ball symbol. Eligible reactors stay bright while other players fade.
Kick aiming uses a square highlight and second-click confirmation without a
popup over the target.

For solo exhibitions, choose **Computer · Human team** or **Computer · Orc team**
in Match setup, then **New exhibition match**. Selections apply when you start
the match. You coach home; the computer coaches the away preset team.
Choose its speed, pause/resume, or take over its team during the match. This basic
opponent uses a ground game, blocks and Blitzes; it does not pass or buy optional
inducements. League games remain hotseat. See [computer opponent](docs/COMPUTER.md).

Computer positioning rewards distinct tackle-zone coverage and all four cage
corners around its carrier, with diminishing returns for extra nearby players.
Action and decision updates preserve the page position.
The coach also orders useful safe actions before optional risks, considers common
skill re-rolls and block reliability, and adjusts defensive pressure to the score
and clock. See [strategy sources and limits](docs/AI-STRATEGY.md).

Testing contains the learning match, skills laboratory and all practice drills.
It also includes **Watch a computer match**: choose Human or Orc for each side
and start watching a full match between two computer coaches. Pause to inspect
players, step one action at a time, or change the playback speed. Both coaches'
latest actions are shown. Observations do not change saved teams or leagues.
Choose a mode and press **Start testing mode**. Switching workspace tabs preserves
the current game; starting another game or mode replaces it.

Reference includes the current playing guide, a BB2025 rules cheat sheet and
searchable explanations for all 108 skills and traits. All reference content is
bundled for offline use.

## Current scope

- Regulation two-half exhibition matches, practice modes and a skills laboratory.
- Submitted saved teams in exhibition selectors, with CTV-based inducement purchases when both teams are saved. Exhibitions leave saved team records and Treasury unchanged.
- Thirty curated rosters and 67 named stars across 64 hiring selections.
- Staff, inducements, Wizards, mercenaries and all sixteen underdog prayers.
- Team drafting, saved local leagues, fixtures, progression and JSON backups.
- Hotseat play and a local computer opponent for Human/Orc preset exhibitions,
  with coach-owned decisions and re-rolls.

The checked catalogues are complete; exhaustive FFB parity is not established.
Live match save/resume, stronger AI, concessions/extra time/penalties, broader competition
settings, fuller season/redraft rules and interaction audits remain. See the
[current parity gaps](docs/PARITY-GAPS.md).

## Documentation and sources

Start with the [documentation index](docs/README.md) for guides, rule groups,
audit scope and historical notes. Optional source comparison tools are described
in [tools/README.md](tools/README.md). The former one-time roster-import scripts
were removed because they required untracked work-session files; the curated
roster data and its tests remain versioned.

[Blood Bowl Base BB2025](https://bloodbowlbase.ru/bb2025/) supplies published
profiles and rules wording; [FFB](https://github.com/christerk/ffb) supplies the
executable BB2025 comparison baseline. See [third-party notices](THIRD_PARTY_NOTICES.md)
for attribution and licensing.
