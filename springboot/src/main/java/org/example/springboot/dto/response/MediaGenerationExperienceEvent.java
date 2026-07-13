package org.example.springboot.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.example.springboot.dto.command.GenerationExperienceContextDTO;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class MediaGenerationExperienceEvent {
    private String eventType;
    private String mediaType;
    private String taskId;
    private String source;
    private GenerationExperienceContextDTO experienceContext;
    private Result result;
    private LocalDateTime timestamp;

    @Data
    @AllArgsConstructor
    public static class Result {
        private String url;
        private String contentLabel;
    }
}
