# Wizards and mercenaries — v0.0.21

The browser remains self-contained. This increment uses executable BB2025 FFB
at `bf3f89d96b5143a8730910a841e7430791094492`, rather than older-edition spell
descriptions. It adds two inducement systems; it does not establish full FFB
parity.

## Wizards

One Wizard costs 150,000 gp and casts one Fireball or Zap per match. Both are
explicit choices with pitch targeting, an affected-player preview and final
confirmation. Cancelling returns to spell selection without spending the use.
Invalid targets and stale callbacks consume neither dice nor resources.

After an ordinary turn or turnover, the ending coach gets the first window,
then the other coach. Player actions stay locked and the next turn marker does
not advance until these decisions finish. Touchdowns and the end of a half
skip these windows. Weather Mage remains a separate start-of-own-turn resource.

Fireball includes the centre and eight adjacent squares, clipped at the pitch
edge. It can affect either team's standing, prone and stunned players, in
coordinate order. Each is hit on 4+. The +1 modifier goes to armour if needed;
otherwise it goes to injury. Iron Hard Skin cancels the armour modifier while
retaining the injury modifier. Damage dice precede Steady Footing; a successful
save discards the rolled injury. Safe Pair of Hands, casualty treatment and
Regeneration use the existing continuations. Each victim finishes separately.
There is no player casualty SPP for a Wizard.

Zap succeeds on a natural six, or a roll above one at least equal to the
target's current ST. It temporarily replaces the profile with MA5, ST1, AG2+,
PA–, AV5+ and Dodge, No Ball, Titchy, Stunty, Very Long Legs and Leap. Original
skills are suppressed, the ball is released, and the original profile returns
at drive end. An existing Frog cannot be targeted again. The Wizard use does
not replenish at halftime.

FFB sources: common `inducement/InducementCollection`, `factory/GameOptionFactory`,
`model/FieldModel`, `model/ZappedPosition`; BB2025 `shared/StepEndFeeding`,
`inducements/StepInitInducement`, `StepWizard`, `special/StepSpecialEffect`,
`generator/SpecialEffect`, `mechanics/GameMechanic`; server `DiceInterpreter`,
`injury/injuryType/InjuryTypeFireball`; selected Armour/Injury modifier factories.

## Mercenaries

Configure staff and inducements → Mercenaries shows available roster positions,
base hiring price plus 30,000 gp, and an optional single Primary skill for
50,000 gp. Mercenaries get Loner (4+) and their normal starting skills. The
Primary skill list follows FFB's mercenary category/duplicate checks, including
combinations that the permanent advancement UI restricts. It does not silently
apply the permanent-player advancement restrictions to mercenary purchases.

Limits use the available match squad: sixteen players, position allowances and
shared Big Guy limits. Missing saved players are absent from this squad;
Journeymen already added to it count. Riotous Rookies are added later and can
exceed sixteen under their own rule. League purchases use the existing CTV
order and budgets; mercenary fees contribute to the opposing underdog's budget
and to actual Treasury settlement. Removing a purchase before locking refunds
that fee. Exhibition purchases use the same prices without saved-team spending.

Mercenaries enter reserves with distinct names and normal dugout/setup controls.
They are temporary inducement players, not Journeymen or raised recruits. They
cannot receive MVP, be hired through postgame offers, or alter permanent roster
profiles. Their match statistics do not create saved player progression.

FFB sources: `factory/GameOptionFactory`; BB2025 `start/StepBuyInducements` and
`end/StepMvp`; client `inducements/MercenaryTableModel`, `MercenaryTable` and
`AbstractBuyInducementsDialog`.

## Verification and limits

Deterministic tests cover spell thresholds, damage modifiers, targeting,
ownership, cancellation/stale decisions, turn progression, skill replacement,
drive restoration, purchasing, budget/refund guards, roster limits, actual Loner
checks and postgame exclusion. The complete inline UI tests exercise purchase
controls, mercenary dugout placement and spell targeting/confirmation.

These are source-derived tests, not a Java/JavaScript differential runner.
Browser automation was disabled in Work settings during this session; no new
desktop/mobile screenshots or visual certification are claimed. Fireball
prepares injury placement and resolves the ball before medical treatment,
following FFB's spell sequence. Rare spell/skill chains are not exhaustively
certified.

Remaining match parity work includes automatic underdog prayers and their
effects, named coaching staff, named stars/unique abilities and special
inducement players. Full-match combination verification, in-progress match
persistence, AI and fuller competition options remain separate gaps.
