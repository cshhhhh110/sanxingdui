package org.example.springboot.knowledge;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class KnowledgeIndexService {

    private static final int MAX_LIMIT = 8;
    private static final int MAX_CONTEXT_CHARS = 7000;
    private static final int MAX_DOCUMENT_CONTEXT_CHARS = 2200;

    private final KnowledgeMarkdownParser parser;
    private final AtomicReference<IndexSnapshot> snapshot = new AtomicReference<>(IndexSnapshot.empty());

    @Value("${agent.knowledge.enabled:true}")
    private boolean enabled;

    @Value("${agent.knowledge.path:./knowledge-vault/wiki}")
    private String configuredRoot;

    @PostConstruct
    public void initialize() {
        sync();
    }

    @Scheduled(fixedDelayString = "${agent.knowledge.refresh-ms:60000}")
    public void scheduledSync() {
        if (enabled) sync();
    }

    public synchronized KnowledgeStatusDTO sync() {
        Instant startedAt = Instant.now();
        if (!enabled) {
            IndexSnapshot disabled = IndexSnapshot.disabled(configuredRoot, startedAt);
            snapshot.set(disabled);
            return disabled.toStatus();
        }

        Path root = Path.of(configuredRoot).toAbsolutePath().normalize();
        List<String> errors = new ArrayList<>();
        if (!Files.isDirectory(root, LinkOption.NOFOLLOW_LINKS)) {
            errors.add("Knowledge root does not exist or is not a directory: " + root);
            IndexSnapshot unavailable = IndexSnapshot.unavailable(root.toString(), startedAt, errors);
            snapshot.set(unavailable);
            log.warn("Knowledge index unavailable: {}", root);
            return unavailable.toStatus();
        }

        IndexSnapshot previous = snapshot.get();
        Map<String, KnowledgeDocument> previousByPath = previous.documentsByPath();
        Map<String, KnowledgeDocument> documents = new LinkedHashMap<>();
        int reused = 0;
        int parsed = 0;

        try {
            Path realRoot = root.toRealPath();
            try (Stream<Path> stream = Files.walk(realRoot)) {
                List<Path> markdownFiles = stream
                        .filter(path -> Files.isRegularFile(path, LinkOption.NOFOLLOW_LINKS))
                        .filter(path -> path.getFileName().toString().toLowerCase(Locale.ROOT).endsWith(".md"))
                        .sorted()
                        .toList();

                for (Path file : markdownFiles) {
                    try {
                        Path realFile = file.toRealPath();
                        if (!realFile.startsWith(realRoot)) {
                            errors.add("Skipped file outside knowledge root: " + file);
                            continue;
                        }
                        String relativePath = realRoot.relativize(realFile).toString().replace('\\', '/');
                        String hash = parser.sha256(realFile);
                        KnowledgeDocument cached = previousByPath.get(relativePath);
                        if (cached != null && cached.hash().equals(hash)) {
                            documents.put(relativePath, cached);
                            reused += 1;
                        } else {
                            documents.put(relativePath, parser.parse(realRoot, realFile, hash));
                            parsed += 1;
                        }
                    } catch (Exception exception) {
                        errors.add(file.getFileName() + ": " + exception.getMessage());
                    }
                }
            }
        } catch (IOException exception) {
            errors.add("Failed to scan knowledge root: " + exception.getMessage());
        }

        long durationMs = Duration.between(startedAt, Instant.now()).toMillis();
        IndexSnapshot updated = IndexSnapshot.of(root.toString(), documents, Instant.now(), durationMs, reused, parsed, errors);
        snapshot.set(updated);
        log.info("Knowledge index synced: documents={}, parsed={}, reused={}, errors={}, duration={}ms",
                documents.size(), parsed, reused, errors.size(), durationMs);
        return updated.toStatus();
    }

    public KnowledgeStatusDTO status() {
        return snapshot.get().toStatus();
    }

    public KnowledgeSearchResponseDTO search(String query, int requestedLimit) {
        String safeQuery = String.valueOf(query == null ? "" : query).trim();
        int limit = Math.max(1, Math.min(requestedLimit, MAX_LIMIT));
        IndexSnapshot current = snapshot.get();
        if (safeQuery.isBlank() || current.documents().isEmpty()) {
            return new KnowledgeSearchResponseDTO(safeQuery, current.documents().size(), List.of(), "");
        }

        List<String> queryTerms = parser.tokenize(safeQuery);
        if (queryTerms.isEmpty()) {
            return new KnowledgeSearchResponseDTO(safeQuery, current.documents().size(), List.of(), "");
        }

        Map<String, Integer> documentFrequency = documentFrequency(current.documents(), queryTerms);
        Map<String, Double> scores = new HashMap<>();
        for (KnowledgeDocument document : current.documents()) {
            double score = lexicalScore(document, safeQuery, queryTerms, documentFrequency, current.documents().size());
            if (score > 0) scores.put(document.path(), score);
        }

        addRelationshipBoosts(current, scores);
        List<KnowledgeSourceDTO> results = scores.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> toSource(current.documentsByPath().get(entry.getKey()), entry.getValue(), queryTerms))
                .toList();
        return new KnowledgeSearchResponseDTO(safeQuery, current.documents().size(), results, buildContext(results));
    }

    private Map<String, Integer> documentFrequency(List<KnowledgeDocument> documents, List<String> terms) {
        Map<String, Integer> frequency = new HashMap<>();
        for (String term : terms) {
            int matches = 0;
            for (KnowledgeDocument document : documents) {
                if (document.termFrequency().containsKey(term)) matches += 1;
            }
            frequency.put(term, matches);
        }
        return frequency;
    }

    private double lexicalScore(
            KnowledgeDocument document,
            String query,
            List<String> terms,
            Map<String, Integer> documentFrequency,
            int documentCount
    ) {
        String normalizedQuery = normalize(query);
        String normalizedTitle = normalize(document.title());
        double score = 0;

        if (!normalizedQuery.isBlank() && normalizedTitle.contains(normalizedQuery)) score += 18;
        if (!normalizedTitle.isBlank() && normalizedQuery.contains(normalizedTitle)) score += 12;

        String metadata = normalize(String.join(" ", document.tags()) + " " + String.join(" ", document.related()));
        for (String term : terms) {
            int tf = document.termFrequency().getOrDefault(term, 0);
            if (tf == 0) continue;
            int df = documentFrequency.getOrDefault(term, 0);
            double idf = Math.log(1.0 + (documentCount - df + 0.5) / (df + 0.5));
            score += idf * ((tf * 2.2) / (tf + 1.2));
            if (normalizedTitle.contains(term)) score += 4.5;
            if (metadata.contains(term)) score += 2.5;
        }
        if ("entity".equalsIgnoreCase(document.type()) || "concept".equalsIgnoreCase(document.type())) {
            score *= 1.08;
        }
        return score;
    }

    private void addRelationshipBoosts(IndexSnapshot current, Map<String, Double> scores) {
        Set<String> initialMatches = new HashSet<>(scores.keySet());
        for (String path : initialMatches) {
            KnowledgeDocument source = current.documentsByPath().get(path);
            double sourceScore = scores.getOrDefault(path, 0.0);
            if (source == null || sourceScore <= 0) continue;
            for (String link : source.links()) {
                KnowledgeDocument related = current.documentsByTitle().get(normalize(link));
                if (related != null) {
                    scores.merge(related.path(), sourceScore * 0.08, Double::sum);
                }
            }
        }
    }

    private KnowledgeSourceDTO toSource(KnowledgeDocument document, double score, List<String> queryTerms) {
        return new KnowledgeSourceDTO(
                document.path(),
                document.title(),
                document.type(),
                document.status(),
                document.tags(),
                document.related(),
                document.sources(),
                excerpt(document.plainText(), queryTerms),
                clip(document.markdown(), MAX_DOCUMENT_CONTEXT_CHARS),
                Math.round(score * 1000.0) / 1000.0
        );
    }

    private String excerpt(String text, List<String> queryTerms) {
        if (text == null || text.isBlank()) return "";
        int matchIndex = -1;
        String lower = text.toLowerCase(Locale.ROOT);
        for (String term : queryTerms) {
            int index = lower.indexOf(term.toLowerCase(Locale.ROOT));
            if (index >= 0 && (matchIndex < 0 || index < matchIndex)) matchIndex = index;
        }
        int start = matchIndex < 0 ? 0 : Math.max(0, matchIndex - 70);
        int end = Math.min(text.length(), start + 280);
        return (start > 0 ? "…" : "") + text.substring(start, end).trim() + (end < text.length() ? "…" : "");
    }

    private String buildContext(List<KnowledgeSourceDTO> results) {
        StringBuilder context = new StringBuilder();
        for (int index = 0; index < results.size(); index++) {
            KnowledgeSourceDTO source = results.get(index);
            String block = "[来源" + (index + 1) + "] " + source.title() + " (" + source.path() + ")\n" + source.content();
            if (context.length() + block.length() > MAX_CONTEXT_CHARS) break;
            if (!context.isEmpty()) context.append("\n\n");
            context.append(block);
        }
        return context.toString();
    }

    private String clip(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) return value == null ? "" : value;
        return value.substring(0, maxLength) + "…";
    }

    private String normalize(String value) {
        return String.valueOf(value == null ? "" : value)
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^\\p{IsHan}a-z0-9]", "");
    }

    private record IndexSnapshot(
            boolean enabled,
            boolean available,
            String root,
            List<KnowledgeDocument> documents,
            Map<String, KnowledgeDocument> documentsByPath,
            Map<String, KnowledgeDocument> documentsByTitle,
            Instant lastSyncAt,
            long lastSyncDurationMs,
            int reusedDocuments,
            int parsedDocuments,
            List<String> errors
    ) {
        static IndexSnapshot empty() {
            return new IndexSnapshot(true, false, "", List.of(), Map.of(), Map.of(), null, 0, 0, 0, List.of());
        }

        static IndexSnapshot disabled(String root, Instant syncAt) {
            return new IndexSnapshot(false, false, root, List.of(), Map.of(), Map.of(), syncAt, 0, 0, 0, List.of());
        }

        static IndexSnapshot unavailable(String root, Instant syncAt, List<String> errors) {
            return new IndexSnapshot(true, false, root, List.of(), Map.of(), Map.of(), syncAt, 0, 0, 0, List.copyOf(errors));
        }

        static IndexSnapshot of(
                String root,
                Map<String, KnowledgeDocument> documentsByPath,
                Instant syncAt,
                long durationMs,
                int reused,
                int parsed,
                List<String> errors
        ) {
            List<KnowledgeDocument> documents = List.copyOf(documentsByPath.values());
            Map<String, KnowledgeDocument> byTitle = new HashMap<>();
            for (KnowledgeDocument document : documents) {
                byTitle.put(normalizeKey(document.title()), document);
                String fileName = Path.of(document.path()).getFileName().toString().replaceFirst("\\.md$", "");
                byTitle.putIfAbsent(normalizeKey(fileName), document);
            }
            return new IndexSnapshot(
                    true,
                    !documents.isEmpty(),
                    root,
                    documents,
                    Map.copyOf(documentsByPath),
                    Map.copyOf(byTitle),
                    syncAt,
                    durationMs,
                    reused,
                    parsed,
                    List.copyOf(errors)
            );
        }

        KnowledgeStatusDTO toStatus() {
            return new KnowledgeStatusDTO(
                    enabled,
                    available,
                    root,
                    documents.size(),
                    lastSyncAt,
                    lastSyncDurationMs,
                    reusedDocuments,
                    parsedDocuments,
                    errors
            );
        }

        private static String normalizeKey(String value) {
            return String.valueOf(value == null ? "" : value)
                    .toLowerCase(Locale.ROOT)
                    .replaceAll("[^\\p{IsHan}a-z0-9]", "");
        }
    }
}
