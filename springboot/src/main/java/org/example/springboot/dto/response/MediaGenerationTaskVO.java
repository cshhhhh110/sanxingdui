package org.example.springboot.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MediaGenerationTaskVO {
    private String taskId;
    private String mediaType;
    private String mode;
    private String status;
    private Integer progress;
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
}
