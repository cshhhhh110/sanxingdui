package org.example.springboot.mcp.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.springboot.mcp.McpToolRegistry;
import org.example.springboot.mcp.tool.McpTool;
import org.example.springboot.mcp.tool.impl.*;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

/**
 * MCP 自动配置类
 * 自动注册所有 MCP 工具
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class McpAutoConfig {
    
    private final McpToolRegistry toolRegistry;
    
    @PostConstruct
    public void init() {
        log.info("[MCP] ============== MCP 服务初始化 ==============");
        log.info("[MCP] 工具注册中心已就绪，等待工具自动注册...");
    }
}
