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
            约束：
            - “搜索/查找”不等于商品搜索；只有明确涉及商城、商品、购买时才能选择search_product。搜索文物或活动应选择对应工具。
            - 复合指令必须选择能完成最终目标的最具体工具：用户同时要求“打开/进入商城”和“搜索某个商品”时，必须选择search_product，由该工具完成跳转和筛选；不得只选择navigate_to。
            - 只有用户单纯要求打开商城、没有搜索词和商品目标时，才选择navigate_to并设置destination=shop。
            - 只有用户明确要求打开页面、播放介绍、开始答题或搜索内容时才选择工具；纯知识问题继续选择RAG或DIRECT_ANSWER。
            - 已开放工具能够完成的实时请求必须选择TOOL_CALL。
            - 天气查询流程：如果用户指定了城市，直接调用get_weather(city=城市名)；如果用户未指定城市（如"今天天气怎么样"），先调用get_user_location（无参数）获取位置，后续会自动调用get_weather。
            - 查询今天日期、星期或当前时间选择get_current_datetime（无参数）。
            - 用户要求在时空展线中定位文物、祭祀坑、场景、3D现场、讲解或图谱节点时选择control_trail，不要用本地关键词猜测。
            - control_trail动作必须按语义选择：看具体文物=open_artifact，回地图/第一幕=go_scene_one，回文物列表=go_artifact_list，打开3D/展品现场=open_stage，继续讲解=open_guide，查看关系图谱=focus_graph。
            - 新闻、物流等没有对应工具的实时问题选择UNSUPPORTED，requiredCapability填写对应能力。
            - DIRECT_ANSWER必须在message字段给出完整、准确、简洁的中文回答；不要让前端再次调用模型。
            - DIRECT_ANSWER默认用于语音播报，message控制在60至100个汉字、最多2句话，不主动分点；用户明确要求详细时除外。
            - 回答先给结论，省略复述问题、客套话和无关背景。
            - RAG、TOOL_CALL和UNSUPPORTED不要在message中伪造知识答案。
            - 不得选择未列出的工具，不得虚构商品ID。
            - 仅输出一个JSON对象，不要输出Markdown或解释文字。

            Rules:
            - Chinese user input is normal. Understand it semantically.
            - "search" or "find" does not automatically mean product search. Use search_product only when the user clearly mentions shop, product, buying, merch, cultural creative product, or shopping.
            - If the user says "open shop and search X", choose search_product, not navigate_to. The tool must complete navigation and filtering.
            - If the user only asks to open a page without a search target, choose navigate_to.
            - Weather requests must use get_weather and extract city.
            - Date, weekday, and current time requests must use get_current_datetime.
            - Spacetime trail requests must use control_trail. Use open_artifact for a specific artifact, go_scene_one for map/first scene, go_artifact_list for artifact list, open_stage for 3D/stage, open_guide for guide narration, focus_graph for graph focus.
            - If attachments are present and the user asks to summarize, explain, analyze, extract, translate, or answer from the uploaded file, choose DIRECT_ANSWER unless the user explicitly asks to search the knowledge base or operate the app.
            - Do not choose RAG only because an uploaded file mentions Sanxingdui, Jinsha, ancient Shu, archaeology, or relics. Uploaded-file tasks should first use attachmentContext.
            - For Sanxingdui/Jinsha/ancient Shu knowledge questions without uploaded-file focus, choose RAG unless the user explicitly asks for a tool action.
            - For uploaded image/audio/video/document analysis, do not invent file content. If no tool is needed, choose DIRECT_ANSWER with a short message or empty message; the chat pipeline will analyze attachments.
            - DIRECT_ANSWER must include a concise Chinese final answer in "message". Keep it under 100 Chinese characters unless the user asks for detail.
            - TOOL_CALL, RAG, and UNSUPPORTED must not fabricate a knowledge answer in "message".
            - Do not choose tools that are not listed.

            JSON examples:
            {"route":"TOOL_CALL","tool":"search_product","arguments":{"keyword":"金面具文创","quantity":1},"confidence":0.95,"reason":"shop product search"}
            {"route":"RAG","tool":null,"arguments":{},"confidence":0.95,"reason":"Sanxingdui knowledge question"}
            {"route":"DIRECT_ANSWER","tool":null,"arguments":{},"confidence":0.9,"reason":"general question","message":"今天是2026年7月10日。"}
            {"route":"TOOL_CALL","tool":"get_weather","arguments":{"city":"成都"},"confidence":0.98,"reason":"weather request"}
            {"route":"TOOL_CALL","tool":"get_current_datetime","arguments":{},"confidence":0.99,"reason":"current date/time request"}
            {"route":"TOOL_CALL","tool":"control_trail","arguments":{"action":"open_artifact","artifact_id":"HI-2025-002"},"confidence":0.98,"reason":"open artifact in trail"}
            {"route":"UNSUPPORTED","tool":null,"arguments":{},"confidence":0.95,"reason":"missing logistics tool","requiredCapability":"logistics","message":"当前还没有接入实时物流查询工具。"}
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
        String attachmentContext = buildAttachmentContext(command);
        try {
            String output = routerClient.prompt()
                    .system(ROUTER_PROMPT.formatted(toolRegistry.buildPromptToolList()))
                    .user(buildUserPayload(command, attachmentContext))
                    .call()
                    .content();
            AgentRouteResponseDTO decision = routeParser.parse(output);
            decision.setAttachmentContext(attachmentContext);
            log.info("[Agent Router] route={}, tool={}, confidence={}",
                    decision.getRoute(), decision.getTool(), decision.getConfidence());
            return decision;
        } catch (Exception exception) {
            log.warn("[Agent Router] model call failed, falling back to direct answer: {}", exception.getMessage());
            return buildSafeFallback(command, attachmentContext);
        }
    }

    private String buildUserPayload(AgentRouteCommandDTO command, String attachmentContext) throws Exception {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("message", command.getMessage().trim());
        payload.put("context", command.getContext() == null ? Map.of() : command.getContext());
        payload.put("attachments", command.getAttachments() == null ? java.util.List.of() : command.getAttachments());
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

    private String extractWeatherCity(String message) {
        int weatherIndex = message.indexOf("\u5929\u6c14");
        String beforeWeather = weatherIndex > 0 ? message.substring(0, weatherIndex) : "";
        String city = beforeWeather
                .replace("\u4eca\u5929", "")
                .replace("\u660e\u5929", "")
                .replace("\u8bf7\u95ee", "")
                .replace("\u5e2e\u6211", "")
                .replace("\u67e5", "")
                .replace("\u770b", "")
                .replace("\u4e00\u4e0b", "")
                .replaceAll("[^\\p{IsHan}A-Za-z\\s-]", "")
                .trim();
        return city.isBlank() ? "\u6210\u90fd" : city;
    }
}
