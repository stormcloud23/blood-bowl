# Match workspace — v0.0.42

## Throwing target overlay

While choosing a ball-pass or throw/kick team-mate destination, legal squares
show Q/S/L/B range letters and the existing movement difficulty colors: blue
2+, green 3+, yellow 4+, orange 5+, red 6+. A receiver's square uses the harder
of passing accuracy and the accurate-delivery catch roll, with current skills,
marking and weather. Hover or focus a square for the separate checks. Re-rolls
and interceptions do not change the color. An automatic failure shows ×.
Empty targets show accuracy only; Hail Mary shows its avoid-fumble roll and
explicitly warns that it always scatters. P identifies a partner pass.

Throw/kick team-mate targets use only Quick/Short range and color the Superb
Throw check. Scatter, collisions and the eventual landing check are not
included in that color. The overlay disappears when targeting ends and never
consumes dice. The range key stays below the pitch to avoid shifting the board.

Ranges were compared with the supplied regular throwing chart and the
[BB2025 pass/throw rules](https://bloodbowlbase.ru/bb2025/core_rules/the_game_of_blood_bowl/#pass-actions).

## Reset control placement

New game / reset is below the dugouts, separated from End Move and End team turn
by the dugout area and a spaced divider. The same reset action remains available
in Play and Testing.

## Manual viewport control

Game updates preserve the page, pitch, coach panel and match log scroll positions.
New decisions do not take keyboard focus. Reserve selection, opening player
actions, phase changes, new games and pitch resizing no longer reset or recenter
scrolling. Pitch and action-menu arrow navigation uses focus without scrolling.
On narrow screens the coach panel has a stable height and scrolls internally,
so changing instructions and decisions do not move the pitch below it.
Workspace tabs and explicit Reference inspection retain their navigation behavior.
This supersedes the automatic decision focus and reserve scrolling described below.

## Kickoff reaction clarity — v0.0.42

The current deviated kick landing square displays the existing ball symbol while
On the Ball and other airborne kickoff decisions resolve. This is a forecast,
not ball possession: the rules engine still lands/catches/bounces the ball later.
The forecast is hidden for touchbacks and cleared when a new drive begins.

During On the Ball player selection, eligible player icons remain fully visible
and other icons fade using the same opacity as completed activations. Once a
reactor is selected, it stays bright while others fade; remaining eligible
reactors become bright again if another selection is offered. These are temporary
display styles, not changes to activation flags. On the Ball does not add an
activation badge or movement-square glyph; legal movement tiles still highlight.

Kick aiming suppresses hover/focus tooltips and player action popups over target
squares. First click highlights the aim square, clicking a different square
changes the preview, and a second click on the same square commits the kick.

## Pitch decisions and exhibition values — v0.0.41

Skill moves, relocations, ball placements and eligible-player reactions highlight
their legal pitch targets. Click the highlighted tile instead of searching a
coordinate list. Named Stop/Stay/Decline options remain at the coach's desk;
off-board crowd pushes use named edge actions. Setup and kickoff redeployments
also highlight legal destinations after selecting a player.

Exhibition pregame/setup now displays full roster TV, player and permanent staff
components, plus separately labelled CTV and inducement values. See the
[choice audit and valuation details](PITCH-CHOICES.md).

## Observe computer matches — v0.0.40

Testing includes Watch a computer match with independent Human/Orc selections
and Start watching new match, plus an Observe computer match mode option. Both
coaches play automatically from pregame to full time. The existing speed/pause
controls now include Step one action, and both coaches' last actions are shown.
Paused player clicks open read-only profiles; manual action controls stay locked.
Take over both teams keeps the board but removes both computer controllers.
Switching tabs preserves the game; starting another mode cancels scheduled work.
See [controls and limits](COMPUTER.md).

## Stand in place — v0.0.39

Click an eligible prone player once to select them, then click the same player
again to stand in their current square. The selected player's action menu also
offers Stand up in place. The first selection does not activate or roll dice.

This starts a normal Move, so normal stand-up movement costs, low-MA checks,
Jump Up and activation traits still apply. The player stays active and can use
any remaining movement or finish their Move. It does not spend Blitz, Pass,
Hand-off, Foul or another limited action. Pending decisions, used/stunned or
opposing players, another active mover, targeting modes and setup remain guarded.

## Stable action viewport — v0.0.37

New decisions retain accessible focus with preventScroll; they no longer call
scrollIntoView, which previously pulled the page toward the coach's desk after
button presses. Match rerenders preserve both page offsets, and the rebuilt
game session is excluded from browser scroll anchoring. Intentional navigation
such as switching tabs, inspecting a roster or selecting a dugout player keeps
its existing behavior.

## Computer exhibitions — v0.0.36

The Opponent menu offers hotseat, Computer · Human team and Computer · Orc team.
Changing it starts an exhibition with a home human coach and the selected away
preset. Computer controls show the current action explanation, speed, pause and
takeover. Computer-owned decisions disable human action controls; human-owned
reactions interrupt the computer. Takeover preserves the current game. League
and other Testing modes remain manual. See [scope and verification](COMPUTER.md).

Five tabs separate **Play**, **Teams & leagues**, **Rosters**, **Testing**, and
**Reference**. Switching tabs preserves the current game and each tab's scroll
position. Starting another mode or changing an exhibition team starts a new game.

## Setup swaps — v0.0.35

During ordinary drive setup, select a player and click a fielded team-mate to
swap their locations. The selected player stays selected at the new square.
Clicking an empty square still places the selected player normally. A selected
reserve can replace a fielded team-mate even when eleven players are on the
pitch; the displaced player goes to Reserves. Use the roster or Dugouts to
select a different player directly.

Swaps use the setup placement checks and do not spend movement or roll dice.
Both players must belong to the coach currently setting up and be eligible.
Formation confirmation still validates the line, wide zones and captain.
Selection clears when the setup coach, drive or game changes, so a selection
from the previous setup cannot cause an accidental swap. Kickoff redeployment
and live play retain their existing controls.

## Reference guide — v0.0.34

Reference now contains an updated playing guide, a collapsible BB2025 cheat
sheet and searchable basic descriptions for all 108 skills and traits. It
covers current route confirmation, per-step roll colours, preset/custom team
selection, hotseat decisions, league post-game recording and browser backups.

The cheat sheet groups match sequence/actions, movement/passing checks, blocks,
weather, kickoff events, injuries/treatment, turnovers/fouls and SPP. It links
to the owner-supplied Blood Bowl Base sheet and detailed rules. Short entries
are reminders; skill interactions and coach-panel choices still apply. Numeric
rules and timing were checked against the current engine, including strict
more-than-double Strength, 3+ Hypnotic Gaze and no stalling crowd roll in turns 7–8.

Skills show name, category and effect, replacing the player-facing audit status
and dependency notes. Search matches all three fields and reports its result
count. The catalogue's implementation metadata and generated SKILLS.md remain
available for development. Text and tables are embedded in index.html and work
offline; external source links are optional. Reference content is maintained in
src/ui/reference.cjs and bundled before app.js by scripts/build.cjs.

## Play and Testing — v0.0.33

Play holds full exhibitions and league-game entry. Each exhibition side has
separate preset/custom dropdowns. Custom selections override the preset; choosing
a preset clears that override. Only submitted custom teams appear. Testing holds
the learning match, laboratory and drills. Starting a mode explicitly replaces
the current game; switching tabs does not.

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
