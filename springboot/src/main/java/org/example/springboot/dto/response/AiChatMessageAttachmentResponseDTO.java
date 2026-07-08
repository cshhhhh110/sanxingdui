package org.example.springboot.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AI聊天消息附件响应DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "AI聊天消息附件响应DTO")
public class AiChatMessageAttachmentResponseDTO {

    @Schema(description = "附件ID")
    private Long id;

    @Schema(description = "消息ID")
    private Long messageId;

    @Schema(description = "文件ID")
    private Long fileId;

    @Schema(description = "媒体类型")
    private String mediaType;

    @Schema(description = "文件名")
    private String fileName;

    @Schema(description = "文件访问路径")
    private String filePath;

    @Schema(description = "MIME类型")
    private String mimeType;

    @Schema(description = "文件大小")
    private Long fileSize;

    @Schema(description = "解析状态")
    private String analysisStatus;

    @Schema(description = "提取文本")
    private String extractedText;

    @Schema(description = "解析元数据")
    private String extractedMeta;
}
