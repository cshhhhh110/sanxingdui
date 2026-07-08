package org.example.springboot.agent;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@Component
public class AgentToolRegistry {

    private static final Set<String> PUBLIC_DESTINATIONS = Set.of(
            "home", "heritage", "inheritor", "activity", "course",
            "shop", "ai-chat", "3dlist", "trail", "quiz"
    );
    private static final Set<String> QUIZ_TOPICS = Set.of("general", "artifact", "history", "craft");
    private static final Set<String> QUIZ_DIFFICULTIES = Set.of("easy", "medium", "hard");
    private static final Set<String> VOICE_TYPES = Set.of("normal", "warm", "lively");
    private static final Set<String> TRAIL_ACTIONS = Set.of(
            "open_artifact", "select_pit", "go_scene_one", "go_artifact_list",
            "open_stage", "open_guide", "focus_graph", "start_quiz"
    );
    private static final Set<String> TRAIL_ARTIFACT_IDS = Set.of(
            "HI-2025-002", "HI-2025-003", "HI-2025-004", "HI-2025-005", "HI-2025-006"
    );
    private static final Set<String> TRAIL_PITS = Set.of("K1", "K2", "K3", "K4", "K5", "K6", "K7", "K8");
    private static final Set<String> TRAIL_GRAPH_TARGETS = Set.of(
            "craft", "site", "era", "material", "motif", "ritual", "meaning", "artifact"
    );

    private final Map<String, ToolDefinition> enabledTools = new LinkedHashMap<>();

    public AgentToolRegistry() {
        register(new ToolDefinition(
                "search_product",
                "搜索商城商品，keyword必填，quantity可选",
                RiskLevel.SAFE
        ));
        register(new ToolDefinition(
                "navigate_to",
                "打开公开页面，destination可选home/heritage/inheritor/activity/course/shop/ai-chat/3dlist/trail/quiz",
                RiskLevel.SAFE
        ));
        register(new ToolDefinition("view_cart", "查看当前用户购物车，无参数", RiskLevel.SAFE));
        register(new ToolDefinition("view_orders", "查看当前用户订单，无参数", RiskLevel.SAFE));
        register(new ToolDefinition("search_heritage", "搜索文物，keyword必填", RiskLevel.SAFE));
        register(new ToolDefinition("open_artifact_detail", "打开文物详情，artifact_id必填", RiskLevel.SAFE));
        register(new ToolDefinition("play_voice_intro", "播放当前文物语音介绍，artifact_id必填", RiskLevel.SAFE));
        register(new ToolDefinition("start_quiz", "打开知识问答，可选topic和difficulty", RiskLevel.SAFE));
        register(new ToolDefinition("search_activity", "搜索活动，keyword必填", RiskLevel.SAFE));
        register(new ToolDefinition("view_courses", "打开在线课程页面，无参数", RiskLevel.SAFE));
        register(new ToolDefinition("get_weather", "查询城市实时天气和今日预报，city必填；仅天气问题使用", RiskLevel.SAFE));
        register(new ToolDefinition("get_current_datetime", "查询当前北京时间和日期，无参数", RiskLevel.SAFE));
        register(new ToolDefinition(
                "control_trail",
                "控制时空展线；action可选open_artifact/select_pit/go_scene_one/go_artifact_list/open_stage/open_guide/focus_graph/start_quiz。文物映射：金面具=HI-2025-002，纵目面具=HI-2025-003，金杖=HI-2025-004，大立人=HI-2025-005，神树=HI-2025-006。open_artifact需artifact_id，select_pit需pit_code，focus_graph可选graph_target",
                RiskLevel.SAFE
        ));
        register(new ToolDefinition("view_profile", "打开已登录用户的个人中心，无参数", RiskLevel.SAFE));
    }

    public boolean isEnabled(String toolName) {
        return enabledTools.containsKey(toolName);
    }

    public String buildPromptToolList() {
        StringBuilder prompt = new StringBuilder();
        int index = 1;
        for (ToolDefinition tool : enabledTools.values()) {
            prompt.append(index++)
                    .append(". ")
                    .append(tool.name())
                    .append("：")
                    .append(tool.description())
                    .append("。风险级别=")
                    .append(tool.riskLevel())
                    .append('\n');
        }
        return prompt.toString();
    }

    public Map<String, Object> normalizeArguments(String tool, Map<String, Object> arguments) {
        if (!isEnabled(tool)) {
            return null;
        }

        Map<String, Object> normalized = new HashMap<>();
        switch (tool) {
            case "navigate_to" -> {
                String destination = normalizedString(arguments.get("destination"));
                if (!PUBLIC_DESTINATIONS.contains(destination)) {
                    return null;
                }
                normalized.put("destination", destination);
            }
            case "view_cart", "view_orders", "view_courses", "get_current_datetime", "view_profile" -> {
                return normalized;
            }
            case "search_product", "search_heritage", "search_activity" -> {
                String keyword = normalizedString(arguments.get("keyword"));
                if (keyword.isEmpty()) {
                    return null;
                }
                normalized.put("keyword", keyword);
                if ("search_product".equals(tool)) {
                    Object quantityValue = arguments.get("quantity");
                    if (quantityValue instanceof Number number) {
                        normalized.put("quantity", Math.max(1, Math.min(number.intValue(), 99)));
                    }
                }
            }
            case "open_artifact_detail" -> {
                String artifactId = normalizedIdentifier(arguments.get("artifact_id"));
                if (artifactId.isEmpty()) return null;
                normalized.put("artifact_id", artifactId);
                normalized.put("auto_explain", !Boolean.FALSE.equals(arguments.get("auto_explain")));
            }
            case "play_voice_intro" -> {
                String artifactId = normalizedIdentifier(arguments.get("artifact_id"));
                if (artifactId.isEmpty()) return null;
                String voiceType = normalizedString(arguments.get("voice_type"));
                normalized.put("artifact_id", artifactId);
                normalized.put("voice_type", VOICE_TYPES.contains(voiceType) ? voiceType : "normal");
            }
            case "start_quiz" -> {
                String topic = normalizedString(arguments.get("topic"));
                String difficulty = normalizedString(arguments.get("difficulty"));
                normalized.put("topic", QUIZ_TOPICS.contains(topic) ? topic : "general");
                normalized.put("difficulty", QUIZ_DIFFICULTIES.contains(difficulty) ? difficulty : "medium");
            }
            case "get_weather" -> {
                String city = normalizedString(arguments.get("city"));
                if (city.length() < 2 || city.length() > 50) return null;
                normalized.put("city", city);
            }
            case "control_trail" -> {
                String action = normalizedString(arguments.get("action"));
                if (!TRAIL_ACTIONS.contains(action)) return null;
                normalized.put("action", action);
                if ("open_artifact".equals(action)) {
                    String artifactId = normalizedIdentifier(arguments.get("artifact_id"));
                    if (!TRAIL_ARTIFACT_IDS.contains(artifactId)) return null;
                    normalized.put("artifact_id", artifactId);
                }
                if ("select_pit".equals(action)) {
                    String pitCode = normalizedString(arguments.get("pit_code")).toUpperCase();
                    if (!TRAIL_PITS.contains(pitCode)) return null;
                    normalized.put("pit_code", pitCode);
                }
                if ("focus_graph".equals(action)) {
                    String graphTarget = normalizedString(arguments.get("graph_target"));
                    if (!graphTarget.isEmpty() && !TRAIL_GRAPH_TARGETS.contains(graphTarget)) return null;
                    if (!graphTarget.isEmpty()) normalized.put("graph_target", graphTarget);
                }
            }
            default -> {
                return null;
            }
        }
        return normalized;
    }

    private String normalizedString(Object value) {
        String normalized = String.valueOf(value == null ? "" : value).trim();
        if (normalized.length() > 100 || "null".equalsIgnoreCase(normalized)) {
            return "";
        }
        return normalized;
    }

    private String normalizedIdentifier(Object value) {
        String identifier = normalizedString(value);
        return identifier.matches("[A-Za-z0-9_-]{1,100}") ? identifier : "";
    }

    private void register(ToolDefinition definition) {
        enabledTools.put(definition.name(), definition);
    }

    public record ToolDefinition(String name, String description, RiskLevel riskLevel) {
    }

    public enum RiskLevel {
        SAFE,
        CONFIRMATION_REQUIRED,
        DISABLED
    }
}
