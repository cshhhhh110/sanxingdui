package org.example.springboot.agent;

import org.example.springboot.agent.dto.AgentRouteCommandDTO;
import org.example.springboot.agent.dto.AgentRouteResponseDTO;
import org.example.springboot.agent.dto.AgentIntentResponseDTO;
import org.springframework.stereotype.Service;

@Service
public class AgentIntentService {

    private final AgentRouterService routerService;

    public AgentIntentService(AgentRouterService routerService) {
        this.routerService = routerService;
    }

    public AgentIntentResponseDTO classify(String userMessage) {
        AgentRouteCommandDTO command = new AgentRouteCommandDTO();
        command.setMessage(userMessage);
        AgentRouteResponseDTO decision = routerService.route(command);
        if (decision.getRoute() == AgentRoute.TOOL_CALL) {
            return AgentIntentResponseDTO.builder()
                    .type(AgentIntentResponseDTO.TOOL_CALL)
                    .tool(decision.getTool())
                    .arguments(decision.getArguments())
                    .confidence(decision.getConfidence())
                    .reason(decision.getReason())
                    .build();
        }
        return AgentIntentResponseDTO.question(decision.getConfidence(), decision.getReason());
    }
}
