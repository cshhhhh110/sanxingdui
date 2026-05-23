package org.example.springboot.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@Schema(description = "时空筛选字典")
public class SpacetimeSearchFacetsResponseDTO {

    @Schema(description = "遗址选项")
    private List<SpacetimeFacetOptionResponseDTO> siteOptions = new ArrayList<>();

    @Schema(description = "时代选项")
    private List<SpacetimeFacetOptionResponseDTO> eraOptions = new ArrayList<>();

    @Schema(description = "工艺选项")
    private List<SpacetimeFacetOptionResponseDTO> craftOptions = new ArrayList<>();
}
