package org.example.springboot.dto.response;

import lombok.Data;
import org.example.springboot.dto.command.GenerationExperienceContextDTO;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Data
public class MediaGenerationExperienceEvent {
    private String eventType;
    private String source;
    private String sessionId;
    private Map<String, Object> context;
    private Map<String, Object> payload;
    private LocalDateTime timestamp;

    // Compatibility fields retained for the P0 work-card contract.
    private String mediaType;
    private String taskId;
    private GenerationExperienceContextDTO experienceContext;
    private Result result;

    public MediaGenerationExperienceEvent(
            String eventType,
            String mediaType,
            String taskId,
            String source,
            GenerationExperienceContextDTO experienceContext,
            Result result,
            LocalDateTime timestamp
    ) {
        this.eventType = eventType;
        this.mediaType = mediaType;
        this.taskId = taskId;
        this.source = source;
        this.experienceContext = experienceContext;
        this.result = result;
        this.timestamp = timestamp;
        this.sessionId = experienceContext == null ? null : experienceContext.getSessionId();
        this.context = new LinkedHashMap<>();
        if (experienceContext != null) {
            context.put("proposalId", experienceContext.getProposalId());
            context.put("messageId", experienceContext.getMessageId());
            context.put("artifactId", experienceContext.getArtifactId());
            context.put("scene", experienceContext.getScene());
        }
        context.values().removeIf(java.util.Objects::isNull);
        this.payload = new LinkedHashMap<>();
        payload.put("taskId", taskId);
        payload.put("mediaType", mediaType);
        if (result != null) {
            payload.put("resultUrl", result.getUrl());
            payload.put("contentLabel", result.getContentLabel());
        }
        payload.values().removeIf(java.util.Objects::isNull);
    }

    @Data
    public static class Result {
        private String url;
        private String contentLabel;

        public Result(String url, String contentLabel) {
            this.url = url;
            this.contentLabel = contentLabel;
        }
    }
}
