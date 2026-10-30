import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * attractions-catalog 外部契约（delta 6 条 Requirement + tasks 4.1–4.6）：
 * GET /api/home/hot-attractions → 200 + HotAttractionSummary[]（至多 8 个，确定性顺序）。
 *
 * 「可用景点」在本能力里只有一个硬条件：必属某城。是否过滤未上线城市的景点，
 * delta 未要求，故此处不做假设（已记入 verification 遗留）。
 */
describe('GET /api/home/hot-attractions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // 先删景点：外键是 Restrict，顺序反了会被数据库拒绝
    await prisma.attraction.deleteMany();
    await prisma.city.deleteMany();
  });

  let citySeq = 0;

  async function seedCity(
    input: { slug?: string; name?: string; nameZh?: string } = {},
  ): Promise<string> {
    citySeq += 1;
    const city = await prisma.city.create({
      data: {
        slug: input.slug ?? `city-${citySeq}`,
        name: input.name ?? `City ${citySeq}`,
        nameZh: input.nameZh ?? `城市${citySeq}`,
        isPublished: true,
      },
    });
    return city.id;
  }

  async function seedAttraction(
    input: {
      name?: string;
      cityId?: string;
      viewCount?: number;
      imageUrl?: string;
      imageWidth?: number;
      imageHeight?: number;
    } = {},
  ) {
    return prisma.attraction.create({
      data: {
        name: input.name ?? 'Attraction',
        cityId: input.cityId ?? (await seedCity()),
        viewCount: input.viewCount ?? 0,
        imageUrl: input.imageUrl ?? 'https://cdn.example.test/a.jpg',
        imageWidth: input.imageWidth ?? 1600,
        imageHeight: input.imageHeight ?? 1200,
      },
    });
  }

  const getHotAttractions = () =>
    request(app.getHttpServer()).get('/api/home/hot-attractions');

  it('摘要字段齐备：id / name / cityName / citySlug / viewCount / imageUrl / imageWidth / imageHeight（4.1）', async () => {
    const cityId = await seedCity({ name: 'Beijing', nameZh: '北京' });
    const attraction = await seedAttraction({
      name: 'Forbidden City',
      cityId,
      viewCount: 1234,
      imageUrl: 'https://cdn.example.test/gugong.jpg',
      imageWidth: 1600,
      imageHeight: 1200,
    });

    const res = await getHotAttractions();

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      id: attraction.id,
      name: 'Forbidden City',
      cityName: 'Beijing',
      citySlug: 'city-1',
      viewCount: 1234,
      imageUrl: 'https://cdn.example.test/gugong.jpg',
      imageWidth: 1600,
      imageHeight: 1200,
    });
  });

  it('景点必属某城：数据库拒绝写入无城市的景点（4.2 数据层）', async () => {
    // tasks 4.2 要求「构造一个未关联城市的景点，断言它不出现在结果中」，
    // 而 4.5 要求 cityId 非空——两者互斥。取 4.5 的强约束：
    // 无城市景点在写入侧就被拒绝，孤儿记录不可能存在。
    await expect(
      prisma.$executeRaw`
        INSERT INTO attractions
          (id, name, city_id, view_count, image_url, image_width, image_height, created_at, updated_at)
        VALUES
          (${'orphan-attraction'}, ${'Orphan'}, CAST(${null} AS TEXT), 0,
           ${'https://cdn.example.test/x.jpg'}, 800, 600, now(), now())
      `,
    ).rejects.toThrow(/null value in column|23502/i);
  });

  it('返回的每条记录都带非空城市名与城市标识，不漏出空城市（4.2 可观察面）', async () => {
    for (let i = 0; i < 3; i += 1) {
      await seedAttraction({ name: `a-${i}`, viewCount: i });
    }

    const res = await getHotAttractions();

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    for (const item of res.body as Array<Record<string, unknown>>) {
      expect(typeof item.cityName).toBe('string');
      expect((item.cityName as string).length).toBeGreaterThan(0);
      expect(typeof item.citySlug).toBe('string');
      expect((item.citySlug as string).length).toBeGreaterThan(0);
    }
  });

  it('候选充足时返回 8 个且相邻浏览量不递增（4.3 排序）', async () => {
    for (let i = 0; i < 10; i += 1) {
      await seedAttraction({ name: `attraction-${i}`, viewCount: i * 10 });
    }

    const res = await getHotAttractions();

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(8);
    const counts = (res.body as Array<{ viewCount: number }>).map(
      (a) => a.viewCount,
    );
    for (let i = 0; i < counts.length - 1; i += 1) {
      expect(counts[i]).toBeGreaterThanOrEqual(counts[i + 1]);
    }
    expect(counts[0]).toBe(90);
  });

  it('浏览量相同时按景点标识升序，两次请求顺序一致（4.3 次级次序）', async () => {
    for (let i = 0; i < 5; i += 1) {
      await seedAttraction({ name: `tie-${i}`, viewCount: 7 });
    }

    const first = await getHotAttractions();
    const second = await getHotAttractions();

    expect(first.status).toBe(200);
    const ids = (first.body as Array<{ id: string }>).map((a) => a.id);
    expect(ids).toEqual((second.body as Array<{ id: string }>).map((a) => a.id));
    expect(ids).toEqual([...ids].sort());
  });

  it('候选只有 4 个时返回 4 个，不补占位也不重复（4.4）', async () => {
    for (let i = 0; i < 4; i += 1) {
      await seedAttraction({ name: `few-${i}`, viewCount: 100 - i });
    }

    const res = await getHotAttractions();

    expect(res.status).toBe(200);
    const ids = (res.body as Array<{ id: string }>).map((a) => a.id);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
  });

  it('完全没有景点时返回 200 + 空数组（delta 空集合）', async () => {
    const res = await getHotAttractions();

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('首页曝光不增加浏览量：只调热门榜，viewCount 不变（4.6）', async () => {
    const attraction = await seedAttraction({ viewCount: 5 });

    // 先断言请求真的成功——否则接口 404 时「viewCount 没变」也会成立，
    // 那种绿是环境坏掉的样子，不是「首页不写库」的证据。
    const first = await getHotAttractions();
    const second = await getHotAttractions();
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.body).toHaveLength(1);

    const reloaded = await prisma.attraction.findUniqueOrThrow({
      where: { id: attraction.id },
    });
    expect(reloaded.viewCount).toBe(5);
  });
});
