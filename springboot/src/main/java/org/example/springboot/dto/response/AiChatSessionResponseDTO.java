package org.example.springboot.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * AI聊天会话响应DTO
 * @author system
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "AI聊天会话响应DTO")
public class AiChatSessionResponseDTO {

    @Schema(description = "会话ID")
    private String sessionId;

    @Schema(description = "会话标题")
    private String title;

    private String summary;

    private String status;

    private String currentArtifact;

    private String currentTrailNode;

    private Map<String, Object> activeGuideState;

    private Map<String, Object> context;

    private String lastVisualAidTask;

    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @Schema(description = "更新时间")
    private LocalDateTime updateTime;
}

