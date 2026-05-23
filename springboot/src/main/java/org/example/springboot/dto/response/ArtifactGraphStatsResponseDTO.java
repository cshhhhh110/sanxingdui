package org.example.springboot.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "文物图谱统计信息")
public class ArtifactGraphStatsResponseDTO {

    @Schema(description = "节点数量")
    private Integer nodeCount;

    @Schema(description = "边数量")
    private Integer edgeCount;

    @Schema(description = "可扩展节点数量")
    private Integer expandableCount;
}
