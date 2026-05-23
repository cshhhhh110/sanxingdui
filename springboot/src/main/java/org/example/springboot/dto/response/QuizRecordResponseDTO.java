package org.example.springboot.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Schema(description = "答题记录响应")
public class QuizRecordResponseDTO {

    @Schema(description = "记录ID")
    private Long id;

    @Schema(description = "用户ID")
    private Long userId;

    @Schema(description = "用户名")
    private String username;

    @Schema(description = "用户头像")
    private String avatar;

    @Schema(description = "得分")
    private Integer score;

    @Schema(description = "总用时(秒)")
    private Integer totalTime;

    @Schema(description = "答对题数")
    private Integer correctCount;

    @Schema(description = "总题数")
    private Integer totalCount;

    @Schema(description = "模式")
    private String mode;

    @Schema(description = "排名")
    private Integer ranking;

    @Schema(description = "创建时间")
    private LocalDateTime createTime;
}
