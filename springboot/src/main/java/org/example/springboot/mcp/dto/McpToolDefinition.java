package org.example.springboot.mcp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

/**
 * MCP工具定义DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class McpToolDefinition {
    
    /** 工具名称 */
    private String name;
    
    /** 工具描述 */
    private String description;
    
    /** 工具分类 */
    private String category;
    
    /** 输入参数定义 */
    private Map<String, ToolParam> inputSchema;
    
    /** 是否需要认证 */
    private boolean requireAuth;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ToolParam {
        private String type;
        private String description;
        private boolean required;
        private List<String> enums;
        private Object defaultValue;
    }
}
