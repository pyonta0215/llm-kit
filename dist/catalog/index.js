const ANTHROPIC_PRICING = 'https://platform.claude.com/docs/en/about-claude/pricing';
const OPENAI_PRICING = 'https://developers.openai.com/api/docs/pricing';
/** Claude Haiku 5.5 は、1リクエストの入力（キャッシュの読み書きを含む）が 100,000 トークンを超えると、全項目が5倍になる */
const HAIKU_5_5_LONG_CONTEXT = { aboveInputTokens: 100_000, inputMultiplier: 5, outputMultiplier: 5 };
/** OpenAI の gpt-6・gpt-5.6 系は、入力が 272K トークンを超えると入力とキャッシュが2倍、出力が1.5倍になる */
const OPENAI_LONG_CONTEXT = { aboveInputTokens: 272_000, inputMultiplier: 2, outputMultiplier: 1.5 };
const anthropic = (price) => ({ provider: 'anthropic', checkedOn: '2026-11-03', source: ANTHROPIC_PRICING, ...price });
const openai = (price) => ({ provider: 'openai', checkedOn: '2026-11-03', source: OPENAI_PRICING, longContext: OPENAI_LONG_CONTEXT, ...price });
export const MODEL_CATALOG = Object.freeze({
    'claude-opus-5-5': anthropic({ inputPerMillionUsd: 4, cacheWritePerMillionUsd: 5, cachedInputPerMillionUsd: 0.2, outputPerMillionUsd: 20 }),
    'claude-sonnet-5-5': anthropic({ inputPerMillionUsd: 2, cacheWritePerMillionUsd: 2.5, cachedInputPerMillionUsd: 0.1, outputPerMillionUsd: 10 }),
    'claude-haiku-5-5': anthropic({
        inputPerMillionUsd: 0.1, cacheWritePerMillionUsd: 0.125, cachedInputPerMillionUsd: 0.01, outputPerMillionUsd: 0.5,
        longContext: HAIKU_5_5_LONG_CONTEXT,
    }),
    // 過去の実行記録の費用を読むために残している
    'claude-haiku-4-5-20251001': anthropic({ inputPerMillionUsd: 1, cacheWritePerMillionUsd: 1.25, cachedInputPerMillionUsd: 0.1, outputPerMillionUsd: 5 }),
    'gpt-6-luna': openai({ inputPerMillionUsd: 0.1, cacheWritePerMillionUsd: 0.125, cachedInputPerMillionUsd: 0.01, outputPerMillionUsd: 0.5 }),
    'gpt-6-sol': openai({ inputPerMillionUsd: 2, cacheWritePerMillionUsd: 2.5, cachedInputPerMillionUsd: 0.2, outputPerMillionUsd: 10 }),
    'gpt-6.1-sol': openai({ inputPerMillionUsd: 2, cacheWritePerMillionUsd: 2.5, cachedInputPerMillionUsd: 0.1, outputPerMillionUsd: 10 }),
    'gpt-5.6-luna': openai({ inputPerMillionUsd: 0.2, cacheWritePerMillionUsd: 0.25, cachedInputPerMillionUsd: 0.02, outputPerMillionUsd: 1.2 }),
    'gpt-5.6-terra': openai({ inputPerMillionUsd: 2, cacheWritePerMillionUsd: 2.5, cachedInputPerMillionUsd: 0.2, outputPerMillionUsd: 12 }),
});
/**
 * Web 検索ツールの1回あたりの単価。Anthropic・OpenAI とも 1,000 回あたり $10（検索結果のトークンは別にモデルの単価で数える）。
 * どの件数に掛けるか（`count`）は利用側が決める（`WebSearchPricing` の説明）。
 */
export const WEB_SEARCH_PER_CALL = Object.freeze({
    anthropic: { perCallUsd: 0.01, checkedOn: '2026-11-03', source: ANTHROPIC_PRICING },
    openai: { perCallUsd: 0.01, checkedOn: '2026-11-03', source: OPENAI_PRICING },
});
