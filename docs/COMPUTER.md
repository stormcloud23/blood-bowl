# Computer opponent — v0.0.36

In Play, choose Computer · Human team or Computer · Orc team in the Opponent
menu. Changing this choice starts a new exhibition. You control home; the
computer controls the away preset. Its roster selectors are locked until you
return to hotseat or take over. Custom home teams remain available.

Pregame shared progression remains available to the human. The computer handles
its own kick/receive choice, formation confirmation, kicker and kick aim,
kickoff decisions, activations and defensive reactions. It keeps the suggested
formation and skips optional kickoff movement. League and Testing modes have
no computer controller.

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

It can stand up, pick up the ball, advance and score, move supporters, block
and Blitz. It chooses block dice, pushes, rerolls and skill prompts. It uses
conservative offered choices for other prompts. It does not pass, hand off,
foul, throw team-mates, recruit stars, configure staff, buy optional inducements
or intentionally use Wizards. It does not perform deep search or promise
competitive play. Wider opponent teams and combinations need separate testing.

Computer matches enable individual Both Down prompts in the rules engine.
Each coach chooses their own optional Block/Wrestle use; a computer cannot
select a human player's skill use. Ordinary hotseat prompts remain compatible.

`computer-ui.cjs` binds the controller to exhibitions, schedules one action per
timer, protects human decisions and blocks human actions during computer-owned
decisions. Timers validate the match/session and pending decision before acting.
Pause, replacement matches and takeover cancel scheduled work. A finite action
bound and explicit failed-action pause prevent silent infinite loops.

The build embeds both modules into existing script blocks, preserving the
self-contained offline application. There are no dependencies or network calls.

## Verification

`tests/features/computer.test.cjs` covers forecast behavior, touchdowns in both
directions, pickups, decision ownership, independent Both Down choices, defensive
block selection, mandatory bomb rethrows, chain-push ownership, empty teams and
seeded full matches. Full matches assert pitch
occupancy and turn bounds while advancing to the final whistle. Workspace tests
exercise the actual bundled selector, timers, pause, reset, takeover and reactions.
These checks are distinct from visual browser review or comprehensive tactical
and roster-combination testing.
