import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from '../src/app.module';
import { buildSwaggerConfig } from '../src/swagger.config';

/**
 * 从 NestJS 代码生成 OpenAPI 契约，写出到仓库根 contracts/openapi.json。
 * code-first 真相链路：后端实现 → 契约 → 前端派生类型。
 */
async function generate(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });

  const document = SwaggerModule.createDocument(app, buildSwaggerConfig());

  const outputPath = join(__dirname, '..', '..', '..', 'contracts', 'openapi.json');
  writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');

  await app.close();
}

void generate();
