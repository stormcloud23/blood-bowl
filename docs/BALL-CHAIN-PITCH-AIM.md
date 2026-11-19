# Ball & Chain pitch aiming

Activate a Ball & Chain player with **Move Ball & Chain**, then click one of the
four highlighted arrows beside them to aim North, East, South or West. Each click
chooses a movement template; the normal direction die still selects one of the
three squares in that fan. It does not guarantee movement into the clicked square.

Highlights refresh after each resolved movement step and disappear during other
decisions or when the activation ends. Occupied aim squares remain clickable:
the actual randomly selected destination determines whether a collision occurs.
Whirling Dervish still offers its normal direction reroll before moving.

The original aim buttons remain available. At pitch edges they also let coaches
choose a direction whose central arrow would be off the pitch. End activation
remains available in the coach panel.

The UI uses the existing pending-decision resolver and stale-click protection;
no movement rules or random rolls changed. Tests cover all four templates and
their three outcomes, collisions, corner choices, invalid/stale clicks, ending
activation, and the native Fanatic, Kreek and Fungus profiles for both coaches.
