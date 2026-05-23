package org.example.springboot.dto.command;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
@Schema(description = "答题成绩提交命令")
public class QuizRecordSubmitDTO {

    @NotNull(message = "得分不能为空")
    @Min(value = 0, message = "得分不能为负数")
    @Schema(description = "得分")
    private Integer score;

    @NotNull(message = "总用时不能为空")
    @Min(value = 0, message = "总用时不能为负数")
    @Schema(description = "总用时(秒)")
    private Integer totalTime;

    @NotNull(message = "答对题数不能为空")
    @Min(value = 0, message = "答对题数不能为负数")
    @Schema(description = "答对题数")
    private Integer correctCount;

    @NotNull(message = "总题数不能为空")
    @Min(value = 1, message = "总题数至少为1")
    @Schema(description = "总题数")
    private Integer totalCount;

    @NotBlank(message = "模式不能为空")
    @Schema(description = "模式: challenge/practice")
    private String mode;
}
