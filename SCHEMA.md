# The payload contract

Two repositories meet in one JSON object. `mlb-pipeline` writes it into
`current.html` as `<script id="bb-data">`; `mlb-dashboard` renders it. Nobody
validates it in between, which is how three separate incidents this season put
a missing card in front of a person while every test stayed green.

This file says who owns what, and which fields have already changed shape once.

## Ownership

The producer owns every key in the payload. The dashboard owns none of them and
must never write one back. That direction is not a style preference: a
dashboard that repairs its own input is a dashboard that can hide a producer
defect, and the whole point of this system is that it should be hard for it to
lie about its own state.

What the dashboard owns instead is what it does when the input is wrong:
render what it can, say plainly what it could not, and record a diagnostic that
fails the suite. It never fabricates a value to fill a gap.

| Block | Producer module | What the dashboard may assume |
|---|---|---|
| `predictions[]`, `gameCards[]`, `ml[]` | `mlb_picks/output/publish.py` | arrays; may be empty; `gameCards` may be absent when `predictions` is present |
| `boards` | `mlb_picks/output/publish.py` | an object whose market keys are arrays **and** whose `diagnostics` key is an object — see below |
| `learned` | `mlb_picks/output/publish_learn.py` | object; `markets` keyed by market; `suppressedNotKilled` may be absent |
| `clv`, `roi`, `populations` | `learn/decide.py` | numbers may be `null`; a null is BLIND, never zero |
| `modelParlay`, `pricedParlay` | `mlb_picks/output/parlay.py` | `legs` is an array; `dependence.why` is polymorphic — see below |
| `settlementIntegrity` | `learn/ledger.py` + `scripts/audit_prop_settlement.py` | object; every list may be empty |
| `backtestLab` | `mlb_picks/backtest/` | object; families may be missing |

## Fields that have already changed shape

These are the ones that broke production. Each has exactly one place in the
dashboard where the shape is resolved, and that place is the only place allowed
to know about the history.

**`boards`** — the market keys hold arrays of board rows. The `diagnostics` key,
sitting in the same object, holds a dict. Any code that walks `boards` and calls
an array method on each value throws on that one key. Resolve boards through
`boardMarket(k)` / `boardDiag(k)`, never by iterating the object.

**`modelParlay.dependence.why`** — was an array of strings, is now a single
string. Both shapes are still accepted, in `depWhyText(w)`, which is the only
function permitted to branch on the type. Calling `.join()` on this field is
what removed the Model Parlay card from production on 2026-09-05, while the
unit fixture said `why: []` and passed throughout.

**`learned.markets[m].status` vs the retirement record** — today's verdict and
the governance history are different questions. A market can read `WATCH` today
and still be `RETIRED`, and the retired answer wins. Publication is gated on
`boardRetired(k)`, never on the day's status.

## Settlement states

`settlementIntegrity` carries the lifecycle, and the distinction it encodes is
load-bearing:

- **statistical outcome** — did the thing happen? `HIT`, `MISS`, `EXACT`,
  `NOT_APPLICABLE`, `PENDING`, `UNRESOLVED`.
- **financial settlement** — what does a bet on it pay? `WIN`, `LOSS`, `PUSH`,
  `VOID`, `PENDING`, `UNKNOWN_BOOK_RULE`.

They are not the same field and must not be collapsed. A player who never
appeared has `NOT_APPLICABLE` / `UNKNOWN_BOOK_RULE` — the statistical question
could not be asked, and what a book does about that is a rule this pipeline does
not hold. `UNRESOLVED` is a state with retry metadata attached
(`attemptCount`, `firstAttemptedAt`, `lastAttemptedAt`), not a loss.

Corrections never edit a graded row. The original grade stays in the ledger and
the correction lives in `ledger/settlement_corrections.csv`; the effective
result is produced by applying one to the other at read time. That is the only
arrangement in which a past mistake stays visible after it is fixed.

## Adding a field

Add it to the producer, add it to the table above, and add a shape to
`tests/fixtures/contract-dangerous-shapes.json` if the field can arrive in more
than one form. `tests/contract_e2e.test.js` renders the real page against the
real payload with those overlays applied; if a new field can break a card, that
is where it gets caught, not in production.
