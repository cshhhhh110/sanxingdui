package org.example.springboot.mcp.dto;

import lombok.Data;
import java.util.Map;

/**
 * MCP工具调用请求DTO
 */
@Data
public class McpToolCallRequest {
    
    /** 工具名称 */
    private String tool;
    
    /** 工具参数 */
    private Map<String, Object> params;
    
    /** 用户ID */
    private Long userId;
    
    /** 会话ID */
    private String sessionId;
}
