import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HotPostSummary } from './hot-post.dto';
import { HotPostsService } from './hot-posts.service';

/**
 * 社区帖子的读取接口。当前只服务首页热门榜，**不含任何写入口**——
 * 尤其没有投票接口（delta「首页不提供投票写入能力」）。
 */
@ApiTags('home')
@Controller('api')
export class PostsController {
  constructor(private readonly hotPosts: HotPostsService) {}

  @Get('home/hot-posts')
  @ApiOperation({
    operationId: 'listHomeHotPosts',
    summary: '首页热门帖子榜',
    description:
      '最近 7 天发布的帖子，按窗口内 Upvote 数降序返回至多 10 条；' +
      '票数相同时按发布时间降序、帖子标识升序，保证同一数据集的顺序可复现。' +
      '无候选时返回空数组，不是 404 也不是 null。',
  })
  @ApiOkResponse({
    type: [HotPostSummary],
    description: '无候选时为空数组（[]）',
  })
  listHotPosts(): Promise<HotPostSummary[]> {
    return this.hotPosts.listHotPosts();
  }
}
