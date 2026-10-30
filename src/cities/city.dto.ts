import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 城市摘要，同时作为创建/更新的响应体。
 *
 * 类名即契约 schema 名（tasks 6.2 只要求两个 Hot*Summary 存在，这里用 City 前缀
 * 避免与首页能力混淆——city-catalog 不被首页消费）。
 */
export class CitySummary {
  @ApiProperty({ description: '城市内部标识', example: 'clv3x8q0b0000abcd9012mnop' })
  id!: string;

  @ApiProperty({ description: '城市标识（URL 片段，唯一且不可变）', example: 'beijing' })
  slug!: string;

  @ApiProperty({ description: '英文名', example: 'Beijing' })
  name!: string;

  @ApiProperty({ description: '中文名', example: '北京' })
  nameZh!: string;

  @ApiProperty({ description: '是否已上线；未上线城市的 URL 不可达', example: true })
  isPublished!: boolean;
}

/**
 * 创建城市的请求体。
 *
 * `isPublished` 是必填项而不是默认 true：上线状态是业务决策，
 * 默认值会让「忘了传」静默变成一个可能错误的状态（schema 层同样不给默认值）。
 */
export class CreateCityRequest {
  @ApiProperty({
    description: '城市标识，匹配 ^[a-z0-9]+(-[a-z0-9]+)*$，长度 2–32',
    example: 'beijing',
  })
  slug!: string;

  @ApiProperty({ description: '英文名，非空', example: 'Beijing' })
  name!: string;

  @ApiProperty({ description: '中文名，非空', example: '北京' })
  nameZh!: string;

  @ApiProperty({ description: '是否已上线', example: true })
  isPublished!: boolean;
}

/**
 * 更新城市的请求体。
 *
 * **刻意不包含 `slug`**：标识不可变（delta「城市标识的唯一性与不可变性」）。
 * 但类型层面的「不包含」不足以拦住运行时的多余字段，所以服务层会显式检查 body
 * 里是否出现 `slug` 并返回 400——在接口层直接拒绝，比依赖调用方自觉更难绕过。
 */
export class UpdateCityRequest {
  @ApiPropertyOptional({ description: '英文名，非空', example: 'Beijing' })
  name?: string;

  @ApiPropertyOptional({ description: '中文名，非空', example: '北京' })
  nameZh?: string;

  @ApiPropertyOptional({ description: '是否已上线', example: false })
  isPublished?: boolean;
}
