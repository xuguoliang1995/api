/**
 * 本地/演示种子数据（openspec 变更 revamp-home-international，任务 1.1）。
 *
 * 定位：为首页热门区块提供可视化验收数据，不是生产数据源。
 * 幂等策略：所有条目用 `seed-` 前缀的固定 id，重跑先删后建，不影响真实数据。
 * 运行：`npx prisma db seed`（连接串取 apps/api/.env 的 DATABASE_URL）。
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CITIES = [
  { slug: 'beijing', name: 'Beijing', nameZh: '北京' },
  { slug: 'shanghai', name: 'Shanghai', nameZh: '上海' },
  { slug: 'xian', name: "Xi'an", nameZh: '西安' },
  { slug: 'chengdu', name: 'Chengdu', nameZh: '成都' },
  { slug: 'guangzhou', name: 'Guangzhou', nameZh: '广州' },
  { slug: 'shenzhen', name: 'Shenzhen', nameZh: '深圳' },
  { slug: 'hangzhou', name: 'Hangzhou', nameZh: '杭州' },
  { slug: 'suzhou', name: 'Suzhou', nameZh: '苏州' },
] as const;

/** 浏览量含一组并列值（1560）与跨 1000 边界值（1234 → 1.2k、980 原样），钉住 spec 的展示与稳定排序场景 */
const ATTRACTIONS = [
  { id: 'seed-attr-1', name: 'Forbidden City', city: 'beijing', viewCount: 4820 },
  { id: 'seed-attr-2', name: 'The Bund', city: 'shanghai', viewCount: 3915 },
  { id: 'seed-attr-3', name: 'Terracotta Army', city: 'xian', viewCount: 3540 },
  { id: 'seed-attr-4', name: 'Giant Panda Base', city: 'chengdu', viewCount: 2860 },
  { id: 'seed-attr-5', name: 'West Lake', city: 'hangzhou', viewCount: 2310 },
  { id: 'seed-attr-6', name: 'Classical Gardens of Suzhou', city: 'suzhou', viewCount: 1560 },
  { id: 'seed-attr-7', name: 'Canton Tower', city: 'guangzhou', viewCount: 1560 },
  { id: 'seed-attr-8', name: 'Mutianyu Great Wall', city: 'beijing', viewCount: 1234 },
  { id: 'seed-attr-9', name: 'Shamian Island', city: 'guangzhou', viewCount: 980 },
] as const;

/** [标题, 作者, 城市slug或null, 距今天数, 窗口内票数] */
const POSTS: ReadonlyArray<readonly [string, string, string | null, number, number]> = [
  ['Two days in Beijing: hutongs, duck and the Wall', 'Emma R.', 'beijing', 1, 42],
  ['Street food survival guide for Chengdu', 'Marco B.', 'chengdu', 1, 38],
  ['A slow week in Hangzhou, tea fields and rain', 'Yuki T.', 'hangzhou', 2, 33],
  ['Shanghai skyline: where to shoot it at dusk', 'Ade O.', 'shanghai', 2, 29],
  ['Terracotta Army without the crowds', 'Sofia L.', 'xian', 3, 26],
  ['Suzhou gardens in 4 hours — my exact route', 'Daniel K.', 'suzhou', 3, 21],
  ['Cantonese breakfast crawl in Guangzhou', 'Priya S.', 'guangzhou', 4, 17],
  ['Tech city detour: what Shenzhen surprised me with', 'Tom W.', 'shenzhen', 4, 12],
  ['Riding the night train to Xi’an', 'Laura M.', null, 5, 9],
  ['First time in China: 7 things I wish I knew', 'Chris P.', 'beijing', 5, 6],
  ['Rainy-day itinerary for the Bund area', 'Nina F.', 'shanghai', 6, 4],
];

async function main() {
  // 先清旧种子（CASCADE 会带走 upvotes）
  await prisma.attraction.deleteMany({ where: { id: { startsWith: 'seed-' } } });
  await prisma.post.deleteMany({ where: { id: { startsWith: 'seed-' } } });
  await prisma.city.deleteMany({ where: { slug: { in: CITIES.map((c) => c.slug) } } });

  for (const [i, c] of CITIES.entries()) {
    await prisma.city.create({
      data: { id: `seed-city-${i + 1}`, slug: c.slug, name: c.name, nameZh: c.nameZh, isPublished: true },
    });
  }

  for (const a of ATTRACTIONS) {
    const city = await prisma.city.findUniqueOrThrow({ where: { slug: a.city } });
    await prisma.attraction.create({
      data: {
        id: a.id,
        name: a.name,
        cityId: city.id,
        viewCount: a.viewCount,
        imageUrl: `/images/attractions/${a.id}.svg`,
        imageWidth: 1600,
        imageHeight: 1200,
      },
    });
  }

  const now = Date.now();
  for (const [i, [title, author, citySlug, daysAgo, votes]] of POSTS.entries()) {
    const city = citySlug ? await prisma.city.findUnique({ where: { slug: citySlug } }) : null;
    await prisma.post.create({
      data: {
        id: `seed-post-${i + 1}`,
        title,
        authorName: author,
        cityName: city?.name ?? null,
        publishedAt: new Date(now - daysAgo * 86_400_000),
        upvotes: {
          create: Array.from({ length: votes }, (_, v) => ({
            id: `seed-upvote-${i + 1}-${v + 1}`,
            // 票全部落在 7 天窗口内
            createdAt: new Date(now - (daysAgo * 86_400_000 + v * 60_000)),
          })),
        },
      },
    });
  }

  console.log(
    `seed done: ${CITIES.length} cities, ${ATTRACTIONS.length} attractions, ${POSTS.length} posts`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
