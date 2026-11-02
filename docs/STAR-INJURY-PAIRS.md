# Star injury alternatives and paired players

This increment translates selected executable FFB BB2025 behavior at
`bf3f89d96b5143a8730910a841e7430791094492`. It does not certify every combination.

## Injury capture and commitment

`MovementGame.createInjury` builds a candidate outcome without awarding casualty
credit, removing a player, spending treatment or recording a permanent result.
Its idempotent `commit()` grants attribution only for the selected outcome;
the existing medical scheduler retains ownership of treatment and continuation.
`resolveInjury` preserves the normal immediate-commit entry point.

Alternate armour contexts and their injury/casualty dice are generated before
the ordinary injury context, following `ModificationAwareInjuryTypeServer`.
Alternate reports remain hidden until selected. Steady Footing occurs after
the dice and before the guarded alternate-context choice; a successful save
discards both candidates. Declining preserves the once-game special use.
Ball release and treatment run once for the selected result. Multiple Block
retains its committed attacks and grouped medical processing.

- **Varag / Krump and Smash:** failed Block armour re-roll, including Blitz and
  Multiple Block injury contexts; not every fall is a Block. The alternate
  retains the ordinary context's armour Mighty Blow use, even when its new
  dice break armour naturally. Iron Hard Skin suppresses the proposal.
- **Grim / Slayer:** Big Guy keyword, not ST5+. A +1 armour or injury alternative
  must help; an injury-only alternate uses the original injury dice. Multiple
  Block ignores Frenzy. The armour cancellation gate does not cancel the
  independent injury modifier.
- **Zug / Crushing Blow:** may replace Mighty Blow used on armour, allowing
  Mighty Blow on the alternate injury; if both are required on armour, neither
  is also available on injury. Ordinary and alternate injury dice are separate.
- **Bugman / Dwarfen Grit:** defender-owned re-roll of a genuinely broken armour
  roll. Includes ordinary falls/Blocks, Stab/Chainsaw/Vomit, Fouls, Bombs,
  Fireball and Rock. An unrolled injury or holding armour has no proposal.
  Staff and star purchases exclude one another in both directions.

Sources: server `injury/modification` and BB2025 subclasses;
`injury/injuryType/ModificationAwareInjuryTypeServer`, `InjuryTypeBlock`,
`InjuryTypeFoul`, `InjuryTypeStab`, `InjuryTypeFireball`;
`step/bb2025/shared/StepHandleDropPlayerContext`, `StepSteadyFooting`;
`InjuryResult.swapToAlternateContext`; client `StarPlayerTableModel` and
`AbstractBuyInducementsDialog`.

## Dribl and Drull

One 230K hiring selection creates two distinct Skink profiles and takes two
roster slots. Eligibility is Lustrian Superleague. Refund and duplicate
cancellation remain atomic under the shared pair purchase implementation.

**A Sneaky Pair** requires two standing, non-Distracted adjacent teammates with
the shared ability. It modifies Foul/Stab, not Block. Armour receives the +1
only if needed, after ordinary modifiers such as Dirty Player; otherwise it
remains available on injury. It can stack with an unused Dirty Player injury
bonus. Prone, stunned, removed, distant and Zapped partners cannot supply it.
It has no once-game/half allowance. Iron Hard Skin suppresses its armour bonus
without removing the independent injury effect.

Sources: BB2025 `ASneakyPair`, `UtilPlayer.partnerMarksDefender`,
`InjuryTypeFoul`/`InjuryTypeStab` and corresponding SPP variants.

## Grak and Crumbleberry

One 250K hiring selection, available to any team, creates both profiles.
**I'll Carry You** records the initially adjacent partner and can be chosen at
activation start or later while that initial partner remains eligible. Picking
up temporarily removes Crumbleberry and grants Grak Dodge/Break Tackle. Ball
possession remains Crumbleberry's; neither permanent profile changes. A failed
Bone Head restores the original state, square and ball without spending the use.
Prone/stunned partners retain their old state when placed normally.

The passenger is placed at activation/turn end and before carrier removal.
Placement is mandatory and guarded; carried players appear as informational
Unavailable dugout cards, with a "Carried by Grak" explanation. The half use is
spent when placement resolves and renews at halftime. Ending a turn, a carrier
knockdown or a cancelled Foul Appearance attack cannot strand the passenger.

The pinned `CARRIED_PLAYER_BOUNCES_FROM_CARRIER=false` default chooses an empty
adjacent square. If none exists at a sideline/end zone, Crumbleberry suffers
crowd injury and a turnover. In the interior the coach selects an occupied
adjacent square, followed by collision/bounce/Landing processing. Carried
collisions do not borrow Lethal Flight casualty SPP. Friendly hits can turn
over; passenger placement can score if he retains the ball in the end zone.
The alternate bounce-from-carrier option is not exposed.

Sources: BB2025 `IllCarryYou`, `StepIllCarryYou`, `StepPlaceCarriedPlayer`,
`CarriedPlayerScatter`, `StepInitScatterPlayer`, `StepRightStuff`,
`UtilPlayer.findPickUpPartners`, `UtilServerGame.undoPickUpPartner`,
and `GameOptionFactory`.

## Verification and boundaries

Deterministic tests cover speculative casualty discard/commit, use/decline,
both coaches, Mighty Blow ordering, Iron Hard Skin, Steady Footing, medical
treatment, ball release, actual Multiple Block, both paired purchases and
carry restoration/placement/no-space paths. Bundled UI tests exercise the
real controls and stale-button guards. Lifecycle cases run the new stars through
two regulation halves; these are separate from ability-effect scenarios.

This is a selected port rather than a full Java integration differential test.
Every possible injury-type/ability/prayer/medical combination has not been
exhaustively verified. See [PARITY-GAPS](PARITY-GAPS.md) for remaining work.
