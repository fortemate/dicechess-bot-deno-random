# Dice Chess Bot — Deno Deploy (Fixed Rating Anchor)

[![CI](https://github.com/fortemate/dicechess-bot-deno-random/actions/workflows/ci.yml/badge.svg)](https://github.com/fortemate/dicechess-bot-deno-random/actions/workflows/ci.yml)
[![Play Live](https://img.shields.io/badge/Play-Live-success)](https://fortemate.com/)
[![Leaderboard](https://img.shields.io/badge/Ladder-Leaderboard-1E90FF)](https://fortemate.com/leaderboard)
[![Engine](https://img.shields.io/badge/Engine-dicechess--engine-8A2BE2)](https://github.com/fortemate/dicechess-engine)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-lightgrey)](./LICENSE)

The live [`anchor/random`](https://fortemate.com/leaderboard) ladder bot — the **lower horizon** of the rating
scale, not a player.

## Why this bot exists

The ladder's Glicko rating is purely relative, and it inflates: a replay of 291,797 blitz games over seven
weeks showed **+8,997 rating points created from nothing**, because a Glicko-2 step is not zero-sum — its size
scales with each player's own deviation, so newcomers inject points that nobody loses. Anchors are how that
drift is measured.

`anchor/random` is the bottom of `Anchor Set v1.0`. It runs the engine's built-in `RandomSearch`: a uniform
choice among the legal turn paths. That makes it the only anchor with a property no other one has — **engine
speed-ups cannot strengthen it at all**, because there is nothing to search. Every selection criterion for an
anchor is satisfied by construction:

- no clock-budgeted search (the criterion that excludes `MonteCarloSearch`);
- no opening book, no endgame tables, no weights that could be retrained;
- nothing to tune, so nothing can drift.

## The one rule

**Do not improve this bot.** No book, no algorithm swap, no config knob. An anchor that gets tuned is not an
anchor. If you want a stronger Deno showcase bot, build a new one — never repurpose this.

## Why Deno Deploy

The sibling Cloudflare anchor runs the same contract on Workers, where the free plan caps a request at 10 ms
of CPU. That cap is a poor fit for a V8 engine bundle: a cold isolate spends ~17 ms JIT-compiling the engine
on its first search and ~0.4 ms on every one after, so 17 % of turns were failing with
`Exceeded CPU Time Limits`. Deno Deploy documents no per-request CPU cap, and a verified free organisation
gets 1M requests, 15 CPU-hours and 350 GiB·h of memory time per month — far more than a ladder bot needs.
`main.ts` also runs one throwaway search at module scope, which moves the JIT cost into isolate start-up,
before any turn is on the clock.

## Layout

| Path              | Role                                                                                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/strategy.ts` | Calls the engine's built-in `random` algorithm. Nothing to configure — see "The one rule".                                                                     |
| `src/webhook.ts`  | Pure delivery logic: WebCrypto HMAC verify (±5 min replay window), handshake echo. No engine, no runtime globals; shared verbatim with the Cloudflare starter. |
| `main.ts`         | The `Deno.serve` handler: reads the signing secret from the environment, warms the engine, relays to `handleDelivery`.                                         |
| `src/bot_test.ts` | Unit tests for both halves.                                                                                                                                    |

## Running it locally

```bash
DICECHESS_WEBHOOK_SECRET=local-test-secret deno task dev
```

```bash
curl -s localhost:8000            # {"status":"ok","bot":"anchor/random"}
deno task test                    # 6 tests
deno task check                   # type check, fmt, lint
```

## Deployment

Deno Deploy builds this repository on every push to `main`. The application needs one environment variable,
`DICECHESS_WEBHOOK_SECRET`, matching the secret registered with the platform's webhook for this identity. The
webhook endpoint is the application URL itself; HTTPS is required and the `*.deno.net` address satisfies that
without a custom domain.

## Licence

AGPL-3.0-only, the same as the engine. See [LICENSE](./LICENSE) and [CLA.md](./CLA.md).
