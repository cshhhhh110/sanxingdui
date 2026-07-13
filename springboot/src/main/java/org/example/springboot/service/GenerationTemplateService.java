package org.example.springboot.service;

import org.example.springboot.dto.response.MediaGenerationTemplateVO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GenerationTemplateService {
    public List<MediaGenerationTemplateVO> list() {
        return List.of(
                new MediaGenerationTemplateVO("artifact-poster", "文物展览海报", "IMAGE", "MUSEUM_POSTER",
                        "以{文物名称}为主体，博物馆展览海报构图，深色展陈背景，柔和轮廓光，主体完整，不包含文字",
                        "文字，水印，低清晰度，主体变形"),
                new MediaGenerationTemplateVO("artifact-restore", "文物想象复原", "IMAGE", "ARTIFACT_RESTORE",
                        "以{文物名称}为依据进行古蜀时期使用场景的AI想象复原，材质和纹饰准确，画面写实",
                        "现代建筑，文字，水印，错误纹饰"),
                new MediaGenerationTemplateVO("museum-motion", "展厅镜头推进", "VIDEO", null,
                        "{文物名称}陈列在安静的博物馆展厅中，镜头缓慢推进，灯光轻微变化，主体保持稳定",
                        "画面抖动，主体变形，闪烁，文字，水印"),
                new MediaGenerationTemplateVO("artifact-i2v", "文物图片动效", "VIDEO", null,
                        "保持参考图中的文物主体和造型稳定，镜头缓慢推进，背景光线自然流动",
                        "主体变形，闪烁，画面抖动，文字，水印")
        );
    }
}
