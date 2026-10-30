import { DocumentBuilder, type OpenAPIObject } from '@nestjs/swagger';

/**
 * OpenAPI 文档元信息。
 *
 * 运行期（main.ts 的 /api-docs）与构建期（scripts/generate-openapi.ts 导出
 * contracts/openapi.json）共用同一份配置——两处各写一份必然漂移。
 *
 * servers 显式写 127.0.0.1 而非 localhost：与 apps/web 的转发目标保持一致，
 * 避免协议解析差异让契约里的示例地址不可用。
 */
export function buildSwaggerConfig(): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle('my-first-project API')
    .setDescription('NestJS 后端；契约经 @nestjs/swagger 派生')
    .setVersion('1.0')
    .addServer('http://127.0.0.1:8080', '本地开发后端')
    .build();
}
