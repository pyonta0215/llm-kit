/**
 * モデル名と単価の目録。複数のプロダクトが同じ事実を別々に書き写すと、モデルの更新のたびに
 * どこかが古いまま残るので、ここを1つだけの正本にする（ADR 0001）。
 *
 * **ここにあるのは公開単価の転記で、請求額ではない。** 各行に確かめた日と出典を持たせ、
 * 古くなったら出典を開き直して更新する。単価が無いモデルは載せない（`requirePrice` が止める）。
 *
 * 単価は 100万トークンあたりの USD（Standard tier、グローバル配信）。キャッシュの書き込みは短い方の保持期間
 * （Anthropic は 5 分、OpenAI は 30 分）の単価。
 */
import type { TokenPrice, WebSearchPricing } from '../cost/index.js';
export type ModelProvider = 'anthropic' | 'openai';
export interface CatalogEntry extends TokenPrice {
    provider: ModelProvider;
    /** 単価を確かめた日（YYYY-MM-DD） */
    checkedOn: string;
    /** 単価を確かめたページ */
    source: string;
}
export declare const MODEL_CATALOG: Readonly<Record<string, CatalogEntry>>;
/**
 * Web 検索ツールの1回あたりの単価。Anthropic・OpenAI とも 1,000 回あたり $10（検索結果のトークンは別にモデルの単価で数える）。
 * どの件数に掛けるか（`count`）は利用側が決める（`WebSearchPricing` の説明）。
 */
export declare const WEB_SEARCH_PER_CALL: Readonly<Record<ModelProvider, Pick<WebSearchPricing, 'perCallUsd'> & {
    checkedOn: string;
    source: string;
}>>;
