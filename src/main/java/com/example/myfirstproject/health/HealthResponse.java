package com.example.myfirstproject.health;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 健康探针的响应体。
 *
 * 作为 OpenAPI 契约的一部分：前端的类型由它生成的 openapi.json 派生。
 */
@Schema(description = "健康探针响应")
public record HealthResponse(
        @Schema(description = "服务状态，存活时为 ok", example = "ok")
        String status
) {
}
