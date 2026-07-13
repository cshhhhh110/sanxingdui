package org.example.springboot.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GenerationPromptServiceTest {
    private final GenerationPromptService service = new GenerationPromptService();

    @Test
    void enhancesImagePromptWithoutLosingOriginalText() {
        String result = service.enhance("三星堆青铜面具", "MUSEUM_POSTER", "IMAGE");

        assertThat(result)
                .startsWith("三星堆青铜面具")
                .contains("博物馆展览海报")
                .contains("无乱码和畸变");
    }

    @Test
    void addsMotionQualityRulesForVideo() {
        String result = service.enhance("青铜神树逐渐显现", null, "VIDEO");

        assertThat(result).contains("画面稳定").contains("无闪烁和畸变");
    }
}
