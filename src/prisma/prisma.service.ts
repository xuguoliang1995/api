import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma 客户端封装，全局单例（见 PrismaModule）。
 *
 * 刻意不实现 `OnModuleInit` 里的 `$connect()`：Prisma 的连接本身是惰性的
 * （首次查询才建连），而契约生成（`scripts/generate-openapi.ts`）只实例化模块、
 * 不发查询。主动 connect 会让 `npm run openapi` 与 verify.sh 的 contract 阶段
 * 凭空依赖一个可达的数据库——契约文件不该因为数据库没起就生成不出来。
 *
 * 只保留 `onModuleDestroy` 的 `$disconnect`，让测试与热重载能释放连接池。
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
