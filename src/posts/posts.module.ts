import { Module } from '@nestjs/common';
import { HotPostsService } from './hot-posts.service';
import { PostsController } from './posts.controller';

/**
 * 社区帖子模块。PrismaService 由全局 PrismaModule 提供，此处不重复 imports。
 */
@Module({
  controllers: [PostsController],
  providers: [HotPostsService],
})
export class PostsModule {}
