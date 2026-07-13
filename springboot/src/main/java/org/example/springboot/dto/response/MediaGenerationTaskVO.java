package org.example.springboot.dto.response;

import lombok.Data;
import org.example.springboot.dto.command.GenerationExperienceContextDTO;

import java.time.LocalDateTime;

@Data
public class MediaGenerationTaskVO {
    private String taskId;
    private String mediaType;
    private String mode;
    private String status;
    private String stage;
    private String stageMessage;
    private Integer progress;
    private Long elapsedSeconds;
    private String modelProfile;
    private String contentLabel;
    private GenerationExperienceContextDTO experienceContext;
    private String promptRaw;
    private String promptFinal;
    private Long referenceFileId;
    private Long resultFileId;
    private String resultUrl;
    private String errorCode;
    private String errorMessage;
    private Boolean favorite;
    private Boolean shareEnabled;
    private String shareToken;
    private LocalDateTime createTime;
    private LocalDateTime finishedTime;
    private LocalDateTime stageUpdatedTime;
    private MediaGenerationExperienceEvent experienceEvent;
}
