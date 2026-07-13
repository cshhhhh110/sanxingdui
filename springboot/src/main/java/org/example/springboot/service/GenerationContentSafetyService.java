package org.example.springboot.service;

import org.example.springboot.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Stream;

@Service
public class GenerationContentSafetyService {
    private static final List<String> BUILT_IN_BLOCKED_TERMS = List.of(
            "\u513f\u7ae5\u8272\u60c5",
            "\u5236\u4f5c\u70b8\u5f39",
            "\u6050\u6016\u4e3b\u4e49\u5ba3\u4f20",
            "\u4ec7\u6068\u717d\u52a8"
    );

    @Value("${media-generation.safety.blocked-terms:儿童色情,制作炸弹,恐怖主义宣传,仇恨煽动}")
    private String blockedTerms;

    public void validate(String prompt) {
        if (prompt == null || prompt.isBlank()) throw new BusinessException("创作描述不能为空");
        String normalized = prompt.replaceAll("\\s+", "").toLowerCase();
        List<String> terms = Stream.concat(
                        BUILT_IN_BLOCKED_TERMS.stream(),
                        Arrays.stream(blockedTerms == null ? new String[0] : blockedTerms.split(",")))
                .map(String::trim)
                .filter(term -> !term.isEmpty())
                .distinct()
                .toList();
        if (terms.stream().anyMatch(term -> normalized.contains(term.toLowerCase()))) {
            throw new BusinessException("创作描述包含不支持的内容，请调整后重试");
        }
    }
}
