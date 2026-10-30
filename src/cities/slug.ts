/**
 * 城市标识的格式判据（delta「城市标识的唯一性与不可变性」）。
 *
 * slug 同时是 URL、内容关联键与测试锚点，格式必须**先于**入库确定：
 * 正则一旦放宽到「差不多就行」，同一个城市就会出现两种写法，
 * 而两种写法各自能访问到不同内容——这比直接拒绝更难排查。
 *
 * 规则来源（逐字）：`^[a-z0-9]+(-[a-z0-9]+)*$`、长度 2–32。
 * 该正则天然排除大写、下划线、连续连字符与首尾连字符。
 */
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SLUG_MIN_LENGTH = 2;
const SLUG_MAX_LENGTH = 32;

export function isValidCitySlug(slug: unknown): slug is string {
  if (typeof slug !== 'string') {
    return false;
  }
  if (slug.length < SLUG_MIN_LENGTH || slug.length > SLUG_MAX_LENGTH) {
    return false;
  }
  return SLUG_PATTERN.test(slug);
}

/**
 * 非空文本判据：用 trim 判断，而不是 `length > 0`。
 *
 * 只含空格的 `"   "` 在 `length > 0` 下算「有值」，会让一个视觉上完全空白的
 * 城市名通过校验——这正是 delta「中文名为空字符串则拒绝」要拦的情形。
 */
export function isNonBlankText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
