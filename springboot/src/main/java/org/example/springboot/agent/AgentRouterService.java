package org.example.springboot.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.example.springboot.agent.dto.AgentRouteCommandDTO;
import org.example.springboot.agent.dto.AgentRouteResponseDTO;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
public class AgentRouterService {

    private static final String ROUTER_PROMPT = """
            你是三星堆数字展馆的统一 Agent。你先选择处理路线；当路线是DIRECT_ANSWER时，在同一个JSON中直接回答用户。

            可选路线：
            1. TOOL_CALL：用户明确要求执行下方已开放工具能够完成的操作。
            2. RAG：问题涉及三星堆、古蜀文明、文物、展馆内容或本项目知识，需要检索本地知识库。
            3. DIRECT_ANSWER：普通常识、日期、闲聊或不依赖项目知识库的问题。
            4. UNSUPPORTED：需要当前未提供的实时数据、外部专用工具或尚未实现的能力。

            已开放工具：
            %s
            约束：
            - “搜索/查找”不等于商品搜索；只有明确涉及商城、商品、购买时才能选择search_product。搜索文物或活动应选择对应工具。
            - 复合指令必须选择能完成最终目标的最具体工具：用户同时要求“打开/进入商城”和“搜索某个商品”时，必须选择search_product，由该工具完成跳转和筛选；不得只选择navigate_to。
            - 只有用户单纯要求打开商城、没有搜索词和商品目标时，才选择navigate_to并设置destination=shop。
            - 只有用户明确要求打开页面、播放介绍、开始答题或搜索内容时才选择工具；纯知识问题继续选择RAG或DIRECT_ANSWER。
            - 已开放工具能够完成的实时请求必须选择TOOL_CALL；查询城市天气选择get_weather，并从用户问题提取city。
            - 查询今天日期、星期或当前时间选择get_current_datetime。
            - 用户要求在时空展线中定位文物、祭祀坑、场景、3D现场、讲解或图谱节点时选择control_trail，不要用本地关键词猜测。
            - control_trail动作必须按语义选择：看具体文物=open_artifact，回地图/第一幕=go_scene_one，回文物列表=go_artifact_list，打开3D/展品现场=open_stage，继续讲解=open_guide，查看关系图谱=focus_graph。
            - 新闻、物流等没有对应工具的实时问题选择UNSUPPORTED，requiredCapability填写对应能力。
            - DIRECT_ANSWER必须在message字段给出完整、准确、简洁的中文回答；不要让前端再次调用模型。
            - DIRECT_ANSWER默认用于语音播报，message控制在60至100个汉字、最多2句话，不主动分点；用户明确要求详细时除外。
            - 回答先给结论，省略复述问题、客套话和无关背景。
            - RAG、TOOL_CALL和UNSUPPORTED不要在message中伪造知识答案。
            - 不得选择未列出的工具，不得虚构商品ID。
            - 仅输出一个JSON对象，不要输出Markdown或解释文字。

            输出示例：
            {"route":"TOOL_CALL","tool":"search_product","arguments":{"keyword":"青铜面具","quantity":1},"confidence":0.95,"reason":"明确搜索商城商品"}
            {"route":"TOOL_CALL","tool":"search_product","arguments":{"keyword":"青铜面具文创产品","quantity":1},"confidence":0.98,"reason":"打开商城并搜索具体商品，应使用最具体工具完成全部目标"}
            {"route":"RAG","tool":null,"arguments":{},"confidence":0.95,"reason":"三星堆知识问题"}
            {"route":"DIRECT_ANSWER","tool":null,"arguments":{},"confidence":0.9,"reason":"普通问题","message":"这里填写给用户的最终回答。"}
            {"route":"TOOL_CALL","tool":"get_weather","arguments":{"city":"成都"},"confidence":0.98,"reason":"需要查询成都实时天气"}
            {"route":"TOOL_CALL","tool":"get_current_datetime","arguments":{},"confidence":0.99,"reason":"需要当前日期"}
            {"route":"TOOL_CALL","tool":"control_trail","arguments":{"action":"open_artifact","artifact_id":"HI-2025-002"},"confidence":0.98,"reason":"带用户在时空展线看金面具"}
            {"route":"TOOL_CALL","tool":"control_trail","arguments":{"action":"open_stage"},"confidence":0.98,"reason":"打开当前文物的3D展品现场"}
            {"route":"UNSUPPORTED","tool":null,"arguments":{},"confidence":0.95,"reason":"需要实时物流数据","requiredCapability":"logistics","message":"当前还没有接入实时物流查询工具。"}
            """;

    private final ChatClient routerClient;
    private final AgentRouteParser routeParser;
    private final AgentToolRegistry toolRegistry;
    private final ObjectMapper objectMapper;

    public AgentRouterService(
            OpenAiChatModel chatModel,
            AgentRouteParser routeParser,
            AgentToolRegistry toolRegistry,
            ObjectMapper objectMapper
    ) {
        this.routerClient = ChatClient.builder(chatModel).build();
        this.routeParser = routeParser;
        this.toolRegistry = toolRegistry;
        this.objectMapper = objectMapper;
    }

    public AgentRouteResponseDTO route(AgentRouteCommandDTO command) {
        try {
            String output = routerClient.prompt()
                    .system(ROUTER_PROMPT.formatted(toolRegistry.buildPromptToolList()))
                    .user(buildUserPayload(command))
                    .call()
                    .content();
            AgentRouteResponseDTO decision = routeParser.parse(output);
            log.info("[Agent Router] route={}, tool={}, confidence={}",
                    decision.getRoute(), decision.getTool(), decision.getConfidence());
            return decision;
        } catch (Exception exception) {
            log.warn("[Agent Router] model call failed, falling back to direct answer: {}", exception.getMessage());
            return AgentRouteResponseDTO.route(
                    AgentRoute.DIRECT_ANSWER,
                    0,
                    "路由服务不可用，安全降级为直接回答"
            );
        }
    }

    private String buildUserPayload(AgentRouteCommandDTO command) throws Exception {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("message", command.getMessage().trim());
        payload.put("context", command.getContext() == null ? Map.of() : command.getContext());
        payload.put("attachments", command.getAttachments() == null ? java.util.List.of() : command.getAttachments());
        return objectMapper.writeValueAsString(payload);
    }
}
