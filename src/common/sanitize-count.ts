/**
 * 计数值的防御性修正：非负整数以外的值一律修正为 0，并留下可观测记录。
 *
 * 两个 delta 对计数的措辞完全一致——community-posts 的「Upvote 计数的取值范围」
 * 与 attractions-catalog 的「浏览量的语义与取值范围」都要求「非法值 MUST 被修正为 0
 * 并留下可观测记录」。两份副本会在某次修正时漂移，而漂移只在极端数据下才暴露，
 * 所以在第二个使用点出现时提取到这里。
 *
 * 聚合结果在库侧天然是非负整数；本函数只拦「数据异常」这一层——负数、小数、NaN、
 * 无穷值。「非法值被静默修正」是不可观测的降级，所以 onAnomaly 不是可选项。
 */
export type AnomalyHandler = (raw: number) => void;

export function sanitizeNonNegativeInt(
  raw: number,
  onAnomaly: AnomalyHandler,
): number {
  if (!Number.isInteger(raw) || raw < 0) {
    onAnomaly(raw);
    return 0;
  }
  return raw;
}
