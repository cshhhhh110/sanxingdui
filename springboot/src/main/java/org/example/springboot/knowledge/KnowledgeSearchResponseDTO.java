package org.example.springboot.knowledge;

import java.util.List;

public record KnowledgeSearchResponseDTO(
        String query,
        int indexedDocuments,
        List<KnowledgeSourceDTO> documents,
        String context
) {
}
