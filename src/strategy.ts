// The move-choosing brain: the engine's unmodified built-in `random` search.
//
// This bot is `anchor/random` from Anchor Set v1.0 — the lower horizon of the scale, not a
// competitor. `RandomSearch` picks uniformly among the legal turn paths, so it satisfies every
// anchor criterion by construction: no clock-budgeted search (engine speed-ups cannot strengthen
// it at all), no opening book, no learned weights, nothing to tune.
//
// Do not change ALGORITHM. An "improved" anchor is not an anchor.
// The package's flat function exports are missing from its .d.ts (only `DiceChess` and
// `EngineFacade` are declared), so go through the typed `DiceChess` surface rather than
// shipping a hand-written declaration file for it.
import { DiceChess } from '@fortemate/dicechess-engine';

const ALGORITHM = 'random';

/** DFEN in, the turn's UCI micro-moves out. `[]` = pass (no legal move; the server auto-passes). */
export function chooseMoves(dfen: string): string[] {
  const result = DiceChess.getBestMove(dfen, { algorithm: ALGORITHM });
  const moves = result?.moves ?? [];
  return moves.map((m) => m.from + m.to + (m.promotion ?? ''));
}

/** The opening position, used only to force JIT compilation at isolate start — see main.ts. */
export const WARMUP_DFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 NBK';
