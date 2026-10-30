import { ApiProperty } from '@nestjs/swagger';

/**
 * 健康探针响应。
 *
 * 类名与字段刻意沿用迁移前的 `HealthResponse`：前端类型由本类派生的
 * openapi.json 生成，保持同名可让 `apps/web` 的类型引用零改动。
 */
export class HealthResponse {
  @ApiProperty({ description: '服务状态，存活时为 ok', example: 'ok' })
  status!: string;
}
