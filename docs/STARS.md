# Named star players — first supported group

Seventeen named players (sixteen hiring entries) are available through **Configure staff and inducements →
Star players**. The menu offers only stars eligible for the team's selected
roster league or matching special rule. Alternate roster leagues must be chosen
before the match. Selecting a star previews their actual profile and skills,
then asks for confirmation; removing a pregame hire refunds the fee.

| Star | Fee | Eligibility | Unique ability |
| --- | ---: | --- | --- |
| The Swift Twins (Lucien and Valen) | 300K pair | Elven Kingdoms League | Working in Tandem: partner-marked Block re-roll and special passing distance |
| Morg 'n' Thorg | 340K | Any league except Sylvanian Spotlight | The Ballista: once per game, re-roll failed PA in Pass/Throw Team-mate windows |
| Fungus the Loon | 80K | Badlands Brawl or Underworld Challenge | Whirling Dervish: once per turn, re-roll movement direction |
| Glart Smashrip | 175K | Underworld Challenge | Frenzied Rush: once per half, gain Frenzy for a Blitz activation; suppress Grab that turn |
| Kiroth Krakeneye | 160K | Elven Kingdoms League | Black Ink: once per game, distract an adjacent opponent |
| Zolcath the Zoat | 220K | Elven Kingdoms League or Lustrian Superleague | Zoat distraction: once per game, distract a standing opponent within three squares |
| Anqi Panqi | 190K | Lustrian Superleague | Savage Blow: once per game, re-roll a chosen nonempty subset of Block dice |
| Karla von Kill | 210K | Lustrian Superleague or Old World Classic | Indomitable: once per game, double target Strength after successful Dauntless |
| Eldril Sidewinder | 220K | Elven Kingdoms League | Mesmerising Dance: once per half, re-roll Hypnotic Gaze |
| Akhorne The Squirrel | 80K | Any team | Blind Rage: pinned automatic re-roll of a failed Dauntless die |
| Ripper Bolgrot | 250K | Badlands Brawl or Underworld Challenge | Thinking Man's Troll: once per half, re-roll one action die or chosen Block die |
| Puggy Baconbreath | 130K | Halfling Thimble Cup or Old World Classic | Halfling Luck: once per game, re-roll one action die or chosen Block die |
| Griff Oberwald | 300K | Old World Classic | Consummate Professional: once per game, optional +1 on a qualifying Agility Test after the roll |
| Lord Borak the Despoiler | 270K | Chaos Clash | Lord of Chaos: once per game, re-roll one chosen Block die |
| H'thark the Unstoppable | 300K | Badlands Brawl or Favoured of Hashut | Unstoppable Momentum: re-roll one chosen die from a Blitz Block pool |
| Willow Rosebark | 160K | Woodland League | Woodland Fury: once per game, re-roll one chosen Block die when the pool would knock her down |

## Hiring and match boundaries

- At most two star selections and sixteen available participants before post-purchase
  additions; existing Journeymen and mercenaries count. A pair consumes one star
  selection and two roster places, following the pinned client's pair cap adjustment. A star does not
  consume
  a normal positional/shared Big Guy allowance. Missing permanent players are
  absent from the live roster. Riotous Rookies arrive later under their own cap.
- League purchases use the existing CTV order, Petty Cash/Treasury funding,
  underdog allowance, refund and final atomic postgame accounting. Exhibition
  purchasing remains freely configurable before fans, like other inducements.
- If both coaches hire the same named star, neither fields that star; both
  hiring fees remain spent. This follows the pinned default disallowing a star
  on both teams. Fees remain included in post-purchase prayer value.
- Stars enter the normal reserves/setup/dugout flow with distinct shirt numbers
  and full profile skills. They cannot become Team Captain or gain player
  prayers. Existing shared abilities remain active (e.g. Borak's Leader).
- Stars are excluded from MVP nomination, permanent hiring and permanent
  SPP/injury records. Their match events still contribute team results.
- One Block pool cannot be re-rolled a second time after these single-die
  re-rolls, consistent with the pinned Block-roll sequence and existing engine.
  They do not spend a Team re-roll or require Loner. Old UI buttons are guarded.
- Griff's modifier works on Dodge, Jump, Pick up, Catch, Intercept, Landing and
  Jump Up Block checks. It may rescue a re-rolled die but does not create a
  third roll or change natural-one failure. It is chosen before Diving Tackle.
  It does not modify Rush, PA, trapdoor, Regeneration or activation checks.
- Personal single-die re-rolls work in the supported action test windows, Block
  pools and Regeneration. They do not re-roll armour, injury or casualty dice.
  Ripper's Throw Team-mate accuracy window precedes Bullseye. Spending a personal
  re-roll does not open a second re-roll of the new die.
- Blind Rage follows executable mixed `DauntlessBehaviour` selected for BB2025:
  automatically re-roll a failed initial die before ordinary choices, and never
  re-roll that second die. Successful first rolls consume no extra die. Single
  Block/Blitz and Ball & Chain Dauntless now skip impossible strength gaps, like
  the existing Multiple Block implementation and pinned source.
- Savage Blow presents every nonempty subset of the current Block pool,
  including on Blitzes; only selected dice roll again. The match use and pool
  lock apply once, with no Team or Loner roll.
- Indomitable waits for a successful normal/Blitz Dauntless check, then optionally
  doubles the target's current Strength before assists. It lasts for that Block
  pool, consumes one match use and does not change the permanent profile.
- Mesmerising Dance is a Hypnotic Gaze re-roll only. It renews each half, does
  not spend Team re-rolls or require Loner, and ends the normal Gaze activation
  after success/failure. Failed re-rolls do not open a third roll.
- Black Ink and the Zoat ability offer a guarded target choice after activation
  checks. Declining preserves the use; the active player can also use it later
  while their activation remains open, matching the executable selection window,
  including Charge. Neither is offered while standing up. Black Ink can target
  adjacent standing/prone, non-Distracted opponents; Zoat targets standing,
  non-Distracted opponents within three squares. Stunned/distracted players are
  excluded. No die is rolled, possession is retained and the victim recovers
  when next activated. Used abilities remain spent across halftime.
- The Ballista follows its BB2025 registered PA re-roll sources, including Pass
  as well as Throw Team-mate (descriptive text is narrower). No Loner or Team
  resource is spent. Used Ballista does not renew at halftime.
- Whirling Dervish shows the original movement-direction die and destination
  before committing movement. Keep it or re-roll once per turn; the new die is
  final. Ordinary Ball & Chain movement still has no Team re-roll under the
  pinned ALLOW_BALL_AND_CHAIN_RE_ROLL=false default.
- Frenzied Rush is offered for a Blitz after activation checks. Frenzy remains
  through mandatory follow-up and its second Block, then expires when the
  activation ends. Grab stays unavailable for the rest of that turn. No permanent
  profile or roster skill is changed; the use renews at halftime.
- The Swift Twins are a single 300K hiring selection that atomically adds/removes
  two separate reserve players. Both must fit the funding and sixteen-player
  limits; each has its own shirt number/profile. Duplicate hires remove both
  pairs and retain both fees. Player profiles display the shared pair fee.
- Working in Tandem lets Lucien re-roll one chosen Block die while standing,
  non-Distracted Valen also marks the target. It has no match/half allowance but
  still locks the current Block pool against another re-roll. Valen's passes
  aimed at Lucien use FFB's Pass to Partner distance (range modifier zero);
  this special distance does **not** receive Accurate's Quick/Short bonus.
  Weather, Disturbing Presence, maximum range and Blizzard restrictions remain.
  A Frog twin no longer supplies their partnership ability.
- Willow uses the executable pool test: if the attacker chooses, every die must
  knock her down; if the defender chooses, any such die suffices. Block,
  Wrestle and Blitz Juggernaut make Both Down safe for this availability test.

## Sources

Profile/stat/eligibility references (BB2025):
[Griff](https://bloodbowlbase.ru/bb2025/starplayers/Griff_Oberwald/),
[Borak](https://bloodbowlbase.ru/bb2025/starplayers/Lord_Borak_the_Despoiler/),
[H'thark](https://bloodbowlbase.ru/bb2025/starplayers/H%27thark_the_Unstoppable/),
[Willow](https://bloodbowlbase.ru/bb2025/starplayers/Willow_Rosebark/),
[Ripper](https://bloodbowlbase.ru/bb2025/starplayers/Ripper_Bolgrot/),
[Puggy](https://bloodbowlbase.ru/bb2025/starplayers/Puggy_Baconbreath/),
[Akhorne](https://bloodbowlbase.ru/bb2025/starplayers/Akhorne_The_Squirrel/),
[Anqi](https://bloodbowlbase.ru/bb2025/starplayers/Anqi_Panqi/),
[Karla](https://bloodbowlbase.ru/bb2025/starplayers/Karla_von_Kill/),
[Eldril](https://bloodbowlbase.ru/bb2025/starplayers/Eldril_Sidewinder/),
[Kiroth](https://bloodbowlbase.ru/bb2025/starplayers/Kiroth_Krakeneye/),
[Zolcath](https://bloodbowlbase.ru/bb2025/starplayers/Zolcath_the_Zoat/),
[Morg](https://bloodbowlbase.ru/bb2025/starplayers/Morg_%27n%27_Thorg/),
[Fungus](https://bloodbowlbase.ru/bb2025/starplayers/Fungus_the_Loon/),
[Glart](https://bloodbowlbase.ru/bb2025/starplayers/Glart_Smashrip/),
[the Swift Twins](https://bloodbowlbase.ru/bb2025/starplayers/The_Swift_Twins/).
Only profile data and short implementation summaries are retained here.

FFB commit `bf3f89d96b5143a8730910a841e7430791094492` is the executable authority:

- `ffb-common/.../factory/GameOptionFactory`: INDUCEMENT_STARS_MAX=2;
  ALLOW_STAR_ON_BOTH_TEAMS=false.
- `ffb-client-logic/.../dialog/inducements/StarPlayerTableModel` and
  `AbstractBuyInducementsDialog`: star cap, roster slots, funding.
- `ffb-server/.../step/bb2025/start/StepBuyInducements`: named-star addition,
  duplicate cancellation, retained hiring costs and distinct roster players.
- `ffb-common/.../skill/bb2025/special/ConsummateProfessional`, `LordOfChaos`,
  `WoodlandFury`; `skill/mixed/special/UnstoppableMomentum`, `ThinkingMansTroll`,
  `HalflingLuck`, `BlindRage`, `SavageBlow`, `Indomitable` (selected for BB2025);
  BB2025 `MesmerisingDance` (its executable use period is once per half),
  `TheBallista`, `WhirlingDervish`, `FrenziedRush`, `WorkingInTandem`.
- `ffb-server/.../step/bb2025/block/StepBlockRoll` and
  `ffb-common/.../util/UtilPlayer.blockWouldKnockDownAttacker`: explicit die
  selection, re-roll windows, Willow availability and ability use.
- BB2025 `StepBlackInk`, `StepAutoGazeZoat`, their generators and
  `StepInitSelecting`/`StepEndSelecting`: activation and selecting windows,
  target differences, standing-up restrictions and distraction.
- BB2025 `move/StepMoveBallAndChain` and `StepSelectBlitzTarget`: Dervish
  direction choices and Frenzied Rush enhancement/use.
- BB2025 `mechanics/PassMechanic.findPassingDistance`, `PassingDistance`,
  mixed `Accurate`, `UtilPlayer.isPassingToPartner`/`isAttackerWorkingInTandem`,
  and the client `StarPlayerTableModel` pair cap/slot handling.
- `ffb-server/.../step/bb2025/end/StepMvp`: star/mercenary exclusion.
- `ffb-server/.../inducements/bb2025/prayers/PlayerSelector`: star exclusion.

Engine tests cover funding, eligibility, limits, cancellation, setup, ability
use/decline/re-rolls, Diving Tackle ordering, later turns/halves, and postgame.
Actual full-bundle UI tests cover purchase previews, replay protection, profile
and dugout placement, Griff's modifier, selected/subset Block dice, temporary
Frenzy, distraction, direction re-rolls and atomic paired-star purchases.
Five deterministic learning matches collectively deploy all seventeen named
players through both halves, kickoff, halftime and full time, including
Fungus's Secret Weapon removal. These transition scenarios do not exercise
every ability combination in those matches.
Browser visual review remains unavailable because local browser use is disabled
in Work settings. No new screenshots are claimed.

## Remaining scope

The rest of the named-star catalogue, other paired stars, the Bugman star/staff
mutual exclusion, other unique abilities and special inducement players remain
unsupported and are not offered as inert purchases. This group does not certify
all shared-skill combinations or full FFB match parity. The
[next implementation groups and injury-context audit](STAR-BACKLOG.md) record
concrete prerequisites for the remaining catalogue. Exhibition tournament
skill packages, AI and live match persistence remain separate work.

The v0.0.25 audit also fixes medical treatment of Zapped Frogs: BB2025
`mechanics/ApothecaryMechanic.apothecaryTypes` returns no source for a
`ZappedPlayer`, including Team/Wandering Apothecaries and Plague Doctors.
The browser now skips treatment and rejects direct source spending on Frogs.
