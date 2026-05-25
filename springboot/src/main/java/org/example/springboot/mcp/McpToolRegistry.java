package org.example.springboot.mcp;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.springboot.mcp.dto.McpToolDefinition;
import org.example.springboot.mcp.dto.McpToolCallResponse;
import org.example.springboot.mcp.tool.McpTool;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * MCP工具注册中心
 * 统一管理所有MCP工具的注册和调用
 */
@Slf4j
@Component
@Getter
@RequiredArgsConstructor
public class McpToolRegistry {
    
    /** 工具注册表 */
    private final Map<String, McpTool> tools = new ConcurrentHashMap<>();
    
    /** 已注册的工具列表 */
    private List<McpTool> registeredTools;
    
    /** 初始化的工具类 */
    private final List<McpTool> toolInstances;
    
    /**
     * 初始化工具注册
     */
    @PostConstruct
    public void init() {
        registeredTools = new ArrayList<>();
        
        for (McpTool tool : toolInstances) {
            register(tool);
        }
        
        log.info("[MCP] 工具注册中心初始化完成，共注册 {} 个工具", tools.size());
        
        // 打印所有工具
        tools.forEach((name, tool) -> {
            log.info("[MCP] - {} ({})", tool.getName(), tool.getCategory());
        });
    }
    
    /**
     * 注册工具
     */
    public void register(McpTool tool) {
        if (tool == null || tool.getName() == null) {
            log.warn("[MCP] 跳过无效工具注册");
            return;
        }
        
        String toolName = tool.getName();
        
        if (tools.containsKey(toolName)) {
            log.warn("[MCP] 工具 {} 已存在，将被替换", toolName);
        }
        
        tools.put(toolName, tool);
        registeredTools.add(tool);
        
        log.debug("[MCP] 注册工具: {}", toolName);
    }
    
    /**
     * 获取工具
     */
    public Optional<McpTool> getTool(String name) {
        return Optional.ofNullable(tools.get(name));
    }
    
    /**
     * 执行工具
     */
    public McpToolCallResponse executeTool(String toolName, Map<String, Object> params, Long userId) {
        long startTime = System.currentTimeMillis();
        
        McpTool tool = tools.get(toolName);
        
        if (tool == null) {
            log.warn("[MCP] 工具不存在: {}", toolName);
            return McpToolCallResponse.error("工具不存在: " + toolName);
        }
        
        // 检查认证
        if (tool.requiresAuth() && userId == null) {
            log.warn("[MCP] 工具 {} 需要认证", toolName);
            return McpToolCallResponse.error("该操作需要登录");
        }
        
        try {
            log.info("[MCP] 执行工具: {} by userId: {}", toolName, userId);
            McpToolCallResponse response = tool.execute(params, userId);
            response.setDuration(System.currentTimeMillis() - startTime);
            return response;
        } catch (Exception e) {
            log.error("[MCP] 工具执行失败: {}", toolName, e);
            return McpToolCallResponse.error("工具执行失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取所有工具定义
     */
    public List<McpToolDefinition> getToolDefinitions() {
        List<McpToolDefinition> definitions = new ArrayList<>();
        
        for (McpTool tool : registeredTools) {
            definitions.add(McpToolDefinition.builder()
                    .name(tool.getName())
                    .description(tool.getDescription())
                    .category(tool.getCategory())
                    .requireAuth(tool.requiresAuth())
                    .build());
        }
        
        return definitions;
    }
    
    /**
     * 获取工具数量
     */
    public int getToolCount() {
        return tools.size();
    }
    
    /**
     * 工具是否存在
     */
    public boolean hasTool(String name) {
        return tools.containsKey(name);
    }
}
