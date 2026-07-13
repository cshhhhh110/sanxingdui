package org.example.springboot.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("ai_media_generation_task")
public class AiMediaGenerationTask {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String taskId;
    private Long userId;
    private String sessionId;
    private Long messageId;
    private String mediaType;
    private String mode;
    private String promptRaw;
    private String promptFinal;
    private String negativePrompt;
    private Long artifactId;
    private Long referenceFileId;
    private String provider;
    private String model;
    private String providerTaskId;
    private String status;
    private String stage;
    private Integer progress;
    private String modelProfile;
    private String contentLabel;
    private String experienceContext;
    private String clientRequestId;
    private String requestParams;
    private String providerResponse;
    private Long resultFileId;
    private String resultUrl;
    private String errorCode;
    private String errorMessage;
    private Integer retryCount;
    private Integer favorite;
    private String shareToken;
    private Integer shareEnabled;
    private LocalDateTime startedTime;
    private LocalDateTime finishedTime;
    private LocalDateTime stageUpdatedTime;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
