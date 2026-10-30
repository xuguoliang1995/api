/** Jest 配置：仅运行 e2e 规格（*.e2e-spec.ts），ts-jest 现场编译 TS。 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testRegex: ".*\\.e2e-spec\\.ts$",
  moduleFileExtensions: ["ts", "js", "json"],
};
