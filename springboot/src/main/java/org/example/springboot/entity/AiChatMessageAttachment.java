package org.example.springboot.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * AI聊天消息附件实体
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("ai_chat_message_attachment")
@Schema(description = "AI聊天消息附件实体")
public class AiChatMessageAttachment {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("message_id")
    private Long messageId;

    @TableField("file_id")
    private Long fileId;

    @TableField("media_type")
    private String mediaType;

    @TableField("file_name")
    private String fileName;

    @TableField("file_path")
    private String filePath;

    @TableField("mime_type")
    private String mimeType;

    @TableField("file_size")
    private Long fileSize;

    @TableField("analysis_status")
    private String analysisStatus;

    @TableField("extracted_text")
    private String extractedText;

    @TableField("extracted_meta")
    private String extractedMeta;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
