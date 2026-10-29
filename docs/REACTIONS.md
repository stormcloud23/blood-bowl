# Reaction continuations — first increment

The browser now has an in-memory interruption stack in `MovementGame.interrupt`.
A reaction receives a completion token. Only the top frame can complete, only
after its pending decision is cleared, and only once. Completion removes the
frame before resuming the interrupted action. `reactionChoice` records the
choosing team, validates options, and rejects stale decision callbacks.

This is an incremental bridge for the existing callback engine. It is not a
serializable save system and does not migrate existing decisions automatically.
Callers must finish nested decisions before completing their frame.

Tentacles is the first consumer. A legal Dodge/Jump/Leap departure offers the
defending coach one eligible standing, undistracted, enabled holder, or decline.
The holder rolls D6 against max(2, 6 − holder ST + mover ST), with natural 1/6
failure/success. A hold ends the activation in the origin square without moving,
spending movement, dropping a Fumblerooski ball, rolling Rush, or causing turnover.
A failed/declined hold resumes the original movement and its existing re-rolls.
The defender cannot use team re-rolls or Pro: FFB restricts these respectively
to the active team and acting player. No second holder can attempt the same exit.

Sources:

- [BB2025 rules as written](https://bloodbowlbase.ru/bb2025/core_rules/skills_and_traits/#tentacles-active)
- [FFB BB2025 TentaclesBehaviour](https://github.com/christerk/ffb/blob/bf3f89d96b5143a8730910a841e7430791094492/ffb-server/src/main/java/com/fumbbl/ffb/server/skillbehaviour/bb2025/TentaclesBehaviour.java)
- FFB `step/mixed/move/StepTentacles.java`, `mechanic/RollMechanic.java`, and
  `ffb-common/.../mechanics/bb2025/SkillMechanic.java` at the same pinned revision.

Regression coverage includes held carriers, departure cancellation, defender
selection, natural limits, Leap/Rush timing, failed holds, Fumblerooski, nested
completion order, duplicate callbacks, and the actual bundled UI buttons.
Other reactions (including Shadowing, Diving Tackle and Dump-off) remain deferred.
Exhibition parity is still incomplete. Static GitHub Pages deployment remains
self-contained; no Java server, runtime dependency or network access was added.
