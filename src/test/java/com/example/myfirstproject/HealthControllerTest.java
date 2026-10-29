package com.example.myfirstproject;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 对应 spec「健康状态查询」：调用方查询健康探针应拿到 200 且 status=ok。
 *
 * 本测试先于实现编写——在 HealthController 存在之前它必须失败。
 */
@AutoConfigureMockMvc
class HealthControllerTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("查询健康探针返回 200 且 status 为 ok")
    void healthReturnsOkStatus() throws Exception {
        mockMvc.perform(get("/api/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("ok"));
    }

    @Test
    @DisplayName("健康探针在未携带任何凭据时可访问")
    void healthIsAccessibleWithoutCredentials() throws Exception {
        MockHttpServletResponse response = mockMvc.perform(get("/api/health")).andReturn().getResponse();

        assertNotEquals(401, response.getStatus(), "健康探针不应要求认证");
        assertNotEquals(403, response.getStatus(), "健康探针不应拒绝匿名访问");
        assertEquals(200, response.getStatus());
    }
}
