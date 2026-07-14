package org.example.springboot.dto.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class AiChatMessageSnapshotDTO {
    @NotBlank
    @Size(max = 100)
    private String clientMessageId;
    @NotBlank
    @Size(max = 32)
    private String role;
    private String content;
    @Size(max = 32)
    private String messageType;
    @Size(max = 64)
    private String generationTaskId;
    private Map<String, Object> trace;
    private List<Map<String, Object>> references;
    private Map<String, Object> uiPayload;
}
