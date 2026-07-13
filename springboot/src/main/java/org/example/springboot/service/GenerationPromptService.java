package org.example.springboot.service;

import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class GenerationPromptService {
    private static final Map<String, String> STYLE_HINTS = Map.of(
            "ARTIFACT_RESTORE", "考古复原表达，尊重文物材质、比例和纹饰，标注为AI想象复原",
            "MUSEUM_POSTER", "专业博物馆展览海报构图，主体清晰，留出克制的信息排版空间",
            "CULTURAL_IP", "现代文化IP设计，保留古蜀辨识特征，形象友好且适合传播",
            "INK_STYLE", "中国水墨艺术风格，墨色层次清晰，构图含蓄",
            "THREE_D_SCENE", "高质量三维场景概念图，材质真实，展陈灯光准确",
            "EDUCATION_CARD", "文博科普卡片视觉，信息层次清楚，主体便于识别"
    );

    public String enhance(String prompt, String style, String mediaType) {
        String clean = prompt == null ? "" : prompt.trim();
        String hint = style == null
                ? "突出三星堆与古蜀文化特征，主体清晰，细节准确"
                : STYLE_HINTS.getOrDefault(style, "突出三星堆与古蜀文化特征，主体清晰，细节准确");
        String quality = "VIDEO".equals(mediaType)
                ? "画面稳定，主体一致，运动自然，无闪烁和畸变"
                : "高细节，光影自然，画面完整，无乱码和畸变";
        return clean + "。创作要求：" + hint + "；" + quality + "。";
    }
}
