# Optional source comparison tools

Normal builds, tests and the published app need only Node.js. This directory
contains the reusable FFB passing-geometry comparison oracle.

```sh
npm run verify:ffb
```

It requires Java 21 and the pinned FFB source checkout described in
[the passing audit](../docs/PASSING-DRIVE-AUDIT.md). By default the checkout is at
`../vendor/ffb` relative to this repository. Set `FFB_SOURCE` to use another
checkout. Java and that checkout are never needed by players or normal CI.

To deliberately regenerate the committed reference fixture:

```sh
node tools/verify-ffb-geometry.cjs --write-fixture
```

Review source hashes and the diff in `tests/fixtures/ffb-interception.json`
before committing it. Ordinary tests read that fixture without running Java.

The completed one-time roster download/parser/import scripts were removed.
They referenced untracked `.codex-attachments` from an old development session
and could not run from a clean clone. Their curated output remains in
`src/data/rosters.json`; roster tests and source links remain available.
Their previous implementations are retained in Git history.
