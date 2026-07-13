package org.example.springboot.dto.command;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GenerationExperienceContextDTO {
    private Integer schemaVersion = 1;
    @Size(max = 32)
    private String surface;
    @Size(max = 64)
    private String scene;
    @Size(max = 64)
    private String sessionId;
    @Size(max = 64)
    private String messageId;
    @Size(max = 64)
    private String artifactId;
    @Size(max = 40)
    private String purpose;
}
