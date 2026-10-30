import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CitiesService } from './cities.service';
import { CitySummary, CreateCityRequest, UpdateCityRequest } from './city.dto';

/**
 * 城市目录接口：清单、按 slug 读取、创建、更新。
 *
 * 页面侧契约见 delta city-catalog。注意本能力**不被首页消费**——首页城市入口
 * 读前端配置镜像，因此这里的接口服务城市攻略页与站内索引。
 *
 * 该组接口当前没有鉴权（变更范围内未引入鉴权机制），已记入遗留：
 * 上线前必须为写入路径（POST / PATCH）加上授权，否则任何人都能改城市目录。
 */
@ApiTags('cities')
@Controller('api/cities')
export class CitiesController {
  constructor(private readonly cities: CitiesService) {}

  @Get()
  @ApiOperation({
    operationId: 'listCities',
    summary: '城市清单',
    description:
      '按 slug 升序返回已上线城市；稳定次序，同一数据集重复请求结果相同。无城市时返回空数组。',
  })
  @ApiOkResponse({ type: [CitySummary], description: '无已上线城市时为空数组' })
  list(): Promise<CitySummary[]> {
    return this.cities.list();
  }

  @Get(':slug')
  @ApiOperation({
    operationId: 'getCityBySlug',
    summary: '按标识读取城市',
    description:
      '已上线城市返回 200；未上线与不存在的城市一律返回 404，不泄露「存在但已下线」这一内部状态。',
  })
  @ApiOkResponse({ type: CitySummary })
  @ApiNotFoundResponse({ description: '城市不存在或未上线' })
  get(@Param('slug') slug: string): Promise<CitySummary> {
    return this.cities.findAccessible(slug);
  }

  @Post()
  @ApiOperation({
    operationId: 'createCity',
    summary: '创建城市',
    description:
      'slug 必须匹配 ^[a-z0-9]+(-[a-z0-9]+)*$ 且长度 2–32；name 与 nameZh 非空；isPublished 必填。' +
      'slug 重复返回 409。',
  })
  @ApiBody({ type: CreateCityRequest })
  @ApiCreatedResponse({ type: CitySummary })
  create(@Body() body: unknown): Promise<CitySummary> {
    return this.cities.create(body);
  }

  @Patch(':slug')
  @ApiOperation({
    operationId: 'updateCity',
    summary: '更新城市',
    description:
      '只接受 name / nameZh / isPublished。请求体中出现 slug 时返回 400——标识不可变，' +
      '改变标识须「原城市下线 + 新城市上线」。',
  })
  @ApiBody({ type: UpdateCityRequest })
  @ApiOkResponse({ type: CitySummary })
  @ApiNotFoundResponse({ description: '城市不存在' })
  update(
    @Param('slug') slug: string,
    @Body() body: unknown,
  ): Promise<CitySummary> {
    return this.cities.update(slug, body);
  }
}
