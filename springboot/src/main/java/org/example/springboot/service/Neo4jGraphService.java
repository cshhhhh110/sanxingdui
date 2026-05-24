package org.example.springboot.service;

import lombok.extern.slf4j.Slf4j;
import org.example.springboot.config.Neo4jGraphProperties;
import org.example.springboot.dto.response.ArtifactGraphEdgeResponseDTO;
import org.example.springboot.dto.response.ArtifactGraphNodeResponseDTO;
import org.example.springboot.dto.response.ArtifactGraphResponseDTO;
import org.example.springboot.dto.response.ArtifactGraphStatsResponseDTO;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Record;
import org.neo4j.driver.Session;
import org.neo4j.driver.SessionConfig;
import org.neo4j.driver.Value;
import org.neo4j.driver.Values;
import org.neo4j.driver.types.Node;
import org.neo4j.driver.types.Relationship;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Slf4j
@Service
@ConditionalOnBean(Driver.class)
public class Neo4jGraphService {

    private final Driver driver;
    private final Neo4jGraphProperties properties;

    public Neo4jGraphService(Driver driver, Neo4jGraphProperties properties) {
        this.driver = driver;
        this.properties = properties;
    }

    public ArtifactGraphResponseDTO buildArtifactGraph(String entityId) {
        if (!StringUtils.hasText(entityId)) {
            return null;
        }

        String cypher = """
                MATCH (center:Artifact {entityId: $entityId})
                OPTIONAL MATCH (center)-[r]-(neighbor)
                RETURN center,
                       collect(DISTINCT neighbor) AS neighbors,
                       collect(DISTINCT r) AS relationships
                """;

        return readGraph(cypher, Values.parameters("entityId", entityId), "artifact:" + entityId);
    }

    public ArtifactGraphResponseDTO buildNodeNeighbors(String entityId, String nodeId, Integer depth) {
        if (!StringUtils.hasText(entityId) || !StringUtils.hasText(nodeId)) {
            return null;
        }

        int safeDepth = depth == null || depth < 1 ? 1 : Math.min(depth, 2);
        String cypher = """
                MATCH (center {id: $nodeId})
                OPTIONAL MATCH (center)-[r*1..%d]-(neighbor)
                WITH center,
                     [node IN collect(DISTINCT neighbor) WHERE node IS NOT NULL] AS neighbors,
                     reduce(allRels = [], relPath IN collect(r) | allRels + relPath) AS rels
                RETURN center,
                       neighbors,
                       [rel IN rels WHERE rel IS NOT NULL] AS relationships
                """.formatted(safeDepth);

        return readGraph(cypher, Values.parameters("nodeId", nodeId), nodeId);
    }

    private ArtifactGraphResponseDTO readGraph(String cypher, Value parameters, String centerNodeId) {
        try (Session session = driver.session(sessionConfig())) {
            return session.executeRead(tx -> {
                List<Record> records = tx.run(cypher, parameters).list();
                if (records.isEmpty()) {
                    return null;
                }
                return mapRecord(records.get(0), centerNodeId);
            });
        } catch (Exception ex) {
            log.warn("Neo4j graph query failed, falling back to MySQL graph. reason={}", ex.getMessage());
            return null;
        }
    }

    private ArtifactGraphResponseDTO mapRecord(Record record, String centerNodeId) {
        ArtifactGraphResponseDTO responseDTO = new ArtifactGraphResponseDTO();
        responseDTO.setCenterNodeId(centerNodeId);
        responseDTO.setNarrative("这张图谱来自 Neo4j 知识图谱，可沿文物、遗址、时代、工艺与象征意义继续展开。");

        Map<String, ArtifactGraphNodeResponseDTO> nodesByGraphId = new LinkedHashMap<>();
        Map<String, String> graphIdByElementId = new LinkedHashMap<>();

        addNode(record.get("center").asNode(), nodesByGraphId, graphIdByElementId);
        for (Value value : record.get("neighbors").values()) {
            if (!value.isNull()) {
                addNode(value.asNode(), nodesByGraphId, graphIdByElementId);
            }
        }

        Map<String, ArtifactGraphEdgeResponseDTO> edgesById = new LinkedHashMap<>();
        for (Value value : record.get("relationships").values()) {
            if (!value.isNull()) {
                addEdge(value.asRelationship(), graphIdByElementId, edgesById);
            }
        }

        responseDTO.setNodes(new ArrayList<>(nodesByGraphId.values()));
        responseDTO.setEdges(new ArrayList<>(edgesById.values()));
        finalizeGraph(responseDTO);
        return responseDTO.getNodes().isEmpty() ? null : responseDTO;
    }

    private void addNode(Node node,
                         Map<String, ArtifactGraphNodeResponseDTO> nodesByGraphId,
                         Map<String, String> graphIdByElementId) {
        String type = stringProperty(node, "type", firstLabel(node));
        String id = stringProperty(node, "id", type + ":" + node.elementId());
        String entityId = stringProperty(node, "entityId", routeTargetFromId(id));

        graphIdByElementId.put(node.elementId(), id);
        nodesByGraphId.putIfAbsent(id, new ArtifactGraphNodeResponseDTO(
                id,
                type,
                stringProperty(node, "label", id),
                entityId,
                stringProperty(node, "summary", ""),
                stringProperty(node, "image", ""),
                intProperty(node, "importance", defaultImportance(type)),
                booleanProperty(node, "expandable", !"artifact".equals(type)),
                stringProperty(node, "routeType", type),
                stringProperty(node, "routeTarget", routeTargetFromId(id))
        ));
    }

    private void addEdge(Relationship relationship,
                         Map<String, String> graphIdByElementId,
                         Map<String, ArtifactGraphEdgeResponseDTO> edgesById) {
        String source = graphIdByElementId.get(relationship.startNodeElementId());
        String target = graphIdByElementId.get(relationship.endNodeElementId());
        if (!StringUtils.hasText(source) || !StringUtils.hasText(target)) {
            return;
        }

        String category = stringProperty(relationship, "category", relationship.type().toLowerCase());
        String edgeId = source + "->" + target + ":" + category;
        edgesById.putIfAbsent(edgeId, new ArtifactGraphEdgeResponseDTO(
                edgeId,
                source,
                target,
                stringProperty(relationship, "label", relationship.type()),
                intProperty(relationship, "weight", 1),
                category
        ));
    }

    private SessionConfig sessionConfig() {
        if (StringUtils.hasText(properties.getDatabase())) {
            return SessionConfig.builder().withDatabase(properties.getDatabase()).build();
        }
        return SessionConfig.defaultConfig();
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

    private String firstLabel(Node node) {
        for (String label : node.labels()) {
            return label.toLowerCase();
        }
        return "node";
    }

    private String routeTargetFromId(String id) {
        int index = id.indexOf(':');
        return index >= 0 && index + 1 < id.length() ? id.substring(index + 1) : id;
    }

    private int defaultImportance(String type) {
        if (Objects.equals(type, "artifact")) {
            return 100;
        }
        if (Objects.equals(type, "site")) {
            return 82;
        }
        if (Objects.equals(type, "era")) {
            return 78;
        }
        if (Objects.equals(type, "craft")) {
            return 72;
        }
        return 68;
    }

    private String stringProperty(org.neo4j.driver.types.Entity entity, String key, String fallback) {
        Value value = entity.get(key);
        return value.isNull() ? fallback : value.asString(fallback);
    }

    private int intProperty(org.neo4j.driver.types.Entity entity, String key, int fallback) {
        Value value = entity.get(key);
        return value.isNull() ? fallback : value.asInt(fallback);
    }

    private boolean booleanProperty(org.neo4j.driver.types.Entity entity, String key, boolean fallback) {
        Value value = entity.get(key);
        return value.isNull() ? fallback : value.asBoolean(fallback);
    }
}
