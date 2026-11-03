# Direct passing and hand-off previews

With a ball carrier selected, clicking a teammate previews a Pass from the carrier's current square. This includes adjacent teammates when no movement has been planned. Clicking that target again, or Confirm Pass, declares and executes the action.

If a movement route is already previewed, clicking a teammate preserves that route and forecasts from its endpoint. An adjacent endpoint produces a Hand-off preview; a more distant endpoint produces a Pass preview. The hand-off target shows the catch roll using the ordinary colored player overlay, and the planned movement stays visible. A previously declared Pass or Hand-off retains its declared action rather than switching types.

The forecast operates on a separate board view with the actor and carried ball placed at the planned endpoint. It reuses the existing passing, interception and catch calculations. Hand-off catches use the existing hand-off target calculation, without Diving Catch's accurate-pass modifier. Previewing rolls no dice and changes no player, activation, team action allowance or live ball position.

Confirmation starts the appropriate action before movement and follows the exact route. Execution pauses for activation traits, movement checks and required choices, then resumes after successful resolution. A fall, lost ball, ended activation, changed target position or changed game discards the remaining sequence. The queue is cleared before the engine performs the transfer so Animosity, Bloodlust, catch re-rolls and On the Ball remain under the existing engine's control.

Clicking the carrier, Cancel preview or Escape clears the preview. Targets can be changed before commitment; old confirmation buttons cannot execute a replacement preview. Outside-range deselection continues to work. Existing explicit ball targeting remains available, including ground targets, throws and kicks of teammates. A normal Move that has already started is not retroactively converted into a Pass or Hand-off.

Regression coverage includes uncommitted preview state, direct and route-based Passes, Hand-offs, endpoint marking and interception lanes, weather and skills, cancellation, retargeting and stale controls, activation and Dodge interruptions, turnovers, action limits, Hail Mary conventions, and On the Ball sequencing.
