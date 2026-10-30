import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthResponse } from './health.dto';

/**
 * 健康探针接口：对应 spec「健康状态查询」。
 *
 * 刻意保持匿名可访问——不引入任何鉴权依赖，也不做凭据校验。
 * 路由为 /api/health（控制器前缀 api）。
 */
@ApiTags('health')
@Controller('api')
export class HealthController {
  @Get('health')
  // operationId 固定为 health：与迁移前的契约一致，前端 `operations["health"]` 引用不变。
  @ApiOperation({ operationId: 'health', summary: '查询健康状态', description: '返回服务存活状态；无需鉴权' })
  @ApiOkResponse({ type: HealthResponse })
  health(): HealthResponse {
    return { status: 'ok' };
  }
}
