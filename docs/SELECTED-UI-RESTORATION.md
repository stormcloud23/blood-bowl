# Selected UI restoration — v0.0.44

Restored only the requested items from the numbered PR #58 list:

| Item | Restored behavior |
| --- | --- |
| 1 | Collapsed match setup with two-column desktop team settings |
| 2 | Team/opponent/alignment changes apply only after New exhibition match |
| 3 | Team values in a scoreboard disclosure, outside the coach's current task |
| 4 | Compact pregame checklist |
| 14 | No incidental tooltips during previews or pending decisions |
| 15 | Prominent deciding coach and known reacting player |
| 19 | Workspace URL reflects the tab and restores it after reload |
| 22 | Roster comparison table and one player inspector |
| 23 | Inline staff prices, submission consequences and league next steps |
| 25 | Unchanged league forms survive background match renders |
| 26 | Position inspection stays in Rosters with a close control |
| 27 | Expandable inline skill explanations, including parameterized names |
| 29 | Central category legend with Mutation, current roster copy and corrected Diving Catch summary |
| 30 | Visible mobile workspace tabs and one coach-choice scrolling region |
| 31 | Mobile roster cards expose cost, skills and attributes |

The unselected changes remain reverted. In particular: no new Move menu entry,
automatic pass targeting, extra commitment controls, shorter route summaries,
recent-action widget, compact/hidden dugouts, setup highlight changes, new die
explanations, Testing launcher restructuring, sticky spectator toolbar, quantity
recruitment, suggested-roster shortcut, changed backup/restore flow, or expanded
roster search.

## Delete custom teams

In Teams & leagues, select a saved team and expand **Delete custom team**.
The first Delete button opens a named review with Cancel and Confirm controls.
Confirmed deletion removes the team from saved-team selectors, exhibition custom
choices and new fixture scheduling. Teams participating in an active league
fixture must finish and record it first.

Deletion is recoverable: **Deleted teams** offers a Restore button. The team
record, players, league membership and past results are retained so deleting a
team cannot break league history or existing backups. Backups retain deleted
teams and their deletion state. A running exhibition uses its existing snapshot
and is not replaced by deleting its source saved team.

Existing version-1 backups remain compatible; the optional `deleted` flag is
validated. Deletion and restoration use the existing transactional save path,
including stale-tab and failed-storage protection. Stale deletion confirmations
cannot act on a different selected team.

## Verification

- Full suite: 1,529 passed, four long simulations skipped (1,533 total).
- Checks include deletion/restoration backup round trips, preserved results and
  finances, active-fixture blocking, failed-save rollback, stale confirmations,
  custom-selector cleanup without replacing a match, form preservation, staged
  configuration, tooltip suppression, and retaining unselected interaction flows.
- In-app browser: confirmed deletion/recovery on the disposable localhost team,
  with eleven players and treasury unchanged after restoring it; no browser errors.
  Confirmed desktop setup and inline roster inspection, plus mobile tabs/cards
  at 390 CSS pixels with no page-width overflow. Viewport override was reset.
