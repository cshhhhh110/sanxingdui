package org.example.springboot.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@Schema(description = "时空筛选响应")
public class SpacetimeSearchResponseDTO {

    @Schema(description = "文物列表")
    private List<CompetitionArtifactResponseDTO> artifacts = new ArrayList<>();

    @Schema(description = "统计信息")
    private SpacetimeSearchStatsResponseDTO stats;

    private SpacetimeSearchFacetsResponseDTO facets;

    private SpacetimeSearchNarrativeResponseDTO narrative;
}
