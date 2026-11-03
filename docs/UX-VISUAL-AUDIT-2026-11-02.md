# Visual UX audit — November 2, 2026

Status: completed at the requested usage cutoff. Documentation only; no interface fixes.

26 findings are recorded below with reproduction context, observed effects and
suggested changes. These are a qualitative expert review, not a usability study
with participants or an exhaustive verification of every rule/roster combination.

## Method and evidence

Inspected the deployed game through the ChatGPT desktop client's built-in browser.
Used a separate disposable audit tab so the user's existing match was not changed.
Findings below distinguish observations from suggestions; severity is a usability
priority, not a rules-correctness rating. Browser automation may scroll controls
into view when clicking; that alone is not evidence of automatic game scrolling.

Starting five-hour usage: 54% used / 46% remaining. Requested inspection cutoff:
90% used / 10% remaining, reserving final work for saving and publishing findings.
The version badge is v0.0.42; repository base is
`a23f9c255e2f2fba4b228cdc6b4545691b3f51a2`.

## Findings

### UX-001 — Exhibition selector wastes the first desktop screen (high)

**Observed:** At the audit tab's approximately 1265×712 viewport, the expanded
Exhibition teams panel stacks home and away vertically in its left half, leaving
the right half empty. The scoreboard sits at the bottom of the first screen;
the pregame action is below the fold. The user has to scroll before doing the
first meaningful game action. Reproduces on a fresh Play tab with default teams.

**Suggestion:** Use two balanced columns at desktop widths, or a compact
home-versus-away summary with an explicit Edit teams control. Collapse selectors
after a match starts. Separate configuration from the active match workspace.

**Evidence:** [Desktop entry](ux-audit-2026-11-02/01-entry.jpg).

### UX-002 — Match replacement controls dominate entry (medium)

**Observed:** Opponent, New exhibition match and team selectors precede the
current match, while Determine fans is lower down in the coach panel. Changing
a team starts a new exhibition according to the disclosure text. A newcomer
encounters replacement controls before the first progression action.

**Suggestion:** Present a deliberate setup step with one Start match action;
during play, reduce it to a collapsed match configuration summary. Keep the
warning adjacent to all configuration controls that replace a game.

### UX-003 — Pregame hierarchy requires reading across two areas (medium)

**Observed:** The large Prepare for kick-off checklist is in the main column,
but the action that progresses it is in the coach panel. Above the action, two
long TV/CTV/inducement paragraphs repeat team names and values. The same large
overview remains after determining fans, while the next action changes to
Determine weather.

**Suggestion:** Put the current step's primary action in the checklist card or
give the coach panel a compact, consistently placed Next step region. Show
values in a small comparison table with expandable breakdowns.

## Coverage and limits

| Area | Inspected |
| --- | --- |
| Desktop Play | Default entry, configuration collapse, fans/weather/rolloff, kick choice, both setup confirmations, kicker choice, two-click kick aim |
| Live actions | Player selection, movement route preview, pickup resolution, current-action and log affordances |
| Teams & leagues | Empty state, authorized new draft, eleven hires, player detail, staff purchase, submission, league creation/entry, backup controls (no import) |
| Rosters / Reference | Default tables, position inspection, navigation into Reference, skill search for diving |
| Testing | Mode selection, computer observation launch/pause, passing drill declaration/aim/commit/interception, block drill/dice/Stand Firm |
| Narrow layout | Coach above pitch, nested scrolling, horizontal pitch and roster overflow, clipped tab navigation |

Not exercised: an entire two-half match, touchdowns/drive recovery, all kickoff
reactions, wizard and star-specific workflows, injury/apothecary permutations,
postgame recording/MVP/SPP advancement, redrafting, imports/restore, thrown-player
execution, all league fixture prerequisites, keyboard-only completion or screen
reader operation. The audit does not claim coverage of these paths. No game
rules were altered. No real user team or fixture was edited.

## Suggested implementation order

1. **Current task first:** compact match configuration (UX-001/002), move economics
   out of the action area (004), consistent explicit movement/pass modes (006/021).
2. **Clear decisions:** recipient/threat identity (022), current coach/player
   ownership and block consequences (026), concise result feedback (008).
3. **Reduce repetitive work:** recruitment quantities/suggested rosters (011),
   roster comparison/detail drawer (012/016), submission next steps (014).
4. **Reduce reading and scrolling:** compact route confirmation (007), empty
   dugout collapse (009), contextual skill help and current copy (017/018).
5. **Match shells:** sticky spectator controls (020), compact drill launchers
   (019/023), then a focused mobile decision/viewport shell (024/025).

Retain the useful foundations observed: legal formation feedback, preview before
movement commitment, difficulty colors and sparse pass/catch labels, on-pitch
spatial choices, large block dice, explicit decision-owner text, searchable skill
results, and separation of reset from End team turn.

## Usage and audit state

Checked the shared five-hour usage window at 54%, 63%, 68%, 78%, 84%, 87% and 90%
used. Inspection stopped at 90% used / 10% remaining. Subsequent activity was
limited to finalizing/saving this report, closing the disposable audit tab and
publishing the documentation. The original user tab was left open and its match
was not advanced. The desktop viewport override was reset after the narrow check.
The authorized disposable team/league remain in browser storage for reference;
the audit tab's transient drill state was discarded on close.

## Session notes

- Initial browser API reads failed with `browser.user is unavailable`; resetting
  the browser automation session restored access. This was a tooling issue,
  not recorded as a game defect.
- Automatic approval review rejected advancing the user's existing match.
  A separate audit tab was created instead; the original tab was left untouched.

### UX-004 — Coach panel repeats pregame economics above setup/kick actions (high)

**Observed:** During setup, kicker selection and kick aiming, the narrow coach
panel repeats the full two-team TV/CTV paragraphs before current instructions.
In the setup screenshot the panel needs its own scrollbar, and Confirm formation
is near its bottom. The economic detail displaces the time-critical task.

**Suggestion:** Move these values to a scoreboard disclosure; pin the current
phase, validation and primary action at the top of the coach panel.
**Evidence:** [Setup](ux-audit-2026-11-02/03-setup.jpg),
[kick aim](ux-audit-2026-11-02/05-kick-aim.jpg).

### UX-005 — Setup feedback is strong but visually overwhelming (medium)

**Observed:** Selecting a player floods almost the entire legal half with thick
bright yellow cell borders. Tokens and pitch zone markings become less prominent.
There is no visible on-board distinction explaining which occupied squares swap
versus which empty squares place. The instruction describes both correctly.

**Suggestion:** Use a quieter legal-area tint, emphasize the selected player,
show a compact Move/Swap preview on the destination, and mark LOS/wide-zone
requirements with counts. Preserve the useful Formation is legal message.
**Evidence:** [Selected setup player](ux-audit-2026-11-02/04-setup-selected.jpg).

### UX-006 — Ordinary movement lacks an obvious menu action (high)

**Observed:** Clicking an unused Black Orc opens a coach-panel action card whose
first prominent button is Declare Blitz. Move is conveyed only by prose telling
the user to choose a highlighted destination. Other actions are explicit buttons.
This creates an inconsistent action-selection model and overemphasizes Blitz.

**Suggestion:** Make Move a clear first action or use an explicit default Move
mode with a compact selected-player toolbar. Distinguish Declare action from
Perform action, especially when a player without the ball may declare Pass.
**Evidence:** [Player actions](ux-audit-2026-11-02/06-player-actions.jpg).

### UX-007 — Movement confirmation explains too much in the main action area (medium)

**Observed:** A two-square pickup preview produces a remaining-movement paragraph,
Confirm/Cancel buttons, another long route explanation and numbered step checks.
The coach panel scrolls internally. The instructions below the pitch repeat the
same commit/extend behavior. Useful risk information is mixed with repeated help.

**Suggestion:** Show a compact summary (2 MA, Pickup 4+, remaining 2 MA + 2 Rushes),
Confirm/Cancel, then expandable route details. Offer one-time/on-demand help.
Retain preview-before-commit and numbered path markers.
**Evidence:** [Route preview](ux-audit-2026-11-02/07-movement-preview.jpg).

### UX-008 — Successful action results are easy to miss (medium)

**Observed:** After confirming the pickup, the action card disappeared, the player
and tiny ball symbol moved, and the coach text showed MA spent. No persistent
Pickup successful result was visible; Session log remained collapsed.

**Suggestion:** Add a short last-action result line with roll/outcome and a link
to its log entry. Keep it distinct from the current instruction. This also helps
players recover after several automatic dice/effects resolve together.
**Evidence:** [Move resolution](ux-audit-2026-11-02/08-move-resolution.jpg).

### UX-009 — Empty dugout states consume a large block (medium)

**Observed:** With all 22 players on the pitch, the two dugouts still render twelve
large empty category boxes (including Dead, Sent off and Unavailable). They use
roughly 200 vertical pixels before the reset control, despite having no content.

**Suggestion:** Collapse zero-count lanes into a compact summary, expand only
non-empty categories, and retain a way to inspect all categories. During setup,
prioritize reserves and field counts over empty injury categories.
**Evidence:** [Empty dugouts](ux-audit-2026-11-02/08-move-resolution.jpg).

### UX-010 — Tooltips compete with decision space (medium)

**Observed:** Hover/focus detail near the right pitch edge extends across the gap
and toward the coach panel; the route tooltip sits close to Confirm/Cancel. It
can visually compete with the destination and action controls. Kick aiming
correctly suppresses these tooltips and was easier to read.

**Suggestion:** Prefer a concise inspection strip or constrain tooltips to a
non-interactive area; hide incidental hover help once a commit panel is open.
**Evidence:** [Route tooltip](ux-audit-2026-11-02/07-movement-preview.jpg).

Usage checkpoint: 63% used / 37% remaining after entry, pregame and setup work.

### UX-011 — Rookie recruitment requires many repetitive actions (high)

**Observed:** A new draft starts with zero players. Hiring uses a full-width
position dropdown, name field and Hire player button; each click buys exactly
one player and rebuilds the summary. Eleven identical retainers required eleven
separate hires. Position attributes and skills appear only after hiring and
opening a player's disclosure, or by leaving for Rosters.

**Suggestion:** Add quantity controls and pre-purchase stat/skill previews, plus
an optional editable suggested 11-player roster. Keep a compact budget/legality
summary beside the builder. Do not automatically spend treasury without review.
**Evidence:** [Draft](ux-audit-2026-11-02/10-team-draft.jpg),
[hiring](ux-audit-2026-11-02/11-roster-hiring.jpg).

### UX-012 — Team overview becomes a long accordion stack (medium)

**Observed:** Collapsed player rows repeat name and position (for example
Imperial Retainer · Imperial Retainer) but omit cost/SPP/status. Opening a player
reveals career stats, editing, release and development in one large block.
Eleven collapsed rows already use much of a screen; one expanded row adds
several hundred pixels. Comparing players needs repeated expansion and scrolling.

**Suggestion:** Use a sortable compact roster table with key columns and a
single detail drawer. Separate progression from identity editing and release.
**Evidence:** [Roster and backup](ux-audit-2026-11-02/13-league-backup.jpg).

### UX-013 — Staff prices are detached from purchase buttons (medium)

**Observed:** Staff & re-rolls shows + controls beside current counts, with all
prices grouped in a prose line below. The treasury is above the whole section.
After submission the same area changes to double-price re-rolls and no refunds;
the state transition is conveyed by another small text line.

**Suggestion:** Show per-unit cost and resulting treasury inline with each
control. At submission, summarize the irreversible draft-to-league changes and
recommend checking remaining budget before finalizing. Draft minus controls
were present after buying and correctly offered a way to adjust the purchase.
**Evidence:** [Staff controls](ux-audit-2026-11-02/12-staff-controls.jpg).

### UX-014 — Submission does not clearly lead to the next league task (medium)

**Observed:** Submit legal rookie roster disappears on success; the heading
becomes League roster. With no league, there is no prominent next step. League
creation is inside Create another team or league, a disclosure above the roster.
After creating a league, Enter submitted team appears separately below standings.

**Suggestion:** Use a completion panel: Team submitted → create/join league or
play an exhibition. Make prerequisites and next actions explicit. After adding
one team, explain that another eligible team is required to play a fixture.

### UX-015 — Persistent save/restore is technical and remote from daily work (medium)

**Observed:** Save notice says data is in this browser and recommends a backup.
Backup & restore sits after the long roster. Expanding it exposes a JSON textarea,
file chooser and Import/Export; import replaces all browser teams and leagues.
The local-only persistence limitation is easy to forget while using other tabs.

**Suggestion:** Provide a compact persistent save-status/backup affordance near
the team selector. Make file download/upload the default path, JSON an advanced
option, and summarize replacement scope before import. No import was performed.
**Evidence:** [Backup area](ux-audit-2026-11-02/13-league-backup.jpg).

### UX-016 — Roster browsing and position inspection break comparison context (medium)

**Observed:** Rosters renders all 30 full tables in one long page with a team-name
search. Clicking Imperial Thrower switched to Reference and inserted a full-width
profile above the playing guide. No local Close or Back to roster control was
visible. Skill names in that profile are plain text, so learning about Pass or
Pro requires finding the separate skill search.

**Suggestion:** Keep inspection in a drawer beside the originating table, link
skill names to their descriptions, and offer Compare teams / tier / league filters.
**Evidence:** [Roster tables](ux-audit-2026-11-02/14-rosters.jpg),
[position inspection](ux-audit-2026-11-02/15-roster-inspection-reference.jpg).

### UX-017 — Repeated roster footer includes stale product guidance (medium)

**Observed:** Each roster card repeats a long instruction footer ending with
Star players and their unique abilities are deferred. This conflicts with the
extensive star-player support elsewhere in the product and burdens every card.
The advancement abbreviation legend lists A/D/G/P/S while Skaven rows also show M.

**Suggestion:** Centralize the legend and current capabilities once, include
Mutation (M), and remove historical implementation/status copy from roster cards.
**Evidence:** [Roster footer](ux-audit-2026-11-02/14-rosters.jpg).

### UX-018 — Reference works as a lookup but lacks contextual entry points (medium)

**Observed:** Search for diving returns two readable rows and an accurate result
count. The surrounding page still includes the playing guide and many collapsed
rule sections. In-game player skills are not directly linked to this search.
Diving Catch's quick text describes an adjacent empty square, which can suggest
stricter eligibility than the occupied-target catcher selection previously
verified in this engine. This is a wording concern, not a new rules finding.

**Suggestion:** Add contextual skill popovers/deep links, a dedicated compact
lookup view, and review summaries against implemented behavior. Keep the search
and result count, which were efficient once reached.
**Evidence:** [Filtered skills](ux-audit-2026-11-02/16-skill-search.jpg).

Audit records explicitly authorized by the user: one submitted team named
UX Audit — disposable (11 retainers, one team re-roll) and one league named
UX Audit — disposable league; the team was entered in it. These are retained
local browser records, not changes to source code or a real-world competition.

### UX-019 — Testing duplicates observation launch and obscures the active workspace (medium)

**Observed:** Testing mode includes Observe computer match, while a separate
large Watch a computer match panel has its own team selectors/start button.
Both launch paths remain above the current drill/match. Even during Pass &
interception practice, the large observation launch panel stays above the pitch.
The URL still read #skillcoverage after leaving Reference for Testing.

**Suggestion:** Use separate Practice / Observe subviews or compact launch cards;
collapse the launch area once started. Reflect the active tab/mode in a stable
URL or avoid leaving a stale section hash that suggests a different view.
**Evidence:** [Testing entry](ux-audit-2026-11-02/17-testing-entry.jpg),
[observation launch](ux-audit-2026-11-02/18-observation.jpg).

### UX-020 — Spectator controls are disconnected from the pitch (high)

**Observed:** Pause, speed, Step one action and Take over both teams sit in a
large block above the scoreboard/pitch. At the scroll position used to see the
whole field, these controls are offscreen. Paused coach copy still says Human
to play and Select a player to inspect or activate, although ordinary action
controls are disabled in observation. Home — Human is a team/controller label
that can read ambiguously in a computer-versus-computer match.

**Suggestion:** Put a compact sticky spectator toolbar beside the pitch, with
obvious Paused/Running state, step, speed and a secondary Take over action.
Use explicit Home computer (Human roster) language and read-only inspection copy.
Add a short recent-action timeline synchronized with the board.
**Evidence:** [Paused observation](ux-audit-2026-11-02/19-observation-paused.jpg).

### UX-021 — Passing has a hidden second mode transition (high)

**Observed:** In Pass & interception practice: select the thrower → Declare Pass
→ expand Player actions → Choose ball target → choose square → click it again.
After declaring Pass, the next-step target action was hidden in the collapsed
Player actions disclosure. The primary Move flow instead offers Confirm Move.

**Suggestion:** After declaration, show Move first / Choose pass target as clear
adjacent actions, or enter targeting with an explicit return-to-movement option.
Use a consistent preview/confirm pattern across movement, passing and kickoff.
**Evidence:** [Pass preview](ux-audit-2026-11-02/20-pass-preview.jpg).

### UX-022 — Pass preview omits recipient identity and interception context (high)

**Observed:** The coach preview showed Short Pass · Pass 3+ · Catch 3+ and the
repeat-click commit instruction, but no receiver team/name/number. An opposing
player also had a pass/catch label on the pitch. The defender's interception
choice appeared only after committing; the attacking coach heading remained
above a separate Black Orcs — decision required card. The skill tooltip remained
visible over the right side of the pitch during this choice.

**Suggestion:** Name the recipient and team in the preview; distinguish an
opposing target from a friendly receiver, and show eligible interception threats
without folding their opponent-owned roll into the pass/catch color. Promote
the currently deciding coach and keep secondary hover content out of that view.
**Evidence:** [Pass preview](ux-audit-2026-11-02/20-pass-preview.jpg),
[defender decision](ux-audit-2026-11-02/21-pass-decision.jpg).

### UX-023 — Practice drills expose a large irrelevant reserve roster (medium)

**Observed:** The three-player passing drill lists the remaining nine/ten default
team players in the dugouts. These reserve cards add substantial content below
an otherwise small teaching scenario, without being the task's focus.

**Suggestion:** Collapse non-participating practice players by default, and show
a drill objective and success/reset state instead. Preserve full dugouts for
matches or an explicit advanced practice view.

### UX-024 — Narrow presentation needs multiple independent scroll regions (high, mobile)

**Observed:** In the narrow viewport, tabs scroll sideways, the coach panel
scrolls internally above the pitch, and the pitch itself requires horizontal
scrolling. The large observation launcher still precedes the drill. Reaching a
pitch target and its decision requires substantial vertical travel. The fixed
coach-panel height does help prevent instructions from shifting the board.

**Suggestion:** Use a mobile match shell with compact top status, a collapsible
coach/decision drawer and a persistent current-action bar. Collapse launchers
when playing. Keep deliberate horizontal pitch panning and clearly signal it.
**Evidence:** [Mobile drill](ux-audit-2026-11-02/22-mobile-pass-practice.jpg),
[mobile pitch](ux-audit-2026-11-02/23-mobile-pitch.jpg).

### UX-025 — Mobile roster comparison requires horizontal table scrolling (medium)

**Observed:** Only Position, Limit and the first characteristics fit in the
narrow roster view. Skills/cost are to the right, so comparing a player requires
panning away from its name. The top tab strip also clips Testing/Reference.

**Suggestion:** Offer stacked position cards or configurable essential columns
with a pinned name column; keep cost and key skills in the first view. Provide
a clear mobile workspace switcher rather than relying on a clipped tab strip.
**Evidence:** [Mobile roster](ux-audit-2026-11-02/24-mobile-rosters.jpg).

Mobile method limitation: the requested viewport override was 390×844, but the
in-app browser reported an effective CSS viewport width of 288 pixels (desktop
client scaling). Treat these as narrow-layout observations, not certification
of a physical 390-pixel device. The override was reset to desktop after capture.

Usage checkpoints: 78% used / 22% remaining before Testing; 84% used / 16%
remaining before the narrow-layout pass.

### UX-026 — Block decisions hide consequences and spatial context (medium)

**Observed:** The Block practice card clearly names the deciding coach, shows
ST 5 vs 3 and one offensive assist, and offers large recognizable dice. However,
POW and Player Down have the same prominent yellow treatment; the visible
labels do not explain the result after skills. The assist count does not visibly
identify the assisting token. A later Stand Firm card names the defending team
but not the player, while the large coach heading still names Black Orcs.

**Suggestion:** Keep the large dice and ownership text, add a concise outcome
explanation under each die, highlight counted assists on inspection, and include
the reacting player's number/name. Make the current decision owner visually
primary during hotseat handoffs without automatically scrolling the page.
**Evidence:** [Block dice](ux-audit-2026-11-02/25-block-dice.jpg),
[Stand Firm reaction](ux-audit-2026-11-02/26-block-reaction.jpg).
