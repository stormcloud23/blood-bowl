# UX audit implementation

This pass addresses the observed friction in
[the visual audit](UX-VISUAL-AUDIT-2026-11-02.md). Changes are in presentation,
event wiring and league form transactions; the match rules engine is unchanged.

## Match and practice workspace

| Audit | Change |
| --- | --- |
| 001–002 | Match configuration is collapsed by default and opens as balanced desktop columns. Team/opponent/alignment edits are staged; only New exhibition match starts the replacement. |
| 003–004 | Current pregame/setup actions lead the coach panel. Team values move to a persistent scoreboard disclosure; the phase checklist is more compact. |
| 005 | Quieter placement highlights, swap markers on occupied setup targets, and field/central-LOS/wide-zone counts. Engine validation still decides legality. |
| 006, 021 | Move is the first explicit context action. Declaring Pass/Hand-off with the ball enters targeting. A persistent coach action row offers target selection/return to movement. |
| 007 | Short route/remaining-movement summaries; step-by-step checks live in a collapsed disclosure. Confirm/Cancel remain explicit. |
| 008 | A compact recent-action button shows the latest two log events and toggles the full session log. Initial boilerplate is hidden. |
| 009, 023 | Match dugouts omit empty lanes; all-on-pitch teams have only counts. Non-participating practice reserves are behind a toggle. |
| 010 | Incidental pitch tooltips are suppressed during previews and pending decisions. |
| 019 | Launch controls collapse after starting; observation selection reveals its team controls and hides the duplicate generic start button. Tab URLs reflect the active workspace and restore it on reload. |
| 020 | Compact sticky spectator toolbar; explicit computer/team labels; read-only inspection copy. Its desktop coach panel sticks below the toolbar. |
| 022 | Pass preview names the receiving team/player and lists accurate-pass interception threats. Existing red interception overlays remain. |
| 026 | Decision owner becomes the coach heading; known reacting players are named. Block dice have visible outcome explanations and accessible labels. |

Passing, thrown-player targeting and kickoff aim now also offer explicit
confirmation/cancellation buttons. Repeat-click commitment remains available.
Callbacks reject stale game/preview identities and pending decisions. New action
controls inherit computer ownership guards. No automatic viewport scrolling or
decision focus transfer was added.

## Teams, rosters and help

| Audit | Change |
| --- | --- |
| 011 | Quantity hiring, role/skill/cost/budget preview, current allowances, and an optional suggested eleven-player roster with total cost before purchase. Existing engine hire validation is reused; a failed bulk purchase rolls back as one transaction. |
| 012 | Compact roster comparison table and one player inspector instead of eleven large accordion blocks. |
| 013 | Staff unit prices are beside counts; submission explains doubled future re-roll prices, locked choices and no-refund releases. |
| 014 | Submitted-team next steps and two-team league prerequisite are explicit. |
| 015 | Backup tools move near the top. JSON is advanced content. Valid imports show replacement counts and require a separate confirmation; review can be cancelled. Existing corruption/stale-tab checks remain. |
| 016 | Position inspection stays in Rosters with a close control; search also covers leagues, tiers, rules and skills. |
| 017 | Repeated obsolete product-status paragraphs are removed. One central guide includes the Mutation abbreviation. |
| 018 | Profile skills expand inline into short descriptions, including parameterized skills. Diving Catch wording no longer incorrectly limits adjacent selection to empty squares. |
| 024–025 | All five workspace tabs fit on narrow screens. Coach choices use one scroll region. Mobile roster cards expose cost, skills and attributes without sideways table comparison. |

Newly discovered during implementation: unchanged league screens no longer
rebuild on every match/AI render, preserving unfinished recruitment input.
The local server initially required leaving filesystem/network isolation before
the in-app browser could reach it; this was a tooling issue, not a game defect.

## Validation

- Final full run: 1,526 passed, four opt-in simulations skipped (1,530 total).
  A subsequent guide/build-focused run passed all seven checks after copy updates.
- Tests cover staged match replacement, direct pass targeting, stale pass/kick
  confirmations, practice reserves, local roster inspection, atomic quantity
  hiring, suggested roster costs, single-player inspection, import review and
  recruitment input surviving background renders.
- Existing rule, league, skill, saved-team and computer UI regressions are run;
  the four explicitly opt-in full-match simulations remain skipped.
- In-app browser checks: staged team selection, compact pregame, pass preview
  and recipient identity, suggested roster/budget, inline skill help, narrow
  roster cards at 390 CSS pixels, and sticky spectator controls.
- Final preview DOM: no duplicate IDs, one match main region and five workspace
  panels. Browser error log was empty. The preview is v0.0.43.

## Further polish

This is a substantial first implementation pass, not a claim of finished UX.
Potential next steps from the audit include side-by-side team comparison,
sorting/customizing roster columns, a fully consolidated mobile match shell,
visual identification of counted block assists, and skill-specific block outcome
previews beyond the current ordinary outcome descriptions. These are larger
enhancements rather than prerequisites for the changes above.
