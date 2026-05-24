package org.example.springboot.config;

import org.neo4j.driver.AuthTokens;
import org.neo4j.driver.Driver;
import org.neo4j.driver.GraphDatabase;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(Neo4jGraphProperties.class)
public class Neo4jGraphConfig {

    @Bean(destroyMethod = "close")
    @ConditionalOnProperty(prefix = "graph.neo4j", name = "enabled", havingValue = "true")
    public Driver neo4jDriver(Neo4jGraphProperties properties) {
        return GraphDatabase.driver(
                properties.getUri(),
                AuthTokens.basic(properties.getUsername(), properties.getPassword())
        );
    }
}
