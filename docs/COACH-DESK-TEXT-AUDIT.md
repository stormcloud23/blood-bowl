# Coach's desk text audit

The desk presents current state and available decisions. Visual keys live in the Legend. Rules explanations remain in Reference and player profiles. The Session log remains collapsed on the desk, as requested.

| Text source | Result |
| --- | --- |
| Desk heading and decision ownership | Coach, turn and reacting player; remove repeated owner paragraphs. |
| Selection and movement | Selected player, status, used/remaining MA, Rushes and re-rolls. |
| Movement, block, blitz and ball previews | Target, dice difficulty, roll targets, route coordinates and costs; remove click instructions and color summaries. |
| Block results and re-roll controls | Face name and glyph, current chooser, re-roll source and die number; remove face-rule tooltips. Glyph key is in Legend. |
| Ordinary roll failures and Diving Tackle | Roll, target and failed/pending state; remove timing explanation. |
| Custom skill, medical, prayer and purchase decisions | Current ability, victim, injury, result, price and actual options. Presentation shortens verbose engine titles without changing their option values or callbacks. |
| Player-action popups | Player, status and legal actions, with characteristics/skills collapsed; remove the movement and activation tutorial. |
| Pregame and resource purchases | Current phase, staff counts, costs, purchasing coach and budget. Preserve disabled progression while purchases are outstanding. Remove generic funding and exhibition rules. |
| Setup and Dwarfen Wisdom | Team, selected/eligible players, placement count and actual formation errors. Keep actionable validation errors; remove generic formation rules. |
| Kicker, kick aim, touchback, Swarming and kick-off movement | Current team, target, airborne state or placed/used counts. Remove rules and step-by-step instructions. |
| Play, between turns and end of drive | Available actions and current window; remove duplicate active-team prose and descriptions of turnover/recovery rules. |
| Active prayers and star hires | Current affected players remain available in a collapsed prayer list. Star-hire summary appears during pregame only. |
| Full time and league recording | Result and recorded/unrecorded state, plus the existing recording/view action. |
| Optional skill controls | Ability name and enabled/automatic state, inside the player profile; remove the generic toggle instruction. Action costs and activation-ending consequences remain on action buttons. |
| Profile and Session log | Retain explicit, collapsed reference/history surfaces. No changes to saved data or rule resolution. |

Audited rendering paths: `src/ui/app.js` (`render`, `renderMatch`, `renderSkillControls`, preview/decision labels), `src/ui/workspace-ui.cjs` (popups, owner labels, result recording and grouping), and the coach-panel shell in `src/index.template.html`. Engine-generated decision titles/options were inspected as inputs to these renderers; presentation changes preserve the original engine identifiers.

Scoreboard, team-value breakdown, pitch help, Reference, Teams & leagues, Testing and computer controls are outside the coach's desk. Their separate descriptions are not silently filtered from game state or history.

Validation covers every main phase, exact block labels, visual keys in Legend, decision ownership, original custom-option callbacks, existing medical/skill/purchase interactions, and the collapsed Session log. Direct browser verification is unavailable while browser access is disabled in this session.
