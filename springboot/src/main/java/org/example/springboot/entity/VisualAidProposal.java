package org.example.springboot.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("ai_visual_aid_proposal")
public class VisualAidProposal {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String proposalId;
    private Long userId;
    private String sessionId;
    private String messageId;
    private String artifactId;
    private String artifactName;
    private String title;
    private String reason;
    private String prompt;
    private String purpose;
    private String contentLabel;
    private String knowledgeFocus;
    private String sourceReferences;
    private String status;
    private String generationTaskId;
    private String clientRequestId;
    private LocalDateTime expiresAt;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
