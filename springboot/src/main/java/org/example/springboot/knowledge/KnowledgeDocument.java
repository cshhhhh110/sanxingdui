package org.example.springboot.knowledge;

import java.time.Instant;
import java.util.List;
import java.util.Map;

record KnowledgeDocument(
        String path,
        String title,
        String type,
        String status,
        List<String> tags,
        List<String> related,
        List<String> sources,
        List<String> links,
        String markdown,
        String plainText,
        String hash,
        Instant modifiedAt,
        Map<String, Integer> termFrequency
) {
}
