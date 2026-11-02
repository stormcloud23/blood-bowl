const path=require('node:path');
const projectPath=file=>path.resolve(__dirname,'..',file);
const fs=require('node:fs'),rosters=JSON.parse(fs.readFileSync(projectPath('src/data/rosters.json'),'utf8'));
const table=[...rosters].sort((a,b)=>a.name.localeCompare(b.name)).map(r=>'| ['+r.name+']('+r.source+') | '+r.tier+' | '+r.positions.length+' | '+(r.reroll/1000)+'K | '+(r.staff.apothecary?'50K':'Unavailable')+' |').join('\n');
const doc=`# BB2025 roster catalogue

All **30 rosters** in the checked BB2025 team index are available for local
league drafting, roster inspection and home/away exhibition selection. Use
**Find a roster** in the Rosters tab to filter the catalogue. Changing an
exhibition roster, roster league or alignment restarts that exhibition.

The original eight rosters and their IDs remain unchanged. The new additions
are Amazon, Bretonnian, Chaos Chosen, Chaos Dwarf, Chaos Renegades, Gnome,
Goblin, Halfling, High Elf, Human, Khorne, Necromantic Horror, Norse, Ogre,
Old World Alliance, Orc, Shambling Undead, Snotling, Tomb Kings,
Underworld Denizens, Vampire and Wood Elf.

## Data and sources

Profiles, prices, caps, advancement categories, tiers and rules were checked
against the linked BB2025 roster tables on October 31, 2026. These are current
2025 profiles, not a copy of the old 2020 roster lists. Starting skill names
use the existing engine's canonical names: Dirty Player (+1) maps to Dirty
Player, and Loner parameter spacing is normalized.

| Roster / source | Tier | Positions | Re-roll | Apothecary |
| --- | --- | --- | --- | --- |
${table}

Each demonstration selection fits a 1,000,000 gp draft including two re-rolls.
Most have eleven players. Snotlings have sixteen so their initial selection
can demonstrate Swarming and satisfy the Insignificant draft ratio. A demo
selection is an affordable example, not a recommended competitive build.
Alternative Big Guys are available in the team builder even when omitted
from the demonstration selection.

## Team rules

- **Team Captain (Human/Orc):** appoint a non-Big Guy in the team manager or
  exhibition pregame. Pro is granted without changing player value. Setup
  must field an available captain; suggested formation prioritizes them.
  A captain on the pitch saves an available team re-roll on a natural six,
  before Loner. Prone/stunned/distracted captains still count. A captain
  cannot create a re-roll from an empty pool. Once submitted, an existing
  captain cannot be replaced and can only be released after a characteristic
  injury, subject to the manager's normal release limits. A departed captain
  creates a replacement vacancy; appoint the replacement in the manager before
  starting the next fixture. Initial appointment is also available before the
  team's first fixture.
- **FFB captain timing:** the preservation roll also covers Leader/expiring
  coaching pools and successful Mascots, following the pinned BB2025
  RollMechanic. Failed Mascots are spent, and a saved re-roll does not bypass
  Loner. The active source keeps its normal consumption priority.
- **Low Cost Linemen (Ogre/Snotling):** remove the base Lineman hiring fee from
  CTV only. Treasury payments and full TV remain unchanged; advancement value
  still counts. Temporary Lineman Journeymen follow the same CTV rule.
- **Swarming (Snotling):** after both ordinary setups and before kicker
  nomination, roll D3 and optionally place that many additional reserve
  Linemen. Original players cannot be moved in this window. Half/occupancy and
  Wide Zone restrictions still apply. The additional allowance resets each
  drive. Use the coach panel to select a reserve, then click its destination.
- **Masters of Undeath:** after a final opposition Dead result, a non-Stunty
  player of modified ST 4 or less can supply one reserve Lineman per game.
  Treatment/Regeneration completes first. One eligible position is automatic;
  multiple types offer a coach choice, following pinned FFB behavior. A
  temporary seventeenth player is allowed. Raised players can be retained free
  in postgame if roster space permits; they add full player value and keep any
  earned match statistics/SPP. Plague Ridden shares this raised-recruit path.
- **Brawlin' Brutes / Bribery and Corruption:** existing SPP awards and resource
  discounts/argument re-rolls apply to every roster declaring these rules.
- **Roster league / Favoured alignment:** selectable leagues and Chaos
  alignments are exclusive choices, persisted and fixed at submission. Norse
  are Favoured of Khorne only when their roster league is Chaos Clash.
  Favoured of Nurgle controls Plague Doctor availability. Named stars remain
  out of scope. Halflings receive the existing 100K Master Chef price.
- **Shared positional caps:** Chaos Chosen, Old World Alliance and Underworld
  Denizens may have one Big Guy from their alternatives; Chaos Renegades may
  have three. Hiring and backup validation enforce combined limits.

The setup panel now allows benching a selected player before placing a
replacement. Captain deployment and normal formation validation still apply.
New required decisions receive keyboard focus and scroll into view; the coach
panel resets its scrolling for a new game or phase. Exhibition configuration
groups home and away choices separately.

## Implementation and verification

src/data/rosters.json is the catalogue source; scripts/build.cjs embeds it into the
standalone HTML. Match engines receive exactly two active teams. Original
practice fixtures remain separate in team-data. No runtime server or network
request is introduced. Existing original-roster backups remain compatible;
new selections, captain identity and active snapshots are validated on import.

team-rules.test.cjs covers captain resources/setup/persistence, source
ordering, shared caps, choices, CTV/Journeymen, Swarming, final medical results,
grouped deaths and free raised recruitment. Roster tests draft, submit,
save/reload and construct match snapshots for every added roster and verify
starting ability coverage. Actual embedded-UI tests cover creation, captain
controls, choices, roster reset isolation and guarded Swarming placement.

Team-rule behavior was compared to the pinned FFB checkout at
bf3f89d96b5143a8730910a841e7430791094492, especially BB2025 RollMechanic,
SetupMechanic, StepSwarming, InjuryMechanic and StepApothecary. Reference
downloads were one-time development inputs and are not required by the game.

This completes this roster catalogue and the shared rules above; it does not
certify exhaustive FFB parity for all newly possible ability combinations.
Remaining general limitations include unsupported inducements/named stars,
live unfinished-game save/resume, AI and fuller season/competition systems.
Postgame release rules still require eleven eligible players before a release.
`;
fs.writeFileSync(projectPath('docs/ROSTERS.md'),doc);
