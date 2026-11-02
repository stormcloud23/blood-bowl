# Computer opponent — v0.0.38

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
Tactical regressions cover rear cage completion in both directions, redundant
support, maintaining width through complete turns, disabled tackle zones and
protecting a cage corner instead of taking an unnecessary Blitz.
These checks are distinct from visual browser review or comprehensive tactical
and roster-combination testing.
