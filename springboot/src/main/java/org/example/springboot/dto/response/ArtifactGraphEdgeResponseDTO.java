package org.example.springboot.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "文物图谱边")
public class ArtifactGraphEdgeResponseDTO {

    @Schema(description = "边 ID")
    private String id;

    @Schema(description = "起点")
    private String source;

    @Schema(description = "终点")
    private String target;

    @Schema(description = "关系文案")
    private String label;

    @Schema(description = "权重")
    private Integer weight;

    @Schema(description = "关系分类")
    private String category;
}
