# Blood Bowl browser game

A self-contained browser game targeting **Blood Bowl 2025 matches and local league teams**, with rules behavior informed by the FFB Java engine.

**[Play on GitHub Pages](https://stormcloud23.github.io/blood-bowl/)** — no installation, Java server, or backend required. You can also open `index.html` locally.

## Visual review follow-up — October 30, 2026

**Updated October 31:** v0.0.16 addresses this review with workspace tabs,
contextual tile actions, hover/focus information, compact match decisions,
keyboard pitch navigation, adjustable pitch size, and clearer team/backup tools.
See [the workspace guide and validation scope](docs/UI-UX.md). The notes below
are retained as the original baseline findings.

Browser screenshots now work. A brief desktop review of the published v0.0.15
covered exhibition pregame, Block practice layout, and the empty league form
and roster table. This was not a complete interaction or accessibility audit.
No application code was changed during this review.

Priorities after the usage reset:

- Fix visible metadata: coverage shows “undefined partial / undefined deferred”;
  footer feedback version is v0.0.14 while the header is v0.0.15.
- Keep pitch and current actions closer together; shorten the large instruction
  paragraph into contextual help plus an expandable reference.
- Reduce pregame clutter from zero-valued resources and repeated staff text;
  make the current step and next action easier to find.
- Separate team creation, league creation, and backup tools. The blank backup
  textarea dominates the form and needs a visible label/help.
- Give relevant actions clearer emphasis in each practice mode; inspect small
  token numerals while preserving the readable palette and roster alignment.

Still to review visually: mobile/tablet wrapping and scrolling, keyboard focus
and pitch navigation, Block dice/push interactions, movement previews, populated
team creation/errors, and saved fixture/postgame flows. Existing automated tests
do not establish visual correctness. Detailed continuation notes are in the
workspace `HANDOFF.md`; work paused at 99% weekly usage.

## Complete roster catalogue — v0.0.19

All 30 rosters in the checked BB2025 team index are now available. Draft
them in Teams & leagues, inspect them in Rosters, or choose exhibition home
and away rosters in Play. See [roster data, team rules and scope](docs/ROSTERS.md).

Team Captain, Swarming, Low Cost Linemen and Masters of Undeath support are
included, along with shared Big Guy caps and saved league/alignment choices.

## Current capabilities

v0.0.25 extends [named stars](docs/STARS.md) with Morg, Fungus, Glart and the Swift Twins, and
corrects medical treatment of Zapped Frogs.
v0.0.24 adds [twelve named star players and unique abilities](docs/STARS.md).
v0.0.23 adds [Josef Bugman staff, KO recovery and Dwarfen Wisdom](docs/BUGMAN.md).
v0.0.22 adds [automatic underdog prayers and all sixteen effects](docs/PRAYERS.md).
[Wizards and mercenaries](docs/WIZARDS-MERCENARIES.md) include Fireball/Zap
targeting and funded temporary-player construction. Visual team
dugouts, Solid Defence redeployment and Riotous Rookies are included.
[The match-system audit](docs/MATCH-SYSTEM-AUDIT.md) records
verified scope and the remaining inducement gaps; inducements are not complete.

- Two-player hotseat play with 30 roster choices.
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
- Clickable gold push destinations after Blocks, including Sidestep and chain pushes; the pushed player has a red outline. Side-panel buttons remain available for crowd pushes and Stand Firm.
- **108 implemented, 0 partial, and 0 deferred** entries in the 108-skill/trait catalogue.

These coverage labels describe available actions and local roster/progression behavior, not complete FFB parity. [Insignificant and Violent Innovator](docs/LEAGUE-SKILLS.md) now cover draft restrictions and special-action casualty SPP, including documented pinned exceptions. Exhibition interactions and several match systems still need further verification. League teams and completed results save in browser storage with JSON export/import. Unfinished fixtures restart from pre-game after reload. Live match save/resume and AI are not implemented. See [team creation and progression](docs/LEAGUES.md).

## Build and verify

GitHub Pages serves the committed `index.html` from the root of `main`. Playing needs no build step. For development, use Node.js 24, matching CI:

```sh
node generate-skill-docs.cjs
node generate-roster-docs.cjs
node build.cjs
node --test *.test.cjs
git diff --check
```

The rules engines are `movement.cjs`, `skills.cjs`, and `match.cjs`; local roster management is in `league.cjs` and `league-ui.cjs`. The build embeds them into the standalone page. CI checks generated outputs and runs the regression/UI test suites.

## Planned features

1. Finish basic inducements, staff, relevant team rules and non-star exhibition verification.
2. Extend the team creator to more rosters and racial rules.
3. Add season scheduling, play-offs and off-season redrafting to local league progression.
4. Complete the remaining star players and their unique abilities.

Live match save/resume and a computer opponent are also planned.

## Rules and implementation references

Use [Blood Bowl Base BB2025](https://bloodbowlbase.ru/bb2025/) for rules as written and [FFB](https://github.com/christerk/ffb) for executable BB2025 behavior. The project's comparison policy and remaining gaps are documented in the [exhibition audit](docs/EXHIBITION-PARITY.md), [skill coverage](docs/SKILLS.md), and [FFB source map](docs/FFB-SKILL-MAP.md).

See [third-party notices](THIRD_PARTY_NOTICES.md) for FFB attribution and licensing.
