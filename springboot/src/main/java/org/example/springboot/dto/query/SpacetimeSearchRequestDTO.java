package org.example.springboot.dto.query;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "时空筛选请求")
public class SpacetimeSearchRequestDTO {

    @Schema(description = "时代编码")
    private String eraCode;

    @Schema(description = "遗址编码")
    private String siteCode;

    @Schema(description = "工艺编码")
    private String craftCode;
}
