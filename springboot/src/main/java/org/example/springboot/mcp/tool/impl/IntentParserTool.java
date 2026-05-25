package org.example.springboot.mcp.tool.impl;

import lombok.extern.slf4j.Slf4j;
import org.example.springboot.mcp.dto.McpToolCallResponse;
import org.example.springboot.mcp.tool.McpTool;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * 意图解析工具
 * 将自然语言解析为具体的MCP工具调用
 */
@Slf4j
@Component
public class IntentParserTool implements McpTool {
    
    /** 意图关键词映射 */
    private static final Map<String, List<String>> INTENT_KEYWORDS = new HashMap<>();
    
    /** 工具名称映射 */
    private static final Map<String, String> TOOL_MAPPINGS = new HashMap<>();
    
    static {
        // 导航意图
        INTENT_KEYWORDS.put("navigation", Arrays.asList("去", "打开", "跳到", "转到", "进入", "访问", "看看", "查看"));
        TOOL_MAPPINGS.put("navigation", "navigate_to");
        
        // 搜索意图
        INTENT_KEYWORDS.put("search", Arrays.asList("搜索", "查找", "找", "查询", "看看有什么"));
        TOOL_MAPPINGS.put("search", "search_product");
        
        // 喜欢/收藏意图
        INTENT_KEYWORDS.put("like", Arrays.asList("喜欢", "点赞", "收藏", "关注"));
        
        // 预约意图
        INTENT_KEYWORDS.put("book", Arrays.asList("预约", "报名", "预订", "参加"));
        
        // 播放意图
        INTENT_KEYWORDS.put("play", Arrays.asList("播放", "听", "看", "打开"));
        
        // 帮助意图
        INTENT_KEYWORDS.put("help", Arrays.asList("怎么", "如何", "帮助", "教程", "使用"));
        
        // 购买意图
        INTENT_KEYWORDS.put("buy", Arrays.asList("购买", "买", "下单"));
        
        // 停止意图
        INTENT_KEYWORDS.put("stop", Arrays.asList("停止", "取消", "关闭", "退出"));
        
        // 问答意图
        INTENT_KEYWORDS.put("question", Arrays.asList("?", "？", "什么", "怎么", "如何", "为什么", "多少", "吗"));
    }
    
    /** 路由映射表 */
    private static final Map<String, String> ROUTE_MAPPINGS = new HashMap<>();
    
    static {
        ROUTE_MAPPINGS.put("首页", "home");
        ROUTE_MAPPINGS.put("主页", "home");
        ROUTE_MAPPINGS.put("非遗作品", "heritage");
        ROUTE_MAPPINGS.put("文物", "heritage");
        ROUTE_MAPPINGS.put("作品", "heritage");
        ROUTE_MAPPINGS.put("传承人", "inheritor");
        ROUTE_MAPPINGS.put("活动", "activity");
        ROUTE_MAPPINGS.put("课程", "course");
        ROUTE_MAPPINGS.put("商城", "shop");
        ROUTE_MAPPINGS.put("购物", "shop");
        ROUTE_MAPPINGS.put("AI助手", "ai-chat");
        ROUTE_MAPPINGS.put("聊天", "ai-chat");
        ROUTE_MAPPINGS.put("个人中心", "profile");
        ROUTE_MAPPINGS.put("我的", "profile");
        ROUTE_MAPPINGS.put("订单", "orders");
        ROUTE_MAPPINGS.put("问答", "quiz");
        ROUTE_MAPPINGS.put("答题", "quiz");
    }
    
    @Override
    public String getName() {
        return "intent_parse";
    }
    
    @Override
    public String getDescription() {
        return "解析自然语言意图并返回要调用的工具";
    }
    
    @Override
    public String getCategory() {
        return "INTENT";
    }
    
    @Override
    public McpToolCallResponse execute(Map<String, Object> params, Long userId) {
        long startTime = System.currentTimeMillis();
        
        try {
            String text = (String) params.getOrDefault("text", "");
            
            if (text == null || text.isEmpty()) {
                return McpToolCallResponse.error("请提供要解析的文本");
            }
            
            log.info("[MCP] 解析意图: {}", text);
            
            // 解析意图
            ParsedIntent intent = parseIntent(text);
            
            Map<String, Object> data = new HashMap<>();
            data.put("originalText", text);
            data.put("intent", intent.type);
            data.put("tool", intent.tool);
            data.put("params", intent.params);
            data.put("confidence", intent.confidence);
            
            long duration = System.currentTimeMillis() - startTime;
            
            return McpToolCallResponse.builder()
                    .success(true)
                    .data(data)
                    .message("解析成功，意图类型: " + intent.type)
                    .tool(getName())
                    .duration(duration)
                    .build();
                    
        } catch (Exception e) {
            log.error("[MCP] 意图解析失败", e);
            return McpToolCallResponse.error("意图解析失败: " + e.getMessage());
        }
    }
    
    /**
     * 解析意图
     */
    private ParsedIntent parseIntent(String text) {
        ParsedIntent intent = new ParsedIntent();
        intent.confidence = 0.0;
        
        // 检查问答意图（最高优先级）
        if (containsAny(text, INTENT_KEYWORDS.get("question"))) {
            intent.type = "question";
            intent.tool = "ask_xuanmiao";
            intent.params = Map.of("question", text);
            intent.confidence = 0.95;
            return intent;
        }
        
        // 检查导航意图
        for (Map.Entry<String, String> entry : ROUTE_MAPPINGS.entrySet()) {
            if (text.contains(entry.getKey())) {
                intent.type = "navigation";
                intent.tool = "navigate_to";
                intent.params = Map.of("destination", entry.getValue());
                intent.confidence = 0.9;
                return intent;
            }
        }
        
        // 检查导航关键词
        if (containsAny(text, INTENT_KEYWORDS.get("navigation"))) {
            // 尝试提取目标页面
            for (Map.Entry<String, String> entry : ROUTE_MAPPINGS.entrySet()) {
                if (text.contains(entry.getKey())) {
                    intent.type = "navigation";
                    intent.tool = "navigate_to";
                    intent.params = Map.of("destination", entry.getValue());
                    intent.confidence = 0.85;
                    return intent;
                }
            }
        }
        
        // 检查搜索意图
        if (containsAny(text, INTENT_KEYWORDS.get("search"))) {
            String keyword = extractKeyword(text);
            intent.type = "search";
            intent.tool = "search_product";
            intent.params = Map.of("keyword", keyword);
            intent.confidence = 0.85;
            return intent;
        }
        
        // 检查购买意图
        if (containsAny(text, INTENT_KEYWORDS.get("buy"))) {
            String keyword = extractKeyword(text);
            intent.type = "purchase";
            intent.tool = "search_product";
            intent.params = Map.of("keyword", keyword, "purchase_intent", true);
            intent.confidence = 0.8;
            return intent;
        }
        
        // 默认返回未识别
        intent.type = "unknown";
        intent.tool = null;
        intent.params = Map.of();
        intent.confidence = 0.0;
        return intent;
    }
    
    /**
     * 检查文本是否包含任意关键词
     */
    private boolean containsAny(String text, List<String> keywords) {
        if (keywords == null || text == null) return false;
        for (String keyword : keywords) {
            if (text.contains(keyword)) return true;
        }
        return false;
    }
    
    /**
     * 提取关键词
     */
    private String extractKeyword(String text) {
        // 移除常见语气词和动词
        String[] prefixes = {"搜索", "查找", "找", "查询", "购买", "买", "帮我", "我想", "我要"};
        String keyword = text;
        for (String prefix : prefixes) {
            keyword = keyword.replace(prefix, "");
        }
        return keyword.trim();
    }
    
    /**
     * 解析的意图结果
     */
    private static class ParsedIntent {
        String type;
        String tool;
        Map<String, Object> params;
        double confidence;
    }
}
