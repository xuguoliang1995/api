import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * city-catalog 外部契约（delta 4 条 Requirement + tasks 5.1–5.5）。
 *
 * 本能力**不被首页消费**（delta Purpose）：首页城市入口读前端配置镜像。
 * 这里的接口服务城市攻略页与站内索引，因此按独立能力验收，不与首页耦合。
 */
describe('cities (e2e)', () => {
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
    await prisma.attraction.deleteMany();
    await prisma.city.deleteMany();
  });

  const server = () => request(app.getHttpServer());

  const createCity = (body: Record<string, unknown>) =>
    server().post('/api/cities').send(body);

  const validCity = (overrides: Record<string, unknown> = {}) => ({
    slug: 'beijing',
    name: 'Beijing',
    nameZh: '北京',
    isPublished: true,
    ...overrides,
  });

  it('重复 slug 被拒绝并给出可定位的冲突信息（5.1）', async () => {
    const first = await createCity(validCity());
    expect(first.status).toBe(201);

    const second = await createCity(
      validCity({ slug: 'beijing', name: 'Peking', nameZh: '北平' }),
    );

    expect(second.status).toBe(409);
    expect(JSON.stringify(second.body)).toContain('beijing');
    expect(await prisma.city.count()).toBe(1);
  });

  it('slug 格式不合法一律被拒绝（5.2）', async () => {
    const invalidSlugs = ['Abc', 'a_b', 'a--b', 'a', 'a'.repeat(33)];

    for (const slug of invalidSlugs) {
      const res = await createCity(validCity({ slug }));
      expect({ slug, status: res.status }).toEqual({ slug, status: 400 });
    }

    expect(await prisma.city.count()).toBe(0);
  });

  it('更新接口拒绝 slug 字段，城市标识不发生变化（5.3）', async () => {
    await createCity(validCity());

    const res = await server()
      .patch('/api/cities/beijing')
      .send({ slug: 'peking', nameZh: '北平' });

    expect(res.status).toBe(400);
    const stored = await prisma.city.findUniqueOrThrow({
      where: { slug: 'beijing' },
    });
    expect(stored.slug).toBe('beijing');
    expect(stored.nameZh).toBe('北京');
  });

  it('未上线城市的 URL 不可达，已上线城市可访问（5.4）', async () => {
    await createCity(validCity({ slug: 'online', name: 'Online' }));
    await createCity(
      validCity({ slug: 'offline', name: 'Offline', isPublished: false }),
    );

    const online = await server().get('/api/cities/online');
    const offline = await server().get('/api/cities/offline');

    // 先断言已上线的可访问：否则接口整体 404 时「未上线返回 404」也会成立
    expect(online.status).toBe(200);
    expect(online.body).toMatchObject({ slug: 'online', name: 'Online' });

    expect(offline.status).toBe(404);
    expect(JSON.stringify(offline.body)).not.toContain('Offline');
  });

  it('缺少中文名或为空字符串时被拒绝（5.5）', async () => {
    const withoutNameZh = await createCity(
      validCity({ slug: 'no-zh', nameZh: undefined }),
    );
    const emptyNameZh = await createCity(
      validCity({ slug: 'empty-zh', nameZh: '' }),
    );
    const blankNameZh = await createCity(
      validCity({ slug: 'blank-zh', nameZh: '   ' }),
    );

    expect(withoutNameZh.status).toBe(400);
    expect(emptyNameZh.status).toBe(400);
    expect(blankNameZh.status).toBe(400);
    expect(await prisma.city.count()).toBe(0);
  });

  it('城市清单只含已上线城市，按 slug 升序且两次请求一致（清单确定性）', async () => {
    await createCity(validCity({ slug: 'shanghai', name: 'Shanghai' }));
    await createCity(validCity({ slug: 'beijing', name: 'Beijing' }));
    await createCity(
      validCity({ slug: 'chengdu', name: 'Chengdu', isPublished: false }),
    );

    const first = await server().get('/api/cities');
    const second = await server().get('/api/cities');

    expect(first.status).toBe(200);
    const slugs = (first.body as Array<{ slug: string }>).map((c) => c.slug);
    expect(slugs).toEqual(['beijing', 'shanghai']);
    expect(slugs).toEqual(
      (second.body as Array<{ slug: string }>).map((c) => c.slug),
    );
  });

  it('没有任何已上线城市时返回 200 + 空数组', async () => {
    const res = await server().get('/api/cities');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
