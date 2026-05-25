package org.example.springboot.mcp.tool.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.springboot.entity.ShopProduct;
import org.example.springboot.mapper.ShopProductMapper;
import org.example.springboot.mcp.dto.McpToolCallResponse;
import org.example.springboot.mcp.tool.McpTool;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 搜索商品工具
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SearchProductTool implements McpTool {
    
    private final ShopProductMapper shopProductMapper;
    
    @Override
    public String getName() {
        return "search_product";
    }
    
    @Override
    public String getDescription() {
        return "搜索商城商品";
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
            String categoryId = (String) params.getOrDefault("categoryId", null);
            Integer page = params.get("page") != null ? ((Number) params.get("page")).intValue() : 1;
            Integer pageSize = params.get("pageSize") != null ? ((Number) params.get("pageSize")).intValue() : 12;
            
            log.info("[MCP] 搜索商品: keyword={}, categoryId={}, page={}", keyword, categoryId, page);
            
            // 构建查询条件
            QueryWrapper<ShopProduct> wrapper = new QueryWrapper<>();
            
            if (keyword != null && !keyword.isEmpty()) {
                wrapper.and(w -> w.like("title", keyword)
                        .or().like("subtitle", keyword)
                        .or().like("detail", keyword));
            }
            
            if (categoryId != null && !categoryId.isEmpty()) {
                wrapper.eq("category_id", categoryId);
            }
            
            wrapper.eq("status", 1); // 只查询上架的
            
            // 分页查询
            Page<ShopProduct> pageResult = shopProductMapper.selectPage(
                    new Page<>(page, pageSize), wrapper);
            
            List<Map<String, Object>> results = pageResult.getRecords().stream()
                    .map(product -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", product.getId());
                        map.put("title", product.getTitle());
                        map.put("subtitle", product.getSubtitle());
                        map.put("price", product.getPrice());
                        map.put("stock", product.getStock());
                        map.put("status", product.getStatus());
                        map.put("categoryId", product.getCategoryId());
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
                    .message("搜索到 " + pageResult.getTotal() + " 个商品")
                    .tool(getName())
                    .duration(duration)
                    .build();
                    
        } catch (Exception e) {
            log.error("[MCP] 搜索商品失败", e);
            return McpToolCallResponse.error("搜索失败: " + e.getMessage());
        }
    }
}
