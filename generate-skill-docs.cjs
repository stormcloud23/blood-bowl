const fs=require('node:fs');
const {SKILL_CATALOG}=require('./skills.cjs');
const counts=SKILL_CATALOG.reduce((r,s)=>(r[s.status]=(r[s.status]||0)+1,r),{});
const intro=`# Skills and traits coverage — v0.0.14

Updated October 29, 2026 using the owner's requested FFB BB2025 baseline. FFB code takes priority where it conflicts with earlier browser behavior. See [the comparison and remaining gaps](FFB-AUDIT.md), [all 108 FFB skill definitions](FFB-SKILL-MAP.md), and [FFB attribution](../THIRD_PARTY_NOTICES.md). This is a targeted port, not a claim of complete FFB parity.

New decisions include optional Break Tackle, Bullseye after a Superb Throw, and a team re-roll of a failed Pro check. Pro is once per player per turn; multiple team re-rolls on separate tests in one turn remain legal. Strong Arm modifies Throw Team-mate accuracy when enabled. Strong Arm and Bullseye require Throw Team-mate in the laboratory. Iron Hard Skin blocks armour bonuses but permits injury bonuses. Lone Fouler may re-roll broken-armour doubles before injury. Argue the Call one forbids a Bribe for that send-off; other failed Bribes may be followed by further available Bribes.

Build with \`node build.cjs\` and verify all suites with \`node --test *.test.cjs\`. This includes FFB-derived regression scenarios and tests that execute the actual inline browser UI against a small DOM harness.

Reviewed October 28, 2026 against the full [Blood Bowl 2025 Skills & Traits list](https://bloodbowlbase.ru/bb2025/core_rules/skills_and_traits/), [current FAQ](https://bloodbowlbase.ru/bb2025/core_rules/latest_faq/), [Foul / Argue the Call rules](https://bloodbowlbase.ru/bb2025/core_rules/the_game_of_blood_bowl/#foul-actions), and [Bribes](https://bloodbowlbase.ru/bb2025/core_rules/inducements/#0-3-bribes-0-6-for-teams-with-the-bribery-and-corruption-special-rule).

All ${SKILL_CATALOG.length} entries are accounted for: **${counts.Implemented} implemented**, **${counts.Partial} partial**, **${counts.Deferred} deferred**. Implemented describes support within the available actions and exhibition sequence, not missing league or inducement systems. Deferred abilities are not offered as laboratory additions. Each deferred row records the missing dependency for a future pass. This table and the app inventory share the same registry in skills.cjs.

## How to try them

Select **Skills laboratory**, select a player, then use **Add a laboratory skill** in the side panel. The menu contains supported abilities and representative Loner, Animosity, and Hatred parameters. Incompatible combinations (Frenzy/Grab and Leap/Pogo) are rejected even when an owned skill is disabled. Existing matches keep their roster skills; the lab does not alter the published team profiles.

Optional benefits default on. The owning coach can switch an optional skill off before dice resolution using its side-panel control. Mandatory skills cannot be switched off. Re-rolls, Dirty Player / Mighty Blow choices, Stand Firm, Wrestle, Juggernaut, Taunt, Kick deviation and send-off decisions remain explicit. Numeric bonuses such as Extra Arms and Accurate apply when enabled. Passive effects remain applicable while prone/distracted; active effects require their stated status (with exceptions such as Jump Up and Mighty Blow during mutual knockdowns).

The **Foul / special action** button declares Foul, Stab, Projectile Vomit, Hypnotic Gaze, Breathe Fire or Chainsaw when eligible. Foul and Hypnotic Gaze permit movement first. The other direct special actions do not grant a free Move. Eligible Blitz replacements appear beside the Block choices, cost one MA (with a Rush if needed), and end the activation as their rules require. Quick Foul preserves unused movement but permits no second foul. Fumblerooski can be armed before the next move; Hail Mary can be selected explicitly for an in-range target and is used automatically beyond normal range.

## Coverage inventory

Throw Team-mate, Right Stuff, and Always Hungry now support declaration, movement before throwing, adjacent passenger selection, Quick/Short range, accuracy re-rolls, three-square scatter, fumbles, landing re-rolls, collision chains, crowd injury, carried balls, touchdowns, and the Troll's eating sequence. Select **Throw Team-mate practice** for a Troll and Goblin drill. Declare the action, choose the passenger in the side panel, then click a highlighted target twice. Throwing uses a separate once-per-turn allowance from Pass. Eaten players remain unavailable on later drives. Permanent league roster deletion awaits league persistence.

Sources: [Throw Team-mate and landing](https://bloodbowlbase.ru/bb2025/core_rules/the_game_of_blood_bowl/#throw-team-mate-actions), the range chart on that page, and the three trait entries in the Skills & Traits list.

| Entry | Category | Use | Status | Coverage / remaining dependency |
| --- | --- | --- | --- | --- |
`;
const rows=SKILL_CATALOG.map(s=>`| ${s.name} | ${s.category} | ${s.kind}${s.mandatory?' *':''} | ${s.status} | ${s.notes.replaceAll('|','/')} |`).join('\n');
fs.writeFileSync('docs/SKILLS.md',intro+rows+`\n
## Validation and remaining work

Run \`node build.cjs\`, then \`node --test movement.test.cjs match.test.cjs skills.test.cjs\`. Tests use injected dice for movement, passing, activation traits, Block timing, Foul modifiers, send-offs, Bribes, end-of-drive Secret Weapon handling, Leader pools, and catalogue completeness. All browser engines are checked against their source and compiled together.

Deferred reaction skills need a reusable event/interrupt stack rather than more single pending-choice callbacks. Thrown-player and bomb abilities need separate airborne objects and collision resolution. League-dependent abilities need Casualty Table results, SPP attribution and roster changes. These are recorded individually above; no deferred skill is treated as implemented merely because its name appears on a roster.

The source now permits negative modified D6 results: a modified pass result of exactly 1 (or natural 1) fumbles; a negative failed result scatters as inaccurate. This corrects the older engine's one-or-less fumble assumption. Stunty's interception penalty, Tackle's Dodge re-roll restriction, Jump Up standing cost, and the three legal straight push squares were also corrected during this audit.
`);
