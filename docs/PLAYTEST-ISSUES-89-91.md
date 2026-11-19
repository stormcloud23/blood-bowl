# Playtest reports #89–91

## #89: Bombardier action discoverability

The engine already supports bomb declaration, targeting, catches/rethrows,
explosions and the separate per-team bomb allowance. The workspace player popup
only exposed the generic Foul / special action menu. Add a direct **Throw Bomb**
entry when `canBomb` allows it, retaining the special menu for other actions.
The direct entry uses the existing bomb activation and pitch targeting.

## #90: Ball & Chain activation

The engine correctly rejects ordinary movement paths for Ball & Chain and offers
direction-template decisions after a Move activation. The workspace popup
excluded the generic activation button for every player, leaving this essential
action buried in the coach controls. Include it for Ball & Chain and label it
**Move Ball & Chain**. Direction, collision, Rush, injury and star ability
resolution continue through the existing engine.

Both fixes inspect skills rather than names or roster IDs. Bundled workspace UI
tests discover all native profiles and exercise both coaches: Goblin Bomma and
Fanatic; Snotling Fungus Flinga; Da Red Gobbo's Squigmobile, The Black Gobbo,
Cindy Piewhistle, Kreek Rustgouger, Bomber Dribblesnot and Fungus the Loon.
Each test opens the popup, declares through its direct control, checks stale
click protection, and resolves a bomb throw or random movement step.

## #91: Completion SPP not reproduced

A real accurate pass to a teammate records one completion. Recording the finished
league fixture awards one SPP, including earned SPP and career completions; those
values survive JSON save/reload. Duplicate recording is rejected. The new test
exercises this entire path rather than injecting a completion statistic.
Existing tests cover scoring catches and exclude inaccurate/bounced passes.

SPP is applied to saved players when a league result is recorded. Exhibition
matches do not award persistent SPP. No scoring-rule change is warranted by the
available report; an affected save or exact reproduction would help investigate
any remaining case.
