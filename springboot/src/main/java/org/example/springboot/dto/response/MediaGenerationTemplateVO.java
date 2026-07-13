package org.example.springboot.dto.response;

public record MediaGenerationTemplateVO(
        String code,
        String name,
        String mediaType,
        String style,
        String promptTemplate,
        String negativePrompt
) {}
