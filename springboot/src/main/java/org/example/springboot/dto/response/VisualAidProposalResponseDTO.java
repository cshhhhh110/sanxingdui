package org.example.springboot.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class VisualAidProposalResponseDTO {
    private String proposalId;
    private String sessionId;
    private String messageId;
    private String artifactId;
    private String artifactName;
    private String title;
    private String reason;
    private String prompt;
    private String purpose;
    private String contentLabel;
    private List<String> knowledgeFocus;
    private List<Map<String, Object>> sourceReferences;
    private String status;
    private String generationTaskId;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}
