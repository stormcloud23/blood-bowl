# Casualties, treatment and Plague Ridden

Based on merged main `35117f8`, including the owner's checkerboard endzones.
The game remains a standalone GitHub Pages file. There is no Java runtime,
backend, persistent roster or league requirement.

## Implemented sequence

`MovementGame.resolveInjury` owns the continuation for normal knockdowns,
crowd pushes, fouls, armour-only attacks and fumbled Kick Team-mate injuries.
It resolves the injury table, casualty table when required, Regeneration,
apothecary decisions, final injury application, and eligible Plague Ridden
creation before resuming ball movement, send-off decisions or turn cleanup.
Both Down continues its second committed injury after the first treatment.
Prevention and Safe Pair of Hands remain before the injury sequence.

The player leaves the pitch while treatment is pending. An ordinary KO cured
by the apothecary returns stunned to its original square. Crowd and directly
fumbled kicked-player KO treatment goes to reserves. A successful cure does
not cancel independent knockdown, carrier-loss or send-off turnover causes.
Saboteur's automatic KO retains its existing no-apothecary exception.

| D16 plus casualty modifiers | Outcome |
| --- | --- |
| 1–8 | Badly hurt |
| 9–10 | Seriously hurt / miss next game |
| 11–12 | Serious injury / niggling injury |
| 13–14 | D6: 1–2 AV, 3 MA, 4 PA, 5 AG, 6 ST reduction |
| 15+ | Dead |

The D6 detail is rolled alongside the D16 even when unused, matching FFB.
Attribute reductions at the FFB permanent-stat limit become Seriously hurt.
Stunty injury total nine is automatic Badly hurt without casualty dice.
Iron Hard Skin suppresses Stunty's alternative injury table.
Directly fumbled Kick Team-mate excludes the Stunty modifier, following
`InjuryTypeFumbledKtm`'s modifier filtering.

Decay adds **one to a single D16 casualty roll**, including an apothecary
alternative. The older two-casualty-roll JavaDoc does not describe the selected
BB2025 executable definition. Existing `nigglingInjuries` also add to the D16.

Regeneration rolls **before** the apothecary offer. Success puts the player in
reserves and clears the effective casualty. On failure the active team may
spend an available team re-roll, including Loner; Pro is excluded from this
passive roll. A failed or declined re-roll proceeds to apothecary treatment.
Regeneration is not rolled again after the apothecary alternative.

The apothecary treats Badly hurt or KO without casualty dice. For worse
casualties it rolls a new casualty; Badly hurt automatically sends the player
to reserves, otherwise the owning coach selects the original or new result.
Offers and result choices reject stale or invalid callbacks.

Before determining fans, each eligible demo team can add/remove one team
apothecary. The choice locks when pregame advances. Remaining uses persist
across drives and halves. This is exhibition configuration, without team-value
budgeting, inducements or a roster creator.

## Records and Plague Ridden

`injuryRecords` retains injury totals, original and alternative casualties,
the selected result, treatment, Regeneration dice, source attribution where
available, and final status. Casualties retain D16/D6, modifiers, death,
miss-next-game, niggling and attribute fields. `player.casualty` holds only
the effective untreated casualty, which the dugout displays. These are match
records; they do not apply future-match penalties or alter team fixtures.

Plague Ridden checks the final death after medical choices. It is a passive
attacker property and can operate when the attacker has already fallen.
Eligible ordinary Block/Blitz injuries create one new reserve per team per
match. FFB's `PlayerAction.isBlock()` also allows a special attack replacing
the Block during a Blitz, but excludes standalone special attacks and fouls.
Victims with Big Guy, Decay, Regeneration or Stunty are excluded. Ordinary
crowd pushes have no injury attacker and cannot trigger it.

The new player uses an existing eligible Lineman position from the attacking
team, matching FFB `raisePositions`. Multiple eligible positions produce an
attacking-coach choice. The new reserve has a unique number/id, retains the
victim id as `raisedFrom`, and can be selected at the next drive setup. No
postgame hiring or roster-cap system is introduced. The demo rosters and skill
laboratory can exercise this without requiring a Nurgle team creator.

## Pinned reference paths

Reference: FFB commit `bf3f89d96b5143a8730910a841e7430791094492`.
Paths below omit `src/main/java/com/fumbbl/ffb/`:

- `ffb-server/.../mechanic/bb2025/RollMechanic.java`: D16/D6, casualty ranges,
  injury table, attribute limits, passive Regeneration re-roll exclusions.
- `ffb-common/.../skill/mixed/Decay.java` and
  `factory/mixed/CasualtyModifierFactory.java`: +1 Decay and niggling modifiers.
- `ffb-server/.../injury/injuryType/InjuryTypeServer.java`: injury-to-casualty
  boundary and selected skill property for a second casualty roll.
- `ffb-server/.../step/bb2025/shared/StepApothecary.java`: pre-Regeneration,
  medical offers, direct cures, alternative selection, post-treatment raising.
- `ffb-server/.../util/UtilServerInjury.java`: Regeneration and raised reserves.
- `ffb-common/.../mechanics/bb2025/InjuryMechanic.java`: infection eligibility,
  reserve placement and team Lineman selection.
- `ffb-common/.../PlayerAction.java`: `isBlock()` action scope.
- `ffb-server/.../step/bb2025/block/StepPushback.java`: ordinary crowd injuries
  have no attacker; prayer-enabled Fan Interaction is outside current scope.
- `ffb-common/.../injury/CrowdPush.java`, `KTMFumbleInjury.java`, `Saboteur.java`,
  and server `InjuryTypeFumbledKtm.java`: medical and modifier exceptions.

## Validation and limits

The full suite passes **484 tests**, including 53 new deterministic medical
and infection cases and four actual inline-UI cases. Existing casualty tests
now include the additional casualty dice. Coverage includes table boundaries,
limits, Stunty, Decay, treatment choices, regeneration re-rolls and Loner,
Leader availability, crowd ball sequencing, Both Down, turnover preservation,
infection exclusions, position choices, next-drive availability and stale UI.
The inline tests execute the real bundled scripts and coach buttons using the
existing DOM harness; no visual browser inspection or Java differential runner
is claimed.

Remaining medical scope includes Wandering Apothecaries, Igor, Plague Doctors,
other inducement/team/star exceptions, prayer interactions and later league
application of recorded injuries. Persistence is still absent. The new
continuation is in-memory and does not implement Multiple Block's two attacks
or a general serializable action stack. Current feature inventory is **100
implemented, 2 partial, 6 deferred**; four deferred entries still affect
exhibitions: Multiple Block, Ball & Chain, Bloodlust and Bombardier.
