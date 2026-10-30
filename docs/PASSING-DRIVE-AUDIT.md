# Passing geometry and selected kickoff/drive corrections

This audit follows pinned FFB commit `bf3f89d96b5143a8730910a841e7430791094492`. It replaces the earlier one-square interception approximation and supersedes historical notes describing exactly-one-only fumbles.

## Interceptions and passing

The browser now translates `ffb-common/.../util/UtilPassing.java:canIntercept` directly: a 1.74-square ruler, square-corner distance checks and strict squared-distance limits at both endpoints. Adjacent rows can intercept a horizontal pass; the receiver square, thrower square and squares beyond the endpoint limits cannot. This selected FFB geometry is not a claim that every physical ruler interpretation is identical.

Cloud Burster / Very Long Legs and No Ball eligibility still apply. Defender choices carry the defending team's identity and reject invalid or stale callbacks. On the Ball movement may place a player within the wider eligible area, so interception remains a separate decision after that movement.

Normal interceptions now apply Nerves of Steel to tackle zones and no longer impose the browser's unsupported Stunty-interceptor penalty. Bomb interceptions also respect Nerves of Steel, and Pouring Rain applies to their test. Sources: BB2025 `InterceptionModifierCollection`, common `ExtraArms`, mixed `NervesOfSteel` and BB2025 `VeryLongLegs`/`Stunty`. The selected BB2025 Stunty class does not register BB2020's passing/interception property.

Pass, bomb and thrown-player accuracy share the pinned classification order: absent PA fumbles; a natural one fumbles (Safe Pass may retain a normal ball/bomb); a natural six or a result meeting PA succeeds; other modified totals of one or less fumble. Remaining results are inaccurate/Subpar. Checking success before the modified-one boundary matters for PA 1+. Normal PA “–” passes do not roll or offer a re-roll, and Safe Pass cannot rescue them. Pinned Throw Team-mate still consumes its accuracy die with PA “–” but offers no re-roll of that automatic fumble. Previews explain automatic fumbles instead of showing NaN.

Sources: BB2025 `PassMechanic.evaluatePass`, server `pass/StepPass`, `skillbehaviour/bb2025/ThrowTeamMateBehaviour` and the existing bomb flow.

## Selected kickoff and drive boundaries

- Pitch Invasion rolls one shared D3 count, including ties, and chooses distinct standing victims. Both teams' victims are selected before effects. Ball & Chain receives its placed-player injury treatment before the kick lands, using the project's existing pinned `{5,5}` injury boundary.
- Dodgy Snack selects both affected players before applying either effect.
- Drive recovery resolves KO rolls before the shared Sweltering Heat count/selection; recovered reserves cannot be selected for heat exhaustion.
- At full time there is no next-drive KO/heat processing or Secret Weapon resource decision.

Compared `step/bb2025/kickoff/StepApplyKickoffResult`, `step/bb2025/StepEndTurn` and `util/UtilServerInjury.dropPlayer`. Existing tests retain Time-out, weather scatter, staff contests, High Kick, movement events, scoring, halftime and complete two-half flow. This is a targeted comparison: Solid Defence swap/redeployment ergonomics, every kickoff interaction, concessions and competition extra time/penalties are not certified complete.

## Reproducible validation

`tools/verify-ffb-geometry.cjs` extracts the actual pinned Java geometry and pass-classification methods into a temporary Java source program with small dependency stubs. It compares 152,100 geometry pairs and 1,764 passing outcomes against JavaScript, and extracts the BB2025 range chart. It is an isolated-method oracle, not an integration runner for the full Java match engine.

With Java 21 and the reference checkout at `../vendor/ffb`:

```sh
node tools/verify-ffb-geometry.cjs
```

Set `FFB_SOURCE` to use another checkout. `--write-fixture` deliberately regenerates `test-fixtures/ffb-interception.json`; review reference version/hash changes before committing. The committed fixture records source hashes and powers the normal Node tests, so CI and players do not need Java. The game remains a self-contained static HTML page.

Deterministic and embedded UI tests cover modifier boundaries, PA dash, stale choices, the new On the Ball interception window, victim selection, medical suspension, heat/recovery ordering and full time. Visual inspection remains unavailable because Work browser access is disabled.
