# Match workspace — v0.0.32

The long development page is now four workspaces: **Play**, **Teams & leagues**,
**Rosters**, and **Reference**. Switching tabs preserves the live game and each
workspace's scroll position. Changing the game mode still starts a fresh game.

## Straighter route previews — v0.0.32

Automatic route selection first minimizes the existing required-check count,
then movement spent, then direction changes. A clear four-square horizontal or
vertical run therefore stays straight instead of forming a same-cost triangle.
Safer routes retain priority, and explicit coach waypoints remain unchanged.
Arrival heading is part of the search state so equally good prefixes are not
pruned before their future bends can be compared. A stable priority queue keeps
these additional states efficient. This is a preview preference, not a change
to legal Blood Bowl movement, costs, tests or action rules.

## Unified movement — v0.0.31

Select a player, click a highlighted square to preview the route, then use
**Confirm Move** or repeat the destination to activate and follow it. The same
confirmation works before or after activation; there is no separate required
Declare Move step. Additional highlighted squares extend the planned route.
Preview/cancel never roll dice, activate a player or spend movement.

Route summary, required checks and Confirm/Cancel live in one coach-panel
section. The duplicate movement context panel is removed. Choose Blitz, Pass,
Hand-off or another special action before movement when that action is intended;
a plain unactivated route declares Move. **Activate in place** remains in the
optional Player actions disclosure for standing up or other no-route activations.

Activation tests, optional abilities, reactions, turnovers and scores remain
engine-owned. An activation decision interrupts confirmation before movement;
the preview clears so the coach can resolve that decision and replan against the
resulting board. Interrupted routes never silently continue through decisions.
Old Confirm/Cancel buttons cannot affect a replacement preview.

The built-in in-app browser was confirmed working against the published HTTPS
game. Earlier local-browser inventory errors did not justify declaring all
browser checks unavailable. Use published HTTPS for future visual checks.

## Readability update

Pitch actions now open in a compact, non-modal section at the top of the coach
panel. They never float over the field. The default view shows the acting team,
player state and legal actions; statistics, skills and route checks are retained
in a collapsed **Details & checks** disclosure. Existing explicit route Commit /
Cancel, required coach decisions, Escape focus return and stale-action guards
remain. Tab follows normal page order; arrow keys navigate the action buttons.
On narrow screens the coach panel remains above the horizontally scrollable field.

Player markers use the same role shapes for both teams:

| Role | Shape |
| --- | --- |
| Lineman | Circle |
| Blitzer | Triangle |
| Blocker | Square |
| Special | Star |
| Thrower | Diamond |
| Catcher | Hexagon |
| Runner | Pentagon |
| Big Guy | Octagon |

The collapsible **Player shapes** key appears below the pitch. Classification
uses roster positional keywords, not skill names, team identity or player names.
Big Guy and Special tags take precedence; other hybrid profiles use their first
recognized positional tag. Unknown profiles fall back to Special. Named stars
retain their positional shape. Team colours, upright shirt numbers, selection,
ball markers, activated opacity and prone/stunned/distracted cues remain separate.
Role and shape are included in accessible square labels.

Automated verification covers cross-team and hybrid-role mapping, rendered
numbers/status/ball markers, non-floating controls, collapsed details and focus
return. No new desktop/mobile screenshot review was performed during v0.0.30.
The browser-access conclusion at that time was too broad; see the HTTPS
confirmation above.

## Playing

- Click your player for legal actions. Click an opponent for available Block or
  Blitz actions. An activated special-action player can choose a victim directly
  from the pitch; thrown/kicked team-mates can also be chosen from their tiles.
- Movement still uses explicit previews and waypoints. An active movement
  preview offers Commit and Cancel in the coach-panel action section. Clicking the destination again
  continues to work. Previewing never spends movement or rolls dice.
- Hover or focus a tile for player characteristics, abilities, state, movement
  checks, or push information. Touch users get player information in the action
  panel. The full player profile and optional ability switches remain available
  in the coach panel.
- Dice, re-rolls, defender reactions and other required decisions appear in the
  coach panel, with an explicit coach label. Block dice have decorative symbols
  plus their original accessible result names. Gold push tiles and explicit push
  buttons both remain available.
- Pregame shows a preparation checklist and optional staff disclosure. The
  scoreboard omits resource pairs that are both zero. Setup exposes the next
  step and collapses the reserve/player-selection list.
- **Pitch size** enlarges the board without altering game state. Narrow screens
  place the coach panel before the pitch and allow horizontal field scrolling.
- Team attack directions are shown above the field and reverse at halftime.
  Kick aiming highlights the actual receiving half, with accessible tile labels.
- Optional action buttons remain in **Player actions** as a discoverable
  alternative to tile menus. Profile, skill switches and session history use
  disclosures. The history follows new events when already scrolled to the end.

## Keyboard

Arrow keys, Home and End navigate the workspace tabs. The pitch has one Tab stop;
arrow keys move between squares, and Enter/Space selects the focused square.
Action panels use ordinary buttons, support Up/Down navigation and close with
Escape or their close button. Selecting another tile replaces the action context.
Escape outside the panel cancels movement
previews or targeting when no engine decision is pending. Required decisions
cannot be bypassed by selecting another tile.

## Teams and reference

Team creation, league creation and backups have separate sections. Once teams
exist, creation tools collapse. Team details, staff and individual players remain
open after edits, with keyboard focus restored when the same control remains.
Recruitment preserves the chosen position. The draft submission control and its
minimum-player requirement appear before the player list.

Backup export downloads JSON and leaves an editable copy in the disclosure.
Selecting a JSON file loads the text; **Import backup** is still required to
replace stored data. Parse errors keep the entered text. Import validation,
active-fixture protection and protection against overwriting another tab's save
remain in force. Errors are announced and stay visible while scrolling.

MVP nominations use large selectable rows and per-team counts. Saving waits for
six nominees per team; selections survive presentation rerenders. League-entry
and postgame actions appear before the player list, and saved-team options mark
teams that still need postgame work.

Rosters open the selected position in Reference. Skill coverage is searchable by
name, category or description. The zero partial/deferred counts and feedback
version are corrected. Coverage labels are not a claim of complete FFB parity.

## FFB reference

The interaction model was checked against the pinned FFB checkout at
`bf3f89d96b5143a8730910a841e7430791094492`, particularly:

- `ffb-client/.../client/state/AbstractClientStateMove.java`: player interaction
  selects an action panel; field hover supplies movement information.
- `ffb-client/.../client/state/ClientStateAwt.java`: `menuItems` filters menu
  entries through the action context, then shows the panel for the player.

This implementation uses browser popovers and the existing JavaScript engine's
legality checks. It does not copy FFB's Swing UI or introduce a backend.

## Validation and limits

Final local validation: **842 tests pass**, including 22 complete-workspace
scenarios and five additional league-UI scenarios. Generated outputs and
whitespace checks pass.

`tests/ui/workspace-ui.test.cjs` runs the actual bundled workspace code in a DOM event
harness. It covers tab/game preservation, legal player and target menus, stale
callbacks, decisions, keyboard navigation, focus tooltips, pregame, Foul and
team-mate targeting, Block symbols, defender ownership, disclosure persistence
and pitch magnification. League UI tests also cover file backups, invalid text
retention, repeat recruitment and accessible ability switches.

Visual checks use the published review branch over HTTPS, rather than claiming
local-file browser access. Desktop, 768-pixel tablet and 390-pixel phone layouts
are reviewed alongside real controls. Automated rules tests remain distinct from
visual verification. This is not an exhaustive audit of every random event,
skill combination, screen reader or browser engine. Live unfinished-game
save/resume and AI remain outside this change.

Observed browser flows include pregame, both setups, kicker selection, aimed
kicks, Block dice, Stand Firm, gold push tiles and follow-up; player menus,
reference filtering and roster inspection; repeated recruitment, staff
purchases, team submission, league entry, actual backup download/file selection
and import; and a complete two-half 0–0 league fixture, MVP nominations, result
recording, postgame completion and persistence after reload. The idle fixture
validates those screens and transitions, not every gameplay interaction.

Phone checks also confirmed movement commitment and 50-pixel tiles with Extra
large pitch size. Movement details retain the route's required checks before
the commit action. Overlay placement accounts for the visible viewport and its
scrollbars.
