import { sanitizeUpvoteCount } from '../src/posts/upvote-count';

/**
 * tasks 2.6 / delta「Upvote 计数的取值范围」：非法值必须修正为 0 并留下可观测记录。
 *
 * 聚合得到的 count 在数据库侧天然非负，所以负数/小数只能作为「数据异常防御」存在——
 * 用纯函数单测钉住这条防御，e2e 侧只负责断言结果形态。
 */
describe('sanitizeUpvoteCount', () => {
  it('非负整数原样返回，且不触发告警', () => {
    const warnings: number[] = [];
    const warn = (raw: number): void => {
      warnings.push(raw);
    };

    expect(sanitizeUpvoteCount(0, warn)).toBe(0);
    expect(sanitizeUpvoteCount(7, warn)).toBe(7);
    expect(warnings).toEqual([]);
  });

  it('负数修正为 0 并触发一条告警', () => {
    const warnings: number[] = [];

    const result = sanitizeUpvoteCount(-3, (raw) => warnings.push(raw));

    expect(result).toBe(0);
    expect(warnings).toEqual([-3]);
  });

  it('非整数修正为 0 并触发一条告警', () => {
    const warnings: number[] = [];

    const result = sanitizeUpvoteCount(1.5, (raw) => warnings.push(raw));

    expect(result).toBe(0);
    expect(warnings).toEqual([1.5]);
  });
});
