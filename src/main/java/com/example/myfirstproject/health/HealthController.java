package com.example.myfirstproject.health;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 健康探针接口：对应 spec「健康状态查询」。
 *
 * 刻意保持匿名可访问——不引入任何鉴权依赖，也不做凭据校验。
 */
@RestController
@RequestMapping("/api")
@Tag(name = "health", description = "服务健康探针")
public class HealthController {

    @GetMapping("/health")
    @Operation(summary = "查询健康状态", description = "返回服务存活状态；无需鉴权")
    public HealthResponse health() {
        return new HealthResponse("ok");
    }
}
