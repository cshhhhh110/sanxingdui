package org.example.springboot.service;

import org.example.springboot.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GenerationContentSafetyServiceTest {
    private GenerationContentSafetyService service() {
        GenerationContentSafetyService service = new GenerationContentSafetyService();
        ReflectionTestUtils.setField(service, "blockedTerms", "");
        return service;
    }

    @Test
    void allowsNormalMuseumPrompt() {
        assertThatCode(() -> service().validate("三星堆青铜面具博物馆展陈海报")).doesNotThrowAnyException();
    }

    @Test
    void blocksConfiguredUnsafeTermEvenWithSpaces() {
        assertThatThrownBy(() -> service().validate("\u8bf7\u6559\u6211\u5236\u4f5c \u70b8\u5f39"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("不支持的内容");
    }
}
