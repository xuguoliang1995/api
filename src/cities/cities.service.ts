import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CitySummary } from './city.dto';
import { isNonBlankText, isValidCitySlug } from './slug';

/** 更新时允许出现的字段白名单；`slug` 不在其中是有意的（标识不可变）。 */
const UPDATABLE_FIELDS = ['name', 'nameZh', 'isPublished'] as const;

function toSummary(city: {
  id: string;
  slug: string;
  name: string;
  nameZh: string;
  isPublished: boolean;
}): CitySummary {
  return {
    id: city.id,
    slug: city.slug,
    name: city.name,
    nameZh: city.nameZh,
    isPublished: city.isPublished,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

/**
 * 城市目录的读写服务。
 *
 * 三个不变量在这里落地：
 * 1. `slug` 只在创建时出现，更新路径显式拒绝该字段（delta 不可变性）；
 * 2. 唯一性既查库也靠 `cities.slug` 唯一约束——并发下「先查后插」必失效，
 *    所以捕获 P2002 而不是相信前置查询（40-database）；
 * 3. 未上线城市与不存在城市返回**同一个** 404：区分两者等于把「这个城市存在但
 *    被下线了」告诉外部，而这属于内部状态。
 */
@Injectable()
export class CitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: unknown): Promise<CitySummary> {
    const body = this.parseCreateBody(input);

    try {
      const city = await this.prisma.city.create({ data: body });
      return toSummary(city);
    } catch (error) {
      if (isUniqueViolation(error)) {
        // 冲突信息带上 slug：调用方要能定位到是哪一条撞了
        throw new ConflictException(`城市标识已被占用：${body.slug}`);
      }
      throw error;
    }
  }

  /** 清单只含已上线城市，按 slug 升序——次序不依赖存储引擎的默认返回顺序。 */
  async list(): Promise<CitySummary[]> {
    const rows = await this.prisma.city.findMany({
      where: { isPublished: true },
      orderBy: { slug: 'asc' },
    });
    return rows.map(toSummary);
  }

  /** 按 URL 中的 slug 读取；未上线与不存在一律 404（delta 上线状态决定可达性）。 */
  async findAccessible(slug: string): Promise<CitySummary> {
    const city = await this.prisma.city.findUnique({ where: { slug } });
    if (!city || !city.isPublished) {
      throw new NotFoundException('城市不存在');
    }
    return toSummary(city);
  }

  async update(slug: string, input: unknown): Promise<CitySummary> {
    const data = this.parseUpdateBody(input);

    const existing = await this.prisma.city.findUnique({ where: { slug } });
    if (!existing) {
      throw new NotFoundException('城市不存在');
    }

    const city = await this.prisma.city.update({ where: { slug }, data });
    return toSummary(city);
  }

  private parseCreateBody(input: unknown): {
    slug: string;
    name: string;
    nameZh: string;
    isPublished: boolean;
  } {
    const body = this.asRecord(input);

    if (!isValidCitySlug(body.slug)) {
      throw new BadRequestException(
        'slug 必须匹配 ^[a-z0-9]+(-[a-z0-9]+)*$ 且长度为 2–32',
      );
    }
    if (!isNonBlankText(body.name)) {
      throw new BadRequestException('name 不能为空');
    }
    if (!isNonBlankText(body.nameZh)) {
      throw new BadRequestException('nameZh 不能为空');
    }
    if (typeof body.isPublished !== 'boolean') {
      throw new BadRequestException('isPublished 必须是布尔值，且不可省略');
    }

    return {
      slug: body.slug,
      name: body.name.trim(),
      nameZh: body.nameZh.trim(),
      isPublished: body.isPublished,
    };
  }

  private parseUpdateBody(input: unknown): {
    name?: string;
    nameZh?: string;
    isPublished?: boolean;
  } {
    const body = this.asRecord(input);

    if (Object.prototype.hasOwnProperty.call(body, 'slug')) {
      throw new BadRequestException(
        'slug 不可修改：改变标识须「原城市下线 + 新城市上线」',
      );
    }

    const data: { name?: string; nameZh?: string; isPublished?: boolean } = {};

    if (Object.prototype.hasOwnProperty.call(body, 'name')) {
      if (!isNonBlankText(body.name)) {
        throw new BadRequestException('name 不能为空');
      }
      data.name = body.name.trim();
    }
    if (Object.prototype.hasOwnProperty.call(body, 'nameZh')) {
      if (!isNonBlankText(body.nameZh)) {
        throw new BadRequestException('nameZh 不能为空');
      }
      data.nameZh = body.nameZh.trim();
    }
    if (Object.prototype.hasOwnProperty.call(body, 'isPublished')) {
      if (typeof body.isPublished !== 'boolean') {
        throw new BadRequestException('isPublished 必须是布尔值');
      }
      data.isPublished = body.isPublished;
    }

    // 空对象与「只传了未知字段」都视为无效请求：静默 200 会让调用方以为改成功了
    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        `没有可更新字段，允许的字段：${UPDATABLE_FIELDS.join(', ')}`,
      );
    }

    return data;
  }

  private asRecord(input: unknown): Record<string, unknown> {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      throw new BadRequestException('请求体必须是 JSON 对象');
    }
    return input as Record<string, unknown>;
  }
}
