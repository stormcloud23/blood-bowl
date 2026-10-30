# Insignificant and Violent Innovator

Audited October 30, 2026 against pinned FFB commit
`bf3f89d96b5143a8730910a841e7430791094492` in `vendor/ffb`.
Both catalogue entries now have implemented behavior within the browser's
roster builder and local league progression. This does not certify every
roster, special action or match rule.

## Insignificant

`ffb-common/src/main/java/com/fumbbl/ffb/skill/bb2025/Insignificant.java`
defines a Team Draft List restriction: players with the trait cannot outnumber
players without it. `LeagueStore.submit` enforces this alongside the ordinary
11–16 player and positional limits. Equal numbers are legal. Failed submission
keeps the draft editable and spends nothing. The trait has no in-match effect
and does not block SPP or MVP awards. It does not impose a new ratio restriction
on established teams after injuries, deaths or releases.

The two current drafting rosters do not include this trait. Regression fixtures
use a synthetic eligible position and exercise legal/illegal ratios, reload,
and correcting an invalid draft before submission. No new roster is claimed.

## Violent Innovator

`ffb-common/src/main/java/com/fumbbl/ffb/skill/bb2025/ViolentInnovator.java`
registers `grantsSppFromSpecialActionsCas` and requires a special-action trait.
The laboratory and league advancement share the prerequisite list. Kick
Team-mate is included; Punt and Monstrous Mouth are skills rather than traits
and cannot qualify a player by themselves. The trait prerequisite is ownership,
so temporarily disabling a qualifying ability does not remove eligibility.

Opposing casualties from Stab, Chainsaw, Breathe Fire, bombs, Ball & Chain
collisions against prone/stunned targets, and Kick Team-mate collisions earn
casualty statistics with Violent Innovator. Ordinary Block casualties keep their
existing credit. Foul, Saboteur, Animal Savagery, friendly casualties, self-harm,
failed landings and crowd injuries do not gain special-action credit.

Reference paths under `ffb-server/src/main/java/com/fumbbl/ffb/server/`:

- `skillbehaviour/bb2025/StabBehaviour.java`
- `step/bb2025/block/StepBlockChainsaw.java` and `StepBreatheFire.java`
- `step/bb2025/special/StepSpecialEffect.java`
- `step/bb2025/shared/StepDropFallingPlayers.java`
- `step/bb2025/ttm/StepInitScatterPlayer.java`
- `InjuryResult.java`

The collision path credits the kicker with Violent Innovator and the passenger
with Lethal Flight independently. If both qualify, both receive one casualty
statistic, including after medical treatment heals the victim. Injury sources
retain the kicker's identity through suspended injury decisions; credit is
recorded from the original casualty before treatment. Local post-game awards
then use the team's ordinary or Brawlin' Brutes SPP schedule. Saving the fixture
twice cannot award again.

### Pinned Projectile Vomit exception

The pinned `step/bb2025/block/StepProjectileVomit.java` always uses
`injury/injuryType/InjuryTypeProjectileVomit.java`, whose common
`ffb-common/src/main/java/com/fumbbl/ffb/injury/ProjectileVomit.java` constructs
the injury with `worthSpps=false`. Unlike the other steps above, it never selects
an SPP-enabled injury based on Violent Innovator. Following the project's
executable-FFB-first baseline, the browser therefore awards no casualty SPP for
Projectile Vomit, even with Violent Innovator. Its trait still qualifies for
learning the skill. This is a deliberate pinned behavior, not a claim that the
printed skill wording has this exception.

## Validation

`league-skills.test.cjs` covers draft boundaries, shared prerequisites, the
casualty source matrix, actual special attacks, all combinations of kick/throw,
Violent Innovator, Lethal Flight and friendly/opposing collision victims, plus
healed casualty SPP through post-game save/reload and duplicate-save rejection.
These are deterministic Java-source-derived scenarios, not a Java engine
differential runner. The generated inventory and standalone browser bundle
remain checked by the existing full regression suite.
