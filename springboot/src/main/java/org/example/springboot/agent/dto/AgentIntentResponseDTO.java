package org.example.springboot.agent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentIntentResponseDTO {

    public static final String QUESTION = "QUESTION";
    public static final String TOOL_CALL = "TOOL_CALL";

    private String type;
    private String tool;
    private Map<String, Object> arguments;
    private double confidence;
    private String reason;

    public static AgentIntentResponseDTO question(double confidence, String reason) {
        return AgentIntentResponseDTO.builder()
                .type(QUESTION)
                .arguments(Collections.emptyMap())
                .confidence(confidence)
                .reason(reason)
                .build();
    }
}
