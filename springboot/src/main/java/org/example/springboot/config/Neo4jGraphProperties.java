package org.example.springboot.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "graph.neo4j")
public class Neo4jGraphProperties {

    private boolean enabled = false;

    private String uri = "bolt://localhost:7687";

    private String username = "neo4j";

    private String password = "password";

    private String database = "";
}
