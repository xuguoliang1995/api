/**
 * e2e 测试环境默认值：本地 `apps/api/compose.yaml` 起的 PostgreSQL 16。
 *
 * 用 `??=` 而不是直接赋值——真实的 DATABASE_URL 优先（CI 或开发者本机可覆盖），
 * 且这里只写本地开发默认值，不含任何真实凭据（30-security-and-git.md 第 1 条）。
 */
process.env.DATABASE_URL ??=
  'postgresql://myfirstproject:myfirstproject@127.0.0.1:5432/myfirstproject';
