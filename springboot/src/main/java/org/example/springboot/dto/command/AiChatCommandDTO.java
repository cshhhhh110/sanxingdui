package org.example.springboot.dto.command;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

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
}
