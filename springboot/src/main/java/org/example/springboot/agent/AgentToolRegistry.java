package org.example.springboot.agent;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
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
        register(tool(
                "search_product",
                "Search shop products. Required: keyword. Optional: quantity.",
                "shop",
                objectSchema(Map.of(
                        "keyword", stringParam("Shop product keyword."),
                        "quantity", numberParam("Optional quantity, 1-99.")
                ), "keyword")
        ));
        register(tool(
                "navigate_to",
                "Open a public page. destination enum: home, heritage, inheritor, activity, course, shop, ai-chat, 3dlist, trail, quiz.",
                "navigation",
                objectSchema(Map.of(
                        "destination", enumParam("Public page destination.", PUBLIC_DESTINATIONS)
                ), "destination")
        ));
        register(tool("view_cart", "Open the current user's shopping cart.", "shop", objectSchema(Map.of())));
        register(tool("view_orders", "Open the current user's orders.", "shop", objectSchema(Map.of())));
        register(tool(
                "search_heritage",
                "Search heritage artifacts. Required: keyword.",
                "heritage",
                objectSchema(Map.of(
                        "keyword", stringParam("Heritage search keyword.")
                ), "keyword")
        ));
        register(tool(
                "open_artifact_detail",
                "Open artifact detail page. Required: artifact_id. Optional: auto_explain.",
                "heritage",
                objectSchema(Map.of(
                        "artifact_id", stringParam("Artifact identifier."),
                        "auto_explain", booleanParam("Whether to auto-start AI explanation.")
                ), "artifact_id")
        ));
        register(tool(
                "play_voice_intro",
                "Play voice introduction for an artifact. Required: artifact_id. Optional: voice_type.",
                "audio",
                objectSchema(Map.of(
                        "artifact_id", stringParam("Artifact identifier."),
                        "voice_type", enumParam("Voice type.", VOICE_TYPES)
                ), "artifact_id")
        ));
        register(tool(
                "start_quiz",
                "Start a knowledge quiz. Optional: topic and difficulty.",
                "quiz",
                objectSchema(Map.of(
                        "topic", enumParam("Quiz topic.", QUIZ_TOPICS),
                        "difficulty", enumParam("Quiz difficulty.", QUIZ_DIFFICULTIES)
                ))
        ));
        register(tool(
                "search_activity",
                "Search cultural activities. Required: keyword.",
                "activity",
                objectSchema(Map.of("keyword", stringParam("Activity keyword.")), "keyword")
        ));
        register(tool("view_courses", "Open the online course page.", "course", objectSchema(Map.of())));
        register(tool("get_user_location", "Get the user's current city. No arguments.", "info", objectSchema(Map.of())));
        register(tool(
                "get_weather",
                "Get real-time weather for a city. Required: city. Use only for weather questions.",
                "info",
                objectSchema(Map.of(
                        "city", stringParam("City name.")
                ), "city")
        ));
        register(tool(
                "get_current_datetime",
                "Get current Beijing date, weekday, and time. No arguments.",
                "info",
                objectSchema(Map.<String, Object>of())
        ));
        register(tool(
                "control_trail",
                "Control spacetime trail. action enum: open_artifact, select_pit, go_scene_one, go_artifact_list, open_stage, open_guide, focus_graph, start_quiz. Artifact mapping: golden mask=HI-2025-002, bronze eye mask=HI-2025-003, golden staff=HI-2025-004, standing figure=HI-2025-005, bronze tree=HI-2025-006. open_artifact requires artifact_id. select_pit requires pit_code. focus_graph may include graph_target.",
                "trail",
                objectSchema(Map.of(
                        "action", enumParam("Trail action.", TRAIL_ACTIONS),
                        "artifact_id", stringParam("Artifact identifier for open_artifact."),
                        "pit_code", enumParam("Pit code for select_pit.", TRAIL_PITS),
                        "graph_target", enumParam("Graph focus target.", TRAIL_GRAPH_TARGETS)
                ), "action")
        ));
    }

    public boolean isEnabled(String toolName) {
        return enabledTools.containsKey(toolName);
    }

    public Map<String, ToolDefinition> getEnabledTools() {
        return new LinkedHashMap<>(enabledTools);
    }

    public String buildPromptToolList() {
        StringBuilder prompt = new StringBuilder();
        int index = 1;
        for (ToolDefinition tool : enabledTools.values()) {
            prompt.append(index++)
                    .append(". ")
                    .append(tool.name())
                    .append(": ")
                    .append(tool.description())
                    .append(" Risk=")
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
            case "view_cart", "view_orders", "view_courses", "get_user_location", "get_current_datetime", "view_profile" -> {
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

    private ToolDefinition tool(String name, String description, String category, Map<String, Object> inputSchema) {
        return new ToolDefinition(
                name,
                description,
                RiskLevel.SAFE,
                category,
                inputSchema,
                objectSchema(Map.of(
                        "success", booleanParam("Whether the tool completed successfully."),
                        "message", stringParam("Human-readable execution result.")
                ))
        );
    }

    private Map<String, Object> objectSchema(Map<String, Object> properties, String... required) {
        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        schema.put("properties", properties);
        schema.put("required", List.of(required));
        return schema;
    }

    private Map<String, Object> stringParam(String description) {
        return Map.of("type", "string", "description", description);
    }

    private Map<String, Object> numberParam(String description) {
        return Map.of("type", "number", "description", description);
    }

    private Map<String, Object> booleanParam(String description) {
        return Map.of("type", "boolean", "description", description);
    }

    private Map<String, Object> enumParam(String description, Set<String> values) {
        return Map.of(
                "type", "string",
                "description", description,
                "enum", values.stream().sorted().toList()
        );
    }

    public record ToolDefinition(
            String name,
            String description,
            RiskLevel riskLevel,
            String category,
            Map<String, Object> inputSchema,
            Map<String, Object> outputSchema
    ) {
    }

    public enum RiskLevel {
        SAFE,
        CONFIRMATION_REQUIRED,
        DISABLED
    }
}
