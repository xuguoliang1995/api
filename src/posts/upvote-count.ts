/**
 * Upvote 计数的防御性修正（delta「Upvote 计数的取值范围」）。
 *
 * 聚合结果在库侧天然是非负整数；本函数只负责「数据异常」这一层——负数、小数、
 * NaN 或无穷值。异常值统一修正为 0，并通过 `onAnomaly` 留下可观测记录
 * （调用方传入 NestJS Logger）。「非法值被静默修正」是不可观测的降级，
 * 所以回调不是可选项。
 */
export function sanitizeUpvoteCount(
  raw: number,
  onAnomaly: (raw: number) => void,
): number {
  if (!Number.isInteger(raw) || raw < 0) {
    onAnomaly(raw);
    return 0;
  }
  return raw;
}
