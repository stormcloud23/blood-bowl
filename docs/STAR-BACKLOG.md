# Remaining named-star work after v0.0.27

Twenty-two named players are supported through twenty-one hiring entries, including
the Swift Twins. This is a partial named-star catalogue. See [STARS.md](STARS.md)
for the implemented set and executable comparison scope.
The [current gap audit](PARITY-GAPS.md) lists the 42 unsupported hiring entries
from the checked published index. This backlog records shared prerequisites.

## Recommended next group: injury alternatives

Josef Bugman as a **star** (Dwarfen Grit), Varag (Krump and Smash), Grim (Slayer)
and the Mighty Zug (Crushing Blow) share FFB's alternate injury-context system.
Do not add them as ordinary +1/armour re-roll buttons before auditing this flow.

Pinned sources under `ffb-server/src/main/java/com/fumbbl/ffb/server/`:

- `injury/injuryType/ModificationAwareInjuryTypeServer`
- `injury/modification/InjuryContextModification`, `AvOrInjModification`,
  `CrushingBlowModification`
- `injury/modification/bb2025/RerollArmourModification`,
  `DwarfenGritModification`, `KrumpAndSmashModification`, `SlayerModification`
- `step/bb2025/shared/StepHandleDropPlayerContext`
- `InjuryResult.swapToAlternateContext`

The executable flow computes the ordinary armour result, then can compute an
alternate armour result and its injury context **before** the ordinary injury
context. The later guarded decision selects which context applies. An unused
alternate must not grant SPP, create permanent casualties, spend medical staff,
release the ball twice or cause an extra turnover. The current browser
`resolveInjury` immediately records casualty SPP before scheduling treatment;
this needs a deliberate capture/commit boundary for speculative alternatives.
Wizard injury capture is useful prior work but does not establish this parity.

Important source conditions:

- Dwarfen Grit is a defender modification, works on any supported injury type
  with an actual broken armour roll, and is once per game.
- Krump and Smash is restricted to Block injury contexts and uses the normal
  failed-armour re-roll proposal. Do not treat every knockdown as a Block.
- BB2025 Slayer checks the **Big Guy keyword**, rather than the older ST5+
  comment in the mixed skill definition; it can modify armour or injury.
- Crushing Blow can replace Mighty Blow's armour use, preserving the latter's
  availability on injury. Iron Hard Skin and modifier ordering need coverage.
- FFB's common modification entry point suppresses armour skill modifications
  when the defender still has the cancelling armour property available.
- Adding the Bugman star also requires mutually exclusive star/staff purchasing
  in both directions, per `StarPlayerTableModel` and
  `AbstractBuyInducementsDialog`. Bugman staff is already supported separately.

Require ordinary and Multiple Block, grouped damage, actual casualty credit,
ball release, Steady Footing, Regeneration/apothecaries, replay guards and both
coaches in that audit. Do not infer completed support from a catalogue entry.

## Other shared dependency groups

- **Follow-up special actions:** Max's second Chainsaw attack, Bomber's Kaboom
  and Bilerot's post-Block/post-Blitz Vomit are implemented. Other compound
  actions still need their own sequencing/use guards. Inspect the selected
  BB2025 definitions rather than older descriptions.
- **Other paired stars:** Dribl/Drull need partner-conditioned Foul/Stab injury
  modifiers. Grak/Crumbleberry need carrying state, temporary skills and a
  reliable forced-placement/drop sequence. FFB documents additional behavior
  when no empty adjacent square exists. The Swift-pair purchase plumbing now
  provides atomic fees, two roster places, one hiring selection and duplicate
  cancellation; it does not implement other pairs' abilities.
- **Temporary enhancements and reactions:** further named stars grant movement,
  jump, skill or profile effects with action/turn/half boundaries. Keep these
  separate from saved roster profiles, as Frenzied Rush and prayers already do.
- **Remote/compound actions:** additional named actions need valid target and
  ownership previews, correct normal action limits, and interruption-safe
  resumptions; do not offer them as inert purchases.

## Separate match/system gaps

Broader shared-skill combinations, kickoff and medical sequencing still need
comparison. In-progress match persistence, AI, full competition options and the
remaining special inducement players are separate work. Current 108-skill
coverage labels and the 30-roster catalogue are not proof of full FFB parity.
