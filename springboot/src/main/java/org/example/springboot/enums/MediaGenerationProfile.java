package org.example.springboot.enums;

import org.example.springboot.exception.BusinessException;

import java.util.Locale;

public enum MediaGenerationProfile {
    FAST,
    QUALITY;

    public static MediaGenerationProfile from(String value, String defaultValue) {
        String candidate = value == null || value.isBlank() ? defaultValue : value;
        try {
            return valueOf(candidate.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ignored) {
            throw new BusinessException("不支持的图片生成模式");
        }
    }
}
