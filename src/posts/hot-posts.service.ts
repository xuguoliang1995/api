import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { HotPostSummary } from './hot-post.dto';
import { sanitizeUpvoteCount } from './upvote-count';

/** 统计窗口：最近 7 天（delta「热门榜的时间窗口与确定性排序」）。 */
const WINDOW_DAYS = 7;
/** 榜单长度上限（同上 Requirement：至多 10 条）。 */
const HOT_POSTS_LIMIT = 10;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** `$queryRaw` 的行形状；列别名已转成 camelCase，与 HotPostSummary 对齐。 */
interface HotPostRow {
  id: string;
  title: string;
  authorName: string;
  cityName: string | null;
  publishedAt: Date;
  upvoteCount: number;
}

/**
 * 首页热门帖子榜的读取服务。
 *
 * 只读：本服务不提供任何改变 Upvote 计数的路径（delta「首页不提供投票写入能力」，
 * design D4「首页与列表接口对计数只读」）。
 */
@Injectable()
export class HotPostsService {
  private readonly logger = new Logger(HotPostsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 返回最近 7 天发布的热门帖子摘要，至多 10 条。
   *
   * @param now 窗口基准时间；默认当前时刻，测试可注入以固定窗口。
   */
  async listHotPosts(now: Date = new Date()): Promise<HotPostSummary[]> {
    const windowStart = new Date(now.getTime() - WINDOW_DAYS * MS_PER_DAY);

    // 过滤、聚合、排序、截断在一条查询里完成（design D2：不在应用层捞全表再排序）。
    // ORDER BY 必须写全三级次序——只写 "upvoteCount" DESC 时同票记录的相对次序
    // 由存储引擎决定，同一数据集两次请求可能不同，表现为随机的偶发红测。
    //
    // `COUNT(...)::int` 而不是裸 COUNT：PG 的 count 返回 bigint，Prisma 会映射成
    // JS BigInt，`typeof` 与 JSON 序列化都会出问题。
    //
    // 候选池 = 窗口内发布的帖子，而不是「窗口内有票的帖子」：这样窗口内 0 票的帖子
    // 仍按次级次序入选（delta「零票帖子仍可入选」），而窗口外发布的历史爆款
    // 即使最近被刷票也不会进入（delta「窗口外的历史高票帖子不入选」）。
    const rows = await this.prisma.$queryRaw<HotPostRow[]>(Prisma.sql`
      SELECT
        p.id                                  AS "id",
        p.title                               AS "title",
        p.author_name                         AS "authorName",
        p.city_name                           AS "cityName",
        p.published_at                        AS "publishedAt",
        COUNT(u.id)::int                      AS "upvoteCount"
      FROM posts p
      LEFT JOIN upvotes u
        ON u.post_id = p.id
       AND u.created_at >= ${windowStart}
      WHERE p.published_at >= ${windowStart}
      GROUP BY p.id, p.title, p.author_name, p.city_name, p.published_at
      ORDER BY "upvoteCount" DESC, p.published_at DESC, p.id ASC
      LIMIT ${HOT_POSTS_LIMIT}
    `);

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      authorName: row.authorName,
      cityName: row.cityName,
      upvoteCount: sanitizeUpvoteCount(row.upvoteCount, (raw) => {
        this.logger.warn(
          `Upvote 计数异常（帖子 ${row.id}）：${String(raw)}，已修正为 0`,
        );
      }),
      publishedAt: row.publishedAt.toISOString(),
    }));
  }
}
