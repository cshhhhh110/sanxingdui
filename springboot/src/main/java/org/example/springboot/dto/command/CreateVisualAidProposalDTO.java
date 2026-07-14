package org.example.springboot.dto.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class CreateVisualAidProposalDTO {
    @NotBlank
    @Size(max = 64)
    private String sessionId;
    @NotBlank
    @Size(max = 100)
    private String messageId;
    @Size(max = 100)
    private String artifactId;
    @Size(max = 100)
    private String artifactName;
    @NotBlank
    @Size(max = 255)
    private String title;
    @NotBlank
    @Size(max = 1000)
    private String reason;
    @NotBlank
    @Size(min = 2, max = 2000)
    private String prompt;
    @Size(max = 40)
    private String purpose;
    @Size(max = 40)
    private String contentLabel;
    private List<String> knowledgeFocus;
    private List<Map<String, Object>> sourceReferences;
}
