package org.example.springboot.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "文物图谱节点")
public class ArtifactGraphNodeResponseDTO {

    @Schema(description = "节点 ID")
    private String id;

    @Schema(description = "节点类型")
    private String type;

    @Schema(description = "显示文案")
    private String label;

    @Schema(description = "实体主键")
    private String entityId;

    @Schema(description = "节点摘要")
    private String summary;

    @Schema(description = "节点图片")
    private String image;

    @Schema(description = "重要程度")
    private Integer importance;

    @Schema(description = "是否可扩展")
    private Boolean expandable;

    @Schema(description = "跳转类型")
    private String routeType;

    @Schema(description = "跳转目标")
    private String routeTarget;
}
