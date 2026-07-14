package org.example.springboot.dto.command;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * AI chat request DTO.
 */
@Data
@Schema(description = "AI chat request")
public class AiChatCommandDTO {

    @Schema(description = "Session id", requiredMode = Schema.RequiredMode.REQUIRED)
    private String sessionId;

    @Schema(description = "User text message")
    private String userMessage;

    @Schema(description = "Multimodal attachments")
    private List<AiChatAttachmentDTO> attachments;

    @Schema(description = "Short-term Xuanmiao context")
    private Map<String, Object> context;

    @Schema(description = "Stable frontend user message id")
    private String clientUserMessageId;

    @Schema(description = "Stable frontend assistant message id")
    private String clientAssistantMessageId;
}
