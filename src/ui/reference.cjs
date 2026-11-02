"use strict";
// Short player-facing explanations, checked against the browser's BB2025 rules.
// Coverage/audit metadata stays in SKILL_CATALOG and the developer documents.
const SKILL_DESCRIPTIONS={
 "Catch":"Re-roll a failed catch.",
 "Diving Catch":"Try to catch a ball landing in an adjacent empty square; improve a catch from an accurate pass aimed at your square.",
 "Diving Tackle":"Go prone in the vacated square to make an opponent's dodge or jump harder by 2.",
 "Dodge":"Re-roll one failed dodge per turn; a Stumble result becomes a push unless Tackle cancels this protection.",
 "Defensive":"During the opponent's turn, stop opponents you mark using Guard or Put the Boot In.",
 "Hit and Run":"After a block or Stab, take a free one-square move if its destination leaves you unmarked.",
 "Jump Up":"Stand without spending movement; an Agility test can allow a Block action from prone.",
 "Leap":"Jump over an adjacent square even without a prone player there, with a reduced jumping penalty.",
 "Safe Pair of Hands":"When knocked down or placed prone while carrying the ball, place it in an adjacent empty square instead of bouncing it.",
 "Sidestep":"Choose an adjacent empty square when pushed, instead of using the normal push destinations.",
 "Sprint":"Attempt a third Rush during an activation.",
 "Sure Feet":"Re-roll one failed Rush per turn.",
 "Dirty Player":"Add 1 to either the Armour or Injury roll for your foul.",
 "Eye Gouge":"A player you push loses their tackle zone until they next activate.",
 "Fumblerooski":"Leave the carried ball in a square you move out of without causing a turnover just for dropping it.",
 "Lethal Flight":"A thrown player can add 1 to an Armour or Injury roll against an opponent hit in flight.",
 "Lone Fouler":"Re-roll the foul Armour roll when neither team supplies an assist.",
 "Pile Driver":"After knocking an opponent down with a block, go prone to foul them immediately.",
 "Put the Boot In":"Assist a team-mate's foul even while marked by other opponents.",
 "Quick Foul":"Continue using remaining movement after making a foul.",
 "Saboteur":"A Secret Weapon player knocked down in a block can try to explode, risking nearby players and becoming knocked out.",
 "Shadowing":"On a successful reaction roll, follow a dodging opponent into the square they left.",
 "Sneaky Git":"Armour-roll doubles do not cause a send-off if your foul fails to break armour.",
 "Violent Innovator":"Earn casualty SPP from qualifying special attacks that normally would not award them.",
 "Block":"Stay standing on Both Down unless another effect changes that result.",
 "Dauntless":"Roll to match a stronger block target's Strength before adding assists.",
 "Fend":"Stop a blocking opponent following up after pushing you, subject to exceptions such as Juggernaut.",
 "Frenzy":"Follow up when possible and make a second block if the first leaves the target standing and adjacent.",
 "Kick":"Reduce the distance the kick deviates when this player is the eligible nominated kicker.",
 "Pro":"Once per turn, pass a 3+ test to re-roll one eligible die during your activation.",
 "Steady Footing":"Try to remain standing instead of falling over or being placed prone.",
 "Strip Ball":"A pushed ball carrier drops the ball unless an ability such as Sure Hands protects it.",
 "Sure Hands":"Re-roll failed pickups and prevent Strip Ball from dislodging the ball.",
 "Tackle":"Deny Dodge's dodge re-roll while marking the opponent and its protection against Stumble when blocking.",
 "Taunt":"Make an eligible opponent follow up after pushing you.",
 "Wrestle":"On Both Down, place both players prone without Armour rolls, even if they have Block.",
 "Big Hand":"Ignore opposing tackle zones and rain penalties when picking up the ball.",
 "Claws":"An unmodified Armour roll of 8+ breaks armour when you knock an opponent down with a block.",
 "Disturbing Presence":"Players within three squares suffer a penalty to passing, catching and intercepting; multiple sources can combine.",
 "Extra Arms":"Add 1 to pickup, catch and interception tests.",
 "Foul Appearance":"An opponent must pass a 2+ test before making a block or applicable special attack against you.",
 "Horns":"Gain 1 Strength for the block made during your Blitz.",
 "Iron Hard Skin":"Resist Claws and opposing modifiers that improve Armour rolls against you.",
 "Monstrous Mouth":"Re-roll failed catches, resist Strip Ball, and use Chomp to hold an adjacent opponent in place.",
 "Prehensile Tail":"Make dodges or jumps away from you harder by 1.",
 "Tentacles":"Try to hold a nearby opponent who attempts to dodge or jump away, ending their activation in place.",
 "Two Heads":"Add 1 to your dodge tests.",
 "Very Long Legs":"Improve jumps and interceptions; you can still intercept a Cloud Burster pass.",
 "Accurate":"Add 1 to Passing Ability tests for Quick and Short passes.",
 "Cannoneer":"Add 1 to Passing Ability tests for Long passes and Long Bombs.",
 "Cloud Burster":"Prevent most interception attempts against your pass; Very Long Legs is an exception.",
 "Dump-off":"When targeted while carrying the ball, attempt a Quick Pass before the opponent resolves the attack.",
 "Give and Go":"After completing a pass or hand-off, continue with remaining movement.",
 "Hail Mary Pass":"Send the ball to a distant square without ordinary range limits; it cannot be accurate or intercepted.",
 "Leader":"Supply one extra team re-roll per half while an eligible Leader is on the pitch.",
 "Nerves of Steel":"Ignore marking penalties to passing, catching and intercepting.",
 "On the Ball":"React with up to three squares of movement to an opposing pass or a kick-off, following the reaction restrictions.",
 "Pass":"Re-roll a failed Passing Ability test.",
 "Punt":"Kick the ball away using a directional template and distance roll rather than making a normal pass.",
 "Safe Pass":"On a natural-one pass fumble, retain the ball and end the activation without that fumble causing a turnover.",
 "Arm Bar":"Add 1 to an Armour or Injury roll when an opponent falls while dodging or jumping away from you.",
 "Brawler":"During a Block action, re-roll one Both Down die; this does not apply to a Blitz block.",
 "Break Tackle":"Once per turn, improve a dodge according to your Strength.",
 "Bullseye":"On a superb Throw Team-mate result, let the thrown player land at the target without scattering.",
 "Grab":"Choose an adjacent empty push destination during a Block action; also cancel Sidestep, including when blitzing.",
 "Guard":"Assist blocks despite being marked by opponents other than the participants.",
 "Juggernaut":"During a Blitz block, treat Both Down as Push Back and overcome Fend, Stand Firm and Wrestle.",
 "Mighty Blow":"Add 1 to either the Armour or Injury roll when you knock an opponent down with a block.",
 "Multiple Block":"Block two adjacent opponents in one action, with a Strength penalty and no follow-up.",
 "Stand Firm":"Choose to stay in your square rather than being pushed.",
 "Strong Arm":"Add 1 to the test for throwing a team-mate.",
 "Thick Skull":"Reduce the chance of a knockout by converting a qualifying Injury result to Stunned.",
 "Always Hungry":"A team-mate thrower may try to eat their passenger; a failed escape can kill the thrown player.",
 "Animal Savagery":"An activation failure may force you to knock down an adjacent team-mate before continuing.",
 "Animosity (X)":"Before passing or handing off to a team-mate of the listed type, test whether the player cooperates.",
 "Ball & Chain":"Move using random directions and block anyone collided with; cannot handle the ball and has special knockdown rules.",
 "Bloodlust (X+)":"Test when activating; failure requires feeding on an eligible team-mate or suffering Bloodlust's consequences.",
 "Bombardier":"Throw an explosive bomb instead of moving; caught bombs can be thrown back before the explosion resolves.",
 "Bone Head":"On a failed activation test, lose the action and tackle zone until a later successful activation.",
 "Breathe Fire":"Make a breath attack against an adjacent opponent instead of a normal block.",
 "Chainsaw":"Attack with a chainsaw that improves Armour rolls but can kick back onto its user; also usable when fouling.",
 "Decay":"Add 1 to Casualty rolls against this player.",
 "Drunkard":"Rush tests are harder by 1.",
 "Hatred (X)":"Re-roll a Player Down die when blocking an opponent of the listed type.",
 "Hypnotic Gaze":"On a 3+ roll, distract an adjacent standing opponent, removing their tackle zone until they next activate.",
 "Insignificant":"A starting team cannot have more Insignificant players than other players.",
 "Kick Team-mate":"Kick a suitable team-mate downfield; the flight can injure the passenger or players they hit.",
 "Loner (X+)":"Pass the listed test before spending a team re-roll; failure still consumes the re-roll.",
 "My Ball":"The player refuses to voluntarily give up the ball through passing, handing off or similar transfers.",
 "No Ball":"The player cannot pick up, catch or otherwise possess the ball.",
 "Pick-me-up":"At the end of the opposing turn, nearby prone team-mates can stand on a 5+ roll.",
 "Plague Ridden":"An eligible opponent killed by this player can become a new Rotter, subject to victim restrictions.",
 "Pogo":"Jump over adjacent squares while ignoring the usual marking penalties to jumping.",
 "Projectile Vomit":"Replace a block with a vomiting attack that tests whether it hits before resolving armour.",
 "Really Stupid":"Test before acting, with better odds if a suitable standing team-mate is adjacent; failure removes the tackle zone.",
 "Regeneration":"After a casualty, a 4+ roll can return the player to Reserves and avoid that casualty's lasting effects.",
 "Right Stuff":"A suitable team-mate can throw or kick this player; landing requires a test.",
 "Secret Weapon":"The referee sends this player off at the end of a drive they participated in, unless a legal remedy saves them.",
 "Stab":"Replace a block with an unmodified Armour roll; breaking armour leads to an Injury roll.",
 "Stunty":"Ignore destination marking penalties when dodging, but suffer special interception and injury disadvantages.",
 "Swoop":"A thrown player can use a directional flight instead of normal scatter and re-roll a failed landing when swooping.",
 "Take Root":"An activation test can root the player in place for the drive; they can still perform permitted stationary actions.",
 "Throw Team-mate":"Throw an adjacent Right Stuff team-mate instead of the ball; flight, collisions and landing determine the outcome.",
 "Timmm-ber!":"Eligible adjacent team-mates improve a low-MA player's stand-up roll.",
 "Titchy":"Improve dodges, but do not impose the normal dodge penalty on opponents entering your tackle zone.",
 "Trickster":"When targeted by a block or applicable special attack, move to a legal empty square beside the attacker first.",
 "Unchannelled Fury":"Test before acting; failure wastes the activation, with better odds for an aggressive action.",
 "Unsteady":"Cannot declare Secure the Ball.",
};

function referenceElement(parent,tag,text){const e=document.createElement(tag);if(text!=null)e.textContent=text;parent.append(e);return e;}
function referenceTable(parent,title,headers,rows){
 const wrap=referenceElement(parent,"div");wrap.className="table-scroll";
 const table=referenceElement(wrap,"table");referenceElement(table,"caption",title);
 const head=referenceElement(table,"thead"),tr=referenceElement(head,"tr");for(const label of headers)referenceElement(tr,"th",label).setAttribute("scope","col");
 const body=referenceElement(table,"tbody");for(const values of rows){const row=referenceElement(body,"tr");values.forEach((value,i)=>{const cell=referenceElement(row,i?"td":"th",value);if(!i)cell.setAttribute("scope","row");});}return table;
}
function renderRulesReference(){
 const guide=document.getElementById("playing-guide");guide.replaceChildren();referenceElement(guide,"h2","Playing guide");
 const nav=referenceElement(guide,"nav");nav.setAttribute("aria-label","Reference sections");for(const [id,label] of [["playing-guide","Playing guide"],["rules-cheat-sheet","Rules cheat sheet"],["skillcoverage","Skills & traits"]]){const a=referenceElement(nav,"a",label);a.href="#"+id;}
 const chapters=[
 ["Aim of the game & player characteristics", "Score by carrying the ball into the opposing end zone while standing. More touchdowns wins. Each coach normally has eight turns per half; a touchdown ends the drive and the scoring team kicks next. The second half reverses the opening kick/receive roles.", "MA is movement allowance; ST is Strength for blocks; AG is the target for agility checks; PA is the passing target; AV is the armour-breaking target. A lower AG or PA target is better; higher MA, ST and AV are better. A standing, undistracted player marks adjacent opponents; prone, stunned and distracted players do not exert their normal tackle zones."],
 ["Choose your game", "Play starts full exhibition matches. For each side, choose a preset roster or a submitted custom team. A custom selection overrides the preset; selecting a preset switches back. Saved-team exhibitions use snapshots and do not change stored teams or Treasury. When both sides are saved, pre-game inducements use their CTV difference.", "Use Teams & leagues to draft and submit teams, enter a local league and start a fixture. League games open in Play. Testing holds the learning match, skills laboratory and individual drills. Switching tabs preserves the current game; starting another game or changing an exhibition team replaces it."],
 ["Prepare for kick-off", "Follow the coach panel through fans, weather, inducements and the kick/receive choice. Configure optional staff before advancing. In saved-team matches, complete each coach's required inducement purchases before continuing.", "Set up up to 11 available players in your own half: at least three on the line of scrimmage when available, and no more than two in each wide zone. Select a player, then click an empty square to move or another team-mate to swap their locations. Selecting a reserve from Dugouts or the roster and clicking a fielded team-mate exchanges them. The selected player remains selected after a swap. Confirm both setups, nominate the kicker, and click a kick target twice. Resolve the kick-off event and any touchback choice in the coach panel."],
 ["Move and plan routes", "Select a player and click a highlighted destination to preview a route. Further highlighted clicks add waypoints. Confirm Move or repeat the destination to activate the player and follow the route. Previewing and cancelling spend no movement and roll no dice. A route for an unactivated player declares a normal Move automatically.", "Declare Blitz, Pass, Hand-off, Foul or another special action before moving if that is your intention. Activate in place is available under Player actions. Routes stop for required decisions; resolve the decision and replan when necessary. End Move finishes an activation; End team turn hands play to the other coach."],
 ["Read the pitch", "The movement key shows no roll, then 2+ through 6+ in blue, green, yellow, orange and red. Each tile shows its own arrival check; earlier route steps may still be risky. Read the route summary for every required roll. Purple borders mark jumps; numbered markers show the planned route.", "Role shapes are consistent for both teams, with a Player shapes key below the pitch. Shirt numbers identify players. Hover or focus a square for characteristics and checks; click or touch a player for actions. Pitch size enlarges the board; narrow screens can scroll it sideways. Dugouts show reserves, knockouts, injuries and send-offs."],
 ["Block, Blitz and foul", "Select a reachable opponent to declare Blitz, move adjacent, then use Blitz Block, which costs one movement point. A standing adjacent opponent can be blocked without moving. Choose a block die result, select a gold push square or a coach-panel push option, then choose whether to follow up. Some skills give these choices to the opposing coach.", "Declare Foul before moving, then choose an adjacent prone or stunned opponent. Assists modify the Armour roll. Doubles can lead to a send-off; resolve Argue the Call, Bribes and other offered decisions before continuing. A special attack uses its own checks and may replace a block."],
 ["Pass, hand off and throw players", "Declare the ball action, move if permitted, then choose a highlighted target. The first click previews; the second commits. Hand-off targets an adjacent team-mate and needs a catch, not a pass test. Passing uses range, accuracy, possible interception and a catch or loose-ball resolution.", "For Throw Team-mate or Kick Team-mate, declare the action, select an eligible passenger, then preview and confirm a target square. The game resolves eating attempts, scatter, collisions and landing. Carrying the ball makes a failed landing particularly dangerous."],
 ["Decisions and re-rolls", "Required choices appear in the coach panel and identify the coach who owns them. Resolve them before continuing movement or another action. Optional skill switches live in Player profile & optional skills; turn them off before the relevant roll if desired. Re-roll opportunities appear at the permitted moment. A die cannot be re-rolled twice; multiple team re-rolls may be used on different tests in one BB2025 turn.", "Use arrow keys to move focus around pitch squares and Enter to select. Escape closes actions or cancels targeting. Left/Right, Home and End navigate the workspace tabs. Actions remain in the coach panel above the pitch on narrow screens."],
 ["Finish a game and keep your teams", "After a league fixture, open Teams & leagues, nominate six eligible MVP candidates per team and record the completed result. Resolve advancements, hiring and other post-game choices before preparing the next fixture. This local open ladder uses 3 points for a win, 1 for a draw and 0 for a loss.", "Teams and leagues are stored in this browser. Export JSON backups before clearing browser data or moving computers. A live match cannot currently be saved and resumed after reloading. An active fixture record does not save the live pitch. Exhibitions support hotseat or a basic Human/Orc computer opponent from the Opponent menu. You coach home; speed, pause and takeover controls are available. League games remain hotseat; online multiplayer is unavailable. Regulation matches have two halves of eight turns per team; concessions, extra time and penalties are outside the current game."],
 ];
 for(const [title,...paragraphs] of chapters){const part=referenceElement(guide,"details");referenceElement(part,"summary",title);for(const text of paragraphs)referenceElement(part,"p",text);if(title==="Aim of the game & player characteristics")part.open=true;}
 const cheat=referenceElement(document.getElementById("reference-view"),"article");cheat.className="panel rules-cheat-sheet";cheat.id="rules-cheat-sheet";referenceElement(cheat,"h2","BB2025 cheat sheet");
 referenceElement(cheat,"p","Quick reminders for ordinary play. Skills, traits, team rules and inducements can change these defaults; the coach panel shows the choices for the current situation.");
 const source=referenceElement(cheat,"p","Further detail: ");for(const [label,url] of [["Blood Bowl Base cheat sheet","https://bloodbowlbase.ru/bb2025/core_rules/cheat_sheet/"],["Core match rules","https://bloodbowlbase.ru/bb2025/core_rules/the_game_of_blood_bowl/"],["League rules","https://bloodbowlbase.ru/bb2025/core_rules/league_play/"]]){const a=referenceElement(source,"a",label);a.href=url;referenceElement(source,"span"," · ");}
 const group=(id,title)=>{const d=referenceElement(cheat,"details");d.id=id;referenceElement(d,"summary",title);return d;};
 let d=group("reference-sequence","Match sequence & actions");
 referenceTable(d,"Match sequence",["When","Order"],[
 ["Pre-game","Fans → weather → journeymen where needed → inducements → kick/receive."],
 ["New drive","Set up → nominate kicker and aim → kick deviation → event → landing/touchback → receiving turn."],
 ["Team turn","Activate each eligible player once; continue until ending the turn or a turnover."],
 ["Drive ends","Resolve Secret Weapons and other drive effects; recover KOs; reset for the next drive or half."],
 ["League post-game","Record result and winnings → fans → advancements → recruitment/retirement → expensive mistakes → prepare next game."],
 ]);
 referenceTable(d,"Common actions",["Action","Reminder"],[
 ["Move","Spend up to MA; usually up to two extra Rush squares, each normally 2+. Standing up normally costs 3 MA."],
 ["Block","Attack a standing adjacent opponent without moving."],
 ["Blitz","One per team turn. Move and make one block costing 1 MA; remaining movement may follow."],
 ["Pass / Hand-off","Normally one of each per team turn. Declare before moving; resolve the transfer after movement."],
 ["Foul","Normally one per team turn. Move, then attack an adjacent prone/stunned opponent's armour."],
 ["Secure the Ball","Once per team turn: A non-Big Guy reaches a loose ball with no standing, undistracted opponent within two squares; no rushing, dodging or jumping. Pick up on 2+ and end there."],
 ["Throw Team-mate / special","Requires the relevant ability; follow its movement, usage and target restrictions."],
 ]);
 d=group("reference-tests","Movement, passing & re-rolls");
 referenceTable(d,"Common checks",["Check","Default reminder"],[
 ["Agility / Passing","Roll a D6 against AG or PA after modifiers. Natural 1 fails; natural 6 succeeds. A missing PA prevents an ordinary pass."],
 ["Dodge","Leaving a tackle zone needs AG; each marking opponent at the destination makes the test harder. Some traits change this."],
 ["Pickup / catch","Use AG; marking and bad weather can make it harder. An accurate pass improves the catch."],
 ["Rush","Normally 2+ per extra square; a failure makes the player fall. Blizzard normally makes it 3+."],
 ["Pass sequence","Select target → determine range → PA accuracy test → interception opportunity → catch, scatter or fumble."],
 ["Pass range","Quick +0; Short −1; Long −2; Long Bomb −3 to the PA roll. Use the highlighted target preview for legal range."],
 ["Re-rolls","Use only offered legal re-rolls. Never re-roll a re-roll; Loner can require a test before a team re-roll works."],
 ]);
 d=group("reference-blocks","Blocks, assists & dice");
 referenceTable(d,"Strength and dice",["Comparison after assists","Dice and choice"],[
 ["Equal ST","One die."],["One side stronger","Two dice; stronger player's coach chooses."],["One side more than twice as strong","Three dice; stronger player's coach chooses. Exactly twice is still two dice."],
 ["Assists","Each eligible helper adds 1 ST. Helpers must mark the opposing participant and normally be unmarked by other opponents."],
 ]);
 referenceTable(d,"Block faces",["Face","Usual result"],[
 ["Player Down","Attacker knocked down."],["Both Down","Both knocked down; Block protects its owner and Wrestle can change the outcome."],["Push Back","Push the defender; attacker may follow up."],["Stumble","Push and knock down unless Dodge protects the defender; Tackle can cancel that protection."],["POW","Push and knock down the defender."],
 ]);
 d=group("reference-weather","Weather · 2D6");
 referenceTable(d,"Weather",["Roll","Condition","Effect"],[
 ["2","Sweltering Heat","At a drive's end, D3 randomly selected players per side who were on the pitch miss the next drive."],
 ["3","Very Sunny","Passing tests suffer −1."],["4–10","Perfect Conditions","No weather modifier."],["11","Pouring Rain","Pickup, catch and interception tests suffer −1."],["12","Blizzard","Rush tests suffer −1; only Quick and Short passes are allowed."],
 ]);
 d=group("reference-kickoff","Kick-off events · 2D6");
 referenceTable(d,"Kick-off",["Roll","Event","Reminder"],[
 ["2","Get the Ref","Each side gains a match-only Bribe."],["3","Time-out","Kicking turn marker at 6–8: both back one; otherwise both forward one."],["4","Solid Defence","Kicker redeploys D3+3 open players."],["5","High Kick","One open receiver can move beneath the landing ball."],["6","Cheering Fans","D6 + cheerleaders; winner gets an extra assist on their next turn's first block. Ties benefit both."],["7","Brilliant Coaching","D6 + assistants; winner gains a drive-only re-roll. Ties benefit both."],["8","Changing Weather","Roll weather again; Perfect Conditions adds three airborne scatter steps."],["9","Quick Snap!","Receiver moves D3+3 open players one square."],["10","Charge!","Kicker activates D3+3 open players for free moves; special allowances include one Blitz, one Throw Team-mate and one Kick Team-mate. A fall or knockdown ends the event."],["11","Dodgy Snack","Lower D6 side (both on tie): one random player suffers −1 MA/AV for the drive on 2+, or misses it on 1."],["12","Pitch Invasion","Lower D6 + Fan Factor side (both on tie): D3 random players become prone and stunned."],
 ]);
 d=group("reference-injuries","Armour, injuries & treatment");
 referenceElement(d,"p","Armour breaks when 2D6 plus applicable modifiers reaches AV. Broken armour leads to an Injury roll. Crowds skip armour: a Stunned crowd result sends the player to Reserves instead. A KO normally recovers on 4+ between drives. Medical skills and inducements can change these outcomes.");
 referenceTable(d,"Injury",["2D6","Ordinary player","Stunty player"],[["2–6","Stunned","Stunned"],["7","Stunned","KO"],["8","KO","KO"],["9","KO","Badly hurt"],["10–12","Casualty","Casualty"]]);
 referenceTable(d,"Casualty",["D16 (after modifiers)","Effect"],[["1–8","Badly hurt: no lasting injury."],["9–10","Seriously hurt: miss next game."],["11–12","Serious injury: niggling injury and miss next game."],["13–14","Lasting injury: characteristic reduction and miss next game."],["15+","Dead."]]);
 referenceTable(d,"Lasting injury",["D6","Reduction"],[["1–2","AV −1"],["3","MA −1"],["4","PA worsens by 1"],["5","AG worsens by 1"],["6","ST −1"]]);
 referenceElement(d,"p","Niggling injuries and Decay increase Casualty rolls. An apothecary can offer a second casualty result, or treat a KO (usually leaving the player Stunned on the pitch); Regeneration offers its own recovery test. Finish all offered treatment choices before the action resumes. Permanent effects are applied when a league result is recorded; exhibitions do not alter stored team records.");
 d=group("reference-turnovers","Turnovers, stalling & fouls");
 referenceTable(d,"Common turnover triggers",["Situation","Reminder"],[
 ["Player goes down","An active player falls during activation, or your player is knocked down during your turn."],
 ["Ball carrier lost","Your carrier is placed prone, leaves the pitch, or fails a thrown-player landing / is eaten."],
 ["Pickup or pass","Failed pickup; pass fumble; an unsuccessful pass/hand-off resolution or opposing possession. An immediate friendly catch after a failed catch can avoid a turnover."],
 ["Referee / score","A foul send-off or a touchdown ends the turn."],
 ["Stalling","A carrier who could score without dice but delays risks a crowd knockdown: D6 at least the current turn number causes it. No crowd roll in turns 7–8; traits and timing affect eligibility."],
 ["Foul armour","Add offensive assists and subtract defensive assists. Doubles on Armour or Injury can expose the fouler to a send-off."],
 ]);
 d=group("reference-progression","League SPP & post-game");
 referenceTable(d,"Usual SPP awards",["Event","SPP"],[["Completion","1"],["Successful team-mate landing","1 for the eligible thrown player"],["Interception","2"],["Qualifying casualty","2"],["Touchdown","3"],["MVP","4"]]);
 referenceElement(d,"p","Not every injury earns casualty SPP; special attacks normally need an explicit exception. Team rules and prayers can change awards. After recording a league result, spend SPP through the team controls and complete post-game requirements before starting another fixture. Exhibition results do not grant persistent SPP.");
}
