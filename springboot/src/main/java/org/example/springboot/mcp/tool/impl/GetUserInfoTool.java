package org.example.springboot.mcp.tool.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.springboot.entity.User;
import org.example.springboot.mapper.UserMapper;
import org.example.springboot.mcp.dto.McpToolCallResponse;
import org.example.springboot.mcp.tool.McpTool;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * 获取用户信息工具
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GetUserInfoTool implements McpTool {
    
    private final UserMapper userMapper;
    
    @Override
    public String getName() {
        return "get_user_info";
    }
    
    @Override
    public String getDescription() {
        return "获取当前登录用户信息";
    }
    
    @Override
    public String getCategory() {
        return "INFO";
    }
    
    @Override
    public boolean requiresAuth() {
        return true;
    }
    
    @Override
    public McpToolCallResponse execute(Map<String, Object> params, Long userId) {
        long startTime = System.currentTimeMillis();
        
        try {
            if (userId == null) {
                return McpToolCallResponse.error("用户未登录");
            }
            
            log.info("[MCP] 获取用户信息: userId={}", userId);
            
            User user = userMapper.selectById(userId);
            
            if (user == null) {
                return McpToolCallResponse.error("用户不存在");
            }
            
            Map<String, Object> data = new HashMap<>();
            data.put("id", user.getId());
            data.put("username", user.getUsername());
            data.put("nickname", user.getDisplayName());
            data.put("email", user.getEmail());
            data.put("phone", user.getPhone());
            data.put("avatar", user.getAvatar());
            
            long duration = System.currentTimeMillis() - startTime;
            
            return McpToolCallResponse.builder()
                    .success(true)
                    .data(data)
                    .message("获取用户信息成功")
                    .tool(getName())
                    .duration(duration)
                    .build();
                    
        } catch (Exception e) {
            log.error("[MCP] 获取用户信息失败", e);
            return McpToolCallResponse.error("获取用户信息失败: " + e.getMessage());
        }
    }
}
