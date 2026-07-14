package org.example.springboot.dto.command;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class AiChatConversationStateDTO {
    @Size(max = 255)
    private String title;
    @Size(max = 1000)
    private String summary;
    @Size(max = 32)
    private String status;
    @Size(max = 255)
    private String currentArtifact;
    @Size(max = 255)
    private String currentTrailNode;
    @Size(max = 64)
    private String lastVisualAidTask;
    private Map<String, Object> activeGuideState;
    private Map<String, Object> context;
    @Valid
    private List<AiChatMessageSnapshotDTO> messages;
}
