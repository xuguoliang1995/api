import { ApiProperty } from '@nestjs/swagger';

/**
 * 热门景点摘要（design D1：只暴露摘要形状）。
 *
 * 类名即契约 schema 名——`apps/web/src/api/schema.d.ts` 里的 `HotAttractionSummary`
 * 由本类派生，`docs/design/home-hot-attractions.md` 的 3.1 节按此名引用（tasks 6.2/6.3）。
 *
 * 与帖子摘要不同，`cityName` 与 `citySlug` 都是**非空**：景点必属某城，没有「无城市」
 * 这个合法状态。
 */
export class HotAttractionSummary {
  @ApiProperty({ description: '景点标识', example: 'clv3x8q0b0000abcd5678ijkl' })
  id!: string;

  @ApiProperty({ description: '景点名称', example: 'Forbidden City' })
  name!: string;

  @ApiProperty({ description: '所属城市英文名', example: 'Beijing' })
  cityName!: string;

  @ApiProperty({ description: '所属城市标识，用于城市跳转', example: 'beijing' })
  citySlug!: string;

  @ApiProperty({ description: '累计浏览量（非负整数）', example: 1234 })
  viewCount!: number;

  @ApiProperty({
    description: '主图地址',
    example: 'https://cdn.example.test/gugong.jpg',
  })
  imageUrl!: string;

  @ApiProperty({ description: '主图原始宽（正整数）', example: 1600 })
  imageWidth!: number;

  @ApiProperty({ description: '主图原始高（正整数）', example: 1200 })
  imageHeight!: number;
}
