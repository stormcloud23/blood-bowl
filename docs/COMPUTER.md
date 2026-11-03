# Computer matches — v0.0.40

## Watch both coaches

Open Testing and use Watch a computer match. Choose Human or Orc independently
for home and away, then Start watching new match. Alternatively, choose Observe
computer match in the Testing mode menu to reveal the observer team controls,
then use Start watching new match. These are full
regulation matches, with normal weather and kickoff events. Both coaches handle
pregame, setup, decisions, turns, drive recovery and halftime automatically.

Speed changes the delay between actions. Pause freezes the match; Step one action
advances one computer decision/action while remaining paused. Automatic dice and
effects belonging to that action may resolve together. Each coach's latest
action is displayed. While paused, click a player to inspect their profile;
those clicks cannot move players, stand them up or resolve decisions.

Start watching new match replaces the current game and uses the current observer
team choices. Changing those choices alone does not restart an ongoing game.
Switching tabs preserves the match and its coaches; pause first if you do not
want it to continue while you visit another tab. Take over both teams preserves
the current board and hands both coaches to humans. Starting a drill, learning
match or exhibition replaces the observation and cancels its scheduled work.

Observed matches use fresh preset teams and do not change saved teams, league
records or exhibition selections. The current supported computer rosters are
Human and Orc. Match save/resume and a replay export are not part of this mode.

## Play against one coach

In Play, choose Computer · Human team or Computer · Orc team in the Opponent
menu inside Match setup, then New exhibition match. Changing the selection alone
does not replace the ongoing game. You control home; the
computer controls the away preset. Its roster selectors are locked until you
return to hotseat or take over. Custom home teams remain available.

Pregame shared progression remains available to the human. The computer handles
its own kick/receive choice, formation confirmation, kicker and kick aim,
kickoff decisions, activations and defensive reactions. It keeps the suggested
formation and skips optional kickoff movement. League and Testing modes have
human controls, except for the dedicated observation mode above.

Normal, Fast and Slow control the delay between actions. Pause stops computer
actions; it does not grant control of its team. Take over computer team keeps
the current match and transfers away to a human. Reset starts another match
with the selected opponent. A fault pauses visibly; resume retries, or take over
to continue manually. Neither match state nor computer state survives a reload.

## Policy and boundaries

`src/features/computer/computer.cjs` exports a DOM-independent ComputerCoach and
decision-owner helper. The policy uses normal engine methods; it never samples
future dice, edits players to execute moves or changes the rules. Forecasts
enumerate bounded adjacent routes, scoring progress, ball recovery, carrier
protection, pressure, marking and risk. Actions are reconsidered after each
activation; engine legality is checked before each planned step. Plans are
discarded after interruption, drive or turn changes.

Field control uses the marginal value of each player's tackle zones: new
coverage is worth more than doubling existing coverage, and further overlap
has little value. Moving away also loses the value of the coverage left
behind. This replaces the old reward for every supporter to converge on a
single point ahead of the carrier. Defensive pressure has diminishing returns
for additional markers too.

Carrier protection rewards all four diagonal cage corners equally, including
the rear, plus distinct tackle-zone coverage on the eight adjacent squares.
Overlapping protection saturates, so a complete cage does not attract the
whole team. Only standing, non-distracted guards count. A moving carrier can
give limited credit to distinct unused escorts that could reach missing
corners; this is an estimate, not a complete path/threat simulation. Blitzes
also account for the coverage and protection abandoned at their origin.

Useful safe actions now precede optional risky rolls, with exceptions for scoring
and immediate ball emergencies. Route and block completion estimates account for
common skills, native re-rolls and activation checks. Carrier positioning favours
central, unmarked space early; defensive screens favour goal-side coverage and
restraint, switching to pressure when behind late. The last team re-roll is
conserved on peripheral failures. See [strategy sources, implementation and
limits](AI-STRATEGY.md) for the three King_Ghidra articles and the adaptations.

It can stand up, pick up the ball, advance and score, move supporters, block
and Blitz. It chooses block dice, pushes, rerolls and skill prompts. It uses
conservative offered choices for other prompts. It does not pass, hand off,
foul, throw team-mates, recruit stars, configure staff, buy optional inducements
or intentionally use Wizards. It does not perform deep search or promise
competitive play. Wider opponent teams and combinations need separate testing.

Computer matches enable individual Both Down prompts in the rules engine.
Each coach chooses their own optional Block/Wrestle use; a computer cannot
select a human player's skill use. Ordinary hotseat prompts remain compatible.

`computer-ui.cjs` binds the controllers to exhibitions and observation, schedules one action per
timer, protects human decisions and blocks human actions during computer-owned
decisions. Timers validate the match/session and pending decision before acting.
Pause, replacement matches and takeover cancel scheduled work. A finite action
bound per coach and explicit failed-action pause prevent silent infinite loops.
Timer epochs also reject cancelled callbacks before they can overwrite a newer
timer. Observation creates two independent coach instances and dispatches by
decision ownership, including defensive choices during the other coach's turn.

The build embeds both modules into existing script blocks, preserving the
self-contained offline application. There are no dependencies or network calls.

## Verification

The three seeded full-match simulations and the full scheduler-driven UI match
are temporarily skipped by default,
including in CI, while UI and experience work takes priority. Run
`npm run test:computer:full` to opt in to the computer and workspace suites,
including all four full-match simulations.
Alternatively set `BB_FULL_MATCH_TESTS=1` when running the test suite. The shorter
computer regressions and workspace/controller tests remain enabled.

`tests/features/computer.test.cjs` covers forecast behavior, touchdowns in both
directions, pickups, decision ownership, independent Both Down choices, defensive
block selection, mandatory bomb rethrows, chain-push ownership, empty teams and
seeded full matches. Full matches assert pitch
occupancy and turn bounds while advancing to the final whistle. Workspace tests
exercise the actual bundled selector, timers, pause, reset, takeover and reactions.
They also cover observation launch, both decision owners, single-action stepping,
read-only inspection, restart cancellation and a full scheduler-driven match.
Tactical regressions cover rear cage completion in both directions, redundant
support, maintaining width through complete turns, disabled tackle zones and
protecting a cage corner instead of taking an unnecessary Blitz.
These checks are distinct from visual browser review or comprehensive tactical
and roster-combination testing.
