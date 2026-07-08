package org.example.springboot.knowledge;

import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class KnowledgeMarkdownParser {

    private static final Pattern WIKILINK = Pattern.compile("\\[\\[([^]#|]+)(?:#[^]|]+)?(?:\\|([^]]+))?]]");
    private static final Pattern HEADING = Pattern.compile("(?m)^#{1,6}\\s+(.+?)\\s*$");
    private static final Pattern HAN_RUN = Pattern.compile("[\\p{IsHan}]+");
    private static final Pattern WORD = Pattern.compile("[a-z0-9][a-z0-9_-]{1,}");

    public KnowledgeDocument parse(Path root, Path file, String hash) throws IOException {
        String raw = Files.readString(file, StandardCharsets.UTF_8).replace("\r\n", "\n");
        ParsedFrontmatter frontmatter = parseFrontmatter(raw);
        String markdown = frontmatter.body().trim();
        String relativePath = root.relativize(file).toString().replace('\\', '/');
        String title = firstValue(frontmatter.values(), "title");
        if (title.isBlank()) {
            Matcher heading = HEADING.matcher(markdown);
            title = heading.find() ? heading.group(1).trim() : stripExtension(file.getFileName().toString());
        }

        List<String> tags = listValue(frontmatter.values(), "tags");
        List<String> related = listValue(frontmatter.values(), "related");
        List<String> sources = listValue(frontmatter.values(), "sources");
        Set<String> links = new LinkedHashSet<>();
        Matcher linkMatcher = WIKILINK.matcher(markdown + "\n" + String.join(" ", related));
        while (linkMatcher.find()) {
            links.add(linkMatcher.group(1).trim());
        }

        String plainText = toPlainText(markdown);
        FileTime modified = Files.getLastModifiedTime(file);
        return new KnowledgeDocument(
                relativePath,
                title,
                firstValue(frontmatter.values(), "type"),
                firstValue(frontmatter.values(), "status"),
                List.copyOf(tags),
                List.copyOf(related),
                List.copyOf(sources),
                List.copyOf(links),
                markdown,
                plainText,
                hash,
                modified.toInstant(),
                termFrequency(title + " " + String.join(" ", tags) + " " + plainText)
        );
    }

    public String sha256(Path file) throws IOException {
        try {
            byte[] bytes = Files.readAllBytes(file);
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(bytes);
            StringBuilder output = new StringBuilder(digest.length * 2);
            for (byte value : digest) {
                output.append(String.format("%02x", value));
            }
            return output.toString();
        } catch (java.security.NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    public List<String> tokenize(String input) {
        String normalized = String.valueOf(input == null ? "" : input).toLowerCase(Locale.ROOT);
        Set<String> tokens = new LinkedHashSet<>();

        Matcher hanMatcher = HAN_RUN.matcher(normalized);
        while (hanMatcher.find()) {
            String run = hanMatcher.group();
            if (run.length() == 1) {
                tokens.add(run);
            } else {
                for (int index = 0; index < run.length() - 1; index++) {
                    tokens.add(run.substring(index, index + 2));
                }
                if (run.length() <= 8) {
                    tokens.add(run);
                }
            }
        }

        Matcher wordMatcher = WORD.matcher(normalized);
        while (wordMatcher.find()) {
            tokens.add(wordMatcher.group());
        }
        return List.copyOf(tokens);
    }

    private Map<String, Integer> termFrequency(String input) {
        Map<String, Integer> frequency = new LinkedHashMap<>();
        for (String token : tokenize(input)) {
            frequency.merge(token, 1, Integer::sum);
        }
        return Map.copyOf(frequency);
    }

    private ParsedFrontmatter parseFrontmatter(String raw) {
        if (!raw.startsWith("---\n")) {
            return new ParsedFrontmatter(Map.of(), raw);
        }
        int end = raw.indexOf("\n---\n", 4);
        if (end < 0) {
            return new ParsedFrontmatter(Map.of(), raw);
        }

        Map<String, String> values = new LinkedHashMap<>();
        for (String line : raw.substring(4, end).split("\n")) {
            int separator = line.indexOf(':');
            if (separator <= 0 || Character.isWhitespace(line.charAt(0))) continue;
            String key = line.substring(0, separator).trim().toLowerCase(Locale.ROOT);
            String value = line.substring(separator + 1).trim();
            values.put(key, value);
        }
        return new ParsedFrontmatter(Map.copyOf(values), raw.substring(end + 5));
    }

    private String firstValue(Map<String, String> values, String key) {
        return stripQuotes(values.getOrDefault(key, "").trim());
    }

    private List<String> listValue(Map<String, String> values, String key) {
        String raw = values.getOrDefault(key, "").trim();
        if (raw.isBlank()) return List.of();

        Set<String> output = new LinkedHashSet<>();
        Matcher links = WIKILINK.matcher(raw);
        while (links.find()) {
            output.add(links.group(1).trim());
        }
        String withoutLinks = links.reset().replaceAll("");
        Arrays.stream(withoutLinks.replaceAll("^[\\[]|[]]$", "").split(","))
                .map(String::trim)
                .map(this::stripQuotes)
                .filter(value -> !value.isBlank())
                .forEach(output::add);
        return new ArrayList<>(output);
    }

    private String toPlainText(String markdown) {
        String text = WIKILINK.matcher(markdown).replaceAll(matchResult -> {
            String alias = matchResult.group(2);
            return alias == null || alias.isBlank() ? matchResult.group(1) : alias;
        });
        return text
                .replaceAll("(?m)^#{1,6}\\s+", "")
                .replaceAll("(?m)^>\\s*\\[![^]]+]\\s*", "")
                .replaceAll("(?m)^[>*_`~-]+\\s*", "")
                .replaceAll("!\\[[^]]*]\\([^)]*\\)", "")
                .replaceAll("\\[([^]]+)]\\([^)]*\\)", "$1")
                .replaceAll("<[^>]+>", " ")
                .replaceAll("[ \\t]+", " ")
                .replaceAll("\\n{3,}", "\n\n")
                .trim();
    }

    private String stripExtension(String fileName) {
        int dot = fileName.lastIndexOf('.');
        return dot > 0 ? fileName.substring(0, dot) : fileName;
    }

    private String stripQuotes(String value) {
        if (value.length() >= 2 && ((value.startsWith("\"") && value.endsWith("\""))
                || (value.startsWith("'") && value.endsWith("'")))) {
            return value.substring(1, value.length() - 1);
        }
        return value;
    }

    private record ParsedFrontmatter(Map<String, String> values, String body) {
    }
}
