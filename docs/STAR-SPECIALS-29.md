# Completed checked star catalogue — v0.0.29

The nineteen remaining known entries are playable: **67 named players through
64 hiring entries**. This completes the earlier 63-entry catalogue plus Da Red
Gobbo's Squigmobile. It does not assert coverage of every future supplement or
every multi-ability combination.

| Player | Ability behavior |
| --- | --- |
| Barik Farblast | Blast It offers a guarded choice for each Hail Mary scatter, with its destination preview. Each chosen die may be re-rolled once. Using a re-roll grants the selected executable catch bonus to friendly missed-pass/scatter catchers, including subsequent bounces. |
| Captain Karina von Riesz | Tasty Morsel extends Bloodlust feeding targets to adjacent opposing non-stars with current ST at most three. It is spent only for an opposing bite. Biting an opposing holder does not cause the friendly-carrier feeding turnover. Normal feeding injury and treatment apply. |
| Estelle la Veneaux | Optional Baleful Hex at activation start: opponent within five, 2+ with ordinary re-roll resources. Success distracts the victim and prevents their next team-turn activation; failure spends the game use and permits Estelle's action to continue. |
| Glotl Stop | After failed Animal Savagery and its re-roll window, Primal Savagery optionally substitutes adjacent standing opposing victims. Normal damage applies and the activation resumes. It is a game use, without a friendly-carrier turnover for hitting an opponent. |
| Grombrindal | Wisdom chooses an unused standing/prone teammate within two and one unowned skill from Break Tackle, Dauntless, Mighty Blow and Sure Feet. The skill expires with the turn and never rewrites the permanent profile. |
| Guffle Pusmaw | Quick Bite interrupts a successful ordinary ball catch before scoring and the catch continuation. Optional opposing-coach choice, game use, armour and injury, then possession transfers only if armour breaks. Defender Dwarfen Grit and treatment remain available. Bomb catches do not trigger it. Independent pass possession/turnover rules still apply. |
| Ivar Eriksson | Raiding Party chooses an open standing teammate within five, including Ivar if eligible. Move one empty square adjacent to an opponent. The teammate's activation and movement allowance remain available; ball movement and pickup failure retain normal consequences. Drive use. |
| Jeremiah Kool | The Flashing Blade is an explicit Special action: adjacent standing opponent, normal Foul Appearance/Dump-off/Trickster windows and Stab damage, followed by Move. It spends a game use and no Blitz allowance. |
| Maple Highgrove | Vicious Vines permits a Block against a standing opponent two squares away once per half. It uses normal Block dice, assists, reactions and damage, with no follow-up. Adjacent Blocks remain ordinary. |
| Nobbla Blackwart | Kick 'em While They're Down is a Special action against a prone/stunned opponent, or a downed-target Chainsaw Blitz. It retains kickback, damage, movement/Rush cost and remaining Chainsaw Blitz movement. It spends a game use, no Foul allowance, and never checks foul doubles for send-off. |
| Rodney Roachbait | Catch of the Day at standing activation start: loose ball within three, 3+ with normal re-rolls; success grants possession. Half use, no turnover from a failed skill roll. |
| Rumbelow Sheepskin | Ram shares the speculative armour/injury capture boundary: optional +1 to armour or injury on an opposing Block knockdown, after the roll, once per game. Only the selected result commits casualty effects. |
| Scrappa Sorehead | Yoink replaces a chosen ball or bomb interception test with a 2+ skill roll, ignoring ordinary agility/weather/marking modifiers. It retains the interception's normal success/failure continuation and available re-rolls; game use. |
| Scyla Anfingrimm | Failed Unchannelled Fury on an ordinary Block may use Fury of the Blood God after ordinary re-rolls. Finish the first complete Frenzy chain, then select a second adjacent standing opponent for another complete Block/Frenzy chain. No second activation roll; game use. Turnovers still stop further attacks. |
| Swiftvine Glimmershard | Furious Outburst is an explicit Special action, consuming the Blitz and a half use. Select an opponent within three, test Foul Appearance before placement, choose an empty adjacent square, Stab, then place within three again. Placement bounces a loose ball rather than picking it up. A carrier entering the endzone must finish there. No Dodge/Rush rolls for placement. |
| The Black Gobbo | Sneakiest of the Lot gives Gobbo his own Foul declaration allowance. His Foul does not spend the ordinary team's Foul; another player may declare the ordinary one before or after him. Existing free-foul rules remain separate. |
| Thorsson Stoutmead | Optional Beer Barrel Bash at activation start, standing opponent within three. A 3+ knocks the target down, 2 does nothing, 1 makes Thorsson fall. Ordinary re-rolls precede the result; activation ends, drive use. |
| Zzharg Madeye | Optional Blastin at activation start, standing opponent within three. A 3+ hits the target; 2 lets the opposing coach select either team's player within three of the original target, excluding Zzharg; 1 hits Zzharg. Armour holding leaves the victim standing. Normal re-rolls, half use, activation ends. Eligibility requires Favoured of Hashut. |
| Da Red Gobbo's Squigmobile | Exhibition only, any roster except Dwarf, and both coaches must agree through the hire/consent controls. Have a Present supplies one additional Bribe each half. It is spent before permanent Bribes and expires unused before the next half's grant. Duplicate cancellation grants neither team a bonus. |

## Source and verification boundaries

Executable reference: FFB `bf3f89d96b5143a8730910a841e7430791094492`, selecting
BB2025 special definitions and registered mixed definitions. Relevant sources:

- BB2025 `StepBalefulHex`, `StepWisdomOfTheWhiteDwarf`, `StepRaidingParty`,
  `StepCatchOfTheDay`, `StepThenIStartedBlastin`, `StepEndFuriousOutburst`.
- Selected mixed `StepThrowKeg`, `StepQuickBite`, `StepInitFuriousOutburst`,
  `StepFirstMoveFuriousOutburst`, `StepSecondMoveFuriousOutburst` and their
  BB2025 sequence generators.
- BB2025 `AnimalSavageryBehaviour`, `UnchannelledFuryBehaviour`,
  `StepInitFeeding`, `StepIntercept`, `StepMissedPass`, `StepInitBlocking`,
  `StepEndBlocking`; mixed `RamBehaviour` / `AvOrInjModification`.
- BB2025 `GameMechanic`, `CatchModifierCollection`, selected injury types
  `QuickBite`, `KegHit`, `ThenIStartedBlastin`, and client target selection.

Profiles and eligibility use the corresponding
[BB2025 catalogue pages](https://bloodbowlbase.ru/bb2025/starplayers/).
Squigmobile is a supplemental entry absent from the pinned executable tree:
its profile, consent restriction and half Bribe follow the
[published supplemental entry](https://bloodbowlbase.ru/bb2025/starplayers/Da_Red_Gobbos_Squigmobile/),
and are not claimed as a pinned FFB port.

Selected executable distinctions include Grombrindal's unused-player filter,
Thorsson's standing-target filter, Blast It's catch bonus requiring use of a
scatter re-roll, Yoink's skill-roll interception, and Zzharg's armour holding
leaving the victim standing. The browser uses its existing guarded decision
callbacks; it remains self-contained for GitHub Pages.

Deterministic ability tests, actual full-bundle UI scenarios and twenty-five
two-half lifecycle cases are separate evidence. Lifecycle cases collectively
field all 67 named players; they do not exercise every ability combination.
No new visual browser review or full Java/JavaScript match differential is
claimed. Broader combination audits and product gaps remain in
[PARITY-GAPS](PARITY-GAPS.md).
