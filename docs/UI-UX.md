# Match workspace — v0.0.16

The long development page is now four workspaces: **Play**, **Teams & leagues**,
**Rosters**, and **Reference**. Switching tabs preserves the live game and each
workspace's scroll position. Changing the game mode still starts a fresh game.

## Playing

- Click your player for legal actions. Click an opponent for available Block or
  Blitz actions. An activated special-action player can choose a victim directly
  from the pitch; thrown/kicked team-mates can also be chosen from their tiles.
- Movement still uses explicit previews and waypoints. An active movement
  preview offers Commit and Cancel in a popup. Clicking the destination again
  continues to work. Previewing never spends movement or rolls dice.
- Hover or focus a tile for player characteristics, abilities, state, movement
  checks, or push information. Touch users get player information in the action
  popup. The full player profile and optional ability switches remain available
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
- Optional action buttons remain in **Player actions** as a discoverable
  alternative to tile menus. Profile, skill switches and session history use
  disclosures. The history follows new events when already scrolled to the end.

## Keyboard

Arrow keys, Home and End navigate the workspace tabs. The pitch has one Tab stop;
arrow keys move between squares, and Enter/Space selects the focused square.
Popups use ordinary buttons, support Up/Down navigation and close with Escape,
their close button or an outside click. Escape outside a popup cancels movement
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

Rosters open the selected position in Reference. Skill coverage is searchable by
name, category or description. The zero partial/deferred counts and feedback
version are corrected. Coverage labels are not a claim of complete FFB parity.

## FFB reference

The interaction model was checked against the pinned FFB checkout at
`bf3f89d96b5143a8730910a841e7430791094492`, particularly:

- `ffb-client/.../client/state/AbstractClientStateMove.java`: player interaction
  selects an action popup; field hover supplies movement information.
- `ffb-client/.../client/state/ClientStateAwt.java`: `menuItems` filters menu
  entries through the action context, then anchors the popup to the player.

This implementation uses browser popovers and the existing JavaScript engine's
legality checks. It does not copy FFB's Swing UI or introduce a backend.

## Validation and limits

`workspace-ui.test.cjs` runs the actual bundled workspace code in a DOM event
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
