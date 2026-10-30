import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

/**
 * 健康探针模块。刻意不含任何鉴权 Guard。
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
