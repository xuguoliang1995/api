import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HotAttractionSummary } from './hot-attraction.dto';
import { HotAttractionsService } from './hot-attractions.service';

/**
 * 景点读取接口。当前只服务首页热门榜，**没有任何写入口**——
 * 尤其没有浏览量自增接口（delta「首页对景点数据只读」）。
 */
@ApiTags('home')
@Controller('api')
export class AttractionsController {
  constructor(private readonly hotAttractions: HotAttractionsService) {}

  @Get('home/hot-attractions')
  @ApiOperation({
    operationId: 'listHomeHotAttractions',
    summary: '首页热门景点榜',
    description:
      '按累计浏览量降序返回至多 8 个景点；浏览量相同时按景点标识升序，' +
      '保证同一数据集的顺序可复现。无候选时返回空数组。' +
      '本接口不修改任何景点的浏览量。',
  })
  @ApiOkResponse({
    type: [HotAttractionSummary],
    description: '无候选时为空数组（[]）',
  })
  listHotAttractions(): Promise<HotAttractionSummary[]> {
    return this.hotAttractions.listHotAttractions();
  }
}
