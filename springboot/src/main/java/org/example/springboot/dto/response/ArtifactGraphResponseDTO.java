package org.example.springboot.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@Schema(description = "文物图谱响应")
public class ArtifactGraphResponseDTO {

    @Schema(description = "中心节点 ID")
    private String centerNodeId;

    @Schema(description = "图谱导语")
    private String narrative;

    @Schema(description = "可用节点类型")
    private List<String> availableTypes = new ArrayList<>();

    @Schema(description = "图谱统计")
    private ArtifactGraphStatsResponseDTO stats;

    @Schema(description = "节点列表")
    private List<ArtifactGraphNodeResponseDTO> nodes = new ArrayList<>();

    @Schema(description = "边列表")
    private List<ArtifactGraphEdgeResponseDTO> edges = new ArrayList<>();
}
