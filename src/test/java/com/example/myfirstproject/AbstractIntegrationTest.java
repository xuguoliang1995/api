package com.example.myfirstproject;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * 集成测试基类：整个测试 JVM 复用同一个一次性 PostgreSQL。
 *
 * 用单例模式（static 块启动）而不是 {@code @Container}，是因为引入 JPA 后每个
 * {@code @SpringBootTest} 都需要数据库——按类起容器会把数据库启动耗时摊到每个
 * 测试类上。容器回收交给 Ryuk，JVM 退出后自动清理。
 *
 * {@code @SpringBootTest} 带 {@code @Inherited}，因此子类只要继承本类即可。
 */
@SpringBootTest
abstract class AbstractIntegrationTest {

    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void datasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }
}
