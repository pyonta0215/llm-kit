import { describe, expect, it } from 'vitest';
import { assertValidPrice, requirePrice, tokenCostUsd, UnknownPriceError } from '../cost/index.js';
import { MODEL_CATALOG, WEB_SEARCH_PER_CALL } from './index.js';

describe('MODEL_CATALOG', () => {
  it('どの行も単価として正しく、確かめた日と出典を持つ', () => {
    for (const [model, entry] of Object.entries(MODEL_CATALOG)) {
      assertValidPrice(entry, model);
      expect(entry.checkedOn, model).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(entry.source, model).toMatch(/^https:\/\//);
    }
  });

  it('載っていないモデルは 0 円で通さない', () => {
    expect(() => requirePrice(MODEL_CATALOG, 'claude-unknown')).toThrow(UnknownPriceError);
  });

  // キャッシュ書き込みの単価がある行は、キャッシュされなかった入力をすべて書き込みとして数える（少なく見積もらない）
  it('Claude Haiku 5.5 は入力が 100,000 トークンを超えると全項目が5倍になる', () => {
    const haiku = requirePrice(MODEL_CATALOG, 'claude-haiku-5-5');
    expect(tokenCostUsd(haiku, { inputTokens: 100_000, outputTokens: 1_000_000 })).toBeCloseTo(0.1 * 0.125 + 0.5);
    expect(tokenCostUsd(haiku, { inputTokens: 100_001, outputTokens: 1_000_000 })).toBeCloseTo((100_001 / 1e6) * 0.125 * 5 + 2.5);
  });

  it('OpenAI は入力が 272K トークンを超えると入力2倍・出力1.5倍になる', () => {
    const sol = requirePrice(MODEL_CATALOG, 'gpt-6.1-sol');
    expect(tokenCostUsd(sol, { inputTokens: 300_000, outputTokens: 1_000_000 })).toBeCloseTo(0.3 * 2.5 * 2 + 10 * 1.5);
  });

  it('Web 検索は 1,000 回あたり $10', () => {
    expect(WEB_SEARCH_PER_CALL.anthropic.perCallUsd * 1000).toBe(10);
    expect(WEB_SEARCH_PER_CALL.openai.perCallUsd * 1000).toBe(10);
  });
});
