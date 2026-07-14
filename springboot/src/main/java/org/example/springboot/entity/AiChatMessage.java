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
 * AI chat message entity.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("ai_chat_message")
@Schema(description = "AI chat message")
public class AiChatMessage {

    @TableId(type = IdType.AUTO)
    @Schema(description = "Message id")
    private Long id;

    @TableField("session_id")
    @Schema(description = "Session id")
    private String sessionId;

    @Schema(description = "Role: user or assistant")
    private String role;

    @Schema(description = "Display content")
    private String content;

    @TableField("message_type")
    @Schema(description = "Message type: TEXT/MULTIMODAL/SYSTEM")
    private String messageType;

    @TableField("raw_content")
    @Schema(description = "Original user content")
    private String rawContent;

    @TableField("processed_content")
    @Schema(description = "Model-readable content")
    private String processedContent;

    @TableField("client_message_id")
    @Schema(description = "Stable frontend message id")
    private String clientMessageId;

    @TableField("trace_json")
    private String traceJson;

    @TableField("references_json")
    private String referencesJson;

    @TableField("ui_payload")
    private String uiPayload;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    @Schema(description = "Create time")
    private LocalDateTime createTime;
}
