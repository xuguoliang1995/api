package com.example.myfirstproject;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 后端应用入口。
 *
 * 当前为 adopt-polyglot-stack 变更的首个垂直切片：只提供 health-check，
 * 业务领域能力留待后续变更。
 */
@SpringBootApplication
public class ApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiApplication.class, args);
    }
}
