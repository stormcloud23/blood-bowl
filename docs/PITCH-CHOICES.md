# Pitch choices and exhibition values — v0.0.42

## Choosing squares

Spatial prompts expose structured `pitchChoices` entries with an engine option
and board coordinates. The UI does not parse coordinate strings or invent a
second set of movement rules. Gold tiles are clickable native buttons with
decision labels for keyboard/screen-reader use. Where applicable, the player
being moved is outlined. Choosing an invalid or stale tile cannot answer a
different pending decision.

On the Ball player selection uses fully visible eligible icons and temporarily
faded unavailable players instead of gold activation badges. Its legal movement
tiles still highlight, without an extra glyph. During kickoff reactions, the
existing ball symbol marks the current deviated landing square while airborne.

Coordinate lists are removed from the coach's desk for in-pitch choices. Named
options such as Stay, Stop moving, Finish reactions, Decline and Bounce normally
remain available. Crowd pushes have named edge actions because their destinations
are outside the board. Direction templates and roll-modification choices remain
named choices; they do not promise a fixed landing square before dice resolve.

| Choice family | Pitch interaction |
| --- | --- |
| On the Ball | Select the reacting player, then each legal step. Highlights update after every step and obey the three-MA budget and kickoff half restriction. |
| Trickster, Hit and Run | Choose a legal relocation tile; preserve optional Stay and any subsequent pickup decisions. |
| Dump-off | Choose a quick-pass target directly, including occupied legal squares. |
| Safe Pair of Hands | Place the ball on an allowed adjacent empty tile, or choose Bounce normally. |
| Normal pushes, Sidestep, Grab, chain pushes | Use the exact push options supplied by the engine, including occupied chain-push squares. The chooser label accounts for Grab cancelling Sidestep. |
| Raiding Party | Choose the teammate on the pitch, then their one-square destination. |
| Furious Outburst | Choose both first and final placement from highlighted destinations. |
| I'll Carry You | Choose Crumbleberry's placement or occupied drop target on the pitch. |
| Defensive reactions and interception | Select eligible players directly for Tentacles, Shadowing, Arm Bar, Diving Tackle, Diving Catch and pass/bomb interception. |
| High Kick, touchback recipient, Dwarfen Wisdom selection | Choose eligible players on the pitch. |
| Setup, Solid Defence, Quick Snap, Dwarfen Wisdom placement, Swarming | Select the player, then a legal highlighted placement. Engine predicates drive both highlighting and execution. |
| Empty-square touchback | All legal empty receiving-half squares are highlighted. |

Pass/hand-off/throw targeting, kickoff aim and Wizard targeting retain their
existing pitch controls. Observation mode can show these options, but paused
spectator clicks remain read-only. No rule grants extra movement or bypasses
another coach's pending decision.

## Exhibition value display

Pregame and drive setup show full Team Value (TV), with roster player value and
permanent staff/re-roll value. Current Team Value (CTV), inducements and the
post-inducement match value are labelled separately. Dedicated Fans and Treasury
are not added to TV; consuming purchased re-rolls does not lower it.

Preset TV includes the entire preset lineup. Saved exhibitions capture full TV
from the submitted roster, including improvements and unavailable rostered
players, while CTV follows the existing match snapshot with available players,
journeymen and applicable Low Cost Linemen adjustments. Later team-bank edits do
not change the running exhibition's TV. This is ephemeral exhibition metadata;
league fixture/back-up schemas are unchanged.

Stars, paired hires, mercenaries and other inducements appear in inducement
value once. Their cost is not added again as regular roster player value. The
display uses the existing engine's post-inducement valuation rather than
changing inducement budgets or prayer rules.

## Checks

Rule and UI tests cover the named spatial prompts, both push ownership cases,
occupied destinations, stale clicks, reactive movement resumption, kickoff/setup
restrictions and actual square clicks. Value tests cover every preset roster,
staff changes, fans, purchased versus spent re-rolls, Low Cost Linemen, paired
stars/mercenaries and saved-team snapshots with improvements/MNG/journeymen.
These are automated checks, not a new visual browser or exhaustive FFB audit.
