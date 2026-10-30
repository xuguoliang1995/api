/**
 * Jest 配置：运行 e2e 规格（*.e2e-spec.ts）与纯函数单测（*.spec.ts）。
 *
 * setupFiles 注入测试期 DATABASE_URL 默认值（本地 compose 的 PostgreSQL），
 * 真实环境变量优先，不在此写死凭据。
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testRegex: ".*\\.(e2e-)?spec\\.ts$",
  setupFiles: ["<rootDir>/test/setup-env.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
};
