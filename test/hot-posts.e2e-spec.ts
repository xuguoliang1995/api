import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * community-posts 外部契约（delta spec 6 条 Requirement + tasks 2.1–2.6）：
 * GET /api/home/hot-posts → 200 + HotPostSummary[]（至多 10 条，确定性顺序）。
 *
 * 夹具直接写库（40-database：集成测试连真实 PostgreSQL，不用 mock 验证 SQL 语义）；
 * 每个用例 beforeEach 清表，互相独立。
 */
describe('GET /api/home/hot-posts (e2e)', () => {
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
    // 先删子表：Upvote 有外键，Cascade 之外显式按序更直观
    await prisma.upvote.deleteMany();
    await prisma.post.deleteMany();
  });

  const daysAgo = (n: number): Date =>
    new Date(Date.now() - n * 24 * 60 * 60 * 1000);

  async function seedPost(
    input: {
      title?: string;
      authorName?: string;
      cityName?: string | null;
      publishedAt?: Date;
    } = {},
  ) {
    return prisma.post.create({
      data: {
        title: input.title ?? 'Untitled',
        authorName: input.authorName ?? 'Anonymous',
        cityName: input.cityName ?? null,
        publishedAt: input.publishedAt ?? new Date(),
      },
    });
  }

  async function seedUpvotes(
    postId: string,
    count: number,
    when?: Date,
  ): Promise<void> {
    const at = when ?? new Date();
    await prisma.upvote.createMany({
      data: Array.from({ length: count }, () => ({ postId, createdAt: at })),
    });
  }

  const getHotPosts = () =>
    request(app.getHttpServer()).get('/api/home/hot-posts');

  it('摘要字段齐备：id / title / authorName / upvoteCount / publishedAt，cityName 在归属城市时存在（2.1）', async () => {
    const post = await seedPost({
      title: 'Beijing in autumn',
      authorName: 'Li Wei',
      cityName: 'Beijing',
    });
    await seedUpvotes(post.id, 3);

    const res = await getHotPosts();

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    const [item] = res.body as Array<Record<string, unknown>>;
    expect(item).toMatchObject({
      id: post.id,
      title: 'Beijing in autumn',
      authorName: 'Li Wei',
      cityName: 'Beijing',
      upvoteCount: 3,
    });
    expect(typeof item.publishedAt).toBe('string');
    expect(Number.isNaN(Date.parse(item.publishedAt as string))).toBe(false);
  });

  it('未关联城市的帖子仍出现，cityName 为空或缺失（2.1 第二 Scenario）', async () => {
    const post = await seedPost({ title: 'No city', cityName: null });
    await seedUpvotes(post.id, 1);

    const res = await getHotPosts();

    expect(res.status).toBe(200);
    const [item] = res.body as Array<Record<string, unknown>>;
    expect(item.id).toBe(post.id);
    expect(item.cityName ?? null).toBeNull();
  });

  it('候选充足时返回 10 条，相邻 upvoteCount 不递增（2.2）', async () => {
    for (let i = 0; i < 12; i += 1) {
      const post = await seedPost({ title: `post-${i}` });
      await seedUpvotes(post.id, i);
    }

    const res = await getHotPosts();

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(10);
    const counts = (res.body as Array<{ upvoteCount: number }>).map(
      (p) => p.upvoteCount,
    );
    for (let i = 0; i < counts.length - 1; i += 1) {
      expect(counts[i]).toBeGreaterThanOrEqual(counts[i + 1]);
    }
    expect(counts[0]).toBe(11);
  });

  it('Upvote 相同时按 publishedAt DESC、再按 id ASC，两次请求顺序一致（2.3）', async () => {
    const sameTime = daysAgo(1);
    const older = daysAgo(3);
    const a = await seedPost({ title: 'A', publishedAt: sameTime });
    const b = await seedPost({ title: 'B', publishedAt: sameTime });
    const c = await seedPost({ title: 'C', publishedAt: older });
    await seedUpvotes(a.id, 2);
    await seedUpvotes(b.id, 2);
    await seedUpvotes(c.id, 2);

    const first = await getHotPosts();
    const second = await getHotPosts();

    expect(first.status).toBe(200);
    const ids = (first.body as Array<{ id: string }>).map((p) => p.id);
    expect(ids).toEqual((second.body as Array<{ id: string }>).map((p) => p.id));

    // 同发布时间 → id 升序；更早发布的 C 排在其后
    const samePublishOrder = [a.id, b.id].sort();
    expect(ids.slice(0, 2)).toEqual(samePublishOrder);
    expect(ids[2]).toBe(c.id);
  });

  it('窗口外的历史高票帖子不入选：票数只统计最近 7 天（2.4）', async () => {
    const oldHit = await seedPost({
      title: 'old-hit',
      publishedAt: daysAgo(30),
    });
    await seedUpvotes(oldHit.id, 50, daysAgo(8)); // 全部落在 7 天窗口外

    for (let i = 0; i < 10; i += 1) {
      const post = await seedPost({ title: `fresh-${i}`, publishedAt: daysAgo(1) });
      await seedUpvotes(post.id, 1);
    }

    const res = await getHotPosts();

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(10);
    expect((res.body as Array<{ id: string }>).map((p) => p.id)).not.toContain(
      oldHit.id,
    );
  });

  it('无候选时返回 200 + 空数组，不是 404 也不是 null（2.5）', async () => {
    const res = await getHotPosts();

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('返回的 upvoteCount 一律为非负整数（2.6 的可观察面）', async () => {
    const post = await seedPost({});
    await seedUpvotes(post.id, 2);

    const res = await getHotPosts();

    expect(res.status).toBe(200);
    for (const item of res.body as Array<{ upvoteCount: number }>) {
      expect(Number.isInteger(item.upvoteCount)).toBe(true);
      expect(item.upvoteCount).toBeGreaterThanOrEqual(0);
    }
  });
});
