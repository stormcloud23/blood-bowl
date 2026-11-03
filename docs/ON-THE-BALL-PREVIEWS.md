# On the Ball movement previews

Selecting an On the Ball reactor displays every destination reachable within the remaining three-square budget. Squares and route steps use the normal movement difficulty colors. Click a destination to preview, add waypoints if desired, then click the destination again or Confirm Move. Clicking the reactor, Cancel preview, or Escape clears the preview without moving or rolling dice.

The preview uses the engine's ordinary movement search and checks. Its forecast clears only the pending movement-choice guard on a separate game view; it does not resolve choices, consume dice, alter activation flags, or move live players. The bounded movement planner rejects Rushes, movement beyond the reaction budget, and kick-off steps outside the receiving half. The three-square allowance applies even to a player whose normal MA is lower; Sprint does not extend it.

Confirmation follows the exact previewed route through the existing step decisions. Execution pauses for required rolls or skill choices, then resumes after successful resolution. A fall or other end to the reaction discards the remaining route. Completing one reactor's route never selects or moves another reactor automatically. Prior spent movement and used flags are restored by the existing reaction engine.

The supplied BB2025 On the Ball rules are the requirements: pass reactions happen after the target is declared and before the passing roll; multiple eligible defenders react one at a time, with a fall preventing later reactions. Kick-off permits one Open receiving player after deviation and before the kick-off event, skips touchbacks, and keeps movement in the receiving half. Existing rule tests cover those sequencing and eligibility conditions; UI tests cover full-range forecasts and their execution.

This release also includes the preceding Legend and coach's desk cleanup described in [COACH-DESK-TEXT-AUDIT.md](COACH-DESK-TEXT-AUDIT.md). The Session log remains collapsed on the desk.
