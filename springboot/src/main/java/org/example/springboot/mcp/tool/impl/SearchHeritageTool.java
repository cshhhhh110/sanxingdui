package org.example.springboot.mcp.tool.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.springboot.entity.HeritageItem;
import org.example.springboot.mapper.HeritageItemMapper;
import org.example.springboot.mcp.dto.McpToolCallResponse;
import org.example.springboot.mcp.tool.McpTool;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 搜索文物工具
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SearchHeritageTool implements McpTool {
    
    private final HeritageItemMapper heritageItemMapper;
    
    @Override
    public String getName() {
        return "search_heritage";
    }
    
    @Override
    public String getDescription() {
        return "搜索非遗文物作品";
    }
    
    @Override
    public String getCategory() {
        return "SEARCH";
    }
    
    @Override
    public McpToolCallResponse execute(Map<String, Object> params, Long userId) {
        long startTime = System.currentTimeMillis();
        
        try {
            String keyword = (String) params.getOrDefault("keyword", "");
            String category = (String) params.getOrDefault("category", null);
            Integer page = params.get("page") != null ? ((Number) params.get("page")).intValue() : 1;
            Integer pageSize = params.get("pageSize") != null ? ((Number) params.get("pageSize")).intValue() : 10;
            
            log.info("[MCP] 搜索文物: keyword={}, category={}, page={}", keyword, category, page);
            
            // 构建查询条件
            QueryWrapper<HeritageItem> wrapper = new QueryWrapper<>();
            
            if (keyword != null && !keyword.isEmpty()) {
                wrapper.and(w -> w.like("title", keyword)
                        .or().like("description", keyword)
                        .or().like("summary", keyword)
                        .or().like("craft_names", keyword));
            }
            
            if (category != null && !category.isEmpty()) {
                wrapper.eq("category", category);
            }
            
            wrapper.eq("status", 2); // 只查询已发布的
            
            // 分页查询
            Page<HeritageItem> pageResult = heritageItemMapper.selectPage(
                    new Page<>(page, pageSize), wrapper);
            
            List<Map<String, Object>> results = pageResult.getRecords().stream()
                    .map(item -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", item.getId());
                        map.put("title", item.getTitle());
                        map.put("category", item.getCategory());
                        map.put("era", item.getEraName());
                        map.put("region", item.getRegion());
                        map.put("summary", item.getSummary());
                        return map;
                    })
                    .collect(Collectors.toList());
            
            Map<String, Object> data = new HashMap<>();
            data.put("keyword", keyword);
            data.put("results", results);
            data.put("page", page);
            data.put("pageSize", pageSize);
            data.put("total", pageResult.getTotal());
            data.put("pages", pageResult.getPages());
            
            long duration = System.currentTimeMillis() - startTime;
            
            return McpToolCallResponse.builder()
                    .success(true)
                    .data(data)
                    .message("搜索到 " + pageResult.getTotal() + " 个结果")
                    .tool(getName())
                    .duration(duration)
                    .build();
                    
        } catch (Exception e) {
            log.error("[MCP] 搜索文物失败", e);
            return McpToolCallResponse.error("搜索失败: " + e.getMessage());
        }
    }
}
