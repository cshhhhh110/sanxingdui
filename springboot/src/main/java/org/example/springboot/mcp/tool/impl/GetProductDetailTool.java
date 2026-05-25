package org.example.springboot.mcp.tool.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.springboot.entity.ShopProduct;
import org.example.springboot.mapper.ShopProductMapper;
import org.example.springboot.mcp.dto.McpToolCallResponse;
import org.example.springboot.mcp.tool.McpTool;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * 获取商品详情工具
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GetProductDetailTool implements McpTool {
    
    private final ShopProductMapper shopProductMapper;
    
    @Override
    public String getName() {
        return "get_product_detail";
    }
    
    @Override
    public String getDescription() {
        return "获取商品详细信息";
    }
    
    @Override
    public String getCategory() {
        return "INFO";
    }
    
    @Override
    public McpToolCallResponse execute(Map<String, Object> params, Long userId) {
        long startTime = System.currentTimeMillis();
        
        try {
            Object productIdObj = params.get("productId");
            if (productIdObj == null) {
                return McpToolCallResponse.error("缺少商品ID参数");
            }
            
            String productId = productIdObj.toString();
            
            log.info("[MCP] 获取商品详情: productId={}", productId);
            
            ShopProduct product = shopProductMapper.selectById(productId);
            
            if (product == null) {
                return McpToolCallResponse.error("商品不存在");
            }
            
            Map<String, Object> data = new HashMap<>();
            data.put("id", product.getId());
            data.put("title", product.getTitle());
            data.put("detail", product.getDetail());
            data.put("price", product.getPrice());
            data.put("stock", product.getStock());
            data.put("categoryId", product.getCategoryId());
            data.put("status", product.getStatus());
            
            long duration = System.currentTimeMillis() - startTime;
            
            return McpToolCallResponse.builder()
                    .success(true)
                    .data(data)
                    .message("获取商品详情成功")
                    .tool(getName())
                    .duration(duration)
                    .build();
                    
        } catch (Exception e) {
            log.error("[MCP] 获取商品详情失败", e);
            return McpToolCallResponse.error("获取商品详情失败: " + e.getMessage());
        }
    }
}
