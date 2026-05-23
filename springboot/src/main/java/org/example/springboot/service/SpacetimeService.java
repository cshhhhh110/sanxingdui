package org.example.springboot.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.example.springboot.dto.query.SpacetimeSearchRequestDTO;
import org.example.springboot.dto.response.ArtifactGraphEdgeResponseDTO;
import org.example.springboot.dto.response.ArtifactGraphNodeResponseDTO;
import org.example.springboot.dto.response.ArtifactGraphResponseDTO;
import org.example.springboot.dto.response.ArtifactGraphStatsResponseDTO;
import org.example.springboot.dto.response.CompetitionArtifactResponseDTO;
import org.example.springboot.dto.response.SpacetimeFacetOptionResponseDTO;
import org.example.springboot.dto.response.SpacetimeSearchFacetsResponseDTO;
import org.example.springboot.dto.response.SpacetimeSearchNarrativeResponseDTO;
import org.example.springboot.dto.response.SpacetimeSearchResponseDTO;
import org.example.springboot.dto.response.SpacetimeSearchStatsResponseDTO;
import org.example.springboot.entity.HeritageItem;
import org.example.springboot.entity.SysFileInfo;
import org.example.springboot.mapper.HeritageItemMapper;
import org.example.springboot.mapper.SysFileInfoMapper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Slf4j
@Service
public class SpacetimeService {

    private static final String TYPE_ARTIFACT = "artifact";
    private static final String TYPE_SITE = "site";
    private static final String TYPE_ERA = "era";
    private static final String TYPE_CRAFT = "craft";
    private static final String TYPE_MEANING = "meaning";

    private static final Map<String, String> SITE_NAME_EN = Map.of(
            "SANXINGDUI", "Sanxingdui Site",
            "JINSHA", "Jinsha Site"
    );

    private static final Map<String, String> SITE_NAME_ZH = Map.of(
            "SANXINGDUI", "三星堆遗址",
            "JINSHA", "金沙遗址"
    );

    private static final Map<String, String> ERA_NAME_EN = Map.of(
            "LATE_SHU", "Late Ancient Shu",
            "JINSHA_TRANSITION", "Jinsha Transition"
    );

    private static final Map<String, String> ERA_NAME_ZH = Map.of(
            "LATE_SHU", "古蜀晚期",
            "JINSHA_TRANSITION", "古蜀传承阶段"
    );

    private static final Map<String, String> CRAFT_NAME_ZH = Map.ofEntries(
            Map.entry("SEGMENT_CASTING", "分段铸造"),
            Map.entry("ASSEMBLY_CASTING", "嵌铸工艺"),
            Map.entry("RIVETING", "铆接工艺"),
            Map.entry("BRONZE_CASTING", "青铜铸造"),
            Map.entry("SURFACE_DECORATION", "表面纹饰处理"),
            Map.entry("GOLD_HAMMERING", "金箔锤揲"),
            Map.entry("PATTERN_ENGRAVING", "纹饰刻画"),
            Map.entry("MASK_FORMING", "面具塑形")
    );

    @Resource
    private HeritageItemMapper heritageItemMapper;

    @Resource
    private SysFileInfoMapper sysFileInfoMapper;

    public SpacetimeSearchResponseDTO searchArtifacts(SpacetimeSearchRequestDTO requestDTO) {
        SpacetimeSearchRequestDTO safeRequest = requestDTO == null ? new SpacetimeSearchRequestDTO() : requestDTO;
        List<HeritageItem> items = heritageItemMapper.selectSpacetimeItems(
                trim(safeRequest.getEraCode()),
                trim(safeRequest.getSiteCode()),
                trim(safeRequest.getCraftCode())
        );
        List<HeritageItem> pool = loadPublishedArtifactsPool();

        Map<String, String> coverImageMap = loadCoverImageMap(items);
        List<CompetitionArtifactResponseDTO> artifacts = items.stream()
                .map(item -> toCompetitionArtifact(item, coverImageMap.getOrDefault(item.getId(), "")))
                .collect(Collectors.toList());

        long readyCount = artifacts.stream()
                .filter(dto -> Boolean.TRUE.equals(dto.getIsModelReady()))
                .count();

        SpacetimeSearchResponseDTO responseDTO = new SpacetimeSearchResponseDTO();
        responseDTO.setArtifacts(artifacts);
        responseDTO.setStats(new SpacetimeSearchStatsResponseDTO(artifacts.size(), (int) readyCount));
        responseDTO.setFacets(buildSearchFacets(pool, safeRequest));
        responseDTO.setNarrative(buildSearchNarrative(safeRequest, artifacts));
        return responseDTO;
    }

    public CompetitionArtifactResponseDTO getArtifactDetail(String entityId) {
        if (!StringUtils.hasText(entityId)) {
            return null;
        }

        HeritageItem item = loadPublishedItem(entityId);
        if (item == null) {
            return null;
        }

        Map<String, String> coverImageMap = loadCoverImageMap(List.of(item));
        return toCompetitionArtifact(item, coverImageMap.getOrDefault(item.getId(), ""));
    }

    public ArtifactGraphResponseDTO buildArtifactGraph(String entityId) {
        if (!StringUtils.hasText(entityId)) {
            return null;
        }

        HeritageItem item = loadPublishedItem(entityId);
        if (item == null) {
            return null;
        }

        Map<String, String> coverImageMap = loadCoverImageMap(List.of(item));
        List<HeritageItem> pool = loadPublishedArtifactsPool();
        ArtifactGraphResponseDTO responseDTO = createEmptyGraph();

        String artifactNodeId = buildArtifactNodeId(item.getId());
        responseDTO.setCenterNodeId(artifactNodeId);
        responseDTO.setNarrative(buildArtifactNarrative(item));

        responseDTO.getNodes().add(buildArtifactNode(item, coverImageMap.getOrDefault(item.getId(), ""), 100, false));

        appendSiteNode(responseDTO, item, pool);
        appendEraNode(responseDTO, item, pool);
        appendCraftNodes(responseDTO, item, pool);
        appendMeaningNodes(responseDTO, item, pool);

        finalizeGraph(responseDTO);
        return responseDTO;
    }

    public ArtifactGraphResponseDTO buildNodeNeighbors(String entityId, String nodeId, Integer depth) {
        if (!StringUtils.hasText(entityId) || !StringUtils.hasText(nodeId)) {
            return null;
        }

        HeritageItem centerItem = loadPublishedItem(entityId);
        if (centerItem == null) {
            return null;
        }

        int safeDepth = depth == null || depth < 1 ? 1 : depth;
        List<HeritageItem> pool = loadPublishedArtifactsPool();
        Map<String, String> coverImageMap = loadCoverImageMap(pool);

        ArtifactGraphResponseDTO responseDTO = createEmptyGraph();
        responseDTO.setCenterNodeId(nodeId);

        if (nodeId.startsWith(TYPE_SITE + ":")) {
            appendSiteNeighbors(responseDTO, centerItem, nodeId, pool, coverImageMap, safeDepth);
        } else if (nodeId.startsWith(TYPE_ERA + ":")) {
            appendEraNeighbors(responseDTO, centerItem, nodeId, pool, coverImageMap, safeDepth);
        } else if (nodeId.startsWith(TYPE_CRAFT + ":")) {
            appendCraftNeighbors(responseDTO, centerItem, nodeId, pool, coverImageMap, safeDepth);
        } else if (nodeId.startsWith(TYPE_MEANING + ":")) {
            appendMeaningNeighbors(responseDTO, centerItem, nodeId, pool, coverImageMap, safeDepth);
        } else if (nodeId.startsWith(TYPE_ARTIFACT + ":")) {
            String targetEntityId = nodeId.substring((TYPE_ARTIFACT + ":").length());
            HeritageItem artifactItem = loadPublishedItem(targetEntityId);
            if (artifactItem == null) {
                return null;
            }
            responseDTO = buildArtifactGraph(artifactItem.getId());
            responseDTO.setCenterNodeId(nodeId);
            return responseDTO;
        } else {
            return null;
        }

        finalizeGraph(responseDTO);
        return responseDTO;
    }

    private ArtifactGraphResponseDTO createEmptyGraph() {
        ArtifactGraphResponseDTO responseDTO = new ArtifactGraphResponseDTO();
        responseDTO.setStats(new ArtifactGraphStatsResponseDTO(0, 0, 0));
        return responseDTO;
    }

    private void appendSiteNode(ArtifactGraphResponseDTO responseDTO, HeritageItem item, List<HeritageItem> pool) {
        String siteCode = defaultString(item.getSiteCode(), "UNKNOWN_SITE");
        String siteLabel = defaultString(resolveSiteNameZh(item), siteCode);
        int relatedCount = countRelatedArtifacts(pool, candidate ->
                Objects.equals(trim(candidate.getSiteCode()), trim(item.getSiteCode())) && !Objects.equals(candidate.getId(), item.getId()));

        appendNode(
                responseDTO,
                new ArtifactGraphNodeResponseDTO(
                        TYPE_SITE + ":" + siteCode,
                        TYPE_SITE,
                        siteLabel,
                        null,
                        relatedCount > 0 ? "该遗址下还关联 " + relatedCount + " 件可继续追踪的文物。" : "当前样例中，这件文物是该遗址视角的代表入口。",
                        "",
                        82,
                        relatedCount > 0,
                        TYPE_SITE,
                        siteCode
                )
        );
        appendEdge(responseDTO, buildArtifactNodeId(item.getId()), TYPE_SITE + ":" + siteCode, "出土地", 2, "origin");
    }

    private void appendEraNode(ArtifactGraphResponseDTO responseDTO, HeritageItem item, List<HeritageItem> pool) {
        String eraCode = defaultString(item.getEraCode(), "UNKNOWN_ERA");
        String eraLabel = defaultString(resolveEraNameZh(item), eraCode);
        int relatedCount = countRelatedArtifacts(pool, candidate ->
                Objects.equals(trim(candidate.getEraCode()), trim(item.getEraCode())) && !Objects.equals(candidate.getId(), item.getId()));

        appendNode(
                responseDTO,
                new ArtifactGraphNodeResponseDTO(
                        TYPE_ERA + ":" + eraCode,
                        TYPE_ERA,
                        eraLabel,
                        null,
                        relatedCount > 0 ? "这一时代还可串起 " + relatedCount + " 件相关文物。" : "当前样例中，这件文物足以代表这一时代切面。",
                        "",
                        78,
                        relatedCount > 0,
                        TYPE_ERA,
                        eraCode
                )
        );
        appendEdge(responseDTO, buildArtifactNodeId(item.getId()), TYPE_ERA + ":" + eraCode, "所属时代", 2, "time");
    }

    private void appendCraftNodes(ArtifactGraphResponseDTO responseDTO, HeritageItem item, List<HeritageItem> pool) {
        List<String> craftCodes = splitCsv(item.getCraftCodes());
        List<String> craftNames = resolveCraftNamesZh(item);

        for (int index = 0; index < craftCodes.size(); index++) {
            String craftCode = craftCodes.get(index);
            String craftLabel = index < craftNames.size() ? craftNames.get(index) : craftCode;
            int relatedCount = countRelatedArtifacts(pool, candidate ->
                    splitCsv(candidate.getCraftCodes()).contains(craftCode) && !Objects.equals(candidate.getId(), item.getId()));

            appendNode(
                    responseDTO,
                    new ArtifactGraphNodeResponseDTO(
                            TYPE_CRAFT + ":" + craftCode,
                            TYPE_CRAFT,
                            craftLabel,
                            null,
                            relatedCount > 0 ? "这项工艺还出现在 " + relatedCount + " 件相关文物上。" : "当前样例中，这项工艺主要由这件文物承载展示。",
                            "",
                            72,
                            relatedCount > 0,
                            TYPE_CRAFT,
                            craftCode
                    )
            );
            appendEdge(responseDTO, buildArtifactNodeId(item.getId()), TYPE_CRAFT + ":" + craftCode, "采用工艺", 1, "craft");
        }
    }

    private void appendMeaningNodes(ArtifactGraphResponseDTO responseDTO, HeritageItem item, List<HeritageItem> pool) {
        List<String> meanings = splitCsv(item.getSymbolicMeaning());
        for (int index = 0; index < meanings.size(); index++) {
            String meaning = meanings.get(index);
            String meaningId = buildMeaningNodeId(meaning, index);
            int relatedCount = countRelatedArtifacts(pool, candidate ->
                    splitCsv(candidate.getSymbolicMeaning()).stream().anyMatch(current -> Objects.equals(trim(current), trim(meaning)))
                            && !Objects.equals(candidate.getId(), item.getId()));

            appendNode(
                    responseDTO,
                    new ArtifactGraphNodeResponseDTO(
                            meaningId,
                            TYPE_MEANING,
                            meaning,
                            null,
                            relatedCount > 0 ? "这一寓意还能串起 " + relatedCount + " 件相关文物。" : "这一寓意目前主要通过这件文物来理解。",
                            "",
                            68,
                            relatedCount > 0,
                            TYPE_MEANING,
                            meaning
                    )
            );
            appendEdge(responseDTO, buildArtifactNodeId(item.getId()), meaningId, "象征寓意", 1, "meaning");
        }
    }

    private void appendSiteNeighbors(ArtifactGraphResponseDTO responseDTO,
                                     HeritageItem centerItem,
                                     String nodeId,
                                     List<HeritageItem> pool,
                                     Map<String, String> coverImageMap,
                                     int depth) {
        String siteCode = defaultString(centerItem.getSiteCode(), "UNKNOWN_SITE");
        String siteLabel = defaultString(resolveSiteNameZh(centerItem), siteCode);
        appendNode(
                responseDTO,
                new ArtifactGraphNodeResponseDTO(nodeId, TYPE_SITE, siteLabel, null,
                        "从遗址视角展开，可继续看到同一空间中的相关文物。", "", 82, true, TYPE_SITE, siteCode)
        );

        List<HeritageItem> relatedArtifacts = pool.stream()
                .filter(item -> Objects.equals(trim(item.getSiteCode()), trim(centerItem.getSiteCode())))
                .limit(resolveNeighborLimit(depth))
                .collect(Collectors.toList());

        for (HeritageItem related : relatedArtifacts) {
            appendNode(responseDTO, buildArtifactNode(related, coverImageMap.getOrDefault(related.getId(), ""), related.getId().equals(centerItem.getId()) ? 100 : 64, true));
            appendEdge(responseDTO, buildArtifactNodeId(related.getId()), nodeId, "出土地", 1, "origin");
        }

        responseDTO.setNarrative(siteLabel + "并不只对应一件展品，它更像一处不断向外延展的文物现场。");
    }

    private void appendEraNeighbors(ArtifactGraphResponseDTO responseDTO,
                                    HeritageItem centerItem,
                                    String nodeId,
                                    List<HeritageItem> pool,
                                    Map<String, String> coverImageMap,
                                    int depth) {
        String eraCode = defaultString(centerItem.getEraCode(), "UNKNOWN_ERA");
        String eraLabel = defaultString(resolveEraNameZh(centerItem), eraCode);
        appendNode(
                responseDTO,
                new ArtifactGraphNodeResponseDTO(nodeId, TYPE_ERA, eraLabel, null,
                        "从时代切面展开，可看到同一历史阶段中共享语汇的文物。", "", 78, true, TYPE_ERA, eraCode)
        );

        List<HeritageItem> relatedArtifacts = pool.stream()
                .filter(item -> Objects.equals(trim(item.getEraCode()), trim(centerItem.getEraCode())))
                .limit(resolveNeighborLimit(depth))
                .collect(Collectors.toList());

        for (HeritageItem related : relatedArtifacts) {
            appendNode(responseDTO, buildArtifactNode(related, coverImageMap.getOrDefault(related.getId(), ""), related.getId().equals(centerItem.getId()) ? 100 : 64, true));
            appendEdge(responseDTO, buildArtifactNodeId(related.getId()), nodeId, "所属时代", 1, "time");
        }

        responseDTO.setNarrative(eraLabel + "不是一条孤立时间线，而是一组器物与观念共同出现的历史切面。");
    }

    private void appendCraftNeighbors(ArtifactGraphResponseDTO responseDTO,
                                      HeritageItem centerItem,
                                      String nodeId,
                                      List<HeritageItem> pool,
                                      Map<String, String> coverImageMap,
                                      int depth) {
        String craftCode = nodeId.substring((TYPE_CRAFT + ":").length());
        String craftLabel = defaultString(safeLookup(CRAFT_NAME_ZH, craftCode), craftCode);
        appendNode(
                responseDTO,
                new ArtifactGraphNodeResponseDTO(nodeId, TYPE_CRAFT, craftLabel, null,
                        "从工艺视角展开，可看到同一技法如何跨越多件文物出现。", "", 72, true, TYPE_CRAFT, craftCode)
        );

        List<HeritageItem> relatedArtifacts = pool.stream()
                .filter(item -> splitCsv(item.getCraftCodes()).contains(craftCode))
                .limit(resolveNeighborLimit(depth))
                .collect(Collectors.toList());

        for (HeritageItem related : relatedArtifacts) {
            appendNode(responseDTO, buildArtifactNode(related, coverImageMap.getOrDefault(related.getId(), ""), related.getId().equals(centerItem.getId()) ? 100 : 64, true));
            appendEdge(responseDTO, buildArtifactNodeId(related.getId()), nodeId, "采用工艺", 1, "craft");
        }

        responseDTO.setNarrative(craftLabel + "不是孤立标签，它会在不同文物上反复出现，形成一条可追踪的技艺线。");
    }

    private void appendMeaningNeighbors(ArtifactGraphResponseDTO responseDTO,
                                        HeritageItem centerItem,
                                        String nodeId,
                                        List<HeritageItem> pool,
                                        Map<String, String> coverImageMap,
                                        int depth) {
        ArtifactGraphResponseDTO centerGraph = buildArtifactGraph(centerItem.getId());
        ArtifactGraphNodeResponseDTO meaningNode = centerGraph == null ? null : centerGraph.getNodes().stream()
                .filter(node -> Objects.equals(node.getId(), nodeId))
                .findFirst()
                .orElse(null);

        String meaningLabel = meaningNode != null ? meaningNode.getLabel() : nodeId.substring((TYPE_MEANING + ":").length());
        appendNode(
                responseDTO,
                new ArtifactGraphNodeResponseDTO(nodeId, TYPE_MEANING, meaningLabel, null,
                        "从文化寓意展开，可看到不同文物如何共享相近的精神线索。", "", 68, true, TYPE_MEANING, meaningLabel)
        );

        List<HeritageItem> relatedArtifacts = pool.stream()
                .filter(item -> splitCsv(item.getSymbolicMeaning()).stream().anyMatch(current -> Objects.equals(trim(current), trim(meaningLabel))))
                .limit(resolveNeighborLimit(depth))
                .collect(Collectors.toList());

        for (HeritageItem related : relatedArtifacts) {
            appendNode(responseDTO, buildArtifactNode(related, coverImageMap.getOrDefault(related.getId(), ""), related.getId().equals(centerItem.getId()) ? 100 : 64, true));
            appendEdge(responseDTO, buildArtifactNodeId(related.getId()), nodeId, "象征寓意", 1, "meaning");
        }

        responseDTO.setNarrative(meaningLabel + "不是单件文物的注脚，它更像古蜀文明反复出现的一种精神回声。");
    }

    private ArtifactGraphNodeResponseDTO buildArtifactNode(HeritageItem item, String image, int importance, boolean expandable) {
        String routeTarget = item.getId();
        String summary = defaultString(trim(item.getSummary()), buildDisplayTitle(item.getTitle()));
        return new ArtifactGraphNodeResponseDTO(
                buildArtifactNodeId(item.getId()),
                TYPE_ARTIFACT,
                buildDisplayTitle(item.getTitle()),
                item.getId(),
                summary,
                defaultString(image, ""),
                importance,
                expandable,
                TYPE_ARTIFACT,
                routeTarget
        );
    }

    private void appendNode(ArtifactGraphResponseDTO responseDTO, ArtifactGraphNodeResponseDTO candidate) {
        boolean exists = responseDTO.getNodes().stream().anyMatch(node -> Objects.equals(node.getId(), candidate.getId()));
        if (!exists) {
            responseDTO.getNodes().add(candidate);
        }
    }

    private void appendEdge(ArtifactGraphResponseDTO responseDTO,
                            String source,
                            String target,
                            String label,
                            int weight,
                            String category) {
        String edgeId = source + "->" + target + ":" + category;
        boolean exists = responseDTO.getEdges().stream().anyMatch(edge -> Objects.equals(edge.getId(), edgeId));
        if (!exists) {
            responseDTO.getEdges().add(new ArtifactGraphEdgeResponseDTO(edgeId, source, target, label, weight, category));
        }
    }

    private void finalizeGraph(ArtifactGraphResponseDTO responseDTO) {
        Set<String> typeSet = new LinkedHashSet<>();
        int expandableCount = 0;
        for (ArtifactGraphNodeResponseDTO node : responseDTO.getNodes()) {
            if (StringUtils.hasText(node.getType())) {
                typeSet.add(node.getType());
            }
            if (Boolean.TRUE.equals(node.getExpandable())) {
                expandableCount++;
            }
        }
        responseDTO.setAvailableTypes(new ArrayList<>(typeSet));
        responseDTO.setStats(new ArtifactGraphStatsResponseDTO(
                responseDTO.getNodes().size(),
                responseDTO.getEdges().size(),
                expandableCount
        ));
    }

    private HeritageItem loadPublishedItem(String entityId) {
        HeritageItem item = heritageItemMapper.selectById(entityId);
        if (item == null || !Objects.equals(item.getStatus(), 2)) {
            return null;
        }
        return item;
    }

    private SpacetimeSearchFacetsResponseDTO buildSearchFacets(List<HeritageItem> pool, SpacetimeSearchRequestDTO requestDTO) {
        SpacetimeSearchFacetsResponseDTO facets = new SpacetimeSearchFacetsResponseDTO();
        facets.setSiteOptions(buildSiteFacetOptions(pool, requestDTO));
        facets.setEraOptions(buildEraFacetOptions(pool, requestDTO));
        facets.setCraftOptions(buildCraftFacetOptions(pool, requestDTO));
        return facets;
    }

    private List<SpacetimeFacetOptionResponseDTO> buildSiteFacetOptions(List<HeritageItem> pool, SpacetimeSearchRequestDTO requestDTO) {
        String eraCode = trim(requestDTO.getEraCode());
        String craftCode = trim(requestDTO.getCraftCode());

        return pool.stream()
                .filter(item -> matchEra(item, eraCode))
                .filter(item -> matchCraft(item, craftCode))
                .filter(item -> StringUtils.hasText(item.getSiteCode()))
                .collect(Collectors.groupingBy(HeritageItem::getSiteCode, LinkedHashMap::new, Collectors.toList()))
                .entrySet()
                .stream()
                .map(entry -> buildFacetOption(
                        entry.getKey(),
                        defaultString(resolveSiteNameZh(entry.getValue().get(0)), entry.getKey()),
                        entry.getValue(),
                        null,
                        null
                ))
                .collect(Collectors.toList());
    }

    private List<SpacetimeFacetOptionResponseDTO> buildEraFacetOptions(List<HeritageItem> pool, SpacetimeSearchRequestDTO requestDTO) {
        String siteCode = trim(requestDTO.getSiteCode());
        String craftCode = trim(requestDTO.getCraftCode());

        return pool.stream()
                .filter(item -> matchSite(item, siteCode))
                .filter(item -> matchCraft(item, craftCode))
                .filter(item -> StringUtils.hasText(item.getEraCode()))
                .collect(Collectors.groupingBy(HeritageItem::getEraCode, LinkedHashMap::new, Collectors.toList()))
                .entrySet()
                .stream()
                .map(entry -> {
                    List<HeritageItem> items = entry.getValue();
                    Integer minYear = items.stream()
                            .map(HeritageItem::getTimeStartYear)
                            .filter(Objects::nonNull)
                            .min(Integer::compareTo)
                            .orElse(null);
                    Integer maxYear = items.stream()
                            .map(HeritageItem::getTimeEndYear)
                            .filter(Objects::nonNull)
                            .max(Integer::compareTo)
                            .orElse(null);
                    return buildFacetOption(
                            entry.getKey(),
                            defaultString(resolveEraNameZh(items.get(0)), entry.getKey()),
                            items,
                            minYear,
                            maxYear
                    );
                })
                .collect(Collectors.toList());
    }

    private List<SpacetimeFacetOptionResponseDTO> buildCraftFacetOptions(List<HeritageItem> pool, SpacetimeSearchRequestDTO requestDTO) {
        String siteCode = trim(requestDTO.getSiteCode());
        String eraCode = trim(requestDTO.getEraCode());
        Map<String, List<HeritageItem>> buckets = new LinkedHashMap<>();

        pool.stream()
                .filter(item -> matchSite(item, siteCode))
                .filter(item -> matchEra(item, eraCode))
                .forEach(item -> splitCsv(item.getCraftCodes())
                        .forEach(craftCode -> buckets.computeIfAbsent(craftCode, key -> new ArrayList<>()).add(item)));

        return buckets.entrySet().stream()
                .map(entry -> buildFacetOption(
                        entry.getKey(),
                        defaultString(safeLookup(CRAFT_NAME_ZH, entry.getKey()), entry.getKey()),
                        entry.getValue(),
                        null,
                        null
                ))
                .collect(Collectors.toList());
    }

    private SpacetimeFacetOptionResponseDTO buildFacetOption(
            String value,
            String label,
            List<HeritageItem> items,
            Integer timeStartYear,
            Integer timeEndYear
    ) {
        SpacetimeFacetOptionResponseDTO option = new SpacetimeFacetOptionResponseDTO();
        option.setValue(value);
        option.setLabel(label);
        option.setArtifactCount(items.size());
        option.setReadyModelCount((int) items.stream().filter(item -> StringUtils.hasText(trim(item.getGlbUrl()))).count());
        option.setTimeStartYear(timeStartYear);
        option.setTimeEndYear(timeEndYear);
        return option;
    }

    private List<HeritageItem> loadPublishedArtifactsPool() {
        return heritageItemMapper.selectSpacetimeItems(null, null, null);
    }

    private CompetitionArtifactResponseDTO pickRecommendedArtifact(List<CompetitionArtifactResponseDTO> artifacts) {
        return artifacts.stream()
                .sorted((left, right) -> Integer.compare(scoreArtifact(right), scoreArtifact(left)))
                .findFirst()
                .orElse(null);
    }

    private int scoreArtifact(CompetitionArtifactResponseDTO artifact) {
        int score = 0;
        if (Boolean.TRUE.equals(artifact.getIsModelReady())) {
            score += 100;
        }
        if (StringUtils.hasText(trim(artifact.getSymbolicMeaning()))) {
            score += 30;
        }
        if (artifact.getCraftCodes() != null) {
            score += artifact.getCraftCodes().size() > 1 ? 24 : artifact.getCraftCodes().size() == 1 ? 12 : 0;
        }
        if (StringUtils.hasText(trim(artifact.getSummary()))) {
            score += 8;
        }
        if (StringUtils.hasText(trim(artifact.getCardImage()))) {
            score += 4;
        }
        return score;
    }

    private String buildRecommendedReason(CompetitionArtifactResponseDTO artifact) {
        List<String> reasons = new ArrayList<>();
        if (Boolean.TRUE.equals(artifact.getIsModelReady())) {
            reasons.add("已具备 3D 模型");
        }
        if (StringUtils.hasText(trim(artifact.getSymbolicMeaning()))) {
            reasons.add("寓意线索更完整");
        }
        if (artifact.getCraftCodes() != null && artifact.getCraftCodes().size() > 1) {
            reasons.add("关联工艺更丰富");
        } else if (artifact.getCraftCodes() != null && artifact.getCraftCodes().size() == 1) {
            reasons.add("工艺特征清晰");
        }
        return reasons.isEmpty()
                ? "当前文物的信息完整度更高，适合作为这一轮讲述入口。"
                : "优先推荐理由：" + String.join("、", reasons) + "。";
    }

    private SpacetimeSearchNarrativeResponseDTO buildSearchNarrative(
            SpacetimeSearchRequestDTO requestDTO,
            List<CompetitionArtifactResponseDTO> artifacts
    ) {
        SpacetimeSearchNarrativeResponseDTO narrative = new SpacetimeSearchNarrativeResponseDTO();
        CompetitionArtifactResponseDTO recommendedArtifact = pickRecommendedArtifact(artifacts);
        String currentEraLabel = resolveCurrentEraLabel(requestDTO);
        String currentSiteLabel = resolveCurrentSiteLabel(requestDTO);
        String currentCraftLabel = resolveCurrentCraftLabel(requestDTO);
        int readyCount = (int) artifacts.stream().filter(item -> Boolean.TRUE.equals(item.getIsModelReady())).count();

        if (!StringUtils.hasText(trim(requestDTO.getEraCode()))
                && !StringUtils.hasText(trim(requestDTO.getSiteCode()))
                && !StringUtils.hasText(trim(requestDTO.getCraftCode()))) {
            narrative.setEntryLine("从首页进入后，先在这里定下时代、遗址与工艺，文物展厅、3D 舞台与玄喵讲解都会沿着你的选择继续展开。");
        } else {
            narrative.setEntryLine("你已经把视线落在“" + currentEraLabel + " / " + currentSiteLabel + " / " + currentCraftLabel + "”这组坐标上，下一站会顺着这条线索继续向前。");
        }

        if (recommendedArtifact != null) {
            String yearText = defaultString(recommendedArtifact.getYearLabel(), recommendedArtifact.getEraLabel());
            String siteText = defaultString(recommendedArtifact.getSiteLabel(), "古蜀遗址");
            narrative.setSceneLine(yearText + "，" + siteText + "的人们正在围绕 " + recommendedArtifact.getDisplayTitle() + " 展开祭祀与铸造活动。");
            narrative.setRecommendedArtifactId(recommendedArtifact.getEntityId());
            narrative.setRecommendedReason(buildRecommendedReason(recommendedArtifact));
        } else {
            narrative.setSceneLine("请先落下一枚坐标，让这条展线带你走进正在发生的古蜀现场。");
            narrative.setRecommendedReason("当前条件下暂未命中合适的焦点文物，可以先放宽筛选条件。");
        }

        if (artifacts.isEmpty()) {
            narrative.setResultLine("当前筛选条件下暂未命中文物，可以放宽时代、切换遗址，或取消工艺筛选后继续探索。");
        } else if (artifacts.size() == 1) {
            narrative.setResultLine(readyCount > 0
                    ? "当前命中 1 件核心文物，且已具备 3D 模型，可直接进入 3D 展示或 AI 解说继续深入。"
                    : "当前命中 1 件核心文物，可先进入 AI 解说，再决定是否继续查看展厅。");
        } else {
            narrative.setResultLine("当前命中 " + artifacts.size() + " 件核心文物，其中 " + readyCount + " 件可进入 3D，建议先浏览结果卡片，再进入展厅查看完整集合。");
        }

        narrative.setEmptyLine("这也正好说明，不是所有时代和工艺的交叉都有文物出土；三星堆的发现本身就是有选择性的。");
        return narrative;
    }

    private String resolveCurrentSiteLabel(SpacetimeSearchRequestDTO requestDTO) {
        String siteCode = trim(requestDTO.getSiteCode());
        return StringUtils.hasText(siteCode) ? defaultString(safeLookup(SITE_NAME_ZH, siteCode), siteCode) : "全部遗址";
    }

    private String resolveCurrentEraLabel(SpacetimeSearchRequestDTO requestDTO) {
        String eraCode = trim(requestDTO.getEraCode());
        return StringUtils.hasText(eraCode) ? defaultString(safeLookup(ERA_NAME_ZH, eraCode), eraCode) : "全部时代";
    }

    private String resolveCurrentCraftLabel(SpacetimeSearchRequestDTO requestDTO) {
        String craftCode = trim(requestDTO.getCraftCode());
        return StringUtils.hasText(craftCode) ? defaultString(safeLookup(CRAFT_NAME_ZH, craftCode), craftCode) : "全部工艺";
    }

    private boolean matchSite(HeritageItem item, String siteCode) {
        return !StringUtils.hasText(siteCode) || Objects.equals(trim(item.getSiteCode()), siteCode);
    }

    private boolean matchEra(HeritageItem item, String eraCode) {
        return !StringUtils.hasText(eraCode) || Objects.equals(trim(item.getEraCode()), eraCode);
    }

    private boolean matchCraft(HeritageItem item, String craftCode) {
        return !StringUtils.hasText(craftCode) || splitCsv(item.getCraftCodes()).contains(craftCode);
    }

    private int countRelatedArtifacts(List<HeritageItem> pool, Predicate<HeritageItem> predicate) {
        return (int) pool.stream().filter(predicate).count();
    }

    private int resolveNeighborLimit(int depth) {
        return Math.max(6, depth * 12);
    }

    private String buildArtifactNarrative(HeritageItem item) {
        String site = defaultString(resolveSiteNameZh(item), "古蜀遗址");
        String era = defaultString(resolveEraNameZh(item), "古蜀时代");
        List<String> crafts = resolveCraftNamesZh(item);
        List<String> meanings = splitCsv(item.getSymbolicMeaning());

        String craftText = crafts.isEmpty() ? "工艺线索" : crafts.stream().limit(2).collect(Collectors.joining("、"));
        String meaningText = meanings.isEmpty() ? "文化象征" : meanings.stream().limit(2).collect(Collectors.joining("、"));
        return "这件文物并非孤立展出，它与 " + site + "、" + era + " 的 " + craftText + " 和 " + meaningText + " 共同构成了一条可继续追踪的古蜀线索。";
    }

    private CompetitionArtifactResponseDTO toCompetitionArtifact(HeritageItem item, String coverImage) {
        CompetitionArtifactResponseDTO dto = new CompetitionArtifactResponseDTO();
        String siteNameZh = resolveSiteNameZh(item);
        String eraNameZh = resolveEraNameZh(item);
        List<String> craftCodes = splitCsv(item.getCraftCodes());
        List<String> craftNamesZh = resolveCraftNamesZh(item);
        List<String> symbolicMeaningZh = splitCsv(item.getSymbolicMeaning());
        String glbUrl = trim(item.getGlbUrl());
        boolean isModelReady = StringUtils.hasText(glbUrl);

        dto.setEntityId(item.getId());
        dto.setTitle(item.getTitle());
        dto.setDisplayTitle(buildDisplayTitle(item.getTitle()));
        dto.setCategory(item.getCategory());
        dto.setRegion(item.getRegion());
        dto.setSiteCode(item.getSiteCode());
        dto.setSiteName(defaultString(safeLookup(SITE_NAME_EN, item.getSiteCode()), defaultString(siteNameZh, item.getSiteCode())));
        dto.setSiteNameZh(siteNameZh);
        dto.setSiteLabel(defaultString(siteNameZh, item.getSiteCode()));
        dto.setEraCode(item.getEraCode());
        dto.setEraName(defaultString(safeLookup(ERA_NAME_EN, item.getEraCode()), defaultString(eraNameZh, item.getEraCode())));
        dto.setEraNameZh(eraNameZh);
        dto.setEraLabel(defaultString(eraNameZh, item.getEraCode()));
        dto.setTimeStartYear(item.getTimeStartYear());
        dto.setTimeEndYear(item.getTimeEndYear());
        dto.setYearLabel(formatYearRange(item.getTimeStartYear(), item.getTimeEndYear()));
        dto.setCraftCodes(craftCodes);
        dto.setCraftNamesZh(craftNamesZh);
        dto.setCraftLabel(String.join(" / ", craftNamesZh));
        dto.setSummary(item.getSummary());
        dto.setDescription(item.getDescription());
        dto.setSymbolicMeaning(symbolicMeaningZh.isEmpty() ? "" : symbolicMeaningZh.get(0));
        dto.setSymbolicMeaningZh(symbolicMeaningZh);
        dto.setResolvedGlbUrl(defaultString(glbUrl, null));
        dto.setCoverImage(defaultString(coverImage, ""));
        dto.setCardImage(defaultString(coverImage, ""));
        dto.setModelStatus(isModelReady ? "ready" : "missing");
        dto.setIsModelReady(isModelReady);
        return dto;
    }

    private Map<String, String> loadCoverImageMap(List<HeritageItem> items) {
        List<String> businessIds = items.stream()
                .map(HeritageItem::getId)
                .filter(StringUtils::hasText)
                .distinct()
                .collect(Collectors.toList());

        if (businessIds.isEmpty()) {
            return Collections.emptyMap();
        }

        LambdaQueryWrapper<SysFileInfo> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(SysFileInfo::getBusinessType, "HERITAGE_ITEM")
                .eq(SysFileInfo::getBusinessField, "cover")
                .eq(SysFileInfo::getStatus, 1)
                .in(SysFileInfo::getBusinessId, businessIds)
                .orderByDesc(SysFileInfo::getCreateTime);

        List<SysFileInfo> files = sysFileInfoMapper.selectList(queryWrapper);
        return files.stream()
                .filter(file -> StringUtils.hasText(file.getBusinessId()))
                .collect(Collectors.toMap(
                        SysFileInfo::getBusinessId,
                        file -> defaultString(file.getFilePath(), ""),
                        (left, right) -> left,
                        LinkedHashMap::new
                ));
    }

    private String resolveSiteNameZh(HeritageItem item) {
        return defaultString(trim(item.getSiteName()), safeLookup(SITE_NAME_ZH, item.getSiteCode()));
    }

    private String resolveEraNameZh(HeritageItem item) {
        return defaultString(trim(item.getEraName()), safeLookup(ERA_NAME_ZH, item.getEraCode()));
    }

    private List<String> resolveCraftNamesZh(HeritageItem item) {
        List<String> directNames = splitCsv(item.getCraftNames());
        if (!directNames.isEmpty()) {
            return directNames;
        }

        return splitCsv(item.getCraftCodes()).stream()
                .map(code -> defaultString(safeLookup(CRAFT_NAME_ZH, code), code))
                .collect(Collectors.toList());
    }

    private String buildDisplayTitle(String title) {
        if (!StringUtils.hasText(title)) {
            return "";
        }

        int chineseBracketIndex = title.indexOf('（');
        int englishBracketIndex = title.indexOf('(');
        int cutIndex = chineseBracketIndex >= 0 ? chineseBracketIndex : englishBracketIndex;
        if (cutIndex > 0) {
            return title.substring(0, cutIndex).trim();
        }
        return title.trim();
    }

    private List<String> splitCsv(String csv) {
        if (!StringUtils.hasText(csv)) {
            return new ArrayList<>();
        }

        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .collect(Collectors.toList());
    }

    private String formatYearRange(Integer startYear, Integer endYear) {
        if (startYear == null || endYear == null) {
            return "";
        }
        return formatYear(startYear) + " - " + formatYear(endYear);
    }

    private String formatYear(Integer year) {
        if (year == null) {
            return "";
        }
        if (year < 0) {
            return "公元前 " + Math.abs(year);
        }
        return "公元 " + year;
    }

    private String buildArtifactNodeId(String entityId) {
        return TYPE_ARTIFACT + ":" + entityId;
    }

    private String buildMeaningNodeId(String meaning, int fallbackIndex) {
        return TYPE_MEANING + ":" + sanitizeNodeSuffix(meaning, fallbackIndex);
    }

    private String sanitizeNodeSuffix(String input, int fallbackIndex) {
        if (!StringUtils.hasText(input)) {
            return "item-" + fallbackIndex;
        }
        String normalized = input.toLowerCase(Locale.ROOT)
                .replaceAll("[^\\p{IsAlphabetic}\\p{IsDigit}\\u4e00-\\u9fa5]+", "-")
                .replaceAll("-{2,}", "-")
                .replaceAll("^-|-$", "");
        return StringUtils.hasText(normalized) ? normalized : "item-" + fallbackIndex;
    }

    private String defaultString(String value, String fallback) {
        return StringUtils.hasText(value) ? value : fallback;
    }

    private String safeLookup(Map<String, String> dictionary, String key) {
        if (dictionary == null || !StringUtils.hasText(key)) {
            return null;
        }
        return dictionary.get(key);
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}
