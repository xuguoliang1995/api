import { Injectable, Logger } from '@nestjs/common';
import { sanitizeNonNegativeInt } from '../common/sanitize-count';
import { PrismaService } from '../prisma/prisma.service';
import type { HotAttractionSummary } from './hot-attraction.dto';

/** 榜单长度上限（delta「热门榜的确定性排序」：至多 8 个）。 */
const HOT_ATTRACTIONS_LIMIT = 8;

/**
 * 首页热门景点榜的读取服务。
 *
 * 只读：不提供任何增加浏览量的路径。浏览量的唯一递增入口是「打开景点详情」，
 * 由详情接口负责（design D4）——首页曝光只是 SELECT，不会让浏览量变成
 * 「被推送次数」。
 */
@Injectable()
export class HotAttractionsService {
  private readonly logger = new Logger(HotAttractionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listHotAttractions(): Promise<HotAttractionSummary[]> {
    // 用 findMany 而不是手写 SQL：这里没有聚合，Prisma 已经能表达
    // 「关联城市 + 两级次序 + 截断」，手写 SQL 只会多一个类型失配的面。
    // city 是必填关系，Prisma 生成 INNER JOIN——「景点必属某城」由连接类型兜住，
    // 不依赖某个 WHERE 过滤条件写对。
    const rows = await this.prisma.attraction.findMany({
      select: {
        id: true,
        name: true,
        viewCount: true,
        imageUrl: true,
        imageWidth: true,
        imageHeight: true,
        city: { select: { name: true, slug: true } },
      },
      // 主排序 + 次级次序全写：并列浏览量只按主排序时，顺序由存储引擎决定，
      // 「两次请求同一数据集顺序一致」就会变成偶发红测。
      orderBy: [{ viewCount: 'desc' }, { id: 'asc' }],
      take: HOT_ATTRACTIONS_LIMIT,
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      cityName: row.city.name,
      citySlug: row.city.slug,
      viewCount: sanitizeNonNegativeInt(row.viewCount, (raw) => {
        this.logger.warn(
          `浏览量异常（景点 ${row.id}）：${String(raw)}，已修正为 0`,
        );
      }),
      imageUrl: row.imageUrl,
      imageWidth: row.imageWidth,
      imageHeight: row.imageHeight,
    }));
  }
}
