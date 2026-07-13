package org.example.springboot.dto.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateVideoGenerationDTO {
    @NotBlank(message = "请输入视频描述")
    @Size(min = 2, max = 2000, message = "视频描述长度应为2到2000个字符")
    private String prompt;
    private String mode = "TEXT_TO_VIDEO";
    private String aspectRatio = "16:9";
    private Integer durationSeconds = 5;
    private String cameraMotion = "NONE";
    private Long artifactId;
    private Long referenceFileId;
    @Size(max = 1000)
    private String negativePrompt;
    private String sessionId;
    private Long messageId;
}
