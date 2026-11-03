# Direct foul previews

With an eligible player selected, clicking a prone or stunned opponent previews a route to an adjacent square. The target is highlighted in gold with its current AV displayed as a badge, such as `6+` or `8+`. The coach's desk shows the target number and AV. The badge is the target's armour characteristic, not an assist-adjusted foul roll.

The approach uses the ordinary movement search, preferring fewer checks and then less movement. A coach-planned route prefix is preserved and extended to adjacency. Retargeting recomputes the automatic approach from that original prefix rather than carrying forward an unwanted approach to the old victim. Fouls may use the full legal movement and Rush budget. An already adjacent target needs no movement.

Clicking the target again or Confirm Foul declares the action before following the exact previewed path. Execution pauses for activation traits, deferred declarations, movement checks and required decisions, then resumes after success. A fall, ended activation or invalidated target discards the remaining route. The queue is cleared before calling the existing foul action, preserving Chainsaw, Dirty Player, injury, referee, Bribe and other engine decisions.

Previews change no live player state, consume no action allowance and roll no dice. Actor-click cancellation, Cancel preview, Escape and outside-range deselection remain available. Foul limits and Sneakiest of the Lot are respected. A previously declared normal Move is not converted retroactively into a Foul; explicit Blitz targeting keeps its existing action. No rules or saved-data model is changed.

Tests cover prone/stunned targets and AV badges, route preservation and execution, adjacent and full-budget approaches, retargeting and stale controls, cancellation, assists, activation and Dodge decisions, failed movement, actor stand-up, deferred declarations, foul limits and special-action exceptions.
