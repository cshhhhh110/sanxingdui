package org.example.springboot.mcp.tool;

import org.example.springboot.mcp.dto.McpToolCallResponse;
import java.util.Map;

/**
 * MCP工具接口
 * 所有MCP工具必须实现此接口
 */
public interface McpTool {
    
    /**
     * 获取工具名称
     */
    String getName();
    
    /**
     * 获取工具描述
     */
    String getDescription();
    
    /**
     * 获取工具分类
     */
    String getCategory();
    
    /**
     * 是否需要认证
     */
    default boolean requiresAuth() {
        return false;
    }
    
    /**
     * 执行工具
     * @param params 参数
     * @param userId 用户ID
     * @return 执行结果
     */
    McpToolCallResponse execute(Map<String, Object> params, Long userId);
}
