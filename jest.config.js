/**
 * Jest 配置：运行 e2e 规格（*.e2e-spec.ts）与纯函数单测（*.spec.ts）。
 *
 * setupFiles 注入测试期 DATABASE_URL 默认值（本地 compose 的 PostgreSQL），
 * 真实环境变量优先，不在此写死凭据。
 *
 * maxWorkers: 1 —— 集成测试共用同一个数据库实例，而每个用例的 beforeEach 都要
 * 清表。多个文件并行时，A 文件正在写入的数据会被 B 文件的删表操作清掉，
 * 表现为「单独跑绿、全量跑红」且失败断言指向数据条数对不上，极难定位。
 * 串行的代价是耗时增加，换来的是「测试结果只由代码决定」这一确定性。
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testRegex: ".*\\.(e2e-)?spec\\.ts$",
  setupFiles: ["<rootDir>/test/setup-env.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  maxWorkers: 1,
};
