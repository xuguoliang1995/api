import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * 全局数据库模块：业务模块直接注入 PrismaService，不必逐个 imports。
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
