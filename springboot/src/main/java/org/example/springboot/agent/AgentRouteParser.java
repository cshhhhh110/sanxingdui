package org.example.springboot.agent;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.springboot.agent.dto.AgentRouteResponseDTO;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class AgentRouteParser {

    private static final double MIN_TOOL_CONFIDENCE = 0.65;

    private final ObjectMapper objectMapper;
    private final AgentToolRegistry toolRegistry;

    public AgentRouteResponseDTO parse(String modelOutput) {
        try {
            JsonNode root = objectMapper.readTree(extractJson(modelOutput));
            AgentRoute route = parseRoute(root.path("route").asText());
            double confidence = root.path("confidence").asDouble(0.5);
            String reason = root.path("reason").asText("");

            if (route == AgentRoute.TOOL_CALL) {
                return parseToolCall(root, confidence, reason);
            }
            if (route == AgentRoute.UNSUPPORTED) {
                return AgentRouteResponseDTO.unsupported(
                        confidence,
                        reason,
                        root.path("requiredCapability").asText("unknown"),
                        root.path("message").asText("当前暂不支持这项能力。")
                );
            }
            AgentRouteResponseDTO response = AgentRouteResponseDTO.route(route, confidence, reason);
            if (route == AgentRoute.DIRECT_ANSWER) {
                response.setMessage(clipMessage(root.path("message").asText("")));
            }
            return response;
        } catch (Exception ignored) {
            return AgentRouteResponseDTO.route(
                    AgentRoute.DIRECT_ANSWER,
                    0,
                    "Router output parse failed; safely fell back to direct answer"
            );
        }
    }

    private AgentRouteResponseDTO parseToolCall(JsonNode root, double confidence, String reason) {
        String tool = root.path("tool").asText("");
        if (!toolRegistry.isEnabled(tool) || confidence < MIN_TOOL_CONFIDENCE) {
            return AgentRouteResponseDTO.unsupported(
                    confidence,
                    "Tool is disabled or route confidence is too low",
                    "tool:" + tool,
                    "这个操作目前还不能安全执行。"
            );
        }

        Map<String, Object> arguments = root.path("arguments").isObject()
                ? objectMapper.convertValue(root.path("arguments"), new TypeReference<>() { })
                : new HashMap<>();
        Map<String, Object> normalized = toolRegistry.normalizeArguments(tool, arguments);
        if (normalized == null) {
            return AgentRouteResponseDTO.unsupported(
                    confidence,
                    "Tool arguments are incomplete or invalid",
                    "tool_arguments:" + tool,
                    "我还缺少执行这个操作所需的信息。"
            );
        }

        return AgentRouteResponseDTO.builder()
                .route(AgentRoute.TOOL_CALL)
                .tool(tool)
                .arguments(normalized)
                .confidence(confidence)
                .reason(reason)
                .build();
    }

    private AgentRoute parseRoute(String value) {
        try {
            return AgentRoute.valueOf(value.trim().toUpperCase());
        } catch (Exception ignored) {
            return AgentRoute.DIRECT_ANSWER;
        }
    }

    private String clipMessage(String message) {
        String normalized = message == null ? "" : message.trim();
        return normalized.length() <= 4_000 ? normalized : normalized.substring(0, 4_000);
    }

    private String extractJson(String output) {
        if (output == null) {
            return "";
        }
        int start = output.indexOf('{');
        int end = output.lastIndexOf('}');
        return start >= 0 && end > start ? output.substring(start, end + 1) : output.trim();
    }
}
