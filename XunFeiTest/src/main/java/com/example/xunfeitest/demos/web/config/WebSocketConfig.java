package com.example.xunfeitest.demos.web.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.server.standard.ServerEndpointExporter;

/**
 * @author qfy
 * @date Created in 2024/6/17 13:48
 * @entity
 * @controller
 * @tableName
 * @service
 * @mapper
 * @description
 */
@Configuration
public class WebSocketConfig {
    /*
    * 返回的ServerEndpointExporter实例注册到Spring上下文中。*/
    @Bean
    public ServerEndpointExporter serverEndpointExporter() {
        return new ServerEndpointExporter();
    }
}
