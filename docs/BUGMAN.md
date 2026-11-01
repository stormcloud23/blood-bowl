# Josef Bugman — v0.0.23

Josef Bugman is available under **Configure staff and inducements** for 100,000
gp, at most one per team. Purchases use the existing exhibition/league controls,
CTV, purchase order, Petty Cash, Treasury and refund checks.

Bugman's XXXXXX supplies +1 to every KO recovery roll, stacking with purchased
Kegs. The bonus belongs to the hiring team, lasts the match and does not depend
on the separate Dwarfen Wisdom use remaining. This follows BB2025 recovery,
including a natural one succeeding with Bugman and two Kegs.

Dwarfen Wisdom is optional once per match, after both normal setups and before
Swarming/Master Chef/kicker selection. The kicking coach decides first, then the
receiving coach. Declining preserves the use for a later drive. On acceptance,
roll D3, then choose one to that many players already on the pitch. All selected
players are lifted together so swaps work. Select each **Wisdom player** in the
coach panel, or select their reserve card in Dugouts, and click an empty square
in the team's own half. Only selected players can be repositioned; existing
reserves cannot substitute. **Finish Dwarfen Wisdom** requires the normal player
count, LOS, Wide Zone, own-half and captain conditions. Unselected players stay
eligible for later kickoff actions. The use does not renew at halftime. With no
pitch participants, FFB preserves the use and skips the D3.

## Pinned executable sources

FFB commit `bf3f89d96b5143a8730910a841e7430791094492`:

- `ffb-common/.../factory/GameOptionFactory.java`: Josef cost 100K/max one.
- `ffb-common/.../inducement/bb2025/InducementCollection.java`: Bugman staff
  purchase and its replacement effects, ADD_TO_KO_RECOVERY / RESETUP_D3_PLAYERS.
- `ffb-server/.../step/bb2025/start/StepBuyInducements.java`: convert purchase
  into one of each effect after inducement spending.
- `ffb-server/.../step/bb2025/kickoff/StepDwarfenWisdom.java`: coach order,
  optional use, D3/participant selection, simultaneous lifting, original-reserve
  exclusion, formation validation, restoration of untouched players.
- `ffb-server/.../step/generator/bb2025/Kickoff.java`: both Wisdom windows before
  both Swarming windows, then Chef.
- `ffb-server/.../step/bb2025/StepEndTurn.java`: Kegs plus Bugman on KO recovery.

## Verification and limits

Deterministic engine scenarios cover purchase/cap/locking, funding and refunds,
prayer value, both coaches/order, guarded stale choices, selected-player count,
swaps, illegal participants/coordinates/formations, Swarming, Quick Snap,
drive/half use preservation and additive KO recovery. Actual inline UI tests
cover purchasing, two-player swapping, replay guards, dugout selection and
completion. The two prayer wording follow-ups now identify affected teams and
explain Rock random targeting separately from spell targeting.

The browser connector reported local browser use disabled in Work settings;
no new screenshots or desktop/mobile visual verification are claimed.

This implements Bugman as **staff**, not the separate star-player profile.
Named star hiring, including its mutually exclusive Bugman star/staff choice,
unique star abilities and other special inducement players remain future work.
