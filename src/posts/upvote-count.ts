import {
  sanitizeNonNegativeInt,
  type AnomalyHandler,
} from '../common/sanitize-count';

/**
 * Upvote 计数的防御性修正（delta「Upvote 计数的取值范围」）。
 *
 * 实现在 `common/sanitize-count.ts`：景点浏览量用的是同一条规则，共用一份实现。
 * 保留这个名字是为了让调用点读起来知道「这是票数」，而不是一个无上下文的数字。
 */
export function sanitizeUpvoteCount(
  raw: number,
  onAnomaly: AnomalyHandler,
): number {
  return sanitizeNonNegativeInt(raw, onAnomaly);
}
