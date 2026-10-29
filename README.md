# apps/api

后端可部署单元：**Spring Boot 3.5.16 + Spring Data JPA**，Maven 管理，**JDK 21**。

选型依据见 `docs/decisions/0002-adopt-polyglot-stack.md`。

## 开发

```bash
cd apps/api
./mvnw test                # 单元 / 集成测试
./mvnw spring-boot:run     # 启动，默认 http://localhost:8080
```

只需要 JDK 21；**不要求全局 `mvn`**，仓库自带 Maven wrapper（`./mvnw`）。

启动时 `spring-boot-docker-compose` 会按 `compose.yaml` 自动拉起 PostgreSQL 并接管连接信息，
所以还需要**运行中的 Docker Desktop**（daemon 由 GUI 托管，开机后要打开一次）。
要接自己已有的库，用环境变量覆盖：`DB_URL` / `DB_USERNAME` / `DB_PASSWORD`。

## 契约（OpenAPI code-first）

对外接口的契约由 springdoc 从 controller 注解生成，产物落在仓库根的 `contracts/`：

```bash
# 先启动应用，再导出（jq -S 保证键序稳定，便于 diff）
curl -s http://127.0.0.1:8080/v3/api-docs | jq -S . > ../../contracts/openapi.json
```

改了接口就必须重新导出该文件并在前端跑 `codegen`，
否则 `scripts/verify.sh` 的 contract 阶段会红。

## 数据访问与测试

- 生产与开发使用 PostgreSQL；本地开发由 `compose.yaml` 提供，测试用 **Testcontainers** 起一次性容器，
  不依赖本机预装数据库
- 因此跑数据相关测试需要可用的 Docker daemon；Docker 缺失时 `verify.sh` 会如实报"无法验证"
- 集成测试统一继承 `AbstractIntegrationTest`——它在整个测试 JVM 内复用同一个容器，
  新加 `@SpringBootTest` 时继承它即可，不要各自再起一个容器

## 边界

- 不包含 UI 逻辑
- **不依赖 `packages/shared`**（后端不是 TS 工程）；跨栈一致性只经 `contracts/`
- 鉴权与权限模型属于**全量规格**：必须写 `design.md` + ADR
  （见 `harness/rules/30-security-and-git.md` 第 8 条）
