import { Module } from '@nestjs/common';
import { AttractionsController } from './attractions.controller';
import { HotAttractionsService } from './hot-attractions.service';

/**
 * 景点模块。PrismaService 由全局 PrismaModule 提供。
 *
 * 城市目录的写入能力属于 city-catalog，不在此模块——景点只读城市。
 */
@Module({
  controllers: [AttractionsController],
  providers: [HotAttractionsService],
})
export class AttractionsModule {}
