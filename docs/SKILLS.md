# Skills and traits coverage — v0.0.14

Updated October 29, 2026 using the owner's requested FFB BB2025 baseline. FFB code takes priority where it conflicts with earlier browser behavior. See [the comparison and remaining gaps](FFB-AUDIT.md), [all 108 FFB skill definitions](FFB-SKILL-MAP.md), and [FFB attribution](../THIRD_PARTY_NOTICES.md). This is a targeted port, not a claim of complete FFB parity.

The latest exhibition batch implements Kick Team-mate, Swoop, Lethal Flight, Animal Savagery, Trickster, Hit and Run, Dump-off, Punt, Monstrous Mouth, Pile Driver, On the Ball and Saboteur, and completes Chainsaw foul use. These share guarded decisions, attack/pass suspension, bounded reaction movement, per-Block knockdown outcomes, damage attribution and relocation restrictions. See [special actions and reaction contexts](SPECIAL-ACTIONS.md) for implementation boundaries, source paths, defaults and tests.

Diving Catch offers the active coach a catcher choice before the opposing coach, retaining delivery mode through re-rolls and bouncing failed adjacent catches from the catcher. Safe Pair of Hands offers an empty adjacent placement before eligible falls and prone placements, preserving actual knockdown turnovers while avoiding the Wrestle carrier-drop turnover. See [ball landing and placement](CATCH-PLACEMENT.md) for the pinned FFB differences and [the exhibition backlog](EXHIBITION-PARITY.md).

Diving Tackle offers the moving coach modifiers/re-rolls before the defender's selection, retains the final die and places one tackler prone without armour. Using it suppresses Shadowing; Pogo cancels its effect on jumps. Steady Footing offers a separate 6+ test before a fall, retaining any remaining movement checks and independent turnovers. Rushes precede Tentacles as in FFB. See [Diving Tackle and Steady Footing](DODGE-FOOTING.md).

Shadowing and Arm Bar use departure continuations before pickup or injury. Shadowing has one defender selection per exit and an MA-based attempt limit per turn. Arm Bar offers one selected defender's post-roll armour or injury modifier. The pinned FFB implementation suppresses both Arm Bar modifiers against Iron Hard Skin; Mighty Blow and Dirty Player injury modifiers remain available.

Earlier decisions include optional Break Tackle, Bullseye after a Superb Throw, and a team re-roll of a failed Pro check. Pro is once per player per turn; multiple team re-rolls on separate tests in one turn remain legal. Strong Arm modifies Throw Team-mate accuracy when enabled. Strong Arm and Bullseye require Throw Team-mate in the laboratory. Lone Fouler may re-roll broken-armour doubles before injury. Argue the Call one forbids a Bribe for that send-off; other failed Bribes may be followed by further available Bribes.

Build with `node build.cjs` and verify all suites with `node --test *.test.cjs`. This includes FFB-derived regression scenarios and tests that execute the actual inline browser UI against a small DOM harness.

Reviewed October 28, 2026 against the full [Blood Bowl 2025 Skills & Traits list](https://bloodbowlbase.ru/bb2025/core_rules/skills_and_traits/), [current FAQ](https://bloodbowlbase.ru/bb2025/core_rules/latest_faq/), [Foul / Argue the Call rules](https://bloodbowlbase.ru/bb2025/core_rules/the_game_of_blood_bowl/#foul-actions), and [Bribes](https://bloodbowlbase.ru/bb2025/core_rules/inducements/#0-3-bribes-0-6-for-teams-with-the-bribery-and-corruption-special-rule).

All 108 entries are accounted for: **98 implemented**, **2 partial**, **8 deferred**. Implemented describes support within the available actions and exhibition sequence, not missing league or inducement systems. Deferred abilities are not offered as laboratory additions. Each deferred row records the missing dependency for a future pass. This table and the app inventory share the same registry in skills.cjs.

## How to try them

Select **Skills laboratory**, select a player, then use **Add a laboratory skill** in the side panel. The menu contains supported abilities and representative Loner, Animosity, and Hatred parameters. Incompatible combinations (Frenzy/Grab and Leap/Pogo) are rejected even when an owned skill is disabled. Existing matches keep their roster skills; the lab does not alter the published team profiles.

Optional benefits default on. The owning coach can switch an optional skill off before dice resolution using its side-panel control. Mandatory skills cannot be switched off. Re-rolls, Dirty Player / Mighty Blow choices, Stand Firm, Wrestle, Juggernaut, Taunt, Kick deviation and send-off decisions remain explicit. Numeric bonuses such as Extra Arms and Accurate apply when enabled. Passive effects remain applicable while prone/distracted; active effects require their stated status (with exceptions such as Jump Up and Mighty Blow during mutual knockdowns).

The **Foul / special action** button declares Foul, Stab, Projectile Vomit, Hypnotic Gaze, Breathe Fire, Chainsaw, Chomp or Punt when eligible. Foul, Hypnotic Gaze and Punt permit movement first. Use **Punt now** after moving or gaining possession. The other direct special actions do not grant a free Move. Eligible Blitz replacements appear beside the Block choices and cost one MA (with a Rush if needed); Chomp preserves Blitz continuation. Quick Foul preserves unused movement but permits no second foul; Pile Driver overrides it and ends the activation after the free foul and prone placement. Fumblerooski can be armed before the next move; Hail Mary can be selected explicitly for an in-range target and is used automatically beyond normal range.

## Coverage inventory

Throw Team-mate, Right Stuff, and Always Hungry now support declaration, movement before throwing, adjacent passenger selection, Quick/Short range, accuracy re-rolls, three-square scatter, fumbles, landing re-rolls, collision chains, crowd injury, carried balls, touchdowns, and the Troll's eating sequence. Select **Throw Team-mate practice** for a Troll and Goblin drill. Declare the action, choose the passenger in the side panel, then click a highlighted target twice. Throwing uses a separate once-per-turn allowance from Pass. Eaten players remain unavailable on later drives. Permanent league roster deletion awaits league persistence.

Kick Team-mate uses a separate declaration allowance and shares the passenger/target controls. Swoop offers cardinal template and direction/distance choices; Lethal Flight supplies an opponent-only damage window. Dump-off, Trickster, On the Ball, Hit and Run and Pile Driver display the deciding coach and pause the parent action. Movement choices use square coordinates in the side panel. See SPECIAL-ACTIONS.md for FFB exceptions and remaining scope.

Sources: [Throw Team-mate and landing](https://bloodbowlbase.ru/bb2025/core_rules/the_game_of_blood_bowl/#throw-team-mate-actions), the range chart on that page, and the trait entries in the Skills & Traits list.

| Entry | Category | Use | Status | Coverage / remaining dependency |
| --- | --- | --- | --- | --- |
| Catch | Agility | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Diving Catch | Agility | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Diving Tackle | Agility | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Dodge | Agility | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Defensive | Agility | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Hit and Run | Agility | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Jump Up | Agility | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Leap | Agility | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Safe Pair of Hands | Agility | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Sidestep | Agility | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Sprint | Agility | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Sure Feet | Agility | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Dirty Player | Devious | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Eye Gouge | Devious | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Fumblerooski | Devious | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Lethal Flight | Devious | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Lone Fouler | Devious | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Pile Driver | Devious | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Put the Boot In | Devious | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Quick Foul | Devious | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Saboteur | Devious | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Shadowing | Devious | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Sneaky Git | Devious | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Violent Innovator | Devious | Active | Deferred | Requires Star Player Point attribution and league progression. |
| Block | General | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Dauntless | General | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Fend | General | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Frenzy | General | Active * | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Kick | General | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Pro | General | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Steady Footing | General | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Strip Ball | General | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Sure Hands | General | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Tackle | General | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Taunt | General | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Wrestle | General | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Big Hand | Mutation | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Claws | Mutation | Passive | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Disturbing Presence | Mutation | Passive * | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Extra Arms | Mutation | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Foul Appearance | Mutation | Passive * | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Horns | Mutation | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Iron Hard Skin | Mutation | Passive | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Monstrous Mouth | Mutation | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Prehensile Tail | Mutation | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Tentacles | Mutation | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Two Heads | Mutation | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Very Long Legs | Mutation | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Accurate | Passing | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Cannoneer | Passing | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Cloud Burster | Passing | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Dump-off | Passing | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Give and Go | Passing | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Hail Mary Pass | Passing | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Leader | Passing | Passive | Partial | Exhibition re-roll and missing-Leader eligibility are supported; Halfling Master Chef interactions await inducements. |
| Nerves of Steel | Passing | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| On the Ball | Passing | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Pass | Passing | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Punt | Passing | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Safe Pass | Passing | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Arm Bar | Strength | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Brawler | Strength | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Break Tackle | Strength | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Bullseye | Strength | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Grab | Strength | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Guard | Strength | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Juggernaut | Strength | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Mighty Blow | Strength | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Multiple Block | Strength | Active | Deferred | Needs two simultaneous Block resolutions, both completed even if one causes a turnover. |
| Stand Firm | Strength | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Strong Arm | Strength | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Thick Skull | Strength | Passive | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Always Hungry | Traits | Active * | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Animal Savagery | Traits | Passive * | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Animosity (X) | Traits | Active * | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Ball & Chain | Traits | Active * | Deferred | Needs directional random movement, collision Blocks against either team and special injury handling. |
| Bloodlust (X+) | Traits | Passive * | Deferred | Needs Thrall selection, bite injury, action replacement and feeding before passing or scoring. |
| Bombardier | Traits | Active | Deferred | Needs a separate bomb object, explosions, recursive caught-bomb throws and simultaneous injuries. |
| Bone Head | Traits | Passive * | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Breathe Fire | Traits | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Chainsaw | Traits | Active * | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Decay | Traits | Passive * | Deferred | Requires actual Casualty Table rolls; current casualties remove players without persistent injury results. |
| Drunkard | Traits | Passive * | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Hatred (X) | Traits | Passive * | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Hypnotic Gaze | Traits | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Insignificant | Traits | Passive * | Deferred | Requires the Team Draft List / roster builder. |
| Kick Team-mate | Traits | Passive | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Loner (X+) | Traits | Passive * | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| My Ball | Traits | Passive * | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| No Ball | Traits | Passive * | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Pick-me-up | Traits | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Plague Ridden | Traits | Passive | Deferred | Requires death results, apothecary timing, roster additions and post-game hiring. |
| Pogo | Traits | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Projectile Vomit | Traits | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Really Stupid | Traits | Passive * | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Regeneration | Traits | Passive | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Right Stuff | Traits | Passive * | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Secret Weapon | Traits | Passive * | Partial | End-of-drive send-off, Argue the Call and available Bribes are supported; bribe-related roster special rules await inducements. |
| Stab | Traits | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Stunty | Traits | Passive * | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Swoop | Traits | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Take Root | Traits | Passive * | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Throw Team-mate | Traits | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Timmm-ber! | Traits | Passive | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Titchy | Traits | Passive * | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Trickster | Traits | Active | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Unchannelled Fury | Traits | Passive * | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |
| Unsteady | Traits | Passive * | Implemented | Supported in the available actions. Optional abilities may be disabled before action resolution. |

## Validation and remaining work

Run `node build.cjs`, then `node --test movement.test.cjs match.test.cjs skills.test.cjs`. Tests use injected dice for movement, passing, activation traits, Block timing, Foul modifiers, send-offs, Bribes, end-of-drive Secret Weapon handling, Leader pools, and catalogue completeness. All browser engines are checked against their source and compiled together.

The in-memory interruption stack and explicit reaction contexts support the current departures, catches, placements, nested Quick Pass and bounded defensive movement. Simultaneous explosions/Blocks still need group resolution; bombs need their own airborne object and caught-bomb continuations. Casualty-dependent match effects need actual Casualty Table results and treatment timing. Roster creation and league progression remain later work. No deferred skill is treated as implemented merely because its name appears on a roster.

The source now permits negative modified D6 results: a modified pass result of exactly 1 (or natural 1) fumbles; a negative failed result scatters as inaccurate. This corrects the older engine's one-or-less fumble assumption. Stunty's interception penalty, Tackle's Dodge re-roll restriction, Jump Up standing cost, and the three legal straight push squares were also corrected during this audit.
