import { Module } from '@nestjs/common';
import { CitiesController } from './cities.controller';
import { CitiesService } from './cities.service';

/**
 * 城市目录模块。PrismaService 由全局 PrismaModule 提供。
 *
 * 与 attractions 模块的关系是单向的：景点读城市，城市不知道景点的存在。
 */
@Module({
  controllers: [CitiesController],
  providers: [CitiesService],
})
export class CitiesModule {}
