package org.example.springboot.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "时空筛选选项")
public class SpacetimeFacetOptionResponseDTO {

    @Schema(description = "选项值")
    private String value;

    @Schema(description = "选项名称")
    private String label;

    @Schema(description = "命中文物数")
    private Integer artifactCount;

    @Schema(description = "可用模型数")
    private Integer readyModelCount;

    @Schema(description = "开始年份，仅时代选项使用")
    private Integer timeStartYear;

    @Schema(description = "结束年份，仅时代选项使用")
    private Integer timeEndYear;
}
