# Blood Bowl browser game

A self-contained browser game targeting **Blood Bowl 2025 matches and local league teams**, with rules behavior informed by the FFB Java engine.

**[Play on GitHub Pages](https://stormcloud23.github.io/blood-bowl/)** — no installation, Java server, or backend required. You can also open `index.html` locally.

## Current capabilities

- Two-player hotseat play with Imperial Nobility and Black Orc teams.
- A team creator with draft budgets, positional limits, staff, saved rosters and local league entry.
- Persistent match results, SPP, injuries, skills, characteristic advances, recruitment, finances and standings.
- Guided exhibition flow through pregame, setup, kickoff, two halves, scoring, drive recovery, and full time.
- Movement previews that prefer safer routes, explicit shortcuts and waypoints, and per-step risk highlights.
- Movement, Blocks, Blitz, passing, interceptions, fouls, thrown/kicked players, and supported special actions.
- Ball & Chain movement/collisions, Bloodlust feeding, and recursive bomb throws with grouped blast treatment.
- Multiple Block with two committed attacks, coach dice choices and grouped injury treatment.
- Configurable staff and basic inducements, kickoff staff bonuses, Keg recovery, Master Chefs, Biased Referees, and Bribery and Corruption.
- Grouped end-of-drive Secret Weapon arguments and Bribe allocation.
- Team Mascot re-roll choices, Weather Mages, and rule-gated Mortuary Assistants / Plague Doctors.
- Casualty results, pregame team apothecaries, Regeneration treatment, Decay and Plague Ridden reserves.
- Coach-controlled re-rolls and reaction choices, plus a skills laboratory and practice drills.
- **106 implemented, 0 partial, and 2 deferred** entries in the 108-skill/trait catalogue.

These coverage labels describe available actions, not complete FFB parity. The two deferred entries chiefly require roster/progression work; exhibition interactions and several match systems still need further verification. League teams and completed results save in browser storage with JSON export/import. Unfinished fixtures restart from pre-game after reload. Live match save/resume and AI are not implemented. See [team creation and progression](docs/LEAGUES.md).

## Build and verify

GitHub Pages serves the committed `index.html` from the root of `main`. Playing needs no build step. For development, use Node.js 24, matching CI:

```sh
node generate-skill-docs.cjs
node build.cjs
node --test *.test.cjs
git diff --check
```

The rules engines are `movement.cjs`, `skills.cjs`, and `match.cjs`; local roster management is in `league.cjs` and `league-ui.cjs`. The build embeds them into the standalone page. CI checks generated outputs and runs the regression/UI test suites.

## Planned features

1. Finish basic inducements, staff, relevant team rules and non-star exhibition verification.
2. Extend the team creator to more rosters and racial rules.
3. Add season scheduling, play-offs and off-season redrafting to local league progression.
4. Add star players and their unique abilities late, once the core systems are largely complete.

Live match save/resume and a computer opponent are also planned.

## Rules and implementation references

Use [Blood Bowl Base BB2025](https://bloodbowlbase.ru/bb2025/) for rules as written and [FFB](https://github.com/christerk/ffb) for executable BB2025 behavior. The project's comparison policy and remaining gaps are documented in the [exhibition audit](docs/EXHIBITION-PARITY.md), [skill coverage](docs/SKILLS.md), and [FFB source map](docs/FFB-SKILL-MAP.md).

See [third-party notices](THIRD_PARTY_NOTICES.md) for FFB attribution and licensing.
