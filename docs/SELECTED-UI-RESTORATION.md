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

## Permanently delete custom teams or leagues

Select a custom team and expand **Delete custom team**, or open
**Backup & restore → Manage leagues** to delete an unwanted league. The first
Delete button opens a named review stating **This action cannot be undone**.
Cancel leaves storage unchanged; the separate Permanently delete button removes
records through the transactional save path. There are no restore controls.

Deleting a team removes its roster, league membership and associated saved
fixture records. Deleting a league removes the league and its fixtures but keeps
its custom teams. Links to removed fixtures are cleaned from surviving team
histories; surviving teams retain their earned player progress, finances and
career totals. Active fixtures and affected unfinished post-game work block
these operations to keep fixture snapshots and progression valid.

Legacy records hidden by the earlier recoverable-delete implementation are not
silently erased. **Backup & restore → Previously deleted teams** provides the
same irreversible confirmation to permanently clean them up; it offers no
restoration. New deletions do not create hidden/archive records. Old backups
remain readable. No new confirmation is needed to cancel a review.

## Verification

- Full suite: 1,536 passed, four intentionally skipped, zero failures.
- Checks include permanent deletion and legacy-backup compatibility, preserved results and
  finances, active-fixture blocking, failed-save rollback, stale confirmations,
  custom-selector cleanup without replacing a match, form preservation, staged
  configuration, tooltip suppression, and retaining unselected interaction flows.
- In-app browser: earlier placement/deletion checks used the disposable localhost team,
  with eleven players and treasury unchanged after restoring it; no browser errors.
  Confirmed desktop setup and inline roster inspection, plus mobile tabs/cards
  at 390 CSS pixels with no page-width overflow. Viewport override was reset.
