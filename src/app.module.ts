import { Module } from '@nestjs/common';
import { AttractionsModule } from './attractions/attractions.module';
import { HealthModule } from './health/health.module';
import { PostsModule } from './posts/posts.module';
import { PrismaModule } from './prisma/prisma.module';

/**
 * 根模块：按垂直切片聚合各业务模块。
 *
 * PrismaModule 是 @Global 的基础设施模块——契约生成会实例化它，但不会建连
 * （见 PrismaService 注释）。
 */
@Module({
  imports: [PrismaModule, HealthModule, PostsModule, AttractionsModule],
})
export class AppModule {}
