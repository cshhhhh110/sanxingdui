package org.example.springboot.mcp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.springboot.mcp.dto.McpToolCallRequest;
import org.example.springboot.mcp.dto.McpToolCallResponse;
import org.example.springboot.mcp.dto.McpToolDefinition;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * MCP控制器
 * 提供MCP工具调用REST API
 */
@Slf4j
@RestController
@RequestMapping("/api/mcp")
@RequiredArgsConstructor
public class McpController {
    
    private final McpToolRegistry toolRegistry;
    
    /**
     * 获取所有可用工具列表
     */
    @GetMapping("/tools")
    public ResponseEntity<Map<String, Object>> getTools() {
        List<McpToolDefinition> tools = toolRegistry.getToolDefinitions();
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("tools", tools);
        response.put("count", tools.size());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 调用指定工具
     */
    @PostMapping("/call")
    public ResponseEntity<McpToolCallResponse> callTool(
            @RequestBody McpToolCallRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        
        log.info("[MCP API] 调用工具: {}, 参数: {}, 用户: {}", 
                request.getTool(), request.getParams(), userId);
        
        // 如果请求中没有userId，使用header中的
        Long effectiveUserId = request.getUserId() != null ? request.getUserId() : userId;
        
        McpToolCallResponse response = toolRegistry.executeTool(
                request.getTool(),
                request.getParams(),
                effectiveUserId
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 批量调用工具
     */
    @PostMapping("/batch")
    public ResponseEntity<Map<String, Object>> batchCall(
            @RequestBody List<McpToolCallRequest> requests,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        
        log.info("[MCP API] 批量调用工具: {} 个", requests.size());
        
        Map<String, McpToolCallResponse> results = new HashMap<>();
        long startTime = System.currentTimeMillis();
        
        for (McpToolCallRequest request : requests) {
            Long effectiveUserId = request.getUserId() != null ? request.getUserId() : userId;
            McpToolCallResponse response = toolRegistry.executeTool(
                    request.getTool(),
                    request.getParams(),
                    effectiveUserId
            );
            results.put(request.getTool(), response);
        }
        
        long totalDuration = System.currentTimeMillis() - startTime;
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("results", results);
        response.put("count", results.size());
        response.put("totalDuration", totalDuration);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 检查工具是否存在
     */
    @GetMapping("/tools/{name}")
    public ResponseEntity<Map<String, Object>> getTool(@PathVariable String name) {
        boolean exists = toolRegistry.hasTool(name);
        
        Map<String, Object> response = new HashMap<>();
        response.put("exists", exists);
        response.put("tool", name);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * MCP服务状态检查
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "running");
        status.put("toolCount", toolRegistry.getToolCount());
        status.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(status);
    }
}
