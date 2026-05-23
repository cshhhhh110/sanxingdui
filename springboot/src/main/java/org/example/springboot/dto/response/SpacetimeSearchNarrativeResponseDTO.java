package org.example.springboot.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "时空叙事文案")
public class SpacetimeSearchNarrativeResponseDTO {

    @Schema(description = "入口叙事")
    private String entryLine;

    @Schema(description = "场景叙事")
    private String sceneLine;

    @Schema(description = "结果摘要")
    private String resultLine;

    @Schema(description = "空结果提示")
    private String emptyLine;

    @Schema(description = "推荐文物主键")
    private String recommendedArtifactId;

    @Schema(description = "推荐理由")
    private String recommendedReason;
}
