package org.example.springboot.dto.command;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;
import lombok.Data;

@Data
public class CreateImageGenerationDTO {
    @NotBlank(message = "请输入图片描述")
    @Size(min = 2, max = 2000, message = "图片描述长度应为2到2000个字符")
    private String prompt;
    private String mode = "TEXT_TO_IMAGE";
    private String style = "MUSEUM_POSTER";
    private String aspectRatio = "1:1";
    @Min(1) @Max(4)
    private Integer count = 1;
    private Long artifactId;
    private Long referenceFileId;
    @Size(max = 1000)
    private String negativePrompt;
    private String sessionId;
    private Long messageId;
    private String modelProfile;
    @Size(max = 64)
    private String clientRequestId;
    @Valid
    private GenerationExperienceContextDTO experienceContext;
}
