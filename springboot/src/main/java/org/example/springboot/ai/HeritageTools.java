package org.example.springboot.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;

/**
 * 三星堆数字展馆工具函数。
 *
 * 当前使用内置展陈资料，后续可替换为文物数据库、知识图谱或检索服务。
 */
@Slf4j
@Component
public class HeritageTools {

    private record ArtifactInfo(String name, List<String> aliases, String category, String summary, String interpretation) {
    }

    private record SiteInfo(String name, List<String> aliases, String summary, String interpretation) {
    }

    private record ThemeInfo(String name, List<String> aliases, String summary) {
    }

    private static final List<ArtifactInfo> ARTIFACTS = List.of(
            new ArtifactInfo(
                    "青铜纵目面具",
                    List.of("青铜面具", "纵目面具", "面具", "大面具"),
                    "青铜器",
                    "青铜纵目面具以夸张外凸的双眼、宽阔面部和庄严神态著称，是三星堆最具辨识度的视觉符号之一。",
                    "它通常被理解为古蜀人神灵崇拜、祭祀仪式和权力象征的集中表达。关于其具体身份仍有讨论空间，讲解时应避免把推测说成定论。"
            ),
            new ArtifactInfo(
                    "青铜大立人像",
                    List.of("大立人", "立人像", "青铜人像", "祭司"),
                    "青铜器",
                    "青铜大立人像体量高大、姿态庄重，人物双手呈特殊握持姿势，具有强烈的仪式感。",
                    "它可能表现掌握祭祀权力的人物、首领或神圣身份的象征，是理解古蜀礼仪秩序和权力结构的重要文物。"
            ),
            new ArtifactInfo(
                    "青铜神树",
                    List.of("神树", "通天树", "扶桑树", "铜树"),
                    "青铜器",
                    "青铜神树由树干、枝叶、鸟形装饰等元素构成，展现出超越日常尺度的神圣空间想象。",
                    "它常被联系到太阳崇拜、天地沟通和古蜀宇宙观，适合在数字展馆中作为“连接天地、人神与祭祀空间”的核心展项讲解。"
            ),
            new ArtifactInfo(
                    "黄金面具",
                    List.of("金面具", "黄金面罩", "金器"),
                    "金器",
                    "黄金面具以金色材质强化神圣、尊贵与仪式权威，是三星堆金器系统中的代表性文物。",
                    "金器与青铜器共同构成古蜀文明的视觉权力系统，说明祭祀场景中材质本身也承担象征意义。"
            ),
            new ArtifactInfo(
                    "金杖",
                    List.of("黄金杖", "权杖", "金杖"),
                    "金器",
                    "金杖通常被视为三星堆权力象征的重要文物，其图像纹样和器物形态具有明显的仪式属性。",
                    "它可以从王权、神权和族群象征三个角度讲解，但其确切用途仍需结合考古语境谨慎说明。"
            ),
            new ArtifactInfo(
                    "玉璋",
                    List.of("玉器", "玉礼器", "礼器"),
                    "玉器",
                    "玉璋等玉器在三星堆文化中具有礼仪属性，显示古蜀文明并非只有青铜崇拜，也存在成熟的礼器系统。",
                    "它们常与祭祀、身份等级和礼仪表达相关，可用于说明三星堆与更广阔中华文明礼制传统之间的联系。"
            ),
            new ArtifactInfo(
                    "象牙",
                    List.of("象牙", "海贝", "珍贵资源", "贸易"),
                    "有机质与交换物",
                    "三星堆祭祀坑中发现大量象牙等珍贵材料，提示古蜀社会拥有复杂资源动员能力。",
                    "象牙、海贝等材料可用于解释古蜀文明与外部区域交流、礼仪财富和祭祀献纳之间的关系。"
            )
    );

    private static final List<SiteInfo> SITES = List.of(
            new SiteInfo(
                    "三星堆遗址",
                    List.of("遗址", "三星堆", "古蜀遗址", "广汉"),
                    "三星堆遗址位于四川广汉，是古蜀文明的重要遗址，展现了长江上游地区高度发达的青铜文明。",
                    "讲解时可从城址格局、祭祀坑、手工业、区域交流四个角度展开，突出其在中华文明多元一体格局中的价值。"
            ),
            new SiteInfo(
                    "祭祀坑",
                    List.of("祭祀坑", "器物坑", "坑", "埋藏坑"),
                    "祭祀坑集中出土青铜器、金器、玉器、象牙等大量文物，是理解三星堆礼仪活动和社会结构的关键线索。",
                    "这些器物多呈破碎、焚烧或特殊埋藏状态，通常被解释为大型祭祀活动后的遗存，但具体仪式过程仍存在研究空间。"
            ),
            new SiteInfo(
                    "古城空间",
                    List.of("城址", "古城", "城墙", "城市"),
                    "三星堆古城空间反映了古蜀社会的聚落组织、公共活动和权力中心形态。",
                    "数字展馆可通过遗址复原、空间漫游和分层地图，把观众从单件文物引导到完整文明场景。"
            )
    );

    private static final List<ThemeInfo> THEMES = List.of(
            new ThemeInfo(
                    "青铜文明",
                    List.of("青铜", "青铜器", "铜器"),
                    "三星堆青铜器以尺度巨大、造型奇特、图像系统复杂著称，是古蜀文明最具冲击力的物质表达。"
            ),
            new ThemeInfo(
                    "黄金与权力",
                    List.of("黄金", "金器", "权力", "王权"),
                    "黄金材质在三星堆中常与神圣身份、仪式权威和权力象征相关，适合与青铜面具、金杖等展项联合讲解。"
            ),
            new ThemeInfo(
                    "太阳崇拜与神鸟意象",
                    List.of("太阳", "神鸟", "鸟", "太阳崇拜"),
                    "鸟与太阳意象可能与古蜀人的天地观、神灵交通和祭祀秩序有关，是理解青铜神树的重要线索。"
            ),
            new ThemeInfo(
                    "古蜀宇宙观",
                    List.of("宇宙观", "天地", "人神", "通天"),
                    "古蜀宇宙观可从青铜神树、面具、祭祀坑和神鸟意象共同理解：它们构成了连接天地、人神与权力秩序的视觉系统。"
            ),
            new ThemeInfo(
                    "数字展陈",
                    List.of("数字展馆", "数字化", "3d", "三维", "互动"),
                    "数字展陈通过三维复原、沉浸式空间、知识图谱和互动问答，将静态文物转化为可探索的文明叙事。"
            )
    );

    @Tool(
            name = "searchSanxingduiArtifacts",
            description = "查询三星堆代表性文物，如青铜面具、青铜神树、黄金面具、青铜大立人、金杖、玉璋、象牙等。",
            returnDirect = false
    )
    public String searchSanxingduiArtifacts(
            @ToolParam(description = "文物关键词，例如青铜面具、神树、黄金面具、大立人、玉器") String keyword
    ) {
        log.info("AI工具调用: 查询三星堆文物, keyword={}", keyword);
        String normalized = normalize(keyword);

        List<ArtifactInfo> matches = ARTIFACTS.stream()
                .filter(item -> matches(item.name(), item.aliases(), normalized))
                .toList();

        if (matches.isEmpty()) {
            return "暂未在内置文物资料中找到与“" + keyword + "”直接匹配的展项。可尝试输入：青铜面具、青铜神树、黄金面具、青铜大立人、金杖、玉璋。";
        }

        StringBuilder result = new StringBuilder("查询到以下三星堆代表性文物：\n\n");
        for (ArtifactInfo item : matches) {
            result.append("## ").append(item.name()).append("\n");
            result.append("- 类型：").append(item.category()).append("\n");
            result.append("- 展项概述：").append(item.summary()).append("\n");
            result.append("- 讲解重点：").append(item.interpretation()).append("\n\n");
        }
        return result.toString();
    }

    @Tool(
            name = "getSanxingduiSiteInfo",
            description = "查询三星堆遗址、祭祀坑、古城空间等遗址信息。",
            returnDirect = false
    )
    public String getSanxingduiSiteInfo(
            @ToolParam(description = "遗址空间关键词，例如三星堆遗址、祭祀坑、古城、城址") String keyword
    ) {
        log.info("AI工具调用: 查询三星堆遗址信息, keyword={}", keyword);
        String normalized = normalize(keyword);

        List<SiteInfo> matches = SITES.stream()
                .filter(item -> matches(item.name(), item.aliases(), normalized))
                .toList();

        if (matches.isEmpty()) {
            return "暂未找到与“" + keyword + "”直接匹配的遗址空间资料。可尝试输入：三星堆遗址、祭祀坑、古城空间。";
        }

        StringBuilder result = new StringBuilder("三星堆遗址空间资料：\n\n");
        for (SiteInfo item : matches) {
            result.append("## ").append(item.name()).append("\n");
            result.append("- 概述：").append(item.summary()).append("\n");
            result.append("- 展陈解读：").append(item.interpretation()).append("\n\n");
        }
        return result.toString();
    }

    @Tool(
            name = "getExhibitionRoute",
            description = "根据主题推荐三星堆数字展馆参观路线，例如入门路线、青铜主题、祭祀主题、数字沉浸路线。",
            returnDirect = false
    )
    public String getExhibitionRoute(
            @ToolParam(description = "参观主题，例如入门、青铜、祭祀、神树、数字展馆") String theme
    ) {
        log.info("AI工具调用: 推荐三星堆展陈路线, theme={}", theme);
        String normalized = normalize(theme);

        if (containsAny(normalized, "青铜", "面具", "大立人")) {
            return """
                    推荐“青铜文明”参观路线：
                    1. 青铜纵目面具：先建立三星堆最具辨识度的视觉印象。
                    2. 青铜大立人像：理解祭祀人物、权力和仪式姿态。
                    3. 青铜神树：进入古蜀宇宙观与通天想象。
                    4. 祭祀坑复原区：把单件文物放回仪式场景中理解。
                    """;
        }

        if (containsAny(normalized, "祭祀", "坑", "仪式")) {
            return """
                    推荐“祭祀空间”参观路线：
                    1. 祭祀坑数字复原：先理解文物出土语境。
                    2. 黄金面具与金杖：观察神圣身份和权力符号。
                    3. 玉璋与象牙：理解礼器、献纳和资源动员。
                    4. 青铜神树：把祭祀活动延伸到天地、人神沟通的叙事。
                    """;
        }

        if (containsAny(normalized, "数字", "3d", "三维", "沉浸")) {
            return """
                    推荐“数字沉浸”参观路线：
                    1. 遗址全景导览：先了解三星堆所处空间。
                    2. 青铜面具三维细看：观察眼部、耳部和面部造型。
                    3. 青铜神树结构拆解：理解枝干、鸟形与通天意象。
                    4. 知识图谱问答：围绕文物、祭祀坑、古蜀文明继续追问。
                    """;
        }

        return """
                推荐“三星堆入门”参观路线：
                1. 三星堆遗址概览：先建立古蜀文明背景。
                2. 青铜纵目面具：认识三星堆最强烈的视觉符号。
                3. 黄金面具与金杖：理解神圣身份和权力象征。
                4. 青铜神树：进入古蜀宇宙观和祭祀想象。
                5. 祭祀坑复原区：把文物放回考古语境中理解。
                """;
    }

    @Tool(
            name = "searchSanxingduiTheme",
            description = "查询三星堆主题解释，如青铜文明、黄金与权力、太阳崇拜、古蜀宇宙观、数字展陈等。",
            returnDirect = false
    )
    public String searchSanxingduiTheme(
            @ToolParam(description = "主题关键词，例如青铜、黄金、太阳、宇宙观、数字展馆") String keyword
    ) {
        log.info("AI工具调用: 查询三星堆主题, keyword={}", keyword);
        String normalized = normalize(keyword);

        List<ThemeInfo> matches = THEMES.stream()
                .filter(item -> matches(item.name(), item.aliases(), normalized))
                .toList();

        if (matches.isEmpty()) {
            return "暂未找到与“" + keyword + "”直接匹配的主题资料。可尝试输入：青铜文明、黄金与权力、太阳崇拜、古蜀宇宙观、数字展陈。";
        }

        StringBuilder result = new StringBuilder("三星堆主题解释：\n\n");
        for (ThemeInfo item : matches) {
            result.append("## ").append(item.name()).append("\n");
            result.append(item.summary()).append("\n\n");
        }
        return result.toString();
    }

    private boolean matches(String name, List<String> aliases, String keyword) {
        if (keyword.isBlank()) {
            return true;
        }

        if (normalize(name).contains(keyword) || keyword.contains(normalize(name))) {
            return true;
        }

        return aliases.stream()
                .map(this::normalize)
                .anyMatch(alias -> alias.contains(keyword) || keyword.contains(alias));
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(normalize(keyword))) {
                return true;
            }
        }
        return false;
    }

    private String normalize(String value) {
        return String.valueOf(value == null ? "" : value)
                .trim()
                .toLowerCase(Locale.ROOT);
    }
}
