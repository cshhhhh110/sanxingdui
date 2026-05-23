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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("quiz_record")
@Schema(description = "答题记录实体类")
public class QuizRecord {

    @TableId(type = IdType.AUTO)
    @Schema(description = "主键ID")
    private Long id;

    @Schema(description = "用户ID")
    @TableField("user_id")
    private Long userId;

    @Schema(description = "得分")
    private Integer score;

    @Schema(description = "总用时(秒)")
    @TableField("total_time")
    private Integer totalTime;

    @Schema(description = "答对题数")
    @TableField("correct_count")
    private Integer correctCount;

    @Schema(description = "总题数")
    @TableField("total_count")
    private Integer totalCount;

    @Schema(description = "模式: challenge/practice")
    private String mode;

    @Schema(description = "创建时间")
    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
