package com.example.myfirstproject;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 数据访问基座的最小验证：一次性 PostgreSQL 容器 + 含 DataSource 的上下文 + 真的执行一条 SQL。
 *
 * 本切片刻意不引入任何业务实体或领域模型——只证明"连接链路是通的"。
 * 先于实现编写：在 JPA / 驱动 / 数据源缺位时它必须失败（表现为 NoSuchBeanDefinitionException）。
 * 容器由 {@link AbstractIntegrationTest} 提供。
 */
class PersistenceTest extends AbstractIntegrationTest {

    @Autowired
    private DataSource dataSource;

    @Test
    @DisplayName("能连上一次性 PostgreSQL 并执行 SELECT 1")
    void canExecuteSelectOne() throws Exception {
        try (Connection connection = dataSource.getConnection();
                Statement statement = connection.createStatement();
                ResultSet resultSet = statement.executeQuery("SELECT 1")) {

            assertTrue(resultSet.next(), "SELECT 1 应返回一行");
            assertEquals(1, resultSet.getInt(1));
        }
    }
}
