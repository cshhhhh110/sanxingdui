package org.example.springboot.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.example.springboot.agent.dto.AgentAttachmentDTO;
import org.example.springboot.agent.dto.AgentRouteCommandDTO;
import org.example.springboot.agent.dto.AgentRouteResponseDTO;
import org.example.springboot.dto.command.AiChatAttachmentDTO;
import org.example.springboot.service.MultimodalContentService;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class AgentRouterService {

    private static final String ROUTER_PROMPT = """
            You are the unified Agent router for a Sanxingdui digital museum app.
            Choose exactly one route and return one JSON object only.

            Routes:
            1. TOOL_CALL: the user explicitly asks the app to do something that one enabled tool can complete.
            2. RAG: the question is about Sanxingdui, Jinsha, ancient Shu, relics, archaeology, exhibition content, or this project knowledge base.
            3. DIRECT_ANSWER: general chat, dates, simple common knowledge, or questions that do not need the local knowledge base.
            4. UNSUPPORTED: the request needs a capability that is not available.

            Enabled tools:
            %s

            Rules:
            - Chinese user input is normal. Understand it semantically.
            - "search" or "find" does not automatically mean product search. Use search_product only when the user clearly mentions shop, product, buying, merch, cultural creative product, or shopping.
            - If the user says "open shop and search X", choose search_product, not navigate_to. The tool must complete navigation and filtering.
            - If the user only asks to open a page without a search target, choose navigate_to.
            - Weather requests must use get_weather and extract city.
            - Date, weekday, and current time requests must use get_current_datetime.
            - Spacetime trail requests must use control_trail. Use open_artifact for a specific artifact, go_scene_one for map/first scene, go_artifact_list for artifact list, open_stage for 3D/stage, open_guide for guide narration, focus_graph for graph focus.
            - Use context.currentArtifact/currentArtifactId/currentPage/currentTrailNode/recentMessages to resolve follow-up pronouns like "it", "this artifact", "它", "这件", "这个".
            - Use context.knowledgeEntities and context.knowledgeRelations as lightweight museum knowledge hints. If they show Sanxingdui/Jinsha/ancient Shu/artifact relations, prefer RAG unless the user asks for an app operation.
            - Use context.activeGuideState/activeGuideRoutePlan/activeGuideFollowups as session-only guide hints. If the user asks to be guided through representative or important artifacts, choose TOOL_CALL with control_trail and open the first stop from activeGuideRoutePlan.
            - Follow-up requests like "还有类似的吗", "接着看", "下一个看什么" should use the current context and activeGuideFollowups; choose RAG for explanation, or TOOL_CALL control_trail when the user asks to open/view the next artifact.
            - If the user asks a follow-up about the current artifact or current trail node, choose RAG unless the request is clearly a tool operation.
            - If attachments are present and the user asks to summarize, explain, analyze, extract, translate, or answer from the uploaded file, choose DIRECT_ANSWER unless the user explicitly asks to search the knowledge base or operate the app.
            - Do not choose RAG only because an uploaded file mentions Sanxingdui, Jinsha, ancient Shu, archaeology, or relics. Uploaded-file tasks should first use attachmentContext.
            - For Sanxingdui/Jinsha/ancient Shu knowledge questions without uploaded-file focus, choose RAG unless the user explicitly asks for a tool action.
            - Topic words such as mystery, ritual, bronze, gold, or mask do not imply a guided visit. Questions like "Why does Sanxingdui feel mysterious?" and "What does the ritual pit mean?" must use RAG, not control_trail.
            - Create or execute a guided route only when the user expresses an explicit visit action or constraint, such as "guide me", "plan a route", "I only have 20 minutes", "this is my first visit", or a clear interest-route request.
            - For uploaded image/audio/video/document analysis, do not invent file content. If no tool is needed, choose DIRECT_ANSWER with a short message or empty message; the chat pipeline will analyze attachments.
            - DIRECT_ANSWER must include a concise Chinese final answer in "message". Keep it under 100 Chinese characters unless the user asks for detail.
            - TOOL_CALL, RAG, and UNSUPPORTED must not fabricate a knowledge answer in "message".
            - Do not choose tools that are not listed.

            JSON examples:
            {"route":"TOOL_CALL","tool":"search_product","arguments":{"keyword":"golden mask cultural product","quantity":1},"confidence":0.95,"reason":"shop product search"}
            {"route":"RAG","tool":null,"arguments":{},"confidence":0.95,"reason":"Sanxingdui knowledge question"}
            {"route":"DIRECT_ANSWER","tool":null,"arguments":{},"confidence":0.9,"reason":"general question","message":"This question can be answered directly."}
            {"route":"TOOL_CALL","tool":"get_weather","arguments":{"city":"Chengdu"},"confidence":0.98,"reason":"weather request"}
            {"route":"TOOL_CALL","tool":"get_current_datetime","arguments":{},"confidence":0.99,"reason":"current date/time request"}
            {"route":"TOOL_CALL","tool":"control_trail","arguments":{"action":"open_artifact","artifact_id":"HI-2025-002"},"confidence":0.98,"reason":"open artifact in trail"}
            {"route":"TOOL_CALL","tool":"control_trail","arguments":{"action":"open_artifact","artifact_id":"HI-2025-005"},"confidence":0.95,"reason":"guided representative artifact route first stop"}
            {"route":"UNSUPPORTED","tool":null,"arguments":{},"confidence":0.95,"reason":"missing logistics tool","requiredCapability":"logistics","message":"This capability is not available yet."}
            """;

    private final ChatClient routerClient;
    private final AgentRouteParser routeParser;
    private final AgentToolRegistry toolRegistry;
    private final ObjectMapper objectMapper;
    private final MultimodalContentService multimodalContentService;

    public AgentRouterService(
            OpenAiChatModel chatModel,
            AgentRouteParser routeParser,
            AgentToolRegistry toolRegistry,
            ObjectMapper objectMapper,
            MultimodalContentService multimodalContentService
    ) {
        this.routerClient = ChatClient.builder(chatModel).build();
        this.routeParser = routeParser;
        this.toolRegistry = toolRegistry;
        this.objectMapper = objectMapper;
        this.multimodalContentService = multimodalContentService;
    }

    public AgentRouteResponseDTO route(AgentRouteCommandDTO command) {
        long startedAt = System.currentTimeMillis();
        String attachmentContext = buildAttachmentContext(command);
        try {
            String output = routerClient.prompt()
                    .system(ROUTER_PROMPT.formatted(toolRegistry.buildPromptToolList()))
                    .user(buildUserPayload(command, attachmentContext))
                    .call()
                    .content();
            AgentRouteResponseDTO decision = routeParser.parse(output);
            decision.setAttachmentContext(attachmentContext);
            logRouteDecision(command, decision, System.currentTimeMillis() - startedAt, "ROUTED");
            return decision;
        } catch (Exception exception) {
            log.warn("[Agent Router] model call failed, falling back to direct answer: {}", exception.getMessage());
            AgentRouteResponseDTO fallback = buildSafeFallback(command, attachmentContext);
            logRouteDecision(command, fallback, System.currentTimeMillis() - startedAt, "FALLBACK");
            return fallback;
        }
    }

    private void logRouteDecision(
            AgentRouteCommandDTO command,
            AgentRouteResponseDTO decision,
            long durationMs,
            String status
    ) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("route", decision.getRoute());
        payload.put("toolName", decision.getTool());
        payload.put("arguments", decision.getArguments());
        payload.put("status", status);
        payload.put("duration", durationMs);
        payload.put("confidence", decision.getConfidence());
        payload.put("surface", command.getContext() == null ? "" : command.getContext().getOrDefault("surface", ""));
        payload.put("result", Map.of(
                "requiredCapability", decision.getRequiredCapability() == null ? "" : decision.getRequiredCapability(),
                "message", decision.getMessage() == null ? "" : decision.getMessage()
        ));
        log.info("[Agent Router] decision={}", payload);
    }

    private String buildUserPayload(AgentRouteCommandDTO command, String attachmentContext) throws Exception {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("message", command.getMessage().trim());
        payload.put("context", command.getContext() == null ? Map.of() : command.getContext());
        payload.put("attachments", command.getAttachments() == null ? List.of() : command.getAttachments());
        payload.put("attachmentContext", attachmentContext == null ? "" : attachmentContext);
        return objectMapper.writeValueAsString(payload);
    }

    private String buildAttachmentContext(AgentRouteCommandDTO command) {
        List<AgentAttachmentDTO> attachments = command.getAttachments();
        if (attachments == null || attachments.isEmpty()) {
            return "";
        }

        try {
            List<AiChatAttachmentDTO> aiAttachments = new ArrayList<>();
            for (AgentAttachmentDTO attachment : attachments) {
                AiChatAttachmentDTO aiAttachment = toAiChatAttachment(attachment);
                if (aiAttachment != null) {
                    aiAttachments.add(aiAttachment);
                }
            }
            if (aiAttachments.isEmpty()) {
                return "";
            }

            MultimodalContentService.MultimodalPrompt prompt =
                    multimodalContentService.buildPrompt(command.getMessage(), aiAttachments);
            return clipAttachmentContext(prompt.getModelText());
        } catch (Exception error) {
            log.warn("[Agent Router] attachment context build failed: {}", error.getMessage());
            return buildAttachmentMetadataFallback(attachments);
        }
    }

    private AiChatAttachmentDTO toAiChatAttachment(AgentAttachmentDTO attachment) {
        if (attachment == null || attachment.getFileId() == null || attachment.getFileId().isBlank()) {
            return null;
        }
        try {
            AiChatAttachmentDTO aiAttachment = new AiChatAttachmentDTO();
            aiAttachment.setFileId(Long.parseLong(attachment.getFileId()));
            aiAttachment.setFileName(attachment.getFileName());
            aiAttachment.setMediaType(attachment.getMediaType());
            aiAttachment.setMimeType(attachment.getMimeType());
            aiAttachment.setFilePath(attachment.getFilePath());
            aiAttachment.setFileSize(attachment.getSize());
            return aiAttachment;
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private String buildAttachmentMetadataFallback(List<AgentAttachmentDTO> attachments) {
        StringBuilder summary = new StringBuilder("Uploaded attachments metadata:\n");
        for (AgentAttachmentDTO attachment : attachments) {
            summary.append("- ")
                    .append(attachment.getFileName() == null ? "unknown" : attachment.getFileName())
                    .append(" type=")
                    .append(attachment.getMediaType() == null ? "FILE" : attachment.getMediaType())
                    .append(" size=")
                    .append(attachment.getSize())
                    .append('\n');
        }
        return clipAttachmentContext(summary.toString());
    }

    private String clipAttachmentContext(String context) {
        if (context == null) {
            return "";
        }
        String normalized = context.trim();
        return normalized.length() <= 6000 ? normalized : normalized.substring(0, 6000);
    }

    private AgentRouteResponseDTO buildSafeFallback(AgentRouteCommandDTO command, String attachmentContext) {
        String message = command.getMessage() == null ? "" : command.getMessage().trim();
        if (isShopSearchRequest(message)) {
            Map<String, Object> arguments = new LinkedHashMap<>();
            arguments.put("keyword", extractProductKeyword(message));
            arguments.put("quantity", 1);
            return AgentRouteResponseDTO.builder()
                    .route(AgentRoute.TOOL_CALL)
                    .tool("search_product")
                    .arguments(arguments)
                    .confidence(0.6)
                    .reason("Router model unavailable; safe fallback for shop search request")
                    .attachmentContext(attachmentContext)
                    .build();
        }

        if (isGuidedVisitRequest(message)) {
            Map<String, Object> arguments = new LinkedHashMap<>();
            arguments.put("action", "open_artifact");
            arguments.put("artifact_id", extractGuideFirstArtifactId(command));
            return AgentRouteResponseDTO.builder()
                    .route(AgentRoute.TOOL_CALL)
                    .tool("control_trail")
                    .arguments(arguments)
                    .confidence(0.65)
                    .reason("Router model unavailable; safe fallback for active guide route")
                    .attachmentContext(attachmentContext)
                    .build();
        }

        if (isTrailRequest(message)) {
            Map<String, Object> arguments = new LinkedHashMap<>();
            arguments.put("action", "open_artifact");
            arguments.put("artifact_id", extractTrailArtifactId(message));
            return AgentRouteResponseDTO.builder()
                    .route(AgentRoute.TOOL_CALL)
                    .tool("control_trail")
                    .arguments(arguments)
                    .confidence(0.6)
                    .reason("Router model unavailable; safe fallback for spacetime trail request")
                    .attachmentContext(attachmentContext)
                    .build();
        }

        if (message.contains("\u5929\u6c14")) {
            Map<String, Object> arguments = new LinkedHashMap<>();
            arguments.put("city", extractWeatherCity(message));
            return AgentRouteResponseDTO.builder()
                    .route(AgentRoute.TOOL_CALL)
                    .tool("get_weather")
                    .arguments(arguments)
                    .confidence(0.6)
                    .reason("Router model unavailable; safe fallback for weather request")
                    .attachmentContext(attachmentContext)
                    .build();
        }

        if (containsAny(message,
                "\u4eca\u5929\u51e0\u53f7",
                "\u4eca\u5929\u662f\u51e0\u53f7",
                "\u73b0\u5728\u51e0\u70b9",
                "\u661f\u671f",
                "\u65e5\u671f",
                "\u65f6\u95f4")) {
            return AgentRouteResponseDTO.builder()
                    .route(AgentRoute.TOOL_CALL)
                    .tool("get_current_datetime")
                    .arguments(Map.of())
                    .confidence(0.6)
                    .reason("Router model unavailable; safe fallback for date/time request")
                    .attachmentContext(attachmentContext)
                    .build();
        }

        if (isNavigationRequest(message)) {
            Map<String, Object> arguments = new LinkedHashMap<>();
            arguments.put("destination", extractDestination(message));
            return AgentRouteResponseDTO.builder()
                    .route(AgentRoute.TOOL_CALL)
                    .tool("navigate_to")
                    .arguments(arguments)
                    .confidence(0.55)
                    .reason("Router model unavailable; safe fallback for navigation request")
                    .attachmentContext(attachmentContext)
                    .build();
        }

        if ((isHeritageKnowledgeQuestion(message) || isContextualArtifactQuestion(command)) && attachmentContext.isBlank()) {
            return AgentRouteResponseDTO.builder()
                    .route(AgentRoute.RAG)
                    .confidence(0.55)
                    .reason("Router model unavailable; safe fallback for heritage/contextual knowledge question")
                    .message("")
                    .attachmentContext(attachmentContext)
                    .build();
        }

        return AgentRouteResponseDTO.builder()
                .route(AgentRoute.DIRECT_ANSWER)
                .confidence(0)
                .reason("Router model unavailable; safely fell back to direct answer")
                .message("")
                .attachmentContext(attachmentContext)
                .build();
    }

    private boolean containsAny(String value, String... keywords) {
        for (String keyword : keywords) {
            if (value.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private boolean isShopSearchRequest(String message) {
        boolean shopIntent = containsAny(message,
                "\u5546\u57ce",
                "\u6587\u521b",
                "\u5546\u54c1",
                "\u4e70",
                "\u8d2d\u4e70",
                "\u4e0b\u5355");
        boolean searchIntent = containsAny(message,
                "\u641c\u7d22",
                "\u67e5\u627e",
                "\u627e",
                "\u6253\u5f00");
        return shopIntent && searchIntent;
    }

    private String extractProductKeyword(String message) {
        String keyword = message
                .replace("\u6253\u5f00", "")
                .replace("\u5546\u57ce", "")
                .replace("\u641c\u7d22", "")
                .replace("\u67e5\u627e", "")
                .replace("\u5e2e\u6211", "")
                .replace("\u8bf7", "")
                .replace("\u4e00\u4e0b", "")
                .replace("\u6587\u521b\u4ea7\u54c1", "")
                .replace("\u6587\u521b", "")
                .replace("\u5546\u54c1", "")
                .replaceAll("[\\p{Punct}\\s]+", "")
                .trim();
        return keyword.isBlank() ? "\u91d1\u9762\u5177" : keyword;
    }

    private boolean isTrailRequest(String message) {
        return containsAny(message, "\u65f6\u7a7a\u5c55\u7ebf", "\u5c55\u7ebf", "\u65f6\u7a7a", "\u8def\u7ebf")
                && containsAny(message, "\u6253\u5f00", "\u8fdb\u5165", "\u67e5\u770b", "\u91d1\u9762\u5177", "\u9752\u94dc", "\u795e\u6811", "\u91d1\u6756", "\u5927\u7acb\u4eba");
    }

    private boolean isGuidedVisitRequest(String message) {
        return containsAny(message,
                "\u5e26\u6211",
                "\u9886\u6211",
                "\u5bfc\u89c8",
                "\u53c2\u89c2\u8def\u7ebf",
                "\u4ee3\u8868\u6027\u6587\u7269",
                "\u91cd\u8981\u6587\u7269",
                "\u6838\u5fc3\u6587\u7269",
                "\u6700\u91cd\u8981",
                "\u770b\u770b\u4e09\u661f\u5806")
                && containsAny(message, "\u770b", "\u770b\u770b", "\u53c2\u89c2", "\u6587\u7269", "\u4e09\u661f\u5806", "\u8def\u7ebf");
    }

    @SuppressWarnings("unchecked")
    private String extractGuideFirstArtifactId(AgentRouteCommandDTO command) {
        if (command.getContext() != null) {
            Object routePlan = command.getContext().get("activeGuideRoutePlan");
            if (routePlan instanceof Map<?, ?> routePlanMap) {
                Object stops = routePlanMap.get("stops");
                if (stops instanceof List<?> stopList && !stopList.isEmpty() && stopList.get(0) instanceof Map<?, ?> firstStop) {
                    Object artifactId = firstStop.get("artifactId");
                    if (artifactId != null && !artifactId.toString().isBlank()) {
                        return artifactId.toString();
                    }
                }
            }
        }
        return "HI-2025-005";
    }

    private String extractTrailArtifactId(String message) {
        if (containsAny(message, "\u7eb5\u76ee", "\u9752\u94dc\u9762\u5177", "\u9752\u94dc\u7eb5\u76ee")) {
            return "HI-2025-003";
        }
        if (message.contains("\u91d1\u6756")) {
            return "HI-2025-004";
        }
        if (containsAny(message, "\u5927\u7acb\u4eba", "\u7acb\u4eba")) {
            return "HI-2025-005";
        }
        if (message.contains("\u795e\u6811")) {
            return "HI-2025-006";
        }
        return "HI-2025-002";
    }

    private boolean isNavigationRequest(String message) {
        return containsAny(message, "\u6253\u5f00", "\u8fdb\u5165", "\u8df3\u8f6c\u5230")
                && containsAny(message, "\u9996\u9875", "\u6587\u7269", "\u4f20\u627f\u4eba", "\u6d3b\u52a8", "\u8bfe\u7a0b", "\u5546\u57ce", "AI\u6587\u535a\u52a9\u624b", "\u95ee\u7b54", "3D", "\u65f6\u7a7a\u5c55\u7ebf");
    }

    private String extractDestination(String message) {
        if (containsAny(message, "AI\u6587\u535a\u52a9\u624b", "\u95ee\u7b54", "\u5bf9\u8bdd")) return "ai-chat";
        if (message.contains("\u5546\u57ce")) return "shop";
        if (containsAny(message, "\u65f6\u7a7a\u5c55\u7ebf", "\u65f6\u7a7a")) return "trail";
        if (message.contains("3D")) return "3dlist";
        if (message.contains("\u8bfe\u7a0b")) return "course";
        if (message.contains("\u6d3b\u52a8")) return "activity";
        if (message.contains("\u4f20\u627f\u4eba")) return "inheritor";
        if (message.contains("\u6587\u7269")) return "heritage";
        return "home";
    }

    private boolean isHeritageKnowledgeQuestion(String message) {
        return containsAny(message,
                "\u4e09\u661f\u5806",
                "\u91d1\u6c99",
                "\u53e4\u8700",
                "\u796d\u7940\u5751",
                "\u9752\u94dc",
                "\u795e\u6811",
                "\u9762\u5177",
                "\u91d1\u6756",
                "\u5927\u7acb\u4eba",
                "\u6587\u7269",
                "\u9057\u5740",
                "\u8003\u53e4",
                "\u535a\u7269\u9986");
    }

    private boolean isContextualArtifactQuestion(AgentRouteCommandDTO command) {
        if (command.getContext() == null || command.getContext().isEmpty()) {
            return false;
        }
        Object artifact = command.getContext().getOrDefault("currentArtifact", "");
        Object artifactId = command.getContext().getOrDefault("currentArtifactId", "");
        boolean hasArtifact = artifact != null && !artifact.toString().isBlank()
                || artifactId != null && !artifactId.toString().isBlank();
        if (!hasArtifact) {
            return false;
        }
        String message = command.getMessage() == null ? "" : command.getMessage().trim();
        return containsAny(message,
                "\u5b83",
                "\u8fd9\u4ef6",
                "\u8fd9\u4e2a",
                "\u8be5\u6587\u7269",
                "\u6750\u8d28",
                "\u5386\u53f2\u610f\u4e49",
                "\u6709\u4ec0\u4e48\u5173\u7cfb",
                "\u7279\u522b",
                "\u7279\u70b9",
                "\u4ecb\u7ecd");
    }

    private String extractWeatherCity(String message) {
        int weatherIndex = message.indexOf("\u5929\u6c14");
        String beforeWeather = weatherIndex > 0 ? message.substring(0, weatherIndex) : "";
        String city = beforeWeather
                .replace("\u4eca\u5929", "")
                .replace("\u660e\u5929", "")
                .replace("\u8bf7\u95ee", "")
                .replace("\u5e2e\u6211", "")
                .replace("\u67e5\u627e", "")
                .replace("\u67e5", "")
                .replace("\u770b", "")
                .replace("\u4e00\u4e0b", "")
                .replaceAll("[^\\p{IsHan}A-Za-z\\s-]", "")
                .trim();
        return city.isBlank() ? "\u6210\u90fd" : city;
    }
}
