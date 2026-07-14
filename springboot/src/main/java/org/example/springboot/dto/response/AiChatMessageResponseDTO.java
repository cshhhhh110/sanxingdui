package org.example.springboot.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * AI chat message response DTO.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "AI chat message response")
public class AiChatMessageResponseDTO {

    @Schema(description = "Message id")
    private Long id;

    private String clientMessageId;

    @Schema(description = "Role: user or assistant")
    private String role;

    @Schema(description = "Display content")
    private String content;

    @Schema(description = "Message type: TEXT/MULTIMODAL/SYSTEM")
    private String messageType;

    @Schema(description = "Media generation task id")
    private String generationTaskId;

    private Map<String, Object> trace;

    private List<Map<String, Object>> references;

    private Map<String, Object> uiPayload;

    @Schema(description = "Attachments")
    private List<AiChatMessageAttachmentResponseDTO> attachments;

    @Schema(description = "Create time")
    private LocalDateTime createTime;
}
