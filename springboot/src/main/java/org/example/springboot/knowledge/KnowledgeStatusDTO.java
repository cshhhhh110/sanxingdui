package org.example.springboot.knowledge;

import java.time.Instant;
import java.util.List;

public record KnowledgeStatusDTO(
        boolean enabled,
        boolean available,
        String root,
        int indexedDocuments,
        Instant lastSyncAt,
        long lastSyncDurationMs,
        int reusedDocuments,
        int parsedDocuments,
        List<String> errors
) {
}
