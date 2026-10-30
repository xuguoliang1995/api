import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { buildSwaggerConfig } from './swagger.config';

/**
 * 后端入口：启动 NestJS HTTP 服务。
 *
 * 契约真相由 @nestjs/swagger 从代码派生，构建期用 scripts/generate-openapi.ts
 * 输出到 contracts/openapi.json（前端据此派生类型）。
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const document = SwaggerModule.createDocument(app, buildSwaggerConfig());
  SwaggerModule.setup('api-docs', app, document);

  const port = Number(process.env.PORT ?? 8080);
  await app.listen(port);
}

void bootstrap();
