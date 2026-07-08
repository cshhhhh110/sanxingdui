package org.example.springboot.knowledge;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class KnowledgeIndexServiceTest {

    @TempDir
    Path tempDir;

    @Test
    void parsesSearchesAndIncrementallyRefreshesVault() throws Exception {
        Path artifacts = Files.createDirectories(tempDir.resolve("entities/artifacts"));
        Path concepts = Files.createDirectories(tempDir.resolve("concepts/technology"));
        Path tree = artifacts.resolve("青铜神树.md");
        Path casting = concepts.resolve("分铸法.md");

        Files.writeString(tree, """
                ---
                type: entity
                title: "青铜神树"
                tags: [三星堆, 青铜器, 铸造]
                status: mature
                related: ["[[分铸法]]"]
                sources: ["[[青铜神树研究]]"]
                ---
                # 青铜神树
                青铜神树采用分段铸造，再将部件连接成整体，与古蜀祭祀和宇宙树观念有关。
                相关工艺见 [[分铸法]]。
                """, StandardCharsets.UTF_8);
        Files.writeString(casting, """
                ---
                type: concept
                title: "分铸法"
                tags: [青铜工艺]
                status: mature
                related: ["[[青铜神树]]"]
                ---
                # 分铸法
                分铸法是将复杂器物分成多个部件铸造，再连接组合的青铜工艺。
                """, StandardCharsets.UTF_8);

        KnowledgeIndexService service = new KnowledgeIndexService(new KnowledgeMarkdownParser());
        ReflectionTestUtils.setField(service, "enabled", true);
        ReflectionTestUtils.setField(service, "configuredRoot", tempDir.toString());

        KnowledgeStatusDTO firstSync = service.sync();
        assertThat(firstSync.available()).isTrue();
        assertThat(firstSync.indexedDocuments()).isEqualTo(2);
        assertThat(firstSync.parsedDocuments()).isEqualTo(2);

        KnowledgeSearchResponseDTO result = service.search("青铜神树使用了什么铸造工艺", 2);
        assertThat(result.documents()).isNotEmpty();
        assertThat(result.documents().get(0).title()).isEqualTo("青铜神树");
        assertThat(result.documents().get(0).related()).contains("分铸法");
        assertThat(result.documents().get(0).sources()).contains("青铜神树研究");
        assertThat(result.context()).contains("[来源1]", "分段铸造");

        KnowledgeStatusDTO unchangedSync = service.sync();
        assertThat(unchangedSync.reusedDocuments()).isEqualTo(2);
        assertThat(unchangedSync.parsedDocuments()).isZero();

        Files.writeString(casting, "\n补充：大型器物常需要多次铸造。", StandardCharsets.UTF_8,
                java.nio.file.StandardOpenOption.APPEND);
        KnowledgeStatusDTO changedSync = service.sync();
        assertThat(changedSync.reusedDocuments()).isEqualTo(1);
        assertThat(changedSync.parsedDocuments()).isEqualTo(1);
    }
}
