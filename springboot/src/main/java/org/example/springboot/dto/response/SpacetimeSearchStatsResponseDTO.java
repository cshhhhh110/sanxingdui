package org.example.springboot.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "时空筛选统计")
public class SpacetimeSearchStatsResponseDTO {

    @Schema(description = "命中文物数")
    private Integer artifactCount;

    @Schema(description = "可用模型数")
    private Integer readyModelCount;
}
