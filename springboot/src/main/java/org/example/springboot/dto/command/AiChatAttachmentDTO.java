package org.example.springboot.dto.command;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * AI聊天附件请求DTO
 */
@Data
@Schema(description = "AI聊天附件请求DTO")
public class AiChatAttachmentDTO {

    @Schema(description = "文件ID，对应sys_file_info.id")
    private Long fileId;

    @Schema(description = "媒体类型：IMAGE/AUDIO/VIDEO/DOCUMENT/FILE")
    private String mediaType;

    @Schema(description = "文件名")
    private String fileName;

    @Schema(description = "文件访问路径")
    private String filePath;

    @Schema(description = "MIME类型")
    private String mimeType;

    @Schema(description = "文件大小")
    private Long fileSize;

    @Schema(description = "解析状态：PENDING/DONE/FAILED/SKIPPED")
    private String analysisStatus;

    @Schema(description = "解析提取的文本内容")
    private String extractedText;

    @Schema(description = "解析元数据")
    private String extractedMeta;
}
