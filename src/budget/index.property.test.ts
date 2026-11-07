import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { BudgetExceededError, CostLedger, type BudgetReservation } from './index.js';

// 守ること（不変条件）: 上限があるとき、精算済み・未精算の予約・費用不明で残した予約の合計は上限を超えない。
// ただし実際の費用が見積もり以下のときに限る（見積もりより高くつけば超える。台帳の説明のとおり）。
// 予約・精算（実測・推定・未計測）・戻しを任意の順に並べ、台帳を素朴なモデルと突き合わせる。

type Op =
  | { kind: 'reserve'; usd: number }
  | { kind: 'settle'; pick: number; basis: 'metered' | 'estimated' | 'unmeasured'; ratio: number }
  | { kind: 'release'; pick: number };

const LIMIT = 1;
const EPS = 1e-9;

const op: fc.Arbitrary<Op> = fc.oneof(
  fc.record({ kind: fc.constant('reserve' as const), usd: fc.double({ min: 0, max: 0.7, noNaN: true }) }),
  fc.record({
    kind: fc.constant('settle' as const),
    pick: fc.nat(),
    basis: fc.constantFrom('metered' as const, 'estimated' as const, 'unmeasured' as const),
    // 実際の費用は見積もりの 0〜100%
    ratio: fc.double({ min: 0, max: 1, noNaN: true }),
  }),
  fc.record({ kind: fc.constant('release' as const), pick: fc.nat() }),
);

describe('CostLedger の性質', () => {
  it('どんな順に予約・精算・戻しをしても、合計はモデルと一致し、上限を超えない', () => {
    fc.assert(fc.property(fc.array(op, { maxLength: 40 }), (ops) => {
      const ledger = new CostLedger(['llm'] as const, { limitUsd: LIMIT });
      const open: { reservation: BudgetReservation; usd: number }[] = [];
      let actual = 0;
      let held = 0;
      const committed = () => actual + open.reduce((s, o) => s + o.usd, 0) + held;

      for (const o of ops) {
        if (o.kind === 'reserve') {
          const fits = committed() + o.usd <= LIMIT + Number.EPSILON;
          if (fits) open.push({ reservation: ledger.reserve(o.usd), usd: o.usd });
          else expect(() => ledger.reserve(o.usd)).toThrow(BudgetExceededError);
        } else {
          const [target] = open.splice(o.pick % Math.max(1, open.length), 1);
          if (!target) continue;
          if (o.kind === 'release') ledger.release(target.reservation);
          else if (o.basis === 'unmeasured') {
            ledger.settle(target.reservation, 'llm', { usd: null, basis: 'unmeasured' });
            held += target.usd;
          } else {
            const usd = target.usd * o.ratio;
            ledger.settle(target.reservation, 'llm', { usd, basis: o.basis });
            actual += usd;
          }
        }
        expect(ledger.committedUsd).toBeCloseTo(committed(), 9);
        expect(ledger.committedUsd).toBeLessThanOrEqual(LIMIT + EPS);
      }
    }), { numRuns: 500 });
  });

  it('額を書き換えた予約は、どの値でも精算・戻しを受け付けず、台帳は変わらない', () => {
    fc.assert(fc.property(
      fc.double({ min: 0, max: 1, noNaN: true }),
      fc.double({ noNaN: false }),
      fc.constantFrom('settle', 'release'),
      (usd, forged, action) => {
        fc.pre(!Object.is(forged, usd));
        const ledger = new CostLedger(['llm'] as const, { limitUsd: LIMIT });
        const reservation = ledger.reserve(usd);
        const before = ledger.snapshot();
        const tampered = { ...reservation, estimatedUsd: forged };
        const run = () => action === 'settle'
          ? ledger.settle(tampered, 'llm', { usd: null, basis: 'unmeasured' })
          : ledger.release(tampered);
        expect(run).toThrow('does not match');
        expect(ledger.snapshot()).toEqual(before);
      },
    ), { numRuns: 300 });
  });
});
