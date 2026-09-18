import { assert, assertEquals, assertMatch } from '@std/assert';
import { chooseMoves } from './strategy.ts';
import { handleDelivery, sign } from './webhook.ts';

const UCI = /^[a-h][1-8][a-h][1-8][qrbn]?$/;
const DFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 NBK';
const SECRET = 'test-secret';

Deno.test('random returns a well-formed, engine-legal turn', () => {
  const moves = chooseMoves(DFEN);
  assert(moves.length > 0, 'the opening roll NBK must have at least one legal micro-move');
  for (const m of moves) assertMatch(m, UCI);
});

Deno.test('a position with no legal move yields an empty pass', () => {
  assertEquals(chooseMoves('4k3/8/8/8/8/8/8/4K3 w - - 0 1 R'), []);
});

Deno.test('the verification handshake echoes the nonce without a signature', async () => {
  const r = await handleDelivery(
    {},
    JSON.stringify({ type: 'verification', nonce: 'abc' }),
    SECRET,
    chooseMoves,
    0,
  );
  assertEquals(r.status, 200);
  assertEquals(r.body, { nonce: 'abc' });
});

Deno.test('a turn with a valid signature is answered with moves', async () => {
  const body = JSON.stringify({ type: 'turn', dfen: DFEN });
  const ts = 1_700_000_000;
  const headers = {
    'x-dicechess-timestamp': String(ts),
    'x-dicechess-signature': await sign(SECRET, ts, body),
  };
  const r = await handleDelivery(headers, body, SECRET, chooseMoves, ts);
  assertEquals(r.status, 200);
  assert(Array.isArray((r.body as { moves: string[] }).moves));
});

Deno.test('a turn with a bad signature is rejected', async () => {
  const body = JSON.stringify({ type: 'turn', dfen: DFEN });
  const ts = 1_700_000_000;
  const headers = { 'x-dicechess-timestamp': String(ts), 'x-dicechess-signature': 'deadbeef' };
  const r = await handleDelivery(headers, body, SECRET, chooseMoves, ts);
  assertEquals(r.status, 401);
});

Deno.test('a stale timestamp is rejected even with a genuine signature', async () => {
  const body = JSON.stringify({ type: 'turn', dfen: DFEN });
  const ts = 1_700_000_000;
  const headers = {
    'x-dicechess-timestamp': String(ts),
    'x-dicechess-signature': await sign(SECRET, ts, body),
  };
  const r = await handleDelivery(headers, body, SECRET, chooseMoves, ts + 400);
  assertEquals(r.status, 401);
});
