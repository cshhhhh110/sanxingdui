package org.example.springboot.config;

import lombok.Data;
import org.example.springboot.enums.MediaGenerationProfile;
import org.example.springboot.exception.BusinessException;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Data
@Component
@ConfigurationProperties(prefix = "media-generation.image")
public class ImageGenerationProfileProperties {
    private String defaultProfile = "FAST";
    private Map<String, Profile> profiles = new LinkedHashMap<>();

    public ResolvedProfile resolve(String requestedProfile, String aspectRatio) {
        MediaGenerationProfile profile = MediaGenerationProfile.from(requestedProfile, defaultProfile);
        Profile settings = profiles.get(profile.name().toLowerCase(Locale.ROOT));
        if (settings == null || settings.getModel() == null || settings.getModel().isBlank()) {
            throw new BusinessException("图片生成模式未配置: " + profile.name());
        }
        String size = settings.getSizes().get(aspectRatio);
        if (size == null || size.isBlank()) {
            throw new BusinessException("当前生成模式未配置画面比例: " + aspectRatio);
        }
        return new ResolvedProfile(profile.name(), settings.getModel().trim(), size.trim());
    }

    @Data
    public static class Profile {
        private String model;
        private Map<String, String> sizes = new LinkedHashMap<>();
    }

    public record ResolvedProfile(String name, String model, String imageSize) { }
}
