# Multiple Block and committed result groups

Based on merged main `634a179` (casualty/treatment PR #11). The owner's
checkerboard and endzone colors are preserved. The game remains a standalone
browser application with no backend or Java runtime.

## Declaration and dice

Multiple Block is available through the existing special-action button and
skill laboratory. The coach chooses two adjacent standing opponents and their
resolution order before spending the activation. Cancel spends nothing.
The action uses the normal Block activation traits and a single Jump Up Block
test when declared prone with Jump Up. It is unavailable during a Blitz.
Frenzy and Multiple Block can be owned together; this declaration suppresses
Frenzy rather than forbidding ownership of the two abilities.

Foul Appearance rolls for all applicable targets precede their re-roll choices.
Failed targets are removed individually; if all fail, the activation ends
without a turnover. A surviving single target still uses the Multiple Block
strength penalty. Dump-off resolves before Dauntless, then Trickster reactions
finish before either Block pool is rolled.

The attacker has **-2 ST, with a minimum of one, before assists**. Each
Dauntless test compares that reduced strength to its own target. Selected
defenders cannot assist one another, including with Guard. The older JavaDoc's
defender +2 ST and requirement to remain standing for the second attack are
not the executable BB2025 behavior.

Both dice pools are rolled before either result is selected or applied. The
attacking coach sees both pools and can re-roll each eligible pool separately.
Team re-rolls include Loner. Pro affects one die in one pool and is shared once
per turn; a failed Pro roll retains its existing team-re-roll fallback.
Brawler is **once per activation across both pools**, following FFB's default
`ALLOW_BRAWLER_ON_BOTH_BLOCKS=false`. Hatred can re-roll an eligible skull in
its pool. A pool cannot receive a second re-roll. Uphill pools pass to the
defending coach after the attacking coach finishes their decisions.

## Result and injury sequence

`multipleContext` retains the attacker, ordered targets, committed dice/results,
injury entries, reserved target squares, delayed ball movement and turnover
state. Both results resolve even if the first knocks down or injures the
attacker. No follow-ups, additional Frenzy attacks, Hit and Run or Pile Driver
actions occur within this sequence.

Pushes, chain pushes, Stand Firm, Sidestep, Grab, Block/Wrestle, Mighty Blow,
Steady Footing, Safe Pair of Hands and Saboteur use the existing boundaries.
Original selected target squares are excluded before preferring free squares
over chain pushes. Stale result, push and medical decisions cannot advance the
action twice or replace a later decision.

Armour, injury and casualty rolls from **both attacks** finish before medical
choices. The shared injury interface now separates initial Regeneration,
Regeneration retries, and apothecary treatment. Ordinary single injuries use
the same interface immediately; Multiple Block queues the entries.

The defending team's group resolves before the acting team's group. Within a
group, all initial Regeneration rolls precede retries and apothecary choices.
When multiple untreated injuries compete for an apothecary, the owning coach
chooses which injury to resolve first, with each original result visible.
Successful Regeneration and automatic nonmedical results skip that selection.
Saboteur's automatic KO cannot consume an apothecary.

If the attacker suffers two injuries, both remain in `injuryRecords` and all
effective casualties remain in `player.casualties`. The final player state
uses the most severe untreated result: curing one casualty cannot cure the
other. The dugout's `player.casualty` shows the most severe remaining casualty.
Independent turnover causes survive treatment and resolve once after both
attacks, medical decisions and delayed ball movement. A double fall by one
carrier does not bounce the same ball twice.

An explicit pinned-FFB boundary: `PlayerAction.isBlock()` excludes
`MULTIPLE_BLOCK`, so Plague Ridden does **not** trigger from these casualties.
The browser follows that executable condition rather than expanding infection
eligibility based on ordinary-language interpretation of a Block.

## Pinned FFB reference

Reference commit: `bf3f89d96b5143a8730910a841e7430791094492`.
Paths omit `src/main/java/com/fumbbl/ffb/`:

- `ffb-server/.../step/generator/bb2025/MultiBlock.java`: activation, multiple
  Foul Appearance, Dump-off, attack fork, medical team order and final ball work.
- `ffb-server/.../step/bb2025/mutliblock/StepMultipleBlockFork.java`: Dauntless,
  Trickster and the shared dice step. The directory is spelled `mutliblock`.
- `ffb-server/.../step/bb2025/mutliblock/StepBlockRollMultiple.java`: both pools
  before result application, re-roll ownership and generated result sequences.
- `ffb-server/.../step/bb2025/mutliblock/StepApothecaryMultiple.java`: grouped
  Regeneration/treatment, two attacker injuries and result reapplication.
- `ffb-server/.../skillbehaviour/mixed/AbstractStepModifierMultipleBlock.java`,
  `mixed/DauntlessBehaviour.java`, `bb2025/FoulAppearanceBehaviour.java`:
  initial multi-target tests, failed targets and reduced-strength Dauntless.
- `ffb-server/.../mechanic/bb2025/RollMechanic.java`: -2 ST/minimum one.
- `ffb-common/.../mechanics/bb2025/SkillMechanic.java`: selected-target assist
  and push-square exclusions.
- `ffb-common/.../factory/GameOptionFactory.java`: default Brawler limit.
- `ffb-common/.../PlayerAction.java` and
  `mechanics/bb2025/InjuryMechanic.java`: Plague Ridden action predicate.
- `ffb-server/.../InjuryResult.java`: final-state precedence.

## Validation and limits

The full suite passes **531 tests**, including **42 new deterministic Multiple
Block cases and five actual inline-UI cases**. Existing medical tests continue
to pass through the split treatment interface. Coverage includes declaration,
ordering, penalties, Guard, Foul Appearance/Dauntless test groups, re-rolls,
double casualties, treatment allocation, regeneration groups, ball loss,
turnovers, prevention, Wrestle, Saboteur, reaction ordering, stale callbacks,
reserved-square Grab fallback and real MatchGame turn handling.

Generated documentation and the standalone bundle are rebuilt, with whitespace
checks. The UI cases execute the real inline scripts in the existing DOM
harness. No visual browser inspection or Java differential runner is claimed.

The result context is in memory. It is not save/resume or a general-purpose
serializable action stack. The existing limits on inducements, staff, star
abilities, competition options and reaction interactions still apply. The
new cases are source-derived regressions, not exhaustive interaction parity.

Current feature inventory: **101 implemented, 2 partial, 5 deferred**.
Three deferred entries still affect exhibitions: Ball & Chain, Bloodlust and
Bombardier. Insignificant and Violent Innovator remain progression scope.
