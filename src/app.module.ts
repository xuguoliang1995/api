import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';

/**
 * 根模块：按垂直切片聚合各业务模块。当前仅接入 HealthModule。
 */
@Module({
  imports: [HealthModule],
})
export class AppModule {}
