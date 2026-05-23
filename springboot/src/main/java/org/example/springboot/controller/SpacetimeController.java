package org.example.springboot.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.example.springboot.common.Result;
import org.example.springboot.dto.query.SpacetimeSearchRequestDTO;
import org.example.springboot.dto.response.ArtifactGraphResponseDTO;
import org.example.springboot.dto.response.CompetitionArtifactResponseDTO;
import org.example.springboot.dto.response.SpacetimeSearchResponseDTO;
import org.example.springboot.service.SpacetimeService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "竞赛时空链路", description = "三星堆竞赛前台数据接口")
@RestController
public class SpacetimeController {

    @Resource
    private SpacetimeService spacetimeService;

    @Operation(summary = "时空筛选", description = "按时代、遗址、工艺筛选前台展示文物")
    @PostMapping("/spacetime/search")
    public Result<SpacetimeSearchResponseDTO> searchArtifacts(@RequestBody(required = false) SpacetimeSearchRequestDTO requestDTO) {
        SpacetimeSearchRequestDTO safeRequest = requestDTO == null ? new SpacetimeSearchRequestDTO() : requestDTO;
        return Result.success(spacetimeService.searchArtifacts(safeRequest));
    }

    @Operation(summary = "文物详情", description = "获取单件文物的前台展示详情")
    @GetMapping("/spacetime/artifacts/{entityId}")
    public Result<CompetitionArtifactResponseDTO> getArtifactDetail(
            @Parameter(description = "文物主键") @PathVariable String entityId) {
        CompetitionArtifactResponseDTO responseDTO = spacetimeService.getArtifactDetail(entityId);
        if (responseDTO == null) {
            return Result.error("404", "未找到对应文物详情");
        }
        return Result.success(responseDTO);
    }

    @Operation(summary = "文物图谱", description = "获取单件文物的关系图谱")
    @GetMapping("/graph/artifacts/{entityId}")
    public Result<ArtifactGraphResponseDTO> getArtifactGraph(
            @Parameter(description = "文物主键") @PathVariable String entityId) {
        ArtifactGraphResponseDTO responseDTO = spacetimeService.buildArtifactGraph(entityId);
        if (responseDTO == null) {
            return Result.error("404", "未找到对应文物图谱");
        }
        return Result.success(responseDTO);
    }

    @Operation(summary = "图谱邻居扩展", description = "按节点懒加载图谱邻居")
    @GetMapping("/graph/nodes/{nodeId}/neighbors")
    public Result<ArtifactGraphResponseDTO> getNodeNeighbors(
            @Parameter(description = "图谱节点 ID") @PathVariable String nodeId,
            @Parameter(description = "当前文物主键") @RequestParam String entityId,
            @Parameter(description = "扩展层级") @RequestParam(required = false, defaultValue = "1") Integer depth) {
        ArtifactGraphResponseDTO responseDTO = spacetimeService.buildNodeNeighbors(entityId, nodeId, depth);
        if (responseDTO == null) {
            return Result.error("404", "未找到对应图谱扩展结果");
        }
        return Result.success(responseDTO);
    }
}
