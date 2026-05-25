package org.example.springboot.mcp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * MCP工具调用响应DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class McpToolCallResponse {
    
    /** 是否成功 */
    private boolean success;
    
    /** 返回数据 */
    private Object data;
    
    /** 错误信息 */
    private String error;
    
    /** 提示消息 */
    private String message;
    
    /** 工具名称 */
    private String tool;
    
    /** 执行时间(ms) */
    private long duration;
    
    public static McpToolCallResponse success(Object data, String message) {
        return McpToolCallResponse.builder()
                .success(true)
                .data(data)
                .message(message)
                .build();
    }
    
    public static McpToolCallResponse error(String errorMessage) {
        return McpToolCallResponse.builder()
                .success(false)
                .error(errorMessage)
                .build();
    }
}
