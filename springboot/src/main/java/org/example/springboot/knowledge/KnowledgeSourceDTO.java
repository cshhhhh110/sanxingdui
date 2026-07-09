package org.example.springboot.knowledge;

import java.util.List;

public record KnowledgeSourceDTO(
        String path,
        String title,
        String type,
        String status,
        List<String> tags,
        List<String> related,
        List<String> sources,
        String excerpt,
        String content,
        double score,
        String obsidianUri,
        String openUrl
) {
}
