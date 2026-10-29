package com.example.myfirstproject.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 跨源配置。
 *
 * dev 场景下 Vite 与后端不同源（即便有代理，也允许浏览器直连 8080 调试），
 * 因此放行本机任意端口的来源，避免把 dev 端口写死。
 * 生产环境的来源白名单不在本变更范围内，部署时需另行收敛。
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600);
    }
}
