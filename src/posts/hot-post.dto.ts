import { ApiProperty } from '@nestjs/swagger';

/**
 * 热门帖子摘要（design D1：只暴露摘要形状，不含正文与审计字段）。
 *
 * 类名即契约 schema 名——`apps/web/src/api/schema.d.ts` 里的 `HotPostSummary`
 * 由本类经 @nestjs/swagger 派生，不要改成别的名字（tasks 6.2）。
 */
export class HotPostSummary {
  @ApiProperty({ description: '帖子标识', example: 'clv3x8q0b0000abcd1234efgh' })
  id!: string;

  @ApiProperty({ description: '帖子标题', example: '在北京的秋天里走了三里屯' })
  title!: string;

  @ApiProperty({
    description: '作者展示名；空字符串表示作者未署名，下游可省略作者位置',
    example: '李维',
  })
  authorName!: string;

  @ApiProperty({
    description: '所属城市名；未关联城市时为 null',
    type: String,
    nullable: true,
    example: '北京',
  })
  cityName!: string | null;

  @ApiProperty({
    description: '最近 7 天窗口内的 Upvote 数（非负整数）',
    example: 42,
  })
  upvoteCount!: number;

  @ApiProperty({
    description: '发布时间，ISO 8601',
    example: '2026-10-30T08:00:00.000Z',
  })
  publishedAt!: string;
}
