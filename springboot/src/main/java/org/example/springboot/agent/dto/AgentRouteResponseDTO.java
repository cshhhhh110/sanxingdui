package org.example.springboot.agent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.springboot.agent.AgentRoute;

import java.util.Collections;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentRouteResponseDTO {

    private AgentRoute route;
    private String tool;
    @Builder.Default
    private Map<String, Object> arguments = Collections.emptyMap();
    private double confidence;
    private String reason;
    private String requiredCapability;
    private String message;
    private String attachmentContext;

    public static AgentRouteResponseDTO route(AgentRoute route, double confidence, String reason) {
        return AgentRouteResponseDTO.builder()
                .route(route)
                .confidence(confidence)
                .reason(reason)
                .build();
    }

    public static AgentRouteResponseDTO unsupported(
            double confidence,
            String reason,
            String requiredCapability,
            String message
    ) {
        return AgentRouteResponseDTO.builder()
                .route(AgentRoute.UNSUPPORTED)
                .confidence(confidence)
                .reason(reason)
                .requiredCapability(requiredCapability)
                .message(message)
                .build();
    }
}
