package org.example.springboot.mcp.tool.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.springboot.mcp.dto.McpToolCallResponse;
import org.example.springboot.mcp.tool.McpTool;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * 页面导航工具
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NavigateToTool implements McpTool {
    
    /** 路由映射表 */
    private static final Map<String, String> ROUTE_MAPPINGS = new HashMap<>();
    
    static {
        ROUTE_MAPPINGS.put("home", "/home");
        ROUTE_MAPPINGS.put("heritage", "/heritage");
        ROUTE_MAPPINGS.put("inheritor", "/inheritor");
        ROUTE_MAPPINGS.put("activity", "/activity");
        ROUTE_MAPPINGS.put("course", "/course");
        ROUTE_MAPPINGS.put("shop", "/shop");
        ROUTE_MAPPINGS.put("ai-chat", "/ai-chat");
        ROUTE_MAPPINGS.put("profile", "/profile");
        ROUTE_MAPPINGS.put("orders", "/orders");
        ROUTE_MAPPINGS.put("quiz", "/quiz");
        ROUTE_MAPPINGS.put("3d", "/3d");
    }
    
    @Override
    public String getName() {
        return "navigate_to";
    }
    
    @Override
    public String getDescription() {
        return "导航到指定页面";
    }
    
    @Override
    public String getCategory() {
        return "NAVIGATION";
    }
    
    @Override
    public McpToolCallResponse execute(Map<String, Object> params, Long userId) {
        long startTime = System.currentTimeMillis();
        
        try {
            String destination = (String) params.get("destination");
            
            if (destination == null || destination.isEmpty()) {
                return McpToolCallResponse.error("缺少目标页面参数");
            }
            
            String path = ROUTE_MAPPINGS.get(destination.toLowerCase());
            
            if (path == null) {
                return McpToolCallResponse.error("未知的页面: " + destination);
            }
            
            log.info("[MCP] 导航到: {} -> {}", destination, path);
            
            Map<String, Object> data = new HashMap<>();
            data.put("destination", destination);
            data.put("path", path);
            
            long duration = System.currentTimeMillis() - startTime;
            
            return McpToolCallResponse.builder()
                    .success(true)
                    .data(data)
                    .message("正在跳转到: " + destination)
                    .tool(getName())
                    .duration(duration)
                    .build();
                    
        } catch (Exception e) {
            log.error("[MCP] 导航失败", e);
            return McpToolCallResponse.error("导航失败: " + e.getMessage());
        }
    }
}
