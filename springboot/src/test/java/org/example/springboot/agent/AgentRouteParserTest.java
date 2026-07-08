package org.example.springboot.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.springboot.agent.dto.AgentRouteResponseDTO;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class AgentRouteParserTest {

    private final AgentRouteParser parser = new AgentRouteParser(
            new ObjectMapper(),
            new AgentToolRegistry()
    );

    @Test
    void parsesAllowedShoppingTool() {
        AgentRouteResponseDTO result = parser.parse("""
                {"route":"TOOL_CALL","tool":"search_product","arguments":{"keyword":"青铜面具","quantity":2},"confidence":0.94}
                """);

        assertEquals(AgentRoute.TOOL_CALL, result.getRoute());
        assertEquals("search_product", result.getTool());
        assertEquals("青铜面具", result.getArguments().get("keyword"));
        assertEquals(2, result.getArguments().get("quantity"));
    }

    @Test
    void keepsRagAndDirectAnswerSeparate() {
        AgentRouteResponseDTO rag = parser.parse("""
                {"route":"RAG","confidence":0.96,"reason":"三星堆知识问题"}
                """);
        AgentRouteResponseDTO direct = parser.parse("""
                {"route":"DIRECT_ANSWER","confidence":0.91,"reason":"普通问题","message":"今天是星期二。"}
                """);

        assertEquals(AgentRoute.RAG, rag.getRoute());
        assertEquals(AgentRoute.DIRECT_ANSWER, direct.getRoute());
        assertEquals("今天是星期二。", direct.getMessage());
    }

    @Test
    void rejectsUnsafeTool() {
        AgentRouteResponseDTO result = parser.parse("""
                {"route":"TOOL_CALL","tool":"batch_pay_orders","arguments":{},"confidence":0.99}
                """);

        assertEquals(AgentRoute.UNSUPPORTED, result.getRoute());
        assertNull(result.getTool());
    }

    @Test
    void parsesSafeHeritageSearchTool() {
        AgentRouteResponseDTO result = parser.parse("""
                {"route":"TOOL_CALL","tool":"search_heritage","arguments":{"keyword":"青铜神树"},"confidence":0.93}
                """);

        assertEquals(AgentRoute.TOOL_CALL, result.getRoute());
        assertEquals("search_heritage", result.getTool());
        assertEquals("青铜神树", result.getArguments().get("keyword"));
    }

    @Test
    void rejectsProtectedNavigationDestination() {
        AgentRouteResponseDTO result = parser.parse("""
                {"route":"TOOL_CALL","tool":"navigate_to","arguments":{"destination":"profile"},"confidence":0.98}
                """);

        assertEquals(AgentRoute.UNSUPPORTED, result.getRoute());
    }

    @Test
    void parsesWeatherToolWithoutTurningItIntoProductSearch() {
        AgentRouteResponseDTO result = parser.parse("""
                {"route":"TOOL_CALL","tool":"get_weather","arguments":{"city":"成都"},"confidence":0.98,"reason":"需要实时天气"}
                """);

        assertEquals(AgentRoute.TOOL_CALL, result.getRoute());
        assertEquals("get_weather", result.getTool());
        assertEquals("成都", result.getArguments().get("city"));
    }

    @Test
    void fallsBackToDirectAnswerOnInvalidJson() {
        AgentRouteResponseDTO result = parser.parse("not-json");

        assertEquals(AgentRoute.DIRECT_ANSWER, result.getRoute());
        assertEquals(0, result.getConfidence());
    }
}
